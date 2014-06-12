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
