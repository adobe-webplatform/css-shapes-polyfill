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
