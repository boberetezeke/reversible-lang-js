var ASTNode = Class.extend({
  
  init: function() {
    this.nextNode = null;
    this.line_number = 0;
    this.start_column = 0;
    this.end_column = 0;
  },

  set_line_number_and_columns: function (line_number, start_column, end_column) {
      this.line_number = line_number;
      this.start_column = start_column;
      this.end_column = end_column;
  },

  set_next_statement: function(ast_node) {
    this.nextNode = ast_node;
  },

  next: function() {
    return this.nextNode;
  },

  generate_operations: function(vm) {
    return this.operation(vm);
  }
});


var EmptyStatementNode = ASTNode.extend({

});

/*
var IfStatementNode = ASTNode.extend({
  init: function(expression) {
    this.expression = expression;
  },

  class_name: "IfStatementNode",

  operation: function(vm) {
    var if_statement_node = this;
    return new Operation(
      function() {
      },
      function(vm) {
        var expression_func = if_statement_node.expression.do(vm);
        return new Executor([expression_func], function() {
          var expression_value = expression.value()
          if (expression_value === true) {
                        
          }
          else {
            vm.set
      },
      function(vm) {
      } 
  },

  generate_operations: function(vm) {
    return this.operation(vm);
  }
  
});
*/

var FunctionNode = ASTNode.extend({
  init: function(name, args, line_number) {
    this._super();
    this.name = name;
    this.args = args;
    if (arguments.length >= 3)
      this.line_number = line_number;
  },

  class_name: "FunctionNode",

  operation: function(vm) {
    var function_node = this;
    var primitive_func = vm.primitives[this.name];

    if (!this.primitive && primitive_func) {
      this.primitive = primitive_func();
      this.primitive.args = this.args;
      this.primitive.line_number = this.line_number;
      this.primitive.start_column = this.start_column;
      this.primitive.end_column = this.end_column;
      this.primitive.nextNode = this.nextNode
      return this.primitive.operation(vm);
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

/*
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
*/

var InputPrimitiveNode = FunctionNode.extend({
  class_name: "InputPrimitiveNode",

  operation: function(vm, value_class, args) {
    var input_primitive_node = this;
    return new Operation(
      function(vm) {
        this.output_length = vm.output.length();
      },
      function(vm) {
        var arg_funcs = [];
        for (i = 0; i < args.length; i++) {
          arg = args[i];
          arg_funcs.push(arg.generate_operations(vm).do(vm));
        }

        return new Executor(arg_funcs, function() {
          var button_id = vm.new_dom_id();
          var input_id = vm.new_dom_id();

          input_primitive_node.promise = new PromiseClass();
          vm.output.push(
            '<span>' + args[0].value + '</span>' + 
            '<input type="text" id="' + input_id + '" />' + 
            '<input id="' + button_id + '" type="submit" value="submit" />'
          );

          $("#" + button_id).live("click", function() {
            $("#" + button_id).hide();
            $("#" + input_id).attr("disabled", "disabled");
            input_primitive_node.promise.satisfy();
            vm.widget_ui.resume();
          });

          input_primitive_node.promise.set_value_function(function() {
            return new value_class($("#" + input_id).val());
          });

          return input_primitive_node.promise;
        });
      },

      function(vm) {
        vm.output.set_length(this.output_length)
      }
    );  
  }

});


var InputStringPrimitiveNode = FunctionNode.extend({
  class_name: "InputStringPrimitiveNode",

  operation: function(vm) {
    var input_string_primitive_node = this;
    var input_primitive_node_object = new InputPrimitiveNode;
    return input_primitive_node_object.operation(vm, StringClass, input_string_primitive_node.args);
  }
});

var InputNumberPrimitiveNode = FunctionNode.extend({
  class_name: "InputNumberPrimitiveNode",

  operation: function(vm) {
    var input_string_primitive_node = this;
    var input_primitive_node_object = new InputPrimitiveNode;
    return input_primitive_node_object.operation(vm, NumberClass, input_string_primitive_node.args);
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
            vm.output.push(String(arg.value()));
          }
          vm.set_current_statement(output_primitive_node.next());
        });
      },
      function(vm) {
        vm.output.set_length(this.output_length)
      }
    );  
  }
});

var AssignmentNode = ASTNode.extend({
  init: function(lhs, rhs, line_number) {
    this._super();
    this.lhs = lhs;
    this.rhs = rhs;
    if (arguments.length >= 3)
      this.line_number = line_number;
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
          vm.set_current_statement(assignment_node.next());
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
  init: function(lhs, operation, rhs, line_number) {
    this._super();
    this.lhs = lhs;
    this.operation = operation;
    this.rhs = rhs;
    if (arguments.length >= 4)
      this.line_number = line_number;
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
  init: function(value, line_number) {
    this._super();
    this.value = value;
    if (arguments.length >= 2)
      this.line_number = line_number;
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
            return new NumberClass(number_literal_node.value);
          }
        );
      },
      function(vm) {
      }
    )
  }
});

var StringLiteralNode = ASTNode.extend({
  init: function(value, line_number) {
    this._super();
    this.value = value;
    if (arguments.length >= 2)
      this.line_number = line_number;
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
            return new StringClass(string_literal_node.value);
          }
        );
      },
      function(vm) {
      }
    )
  }
});

var VariableNode = ASTNode.extend({
  init: function(name, line_number) {
    this._super();
    this.name = name;
    if (arguments.length >= 2) 
      this.line_number = line_number;
  },

  class_name: "VariableNode",

  operation: function(vm) {
    variable_node = this;
    return new Operation(
      function(vm) {
      },
      function(vm) {
        return new Executor([], 
          function() {
            return vm.memory.get(variable_node.name);
          }
        );
      },
      function(vm) {
      }
    )
  }
});


