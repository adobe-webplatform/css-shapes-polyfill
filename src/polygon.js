/*
Copyright 2014 Adobe Systems Inc.;
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

/* Returns > 0 if the slope of the line through origin and endPoint2 is greater than the slope through 
 * origin and endPoint1. Returns 0 if they have the same slope, negative otherwise.
 */
function compareLineSlopes(origin, endPoint1, endPoint2) {
    return ((endPoint2.x - origin.x) * (endPoint1.y - origin.y)) - ((endPoint1.x - origin.x) * (endPoint2.y - origin.y));
}

function areCollinearPoints(p0, p1, p2) {
    return Math.abs(compareLineSlopes(p0, p1, p2)) < 350;  // FIXME: threshold is a hack and it's wrong
}

function areCoincidentPoints(p0, p1) { 
    return p0.x == p1.x && p0.y == p1.y;
}

function isPointOnLineSegment(lineStartPoint, lineEndPoint, point)
{
    return point.x >= Math.min(lineStartPoint.x, lineEndPoint.x) &&
        point.x <= Math.max(lineStartPoint.x, lineEndPoint.x) &&
        areCollinearPoints(lineStartPoint, lineEndPoint, point);
}

/* Parent class for different edge types, child classes will need to call init
 * to initialize the appropriate member variables */
function PolygonEdge() {
}

PolygonEdge.prototype.init = function(polygon, vertex1, vertex2) {
    this.polygon = polygon;
    this.vertex1 = vertex1;
    this.vertex2 = vertex2;
    this.minX = Math.min(this.vertex1.x, this.vertex2.x);
    this.maxX = Math.max(this.vertex1.x, this.vertex2.x);
};

PolygonEdge.prototype.containsPoint = function(point) {
    return isPointOnLineSegment(this.vertex1, this.vertex2, point);
};

PolygonEdge.prototype.overlapsYRange = function(y1, y2) { // y range: y1 <= y <= y2
    var edgeY1 = this.vertex1.y;
    var edgeY2 = this.vertex2.y;
    return y2 >= Math.min(edgeY1, edgeY2) && y1 <= Math.max(edgeY1, edgeY2);
};

PolygonEdge.prototype.isWithinYRange = function(y1, y2) { // y range: y1 <= y <= y2
    var edgeY1 = this.vertex1.y;
    var edgeY2 = this.vertex2.y;
    return y1 <= Math.min(edgeY1, edgeY2) && y2 >= Math.max(edgeY1, edgeY2);
};

PolygonEdge.prototype.inwardNormal = function()
{
    // "inward" - assuming that polygon's vertices are in clockwise order
    var dx = this.vertex2.x - this.vertex1.x;
    var dy = this.vertex2.y - this.vertex1.y;
    var edgeLength = Math.sqrt(dx*dx + dy*dy);
    return {x: -dy/edgeLength, y: dx/edgeLength};
};

PolygonEdge.prototype.outwardNormal = function()
{
    var n = this.inwardNormal();
    return {x: -n.x, y: -n.y};
};

PolygonEdge.prototype.xIntercept = function(y) {
    var vertex1Y = this.vertex1.y;
    var vertex2Y = this.vertex2.y;

    if (vertex1Y == vertex2Y)
        return Math.min(this.vertex1.x, this.vertex2.x);

    if (y == Math.min(vertex1Y, vertex2Y))
        return (vertex1Y < vertex2Y) ? this.vertex1.x : this.vertex2.x;

    if (y == Math.max(vertex1Y, vertex2Y))
        return (vertex1Y > vertex2Y) ? this.vertex1.x : this.vertex2.x;

    return this.vertex1.x + ((y - vertex1Y) * (this.vertex2.x - this.vertex1.x) / (vertex2Y - vertex1Y));
};

/* Clip the edge line segment to the vertical range y1,y2 and then return 
 * the clipped line segment's horizontal range as {x1, x2}, where x2 >= x1;
 * This method assumes that this edge overlaps y1,y2.
*/
PolygonEdge.prototype.clippedEdgeXRange = function(y1, y2) {
    if (this.isWithinYRange(y1, y2)) {
        var vertex1X = this.vertex1.x;
        var vertex2X = this.vertex2.x;
        return {x1: Math.min(vertex1X, vertex2X), x2: Math.max(vertex1X, vertex2X)};
    }

    var minYVertex, maxYVertex;
    if (this.vertex1.y < this.vertex2.y) {
        minYVertex = this.vertex1;
        maxYVertex = this.vertex2;
    }
    else {
        minYVertex = this.vertex2;
        maxYVertex = this.vertex1;
    }

    var xForY1 = (minYVertex.y < y1) ? this.xIntercept(y1) : minYVertex.x;
    var xForY2 = (maxYVertex.y > y2) ? this.xIntercept(y2) : maxYVertex.x;
    return {x1: Math.min(xForY1, xForY2), x2: Math.max(xForY1, xForY2)};
};

/* Clip the circle to the vertical range y1,y2 and return the extent of the clipped circle's 
 * projection on the X axis as {x1, x2}, where x2 >= x1. This method assumes that the circle
 * overlaps y1, y2.
*/
function clippedCircleXRange(center, radius, y1, y2) {
    if (center.y >= y1 && center.y <= y2)
        return {x1: center.x - radius, x2: center.x + radius};

    var yi, xi;
    if (y2 < center.y) {
        yi = y2 - center.y;
        xi = ellipseXIntercept(yi, radius, radius);
        return {x1: center.x - xi, x2: center.x + xi};
    }

    yi =  y1 - center.y;
    xi = ellipseXIntercept(yi, radius, radius);
    return {x1: center.x - xi, x2: center.x + xi};
}

/* The edge of a polygon shape */
function ShapeEdge(polygon, vertex1, vertex2) {
    this.init(polygon, vertex1, vertex2);
}

ShapeEdge.prototype = new PolygonEdge();

/* The polygon shape edge offset by shape-margin */
function OffsetEdge(edge, normalUnitVector) {
    var shapeMargin = edge.polygon.shapeMargin;
    var dx = normalUnitVector.x * shapeMargin;
    var dy = normalUnitVector.y * shapeMargin;

    this.anchorEdge = edge;
    this.normalUnitVector = normalUnitVector;

    var vertex1 = {x: edge.vertex1.x + dx, y: edge.vertex1.y + dy};
    var vertex2 = {x: edge.vertex2.x + dx, y: edge.vertex2.y + dy};

    this.init(edge.polygon, vertex1, vertex2);
}

OffsetEdge.prototype = new PolygonEdge();

function isVertexOrderClockwise(vertices) {
    var minVertexIndex = 0;
    for (var i = 1; i < vertices.length; ++i) {
        var p = vertices[i];
        if (p.y < vertices[minVertexIndex].y || (p.y == vertices[minVertexIndex].y && p.x < vertices[minVertexIndex].x))
            minVertexIndex = i;
    }
    var nextVertex = vertices[(minVertexIndex + 1) % vertices.length];
    var prevVertex = vertices[(minVertexIndex + vertices.length - 1) % vertices.length];
    return compareLineSlopes(prevVertex, vertices[minVertexIndex], nextVertex) < 0;
}

function Polygon(vertices, fillRule, shapeMargin) { // vertices:  [{x, y}]
    this.m_vertices = vertices;
    this.fillRule  = fillRule;
    this.shapeMargin = shapeMargin;

    if (vertices.length < 3) {
        this.m_edges = [];
        this.shapeMarginEdges = [];
        return;
    }

    var edges = [];
    var minX = (vertices.length > 0) ? vertices[0].x : undefined;
    var minY = (vertices.length > 0) ? vertices[0].y : undefined;
    var maxX = minX;
    var maxY = minY;

    var clockwise = isVertexOrderClockwise(vertices);
    var vertex1Index = 0;
    do {
        var vertex2Index = this.nextEdgeVertexIndex(vertex1Index, clockwise);
        edges.push(new ShapeEdge(this, vertices[vertex1Index], vertices[vertex2Index]));
        var x = vertices[vertex1Index].x;
        var y = vertices[vertex1Index].y;
        minX = Math.min(x, minX);
        minY = Math.min(y, minY);
        maxX = Math.max(x, maxX);
        maxY = Math.max(y, maxY);
        vertex1Index = vertex2Index;

    } while (vertex1Index !== 0);

    // Where possible, combine 2 edges into 1
    var edgeIndex = 0, nextEdgeIndex;
    while (edgeIndex < edges.length && edges.length > 3) {
        nextEdgeIndex = (edgeIndex + 1) % edges.length;
        if (areCollinearPoints(edges[edgeIndex].vertex1, edges[edgeIndex].vertex2, edges[nextEdgeIndex].vertex2)) {
            edges[edgeIndex].vertex2 = edges[nextEdgeIndex].vertex2;
            edges.splice(nextEdgeIndex, 1);
        } else
            edgeIndex++;
    }

    if (shapeMargin === 0) {
        this.shapeMarginEdges = edges;
    } else {
        var shapeMarginEdges = [];
        for(var i = 0; i < edges.length; i++) {
            shapeMarginEdges.push(new OffsetEdge(edges[i], edges[i].outwardNormal()));
            shapeMarginEdges.push(new OffsetEdge(edges[i], edges[i].inwardNormal()));
        }
        this.shapeMarginEdges = shapeMarginEdges;
    }

    this.m_edges = edges;
    this.bounds = new Rect(minX - shapeMargin, minY - shapeMargin, shapeMargin*2 + (maxX - minX), shapeMargin*2 + (maxY - minY));
}

Polygon.prototype.vertexAt = function(index) { return this.m_vertices[index]; };

Polygon.prototype.edgeAt = function(index) { return this.m_edges[index]; };

Polygon.prototype.isEmpty = function() { return this.m_edges.length < 3 || this.bounds.isEmpty(); };

Polygon.prototype.vertices = function() { return this.m_vertices.slice(0); };
Polygon.prototype.edges = function() { return this.m_edges.slice(0); };

Polygon.prototype.overlapsYRange = function(y1, y2) { // y range: y1 <= y < y2
    return y1 < this.bounds.maxY && y2 >= this.bounds.y;
};

Polygon.prototype.nextVertexIndex = function(vertexIndex, clockwise) {
    var nVertices = this.m_vertices.length;
    return ((clockwise) ? vertexIndex + 1 : vertexIndex - 1 + nVertices) % nVertices;
};

Polygon.prototype.nextEdgeVertexIndex = function(vertex1Index, clockwise) {
    var nVertices = this.m_vertices.length;
    var vertex2Index = this.nextVertexIndex(vertex1Index, clockwise);

    while (vertex2Index && areCoincidentPoints(this.vertexAt(vertex1Index), this.vertexAt(vertex2Index)))
        vertex2Index = this.nextVertexIndex(vertex2Index, clockwise);

    while (vertex2Index) {
        var vertexIndex3 = this.nextVertexIndex(vertex2Index, clockwise);
        if (!areCollinearPoints(this.vertexAt(vertex1Index), this.vertexAt(vertex2Index), this.vertexAt(vertexIndex3)))
            break;
        vertex2Index = vertexIndex3;
    }

    return vertex2Index;
};

Polygon.prototype.containsPointEvenOdd = function(point) {
    var crossingCount = 0;
    for (var i = 0; i < this.m_edges.length; ++i) {
        var edge = this.edgeAt(i);
        if (edge.containsPoint(point))
            return true;
        var vertex1 = edge.vertex1;
        var vertex2 = edge.vertex2;
        if ((vertex1.y <= point.y && vertex2.y > point.y) || (vertex1.y > point.y && vertex2.y <= point.y)) {
            var vt = (point.y  - vertex1.y) / (vertex2.y - vertex1.y);
            if (point.x < vertex1.x + vt * (vertex2.x - vertex1.x))
                ++crossingCount;
        }
    }
    return (crossingCount & 1) !== 0;
};

Polygon.prototype.containsPointNonZero = function(point) {
    var windingNumber = 0;
    for (var i = 0; i < this.m_edges.length; ++i) {
        var edge = this.edgeAt(i);
        if (edge.containsPoint(point))
            return true;
        var vertex1 = edge.vertex1;
        var vertex2 = edge.vertex2;
        if (vertex2.y < point.y) {
            if ((vertex1.y > point.y) && (compareLineSlopes(vertex1, vertex2, point) > 0))
                ++windingNumber;
        } else if (vertex2.y > point.y) {
            if ((vertex1.y <= point.y) && (compareLineSlopes(vertex1, vertex2, point) < 0))
                --windingNumber;
        }
    }
    return windingNumber !== 0;
};

Polygon.prototype.containsPoint = function(point) {
    if (!this.bounds.containsPoint(point))
        return false;
    return this.fillRule == "nonzero" ? this.containsPointNonZero(point) : this.containsPointEvenOdd(point);
};

Polygon.prototype.edgeVerticesThatOverlapYRange = function(y1, y2) {
    var result = [];
    for (var i = 0; i < this.m_edges.length; i++) {
        var vertex = this.edgeAt(i).vertex1;
        if (vertex.y >= y1 && vertex.y < y2)
            result.push(vertex);
    }
    return result;
};

Polygon.prototype.edgesThatOverlapYRange = function(y1, y2) {
    var result = [];
    for (var i = 0; i < this.m_edges.length; i++) {
        var edge = this.edgeAt(i);
        if (edge.overlapsYRange(y1, y2))
            result.push(edge);
    }
    return result;
};

Polygon.prototype.shapeMarginEdgesThatOverlapYRange = function(y1, y2) {
    var result = [];
    for (var i = 0; i < this.shapeMarginEdges.length; i++) {
        var edge = this.shapeMarginEdges[i];
        if (edge.overlapsYRange(y1, y2))
            result.push(edge);
    }
    return result;
};

function compareEdgeMinX(edge1, edge2) { return edge1.minX - edge2.minX; }

function compareVertexXIncreasing(vertex1, vertex2) { return vertex2.x - vertex1.x; }

Polygon.prototype.leftExclusionEdge = function(y1, y2) { // y2 >= y1
    if (this.isEmpty() || !this.bounds.overlapsYRange(y1, y2))
        return undefined;

    var result, i, xRange;

    var overlappingEdges = this.shapeMarginEdgesThatOverlapYRange(y1, y2);
    if (overlappingEdges.length !== 0) {
        overlappingEdges.sort(compareEdgeMinX);

        result = overlappingEdges[0].clippedEdgeXRange(y1, y2).x1;
        for (i = 1; i < overlappingEdges.length; i++) {
            if (overlappingEdges[i].minX > result)
                break;
            xRange = overlappingEdges[i].clippedEdgeXRange(y1, y2);
            result = (result === undefined) ? xRange.x1 : Math.min(result, xRange.x1);
        }
    }

    var shapeMargin = this.shapeMargin;
    if (shapeMargin > 0) {
        var overlappingVertices = this.edgeVerticesThatOverlapYRange(y1 - shapeMargin, y2 + shapeMargin);
        overlappingVertices.sort(compareVertexXIncreasing); 

        for (i = 0; i < overlappingVertices.length; i++) {
            // FIXME: short-circuit
            xRange = clippedCircleXRange(overlappingVertices[i], shapeMargin, y1, y2);
            result = (result === undefined) ? xRange.x1 : Math.min(result, xRange.x1);
        }
    }

    if (result === undefined)
        console.error("Polygon leftExclusionEdge() failed");
    return result;
};

function compareEdgeMaxX(edge1, edge2) { return edge2.maxX - edge1.maxX; }

function compareVertexXDecreasing(vertex1, vertex2) { return vertex1.x - vertex2.x; }

Polygon.prototype.rightExclusionEdge = function (y1, y2) { // y2 >= y1
    if (this.isEmpty() || !this.bounds.overlapsYRange(y1, y2))
        return undefined;

    var result, i, xRange;

    var overlappingEdges = this.shapeMarginEdgesThatOverlapYRange(y1, y2);
    if (overlappingEdges.length !== 0) {
        overlappingEdges.sort(compareEdgeMaxX);

        result = overlappingEdges[0].clippedEdgeXRange(y1, y2).x2;
        for (i = 1; i < overlappingEdges.length; i++) {
            if (overlappingEdges[i].maxX < result)
                break;
            xRange = overlappingEdges[i].clippedEdgeXRange(y1, y2);
            result = Math.max(result, xRange.x2);
        }
    }

    var shapeMargin = this.shapeMargin;
    if (shapeMargin > 0) {
        var overlappingVertices = this.edgeVerticesThatOverlapYRange(y1 - shapeMargin, y2 + shapeMargin);
        overlappingVertices.sort(compareVertexXDecreasing); 

        for (i = 0; i < overlappingVertices.length; i++) {
            // FIXME: short-circuit
            xRange = clippedCircleXRange(overlappingVertices[i], shapeMargin, y1, y2);
            result = (result === undefined) ? xRange.x2 : Math.max(result, xRange.x2);
        }
    }

    if (result === undefined)
        console.error("Polygon rightExclusionEdge() failed");
    return result;
};
