
var SimpleClass = Class.extend({
  value: function() {
    return this.instance_value;
  }
});

var BooleanClass = SimpleClass.extend({
  init: function(value) {
    this.instance_value = Boolean(value);
  },

  type_string: "Boolean"
});

var NumberClass = SimpleClass.extend({
  init: function(value) {
    this.instance_value = Number(value);
  },

  type_string: "Number"
});

var StringClass = SimpleClass.extend({
  init: function(value) {
    this.instance_value = String(value);
  },

  type_string: "String"
});

var PromiseClass = SimpleClass.extend({
  init: function() {
    this.is_satisfied = false;
    this.value_function = function() {};
  },

  satisfied: function() {
     return this.is_satisfied;
  },

  value: function() {
    return this.value_function();
  },

  type_string: "Promise",

  satisfy: function() {
    this.is_satisfied = true;
  },

  set_value_function: function(value_function) {
    this.value_function = value_function;
  }
});
