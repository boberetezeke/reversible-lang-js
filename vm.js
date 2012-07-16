
var Executor = Class.extend({
  init: function(dependencies, value_function) {
    this.dependencies = dependencies;
    this.value_function = value_function;
    this.resolved = false;
    this.promised = false;
    this.promise_satisfied = false;
  },

  available: function() {
    return this.resolve();
  },

  resolve: function() {
    if (!this.resolved) {
      this.resolved = true;
      this.resolved_value = this.value_function();

      if (this.resolved_value instanceof(PromiseClass)) {
        this.promised = true;
        if (!this.resolved_value.satisfied())
          return false;
      }
    }

    if (this.promised) {
      if (!this.promise_satisfied && this.resolved_value.satisfied()) {
        this.promise_satisfied = true;
        this.resolved_value = this.resolved_value.value();
      }
    }

    return (!this.promised || this.promise_satisfied);
  },

  value: function() {
    return this.resolved_value;
  }
});

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
  class_name: "VirtualMachine",

  init: function(widget_ui, program_ui, memory_ui, output_ui) {
    this.widget_ui = widget_ui;
    this.program_ui = program_ui;
    this.memory_ui = memory_ui;
    this.output_ui = output_ui;
    this.current_dom_id_num = 1;
  },

  start: function(statements) {
    this.memory = new Memory(this.memory_ui);
    this.output = new Output(this.output_ui);
    this.primitives = {
      input_string: new InputStringPrimitiveNode(this),
      input_number: new InputNumberPrimitiveNode(this),
      output: new OutputPrimitiveNode(this)
    };
    this.statements = statements;
    this.current_statement_index = 0;
    this.undo_stack = [];
    this.executor_stack = [];
  },

  new_dom_id: function() {
    var dom_id = "vm-dom-id-" + this.current_dom_id_num;
    this.current_dom_id_num++;
    return dom_id; 
  },

  enable_step: function() {
    if (this.executor_stack.length > 0 && !this.executors_available()) 
      return false;

    return true;
  },

  resume: function() {
    // if resuming unfinished statement
    if (this.executor_stack.length > 0) {
      if (!this.executors_available())
        return false;
    }
    return true;
  },

  step: function() {
    if (this.current_statement_index == this.statements.length)
      return false;

    var current_statement = this.statements[this.current_statement_index];
    var operation = current_statement.generate_operations(this)

    operation.capture_current_state(this);
    var operation_executor = operation.do(this)
    this.undo_stack.push(operation);

    // order the executors from bottom to top
    this.create_executor_stack(operation_executor);

    return this.resume();
  },

  unstep: function() {
    if (this.undo_stack.length > 0)
      this.undo_stack.pop().undo(this);
  },

  create_executor_stack: function(operation_executor) {
    var input_executor_stack = [operation_executor];
    while (input_executor_stack.length != 0) {
      var executor = input_executor_stack.pop();
      this.executor_stack.push(executor);
      if (executor.dependencies.length > 0) {
        for (var i = 0; i < executor.dependencies.length; i++) {
          input_executor_stack.push(executor.dependencies[i]);
        }
      }
    }
  },

  executors_available: function() {
    // go through the executors in order and make sure all the
    // values are avaiable
    while (this.executor_stack.length > 0) {
      var executor = this.executor_stack.pop();

      if (!executor.available()) {
        this.executor_stack.push(executor);
        return false;
      }
    }

    return true;
  },

  set_current_statement_index: function(new_index) {
    old_index = this.current_statement_index;
    this.current_statement_index = new_index;
    this.program_ui.move_instruction_pointer(old_index, new_index);
  },

});

