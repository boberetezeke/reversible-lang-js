var MockUI = Class.extend({
  init: function() {
    this.method_calls = [];
  },

  save_event: function(method_name, args) {
    this.method_calls.push({method_name: method_name, args: args});
  }
});

var MockOutputUI = MockUI.extend({
  new_line: function(new_line_index, line) {
    this.save_event("new_line", {new_line_index: new_line_index, line: line});
  },
  
  remove_line: function(index) {
    this.save_event("remove_line", {index: index});
  }
});

var MockMemoryUI = MockUI.extend({
  remove: function(name) {
    this.save_event("remove", {name: name})
  },

  replace_value: function(name, value, old_value) {
    this.save_event("replace_value", {name: name, value: value, old_value: old_value})
  },

  new_value: function(name, value) {
    this.save_event("new_value", {name: name, value: value})
  },
});

var MockProgramUI = MockUI.extend({
  move_instruction_pointer: function(old_index, new_index) {
    this.save_event("move_instruction_pointer", {old_index: old_index, new_index: new_index})
  }
});

var MockWidgetUI = Class.extend({
  resume: function() {
    this.save_event("resume", {});
  }
});

describe("VirtualMachine", function() {
  var parser;
  var vm;

  beforeEach(function() {
    parser = new Parser();
    mock_widget_ui = new MockWidgetUI;
    mock_program_ui = new MockProgramUI;
    mock_memory_ui = new MockMemoryUI;
    mock_output_ui = new MockOutputUI;
    vm = new VirtualMachine(mock_widget_ui, mock_program_ui, mock_memory_ui, mock_output_ui);
  });

  /*
  it("should be able to execute a simple assignment without a trailing newline", function() {
    vm.start(parser.parse("a = 1"));
    vm.step();
    expect(mock_program_ui.method_calls).toEqual([{method_name: "move_instruction_pointer", args: {old_index: 0, new_index: 1}}]);
    expect(mock_memory_ui.method_calls).toEqual([{method_name: "new_value", args: {name: "a", value: new NumberClass("1")}}]);
  });
  */

  it("should be able to execute a simple assignment", function() {
    vm.start(parser.parse("a = 1\n"));
    vm.step();
    expect(mock_program_ui.method_calls).toEqual([{method_name: "move_instruction_pointer", args: {old_index: 0, new_index: 1}}]);
    expect(mock_memory_ui.method_calls).toEqual([{method_name: "new_value", args: {name: "a", value: new NumberClass("1")}}]);
  });
  
  it("should be able to execute a simple output", function() {
    vm.start(parser.parse("output ( 1 )\n"));
    vm.step();
    expect(mock_program_ui.method_calls).toEqual([{method_name: "move_instruction_pointer", args: {old_index: 0, new_index: 1}}]);
    expect(mock_output_ui.method_calls).toEqual([{method_name: "new_line", args: {new_line_index: 0, line: "1"}}]);
  });

  it("should be able to execute a simple assignment and then an output", function() {
    vm.start(parser.parse("a = 1\noutput ( a )\n"));

    vm.step();
    expect(mock_program_ui.method_calls.pop()).toEqual({method_name: "move_instruction_pointer", args: {old_index: 0, new_index: 1}});
    expect(mock_memory_ui.method_calls.pop()).toEqual({method_name: "new_value", args: {name: "a", value: new NumberClass("1")}});

    vm.step();
    expect(mock_program_ui.method_calls).toEqual([{method_name: "move_instruction_pointer", args: {old_index: 1, new_index: 2}}]);
    expect(mock_output_ui.method_calls).toEqual([{method_name: "new_line", args: {new_line_index: 0, line: "1"}}]);
  });
});
