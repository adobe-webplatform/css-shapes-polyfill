var RectTests = function() {

function register(mocha, expect) {
    mocha.setup('bdd');

    function roundedRectFromArray(arr /* x, y, w, h, [w, h], [w, h], [w, h], [w, h] */) {
        var x = arr[0],
            y = arr[1],
            w = arr[2],
            h = arr[3],
            tl = new Size(arr[4][0], arr[4][1]),
            tr = new Size(arr[5][0], arr[5][1]),
            br = new Size(arr[6][0], arr[6][1]),
            bl = new Size(arr[7][0], arr[7][1]);
        return new RoundedRect(new Rect(x, y, w, h), tl, tr, br, bl);
    }

    var basicSuite = {
        name: 'Rounded Rectangle Edges',
        tests: [
        {
            rectangle: [0, 0, 100, 100, [0, 0], [0, 0], [0, 0], [0, 0]],
            y1: 10,
            y2: 30,
            renderable: true,
            left: 0,
            right: 100
        },
        {
            rectangle: [0, 0, 100, 100, [50, 50], [50, 50], [50, 50], [50, 50]],
            y1: 0,
            y2: 0,
            renderable: true,
            left: 50,
            right: 50
        },
        {
            rectangle: [0, 0, 100, 100, [50, 50], [50, 50], [50, 50], [50, 50]],
            y1: 5,
            y2: 10,
            renderable: true,
            left: 20,
            right: 80
        },
        {
            rectangle: [0, 0, 100, 100, [50, 50], [50, 50], [50, 50], [50, 50]],
            y1: 50,
            y2: 50,
            renderable: true,
            left: 0,
            right: 100
        },
        {
            rectangle: [0, 0, 100, 100, [50, 50], [50, 50], [50, 50], [50, 50]],
            y1: 90,
            y2: 95,
            renderable: true,
            left: 20,
            right: 80
        },
        {
            rectangle: [0, 0, 100, 100, [30, 70], [30, 70], [30, 30], [30, 30]],
            y1: 10,
            y2: 14,
            renderable: true,
            left: 12,
            right: 88
        },
        {
            rectangle: [0, 0, 100, 100, [30, 30], [30, 30], [30, 70], [30, 70]],
            y1: 86,
            y2: 90,
            renderable: true,
            left: 12,
            right: 88
        },
        {
            rectangle: [0, 0, 100, 100, [50, 30], [50, 30], [30, 50], [30, 50]],
            y1: 45,
            y2: 50,
            renderable: true,
            left: 0,
            right: 100
        },
        {
            rectangle: [0, 0, 100, 100, [50, 30], [50, 30], [30, 50], [30, 50]],
            y1: 6,
            y2: 6,
            renderable: true,
            left: 20,
            right: 80
        },
        {
            rectangle: [0, 0, 100, 100, [50, 30], [50, 30], [30, 50], [30, 50]],
            y1: 90,
            y2: 90,
            renderable: true,
            left: 12,
            right: 88
        },
        {
            rectangle: [0, 0, 100, 100, [50, 30], [50, 30], [30, 50], [30, 50]],
            y1: 50,
            y2: 55,
            renderable: true,
            left: 0,
            right: 100
        },
        {
            rectangle: [25, 25, 50, 50, [25, 25], [25, 25], [25, 25], [25, 25]],
            y1: 0,
            y2: 0,
            renderable: true,
            left: undefined,
            right: undefined
        },
        {
            rectangle: [0, 0, 100, 100, [100, 100], [100, 100], [100, 100], [100, 100]],
            y1: 0,
            y2: 0,
            renderable: false,
            left: 50,
            right: 50
        },
        {
            rectangle: [0, 0, 100, 100, [100, 0], [100, 0], [100, 0], [100, 0]],
            y1: 0,
            y2: 0,
            renderable: false,
            left: 0,
            right: 100
        }
        ],
        runTest: function(test) {
            var fn = test.only ? it.only : it;
            fn(JSON.stringify(test), function() {
                var rr = roundedRectFromArray(test.rectangle);

                expect(rr.isRenderable()).to.equal(test.renderable);

                if (!rr.isRenderable())
                    rr.adjustRadii();

                expect(rr.leftExclusionEdge(test.y1, test.y2)).to.equal(test.left);
                expect(rr.rightExclusionEdge(test.y1, test.y2)).to.equal(test.right);
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
