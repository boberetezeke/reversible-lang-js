
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

