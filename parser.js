var ASTNode = Class.extend({
  
});


var EmptyStatementNode = ASTNode.extend({

});

var FunctionNode = ASTNode.extend({
  init: function(name, arguments) {
    this.name = name;
    this.arguments = arguments;
  }
});

var AssignmentNode = ASTNode.extend({
  init: function(lhs, rhs) {
    this.lhs = lhs;
    this.rhs = rhs;
  }
});

var ExpressionNode = ASTNode.extend({
  init: function(lhs, operation, rhs) {
    this.lhs = lhs;
    this.operation = operation;
    this.rhs = rhs;
  }
});

var LiteralNode = ASTNode.extend({
  init: function(value) {
    this.value = value;
  }
});

var VariableNode = ASTNode.extend({
  init: function(name) {
    this.name = name;
  }
});


var Parser = Class.extend({
  init: function(string) {
    this.string = string;
    this.tokenizer = new Lexer(string);
    this.tokenizer.tokenize();
    this.statements = [];
  },

  parse: function() {
    try {
      while (!(this.tokenizer.end_of_tokens())) {
        this.statements.push(this.statement());
      }

      return this.statements;
    }
    catch (e) {
      console.log("exception: " + e);
      return null;
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
      var arguments = []
      while (next != "\n") {
        arguments.push(next)
        next = this.tokenizer.next_token();
      }

      return new FunctionNode(lhs, arguments);
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

var Lexer = Class.extend({
  init: function(string) {
    this.string = string;
    this.token_index = 0;
    this.tokens = [];
  },

  tokenize: function() {
    var lines = this.string.split(/\n/)
    var index = 0;
    
    for (index = 0; index < lines.length; index++) {
      line = lines[index];
      words = line.split(/\s+/)
      var word_index;
      for (word_index = 0; word_index < words.length; word_index++) {
        var word = words[word_index];
        if (word != "")
          this.tokens.push(word);
      }
      this.tokens.push("\n");
    }
    return this.tokens.length;
  },

  next_token: function() {
    if (this.token_index >= this.tokens.length)
      return null;
    else
      return this.tokens[this.token_index++];
  },

  unnext_token: function() {
    if (this.token_index > 0) {
      this.token_index--;
    }
  },

  end_of_tokens: function() {
    return this.token_index == this.tokens.length;
  }

});
