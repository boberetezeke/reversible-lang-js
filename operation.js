var Operation = Class.extend({
  init: function(capture_function, do_statement, undo_statement) {
    this.capture_function = capture_function;
    this.do_statement = do_statement;
    this.undo_statement = undo_statement;
  },

  class_name: "Operation",

  capture_current_state: function(vm) {
    this.saved_current_statement = vm.current_statement;
    this.capture_function(vm);
  },

  do: function(vm) {
    return this.do_statement(vm);
  },

  undo: function(vm) {
    this.undo_statement(vm);
    vm.set_current_statement(this.saved_current_statement);
  }
});

