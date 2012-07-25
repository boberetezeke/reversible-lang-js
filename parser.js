
var Parser = Class.extend({
  init: function() {
    this.code_block = new CodeBlockNode(null);
  },

  parse: function(source) {
    this.tokenizer = new Lexer(source);
    this.tokenizer.tokenize();

    try {
      while (!(this.tokenizer.end_of_tokens())) {
        this.code_block.push_statement(this.statement());
      }

      return this.code_block.statements;
    }
    catch (e) {
      console.log("exception: " + e);
      throw(e);
    }
  },

  statement: function() {
    var lhs = this.tokenizer.next_token();
    //console.log("statement: lhs = <" + lhs.string + ">");
    if (lhs.is_end_of_line()) {
      empty_statement_node = new EmptyStatementNode();
      empty_statement_node.set_line_number_and_columns(lhs.line_number, lhs.start_column, lhs.end_column);
      return empty_statement_node;
    }

    else if (lhs.is_equal_to("if") || lhs.is_equal_to("elsif")) {
      var expr = this.expression();
      var next = this.tokenizer.next_token();

      if (!next.is_end_of_line())
        throw("extra token <" + next.string + "> after if expression");
    
      var if_statement_node = new IfStatementNode(lhs.string, expr, new CodeBlockNode);
      var code_block = if_statement_node.code_block;
      while (true) {
        var statement = this.statement();
        if (statement instanceof ElseStatementNode) {
          if (if_statement_node.else_code_block) {
            throw "multiple else statements found for if";
          }
          if_statement_node.else_code_block = new CodeBlockNode(if_statement_node);
          code_block = if_statement_node.else_code_block;
          continue;
        }
        else if (statement instanceof EndStatementNode) 
          break;
        
        code_block.push_statement(statement); 
      } 

      if_statement_node.set_line_number_and_columns(lhs.line_number, lhs.start_column, lhs.end_column);
      return if_statement_node;
    }

    else if (lhs.is_equal_to("else")) {
      var next = this.tokenizer.next_token();
     
      if (!next.is_end_of_line())
        throw("else not alone on line"); 

      return new ElseStatementNode(lhs, expr);
    }

    else if (lhs.is_equal_to("while")) {
      var expr = this.expression();
      var next = this.tokenizer.next_token();

      if (!next.is_end_of_line())
        throw("extra token <" + next.string + "> after while expression");
    
      var while_statement_node = new WhileStatementNode(expr, new CodeBlockNode);
      while (true) {
        var statement = this.statement();
        if (statement instanceof EndStatementNode) 
          break;
        
        while_statement_node.code_block.push_statement(statement); 
      } 

      while_statement_node.set_line_number_and_columns(lhs.line_number, lhs.start_column, lhs.end_column);
      return while_statement_node;
    }

    else if (lhs.is_equal_to("end")) {
      var next = this.tokenizer.next_token();
     
      if (!next.is_end_of_line())
        throw("end not alone on line"); 

      return new EndStatementNode();
    }

    else {
      var next = this.tokenizer.next_token();

      //console.log("statement: next = <" + next.string + ">");
      if (next.is_equal_to("=")) {
        return this.assignment_statement(lhs);
      }
      else if (next.is_equal_to("(")) {
        var args = []
        while (!next.is_equal_to(")") && !next.is_equal_to("\n")) {
          args.push(this.expression());
          next = this.tokenizer.next_token();
          if (next.is_equal_to(",")) 
            next = this.tokenizer.next_token();
        }

        if (next.is_end_of_line())
          throw("no closing paren for function invocation");

        var closing_paren_token = next;

        next = this.tokenizer.next_token();
        if (!next.is_end_of_line())
          throw("exteraneous tokens after function closing paren = '" + next + "'"); 

        var function_node = new FunctionNode(lhs.string, args);
        function_node.set_line_number_and_columns(lhs.line_number, lhs.start_column, closing_paren_token.end_column); 
        return function_node;
      }
      else
        throw("only assignment and function call statements allowed");
    }
  },

  assignment_statement: function(lhs) {
    var rhs = this.tokenizer.next_token();
    //console.log("assignment_statement: rhs = <" + rhs.string + ">");
    if (rhs.is_end_of_line()) {
      throw("no rhs for assignment");
    }
    else {
      this.tokenizer.unnext_token();
      rhs = this.expression();
      newline = this.tokenizer.next_token()

      if (!newline.is_end_of_line()) {
        throw("newline expected after assignment expression");
      }
      else {
        assignment_node = new AssignmentNode(lhs.string, rhs);
        assignment_node.set_line_number_and_columns(lhs.line_number, lhs.start_column, lhs.end_column);
        return assignment_node;
      }
    }
  },

  expression: function() {
    var expr1 = this.variable_or_literal(this.tokenizer.next_token());
    var op = this.tokenizer.next_token();
    //console.log("expression: expr1 = <" + expr1 + ">, op = <" + op.string + ">");
    if (op.is_end_of_line() || op.is_equal_to(")")) {
      var op = this.tokenizer.unnext_token();
      return expr1;
    }
    else if (op.is_equal_to("(")) {

      var args = []
      var next = this.tokenizer.next_token();
      while (!next.is_equal_to(")") && !next.is_end_of_line()) {
        this.tokenizer.unnext_token();
        args.push(this.expression());
        next = this.tokenizer.next_token();
      }

      if (next.is_end_of_line()) {
        throw("function missing closing ')'");
      }

      return new FunctionNode(expr1.name, args);
    }
    else if (op.is_one_of(["-", "+", "*", "/", "==", "!=", "<", "<=", ">", ">="])) {
      var expr2 = this.variable_or_literal(this.tokenizer.next_token());
      return new ExpressionNode(expr1, op.string, expr2);
    }
    else {
      throw("invalid operation in expression: " + op);
    }
  },

  variable_or_literal: function(token) {
    if (token.is_end_of_line()) {
      throw("end of line received when expecting variable or literal");
    }

    var node;
    // if starts with a number or ", then its a literal
    if (/^[0-9"]/.exec(token.string)) {
      node = this.literal(token);
    }
    else {
      node = this.variable(token);
    }
    node.set_line_number_and_columns(token.line_number, token.start_column, token.end_column);
    return node;
  },

  variable: function(token) {
    return new VariableNode(token.string);
  },

  literal: function(token) {
    if (/^[0-9]+$/.exec(token.string)) {
      return new NumberLiteralNode(token.string);
    }
    else if (m = /^"([^"]*)"$/.exec(token.string)) {
      return new StringLiteralNode(m[1]);
    }
    else {
      throw("invalid literal: " + token.string);
    }
  }

});

