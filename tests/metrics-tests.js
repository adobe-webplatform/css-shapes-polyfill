var MetricsTests = function() {

function register(mocha, expect) {
    mocha.setup('bdd');

    var basicSuite = {
        name: 'Simple Metrics Validation',
        tests: [
        {
            name: 'all styles set in px',
            styles: {
                margin: '10px',
                border: '10px solid red',
                padding: '10px',
                width: '100px',
                height: '100px',
                borderRadius: '10px'
            },
            output: {
                margins: [10, 10, 10, 10],
                borders: [10, 10, 10, 10],
                paddings: [10, 10, 10, 10],
                marginBox: { x: -10, y: -10, width: 160, height: 160 },
                borderBox: { x: 0, y: 0, width: 140, height: 140, radii: [[10, 10], [10, 10], [10, 10], [10, 10]] }
            }
        },
        {
            name: 'all styles set in em',
            styles: {
                margin: '10em',
                border: '10em solid red',
                padding: '10em',
                width: '100em',
                height: '100em',
                borderRadius: '10em',
                fontSize: '10px'
            },
            output: {
                margins: [100, 100, 100, 100],
                borders: [100, 100, 100, 100],
                paddings: [100, 100, 100, 100],
                marginBox: { x: -100, y: -100, width: 1600, height: 1600 },
                borderBox: { x: 0, y: 0, width: 1400, height: 1400, radii: [[100, 100], [100, 100], [100, 100], [100, 100]] }
            }
        },
        {
            name: 'styles set in %',
            parentStyles: {
                width: '100px',
                height: '100px',
            },
            styles: {
                margin: '10%',
                border: '10px solid red', // border cannot be %
                padding: '10%',
                width: '100px',
                height: '100px',
                borderRadius: '10%'
            },
            output: {
                margins: [10, 10, 10, 10],
                borders: [10, 10, 10, 10],
                paddings: [10, 10, 10, 10],
                marginBox: { x: -10, y: -10, width: 160, height: 160 },
                borderBox: { x: 0, y: 0, width: 140, height: 140, radii: [[14, 14], [14, 14], [14, 14], [14, 14]] }
            }
        }
        ],
        runTest: function(test) {
            var fn = test.only ? it.only : it;
            fn(test.name, function() {
                var parent;
                if (test.parentStyles) {
                    parent = document.createElement('div');
                    Object.keys(test.parentStyles).forEach(function(prop) {
                        parent.style[prop] = test.parentStyles[prop];
                    });
                    document.body.appendChild(parent);
                } else
                    parent = document.body;

                var element = document.createElement('div');
                parent.appendChild(element);
                Object.keys(test.styles).forEach(function(prop) {
                    element.style[prop] = test.styles[prop];
                });
                var metrics = new Metrics(element);
                Object.keys(test.output).forEach(function(prop) {
                    expect(JSON.stringify(metrics[prop])).to.equal(JSON.stringify(test.output[prop]));
                });

                if (test.parentStyles)
                    document.body.removeChild(parent);
                else
                    parent.removeChild(element);
            });
        }
    }

    function generateSuite(suite) {
        describe(suite.name, function() {
            suite.tests.forEach(function(test) {
                suite.runTest(test);
            });
        });
    }

    generateSuite(basicSuite);
}

return {
    'register': register
}
}()
