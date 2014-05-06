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
