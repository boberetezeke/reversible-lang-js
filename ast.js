var ASTNode = Class.extend({
  
  init: function() {
    this.next_node = null;
    this.line_number = 0;
    this.start_column = 0;
    this.end_column = 0;
    this.follow_next_node = false;
  },

  set_line_number_and_columns: function (line_number, start_column, end_column) {
      this.line_number = line_number;
      this.start_column = start_column;
      this.end_column = end_column;
  },

  set_next_statement: function(ast_node, from_code_block) {
    this.next_node = ast_node;
    this.from_code_block = from_code_block;
  },

  next: function() {
    var node = this.next_node;
    var from_code_block = this.from_code_block
    while (node && from_code_block && node.follow_next_node) {
      from_code_block = node.from_code_block
      node = node.next_node;
    }
    return node;
  },

  generate_operations: function(vm) {
    return this.operation(vm);
  }
});


var EmptyStatementNode = ASTNode.extend({

});

var IfStatementNode = ASTNode.extend({
  init: function(iftype, expression, code_block, line_number) {
    this.iftype = iftype;
    this.expression = expression;
    this.code_block = code_block;
    this.else_code_block = null;
    code_block.parent_node = this;
    this.follow_next_node = true;
    if (arguments.length >= 4) 
      this.set_line_number_and_columns(line_number, 0, 0);
  },

  class_name: "IfStatementNode",

  operation: function(vm) {
    var if_statement_node = this;
    return new Operation(
      function(vm) {
      },
      function(vm) {
        var expression_func = if_statement_node.expression_operation.do(vm);
        return new Executor([expression_func], function() {
          var expression_value = expression_func.value()
          if (expression_value.value() === true) {
            if (if_statement_node.code_block.statements.length > 0)
              vm.set_current_statement(if_statement_node.code_block.statements[0]);
            else
              vm.set_current_statement(if_statement_node.next_node);
          }
          else {
            if (if_statement_node.else_code_block && if_statement_node.else_code_block.statements.length > 0)
              vm.set_current_statement(if_statement_node.else_code_block.statements[0]);
            else
              vm.set_current_statement(if_statement_node.next_node);
          }
        });
      },

      function(vm) {
      } 
    )
  },

  generate_operations: function(vm) {
    this.expression_operation = this.expression.generate_operations(vm);
    return this.operation(vm);
  }
  
});

var WhileStatementNode = ASTNode.extend({
  init: function(expression, code_block, line_number) {
    this.expression = expression;
    this.code_block = code_block;
    code_block.parent_node = this;
    if (arguments.length >= 3) 
      this.set_line_number_and_columns(line_number, 0, 0);
  },

  class_name: "WhileStatementNode",

  operation: function(vm) {
    var if_statement_node = this;
    return new Operation(
      function(vm) {
      },
      function(vm) {
        var expression_func = if_statement_node.expression_operation.do(vm);
        return new Executor([expression_func], function() {
          var expression_value = expression_func.value()
          if (expression_value.value() === true) {
            vm.set_current_statement(if_statement_node.code_block.statements[0]);
          }
          else {
            vm.set_current_statement(if_statement_node.next_node);
          }
        });
      },

      function(vm) {
      } 
    )
  },

  generate_operations: function(vm) {
    this.expression_operation = this.expression.generate_operations(vm);
    return this.operation(vm);
  }
});

var ElseStatementNode = ASTNode.extend({
});

var EndStatementNode = ASTNode.extend({
});

var CodeBlockNode = ASTNode.extend({
  init: function(parent_node, statements) {
    this._super();
    this.parent_node = parent_node;
    if (arguments.length >= 2) 
      this.statements = statements;
    else
      this.statements = [];
  },

  push_statement: function(statement) {
    // if there is a previous statement
    if (this.statements.length > 0) {
      // set it's next statement to the current statement
      var last_statement = this.statements[this.statements.length - 1];
      last_statement.set_next_statement(statement, false);
    }
    // add in this statement
    this.statements.push(statement);

    // this is now the last statement so set the parent as the
    // the next if there is a parent
    if (this.parent_node)
      statement.set_next_statement(this.parent_node, true);
  }
  
});


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

    if (this.primitive) 
      return this.primitive.operation(vm);
    else if (!this.primitive && primitive_func) {
      this.primitive = primitive_func();
      this.primitive.args = this.args;
      this.primitive.line_number = this.line_number;
      this.primitive.start_column = this.start_column;
      this.primitive.end_column = this.end_column;
      this.primitive.next_node = this.next_node
      this.primitive.from_code_block = this.from_code_block;
      this.primitive.follow_next_node = this.follow_next_node;
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
        this.lhs = assignment_node.lhs
        this.did_exist = vm.memory.exists(this.lhs);
        if (this.did_exist) {
          this.old_value = vm.memory.get(this.lhs)
        }
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
        if (!this.did_exist) 
          // remove it
          vm.memory.remove(this.lhs)
        else
          // restore the old value
          vm.memory.set(this.lhs, this.old_value);
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
  init: function(lhs, operation_string, rhs, line_number) {
    this._super();
    this.lhs = lhs;
    this.operation_string = operation_string;
    this.rhs = rhs;
    if (arguments.length >= 4)
      this.line_number = line_number;
  },

  class_name: "ExpressionNode",

  operation: function(vm) {
    var expression_node = this;
    return new Operation(
      function(vm) {
        expression_node.lhs_operation.capture_current_state(vm);
        expression_node.rhs_operation.capture_current_state(vm);
      },
      function(vm) {
        var lhs_func = expression_node.lhs_operation.do(vm);
        var rhs_func = expression_node.rhs_operation.do(vm);
        return new Executor([lhs_func, rhs_func], function() {
          var eval_str = lhs_func.value().value() + " " + expression_node.operation_string + " " + rhs_func.value().value();
          var value = eval(eval_str);
          if (typeof(value) == "number")
            return new NumberClass(value);
          else if (typeof(value) == "string")
            return new StringClass(value);
          else if (typeof(value) == "boolean")
            return new BooleanClass(value);
          else
            return new NumberClass(value);
        });
      },
      function(vm) {
        expression_node.rhs_operation.undo(vm);
        expression_node.lhs_operation.undo(vm);
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
    var number_literal_node = this;
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
    var string_literal_node = this;
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
    var variable_node = this;
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


