/*
    "Copyright © 2014 Adobe Systems Incorporated. All rights reserved.

     Licensed under the Apache License, Version 2.0 (the “License”);
     you may not use this file except in compliance with the License.
     You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

     Unless required by applicable law or agreed to in writing, software
     distributed under the License is distributed on an “AS IS” BASIS,
     WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     See the License for the specific language governing permissions and
     limitations under the License."
*/

var polygon;
var dragVertexIndex = null;
var dragLineAnchor = null;
var hoverLocation = null;
var polygonVertexRadius = 9;
var mouseOver = null; // one of: null "polygon", "line", "lineTop", "lineBottom"
var line = new Rect(10, 50, 760, 10);

function getCanvas() { return document.getElementById("polygon-editor-canvas"); }

function drawPolygonVertexLabels(g, p)
{
    for (var i = 0; i < p.numberOfVertices; i++) {
        var vertex = p.vertexAt(i);
        if (vertex.hidden)
            continue;
        var dx = i < 10 ? 3 : 7;
        g.fillText(vertex.label, vertex.x - dx, vertex.y + 4);
    }
}

function drawVertex(g, vertex, r)
{
    g.beginPath();
    g.arc(vertex.x, vertex.y, r, 0, Math.PI*2, false)
    g.fill();
    g.closePath();
}

function drawPolygonVertices(g, p, r, normalVertexColor, elidedVertexColor)
{
    var edgeVertexIndices = [];
    for (var i = 0; i < p.numberOfEdges; i++)
        edgeVertexIndices.push(p.edgeAt(i).vertex1Index);

    for (var i = 0; i < p.numberOfVertices; i++) {
        g.fillStyle = (edgeVertexIndices.indexOf(i) != -1) ? normalVertexColor : elidedVertexColor;
        drawVertex(g, p.vertexAt(i), r);
    }
}

function drawPolygonEdges(g, p)
{
    if (p.numberOfVertices == 0)
        return;

    g.beginPath();
    for (var i = 0; i < p.numberOfVertices; i++) {
        var vertex = p.vertexAt(i);
        if (i == 0) 
            g.moveTo(vertex.x, vertex.y);
        else
            g.lineTo(vertex.x, vertex.y);
    }
    g.lineTo(p.vertexAt(0).x, p.vertexAt(0).y);
    g.stroke();
}

function drawShapeMarginEdges(g, p)
{
    var shapeMargin = p.shapeMargin;
    var edges = p.shapeMarginEdges;
    g.beginPath();
    for (var i = 0; i < edges.length; i++) {
        var edge = edges[i];
        g.moveTo(edge.vertex1.x, edge.vertex1.y);
        g.lineTo(edge.vertex2.x, edge.vertex2.y);
    }
    g.stroke();

    for (var i = 0; i < p.numberOfEdges; i++) {
        var edge = p.edgeAt(i);
        g.beginPath();
        g.arc(edge.vertex1.x, edge.vertex1.y, shapeMargin, 0, Math.PI*2, false)
        g.stroke();
    }
}

function draw() {
    var canvas = getCanvas();
    var g = canvas.getContext("2d");

    g.clearRect(0, 0, canvas.width, canvas.height);

    // line
    
    g.lineWidth = "2";
    g.strokeStyle = "rgba(255,161,0, 0.20)";
    g.fillStyle = mouseOver == "line" ? "rgba(255,161,0, 0.15)" : "rgba(255,161,0, 0.10)";
    g.fillRect(line.x, line.y, line.width, line.height);
    g.strokeRect(line.x, line.y, line.width, line.height);

    if (mouseOver == "lineTop") {
        g.strokeStyle = "rgba(255,161,0, 0.5)";
        g.strokeRect(line.x, line.y, line.width, 1);
    } else if (mouseOver == "lineBottom") {
        g.strokeStyle = "rgba(255,161,0, 0.5)";
        g.strokeRect(line.x, line.maxY, line.width, 1);
    }

    // bounds

    g.strokeStyle = "rgba(255,239,156, 0.20)";
    g.lineWidth = "1";
    g.strokeRect(polygon.bounds.x, polygon.bounds.y, polygon.bounds.width, polygon.bounds.height);

    // polygon

    g.strokeStyle = "rgba(238,236,230, 0.20)";
    g.fillStyle = "none";
    g.lineWidth = "1";
    drawShapeMarginEdges(g, polygon);

    g.strokeStyle = mouseOver == "polygon" ? "rgb(171,221,255)" : "rgb(238,236,230)";
    g.fillStyle = "none";
    g.lineWidth = "1";
    drawPolygonEdges(g, polygon);

    g.strokeStyle = "none";
    drawPolygonVertices(g, polygon, polygonVertexRadius, "rgb(255,161,0)", "rgba(255,161,0, 0.25)");

    g.font = "12px Arial";
    g.fillStyle = "black";
    drawPolygonVertexLabels(g, polygon);


    // line.left, line.right the polygon's exclusion edges

    g.fillStyle = "rgb(12,125,225)";
    if (line.left >= 0)
        g.fillRect(line.left - 1.5, line.y, 3, line.height);
    if (line.right >= 0)
        g.fillRect(line.right - 1.5, line.y, 3, line.height);

    g.strokeStyle = "rgba(255,161,0, 0.20)";
    g.fillStyle = mouseOver == "line" ? "rgba(255,161,0, 0.15)" : "rgba(255,161,0, 0.10)";
    if (line.left >= 0 && line.right >= 0) {
        g.fillRect(line.x + 1, line.y + 1, line.left - line.x - 4, line.height - 2);
        g.fillRect(line.right + 2, line.y + 1, line.maxX - line.right - 4, line.height - 2);
    }

}

// See http://paulbourke.net/geometry/pointlineplane/

function distanceToEdgeSquared(p1, p2, p3)
{
    var dx = p2.x - p1.x;
    var dy = p2.y - p1.y;
    
    if (dx == 0 || dy == 0) 
        return Number.POSITIVE_INFNITY;

    var u = ((p3.x - p1.x) * dx + (p3.y - p1.y) * dy) / (dx * dx + dy * dy);

    if (u < 0 || u > 1)
        return Number.POSITIVE_INFINITY;

    var x = p1.x + u * dx;  // closest point on edge p1,p2 to p3
    var y = p1.y + u * dy;

    return Math.pow(p3.x - x, 2) + Math.pow(p3.y - y, 2);
}

function polygonVertexNear(p)
{
    var thresholdDistanceSquared = polygonVertexRadius * polygonVertexRadius * 2;
    for (var i = 0; i < polygon.numberOfVertices; i++) {
        var vertex = polygon.vertexAt(i);
        var dx = vertex.x - p.x;
        var dy = vertex.y - p.y;
        if (dx*dx + dy*dy < thresholdDistanceSquared)
            return i;
    }
    return null;
}

function polygonEdgeNear(p)
{
    var thresholdDistanceSquared = polygonVertexRadius * polygonVertexRadius * 2;
    for (var i = 0; i < polygon.numberOfEdges; i++) {
        var edge = polygon.edgeAt(i);
        if (distanceToEdgeSquared(edge.vertex1, edge.vertex2, p) < thresholdDistanceSquared)
            return edge;
    }
    return null;
}

// See http://hansmuller-webkit.blogspot.com/2013/02/where-is-mouse.html
function canvasEventLocation(event)
{
    var canvas = getCanvas();
    var style = document.defaultView.getComputedStyle(canvas, null);

    function styleValue(property) {
        return parseInt(style.getPropertyValue(property), 10) || 0;
    }

    var scaleX = canvas.width / styleValue("width");
    var scaleY = canvas.height / styleValue("height");

    var canvasRect = canvas.getBoundingClientRect();
    var canvasX = scaleX * (event.clientX - canvasRect.left - canvas.clientLeft - styleValue("padding-left"));
    var canvasY = scaleY * (event.clientY - canvasRect.top - canvas.clientTop - styleValue("padding-top"))

    return {x: canvasX, y: canvasY};
}


function handleMouseDown(event)
{
    var eventXY = canvasEventLocation(event);

    if (polygon.closed) {
        dragVertexIndex = polygonVertexNear(eventXY);
        if (dragVertexIndex == null) {
            var edge = polygonEdgeNear(canvasEventLocation(event));
            if (edge != null) {
                var vertices = polygon.vertices();
                vertices.splice(edge.vertex2Index, 0, eventXY);
                polygon = createPolygon(vertices, polygon.fillRule, polygon.shapeMargin);
            }
        }
    }

    if (dragVertexIndex == null && (mouseOver == "line" || mouseOver == "lineTop" || mouseOver == "lineBottom"))
        dragLineAnchor = {point: eventXY, line: new Rect(line.x, line.y, line.width, line.height)};

    if (mouseOver == "polygon")
        getCanvas().focus();

    // The following appears to be the only way to prevent Chrome from showing the text select cursor.
    // For the record: hacks based on -webkit-user-select: none, or #canvas:focus,#canvas:active do not 
    // currently work.

    event.preventDefault();
    event.stopPropagation();

    draw();
}

function pointIsNearLine(p) {   // Return null, "line", "lineTop", or "lineBottom"
    if (p.x < line.x || p.x >= line.maxX)
        return null;

    var outsideThreshold = 4;
    var insideThreshold = Math.min(outsideThreshold, line.height / 2); // in case the line's height gets small

    function isCloseTo(y, threshold) { return y >= 0 && y <= threshold; }

    if (isCloseTo(line.y - p.y, outsideThreshold) || isCloseTo(p.y - line.y, insideThreshold))
        return "lineTop";
    if (isCloseTo(p.y - line.maxY, outsideThreshold) || isCloseTo(line.y - p.y, insideThreshold))
        return "lineBottom";
    return line.containsPoint(p) ? "line" : null;
}

function handleMouseMove(event)
{
    var canvas = getCanvas()
    var eventXY = canvasEventLocation(event);
    var redrawRequired = false;

    if (dragVertexIndex != null) {
        var eventXY = canvasEventLocation(event);
        polygon.vertexAt(dragVertexIndex).x = eventXY.x;
        polygon.vertexAt(dragVertexIndex).y = eventXY.y;
        polygon = createPolygon(polygon.vertices(), polygon.fillRule, polygon.shapeMargin);
        computeLineExclusionEdges();
        redrawRequired = true;
    } else if (dragLineAnchor != null) {
        if (mouseOver == "line") {
            line.y = dragLineAnchor.line.y + (eventXY.y - dragLineAnchor.point.y);
            line.y = Math.min(Math.max(0, line.y), canvas.height - line.height);
        }
        else if (mouseOver == "lineTop") {
            var newY = dragLineAnchor.line.y + eventXY.y - dragLineAnchor.point.y;
            newY = Math.min(Math.max(0, newY), line.maxY - 3);
            line.shiftTopEdgeTo(newY);
        }
        else if (mouseOver == "lineBottom") {
            var newY = dragLineAnchor.line.maxY + eventXY.y - dragLineAnchor.point.y;
            newY = Math.max(Math.min(newY, canvas.height), line.y + 3);
            line.shiftBottomEdgeTo(newY);
        }
        computeLineExclusionEdges();
        redrawRequired = true;
    } else {
        var mouseIsOverLine = pointIsNearLine(eventXY);
        if (mouseOver != mouseIsOverLine) {
            mouseOver = mouseIsOverLine;
            redrawRequired = true;
        }

        var mouseWasWithinPolygon = mouseOver == "polygon";
        var mouseIsWithinPolygon = polygon.containsPoint(eventXY);
        if (mouseWasWithinPolygon != mouseIsWithinPolygon) {
            mouseOver = mouseIsWithinPolygon ? "polygon" : null;
            redrawRequired = true;
        }
    }

    if (polygonVertexNear(eventXY) != null)
        canvas.style.cursor = "default";
    else if (mouseOver == "line" || mouseOver == "lineTop" || mouseOver == "lineBottom")
        canvas.style.cursor = "ns-resize";
    else
        canvas.style.cursor = "default";

    if (redrawRequired)
        draw();
}

function handleMouseUp(event) {
    dragVertexIndex = null;
    dragLineAnchor = null;
    draw();
}

function changeShapeMargin(delta) {
    shapeMargin = Math.max(0, Math.min(128, polygon.shapeMargin + delta))
    polygon = createPolygon(polygon.vertices(), polygon.fillRule, shapeMargin);
    computeLineExclusionEdges();
    draw();
}

function handleMouseWheel(event) {
    if (mouseOver != "polygon") 
        return;
    event.preventDefault();
    changeShapeMargin(event.wheelDelta > 0 ? +1 : -1);
}

function handleKeyDown(event) {
    if (mouseOver != "polygon") 
        return;
    switch(event.keyCode == 0 ? event.charCode : event.keyCode) {
    case 38:  // up arrow
        changeShapeMargin(+1);
        event.preventDefault();
        break;
    case 40: // down arrow
        changeShapeMargin(-1);
        event.preventDefault();
        break;
    }
}

function createPolygon(vertices, fillRule, shapeMargin) {
    var p = new Polygon(vertices, fillRule, shapeMargin);
    for (var i = 0; i < p.numberOfVertices; i++)
        p.vertexAt(i).label = String(i);
    p.closed = true;
    return p;
}

function computeLineExclusionEdges() {
    var y1 = line.y;
    var y2 = y1 + line.height;
    if (polygon.overlapsYRange(y1, y2)) {
        line.left = polygon.leftExclusionEdge(y1, y2);
        line.right = polygon.rightExclusionEdge(y1, y2);
    }
    else
        line.left = line.right = -1;
}

function compareVertexYIncreasing(vertex1, vertex2) { return vertex2.y - vertex1.y; }

function computeRightMostEdgeSegments() {
    // TBD: remove horizontal edges
    var result = [];
    var vertices = polygon.vertices().sort(compareVertexYIncreasing);
    for (var i = 0; i < vertices.length - 1; i++) {
        var edges = polygon.edgesThatOverlapYRange(vertices[i].y, vertices[i+1].y);
        var edgeWithMaxX = edges[0];
        for (var j = 1; j < edges.length; j++) {
            if (edges[j].maxX > edgeWithMaxX.maxX)
                edgeWithMaxX = edges[j];
            /* 
            else if (edges[j].maxX == edgeWithMaxX.maxX ... then pick the edge whose slope is greater 
            */

        }

        if (result.length == 0 || result[result.length - 1] !== edgeWithMaxX)
            result.push(edgeWithMaxX);
    }
    console.log(result);

}


function genPolygonCSS() {
    function normalizeVertex(v) { return {x: v.x - polygon.bounds.x, y: v.y - polygon.bounds.y}; }
    var vertices = polygon.vertices().map(normalizeVertex);

    function toCSSVertexText(v) { return v.x + "px " + v.y + "px";  }
    var cssPolygonText = "polygon(" + vertices.map(toCSSVertexText).join(", ") + ")"; // polygon(x y, x y, ...)

    function toSVGVertexText(v) { return v.x + "," + v.y;  }
    var svgPolygonText = "<polygon points='" + vertices.map(toSVGVertexText).join(" ") + "'/>"; // <polygon points='x,y x,y ...'/>
    var svgBoundsText = "width='" + polygon.bounds.width + "px' height='" + polygon.bounds.height + "px'";
    var svgDataURL = "url(data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' " + svgBoundsText + ">" + svgPolygonText + "</svg>)";

    return {css: cssPolygonText, svg: svgPolygonText, svgDataURL: svgDataURL};
}

function init() 
{
    var polygonVertices = [{x:200, y:200}, {x:400, y:200}, {x:450, y:300}, {x:150, y:300}];
    //var polygonVertices = [{x:300, y:200}, {x:400, y:200}, {x:400, y:300}, {x:350, y:300}, {x:200, y:300}, {x:200, y:200}];
    // var polygonVertices = [{x:0, y:0}, {x:200, y:0}, {x:200, y:200}, {x:0, y:200}];
    //var polygonVertices = [{x:241, y:82}, {x:51, y:16}, {x:210, y:163}, {x:124, y:234}, {x:16, y:198}, {x:211, y:0}, {x:0, y:133}];

    var canvas = getCanvas();
    canvas.addEventListener("mousedown", handleMouseDown, false);
    canvas.addEventListener("mousemove", handleMouseMove, false);
    canvas.addEventListener("mouseup", handleMouseUp, false);
    canvas.addEventListener ("mousewheel", handleMouseWheel, false);
    canvas.addEventListener ("keydown", handleKeyDown, false);

    line.width = canvas.width - 2 * line.x;

    polygon = createPolygon(polygonVertices, "evenodd", 0);
    computeLineExclusionEdges();
    draw();
}

init();
