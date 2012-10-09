describe("Parser", function() {
  var parser;

  beforeEach(function() {
    parser = new Parser();
  });

  it("should be able to parse an empty string", function() {
    expect(parser.parse("")).toEqual([]);
  });

  it("should be able to parse an assignment with a number", function() {
    expect(parser.parse("a = 1")).toEqual([new AssignmentNode("a", new NumberLiteralNode("1"))]);
  });

  it("should be able to parse an assignment with a parenthesized number", function() {
    expect(parser.parse("a = ( 1 )")).toEqual([new AssignmentNode("a", new NumberLiteralNode("1"))]);
  });

  it("should be able to parse an assignment with simple expression", function() {
    expect(parser.parse("a = 1 + 1")).toEqual([new AssignmentNode("a", new ExpressionNode(new NumberLiteralNode("1"), "+", new NumberLiteralNode("1")))]);
  });

  it("should be able to parse an assignment with simple expression with two operators", function() {
    expect(parser.parse("a = 1 + 1 + 1")).toEqual([new AssignmentNode("a", new ExpressionNode(new NumberLiteralNode("1"), "+", new ExpressionNode(new NumberLiteralNode("1"), "+", new NumberLiteralNode("1"))))]);
  });

  it("should be able to parse an assignment with an expression with a number an operator and a function call", function() {
    expect(parser.parse("a = 1 + f ( 3 )")).toEqual([new AssignmentNode("a", new ExpressionNode(new NumberLiteralNode("1"), "+", new FunctionNode("f", [new NumberLiteralNode("3")])))]);
  });

  it("should be able to parse an assignment with an expression with a number an operator and a function call", function() {
    expect(parser.parse("a = ( height > 72 ) && ( weight < 100 )")).toEqual([new AssignmentNode("a", new ExpressionNode(new ExpressionNode(new VariableNode("height"), ">", new NumberLiteralNode("72")), "&&", new ExpressionNode(new VariableNode("weight"), "<", new NumberLiteralNode("100")) ))]);
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

    expect_statements[0].set_next_statement(expect_statements[1], false);
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

    expect_statements[0].set_next_statement(expect_statements[1], false);
    expect_statements[1].set_next_statement(expect_statements[2], false);


    expect(statements[0].next()).toEqual(statements[1]);
    expect(statements[1].next()).toEqual(statements[2]);
    expect(statements[2].next()).toEqual(null);

    expect(statements).toEqual(expect_statements);
  });

  it("should parse an if statement and an end", function() {
    var statements = parser.parse("if 1 == 1\nend");
    
    expect(statements).toEqual([new IfStatementNode(
      "if",
      new ExpressionNode(new NumberLiteralNode("1"), "==", new NumberLiteralNode("1"), 0),
      new CodeBlockNode(), 0)]);
  });

/*
  it("should parse an if statement with a function call and number expression and an end", function() {
    var statements = parser.parse("if input ( \"enter number\" ) == 1\nend");
    
    expect(statements).toEqual([new IfStatementNode(
      "if",
      new ExpressionNode(new FunctionNode("input_string", ["enter number"], 0), "==", new NumberLiteralNode("1"), 0),
      new CodeBlockNode(), 0)]);
  });
*/


  it("should parse and if statement an inner statement and an end", function() {
    var statements = parser.parse("if 1 == 1\na = 1\nend");
    var assignment_node = new AssignmentNode("a", new NumberLiteralNode("1", 1), 1);
    var if_statement_node = new IfStatementNode(
      "if",
      new ExpressionNode(new NumberLiteralNode("1"), "==", new NumberLiteralNode("1"), 0),
      new CodeBlockNode(
        null, 
        [assignment_node] 
      ), 0);
      assignment_node.set_next_statement(if_statement_node, true);
    expect(statements).toEqual([if_statement_node]);
  });

  it("should parse and if statement, an inner statement, else, inner, and an end", function() {
    var statements = parser.parse("if 1 == 1\na = 1\nelse\na = 2\nend");
    var assignment_node1 = new AssignmentNode("a", new NumberLiteralNode("1", 1), 1);
    var assignment_node2 = new AssignmentNode("a", new NumberLiteralNode("2", 3), 3);
    var if_statement_node = new IfStatementNode(
      "if",
      new ExpressionNode(new NumberLiteralNode("1"), "==", new NumberLiteralNode("1"), 0),
      new CodeBlockNode(
        null, 
        [assignment_node1] 
      ), 0);
    assignment_node1.set_next_statement(if_statement_node, true);
    assignment_node2.set_next_statement(if_statement_node, true);
    if_statement_node.else_code_block = new CodeBlockNode(if_statement_node, [assignment_node2]);

    expect(statements).toEqual([if_statement_node]);
  });

  // error cases

  it("should error on a missing end for if", function() {
    try {
      var statements = parser.parse("if 1 == 1\n")
    }
    catch(e) {
      expect(e).toEqual("0: no closing end for if found");
    }
  });

  it("should error on a missing end for if/else", function() {
    try {
      var statements = parser.parse("a = 0\nif 1 == 1\na = 1\nelse\na = 2")
    }
    catch(e) {
      expect(e).toEqual("1: no closing end for if found");
    }
  });

  it("should error on a missing end for while", function() {
    try {
      var statements = parser.parse("while 1 == 1\n")
    }
    catch(e) {
      expect(e).toEqual("0: no closing end for while found");
    }
  });
  // FIXME: test multiple else statements
});


