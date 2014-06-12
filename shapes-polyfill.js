/*!
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

;(function(scope) {
"use strict";

function Metrics(element) {
    var computedStyle = getComputedStyle(element);

    // a full units map would call getUnitsMap, but that can significantly slow things down
    this.units = { px: 1 };
    this.element = element;

    // Used values already in px, but may be "" in some browsers, eg FF
    // These values are stored in their CSS order top, right, bottom, left
    var parseLength = function(length) { return length && length.length ? parseInt(length) : 0; };
    this.margins = [computedStyle.marginTop, computedStyle.marginRight, computedStyle.marginBottom, computedStyle.marginLeft];
    this.margins = this.margins.map(parseLength);
    this.borders = [computedStyle.borderTopWidth, computedStyle.borderRightWidth, computedStyle.borderBottomWidth, computedStyle.borderLeftWidth];
    this.borders = this.borders.map(parseLength);
    this.paddings = [computedStyle.paddingTop, computedStyle.paddingRight, computedStyle.paddingBottom, computedStyle.paddingLeft];
    this.paddings = this.paddings.map(parseLength);

    this.borderBox = {
        x: 0,
        y: 0,
        width: element.offsetWidth,
        height: element.offsetHeight
    };

    this.marginBox = {
        x: -this.margins[3],
        y: -this.margins[0],
        width: element.offsetWidth + this.margins[1] + this.margins[3],
        height: element.offsetHeight + this.margins[0] + this.margins[2]
    };

    // Resolved values, may not be in px
    // These are stored in their CSS order, top-left (width/height), top-right, bottom-right, bottom-left
    var self = this;
    var radii = ['borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomRightRadius', 'borderBottomLeftRadius'];
    this.borderBox.radii = radii.map(function(radius, index) {
        radius = computedStyle[radius].split(/\s+/);
        return [
            self.toPixels(radius[0], self.borderBox.width),
            self.toPixels(radius.length > 1 ? radius[1] : radius[0], self.borderBox.height)
        ];
    });

    this.cssFloat = computedStyle.cssFloat;
}

Metrics.prototype.unitToPx = function(unit) {
    if (this.units[unit])
        return this.units[unit];
    var cached = this.element.style.getPropertyValue('line-height');
    this.element.style.setProperty('line-height', 1 + unit);
    this.units[unit] = parseFloat(getComputedStyle(this.element).getPropertyValue('line-height'));
    this.element.style.setProperty('line-height', cached);
    return this.units[unit];
};

Metrics.prototype.getUnitsMap = function(element) {
    var units = ['em', 'ex', 'ch', 'rem', 'vw', 'vh', 'vmin', 'vmax', 'cm', 'mm', 'in', 'px', 'pt', 'pc'];

    var child = document.createElement('div');
    child.style.width = '0px';
    child.style.height = '0px';

    element.appendChild(child);
    var style = getComputedStyle(child);

    var result = {};
    units.forEach(function(unit) {
        child.style.lineHeight = '1' + unit;
        // computed height is in px
        result[unit] = parseFloat(style.lineHeight);
    });
    child.parentNode.removeChild(child);

    return result;
};

Metrics.prototype.toPixels = function(length, percentageBase) {
    var split = /([\-0-9\.]*)([a-z%]*)/.exec(length);
    split[1] = parseFloat(split[1]);
    if (!split[2])
        return split[1];
    if (split[2] === '%')
        return split[1] * percentageBase / 100;
    return split[1] * this.unitToPx(split[2]);
};

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

/* Loading an image can fail for several reasons. Try to log an
 * error only once, and mark the appropriate values as undefined.
 */
function RasterInterval(y, startX, endX) {
    this.y = y;
    this.startX = startX;
    this.endX = endX;
}

function RasterIntervals(yOffset, size) {
    this.intervals = [];
    this.yOffset = yOffset;
    this.size = size;
    for (var i = 0; i < size; i++)
        this.intervals[i] = RasterIntervals.none;
    this.minY = -yOffset;
    this.maxY = size - yOffset;
}

RasterIntervals.none = {};

RasterIntervals.prototype.intervalAt = function(y) { return this.intervals[y + this.yOffset]; };
RasterIntervals.prototype.setIntervalAt = function(y, value) { this.intervals[y + this.yOffset] = value; };

RasterIntervals.prototype.uniteIntervalAt = function(y, interval) {
    var intervalAtY = this.intervalAt(y);
    if (intervalAtY === RasterIntervals.none)
        this.setIntervalAt(y, interval);
    else {
        intervalAtY.startX = Math.min(intervalAtY.startX, interval.startX);
        intervalAtY.endX = Math.max(intervalAtY.endX, interval.endX);
    }
};

RasterIntervals.prototype.intervalAtContains = function(y, interval) {
    var intervalAtY = this.intervalAt(y);
    if (intervalAtY == RasterIntervals.none)
        return false;
    return intervalAtY.startX <= interval.startX && intervalAtY.endX >= interval.endX;
};

function ShapeMarginIntervalGenerator(shapeMargin) {
    this.shapeMargin = shapeMargin;
    this.xIntercepts = [];
    for (var y = 0; y <= shapeMargin; y++)
        this.xIntercepts[y] = Math.sqrt(shapeMargin * shapeMargin - y * y);
}

ShapeMarginIntervalGenerator.prototype.generateIntervalAt = function(atY, forInterval) {
    var xInterceptsIndex = Math.abs(atY - forInterval.y);
    var dx = (xInterceptsIndex > this.shapeMargin) ? 0 : this.xIntercepts[xInterceptsIndex];
    return new RasterInterval(atY, forInterval.startX - dx, forInterval.endX + dx);
};

RasterIntervals.prototype.computeMarginIntervals = function(shapeMargin, clip) {
    var mig = new ShapeMarginIntervalGenerator(shapeMargin);
    var result = new RasterIntervals(this.yOffset, this.size);

    for (var y = this.minY; y < this.maxY; ++y) {
        var intervalAtY = this.intervalAt(y);
        if (intervalAtY == RasterIntervals.none)
            continue;

        var marginY0 = Math.max(this.minY, y - shapeMargin);
        var marginY1 = Math.min(this.maxY - 1, y + shapeMargin);
        var marginY;

        for (marginY = y - 1; marginY >= marginY0; --marginY) {
            if (marginY > 0 && this.intervalAtContains(marginY, intervalAtY))
                break;
            result.uniteIntervalAt(marginY, mig.generateIntervalAt(marginY, intervalAtY));
        }

        result.uniteIntervalAt(y, mig.generateIntervalAt(y, intervalAtY));

        for (marginY = y + 1; marginY <= marginY1; ++marginY) {
            if (marginY < this.maxY && this.intervalAtContains(marginY, intervalAtY))
                break;
            result.uniteIntervalAt(marginY, mig.generateIntervalAt(marginY, intervalAtY));
        }
    }
    return result;
};

function error(url, exception) {
    console.log("Unable to load image ", url, ". It's probably missing or you've run into a CORS issue.");
    if (exception)
        console.log("The exact problem was ", exception);
}

function RasterImage(image, width, height) {
    var canvas = document.createElement("canvas");
    this.width = canvas.width = width;
    this.height = canvas.height = height;
    var g = canvas.getContext("2d");
    g.drawImage(image, 0, 0, width, height);
    try {
        this.imageData = g.getImageData(0, 0, width, height);
    } catch (e) {
        error(image.src, e);
        /* imageData will be undefined */
    }
}

RasterImage.prototype.hasData = function() { return !!this.imageData; };

RasterImage.prototype.alphaAt = function(x, y) {
    return this.imageData.data[(x * 4 + 3) + y * this.width * 4];
};

function Raster(url, box, shapeImageThreshold, shapeMargin, clip, whenReady) {
    this.url = url;
    this.box = box;
    this.shapeImageThreshold = (256 * shapeImageThreshold);
    this.shapeMargin = shapeMargin;
    this.clip = clip;

    this.init(whenReady);
}

Raster.prototype.init = function(callback) {
    var raster = this;
    var image = new Image();
    var blob;

    /* If canvas is not supported, we're not going to get any further, so
     * don't bother with the potential image / XHR request */
    var canvas = document.createElement("canvas");
    if (!canvas.getContext) {
        error(raster.url);
        callback();
    }

    image.onload = function() {
        raster.intervals = raster.computeIntervals(image);
        if (raster.intervals) {
            if (raster.shapeMargin > 0)
                raster.intervals = raster.intervals.computeMarginIntervals(raster.shapeMargin, raster.clip);
        }
        if (blob)
            URL.revokeObjectURL(blob);
        callback();
    };

    image.onerror = function() {
        error(raster.url);
        /* raster.intervals is undefined */
        callback();
    };

    /* Try this approach for browsers that don't support
     * CORS-enabled images (ie IE). Ideally we'd skip this
     * for same-origin images, but we don't have a good test
     * for that. */
    if (!image.hasOwnProperty('crossOrigin') &&
        window.URL &&
        window.URL.createObjectURL) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    blob = URL.createObjectURL(xhr.response);
                    image.src = blob;
                } else {
                    error(raster.url);
                    callback();
                }
            }
        };
        xhr.open('GET', raster.url, true);
        xhr.responseType = 'blob';
        xhr.send();
    } else {
        image.crossOrigin = "anonymous";
        image.src = raster.url;
    }
};

Raster.prototype.computeIntervals = function(image) {
    var clip = this.clip,
        threshold = this.shapeImageThreshold,
        width = this.box.width,
        height = this.box.height,
        rasterImage = new RasterImage(image, width, height);

    if (!rasterImage.hasData())
        return undefined;

    var intervals = new RasterIntervals(-clip.y, clip.height),
        maxY = Math.min(clip.height, this.box.height);
    for (var y = 0; y < maxY; y++) {
        var startX = -1;
        for (var x = 0; x < this.box.width; x++) {
            var alpha = rasterImage.alphaAt(x, y);
            if (startX == -1 && alpha > threshold) {
                startX = x;
                if (intervals.intervalAt(y) === RasterIntervals.none)
                    intervals.setIntervalAt(y, new RasterInterval(y, startX, width));
            } else if (startX != -1 && alpha <= threshold) {
                intervals.intervalAt(y).endX = x;
                startX = -1;
            }
        }
    }
    return intervals;
};

Raster.prototype.rightExclusionEdge = function (y1, y2) { // y2 >= y1
    var intervals = this.intervals;
    if (!intervals)
        return this.clip.width;
    var x; // = undefined;
    for (var y = Math.max(y1, this.clip.y); y <= y2 && y < this.clip.maxY; y++) {
        var endX = intervals.intervalAt(y).endX;
        if (x === undefined || (endX !== undefined && endX > x))
            x = endX;
    }
    return x;
};

Raster.prototype.leftExclusionEdge = function(y1, y2) { // y2 >= y1
    var intervals = this.intervals;
    if (!intervals)
        return 0;
    var x; // = undefined;
    for (var y = Math.max(y1, this.clip.y); y <= y2 && y < this.clip.maxY; y++) {
        var startX = intervals.intervalAt(y).startX;
        if (x === undefined || (startX !== undefined && startX < x))
            x = startX;
    }
    return x;
};

function Size(width, height) {
    this.width = width;
    this.height = height;
}

Size.zeroSize = { width:0, height:0 };

Size.prototype.isEmpty = function() { return this.width <= 0 || this.height <= 0; };

Size.prototype.scale = function(factor) {
    this.width *= factor;
    this.height *= factor;
};

function Rect(x, y, width, height) { 
    this.x = x;
    this.y = y; 
    this.width = width; 
    this.height = height;
    this.maxX = x + width;
    this.maxY = y + height;
}

Rect.prototype.isEmpty = function() { return this.width <= 0 || this.height <= 0; };

Rect.prototype.containsX = function(x) { return x >= this.x && x < this.maxX; };
Rect.prototype.containsY = function(y) { return y >= this.y && y < this.maxY; };
Rect.prototype.containsPoint = function(p) { return this.containsX(p.x) && this.containsY(p.y); };

Rect.prototype.shiftLeftEdgeTo = function(newX) { 
    this.width -= newX - this.x;
    this.x = newX;
};

Rect.prototype.shiftTopEdgeTo = function(newY) { 
    this.height -= newY - this.y;
    this.y = newY;
};

Rect.prototype.shiftRightEdgeTo = function(newX) {  this.width = newX - this.x; };
Rect.prototype.shiftBottomEdgeTo = function(newY) { this.height = newY - this.y; };

Rect.prototype.overlapsYRange = function(minY, maxY) {
    return !this.isEmpty() && maxY >= this.y && minY < this.maxY;
};

Rect.prototype.overlapsXRange = function(minX, maxX) {
    return !this.isEmpty() && maxX >= this.x && minX < this.maxX;
};

function RoundedRect(rect, topLeft, topRight, bottomLeft, bottomRight) { // corner radii parameters are {width, height}
    this.rect = rect;
    this.radii = {topLeft: topLeft, topRight: topRight, bottomLeft: bottomLeft, bottomRight: bottomRight};
}

RoundedRect.prototype.isEmpty = function() { return this.width <= 0 || this.height <= 0; };

RoundedRect.prototype.topLeftCorner = function() {
    return new Rect(
        this.rect.x, 
        this.rect.y, 
        this.radii.topLeft.width, 
        this.radii.topLeft.height); 
};

RoundedRect.prototype.topRightCorner = function() {
    return new Rect(
        this.rect.maxX - this.radii.topRight.width, 
        this.rect.y, 
        this.radii.topRight.width, 
        this.radii.topRight.height);
};

RoundedRect.prototype.bottomLeftCorner = function() {
    return new Rect(
        this.rect.x, 
        this.rect.maxY - this.radii.bottomLeft.height, 
        this.radii.bottomLeft.width, 
        this.radii.bottomLeft.height);
};

RoundedRect.prototype.bottomRightCorner = function() {
    return new Rect(
        this.rect.maxX - this.radii.bottomRight.width, 
        this.rect.maxY - this.radii.bottomRight.height, 
        this.radii.bottomRight.width, 
        this.radii.bottomRight.height);
};

RoundedRect.prototype.isRounded = function() {
    function isCornerRadiusNonZero(radius) { return radius.width > 0 && radius.height > 0; }
    return isCornerRadiusNonZero(this.radii.topLeft) ||
       isCornerRadiusNonZero(this.radii.topRight) ||
       isCornerRadiusNonZero(this.radii.bottomLeft) ||
       isCornerRadiusNonZero(this.radii.bottomRight);
};

RoundedRect.prototype.cornersInsetRect = function() {
    var topLeftCorner = this.topLeftCorner();
    var topRightCorner = this.topRightCorner();
    var bottomLeftCorner = this.bottomLeftCorner();
    var bottomRightCorner = this.bottomRightCorner();
    var x = Math.max(topLeftCorner.maxX, bottomLeftCorner.maxX);
    var y = Math.max(topLeftCorner.maxY, topRightCorner.maxY);
    return new Rect(x, y, Math.min(topRightCorner.x, bottomRightCorner.x) - x, Math.min(bottomLeftCorner.y, bottomRightCorner.y) - y);
};

RoundedRect.prototype.scaleRadii = function(factor)
{
    if (factor == 1)
        return;
    var radii = this.radii;

    radii.topLeft.scale(factor);
    if (radii.topLeft.isEmpty())
        radii.topLeft = Size.zeroSize;

    radii.topRight.scale(factor);
    if (radii.topRight.isEmpty())
        radii.topRight = Size.zeroSize;

    radii.bottomLeft.scale(factor);
    if (radii.bottomLeft.isEmpty())
        radii.bottomLeft = Size.zeroSize;

    radii.bottomRight.scale(factor);
    if (radii.bottomRight.isEmpty())
        radii.bottomRight = Size.zeroSize;
};

// See RoundedRect::isRenderable() in https://trac.webkit.org/browser/trunk/Source/WebCore/platform/graphics/RoundedRect.cpp
// and http://www.w3.org/TR/css3-background/#corner-overlap

RoundedRect.prototype.isRenderable = function()
{
    var radii = this.radii;
    var rect = this.rect;
    return radii.topLeft.width + radii.topRight.width <= rect.width &&
        radii.bottomLeft.width + radii.bottomRight.width <= rect.width &&
        radii.topLeft.height + radii.bottomLeft.height <= rect.height &&
        radii.topRight.height + radii.bottomRight.height <= rect.height;
};

// See RoundedRect::adjustRadii() in https://trac.webkit.org/browser/trunk/Source/WebCore/platform/graphics/RoundedRect.cpp
// and http://www.w3.org/TR/css3-background/#corner-overlap

RoundedRect.prototype.adjustRadii = function()
{
    var radii = this.radii;
    var maxRadiusWidth = Math.max(radii.topLeft.width + radii.topRight.width, radii.bottomLeft.width + radii.bottomRight.width);
    var maxRadiusHeight = Math.max(radii.topLeft.height + radii.bottomLeft.height, radii.topRight.height + radii.bottomRight.height);
    if (maxRadiusWidth <= 0 || maxRadiusHeight <= 0) {
        this.radii = {
            topLeft: Size.zeroSize,
            topRight: Size.zeroSize,
            bottomRight: Size.zeroSize,
            bottomLeft: Size.zeroSize
        };
        return;
    }
    var rect = this.rect;
    var widthRatio = rect.width / maxRadiusWidth;
    var heightRatio = rect.height / maxRadiusHeight;
    this.scaleRadii(widthRatio < heightRatio ? widthRatio : heightRatio);
};

function ellipseXIntercept(y, rx, ry) {
    return rx * Math.sqrt(1 - (y * y) / (ry * ry));
}

RoundedRect.prototype.minXInterceptAt = function(y, noInterceptReturnValue) {
    if (!this.rect.containsY(y))
        return noInterceptReturnValue;

    var topLeftCorner = this.topLeftCorner(), yi;
    if (topLeftCorner.containsY(y)) {
        yi = topLeftCorner.maxY - y;
        return topLeftCorner.maxX  - ellipseXIntercept(yi, topLeftCorner.width, topLeftCorner.height);
    } 

    var bottomLeftCorner = this.bottomLeftCorner();
    if (bottomLeftCorner.containsY(y)) {
        yi = y - bottomLeftCorner.y;
        return bottomLeftCorner.maxX - ellipseXIntercept(yi, bottomLeftCorner.width, bottomLeftCorner.height);
    } 

    return this.rect.x;
};

RoundedRect.prototype.maxXInterceptAt = function(y, noInterceptReturnValue) {
    if (!this.rect.containsY(y))
        return noInterceptReturnValue;

    var topRightCorner = this.topRightCorner(), yi;
    if (topRightCorner.containsY(y)) {
        yi = topRightCorner.maxY - y;
        return topRightCorner.x + ellipseXIntercept(yi, topRightCorner.width, topRightCorner.height);
    } 

    var bottomRightCorner = this.bottomRightCorner();
    if (bottomRightCorner.containsY(y)) {
        yi = y - bottomRightCorner.y;
        return bottomRightCorner.x + ellipseXIntercept(yi, bottomRightCorner.width, bottomRightCorner.height);
    } 

    return this.rect.maxX;
};

RoundedRect.prototype.rightExclusionEdge = function (y1, y2) { // y2 >= y1
    if (this.rect.isEmpty() || !this.rect.overlapsYRange(y1, y2))
        return undefined;

    if (!this.isRounded() || this.cornersInsetRect().overlapsYRange(y1, y2))
        return this.rect.maxX;

    return Math.max(this.maxXInterceptAt(y1, this.rect.x), this.maxXInterceptAt(y2, this.rect.x));
};

RoundedRect.prototype.leftExclusionEdge = function(y1, y2) { // y2 >= y1
    if (this.rect.isEmpty() || !this.rect.overlapsYRange(y1, y2))
        return undefined;

    if (!this.isRounded() || this.cornersInsetRect().overlapsYRange(y1, y2))
        return this.rect.x;

    return Math.min(this.minXInterceptAt(y1, this.rect.maxX), this.minXInterceptAt(y2, this.rect.maxX));
};

function computeOffsetHeight(dx, dy, areaLimit) {
    if (dy === 0)
        return 1;
    if (dx === 0 || (dx * dy) / 2 < areaLimit)
        return Math.round(dy);
    return Math.round(Math.sqrt(2 * areaLimit * (dy / dx)));
}

function leftCornerOffset(leftCorner, offset) { return leftCorner.maxX - offset; }
function rightCornerOffset(rightCorner, offset) { return rightCorner.x + offset; }
function leftBoxOffset(box) { return box.x; }
function rightBoxOffset(box) { return box.maxX; }

function adaptiveOffsetFnGenerator(getTopCorner, getBottomCorner, getBoxOffset, getCornerOffset) {
return function(y1, y2, areaLimit) { // y2 >= y1
    if (!this.rect.overlapsYRange(y1, y2))
        return [{x: undefined, height: y2 - y1}];

    var offsets = [];

    if (y1 < this.rect.y)
        offsets.push({x: undefined, height: this.rect.y - y1});

    var offsetHeight, minY, maxY, y, yi, xi,
        topCorner = getTopCorner.call(this),
        bottomCorner = getBottomCorner.call(this),
        boxArea = new Rect(this.rect.x, topCorner.maxY, this.rect.width, bottomCorner.y - topCorner.maxY);

    if (topCorner.overlapsYRange(y1, y2)) {
        offsetHeight = computeOffsetHeight(topCorner.width, topCorner.height, areaLimit);
        minY = Math.max(topCorner.y, y1);
        maxY = Math.min(topCorner.maxY, y2);
        for (y = minY; y < maxY; y += offsetHeight) {
            yi = topCorner.maxY - Math.min(y + offsetHeight, maxY);
            xi = ellipseXIntercept(yi, topCorner.width, topCorner.height);
            offsets.push({height: Math.min(offsetHeight, maxY - y), x: getCornerOffset(topCorner, xi) });
        }
    }

    minY = Math.max(boxArea.y, y1);
    maxY = Math.min(boxArea.maxY, y2);
    if (boxArea.overlapsYRange(y1, y2))
        offsets.push({x: getBoxOffset(boxArea), height: maxY - minY });

    if (bottomCorner.overlapsYRange(y1, y2)) {
        offsetHeight = computeOffsetHeight(bottomCorner.width, bottomCorner.height, areaLimit);
        minY = Math.max(y1, bottomCorner.y);
        maxY = Math.min(bottomCorner.maxY, y2);
        for (y = minY; y < maxY; y += offsetHeight) {
            yi = y - bottomCorner.y;
            xi = ellipseXIntercept(yi, bottomCorner.width, bottomCorner.height);
            offsets.push({height: Math.min(offsetHeight, maxY - y), x: getCornerOffset(bottomCorner, xi) });
        }
    }

    if (y2 > this.rect.maxY)
        offsets.push({x: undefined, height: y2 - this.rect.maxY});

    return offsets;
};
}

RoundedRect.prototype.rightExclusionOffsets = adaptiveOffsetFnGenerator(
    RoundedRect.prototype.topRightCorner,
    RoundedRect.prototype.bottomRightCorner,
    rightBoxOffset,
    rightCornerOffset);

RoundedRect.prototype.leftExclusionOffsets = adaptiveOffsetFnGenerator(
    RoundedRect.prototype.topLeftCorner,
    RoundedRect.prototype.bottomLeftCorner,
    leftBoxOffset,
    leftCornerOffset);

function createRoundedRectForCircle(circle, margin) {
    var r = circle.r + margin;
    var c = new Size(r, r);
    return new RoundedRect(new Rect(circle.cx - r, circle.cy - r, r * 2, r * 2), c, c, c, c);
}

function createRoundedRectForEllipse(ellipse, margin) {
    var c = new Size(ellipse.rx + margin, ellipse.ry + margin);
    return new RoundedRect(new Rect(ellipse.cx - c.width, ellipse.cy - c.height, c.width * 2, c.height * 2), c, c, c, c);
}

function createRoundedRectForInset(inset, margin) {
    function toSize(r) { return new Size(r[0] + margin, r[1] + margin); }
    var topLeft = toSize(inset.radii[0]);
    var topRight = toSize(inset.radii[1]);
    var bottomRight = toSize(inset.radii[2]);
    var bottomLeft = toSize(inset.radii[3]);
    var rect = new Rect(inset.x - margin, inset.y - margin, inset.width + 2 * margin, inset.height + 2 * margin);
    return new RoundedRect(rect, topLeft, topRight, bottomLeft, bottomRight);
}

function createRoundedRectForBox(box, margin) {
    function toSize(r) { return new Size(r[0] + margin, r[1] + margin); }
    var topLeft = toSize(box.radii[0]),
        topRight = toSize(box.radii[1]),
        bottomRight = toSize(box.radii[2]),
        bottomLeft = toSize(box.radii[3]);
    // This box is at 0,0 relative to its sizing box (itself)
    var rect = new Rect(-margin, -margin, box.width + 2 * margin, box.height + 2 * margin);
    return new RoundedRect(rect, topLeft, topRight, bottomLeft, bottomRight);
}

function createRaster(url, box, shapeImageThreshold, shapeMargin, clip, doLayout) {
    var clipRect = new Rect(clip.x, clip.y, clip.width, clip.height);
    return new Raster(url, box, shapeImageThreshold, shapeMargin, clipRect, doLayout);
}

function createPolygon(polygon, shapeMargin) {
    return new Polygon(polygon.points, polygon.fillRule, shapeMargin);
}

function createShapeGeometry(shapeValue, whenReady) {
    var shapeMargin = (shapeValue.shapeMargin === undefined) ? 0 : shapeValue.shapeMargin;
    var geometry;
    if (shapeValue.shape) {
        switch (shapeValue.shape.type) {
        case "circle":
            geometry = createRoundedRectForCircle(shapeValue.shape, shapeMargin);
            break;
        case "ellipse":
            geometry = createRoundedRectForEllipse(shapeValue.shape, shapeMargin);
            break;
        case "inset":
            geometry = createRoundedRectForInset(shapeValue.shape, shapeMargin);
            if (!geometry.isRenderable())
                geometry.adjustRadii();
            break;
        case "polygon":
            geometry = createPolygon(shapeValue.shape, shapeMargin);
            break;
        }
        whenReady();
        return geometry;
    }

    if (shapeValue.url)
        return createRaster(shapeValue.url, shapeValue.box, shapeValue.shapeImageThreshold, shapeMargin, shapeValue.clip, whenReady);

    if (shapeValue.box) {
        geometry = createRoundedRectForBox(shapeValue.box, shapeMargin);
        whenReady();
        return geometry;
    }

    console.error("Unrecognized shape");
}


function ShapeInfo(element) {
    this.metrics = new Metrics(element);
    var parserSettings = {
        metrics: this.metrics,
        shapeOutside: element.getAttribute('data-shape-outside'),
        shapeMargin: element.getAttribute('data-shape-margin'),
        shapeImageThreshold: element.getAttribute('data-shape-image-threshold')
    };
    this.shapeValue = new ShapeValue(parserSettings);

    var self = this;
    this.geometry = createShapeGeometry(this.shapeValue, function() {
        self.ready = true;
        if (self.callback)
            self.callback();
    });
}

ShapeInfo.prototype.onReady = function(callback) {
    if (this.ready)
        callback();
    else
        this.callback = callback;
};

ShapeInfo.prototype.leftExclusionEdge = function(line) { // { top, bottom, left, right }
    return this.geometry ? this.geometry.leftExclusionEdge(line.top, line.bottom) : line.left;
};

ShapeInfo.prototype.rightExclusionEdge = function(line) { // { top, bottom, left, right }
    return this.geometry ? this.geometry.rightExclusionEdge(line.top, line.bottom) : line.right;
};

function exclusionEdgeValue(x) { return x === undefined ? 0 : x; }

ShapeInfo.prototype.computeStepOffsets = function(step) {
    var offset, offsets = [];
    for (var i = 0; i < Math.ceil(this.metrics.marginBox.height / step); i++) {
        var lineBounds = {
            left: 0,
            right: this.shapeValue.box.width,
            top: i * step,
            bottom: Math.min((i + 1) * step, this.metrics.marginBox.height)
        };

        // transform to shape coordinates
        lineBounds.top -= (this.metrics.margins[0] + this.shapeValue.box.y);
        lineBounds.bottom -= (this.metrics.margins[0] + this.shapeValue.box.y);

        // get the offset relative to the margin box
        if (this.metrics.cssFloat === 'left') {
            offset = this.rightExclusionEdge(lineBounds);
            offset = (offset === undefined ? 0 : offset + this.shapeValue.box.x + this.metrics.margins[3]);
        } else {
            offset = this.leftExclusionEdge(lineBounds);
            offset = (offset === undefined ? 0 : this.metrics.marginBox.width - (offset + this.shapeValue.box.x + this.metrics.margins[3]));
        }

        // push the margin box relative offsets
        offsets.push({
            cssFloat: this.metrics.cssFloat,
            top: lineBounds.top + this.shapeValue.box.y + this.metrics.margins[0],
            bottom: lineBounds.bottom + this.shapeValue.box.y + this.metrics.margins[0],
            'offset': Math.min(offset, this.metrics.marginBox.width)
        });
    }

    return offsets;
};

ShapeInfo.prototype.computeAdaptiveOffsets = function(limit) {
    var dx = this.shapeValue.box.x + this.metrics.margins[3];
    var dy = this.metrics.margins[0] + this.shapeValue.box.y;
    var offsets = (this.metrics.cssFloat === 'left') ?
        this.geometry.rightExclusionOffsets(-dy, this.metrics.marginBox.height - dy, limit) :
        this.geometry.leftExclusionOffsets(-dy, this.metrics.marginBox.height - dy, limit);

    var result = [];
    var y = 0;
    for (var i = 0; i < offsets.length; i++) {
        var layoutOffset;
        if (offsets[i].x === undefined)
            layoutOffset = 0;
        else {
            layoutOffset = this.metrics.cssFloat == 'left' ?
                offsets[i].x + dx :
                this.metrics.marginBox.width - (offsets[i].x + dx);
            layoutOffset = Math.min(layoutOffset, this.metrics.marginBox.width);
        }
        result.push({offset: layoutOffset, top: y, bottom: y + offsets[i].height, cssFloat: this.metrics.cssFloat});
        y += offsets[i].height;
    }

    return result;
};

ShapeInfo.prototype.offsets = function(parameters) {
    if (this.geometry instanceof RoundedRect)
        return (parameters && parameters.mode) == "step" ? this.computeStepOffsets(parameters.step) : this.computeAdaptiveOffsets(parameters.limit);
    return  this.computeStepOffsets(parameters.step);
};

function Polyfill(scope) {
    this.scope = scope;

    var script = document.currentScript;
    if (!script) {
        script = document.getElementsByTagName('script');
        script = script[script.length - 1];
    }
    var self = this;
    var autoRun = script.getAttribute('data-auto-run') !== 'false';

    // IE < 9 uses attachEvent rather than addEventListener
    if (autoRun && scope.addEventListener) {
        scope.addEventListener('load', function() {
            self.run(/*{mode: "step"}*/);
        });
    }
}

function fakeIt(element, offsets) {
    var wrapper = document.createElement('div'),
        styles;

    offsets.forEach(function(offset, i) {
        var height = offset.bottom - offset.top;
        var sandbag = document.createElement('div');
        sandbag.className = "sandbag";
        styles = {
            cssFloat: offset.cssFloat,
            width: offset.offset + 'px',
            height: height + 'px',
            clear: offset.cssFloat
        };
        for (var prop in styles)
            sandbag.style[prop] = styles[prop];
        wrapper.appendChild(sandbag);
    });

    styles = {
        position: 'relative',
        width: 'auto',
        height: '0',
        clear: 'both',
        pointerEvents: 'none'
    };

    for (var prop in styles)
        wrapper.style[prop] = styles[prop];

    var parent = element.parentNode, subwrapper,
        computedStyle = getComputedStyle(parent),
        borderHeight = parseFloat(computedStyle.borderTop) + parseFloat(computedStyle.borderBottom);

    styles = {
        position: 'absolute',
        top: '0',
        width: '100%', // will fill the whole width, FF does 'auto' differently
        height: parent.clientHeight - borderHeight,
        left: '0'
    };

    subwrapper = document.createElement('div');
    for (prop in styles)
        subwrapper.style[prop] = styles[prop];
    wrapper.appendChild(subwrapper);

    if (element.parentNode)
        element.parentNode.insertBefore(wrapper, element);
    subwrapper.appendChild(element);

    wrapper.setAttribute('data-shape-outside-container', 'true');
}

Polyfill.prototype.polyfill = function(element, settings) {
    var computedStyle = getComputedStyle(element);

    if (!(/left|right/.test(computedStyle.cssFloat) && element.getAttribute('data-shape-outside')))
        return;

    // ideally this would default to lineHeight, but 'normal' is a valid computed value
    // and is up to the UA
    var step = settings && settings.step || parseInt(computedStyle.fontSize); // used when mode is "step"
    var mode = settings && settings.mode || "adaptive";  
    var limit = settings && settings.limit || step * 1.8;
    var shapeInfo = new ShapeInfo(element);

    var self = this;
    shapeInfo.onReady(function() {
        var offsets = shapeInfo.offsets({mode:mode, limit:limit, step:step});
        fakeIt(element, offsets);
        if (settings && settings.callback && typeof settings.callback === 'function')
            settings.callback.call(self.scope);
    });
};

Polyfill.prototype.removePolyfill = function(element) {
    var oldParent = element.parentNode;
    for (oldParent = element.parentNode;
        oldParent && oldParent.hasAttribute && !oldParent.hasAttribute('data-shape-outside-container');
        oldParent = oldParent.parentNode);

    if (!oldParent || !oldParent.hasAttribute)
        return;

    oldParent.parentNode.insertBefore(element, oldParent);
    oldParent.parentNode.removeChild(oldParent);
};

function debounce(func, wait) {
    var timeout;
    return function() {
        var context = this, args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(function() {
            timeout = null;
            func.apply(context, args);
        }, wait);
    };
}

Polyfill.prototype.run = function(settings) {
    var self = this;

    var force = settings && settings.force,
        forceLayout = force && (force === this.Force.Layout || force === this.Force.LayoutStyles),
        forceStyles = force && (force === this.Force.Styles || force === this.Force.LayoutStyles);

    if (force === this.Force.LayoutStyles)
        settings.force = this.Force.Layout;
    else if (force)
        delete settings.force;

    if (this.hasNativeSupport === undefined) {
        var div = document.createElement('div');
        var properties = ['shape-outside', '-webkit-shape-outside'];
        properties.forEach(function(property) {
            div.style.setProperty(property, 'content-box');
            self.hasNativeSupport = self.hasNativeSupport || div.style.getPropertyValue(property);
        });
    }

    if (this.hasNativeSupport && !force)
        return;

    if (!this.stylesLoaded || forceStyles) {
        this.stylesLoaded = true;

        new StylePolyfill(function(rules) {
            rules.forEach(function(rule) {
                var els = document.querySelectorAll(rule.selector);
                for (var i = 0; i < els.length; i++)
                    els[i].setAttribute('data-' + rule.property, rule.value);
            });

            self.run(settings);
        });

        var relayout = debounce(function() {
            self.teardown();
            self.run(settings);
        }, 300);
        this.scope.addEventListener('resize', relayout);

        return;
    }

    var els = document.querySelectorAll('[data-shape-outside]');
    for (var i = 0; i < els.length; i++)
        this.polyfill(els[i], settings);
};

Polyfill.prototype.teardown = function() {
    var els = document.querySelectorAll('[data-shape-outside]');
    for (var i = 0; i < els.length; i++)
        this.removePolyfill(els[i]);
};

Polyfill.prototype.Force = { Layout: 'force-layout', Styles: 'force-styles', LayoutStyles: 'force-layout-styles' };
if (Object.freeze)
    Polyfill.prototype.Force = Object.freeze(Polyfill.prototype.Force);

/**
 * ShapeValue may contain { shape, box, url, shapeMargin, shapeImageThreshold }
 * Format for { shape } property value, with coordinates resolved against the reference box
 * Arrays are generally ordered as margins: t, r, b, l
 * Except for radius arrays, which are w/h pairs ordered tl, tr, br, bl
 * { type: 'circle', cx: 10, cy: 10, r: 10 }
 * { type: 'ellipse', cx: 10, cy: 10, rx: 10, ry: 10 }
 * { type: 'inset', x, y, width, height, insets: [10, 10, 10, 10], radii: [[5, 5], [5, 5], [5, 5], [5, 5]] }
 * { type: 'polygon', fill-rule: 'evenodd', points: [{x, y}] }
 * Format for { box } property value, the reference box for shapes. Coordinates are relative to the border box.
 * { x: 10, y: 10, width: 10, height: 10, radii: [[5, 5], [5, 5], [5, 5], [5, 5]] }
 * Format for { url } property value
 * { url: 'http://www.abc.com/123.png' }
 **/
/* params: {
 *  metrics, //An element's Metrics object
 *  shapeOutside, //The rest are unresolved values
 *  shapeMargin,
 *  shapeImageThreshold,
 * }
 */
function ShapeValue(params) {
    if (!(params && params.metrics && params.shapeOutside)) {
        console.error('ShapeValue requires at least a metrics object and shape-outside string');
        return;
    }
    this.url = this.parseUrl(params.shapeOutside);
    this.box = this.parseBox(this.url ? 'content-box' : params.shapeOutside, params.metrics);
    this.shape = this.parseBasicShape(params.shapeOutside, this.box, params.metrics);
    this.clip = this.computeClip(this.box, params.metrics);
    this.shapeMargin = this.parseShapeMargin(params.shapeMargin, this.box, params.metrics);
    this.shapeImageThreshold = this.parseShapeImageThreshold(params.shapeImageThreshold);
}

ShapeValue.prototype.parseUrl = function(text) {
    var url = /url\((.*)\)/.exec(text);
    if (!url)
        return null;
    url = url[1];
    url = url.replace(/^['"]/, '');
    url = url.replace(/['"]$/, '');
    return url;
};

function adjustBounds(bounds, sign, offsets) {
    var top = offsets.reduce(function(prev, curr) { return prev + curr[0]; }, 0);
    var right = offsets.reduce(function(prev, curr) { return prev + curr[1]; }, 0);
    var bottom = offsets.reduce(function(prev, curr) { return prev + curr[2]; }, 0);
    var left = offsets.reduce(function(prev, curr) { return prev + curr[3]; }, 0);

    bounds.x -= sign * left;
    bounds.y -= sign * top;
    bounds.width += sign * (left + right);
    bounds.height += sign * (top + bottom);
}

// See http://dev.w3.org/csswg/css-shapes/#margin-box
function adjustRadius(radius, sign, offset) {
    if (sign < 0)
        return Math.max(radius + sign * offset, 0);
    var ratio = Math.abs(radius / offset);
    if (ratio < 1)
        return Math.max(radius + offset * (1 + Math.pow(ratio - 1, 3)), 0);
    return radius + offset;
}

function adjustRadii(radii, sign, offsets) {
    var top = offsets.reduce(function(prev, curr) { return prev + curr[0]; }, 0);
    var right = offsets.reduce(function(prev, curr) { return prev + curr[1]; }, 0);
    var bottom = offsets.reduce(function(prev, curr) { return prev + curr[2]; }, 0);
    var left = offsets.reduce(function(prev, curr) { return prev + curr[3]; }, 0);

    // Still need to max these with 0
    radii[0][0] = adjustRadius(radii[0][0], sign, left);
    radii[0][1] = adjustRadius(radii[0][1], sign, top);

    radii[1][0] = adjustRadius(radii[1][0], sign, right);
    radii[1][1] = adjustRadius(radii[1][1], sign, top);

    radii[2][0] = adjustRadius(radii[2][0], sign, right);
    radii[2][1] = adjustRadius(radii[2][1], sign, bottom);

    radii[3][0] = adjustRadius(radii[3][0], sign, left);
    radii[3][1] = adjustRadius(radii[3][1], sign, bottom);
}

ShapeValue.prototype.parseBox = function(text, metrics) {
    var box = /margin-box|border-box|padding-box|content-box/.exec(text);
    if (!box)
        box = 'margin-box';
    else
        box = box[0];
    var radii = JSON.parse(JSON.stringify(metrics.borderBox.radii));
    var result = { text: box, x: metrics.borderBox.x, y: metrics.borderBox.y, width: metrics.borderBox.width, height: metrics.borderBox.height, 'radii': radii };
    switch (box) {
        case 'content-box':
            adjustBounds(result, -1, [metrics.paddings, metrics.borders]);
            adjustRadii(result.radii, -1, [metrics.paddings, metrics.borders]);
            break;
        case 'padding-box':
            adjustBounds(result, -1, [metrics.borders]);
            adjustRadii(result.radii, -1, [metrics.borders]);
            break;
        case 'border-box':
            break;
        case 'margin-box':
            adjustBounds(result, 1, [metrics.margins]);
            adjustRadii(result.radii, 1, [metrics.margins]);
            break;
    }
    return result;
};

function pluck(arr, index) {
    return arr.map(function(item) {
        return item[index];
    });
}

ShapeValue.prototype.printShape = function() {
    if (this.shape) {
        switch(this.shape.type) {
            case 'inset':
                return 'inset(' + this.shape.insets.join(' ') +
                    ' round ' + pluck(this.shape.radii, 0).join(' ') +
                    ' / ' + pluck(this.shape.radii, 1).join(' ') + ')';
            case 'circle':
                return 'circle(' + this.shape.r + ' at ' + this.shape.cx + ' ' + this.shape.cy + ')';
            case 'ellipse':
                return 'ellipse(' + this.shape.rx + ' ' + this.shape.ry +
                    ' at ' + this.shape.cx + ' ' + this.shape.cy + ')';
            case 'polygon':
                return 'polygon(' + this.shape.fillRule + ', ' +
                    this.shape.points.map(function(point) { return point.x + ' ' + point.y; }).join(', ') +
                    ')';
            default: return 'not yet implemented for ' + this.shape.type;
        }
    }
    return 'no shape specified';
};

ShapeValue.prototype.printBox = function() {
    if (this.box) {
        return this.box.text + ' { x: ' + this.box.x + ', y: ' + this.box.y +
            ', width: ' + this.box.width + ', height: ' + this.box.height +
            ', radii: ' + pluck(this.box.radii, 0).join(' ') + ' / ' + pluck(this.box.radii, 1).join(' ') + ' }';
    }
    return 'no box specified';
};

ShapeValue.prototype.parseBasicShape = function(text, box, metrics) {
    var shape = /(inset|circle|ellipse|polygon)\((.*)\)/.exec(text);
    if (!shape)
        return null;

    var command = shape[1],
        args = shape[2] ? shape[2] : '';

    switch(command) {
    case 'inset':
        return this.parseInset(args, box, metrics);
    case 'circle':
        return this.parseCircle(args, box, metrics);
    case 'ellipse':
        return this.parseEllipse(args, box, metrics);
    case 'polygon':
        return this.parsePolygon(args, box, metrics);
    default: return null;
    }
};

ShapeValue.prototype.parseInset = function(args, box, metrics) {
    // use the 'ro' in round and '/' as delimiters
    var re = /((?:[^r]|r(?!o))*)?\s*(?:round\s+([^\/]*)(?:\s*\/\s*(.*))?)?/;
    args = re.exec(args);
    var result = {
        type: 'inset',
        insets: [0, 0, 0, 0],
        radii: [[0, 0], [0, 0], [0, 0], [0, 0]]
    };
    if (args && args[1]) {
        var insets = args[1].trim();
        insets = insets.split(/\s+/);
        result.insets[0] = insets[0];
        result.insets[1] = insets.length > 1 ? insets[1] : result.insets[0];
        result.insets[2] = insets.length > 2 ? insets[2] : result.insets[0];
        result.insets[3] = insets.length > 3 ? insets[3] : result.insets[1];
        result.insets[0] = metrics.toPixels(result.insets[0], box.height);
        result.insets[1] = metrics.toPixels(result.insets[1], box.width);
        result.insets[2] = metrics.toPixels(result.insets[2], box.height);
        result.insets[3] = metrics.toPixels(result.insets[3], box.width);
    }

    var radii;
    if (args && args[2]) {
        radii = args[2].trim();
        radii = radii.split(/\s+/);
        if (radii.length < 2) radii.push(radii[0]);
        if (radii.length < 3) radii.push(radii[0]);
        if (radii.length < 4) radii.push(radii[1]);

        result.radii = radii.map(function(radius) {
            radius = metrics.toPixels(radius, box.width);
            return [radius, radius];
        });
    }

    if (args && args[3]) {
        radii = args[3].trim();
        radii = radii.split(/\s+/);
        if (radii.length < 2) radii.push(radii[0]);
        if (radii.length < 3) radii.push(radii[0]);
        if (radii.length < 4) radii.push(radii[1]);

        radii.forEach(function(radius, i) {
            result.radii[i][1] = metrics.toPixels(radius, box.height);
        });
    }

    result.x = result.insets[3];
    result.y = result.insets[0];
    result.width = box.width - (result.insets[1] + result.insets[3]);
    result.height = box.height - (result.insets[0] + result.insets[2]);

    return result;
};

function positionOffsetToPixels(offset, extent, metrics) {
    offset = offset.split(/\s+/);
    var direction = 'TopLeft';
    var length = 0;

    switch(offset[0]) {
    case 'top': case 'left': break;
    case 'bottom': case 'right': direction = 'BottomRight'; break;
    case 'center': length = extent / 2.0; break;
    default: length = metrics.toPixels(offset[0], extent);
    }

    if (offset.length > 1)
        length = metrics.toPixels(offset[1], extent);

    return direction === 'TopLeft' ? length : extent - length;
}

function radiusToPixels(r, sides, extent, metrics) {
    if (r === 'closest-side')
        return Math.min.apply(null, sides);
    else if (r === 'farthest-side')
        return Math.max.apply(null, sides);
    else
        return metrics.toPixels(r, extent);
}

// Parse but do not resolve yet (shared by circle and ellipse)
ShapeValue.prototype.parseEllipsoid = function(args) {
    // use the 'a' in 'at' as the delimiter
    var re = /((?:[^a]|a(?!t))*)?\s*(?:at\s+(.*))?/;
    args = re.exec(args);

    var result = { };

    if (args && args[1]) {
        var radii = args[1].trim();
        radii = radii.split(/\s+/);
        result.rx = radii[0];
        result.ry = radii.length > 1 ? radii[1] : radii[0];
    } else {
        result.rx = result.ry = 'closest-side';
    }

    var resolvedPositions = [];
    if (args && args[2]) {
        var positions = args[2].trim();
        positions = positions.split(/\s+/);
        var canMergeBack = false;
        positions.forEach(function(position) {
            // if it is an offset
            if (/\d+/.test(position) && canMergeBack)
                resolvedPositions[resolvedPositions.length - 1] += ' ' + position;
            else
                resolvedPositions.push(position);
            // it's a non-center keyword and there are more than two inputs
            canMergeBack = (/top|bottom|left|right/.test(position) && positions.length > 2);
        });
    }
    while(resolvedPositions.length < 2)
        resolvedPositions.push('center');
    if (/top|bottom/.test(resolvedPositions[0]) || /left|right/.test(resolvedPositions[1])) {
        var swap = resolvedPositions[0];
        resolvedPositions[0] = resolvedPositions[1];
        resolvedPositions[1] = swap;
    }
    result.cx = resolvedPositions[0];
    result.cy = resolvedPositions[1];

    return result;
};

ShapeValue.prototype.parseCircle = function(args, box, metrics) {
    var result = this.parseEllipsoid(args);
    result.type = 'circle';
    result.cx = positionOffsetToPixels(result.cx, box.width, metrics);
    result.cy = positionOffsetToPixels(result.cy, box.height, metrics);
    result.r = radiusToPixels(result.rx, [
        Math.abs(result.cx), Math.abs(box.width - result.cx),
        Math.abs(result.cy), Math.abs(box.height - result.cy)
    ], Math.sqrt((box.width * box.width + box.height * box.height) / 2), metrics);
    delete result.rx;
    delete result.ry;
    return result;
};

ShapeValue.prototype.parseEllipse = function(args, box, metrics) {
    var result = this.parseEllipsoid(args);
    result.type = 'ellipse';
    result.cx = positionOffsetToPixels(result.cx, box.width, metrics);
    result.cy = positionOffsetToPixels(result.cy, box.height, metrics);
    result.rx = radiusToPixels(result.rx, [Math.abs(result.cx), Math.abs(box.width - result.cx)], box.width, metrics);
    result.ry = radiusToPixels(result.ry, [Math.abs(result.cy), Math.abs(box.height - result.cy)], box.height, metrics);
    return result;
};

ShapeValue.prototype.parsePolygon = function(args, box, metrics) {
    args = args.split(/\s*,\s*/);
    var rule = 'nonzero';
    if (args.length > 0 && /nonzero|evenodd/.test(args[0])) {
        rule = args[0].trim();
        args = args.slice(1);
    }
    var points = args.map(function(point) {
        var coords = point.split(/\s+/);
        return { x: metrics.toPixels(coords[0], box.width), y: metrics.toPixels(coords[1], box.height) };
    });
    return {
        type: 'polygon',
        'fillRule': rule,
        'points': points
    };
};

ShapeValue.prototype.computeClip = function(referenceBox, metrics)
{
    // margins: [marginTop, marginRight, marginBottom, marginLeft]
    var marginLeft = metrics.margins[3];
    var marginTop = metrics.margins[0];
    var marginWidth = metrics.margins[3] + metrics.margins[1];
    var marginHeight = metrics.margins[0] + metrics.margins[2];
    return {x: -referenceBox.x - marginLeft, y: -referenceBox.y - marginTop, width: metrics.borderBox.width + marginWidth, height: metrics.borderBox.height + marginHeight};
};

ShapeValue.prototype.parseShapeMargin = function(margin, box, metrics) {
    return parseInt(margin) ? Math.max(0, metrics.toPixels(margin, box.width)) : 0;
};

ShapeValue.prototype.parseShapeImageThreshold = function(threshold) {
    var value = parseFloat(threshold);  // FIXME: disallow non-numerical values
    return value ? Math.min(Math.max(0, value), 1.0) : 0;
};

function getStyleSheetElements() {
    var doc = document,
        stylesheets = [],
        i, len;

    if (typeof doc.querySelectorAll == 'function') {
        // shiny new browsers
        stylesheets = doc.querySelectorAll('link[rel="stylesheet"], style');

        // make it an array
        stylesheets = Array.prototype.slice.call(stylesheets, 0);
    } else {
        // old and busted browsers

        // <link rel="stylesheet">
        var tags = doc.getElementsByTagName("link");

        if (tags.length) {
            for (i = 0, len = tags.length; i < len; i++) {
                if (tags[i].getAttribute('rel') === "stylesheet") {
                    stylesheets.push(tags[i]);
                }
            }
        }

        // <style>
        tags = doc.getElementsByTagName("style");
        for (i=0, len = tags.length; i < len; i++) {
            stylesheets.push(tags[i]);
        }
    }

    return stylesheets;
}

function StyleSheet(source){
    this.source = source;
    this.url = source.href || null;
    this.cssText = '';
}

StyleSheet.prototype.load = function(onSuccess, onError, scope) {
    var self = this;

    // Loading external stylesheet
    if (this.url) {
        var xhr = new XMLHttpRequest();

        xhr.onreadystatechange = function() {
            if(xhr.readyState === 4) {
                if (xhr.status === 200) {
                    self.cssText = xhr.responseText;
                    onSuccess.call(scope, self);
                } else {
                    onError.call(scope, self);
                }
            }
        };

        xhr.open('GET', this.url);
        try {
            xhr.send(null);
        }
        catch (e) {
            console.log("An error occurred loading a stylesheet, probably because we can't access the local file system");
            onError.call(scope, self);
        }
    } else {
        this.cssText = this.source.textContent;
        onSuccess.call(scope, self);
    }
};

function StyleLoader(callback) {
    if (!(this instanceof StyleLoader)) {
        return new StyleLoader(callback);
    }

    this.stylesheets = [];
    this.queueCount = 0;
    this.callback = callback || function(){};

    this.init();
}

StyleLoader.prototype.init = function() {
    var els = getStyleSheetElements(),
        len = els.length,
        stylesheet,
        i;

    this.queueCount = len;

    for (i = 0; i < len; i++) {
        stylesheet = new StyleSheet(els[i]);
        this.stylesheets.push(stylesheet);
        stylesheet.load(this.onStyleSheetLoad, this.onStyleSheetError, this);
    }
};

StyleLoader.prototype.onStyleSheetLoad = function(stylesheet) {
    this.queueCount--;
    this.onComplete.call(this);
};


StyleLoader.prototype.onStyleSheetError = function(stylesheet) {
    var len = this.stylesheets.length,
        i;

    for (i = 0; i < len; i++) {
        if (stylesheet.source === this.stylesheets[i].source) {
            // remove the faulty stylesheet
            this.stylesheets.splice(i, 1);

            this.queueCount--;
            this.onComplete.call(this);
            return;
        }
    }
};

StyleLoader.prototype.onComplete = function() {
    if (this.queueCount === 0) {
        // run the callback after all stylesheet contents have loaded
        this.callback.call(this, this.stylesheets);
    }
};

function StylePolyfill(callback) {
    this.callback = callback || function() {};
    var self = this;
    new StyleLoader(function(stylesheets) {
        self.onStylesLoaded(stylesheets);
    });
}

StylePolyfill.prototype.onStylesLoaded = function(stylesheets) {
    // use : and ; as delimiters, except between ()
    // this will be sufficient for most, but not all cases, eg: rectangle(calc(100%))
    var selector = "\\s*([^{}]*[^\\s])\\s*{[^\\}]*";
    var value = "\\s*:\\s*((?:[^;\\(]|\\([^\\)]*\\))*)\\s*;";

    var re, match;

    var rules = [], properties = ["shape-outside", "shape-margin", "shape-image-threshold"];
    properties.forEach(function(property) {
        re = new RegExp(selector + "(" + property + ")" + value, "ig");
        stylesheets.forEach(function(stylesheet) {
            while ((match = re.exec(stylesheet.cssText)) !== null) {
                rules.push({
                    selector: match[1],
                    property: match[2],
                    value: match[3]
                });
            }
        });
    });

    this.callback(rules);
};

scope.ShapesPolyfill = new Polyfill(scope);
})(window);
