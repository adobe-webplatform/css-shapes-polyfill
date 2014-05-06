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
}

Object.defineProperty(RasterIntervals, "none", {value:{}, writeable:false});

Object.defineProperty(RasterIntervals.prototype, "minY", { get: function() { return -this.yOffset; } });
Object.defineProperty(RasterIntervals.prototype, "maxY", { get: function() { return this.size - this.yOffset; } });

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

RasterIntervals.prototype.computeBounds = function() {
    var minX, maxX, minY, maxY;
    for (var y = this.minY; y < this.maxY; y++) {
        var intervalAtY = this.intervalAt(y);
        if (intervalAtY === RasterIntervals.none)
            continue;
        if (minY === undefined)
            minY = maxY = y;
        else
            maxY = y;
        minX = (minX === undefined) ? intervalAtY.startX : Math.min(minX, intervalAtY.startX);
        maxX = (maxX === undefined) ? intervalAtY.endX : Math.max(maxX, intervalAtY.endX);
    }
    return new Rect(minX, minY, maxX - minX + 1, maxY - minY + 1);
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

function RasterImage(image) {
    this.width = image.width;
    this.height = image.height;

    var canvas = document.createElement("canvas");
    canvas.width = this.width;
    canvas.height = this.height;
    var g = canvas.getContext("2d");
    g.drawImage(image, 0, 0);
    try {
        this.imageData = g.getImageData(0, 0, this.width, this.height); // row major byte array of pixels, 4 bytes per pixel: RGBA
    } catch (e) {
        console.error(e);
    }
}

RasterImage.prototype.alphaAt = function(x, y) { return this.imageData.data[(x * 4 + 3) + y * this.width * 4]; };

RasterImage.prototype.computeIntervals = function(threshold, clip) {
    var intervals = new RasterIntervals(-clip.y, clip.height);
    for (var y = 0; y < this.height; y++) {
        var startX = -1;
        for (var x = 0; x < this.width; x++) {
            var alpha = this.alphaAt(x, y);
            if (startX == -1 && alpha > threshold) {
                startX = x;
                if (intervals.intervalAt(y) === RasterIntervals.none)
                    intervals.setIntervalAt(y, new RasterInterval(y, startX, this.width));
            } else if (startX != -1 && alpha <= threshold) {
                intervals.intervalAt(y).endX = x;
                startX = -1;
            }
        }
    }
    return intervals;
};

function Raster(url, shapeImageThreshold, shapeMargin, clip, whenReady) {
    this.url = url;
    this.shapeImageThreshold = (256 * shapeImageThreshold);
    this.shapeMargin = shapeMargin;
    this.image = new Image();
    this.clip = clip;

    var raster = this;
    this.image.onload = function(event) {
        try {
            initRaster(raster, clip);
        } catch(e) {
            console.error("An error occurred while loading the image ", url, e);
        }
        whenReady();
    };

    this.image.onerror = function() {
        // FIXME: We need more graceful error handling, but this will do for now
        console.error("Unable to load the image ", url);
    };

    this.image.src = url;
}

function initRaster(raster, clip) {
    var image = new RasterImage(raster.image);
    raster.intervals = image.computeIntervals(raster.shapeImageThreshold, clip);
    if (raster.shapeMargin > 0)
        raster.intervals = raster.intervals.computeMarginIntervals(raster.shapeMargin, clip);
    raster.bounds = raster.intervals.computeBounds();
    raster.image = undefined;
}

Raster.prototype.rightExclusionEdge = function (y1, y2) { // y2 >= y1
    var intervals = this.intervals;
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
    var x; // = undefined;
    for (var y = Math.max(y1, this.clip.y); y <= y2 && y < this.clip.maxY; y++) {
        var startX = intervals.intervalAt(y).startX;
        if (x === undefined || (startX !== undefined && startX < x))
            x = startX;
    }
    return x;
};
