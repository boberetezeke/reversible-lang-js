var OutputUI = Class.extend({
  init: function(programming_widget) {
    this.pw = programming_widget;
  },

  new_line: function(new_line_index, line) {
    $(this.pw.selector("output-table")).append("<tr><td id=\"" + this.pw.prefix + "-output-" + new_line_index + "\">" + line + "</td></tr>");
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
    return "<tr id=\"" + this.pw.prefix + "-memory-" + name + "\"><td>" + name + "</td><td>" + value + "</td><td>" + old_value + "</td></tr>"
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

  define_steps: function() {
    var self = this;
    $(self.selector("forward")).click(function() {
      self.virtual_machine.step();
      return false;
    });

    $(self.selector("backward")).click(function() {
      self.virtual_machine.unstep();
      return false;
    });
  },

  define_edit: function() {
    var self = this;
    $(self.selector("edit")).click(function() {
      $(self.selector("editor-section")).show();
      $(self.selector("program-section")).hide();
      return false;
    });
  },

  define_run: function() {
    var self = this;
    $(self.selector("run")).click(function() {
      var source = $(self.selector("editor-textarea")).val();
      self.parser = new Parser();
      self.virtual_machine = new VirtualMachine(new ProgramUI(self), new MemoryUI(self), new OutputUI(self));
      
      has_errored = false;
      try {
        self.parser.parse(source);
      }
      catch(e) {
        has_errored = true
        $(self.selector("error")).show();
        $(self.selector("error")).html("ERROR: " + e);
      }
      if (!has_errored) {
        $(self.selector("error")).hide();
        rows = "";
        program_lines = source.split("\n");
        for (i = 0; i < self.parser.statements.length; i++) {
          rows = rows + "<tr><td><span id=\"" + self.prefix + "-ip-" + i + "\">cur</span></td><td id=\"statement-" + i + "\">" + program_lines[i] + "</td></tr>";
        }
        console.log("rows = " + rows);

        $(self.selector("program-table")).html(rows);
        $(self.selector("memory-table")).html("<tr><td>Name</td><td>Value</td><td>Old Value</td></tr>");
        $(self.selector("output-table")).html("");

        $(self.selector("editor-section")).hide();
        $(self.selector("edit-button")).show();
        $(self.selector("program-section")).show();

        for (i = 1; i < self.parser.statements.length; i++) {
          $(self.selector("ip-") + i).hide();
        }

        self.virtual_machine.start(self.parser.statements);
      } 
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
      '<div id="prefix-program">' + 
        '<p>Program' + 
          '<div id="prefix-edit-button">&nbsp;(<a href="#" id="prefix-edit">edit</a>)</div>' +
        '</p>' + 
        '<div id="prefix-editor-section" class="editor-section">' + 
          '<textarea id="prefix-editor-textarea" class="editor"></textarea>' + 
          '<a href="#" id="prefix-run" class="button">run</a>' + 
          '<p id="error"></p>' + 
        '</div>' +
        '<div id="prefix-program-section">' + 
          '<table id="prefix-program-table"></table>' + 
          '<a href="#" id="prefix-backward" class="button">backward</a>' +
          '<a href="#" id="prefix-forward" class="button">forward</a>' +
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

$(function() {
  new ProgrammingWidget("#assignment", "assignment").activate();
});

