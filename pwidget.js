var OutputUI = Class.extend({
  init: function(programming_widget) {
    this.pw = programming_widget;
  },

  new_line: function(new_line_index, line) {
    $(this.pw.selector("output-table")).append("<tr><td id=\"" + this.pw.prefix + "-output-" + new_line_index + "\" class=\"output-cell\">" + line + "</td></tr>");
  },
  
  remove_line: function(index) {
    $(this.pw.selector("output-" + index)).remove();
  }
});

var MemoryUI = Class.extend({
  init: function(programming_widget) {
    this.pw = programming_widget;
  },

  remove: function(name) {
    $(this.pw.selector("memory-" + name)).remove();
  },

  replace_value: function(name, value, old_value) {
      $(this.pw.selector("memory-" + name)).replaceWith(this.dom_row(name, value, old_value));
  },

  new_value: function(name, value) {
      $(this.pw.selector("memory-table")).append(this.dom_row(name, value, ""));
  },

  dom_row: function(name, value, old_value) {
    return "<tr id=\"" + this.pw.prefix + "-memory-" + name + "\"><td class=\"memory-cell\">" + name + "</td><td class=\"memory-cell\">" + value + "</td><td class=\"memory-cell\">" + old_value + "</td></tr>"
  }
});


var ProgramUI = Class.extend({
  init: function(programming_widget) {
    this.pw = programming_widget;
  },

  move_instruction_pointer: function(old_index, new_index) {
    $(this.pw.selector("ip-" + old_index)).hide();
    $(this.pw.selector("ip-" + new_index)).show();
  }
});
  

var ProgrammingWidget = Class.extend({
  init: function(selector, prefix) {
      this.prefix = prefix;
      this.insert_html(selector, prefix);
      this.define_run();
      this.define_steps();
      this.define_edit();
    }, 

  parse: function() {
    var source = $(this.selector("editor-textarea")).val();
    this.parser = new Parser();
    this.virtual_machine = new VirtualMachine(this, new ProgramUI(this), new MemoryUI(this), new OutputUI(this));
    
    has_errored = false;
    try {
      this.parser.parse(source);
    }
    catch(e) {
      has_errored = true
      $(this.selector("error")).show();
      $(this.selector("error")).html("ERROR: " + e);
    }
    if (!has_errored) {
      $(this.selector("error")).hide();
      rows = "";
      program_lines = source.split("\n");
      for (i = 0; i < this.parser.statements.length; i++) {
        rows = rows + "<tr><td><span id=\"" + this.prefix + "-ip-" + i + "\">--&gt;</span></td><td id=\"statement-" + i + "\">" + program_lines[i] + "</td></tr>";
      }
      console.log("rows = " + rows);

      $(this.selector("program-table")).html(rows);
      $(this.selector("memory-table")).html("<tr><td class=\"memory-header-cell\">Name</td><td class=\"memory-header-cell\">Value</td><td class=\"memory-header-cell\">Old Value</td></tr>");
      $(this.selector("output-table")).html("");

      $(this.selector("editor-section")).hide();
      $(this.selector("edit-button")).show();
      $(this.selector("program-section")).show();
      $(this.selector("backward-disabled")).hide();
      $(this.selector("forward-disabled")).hide();

      for (i = 1; i < this.parser.statements.length; i++) {
        $(this.selector("ip-") + i).hide();
      }

      this.virtual_machine.start(this.parser.statements);
    } 
  },

  step: function() {
    if (!this.virtual_machine.step()) {
      $(this.selector("forward")).hide();
      $(this.selector("forward-disabled")).show();
    }
    else {
      $(this.selector("forward")).show();
      $(this.selector("forward-disabled")).hide();
    }
  },

  resume: function() {
    if (!this.virtual_machine.resume()) {
      $(this.selector("forward")).hide();
      $(this.selector("forward-disabled")).show();
    }
    else {
      $(this.selector("forward")).show();
      $(this.selector("forward-disabled")).hide();
    }
  },

  unstep: function() {
    this.virtual_machine.unstep();
  },

  edit: function() {
    $(this.selector("editor-section")).show();
    $(this.selector("program-section")).hide();
    $(this.selector("edit-button")).hide();
  },

  
  define_steps: function() {
    var self = this;
    $(self.selector("forward")).click(function() {
      self.step();
      return false;
    });

    $(self.selector("backward")).click(function() {
      self.unstep();
      return false;
    });
  },

  define_edit: function() {
    var self = this;
    $(self.selector("edit")).click(function() {
      self.edit();
      return false;
    });
  },

  define_run: function() {
    var self = this;
    $(self.selector("parse")).click(function() {
      self.parse();
      return false;
    });
  },


  selector: function(selector_suffix) {
    return "#" + this.prefix + "-" + selector_suffix;
  },

  activate: function() {
    var self = this;

    $(self.selector("edit-button")).hide();
    $(self.selector("program-section")).hide();
    $(self.selector("error")).show();
  },
  
  insert_html: function(selector, prefix) {
    var html = 
    '<div class="programming-widget">' + 
      '<div id="prefix-program" class="program">' + 
        '<p>Program' + 
          '<span id="prefix-edit-button">&nbsp;<a href="#" id="prefix-edit" class="button">edit</a></span>' +
        '</p>' + 
        '<div id="prefix-editor-section" class="editor-section">' + 
          '<textarea id="prefix-editor-textarea" class="editor"></textarea>' + 
          '<div class="actions">' + 
            '<a href="#" id="prefix-parse" class="button">start</a>' + 
          '</div>' + 
          '<p id="error"></p>' + 
        '</div>' +
        '<div id="prefix-program-section">' + 
          '<table id="prefix-program-table" class="program-table"></table>' + 
          '<div class="actions">' + 
            '<a href="#" id="prefix-backward" class="button">backward</a>' +
            '<span id="prefix-backward-disabled" class="button">backward</span>' +
            '<a href="#" id="prefix-forward" class="button">forward</a>' +
            '<span id="prefix-forward-disabled" class="button">forward</span>' +
          '</div>' + 
        '</div>' +
      '</div>' + 
      '<div class="memory">' +
        '<p>Memory</p>' +
        '<table id="prefix-memory-table" class="memory-table">' +
        '</table>' +
      '</div>' +
      '<div class="output">' +
        '<p>Output</p>' +
        '<table id="prefix-output-table" class="output-table"></table>' + 
      '</div>' +
      '<div style="clear: both;"></div>' + 
    '</div>';
    $(selector).html(html.replace(/prefix-/g, prefix + "-"));
    }
});
