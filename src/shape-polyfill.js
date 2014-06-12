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
