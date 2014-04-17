var PolygonTests = function() {

function register(mocha, expect) {
    mocha.setup('bdd');

    function createVertices(coordinates, reverse) {
        var vertices = [];
        for(i = 0; i < coordinates.length; i += 2)
            vertices.push({x: coordinates[i], y: coordinates[i+1]});
        return (reverse == "reverse") ? vertices.reverse() : vertices;
    }

    function createPolygon(coordinates, shapeMargin, fillRule) {
        if (shapeMargin === undefined) shapeMargin = 0;
        if (fillRule === undefined) fillRule = "evenodd";
        return new Polygon(createVertices(coordinates), fillRule, shapeMargin);
    }

    describe("Polygon Basics", function() {
        var vertices = createVertices([0,0, 100,0, 100,100, 0,100]);
        var polygon = new Polygon(vertices, "evenodd", 5);

        it("polygon is-a Polygon", function() { expect(polygon).to.be.an.instanceof(Polygon); });

        it("polygon.isEmpty", function() { expect(polygon.isEmpty).to.be.false; });

        it("polygon.isEmpty - no vertices", function() { expect(createPolygon([]).isEmpty).to.be.true; });

        it("polygon.isEmpty - two vertices", function() { expect(createPolygon([0,0, 100,0]).isEmpty).to.be.true; });
        
        it("polygon.isEmpty - one edge", function() { expect(createPolygon([0,0, 100,0, 200,0]).isEmpty).to.be.true; });

        it("polygon.numberOfVertices", function() { expect(polygon.numberOfVertices).to.equal(4); });

        it("polygon.vertices()", function() { expect(polygon.vertices()).to.deep.equal(vertices); });

        it("polygon.fillRule == evenodd", function() { expect(polygon.fillRule).to.equal("evenodd"); });
        it("polygon.fillRule == nonzero", function() { expect(createPolygon([], 0, "nonzero").fillRule).to.equal("nonzero"); });

        it("polygon.shapeMargin", function() { expect(polygon.shapeMargin).to.equal(5); });

        it("polygon.vertexAt()", function() { 
            expect(polygon.vertexAt(0)).to.deep.equal({x:0, y:0});
            expect(polygon.vertexAt(1)).to.deep.equal({x:100, y:0});
            expect(polygon.vertexAt(2)).to.deep.equal({x:100, y:100});
            expect(polygon.vertexAt(3)).to.deep.equal({x:0, y:100}); });

        it("polygon.numberOfEdges", function() { expect(polygon.numberOfEdges).to.equal(4); });

        it("polygon.edgeAt()", function() {
            for(var i = 0; i < vertices.length; i++) {
                var edge = polygon.edgeAt(i);
                expect(polygon.edgeAt(i)).to.be.an.instanceof(PolygonEdge);
                expect(polygon.edgeAt(i).polygon).to.equal(polygon);
                expect(polygon.edgeAt(i).edgeIndex).to.equal(i);
                expect(polygon.edgeAt(i).vertex1).to.deep.equal(vertices[i]);
                expect(polygon.edgeAt(i).vertex2).to.deep.equal(vertices[(i+1) % vertices.length]);
            }
        });

        it("polygon.vertices() defensive copy", function() {
            var verticesCopy = polygon.vertices();
            verticesCopy.splice(0, 1);
            expect(polygon.vertices()).to.not.deep.equal(verticesCopy);
            expect(polygon.vertices()).to.deep.equal(vertices);
        });
            
    });

    describe("Polygon shapeMarginEdges", function() {
        var polygon = createPolygon([0,0, 100,0, 100,100, 0,100]);
        it("shapeMarginEdges with shapeMargin == 0", function() {
            expect(polygon.shapeMarginEdges.length).to.equal(4);
            expect(polygon.shapeMarginEdges).to.deep.equal(polygon.edges());
        });

        it("shapeMarginEdges with shapeMargin > 0", function() {
            var polygonWithShapeMargin = createPolygon([0,0, 100,0, 100,100, 0,100], 10);
            expect(polygonWithShapeMargin.shapeMarginEdges.length).to.equal(8);
        });
    });

    function checkExclusionEdges(polygon, y1, y2, expectedLeft, expectedRight) {
        expect(polygon.leftExclusionEdge(y1, y2)).to.equal(expectedLeft);
        expect(polygon.rightExclusionEdge(y1, y2)).to.equal(expectedRight);
    }

    function checkExclusionEdgesWithRound(polygon, y1, y2, expectedLeft, expectedRight) {
        expect(Math.round(polygon.leftExclusionEdge(y1, y2))).to.equal(expectedLeft);
        expect(Math.round(polygon.rightExclusionEdge(y1, y2))).to.equal(expectedRight);
    }

    describe("Polygon.left,rightExclusionEdge, 100x100 rectangle, shape-margin=0", function() { 
        function test(vertices, description) {
            var polygon = new Polygon(vertices, "evenodd", 0);
            describe(description, function() {
                it("line is above polygon", function() { checkExclusionEdges(polygon, -2, -1, undefined, undefined); });
                it("line is below polygon", function() { checkExclusionEdges(polygon, 101, 102, undefined, undefined); });
                it("line equals polygon vertical extent", function() { checkExclusionEdges(polygon, 0, 100, 0, 100); });
                it("line overlaps polygon vertical extent, above", function() { checkExclusionEdges(polygon, -100, 50, 0, 100); });
                it("line overlaps polygon vertical extent, below", function() { checkExclusionEdges(polygon, 50, 150, 0, 100); });
                it("line contains polygon vertical extent", function() { checkExclusionEdges(polygon, -100, 200, 0, 100)} );
            });
        }

        test(createVertices([0,0, 100,0, 100,100, 0,100]), "clockwise, first vertex = 0,0");
        test(createVertices([100,100, 0,100, 0,0, 100,0]), "clockwise, first vertex = 100,100");

        test(createVertices([100,0, 100,100, 0,100, 0,0], true), "counter-clockwise, first vertex = 100,0");
        test(createVertices([0,100, 0,0, 100,0, 100,100], true), "counter-clockwise, first vertex = 0,100");
    });

    describe("Polygon.left,rightExclusionEdge, 100x100 diamond", function() {
        var vertices = createVertices([50,0, 100,50, 50,100, 0,50]);
        describe("shape-margin=0", function() {
            var polygon = new Polygon(vertices, "evenodd", 0);
            it("line equals polygon vertical extent", function() { checkExclusionEdges(polygon, 0, 100, 0, 100); });
            it("line overlaps polygon vertical extent, above", function() { checkExclusionEdges(polygon, -100, 50, 0, 100); });
            it("line overlaps polygon vertical extent, below", function() { checkExclusionEdges(polygon, 50, 150, 0, 100); });
            it("line contains polygon vertical extent", function() { checkExclusionEdges(polygon, -100, 200, 0, 100)} );
            it("line overlaps polygon's top quarter", function() { checkExclusionEdges(polygon, 0, 25, 25, 75)} );
            it("line overlaps polygon's middle quarter", function() { checkExclusionEdges(polygon, 25, 75, 0, 100)} );
            it("line overlaps polygon's bottom quarter", function() { checkExclusionEdges(polygon, 75, 100, 25, 75)} );
        });

        describe("shape-margin=10", function() {
            var polygon = new Polygon(vertices, "evenodd", 10);
            it("line equals polygon vertical extent", function() { checkExclusionEdges(polygon, 0, 100, -10, 110); });
            it("line equals polygon + shape-margin vertical extent", function() { checkExclusionEdges(polygon, -10, 110, -10, 110); });
            it("line overlaps polygon's top quarter", function() { checkExclusionEdgesWithRound(polygon, 0, 25, 11, 89)} );
            it("line overlaps polygon's middle quarter", function() { checkExclusionEdges(polygon, 25, 75, -10, 110)} );
            it("line overlaps polygon's bottom quarter", function() { checkExclusionEdgesWithRound(polygon, 75, 100, 11, 89)} );
        });
    });
}

return {'register': register};
}();


