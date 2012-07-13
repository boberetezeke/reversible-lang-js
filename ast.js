var ASTNode = Class.extend({
  
  generate_operations: function(vm) {
    return this.operation(vm);
  }
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
    var primitive = vm.primitives[this.name];

    if (primitive) {
      primitive.args = this.args
      return primitive.operation(vm);
    }
    else {
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
    }
  },

  generate_operations: function(vm) {
    return this.operation(vm);
  }
});


var WaitForPrimitiveNode = FunctionNode.extend({
  class_name: "WaitForPrimitiveNode",

  operation: function(vm) {
    var wait_for_primitive_node = this;
    return new Operation(
      function(vm) {
        var arg_funcs = [];
        for (var i = 0; i < wait_for_primitive_node.args.length; i++) {
          arg = wait_for_primitive_node.args[i];
          arg_funcs.push(arg.generate_operations(vm).do(vm));
        }
      },
      function(vm) {
        return new Executor(arg_funcs, function() {
          var return_value;
          for (var i = 0; i < arg_funcs.length; i++) {
            return_value = arg_funcs[i].value();
          }
          vm.set_current_statement_index(vm.current_statement_index + 1);
          return return_value;
        });
      },
      function(vm) {
      }
    );
  }
});

var InputPrimitiveNode = FunctionNode.extend({
  class_name: "InputPrimitiveNode",

  operation: function(vm) {
    var input_primitive_node = this;
    return new Operation(
      function(vm) {
        this.output_length = vm.output.length();
      },
      function(vm) {
        var arg_funcs = [];
        for (i = 0; i < input_primitive_node.args.length; i++) {
          arg = input_primitive_node.args[i];
          arg_funcs.push(arg.generate_operations(vm).do(vm));
        }

        return new Executor(arg_funcs, function() {
          var button_id = vm.new_dom_id();
          var input_id = vm.new_dom_id();

          input_primitive_node.promise = new PromiseClass();
          vm.output.push(
            '<span>' + input_primitive_node.args[0].value + '</span>' + 
            '<input type="text" id="' + input_id + '" />' + 
            '<input id="' + button_id + '" type="submit" value="submit" />'
          );

          $("#" + button_id).live("click", function() {
            $("#" + button_id).hide();
            $("#" + input_id).attr("disabled", "disabled");
            input_primitive_node.promise.satisfy();
            vm.widget_ui.step();
          });

          input_primitive_node.promise.set_value_function(function() {
            return $("#" + input_id).val();
          });

          //vm.set_current_statement_index(vm.current_statement_index + 1);
          return input_primitive_node.promise;
        });
      },

      function(vm) {
        vm.output.set_length(this.output_length)
      }
    );  
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
        var arg_funcs = [];
        for (i = 0; i < output_primitive_node.args.length; i++) {
          arg = output_primitive_node.args[i];
          arg_funcs.push(arg.generate_operations(vm).do(vm));
        }

        return new Executor(arg_funcs, function() {
          var i;
          for (i = 0; i < arg_funcs.length; i++) {
            var arg = arg_funcs[i].value();
            vm.output.push(arg);
          }
          vm.set_current_statement_index(vm.current_statement_index + 1);
        });
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
        assignment_node.rhs_operation.capture_current_state(vm);
        assignment_node.lhs = assignment_node.lhs
        assignment_node.did_exist = vm.memory.exists(assignment_node.lhs);
        if (assignment_node.did_exist)
          assignement_node.old_value = vm.memory.get(assignment_node.lhs)
      },
      function(vm) {
        var rhs_func = assignment_node.rhs_operation.do(vm);
        return new Executor([rhs_func], function() {
          var value = rhs_func.value()
          vm.memory.set(assignment_node.lhs, value);
          vm.set_current_statement_index(vm.current_statement_index + 1);
          return value;
        });
      },
      function(vm) {
        // if the value didn't exist
        if (!assignment_node.did_exist) 
          // remove it
          vm.memory.remove(assignment_node.lhs)
        else
          // restore the old value
          vm.memory.set(assignement_node.lhs, assignment_node.old_value);
        assignment_node.rhs_operation.undo(vm);
      }
    )
  },

  generate_operations: function(vm) {
    this.rhs_operation = this.rhs.generate_operations(vm);
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

  operation: function(vm) {
    return new Operation(
      function(vm) {
        this.lhs_operation.capture_current_state(vm);
        this.rhs_operation.capture_current_state(vm);
      },
      function(vm) {
        var lhs_func = this.lhs_operation.do(vm);
        var rhs_func = this.rhs_operation.do(vm);
        return new Executor([lhs_func, rhs_func], function() {
          eval_str = lhs_func.value() + " " + this.operation + " " + rhs_func.value();
          return eval(eval_str);
        });
      },
      function(vm) {
        this.rhs_operation.undo(vm);
        this.lhs_operation.undo(vm);
      }
    )
  },

  generate_operations: function(vm) {
    this.lhs_operation = this.lhs.generate_operations(vm);
    this.rhs_operation = this.rhs.generate_operations(vm);
    return this.operation(vm);
  }

});

var NumberLiteralNode = ASTNode.extend({
  init: function(value) {
    this.value = value;
  },

  class_name: "NumberLiteralNode",
  
  operation: function(vm) {
    number_literal_node = this;
    return new Operation(
      function(vm) {
      },
      function(vm) {
        return new Executor([], 
          function() {
            return number_literal_node.value
          }
        );
      },
      function(vm) {
      }
    )
  }
});

var StringLiteralNode = ASTNode.extend({
  init: function(value) {
    this.value = value;
  },

  class_name: "StringLiteralNode",
  
  operation: function(vm) {
    string_literal_node = this;
    return new Operation(
      function(vm) {
      },
      function(vm) {
        return new Executor([], 
          function() {
            return string_literal_node.value;
          }
        );
      },
      function(vm) {
      }
    )
  }
});

var VariableNode = ASTNode.extend({
  init: function(name) {
    this.name = name;
  },

  class_name: "VariableNode",

  operation: function(vm) {
    return new Operation(
      function(vm) {
      },
      function(vm) {
        return new Executor([], 
          function() {
            return vm.memory.get(this.name);
          }
        );
      },
      function(vm) {
      }
    )
  }
});


