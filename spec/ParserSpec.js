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

  it("should parse two lines with next connecting them", function() {
    var statements = parser.parse("a = 1\nb = 2");

    var expect_statements = [
      new AssignmentNode("a", new NumberLiteralNode("1", 0), 0), 
      new AssignmentNode("b", new NumberLiteralNode("2", 1), 1)
    ];

    expect_statements[0].set_next_statement(expect_statements[1]);
    expect(statements).toEqual(expect_statements);
    expect(statements[0].next()).toEqual(statements[1]);
    expect(statements[1].next()).toEqual(null);
  });


  it("should parse three lines with next connecting them", function() {
    var statements = parser.parse("a = 1\nb = 2\noutput ( a )");
    var expect_statements = [
      new AssignmentNode("a", new NumberLiteralNode("1", 0), 0), 
      new AssignmentNode("b", new NumberLiteralNode("2", 1), 1),
      new FunctionNode("output", [new VariableNode("a", 2)], 2)
    ];

    expect_statements[0].set_next_statement(expect_statements[1]);
    expect_statements[1].set_next_statement(expect_statements[2]);


    expect(statements[0].next()).toEqual(statements[1]);
    expect(statements[1].next()).toEqual(statements[2]);
    expect(statements[2].next()).toEqual(null);

    expect(statements).toEqual(expect_statements);
  });


/*
  it("should parse and if statement and an end", function() {
    var statements = parser.parse("if 1 == 1\nend");
    
    expect(statements).toEqual(new IfNode(new NumberLiteralNode));
  });
*/

});


