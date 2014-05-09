var RasterTests = function() {

function register(mocha, expect) {
    mocha.setup('bdd');

    function checkExclusionEdges(raster, y1, y2, expectedLeft, expectedRight) {
        expect(raster.leftExclusionEdge(y1, y2)).to.equal(expectedLeft);
        expect(raster.rightExclusionEdge(y1, y2)).to.equal(expectedRight);
    }

    function checkExclusionEdgesWithRound(raster, y1, y2, expectedLeft, expectedRight) {
        expect(Math.round(raster.leftExclusionEdge(y1, y2))).to.equal(expectedLeft);
        expect(Math.round(raster.rightExclusionEdge(y1, y2))).to.equal(expectedRight);
    }

    function createRaster(url, shapeImageThreshold, shapeMargin, done, box) {
        var clipRect = {x: 0, y: 0, maxX: 100, maxY: 100, width: 100, height: 100};
        if (url == undefined) return undefined;
        if (shapeImageThreshold == undefined) shapeImageThreshold = 0;
        if (shapeMargin == undefined) shapeMargin = 0;
        return new Raster(url, box ? box : clipRect, shapeImageThreshold, shapeMargin, clipRect, done);
    }

    describe("Raster Basics", function() {
        var raster;
        before(function(done) {
            raster = createRaster("./resources/half-rectangle.png", 0, 0, done);
        });
        it("raster is a Raster", function() { expect(raster).to.be.an.instanceof(Raster); });
        it("raster set url", function() { expect(raster.url).to.equal("./resources/half-rectangle.png"); });
        it("raster set shapeImageThreshold", function() { expect(raster.shapeImageThreshold).to.equal(0); });
        it("raster set shapeMargin", function() { expect(raster.shapeMargin).to.equal(0); });
        it("raster clip rectangle", function() { expect(raster.clip).not.null; });
        it("raster intervals is not null", function() { expect(raster.intervals).not.null; });
    });

    describe("Missing image", function() {
        var image;
        before(function(done) {
            image = createRaster("./resources/i-am-not-a-real-image.png", 0, 0, done);
        });
        it("intervals are undefined", function() { expect(image.intervals).to.be.undefined; });
        it("line equals image vertical extent", function() { checkExclusionEdges(image, 0, 100, 0, 100); });
    });

    describe("Image.left,rightExclusionEdge, (50x100px opaque, 50x100px transparent)", function() {
        describe("shape-margin=0", function() {
            var image;
            before(function(done) {
                image = createRaster("./resources/half-rectangle.png", 0, 0, done);
            });
            it("line equals image vertical extent", function() { checkExclusionEdges(image, 0, 100, 0, 50); });
            it("line overlaps image vertical extent, above", function() { checkExclusionEdges(image, -100, 50, 0, 50); });
            it("line overlaps image vertical extent, below", function() { checkExclusionEdges(image, 50, 150, 0, 50); });
            it("line contains image vertical extent", function() { checkExclusionEdges(image, -100, 200, 0, 50)} );
            it("line overlaps image's top part", function() { checkExclusionEdges(image, 0, 25, 0, 50)} );
            it("line overlaps image's bottom part", function() { checkExclusionEdges(image, 75, 100, 0, 50)} );
            it("line is above the image", function() { checkExclusionEdges(image, -50, -30, undefined, undefined)} );
            it("line is below the image", function() { checkExclusionEdges(image, 101, 109, undefined, undefined)} );
        });

        describe("shape-margin=10", function() {
            var image;
            before(function(done) {
                image = createRaster("./resources/half-rectangle.png", 0, 10, done);
            });
            it("line equals image vertical extent", function() { checkExclusionEdges(image, 0, 100, -10, 60); });
            it("line equals image + shape-margin vertical extent", function() { checkExclusionEdges(image, -10, 110, -10, 60); });
            it("line overlaps image's top part", function() { checkExclusionEdges(image, 0, 25, -10, 60)} );
            it("line overlaps image's bottom part", function() { checkExclusionEdges(image, 75, 100, -10, 60)} );
        });
    });

    describe("Image.left,rightExclusionEdge, (50x100px opaque, 50x100px 50% transparent)", function() {
        describe("shape-margin=0", function() {
            var image;
            before(function(done) {
                image = createRaster("./resources/half-rectangle-50.png", 0.5, 0, done);
            });
            it("line equals image vertical extent", function() { checkExclusionEdges(image, 0, 100, 0, 50); });
            it("line overlaps image vertical extent, above", function() { checkExclusionEdges(image, -100, 50, 0, 50); });
            it("line overlaps image vertical extent, below", function() { checkExclusionEdges(image, 50, 150, 0, 50); });
            it("line contains image vertical extent", function() { checkExclusionEdges(image, -100, 200, 0, 50)} );
            it("line overlaps image's top part", function() { checkExclusionEdges(image, 0, 25, 0, 50)} );
            it("line overlaps image's bottom part", function() { checkExclusionEdges(image, 75, 100, 0, 50)} );
            it("line is above the image", function() { checkExclusionEdges(image, -50, -30, undefined, undefined)} );
            it("line is below the image", function() { checkExclusionEdges(image, 101, 109, undefined, undefined)} );
        });

        describe("shape-margin=10", function() {
            var image;
            before(function(done) {
                image = createRaster("./resources/half-rectangle-50.png", 0.5, 10, done);
            });
            it("line equals image vertical extent", function() { checkExclusionEdges(image, 0, 100, -10, 60); });
            it("line equals image + shape-margin vertical extent", function() { checkExclusionEdges(image, -10, 110, -10, 60); });
            it("line overlaps image's top part", function() { checkExclusionEdges(image, 0, 25, -10, 60)} );
            it("line overlaps image's bottom part", function() { checkExclusionEdges(image, 75, 100, -10, 60)} );
        });
    });

    describe("Image.left,rightExclusionEdge, (50x100px opaque, 50x100px 70% opacity)", function() {
        describe("shape-margin=0; shape-image-threshold=0.7", function() {
            var image;
            before(function(done) {
                image = createRaster("./resources/half-rectangle-70.png", 0.7, 0, done);
            });
            it("line equals image vertical extent", function() { checkExclusionEdges(image, 0, 100, 0, 50); });
            it("line overlaps image vertical extent, above", function() { checkExclusionEdges(image, -100, 50, 0, 50); });
            it("line overlaps image vertical extent, below", function() { checkExclusionEdges(image, 50, 150, 0, 50); });
            it("line contains image vertical extent", function() { checkExclusionEdges(image, -100, 200, 0, 50)} );
            it("line overlaps image's top part", function() { checkExclusionEdges(image, 0, 25, 0, 50)} );
            it("line overlaps image's bottom part", function() { checkExclusionEdges(image, 75, 100, 0, 50)} );
            it("line is above the image", function() { checkExclusionEdges(image, -50, -30, undefined, undefined)} );
            it("line is below the image", function() { checkExclusionEdges(image, 101, 109, undefined, undefined)} );
        });

        describe("shape-margin=10; shape-image-threshold=0.7", function() {
            var image;
            before(function(done) {
                image = createRaster("./resources/half-rectangle-70.png", 0.7, 10, done);
            });
            it("line equals image vertical extent", function() { checkExclusionEdges(image, 0, 100, -10, 60); });
            it("line equals image + shape-margin vertical extent", function() { checkExclusionEdges(image, -10, 110, -10, 60); });
            it("line overlaps image's top part", function() { checkExclusionEdges(image, 0, 25, -10, 60)} );
            it("line overlaps image's bottom part", function() { checkExclusionEdges(image, 75, 100, -10, 60)} );
        });
    });

    describe("Image.left,rightExclusionEdge, (50x100px opaque, 50x100px 20% opacity)", function() {
        describe("shape-margin=0; shape-image-threshold=0.2", function() {
            var image;
            before(function(done) {
                image = createRaster("./resources/half-rectangle-20.png", 0.25, 0, done);
            });
            it("line equals image vertical extent", function() { checkExclusionEdges(image, 0, 100, 0, 50); });
            it("line overlaps image vertical extent, above", function() { checkExclusionEdges(image, -100, 50, 0, 50); });
            it("line overlaps image vertical extent, below", function() { checkExclusionEdges(image, 50, 150, 0, 50); });
            it("line contains image vertical extent", function() { checkExclusionEdges(image, -100, 200, 0, 50)} );
            it("line overlaps image's top part", function() { checkExclusionEdges(image, 0, 25, 0, 50)} );
            it("line overlaps image's bottom part", function() { checkExclusionEdges(image, 75, 100, 0, 50)} );
            it("line is above the image", function() { checkExclusionEdges(image, -50, -30, undefined, undefined)} );
            it("line is below the image", function() { checkExclusionEdges(image, 101, 109, undefined, undefined)} );
        });

        describe("shape-margin=10; shape-image-threshold=0.2", function() {
            var image;
            before(function(done) {
                image = createRaster("./resources/half-rectangle-20.png", 0.25, 10, done);
            });
            it("line equals image vertical extent", function() { checkExclusionEdges(image, 0, 100, -10, 60); });
            it("line equals image + shape-margin vertical extent", function() { checkExclusionEdges(image, -10, 110, -10, 60); });
            it("line overlaps image's top part", function() { checkExclusionEdges(image, 0, 25, -10, 60)} );
            it("line overlaps image's bottom part", function() { checkExclusionEdges(image, 75, 100, -10, 60)} );
        });
    });

    describe("Image.left,rightExclusionEdge, (50x100px opaque, 50x100px 20% opacity)", function() {
        describe("shape-margin=0; shape-image-threshold=0.19 (no wrapping)", function() {
            var image;
            before(function(done) {
                image = createRaster("./resources/half-rectangle-20.png", 0.19, 0, done);
            });
            it("line equals image vertical extent", function() { checkExclusionEdges(image, 0, 100, 0, 100); });
            it("line overlaps image vertical extent, above", function() { checkExclusionEdges(image, -100, 50, 0, 100); });
            it("line overlaps image vertical extent, below", function() { checkExclusionEdges(image, 50, 150, 0, 100); });
            it("line contains image vertical extent", function() { checkExclusionEdges(image, -100, 200, 0, 100)} );
            it("line overlaps image's top part", function() { checkExclusionEdges(image, 0, 25, 0, 100)} );
            it("line overlaps image's bottom part", function() { checkExclusionEdges(image, 75, 100, 0, 100)} );
            it("line is above the image", function() { checkExclusionEdges(image, -50, -30, undefined, undefined)} );
            it("line is below the image", function() { checkExclusionEdges(image, 101, 109, undefined, undefined)} );
        });

        describe("shape-margin=10; shape-image-threshold=0.19 (no wrapping)", function() {
            var image;
            before(function(done) {
                image = createRaster("./resources/half-rectangle-20.png", 0.19, 10, done);
            });
            it("line equals image vertical extent", function() { checkExclusionEdges(image, 0, 100, -10, 110); });
            it("line equals image + shape-margin vertical extent", function() { checkExclusionEdges(image, -10, 110, -10, 110); });
            it("line overlaps image's top part", function() { checkExclusionEdges(image, 0, 25, -10, 110)} );
            it("line overlaps image's bottom part", function() { checkExclusionEdges(image, 75, 100, -10, 110)} );
        });
    });

    describe("Image.left,rightExclusionEdge, no outside transparency", function() {
        describe("shape-margin=0", function() {
            var image;
            before(function(done) {
                image = createRaster("./resources/no-outside-alpha.png", 0, 0, done);
            });
            it("line equals image vertical extent", function() { checkExclusionEdges(image, 0, 100, 0, 100); });
            it("line overlaps image vertical extent, above", function() { checkExclusionEdges(image, -100, 50, 0, 100); });
            it("line overlaps image vertical extent, below", function() { checkExclusionEdges(image, 50, 150, 0, 100); });
            it("line contains image vertical extent", function() { checkExclusionEdges(image, -100, 200, 0, 100)} );
            it("line overlaps image's top part", function() { checkExclusionEdges(image, 0, 25, 0, 100)} );
            it("line overlaps image's bottom part", function() { checkExclusionEdges(image, 75, 100, 0, 100)} );
            it("line is above the image", function() { checkExclusionEdges(image, -50, -30, undefined, undefined)} );
            it("line is below the image", function() { checkExclusionEdges(image, 101, 109, undefined, undefined)} );
        });

        describe("shape-margin=10", function() {
            var image;
            before(function(done) {
                image = createRaster("./resources/no-outside-alpha.png", 0, 10, done);
            });
            it("line equals image vertical extent", function() { checkExclusionEdges(image, 0, 100, -10, 110); });
            it("line equals image + shape-margin vertical extent", function() { checkExclusionEdges(image, -10, 110, -10, 110); });
            it("line overlaps image's top part", function() { checkExclusionEdges(image, 0, 25, -10, 110)} );
            it("line overlaps image's bottom part", function() { checkExclusionEdges(image, 75, 100, -10, 110)} );
        });
    });

    describe("Image.left,rightExclusionEdge, left-base triangle", function() {
        describe("shape-margin=0", function() {
            var image;
            before(function(done) {
                image = createRaster("./resources/left-based-triangle.png", 0, 0, done);
            });
            it("line equals image vertical extent", function() { checkExclusionEdges(image, 0, 100, 0, 100); });
            it("line overlaps image vertical extent, above", function() { checkExclusionEdges(image, -100, 50, 0, 100); });
            it("line overlaps image vertical extent, below", function() { checkExclusionEdges(image, 50, 150, 0, 100); });
            it("line contains image vertical extent", function() { checkExclusionEdges(image, -100, 200, 0, 100)} );
            it("line overlaps image's top part", function() { checkExclusionEdges(image, 0, 25, 0, 52)} );
            it("line overlaps image's middle part", function() { checkExclusionEdges(image, 40, 60, 0, 100)} );
            it("line overlaps image's bottom part", function() { checkExclusionEdges(image, 74, 100, 0, 52)} );
        });

        describe("shape-margin=10", function() {
            var image;
            before(function(done) {
                image = createRaster("./resources/left-based-triangle.png", 0, 10, done);
            });
            it("line equals image vertical extent", function() { checkExclusionEdges(image, 0, 100, -10, 110); });
            it("line equals image + shape-margin vertical extent", function() { checkExclusionEdges(image, -10, 110, -10, 110); });
            it("line overlaps image's top part", function() { checkExclusionEdgesWithRound(image, 0, 25, -10, 74)} );
            it("line overlaps image's middle part", function() { checkExclusionEdges(image, 40, 60, -10, 110)} );
            it("line overlaps image's bottom part", function() { checkExclusionEdgesWithRound(image, 75, 100, -10, 72)} );
        });
    });

    describe("Image.left,rightExclusionEdge, top-base triangle", function() {
        describe("shape-margin=0", function() {
            var image;
            before(function(done) {
                image = createRaster("./resources/top-based-triangle.png", 0, 0, done);
            });
            it("line equals image vertical extent", function() { checkExclusionEdges(image, 0, 100, 0, 100); });
            it("line overlaps image vertical extent, above", function() { checkExclusionEdges(image, -100, 50, 0, 100); });
            it("line overlaps image vertical extent, below", function() { checkExclusionEdges(image, 50, 150, 25, 75); });
            it("line contains image vertical extent", function() { checkExclusionEdges(image, -100, 200, 0, 100)} );
            it("line overlaps image's top part", function() { checkExclusionEdges(image, 0, 25, 0, 100)} );
            it("line overlaps image's middle part", function() { checkExclusionEdges(image, 40, 60, 20, 80)} );
            it("line overlaps image's bottom part", function() { checkExclusionEdges(image, 75, 100, 37, 63)} );
        });

        describe("shape-margin=10", function() {
            var image;
            before(function(done) {
                image = createRaster("./resources/top-based-triangle.png", 0, 10, done);
            });
            it("line equals image vertical extent", function() { checkExclusionEdges(image, 0, 100, -10, 110); });
            it("line equals image + shape-margin vertical extent", function() { checkExclusionEdges(image, -10, 110, -10, 110); });
            it("line overlaps image's top part", function() { checkExclusionEdges(image, 0, 25, -10, 110)} );
            it("line overlaps image's middle part", function() { checkExclusionEdgesWithRound(image, 40, 60, 8, 92)} );
            it("line overlaps image's bottom part", function() { checkExclusionEdgesWithRound(image, 75, 100, 26, 74)} );
        });
    });

    describe("Image.left,rightExclusionEdge, right-base triangle", function() {
        describe("shape-margin=0", function() {
            var image;
            before(function(done) {
                image = createRaster("./resources/right-based-triangle.png", 0, 0, done);
            });
            it("line equals image vertical extent", function() { checkExclusionEdges(image, 0, 100, 0, 100); });
            it("line overlaps image vertical extent, above", function() { checkExclusionEdges(image, -100, 50, 0, 100); });
            it("line overlaps image vertical extent, below", function() { checkExclusionEdges(image, 50, 150, 0, 100); });
            it("line contains image vertical extent", function() { checkExclusionEdges(image, -100, 200, 0, 100)} );
            it("line overlaps image's top part", function() { checkExclusionEdges(image, 0, 25, 48, 100)} );
            it("line overlaps image's middle part", function() { checkExclusionEdges(image, 40, 60, 0, 100)} );
            it("line overlaps image's bottom part", function() { checkExclusionEdges(image, 75, 100, 50, 100)} );
        });

        describe("shape-margin=10", function() {
            var image;
            before(function(done) {
                image = createRaster("./resources/right-based-triangle.png", 0, 10, done);
            });
            it("line equals image vertical extent", function() { checkExclusionEdges(image, 0, 100, -10, 110); });
            it("line equals image + shape-margin vertical extent", function() { checkExclusionEdges(image, -10, 110, -10, 110); });
            it("line overlaps image's top part", function() { checkExclusionEdgesWithRound(image, 0, 25, 26, 110)} );
            it("line overlaps image's middle part", function() { checkExclusionEdges(image, 40, 60, -10, 110)} );
            it("line overlaps image's bottom part", function() { checkExclusionEdgesWithRound(image, 75, 100, 28, 110)} );
        });
    });

    describe("Image.left,rightExclusionEdge, bottom-base triangle", function() {
        describe("shape-margin=0", function() {
            var image;
            before(function(done) {
                image = createRaster("./resources/bottom-based-triangle.png", 0, 0, done);
            });
            it("line equals image vertical extent", function() { checkExclusionEdges(image, 0, 100, 0, 100); });
            it("line overlaps image vertical extent, above", function() { checkExclusionEdges(image, -100, 50, 24, 76); });
            it("line overlaps image vertical extent, below", function() { checkExclusionEdges(image, 50, 150, 0, 100); });
            it("line contains image vertical extent", function() { checkExclusionEdges(image, -100, 200, 0, 100)} );
            it("line overlaps image's top part", function() { checkExclusionEdges(image, 0, 25, 37, 63)} );
            it("line overlaps image's middle part", function() { checkExclusionEdges(image, 40, 60, 19, 81)} );
            it("line overlaps image's bottom part", function() { checkExclusionEdges(image, 75, 100, 0, 100)} );
        });

        describe("shape-margin=10", function() {
            var image;
            before(function(done) {
                image = createRaster("./resources/bottom-based-triangle.png", 0, 10, done);
            });
            it("line equals image vertical extent", function() { checkExclusionEdges(image, 0, 100, -10, 110); });
            it("line equals image + shape-margin vertical extent", function() { checkExclusionEdges(image, -10, 110, -10, 110); });
            it("line overlaps image's top part", function() { checkExclusionEdgesWithRound(image, 0, 25, 25, 75)} );
            it("line overlaps image's middle part", function() { checkExclusionEdgesWithRound(image, 40, 60, 8, 92)} );
            it("line overlaps image's bottom part", function() { checkExclusionEdges(image, 75, 100, -10, 110)} );
        });
    });

    describe("Image.left,rightExclusionEdge, top-left triangle", function() {
        describe("shape-margin=0", function() {
            var image;
            before(function(done) {
                image = createRaster("./resources/top-left-triangle.png", 0, 0, done);
            });
            it("line equals image vertical extent", function() { checkExclusionEdges(image, 0, 100, 0, 100); });
            it("line overlaps image vertical extent, above", function() { checkExclusionEdges(image, -100, 50, 0, 100); });
            it("line overlaps image vertical extent, below", function() { checkExclusionEdges(image, 50, 150, 0, 50); });
            it("line contains image vertical extent", function() { checkExclusionEdges(image, -100, 200, 0, 100)} );
            it("line overlaps image's top part", function() { checkExclusionEdges(image, 0, 25, 0, 100)} );
            it("line overlaps image's middle part", function() { checkExclusionEdges(image, 40, 60, 0, 60)} );
            it("line overlaps image's bottom part", function() { checkExclusionEdges(image, 75, 100, 0, 25)} );
        });

        describe("shape-margin=10", function() {
            var image;
            before(function(done) {
                image = createRaster("./resources/top-left-triangle.png", 0, 10, done);
            });
            it("line equals image vertical extent", function() { checkExclusionEdges(image, 0, 100, -10, 110); });
            it("line equals image + shape-margin vertical extent", function() { checkExclusionEdges(image, -10, 110, -10, 110); });
            it("line overlaps image's top part", function() { checkExclusionEdgesWithRound(image, 0, 25, -10, 110)} );
            it("line overlaps image's middle part", function() { checkExclusionEdgesWithRound(image, 40, 60, -10, 74)} );
            it("line overlaps image's bottom part", function() { checkExclusionEdgesWithRound(image, 75, 100, -10, 39)} );
        });
    });

    describe("Image.left,rightExclusionEdge, top-right triangle", function() {
        describe("shape-margin=0", function() {
            var image;
            before(function(done) {
                image = createRaster("./resources/top-right-triangle.png", 0, 0, done);
            });
            it("line equals image vertical extent", function() { checkExclusionEdges(image, 0, 100, 0, 100); });
            it("line overlaps image vertical extent, above", function() { checkExclusionEdges(image, -100, 50, 0, 100); });
            it("line overlaps image vertical extent, below", function() { checkExclusionEdges(image, 50, 150, 50, 100); });
            it("line contains image vertical extent", function() { checkExclusionEdges(image, -100, 200, 0, 100)} );
            it("line overlaps image's top part", function() { checkExclusionEdges(image, 0, 25, 0, 100)} );
            it("line overlaps image's middle part", function() { checkExclusionEdges(image, 40, 60, 40, 100)} );
            it("line overlaps image's bottom part", function() { checkExclusionEdges(image, 75, 100, 75, 100)} );
        });

        describe("shape-margin=10", function() {
            var image;
            before(function(done) {
                image = createRaster("./resources/top-right-triangle.png", 0, 10, done);
            });
            it("line equals image vertical extent", function() { checkExclusionEdges(image, 0, 100, -10, 110); });
            it("line equals image + shape-margin vertical extent", function() { checkExclusionEdges(image, -10, 110, -10, 110); });
            it("line overlaps image's top part", function() { checkExclusionEdges(image, 0, 25, -10, 110)} );
            it("line overlaps image's middle part", function() { checkExclusionEdgesWithRound(image, 40, 60, 26, 110)} );
            it("line overlaps image's bottom part", function() { checkExclusionEdgesWithRound(image, 75, 100, 61, 110)} );
        });
    });

    describe("Image.left,rightExclusionEdge, bottom-right triangle", function() {
        describe("shape-margin=0", function() {
            var image;
            before(function(done) {
                image = createRaster("./resources/bottom-right-triangle.png", 0, 0, done);
            });
            it("line equals image vertical extent", function() { checkExclusionEdges(image, 0, 100, 0, 100); });
            it("line overlaps image vertical extent, above", function() { checkExclusionEdges(image, -100, 50, 49, 100); });
            it("line overlaps image vertical extent, below", function() { checkExclusionEdges(image, 50, 150, 0, 100); });
            it("line contains image vertical extent", function() { checkExclusionEdges(image, -100, 200, 0, 100)} );
            it("line overlaps image's top part", function() { checkExclusionEdges(image, 0, 25, 74, 100)} );
            it("line overlaps image's middle part", function() { checkExclusionEdges(image, 40, 60, 39, 100)} );
            it("line overlaps image's bottom part", function() { checkExclusionEdges(image, 75, 100, 0, 100)} );
        });

        describe("shape-margin=10", function(done) {
            var image;
            before(function(done) {
                image = createRaster("./resources/bottom-right-triangle.png", 0, 10, done);
            });
            it("line equals image vertical extent", function() { checkExclusionEdges(image, 0, 100, -10, 110); });
            it("line equals image + shape-margin vertical extent", function() { checkExclusionEdges(image, -10, 110, -10, 110); });
            it("line overlaps image's top part", function() { checkExclusionEdgesWithRound(image, 0, 25, 60, 110)} );
            it("line overlaps image's middle part", function() { checkExclusionEdgesWithRound(image, 40, 60, 25, 110)} );
            it("line overlaps image's bottom part", function() { checkExclusionEdgesWithRound(image, 75, 100, -10, 110)} );
        });
    });

    describe("Image.left,rightExclusionEdge, bottom-left triangle", function() {
        describe("shape-margin=0", function() {
            var image;
            before(function(done) {
                image = createRaster("./resources/bottom-left-triangle.png", 0, 0, done);
            });
            it("line equals image vertical extent", function() { checkExclusionEdges(image, 0, 100, 0, 100); });
            it("line overlaps image vertical extent, above", function() { checkExclusionEdges(image, -100, 50, 0, 51); });
            it("line overlaps image vertical extent, below", function() { checkExclusionEdges(image, 50, 150, 0, 100); });
            it("line contains image vertical extent", function() { checkExclusionEdges(image, -100, 200, 0, 100)} );
            it("line overlaps image's top part", function() { checkExclusionEdges(image, 0, 25, 0, 26)} );
            it("line overlaps image's middle part", function() { checkExclusionEdges(image, 40, 60, 0, 61)} );
            it("line overlaps image's bottom part", function() { checkExclusionEdges(image, 75, 100, 0, 100)} );
        });

        describe("shape-margin=10", function() {
            var image;
            before(function(done) {
                image = createRaster("./resources/bottom-left-triangle.png", 0, 10, done);
            });
            it("line equals image vertical extent", function() { checkExclusionEdges(image, 0, 100, -10, 110); });
            it("line equals image + shape-margin vertical extent", function() { checkExclusionEdges(image, -10, 110, -10, 110); });
            it("line overlaps image's top part", function() { checkExclusionEdgesWithRound(image, 0, 25, -10, 40)} );
            it("line overlaps image's middle part", function() { checkExclusionEdgesWithRound(image, 40, 60, -10, 75)} );
            it("line overlaps image's bottom part", function() { checkExclusionEdges(image, 75, 100, -10, 110)} );
        });
    });

    describe("Image.left,rightExclusionEdge, assimetric star", function() {
        describe("shape-margin=0", function() {
            var image;
            before(function(done) {
                image = createRaster("./resources/assimetric-star.png", 0, 0, done);
            });
            it("line equals image vertical extent", function() { checkExclusionEdges(image, 0, 100, 0, 100); });
            it("line overlaps image vertical extent, above", function() { checkExclusionEdges(image, -100, 50, 0, 100); });
            it("line overlaps image vertical extent, below", function() { checkExclusionEdges(image, 50, 150, 13, 87); });
            it("line contains image vertical extent", function() { checkExclusionEdges(image, -100, 200, 0, 100)} );
            it("line overlaps image's top part", function() { checkExclusionEdges(image, 0, 25, 35, 65)} );
            it("line overlaps image's middle part", function() { checkExclusionEdges(image, 30, 60, 0, 100)} );
            it("line overlaps image's bottom part", function() { checkExclusionEdges(image, 75, 100, 32, 68)} );
        });

        describe("shape-margin=10", function() {
            var image;
            before(function(done) {
                image = createRaster("./resources/assimetric-star.png", 0, 10, done);
            });
            it("line equals image vertical extent", function() { checkExclusionEdges(image, 0, 100, -10, 110); });
            it("line equals image + shape-margin vertical extent", function() { checkExclusionEdges(image, -10, 110, -10, 110); });
            it("line overlaps image's top part", function() { checkExclusionEdgesWithRound(image, 0, 25, 24, 76)} );
            it("line overlaps image's middle part", function() { checkExclusionEdgesWithRound(image, 30, 60, -10, 110)} );
            it("line overlaps image's bottom part", function() { checkExclusionEdges(image, 75, 100, 22, 78)} );
        });
    });

    describe("Image.left,rightExclusionEdge, (50x100px opaque, 50x100px transparent) at 0.5 scale", function() {
        describe("shape-margin=0", function() {
            var image;
            before(function(done) {
                image = createRaster("./resources/half-rectangle.png", 0, 0, done, { width: 50, height: 50 });
            });
            it("line equals image vertical extent", function() { checkExclusionEdges(image, 0, 50, 0, 25); });
            it("line overlaps image vertical extent, above", function() { checkExclusionEdges(image, -25, 25, 0, 25); });
            it("line overlaps image vertical extent, below", function() { checkExclusionEdges(image, 25, 75, 0, 25); });
            it("line contains image vertical extent", function() { checkExclusionEdges(image, -25, 75, 0, 25)} );
            it("line overlaps image's top part", function() { checkExclusionEdges(image, 0, 25, 0, 25)} );
            it("line overlaps image's bottom part", function() { checkExclusionEdges(image, 25, 50, 0, 25)} );
            it("line is above the image", function() { checkExclusionEdges(image, -50, -25, undefined, undefined)} );
            it("line is below the image", function() { checkExclusionEdges(image, 75, 100, undefined, undefined)} );
        });

        describe("shape-margin=10", function() {
            var image;
            before(function(done) {
                image = createRaster("./resources/half-rectangle.png", 0, 10, done, { width: 50, height: 50 });
            });
            it("line equals image vertical extent", function() { checkExclusionEdges(image, 0, 50, -10, 35); });
            it("line equals image + shape-margin vertical extent", function() { checkExclusionEdges(image, -10, 75, -10, 35); });
            it("line overlaps image's top part", function() { checkExclusionEdges(image, 0, 25, -10, 35)} );
            it("line overlaps image's bottom part", function() { checkExclusionEdges(image, 25, 50, -10, 35)} );
        });
    });

    describe("Image.left,rightExclusionEdge, (50x100px opaque, 50x100px transparent) at 2.0 scale", function() {
        /* This is clipped to the margin-box [0, 0, 100, 100] */
        describe("shape-margin=0", function() {
            var image;
            before(function(done) {
                image = createRaster("./resources/half-rectangle.png", 0.5, 0, done, { width: 200, height: 200 });
            });
            it("line equals image vertical extent", function() { checkExclusionEdges(image, 0, 200, 0, 100); });
            it("line overlaps image vertical extent, above", function() { checkExclusionEdges(image, -25, 25, 0, 100); });
            it("line overlaps image vertical extent, below", function() { checkExclusionEdges(image, 175, 225, undefined, undefined); });
            it("line contains image vertical extent", function() { checkExclusionEdges(image, -25, 225, 0, 100)} );
            it("line overlaps image's top part", function() { checkExclusionEdges(image, 0, 25, 0, 100)} );
            it("line overlaps image's bottom part", function() { checkExclusionEdges(image, 175, 225, undefined, undefined)} );
            it("line is above the image", function() { checkExclusionEdges(image, -50, -25, undefined, undefined)} );
            it("line is below the image", function() { checkExclusionEdges(image, 225, 250, undefined, undefined)} );
        });

        describe("shape-margin=10", function() {
            var image;
            before(function(done) {
                image = createRaster("./resources/half-rectangle.png", 0.5, 10, done, { width: 200, height: 200 });
            });
            it("line equals image vertical extent", function() { checkExclusionEdges(image, 0, 200, -10, 110); });
            it("line equals image + shape-margin vertical extent", function() { checkExclusionEdges(image, -10, 225, -10, 110); });
            it("line overlaps image's top part", function() { checkExclusionEdges(image, 0, 25, -10, 110)} );
            it("line overlaps image's bottom part", function() { checkExclusionEdges(image, 175, 225, undefined, undefined)} );
        });
    });

}

return {'register': register};
}();
