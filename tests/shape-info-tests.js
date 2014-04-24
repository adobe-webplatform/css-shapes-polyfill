var ShapeInfoTests = function() {

function register(mocha, expect) {
    mocha.setup('bdd');

    var offsetTests = {
        styles: {
                margin: '0',
                border: 'none',
                padding: '0',
                width: '100px',
                height: '100px',
                cssFloat: 'left'
        },
        tests: [
        {
            name: 'for inset',
            shapeOutside: 'inset(21px 20px)',
            step: 20,
            output: [
                { top: 0, bottom: 20, offset: 0, cssFloat: 'left' },
                { top: 20, bottom: 40, offset: 80, cssFloat: 'left' },
                { top: 40, bottom: 60, offset: 80, cssFloat: 'left' },
                { top: 60, bottom: 80, offset: 80, cssFloat: 'left' },
                { top: 80, bottom: 100, offset: 0, cssFloat: 'left' }
            ]
        },
        {
            name: 'for inset on the content-box',
            shapeOutside: 'inset(1px 0px) content-box',
            styles: {
                margin: '20px',
                width: '80px',
                height: '80px',
            },
            step: 20,
            output: [
                { top: 0, bottom: 20, offset: 0, cssFloat: 'left' },
                { top: 20, bottom: 40, offset: 100, cssFloat: 'left' },
                { top: 40, bottom: 60, offset: 100, cssFloat: 'left' },
                { top: 60, bottom: 80, offset: 100, cssFloat: 'left' },
                { top: 80, bottom: 100, offset: 100, cssFloat: 'left' },
                { top: 100, bottom: 120, offset: 0, cssFloat: 'left' }
            ]
        },
        {
            name: 'for margin-box',
            shapeOutside: 'margin-box',
            styles: {
                margin: '50px',
                width: '80px',
                height: '80px',
            },
            step: 20,
            output: [
                { top: 0, bottom: 20, offset: 180, cssFloat: 'left' },
                { top: 20, bottom: 40, offset: 180, cssFloat: 'left' },
                { top: 40, bottom: 60, offset: 180, cssFloat: 'left' },
                { top: 60, bottom: 80, offset: 180, cssFloat: 'left' },
                { top: 80, bottom: 100, offset: 180, cssFloat: 'left' },
                { top: 100, bottom: 120, offset: 180, cssFloat: 'left' },
                { top: 120, bottom: 140, offset: 180, cssFloat: 'left' },
                { top: 140, bottom: 160, offset: 180, cssFloat: 'left' },
                { top: 160, bottom: 180, offset: 180, cssFloat: 'left' },
                { top: 180, bottom: 200, offset: 0, cssFloat: 'left' }
            ]
        },
        {
            name: 'for inset with shape-margin applied',
            shapeOutside: 'inset(31px 30px)',
            shapeMargin: '10px',
            step: 20,
            output: [
                { top: 0, bottom: 20, offset: 0, cssFloat: 'left' },
                { top: 20, bottom: 40, offset: 80, cssFloat: 'left' },
                { top: 40, bottom: 60, offset: 80, cssFloat: 'left' },
                { top: 60, bottom: 80, offset: 80, cssFloat: 'left' },
                { top: 80, bottom: 100, offset: 0, cssFloat: 'left' }
            ]
        },
        {
            name: 'for circle',
            shapeOutside: 'circle(24px)',
            step: 25,
            output: [
                { top: 0, bottom: 25, offset: 0, cssFloat: 'left' },
                { top: 25, bottom: 50, offset: 74, cssFloat: 'left' },
                { top: 50, bottom: 75, offset: 74, cssFloat: 'left' },
                { top: 75, bottom: 100, offset: 0, cssFloat: 'left' }
            ]
        },
        {
            name: 'for ellipse',
            shapeOutside: 'ellipse(24px 24px)',
            step: 25,
            output: [
                { top: 0, bottom: 25, offset: 0, cssFloat: 'left' },
                { top: 25, bottom: 50, offset: 74, cssFloat: 'left' },
                { top: 50, bottom: 75, offset: 74, cssFloat: 'left' },
                { top: 75, bottom: 100, offset: 0, cssFloat: 'left' }
            ]
        },
        {
            name: 'for polygon',
            shapeOutside: 'polygon(20px 21px, 80px 21px, 80px 79px, 20px 79px)',
            step: 20,
            output: [
                { top: 0, bottom: 20, offset: 0, cssFloat: 'left' },
                { top: 20, bottom: 40, offset: 80, cssFloat: 'left' },
                { top: 40, bottom: 60, offset: 80, cssFloat: 'left' },
                { top: 60, bottom: 80, offset: 80, cssFloat: 'left' },
                { top: 80, bottom: 100, offset: 0, cssFloat: 'left' }
            ]
        }
        ],
        runTest: function(test) {
            var fn = test.only ? it.only : it;
            fn(test.name, function() {
                var el = document.createElement('div');
                for (var prop in offsetTests.styles)
                    el.style[prop] = offsetTests.styles[prop];
                for (prop in test.styles)
                    el.style[prop] = test.styles[prop];
                el.setAttribute('data-shape-outside', test.shapeOutside);
                if (test.shapeMargin)
                    el.setAttribute('data-shape-margin', test.shapeMargin);

                document.body.appendChild(el);
                var shapeInfo = new ShapeInfo(el);
                document.body.removeChild(el);

                var offsets;
                shapeInfo.onReady(function() {
                    // count on this executing immediately except for images
                    offsets = shapeInfo.offsets({mode: "step", step: test.step});
                });

                test.output.forEach(function(output, i) {
                    for (var prop in output)
                        expect(offsets[i][prop]).to.equal(output[prop]);
                });
            })
        }
    }

    function generateTests(testSet) {
        testSet.tests.forEach(function(test) {
            testSet.runTest(test);
        });
    }

    describe('ShapeInfo.offsets', function() {
        generateTests(offsetTests);
    })
}

return {
    'register': register
}
}()
