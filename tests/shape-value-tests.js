var ShapeValueTests = function() {

function register(mocha, expect) {
    mocha.setup('bdd');
    var insetTests = [
    {
        name: 'should accept no values',
        input: 'inset()',
        output: 'inset(0 0 0 0 round 0 0 0 0 / 0 0 0 0)'
    },
    {
        name: 'should accept 1 length',
        input: 'inset(1px)',
        output: 'inset(1 1 1 1 round 0 0 0 0 / 0 0 0 0)'
    },
    {
        name: 'should accept 2 lengths',
        input: 'inset(1px 2px)',
        output: 'inset(1 2 1 2 round 0 0 0 0 / 0 0 0 0)'
    },
    {
        name: 'should accept 3 lengths',
        input: 'inset(1px 2px 3px)',
        output: 'inset(1 2 3 2 round 0 0 0 0 / 0 0 0 0)'
    },
    {
        name: 'should accept 4 lengths',
        input: 'inset(1px 2px 3px 4px)',
        output: 'inset(1 2 3 4 round 0 0 0 0 / 0 0 0 0)'
    },
    {
        name: 'should accept 1 radius',
        input: 'inset(round 1px)',
        output: 'inset(0 0 0 0 round 1 1 1 1 / 1 1 1 1)'
    },
    {
        name: 'should accept 2 radii',
        input: 'inset(round 1px 2px)',
        output: 'inset(0 0 0 0 round 1 2 1 2 / 1 2 1 2)'
    },
    {
        name: 'should accept 3 radii',
        input: 'inset(round 1px 2px 3px)',
        output: 'inset(0 0 0 0 round 1 2 3 2 / 1 2 3 2)'
    },
    {
        name: 'should accept 4 radii',
        input: 'inset(round 1px 2px 3px 4px)',
        output: 'inset(0 0 0 0 round 1 2 3 4 / 1 2 3 4)'
    },
    {
        name: 'should accept 1 right radii',
        input: 'inset(round 1px / 2px)',
        output: 'inset(0 0 0 0 round 1 1 1 1 / 2 2 2 2)'
    },
    {
        name: 'should accept 2 right radii',
        input: 'inset(round 0px / 1px 2px)',
        output: 'inset(0 0 0 0 round 0 0 0 0 / 1 2 1 2)'
    }
    ];

    var ellipseTests = [
    {
        name: 'should accept 0 values',
        input: 'ellipse()',
        output: 'ellipse(50 50 at 50 50)'
    },
    {
        name: 'should accept percentages and lengths',
        input: 'ellipse(1% 10px)',
        output: 'ellipse(1 10 at 50 50)'
    },
    {
        name: 'should accept 1 position value',
        input: 'ellipse(at top)',
        output: 'ellipse(50 0 at 50 0)'
    },
    {
        name: 'should accept 2 position value',
        input: 'ellipse(at top left)',
        output: 'ellipse(0 0 at 0 0)'
    },
    {
        name: 'should accept 3 position value',
        input: 'ellipse(at left top 10%)',
        output: 'ellipse(0 10 at 0 10)'
    },
    {
        name: 'should accept 4 position value',
        input: 'ellipse(at right 10px bottom 20px)',
        output: 'ellipse(10 20 at 90 80)'
    },
    {
        name: 'should accept radius and position values',
        input: 'ellipse(10px 20px at left 30px top 40px)',
        output: 'ellipse(10 20 at 30 40)'
    }
    ];

    var circleTests = [
    {
        name: 'should accept 0 values',
        input: 'circle()',
        output: 'circle(50 at 50 50)'
    },
    {
        name: 'should accept both r and position arguments',
        input: 'circle(10% at bottom 10% right 10%)',
        output: 'circle(10 at 90 90)'
    }
    ];

    var polygonTests = [
    {
        name: 'should accept 1 point',
        input: 'polygon(1px 2px)',
        output: 'polygon(nonzero, 1 2)'
    },
    {
        name: 'should accept fill-rule and multiple points',
        input: 'polygon(evenodd, 1px 2px, 3px 4px, 5px 6px)',
        output: 'polygon(evenodd, 1 2, 3 4, 5 6)'
    }
    ];

    function metricsFromStyles(styles) {
        var elem = document.createElement('div');
        for (var prop in styles)
            elem.style.setProperty(prop, styles[prop]);
        document.body.appendChild(elem);
        var metrics = new Metrics(elem);
        document.body.removeChild(elem);
        return metrics;
    }

    var boxTests = {
        styles: {
            margin: '5px 10px 15px 20px',
            'border-width': '5px 10px 15px 20px',
            'border-style': 'solid',
            'border-color': 'transparent',
            padding: '5px 10px 15px 20px',
            'border-radius': '10px 20px 30px 40px',
            'box-sizing': 'border-box',
            width: '100px',
            height: '100px'
        },
        tests: [
        {
            name: 'margin-box',
            input: 'margin-box',
            output: 'margin-box { x: -20, y: -5, width: 130, height: 120, radii: 27.5 30 40 60 / 15 25 45 55 }'
        },
        {
            name: 'border-box',
            input: 'border-box',
            output: 'border-box { x: 0, y: 0, width: 100, height: 100, radii: 10 20 30 40 / 10 20 30 40 }'
        },
        {
            name: 'padding-box',
            input: 'padding-box',
            output: 'padding-box { x: 20, y: 5, width: 70, height: 80, radii: 0 10 20 20 / 5 15 15 25 }'
        },
        {
            name: 'content-box',
            input: 'content-box',
            output: 'content-box { x: 40, y: 10, width: 40, height: 60, radii: 0 0 10 0 / 0 10 0 10 }'
        }
        ],
        runTest: function(test) {
            var fn = test.only ? it.only : it;
            var metrics = new metricsFromStyles(boxTests.styles);
            fn(test.name, function() {
                var value = new ShapeValue({
                    shapeOutside: test.input,
                    'metrics': metrics
                });
                var output = value.printBox();
                expect(output).to.equal(test.output);
            })
        }
    }

    var boxShapeTests = {
        styles: {
            margin: '5px 10px 15px 20px',
            'border-width': '5px 10px 15px 20px',
            'border-style': 'solid',
            'border-color': 'transparent',
            padding: '5px 10px 15px 20px',
            'border-radius': '10px 20px 30px 40px',
            'box-sizing': 'border-box',
            width: '100px',
            height: '100px'
        },
        tests: [
        {
            name: 'circle() margin-box',
            input: 'circle() margin-box',
            shape: 'circle(60 at 65 60)',
            box: 'margin-box { x: -20, y: -5, width: 130, height: 120, radii: 27.5 30 40 60 / 15 25 45 55 }'
        },
        {
            name: 'circle() border-box',
            input: 'circle() border-box',
            shape: 'circle(50 at 50 50)',
            box: 'border-box { x: 0, y: 0, width: 100, height: 100, radii: 10 20 30 40 / 10 20 30 40 }',
        },
        {
            name: 'circle() padding-box',
            input: 'circle() padding-box',
            shape: 'circle(35 at 35 40)',
            box: 'padding-box { x: 20, y: 5, width: 70, height: 80, radii: 0 10 20 20 / 5 15 15 25 }'
        },
        {
            name: 'circle() content-box',
            input: 'circle() content-box',
            shape: 'circle(20 at 20 30)',
            box: 'content-box { x: 40, y: 10, width: 40, height: 60, radii: 0 0 10 0 / 0 10 0 10 }'
        }
        ],
        runTest: function(test) {
            var fn = test.only ? it.only : it;
            fn(test.name, function() {
                var metrics = metricsFromStyles(boxShapeTests.styles);
                var value = new ShapeValue({
                    shapeOutside: test.input,
                    'metrics': metrics
                });
                var output = value.printShape();
                expect(output).to.equal(test.shape);
                output = value.printBox();
                expect(output).to.equal(test.box);
            })
        }
    }

    function generateBasicShapeSuite(name, tests) {
        var styles = {
            margin: '0',
            border: 'none',
            'border-radius': '0',
            padding: '0',
            width: '100px',
            height: '100px',
            float: 'left'
        };
        describe(name, function() {
            tests.forEach(function(test) {
                var metrics = metricsFromStyles(styles);
                var fn = test.only ? it.only : it;
                fn(test.name, function() {
                    var shape = new ShapeValue({
                        shapeOutside: test.input,
                        'metrics': metrics
                    });
                    var output = shape.printShape();
                    expect(output).to.equal(test.output);
                });
            });
        });
    }

    function generateSuite(name, tests) {
        describe(name, function() {
            tests.tests.forEach(function(test) {
                tests.runTest(test);
            });
        });
    }

    function printShape(shape) { return shape.printShape(); }
    function printBox(shape) { return shape.printBox(); }

    describe('Shape Parsing', function() {
        generateBasicShapeSuite('inset', insetTests);

        generateBasicShapeSuite('ellipse', ellipseTests);

        generateBasicShapeSuite('circle', circleTests);

        generateBasicShapeSuite('polygon', polygonTests);
    })

    generateSuite('Box Parsing', boxTests);

    generateSuite('Box Shape Parsing', boxShapeTests);
}

return {
    'register': register
}
}();