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

