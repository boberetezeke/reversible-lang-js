
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
    virtual_machine = this;
    this.primitives = {
      input_string: function() { return new InputStringPrimitiveNode(virtual_machine) },
      input_number: function() { return new InputNumberPrimitiveNode(virtual_machine) },
      output:       function() { return new OutputPrimitiveNode(virtual_machine) }
    };
    this.statements = statements;
    this.current_statement = this.statements[0];
    this.undo_stack = [];
    this.executor_stack = [];
  },

  new_dom_id: function() {
    var dom_id = "vm-dom-id-" + this.current_dom_id_num;
    this.current_dom_id_num++;
    return dom_id; 
  },

  can_step: function() {
    if (this.executor_stack.length > 0 && !this.executors_available()) 
      return false;

    return true;
  },

  is_done: function() {
    return (this.current_statement == null)
  },

  runtime_error: function() {
    return this.error_info ? this.error_info : null;
  },

  resume: function() {
    // if resuming unfinished statement
    if (this.executor_stack.length > 0) {
      if (!this.executors_available())
        return false;
    }

    return (this.current_statement != null)
  },

  step: function() {
    if (this.current_statement == null)
      return false;

    var operation = this.current_statement.generate_operations(this)
    var operation_executor;

    
    operation.capture_current_state(this);
    try {
      operation_executor = operation.do(this)
    }
    catch (e) {
      this.error_info = e;
      console.log("got error: " + e.message + " on line: " + e.line_number);
      return false;
    }
    this.undo_stack.push(operation);

    // order the executors from bottom to top
    this.create_executor_stack(operation_executor);

    return this.resume();
  },

  unstep: function() {
    if (this.undo_stack.length > 0)
      this.undo_stack.pop().undo(this);
    return (this.undo_stack.length != 0);
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
      var executor_available;

      try {
        executor_available = executor.available();
      }
      catch (e) {
        this.error_info = e;
        console.log("got error: " + e.message + " on line: " + e.line_number);
        return false;
      }
      
      if (!executor_available) {
        this.executor_stack.push(executor);
        return false;
      }
    }

    return true;
  },

  set_current_statement: function(next_statement) {
    old_statement = this.current_statement;
    this.current_statement = next_statement;
    this.program_ui.move_instruction_pointer(old_statement ? old_statement.line_number : -1, next_statement ? next_statement.line_number : -1);
  },
});

