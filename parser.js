var ASTNode = Class.extend({
  
});


var EmptyStatementNode = ASTNode.extend({

});

var FunctionNode = ASTNode.extend({
  init: function(name, args) {
    this.name = name;
    this.args = args;
  },

  class_name: "FunctionNode",

  operation: function(vm) {
    var function_node = this;
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
    var primitive = vm.primitives[this.name];
    if (primitive) {
      primitive.args = this.args
      return primitive.operation(vm);
    }
    else
      return this.operation(vm)
  }
});


var OutputPrimitiveNode = FunctionNode.extend({
  class_name: "OutputPrimitiveNode",

  operation: function(vm) {
    var output_primitive_node = this;
    return new Operation(
      function(vm) {
        this.output_length = vm.output.length();
      },
      function(vm) {
        var i;
        for (i = 0; i < output_primitive_node.args.length; i++) {
          arg = output_primitive_node.args[i];
          console.log("arg = ");
          console.log(arg);
          vm.output.push(arg.evaluate(vm));
        }
        vm.set_current_statement_index(vm.current_statement_index + 1);
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
    var assignment_node = this;
    return new Operation(
      function(vm) {
        this.lhs = assignment_node.lhs
        this.did_exist = vm.memory.exists(assignment_node.lhs);
        if (this.did_exist)
          this.old_value = vm.memory.get(assignment_node.lhs)
      },
      function(vm) {
        vm.memory.set(assignment_node.lhs, assignment_node.rhs.evaluate(vm));
        vm.set_current_statement_index(vm.current_statement_index + 1);
      },
      function(vm) {
        // if the value didn't exist
        if (!this.did_exist) 
          // remove it
          vm.memory.remove(this.lhs)
        else
          // restore the old value
          vm.memory.set(this.lhs, this.old_value);
      }
    )
  },

  generate_operations: function(vm) {
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
    eval_str = this.lhs.evaluate(vm) + " " + this.operation + " " + this.rhs.evaluate(vm);
    return eval(eval_str);
    //return eval(this.lhs.evaluate(vm) + " " + this.operation + " " + this.rhs.evaluate(vm));
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
    return vm.memory.get(this.name);
  }
});


// -------------------- VM classes ------------------------

var Memory = Class.extend({
  init: function(memory_ui) {
    this.memory_ui = memory_ui;
    this.entries = {};
  },

  class_name: "Memory",

  exists: function(name) {
    return (name in this.entries);
  },

  remove: function(name) {
    this.memory_ui.remove(name);
    delete this.entries[name];
  },

  get: function(name) {
    return this.entries[name]
  },

  set: function(name, value) {
    if (name in this.entries) 
      this.memory_ui.replace_value(name, value, this.entries[name]);
    else
      this.memory_ui.new_value(name, value);

    this.entries[name] = value;
  }
});

var Operation = Class.extend({
  init: function(capture_function, do_statement, undo_statement) {
    this.capture_function = capture_function;
    this.do_statement = do_statement;
    this.undo_statement = undo_statement;
  },

  class_name: "Operation",

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
  init: function(output_ui) {
    this.output_ui = output_ui;
    this.lines = [];
  },

  class_name: "Output",

  push: function(line) {
    var new_line_index = this.lines.length;
    this.lines.push(line);
    this.output_ui.new_line(new_line_index, line);
  },
  
  length: function() {
    return this.lines.length;
  },

  set_length: function(length) {
    var old_length = this.lines.length;
    this.lines = this.lines.slice(0, length);

    for (var index = this.lines.length; index < old_length; index++) {
      this.output_ui.remove_line(index);
    }
  }
})

var VirtualMachine = Class.extend({
  init: function(program_ui, memory_ui, output_ui) {
    this.program_ui = program_ui;
    this.memory_ui = memory_ui;
    this.output_ui = output_ui;
  },

  start: function(statements) {
    this.memory = new Memory(this.memory_ui);
    this.output = new Output(this.output_ui);
    this.primitives = {
      output: new OutputPrimitiveNode(this)
    };
    this.statements = statements;
    this.current_statement_index = 0;
    this.undo_stack = [];
  },

  class_name: "VirtualMachine",

  step: function() {
    if (this.current_statement_index == this.statements.length)
      return;

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
    old_index = this.current_statement_index;
    this.current_statement_index = new_index;
    this.program_ui.move_instruction_pointer(old_index, new_index);
  }
});

// -------------------- Parser classes ------------------------

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

var Lexer = Class.extend({
  init: function(source) {
    this.source = source;
    this.token_index = 0;
    this.tokens = [];
  },

  tokenize: function() {
    var lines = this.source.split(/\n/)
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
