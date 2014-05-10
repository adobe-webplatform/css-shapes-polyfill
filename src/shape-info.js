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
