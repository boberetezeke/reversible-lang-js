
var Parser = Class.extend({
  init: function() {
    this.statements = [];
  },

  parse: function(source) {
    this.tokenizer = new Lexer(source);
    this.tokenizer.tokenize();

    try {
      while (!(this.tokenizer.end_of_tokens())) {
        this.statements.push(this.statement());
      }

      return this.statements;
    }
    catch (e) {
      console.log("exception: " + e);
      throw(e);
    }
  },

  statement: function() {
    var lhs = this.tokenizer.next_token();
    console.log("statement: lhs = <" + lhs + ">");
    if (lhs == "\n") {
      return new EmptyStatementNode();
    }

    var next = this.tokenizer.next_token();
    console.log("statement: next = <" + next + ">");
    if (next == "=") {
      return this.assignment_statement(lhs);
    }
    else {
      var args = []
      while (next != "\n") {
        this.tokenizer.unnext_token();
        args.push(this.expression());
        next = this.tokenizer.next_token();
      }

      return new FunctionNode(lhs, args);
    }
  },

  assignment_statement: function(lhs) {
    var rhs = this.tokenizer.next_token();
    console.log("assignment_statement: rhs = <" + rhs + ">");
    if (rhs == "\n") {
      throw("no rhs for assignment");
    }
    else {
      this.tokenizer.unnext_token();
      rhs = this.expression();
      newline = this.tokenizer.next_token();

      if (newline != "\n") {
        throw("newline expected after assignment expression");
      }
      else {
        return new AssignmentNode(lhs, rhs);
      }
    }
  },

  expression: function() {
    var expr1 = this.variable_or_literal(this.tokenizer.next_token());
    var op = this.tokenizer.next_token();
    console.log("expression: expr1 = <" + expr1 + ">, op = <" + op + ">");
    if (op == "\n") {
      var op = this.tokenizer.unnext_token();
      return expr1;
    }
    else if (op == "-" || op == "+" || op == "*" || op == "/") {
      var expr2 = this.variable_or_literal(this.tokenizer.next_token());
      return new ExpressionNode(expr1, op, expr2);
    }
    else {
      throw("invalid operation in expression: " + op);
    }
  },

  variable_or_literal: function(string) {
    if (string == "\n") {
      throw("end of line received when expecting variable or literal");
    }

    if (/^[0-9]/.exec(string)) {
      return this.literal(string);
    }
    else {
      return this.variable(string);
    }
  },

  variable: function(string) {
    return new VariableNode(string);
  },

  literal: function(string) {
    if (/^[0-9]+$/.exec(string)) {
      return new LiteralNode(string);
    }
    else {
      throw("invalid literal: " + string);
    }
  }

});

