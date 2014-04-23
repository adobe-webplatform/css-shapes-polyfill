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
}

return {'register': register};
}();
