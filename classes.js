
var SimpleClass = Class.extend({
  
});

var NumberClass = SimpleClass.extend({

});

var StringClass = SimpleClass.extend({

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

  satisfy: function() {
    this.is_satisfied = true;
  },

  set_value_function: function(value_function) {
    this.value_function = value_function;
  }
});
