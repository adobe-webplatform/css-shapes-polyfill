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
