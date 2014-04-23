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

    function createRaster(url, shapeImageThreshold, shapeMargin) {
        var clipRect = {x: 0, y: 0, maxX: 100, maxY: 100, width: 100, height: 100};
        if (url == undefined) return undefined;
        if (shapeImageThreshold == undefined) shapeImageThreshold = 0;
        if (shapeMargin == undefined) shapeMargin = 0;
        return new Raster(url, shapeImageThreshold, shapeMargin, clipRect);
    }

    describe("Raster Basics", function() {
        var raster = createRaster("./resources/half-rectangle.png", 0, 0);
        it("raster is-a Raster", function() { expect(raster).to.be.an.instanceof(Raster); });
        it("raster set url", function() { expect(raster.url).to.equal("./resources/half-rectangle.png"); });
        it("raster set shapeImageThreshold", function() { expect(raster.shapeImageThreshold).to.equal(0); });
        it("raster set shapeMargin", function() { expect(raster.shapeMargin).to.equal(0); });
        it("raster clip rectangle", function() { expect(raster.clip).not.null; });
        it("raster image width", function() { expect(raster.image.width).to.equal(100); });
        it("raster image height", function() { expect(raster.image.height).to.equal(100); });
        it("raster intervals is not null", function() { expect(raster.intervals).not.null; });
    });

    describe("Image.left,rightExclusionEdge, (50x100px opaque,50x100px transparent) image", function() {
        describe("shape-margin=0", function() {
            var image = createRaster("./resources/half-rectangle.png", 0, 0);
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
            var image = createRaster("./resources/half-rectangle.png", 0, 10);
            it("line equals image vertical extent", function() { checkExclusionEdges(image, 0, 100, -10, 60); });
            it("line equals image + shape-margin vertical extent", function() { checkExclusionEdges(image, -10, 110, -10, 60); });
            it("line overlaps image's top part", function() { checkExclusionEdges(image, 0, 25, -10, 60)} );
            it("line overlaps image's bottom part", function() { checkExclusionEdges(image, 75, 100, -10, 60)} );
        });
    });

    describe("Image.left,rightExclusionEdge, no outside transparency", function() {
        describe("shape-margin=0", function() {
            var image = createRaster("./resources/no-outside-alpha.png", 0, 0);
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
            var image = createRaster("./resources/no-outside-alpha.png", 0, 10);
            it("line equals image vertical extent", function() { checkExclusionEdges(image, 0, 100, -10, 110); });
            it("line equals image + shape-margin vertical extent", function() { checkExclusionEdges(image, -10, 110, -10, 110); });
            it("line overlaps image's top part", function() { checkExclusionEdges(image, 0, 25, -10, 110)} );
            it("line overlaps image's bottom part", function() { checkExclusionEdges(image, 75, 100, -10, 110)} );
        });
    });

    describe("Image.left,rightExclusionEdge, bottom-base triangle", function() {
        describe("shape-margin=0", function() {
            var image = createRaster("./resources/bottom-based-triangle.png", 0, 0);
            it("line equals image vertical extent", function() { checkExclusionEdges(image, 0, 100, 0, 100); });
            it("line overlaps image vertical extent, above", function() { checkExclusionEdges(image, -100, 50, 24, 76); });
            it("line overlaps image vertical extent, below", function() { checkExclusionEdges(image, 50, 150, 0, 100); });
            it("line contains image vertical extent", function() { checkExclusionEdges(image, -100, 200, 0, 100)} );
            it("line overlaps image's top part", function() { checkExclusionEdges(image, 0, 25, 37, 63)} );
            it("line overlaps image's bottom part", function() { checkExclusionEdges(image, 75, 100, 0, 100)} );
            it("line is above the image", function() { checkExclusionEdges(image, -50, -30, undefined, undefined)} );
            it("line is below the image", function() { checkExclusionEdges(image, 101, 109, undefined, undefined)} );
        });

        describe("shape-margin=10", function() {
            var image = createRaster("./resources/bottom-based-triangle.png", 0, 10);
            it("line equals image vertical extent", function() { checkExclusionEdges(image, 0, 100, -10, 110); });
            it("line equals image + shape-margin vertical extent", function() { checkExclusionEdges(image, -10, 110, -10, 110); });
            it("line overlaps image's top part", function() { checkExclusionEdgesWithRound(image, 0, 25, 25, 75)} );
            it("line overlaps image's bottom part", function() { checkExclusionEdges(image, 75, 100, -10, 110)} );
        });
    });
}

return {'register': register};
}();
