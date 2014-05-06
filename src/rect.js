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

// FIXME: replace the zeroRadii mess

function Size(width, height) {
    this.width = width;
    this.height = height;
}

Object.defineProperty(Size, "zeroSize", {value:{width:0, height:0}, writeable:false});

Object.defineProperty(Size.prototype, "isEmpty", {
    get: function() { return this.width <= 0 || this.height <= 0; }
});

Size.prototype.scale = function(factor) {
    this.width *= factor;
    this.height *= factor;
};

function Rect(x, y, width, height) { 
    this.x = x;
    this.y = y; 
    this.width = width; 
    this.height = height;
}

Object.defineProperty(Rect.prototype, "isEmpty", {
    get: function() { return this.width <= 0 || this.height <= 0; }
});

Object.defineProperty(Rect.prototype, "maxX", {
    get: function () { return this.x + this.width; },
    set: function (value) { this.width = value - this.x; }
});

Object.defineProperty(Rect.prototype, "maxY", {
    get: function () { return this.y + this.height; },
    set: function (value) { this.height = value - this.y; }
});

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
    return !this.isEmpty && maxY >= this.y && minY < this.maxY;
};

Rect.prototype.overlapsXRange = function(minX, maxX) {
    return !this.isEmpty && maxX >= this.x && minX < this.maxX;
};

function RoundedRect(rect, topLeft, topRight, bottomLeft, bottomRight) { // corner radii parameters are {width, height}
    this.rect = rect;
    this.radii = {topLeft: topLeft, topRight: topRight, bottomLeft: bottomLeft, bottomRight: bottomRight};
}

Object.defineProperty(RoundedRect.prototype, "isEmpty", {
    get: function() { return this.width <= 0 || this.height <= 0; }
});

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
    if (radii.topLeft.isEmpty)
        radii.topLeft = Size.zeroSize;

    radii.topRight.scale(factor);
    if (radii.topRight.isEmpty)
        radii.topRight = Size.zeroSize;

    radii.bottomLeft.scale(factor);
    if (radii.bottomLeft.isEmpty)
        radii.bottomLeft = Size.zeroSize;

    radii.bottomRight.scale(factor);
    if (radii.bottomRight.isEmpty)
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
    if (this.rect.isEmpty || !this.rect.overlapsYRange(y1, y2))
        return undefined;

    if (!this.isRounded() || this.cornersInsetRect().overlapsYRange(y1, y2))
        return this.rect.maxX;

    return Math.max(this.maxXInterceptAt(y1, this.rect.x), this.maxXInterceptAt(y2, this.rect.x));
};

RoundedRect.prototype.leftExclusionEdge = function(y1, y2) { // y2 >= y1
    if (this.rect.isEmpty || !this.rect.overlapsYRange(y1, y2))
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

RoundedRect.prototype.leftExclusionOffsets = function(y1, y2, areaLimit) { // y2 >= y1
    if (!this.rect.overlapsYRange(y1, y2))
        return [{x: undefined, height: y2 - y1}];

    var offsets = [];

    if (y1 < this.rect.y)
        offsets.push({x: undefined, height: this.rect.y - y1});

    var topLeftCorner = this.topLeftCorner(), offsetHeight, maxY, xi, yi, y;
    if (topLeftCorner.overlapsYRange(y1, y2)) {
        offsetHeight = computeOffsetHeight(topLeftCorner.width, topLeftCorner.height, areaLimit);
        maxY = Math.min(topLeftCorner.maxY, y2);
        for (y = topLeftCorner.y; y < maxY; y += offsetHeight) {
            yi = topLeftCorner.maxY - Math.min(y + offsetHeight, maxY);
            xi = ellipseXIntercept(yi, topLeftCorner.width, topLeftCorner.height);
            offsets.push({height: Math.min(offsetHeight, maxY - y), x: topLeftCorner.maxX - xi});
        }
    }

    var cornersInsetRect = this.cornersInsetRect();
    if (cornersInsetRect.overlapsYRange(y1, y2))
        offsets.push({x: this.rect.x, height: cornersInsetRect.height});

    var bottomLeftCorner = this.bottomLeftCorner();
    if (bottomLeftCorner.overlapsYRange(y1, y2)) {
        offsetHeight = computeOffsetHeight(bottomLeftCorner.width, bottomLeftCorner.height, areaLimit);
        maxY = Math.min(bottomLeftCorner.maxY, y2);
        for (y = bottomLeftCorner.y; y < maxY; y += offsetHeight) {
            yi = y - bottomLeftCorner.y;
            xi = ellipseXIntercept(yi, bottomLeftCorner.width, bottomLeftCorner.height);
            offsets.push({height: Math.min(offsetHeight, maxY - y), x: bottomLeftCorner.maxX - xi});
        }
    }

    if (y2 > this.rect.maxY)
        offsets.push({x: undefined, height: y2 - this.rect.maxY});

    return offsets;
};

RoundedRect.prototype.rightExclusionOffsets = function(y1, y2, areaLimit) { // y2 >= y1
    if (!this.rect.overlapsYRange(y1, y2))
        return [{x: undefined, height: y2 - y1}];

    var offsets = [];

    if (y1 < this.rect.y)
        offsets.push({x: undefined, height: this.rect.y - y1});

    var topRightCorner = this.topRightCorner(), offsetHeight, maxY, y, yi, xi;
    if (topRightCorner.overlapsYRange(y1, y2)) {
        offsetHeight = computeOffsetHeight(topRightCorner.width, topRightCorner.height, areaLimit);
        maxY = Math.min(topRightCorner.maxY, y2);
        for (y = topRightCorner.y; y < maxY; y += offsetHeight) {
            yi = topRightCorner.maxY - Math.min(y + offsetHeight, maxY);
            xi = ellipseXIntercept(yi, topRightCorner.width, topRightCorner.height);
            offsets.push({height: Math.min(offsetHeight, maxY - y), x: topRightCorner.x + xi});
        }
    }

    var cornersInsetRect = this.cornersInsetRect();
    if (cornersInsetRect.overlapsYRange(y1, y2))
        offsets.push({x: this.rect.maxX, height: cornersInsetRect.height});

    var bottomRightCorner = this.bottomRightCorner();
    if (bottomRightCorner.overlapsYRange(y1, y2)) {
        offsetHeight = computeOffsetHeight(bottomRightCorner.width, bottomRightCorner.height, areaLimit);
        maxY = Math.min(bottomRightCorner.maxY, y2);
        for (y = bottomRightCorner.y; y < maxY; y += offsetHeight) {
            yi = y - bottomRightCorner.y;
            xi = ellipseXIntercept(yi, bottomRightCorner.width, bottomRightCorner.height);
            offsets.push({height: Math.min(offsetHeight, maxY - y), x: bottomRightCorner.x + xi});
        }
    }

    if (y2 > this.rect.maxY)
        offsets.push({x: undefined, height: y2 - this.rect.maxY});

    return offsets;
};
