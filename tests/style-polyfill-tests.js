var StylePolyfillTests = function() {

function register(mocha, expect) {
    mocha.setup('bdd');

    var styleTests = {
        tests: [
        {
            name: 'shape-outside',
            css: ".shape-outside { shape-outside: circle(); }",
            rules: [
            {
                selector: '.shape-outside',
                property: 'shape-outside',
                value: 'circle()'
            }
            ]
        },
        {
            name: 'shape-margin',
            css: ".shape-margin { shape-margin: 5px; }",
            rules: [
            {
                selector: '.shape-margin',
                property: 'shape-margin',
                value: '5px'
            }
            ]
        },
        {
            name: 'shape-image-threshold',
            css: ".shape-image-threshold { shape-image-threshold: 0.5; }",
            rules: [
            {
                selector: '.shape-image-threshold',
                property: 'shape-image-threshold',
                value: '0.5'
            }
            ]
        },
        {
            name: 'shape-outside, shape-margin, shape-image-threshold',
            css: ".shape-outside { shape-outside: circle(); shape-margin: 5px; shape-image-threshold: 0.5; }",
            rules: [
            {
                selector: '.shape-outside',
                property: 'shape-outside',
                value: 'circle()'
            },
            {
                selector: '.shape-outside',
                property: 'shape-margin',
                value: '5px'
            },
            {
                selector: '.shape-outside',
                property: 'shape-image-threshold',
                value: '0.5'
            }
            ]
        },
        {
            name: 'embedded with other rules',
            css: '.img { width: 100px; height: 100px; }' +
                '.shape { background-color: rgba(0, 0, 255, 0.5); shape-outside: circle(); shape-margin: 5px; shape-image-threshold: 0.5; float: left; }' +
                'p { margin: 5px; border: 1px solid red; }',
            rules: [
            {
                selector: '.shape',
                property: 'shape-outside',
                value: 'circle()'
            },
            {
                selector: '.shape',
                property: 'shape-margin',
                value: '5px'
            },
            {
                selector: '.shape',
                property: 'shape-image-threshold',
                value: '0.5'
            }
            ]
        }
        ],
        runTest: function(test) {
            var fn = test.only ? it.only : it;
            fn(test.name, function(done) {
                var style = document.createElement('style');
                style.type = 'text/css';
                style.appendChild(document.createTextNode(test.css));
                document.head.appendChild(style);

                var containsRule = function(ruleIn, rulesIn) {
                    var result = false;
                    rulesIn.forEach(function(rule) {
                        if (rule.selector === ruleIn.selector
                            && rule.property === ruleIn.property
                            && rule.value === ruleIn.value)
                            result = true;
                    });
                    return result;
                }

                var callback = function(rules) {
                    expect(rules.length).to.equal(test.rules.length);
                    test.rules.forEach(function(rule) {
                        expect(containsRule(rule, rules)).to.be.true;
                    });
                    document.head.removeChild(style);
                    done();
                }

                new StylePolyfill(callback);
            })
        }
    }

    function generateSuite(name, testSet) {
        describe(name, function() {
            testSet.tests.forEach(function(test) {
                testSet.runTest(test);
            });
        });
    }

    generateSuite('Simple Shape CSS Values', styleTests);
}

return {
    'register': register
}
}()
