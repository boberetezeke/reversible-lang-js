describe("Parser", function() {
  var parser;

  beforeEach(function() {
    parser = new Parser();
  });

  it("should be able to parse an empty string", function() {
    expect(parser.parse("")).toEqual([new EmptyStatementNode()]);
  });

  it("should be able to parse an assignment with a number", function() {
    expect(parser.parse("a = 1")).toEqual([new AssignmentNode("a", new NumberLiteralNode("1"))]);
  });

  it("should be able to parse an assignment with a string", function() {
    expect(parser.parse("a = \"fred's life\"")).toEqual([new AssignmentNode("a", new StringLiteralNode("fred's life"))]);
  });

  it("should be able to parse a function call with one number literal argument", function() {
    expect(parser.parse("output ( 1 )")).toEqual([new FunctionNode("output", [new NumberLiteralNode("1")])]);
  });

  it("should be able to parse a function call with one string literal argument", function() {
    expect(parser.parse("output ( \"fred's bank\" )")).toEqual([new FunctionNode("output", [new StringLiteralNode("fred's bank")])]);
  });

  it("should be able to parse a function call with one variable argument", function() {
    expect(parser.parse("output ( a )")).toEqual([new FunctionNode("output", [new VariableNode("a")])]);
  });
});


