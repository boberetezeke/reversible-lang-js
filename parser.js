var ASTNode = Class.extend({
  
});


var EmptyStatementNode = ASTNode.extend({

});

var FunctionNode = ASTNode.extend({
  init: function(name, arguments) {
    this.name = name;
    this.arguments = arguments;
  },

  class_name: "FunctionNode",

  operation: function(vm) {
    function_node = this;
    return new Operation(
      function(vm) {
        this.old_stack_frame_position = vm.current_stack_frame_position
      },
      function(vm) {
        vm.create_new_stack_frame(function_node);
      },
      function(vm) {
        vm.restore_stack_frame(this.old_stack_frame_position);
      }
    )
  },

  generate_operations: function(vm) {
console.log("in function generate operations");
    var primitive = vm.primitives[this.name];
    if (primitive) 
      return primitive.operation(vm);
    else
      return this.operation(vm)
  }
});


var OutputPrimitiveNode = FunctionNode.extend({
  class_name: "OutputPrimitiveNode",

  operation: function(vm) {
    output_primitive_node = this;
    return new Operation(
      function(vm) {
        this.output_length = vm.output.length();
      },
      function(vm) {
        var i;
        for (i = 0; i < this.arguments.length; i++) {
          this.output.push(this.arguments[i].evaluate());
        }
      },
      function(vm) {
        vm.output.set_length(this.output_length)
      }
    );  
  }
});

var AssignmentNode = ASTNode.extend({
  init: function(lhs, rhs) {
    this.lhs = lhs;
    this.rhs = rhs;
  },

  class_name: "AssignmentNode",

  operation: function(vm) {
    assignment_node = this;
    return new Operation(
      function(vm) {
        this.old_value = vm.memory.get(this.lhs)
      },
      function(vm) {
        vm.memory.set(assignment_node.lhs, assignment_node.rhs.evaluate());
        vm.set_current_statement_index(vm.current_statement_index + 1);
      },
      function(vm) {
        vm.memory.set(assignment_node.lhs, this.old_value);
      }
    )
  },

  generate_operations: function(vm) {
console.log("in assignment generate operations");
    return this.operation(vm);
  }

});

var ExpressionNode = ASTNode.extend({
  init: function(lhs, operation, rhs) {
    this.lhs = lhs;
    this.operation = operation;
    this.rhs = rhs;
  },

  class_name: "ExpressionNode",

  evaluate: function(vm) {
    return eval(this.lhs + " " + this.operation + " " + this.rhs);
  }
});

var LiteralNode = ASTNode.extend({
  init: function(value) {
    this.value = value;
  },

  class_name: "LiteralNode",
  
  evaluate: function(vm) {
    return this.value;
  }
});

var VariableNode = ASTNode.extend({
  init: function(name) {
    this.name = name;
  },

  class_name: "VariableNode",

  evaluate: function(vm) {
    vm.memory[this.name];
  }
});


// -------------------- VM classes ------------------------

var Memory = Class.extend({
  init: function() {
    this.entries = {};
  },

  class_name: "Memory",

  get: function(name) {
    this.entries[name]
  },

  set: function(name, value) {
    // TODO: update view
    this.entries[name] = value;
  }
});

var Operation = Class.extend({
  init: function(capture_function, do_statement, undo_statement) {
    this.capture_function = capture_function;
    this.do_statement = do_statement;
    this.undo_statement = undo_statement;
  },

  capture_current_state: function(vm) {
    this.saved_current_statement_index = vm.current_statement_index;
    this.capture_function(vm);
  },

  do: function(vm) {
    this.do_statement(vm);
  },

  undo: function(vm) {
    this.undo_statement(vm);
    vm.set_current_statement_index(this.saved_current_statement_index);
  }
});

var Output = Class.extend({
  init: function() {
    this.lines = [];
  },

  class_name: "Output",

  push: function(line) {
    // TODO: update output view
    this.lines.push(lines);
  },
  
  length: function() {
    return this.lines.length;
  },

  set_length: function(length) {
    // TODO: update the output view
    this.lines.slice(0, length);
  }
})

var VirtualMachine = Class.extend({
  init: function(statements) {
    this.memory = new Memory;
    this.output = new Output;
    this.primitives = {
      output: new OutputPrimitiveNode(this)
    };
    this.statements = statements;
    this.current_statement_index = 0;
    this.undo_stack = [];
  },

  class_name: "VirtualMachine",

  step: function() {
    var current_statement = this.statements[this.current_statement_index];
    var operation = current_statement.generate_operations(this)

    operation.capture_current_state(this);
    operation.do(this)
    this.undo_stack.push(operation);
  },

  unstep: function() {
    if (this.undo_stack.length > 0)
      this.undo_stack.pop().undo(this);
  },

  set_current_statement_index: function(new_index) {
    // TODO: update on screen instruction pointer
    this.current_statement_index = new_index;
  }
});

// -------------------- Parser classes ------------------------

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
