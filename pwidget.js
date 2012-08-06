var OutputUI = Class.extend({
  init: function(programming_widget) {
    this.pw = programming_widget;
  },

  new_line: function(new_line_index, line) {
    $(this.pw.selector("output-table")).append("<tr><td id=\"" + this.pw.prefix + "-output-" + new_line_index + "\" class=\"output-table-cell\">" + line + "</td></tr>");
  },
  
  remove_line: function(index) {
    $(this.pw.selector("output-" + index)).remove();
  }
});

var MemoryUI = Class.extend({
  init: function(programming_widget) {
    this.pw = programming_widget;
    this.last_name = null
  },

  remove: function(name) {
    $(this.pw.selector("memory-" + name)).remove();
  },

  replace_value: function(name, value, old_value) {
    this.clear_last_change();
    $(this.pw.selector("memory-" + name)).replaceWith(this.dom_row(name, value.type_string, value.value(), old_value.type_string + ": " + old_value.value()));
    this.last_name = name;
  },

  new_value: function(name, value) {
    this.clear_last_change();
    $(this.pw.selector("memory-table")).append(this.dom_row(name, value.type_string, value.value(), "new"));
    this.last_name = name;
  },

  clear_last_change: function() {
    if (this.last_name) {
      $(this.pw.selector("memory-" + this.last_name + "-old-value")).replaceWith(this.old_value_cell(this.last_name, ""));
    }
  },
  
  old_value_cell: function(name, old_value) {
    return "<td class=\"memory-cell\" id=\"" + this.pw.prefix + "-memory-" + name + "-old-value\">" + old_value + "</td>";
  },

  dom_row: function(name, type_string, value, old_value) {
    return "<tr id=\"" + this.pw.prefix + "-memory-" + name + "\"><td class=\"memory-cell\">" + name + "</td><td class=\"memory-cell\">" + type_string + "<td class=\"memory-cell\">" + value + "</td>" + this.old_value_cell(name, old_value) + "</tr>"
  }
});


var ProgramUI = Class.extend({
  init: function(programming_widget) {
    this.pw = programming_widget;
  },

  move_instruction_pointer: function(old_index, new_index) {
    if (old_index != -1)
      $(this.pw.selector("ip-" + old_index)).hide();
    else
      $(this.pw.selector("ip-last")).hide();

    if (new_index != -1)
      $(this.pw.selector("ip-" + new_index)).show();
    else
      $(this.pw.selector("ip-last")).show();
  }
});
  

var ProgrammingWidget = Class.extend({
  init: function(selector, prefix, program, runatstart) {
      this.prefix = prefix;
      this.insert_html(selector, prefix);
      this.define_run();
      this.define_steps();
      this.define_edit();

      if (program) {
        $(this.selector("editor-textarea")).val(program);
      }

      var programming_widget = this;
      $(this.selector("editor-textarea")).change(function() {
        var textarea = $(programming_widget.selector("editor-textarea"));
        console.log(textarea.val());

        var encoded_program = encodeURI(textarea.val()).replace(/\&/, "%26").replace(/\?/, "%3F");
        var url = window.location.protocol + 
                  "//" + 
                  window.location.host + 
                  window.location.pathname + 
                  "?program=" + encoded_program;
                  
        console.log("url = " + url);
        $(programming_widget.selector("permalink")).attr("href", url);
      });
    }, 

  program_line: function(index, line, errored) {
    if (errored)
      td_style = "class=\"program-errored-cell\"";
    else
      td_style = ""
    return "<tr><td><span id=\"" + this.prefix + "-ip-" + index + "\"><img src=\"images/green-arrow.jpg\"></span></td><td id=\"statement-" + index + "\"" + td_style + ">" + line + "</td></tr>"
  },

  insert_program_lines: function(source, error_line) {
    rows = "";
    program_lines = source.split("\n");
    for (var i = 0; i < program_lines.length; i++) {
      rows = rows + this.program_line(i, program_lines[i], (error_line == i));
    }
    rows = rows + this.program_line("last", "&nbsp;", false);
    console.log("rows = " + rows);
    $(this.selector("program-table")).html(rows);

    var start_line = 1;
    if (error_line)
      start_line = 0;
    for (var i = start_line; i < program_lines.length; i++) {
      $(this.selector("ip-") + i).hide();
    }
    $(this.selector("ip-last")).hide();
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
      match = /^(\d+): (.*)$/.exec(e);
      $(this.selector("error")).show();
      $(this.selector("error")).html("ERROR: " + match[2]);
      this.insert_program_lines(source, Number(match[1]));
      $(this.selector("editor-section")).hide();
      $(this.selector("program-section")).show();
      $(this.selector("edit-button")).show();
      $(this.selector("backward")).hide();
      $(this.selector("forward")).hide();
      $(this.selector("backward-disabled")).hide();
      $(this.selector("forward-disabled")).hide();
    }
    if (!has_errored) {
      $(this.selector("error")).hide();
      this.insert_program_lines(source);

      $(this.selector("memory-table")).html("<tr><td class=\"memory-header-cell\">Name</td><td class=\"memory-header-cell\">Type</td><td class=\"memory-header-cell\">Value</td><td class=\"memory-header-cell\">Old Value</td></tr>");
      $(this.selector("output-table")).html("");

      $(this.selector("editor-section")).hide();
      $(this.selector("edit-button")).show();
      $(this.selector("program-section")).show();
      $(this.selector("forward")).show();
      $(this.selector("forward-disabled")).hide();
      $(this.selector("backward")).hide();
      $(this.selector("backward-disabled")).show();


      this.virtual_machine.start(this.parser.code_block.statements);
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
    $(this.selector("backward")).show();
    $(this.selector("backward-disabled")).hide();
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
    if (!this.virtual_machine.unstep()) {
      $(this.selector("backward")).hide();
      $(this.selector("backward-disabled")).show();
    }
    else {
      $(this.selector("backward")).show();
      $(this.selector("backward-disabled")).hide();
    }

    $(this.selector("forward")).show();
    $(this.selector("forward-disabled")).hide();
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
        '</div>' +
        '<div id="prefix-program-section">' + 
          '<table id="prefix-program-table" class="program-table"></table>' + 
          '<div class="actions">' + 
            '<a href="#" id="prefix-backward" class="button">backward</a>' +
            '<span id="prefix-backward-disabled" class="button">backward</span>' +
            '<a href="#" id="prefix-forward" class="button">forward</a>' +
            '<span id="prefix-forward-disabled" class="button">forward</span>' +
          '</div>' + 
          '<p id="prefix-error"></p>' + 
        '</div>' +
        '<a href="#" id="prefix-permalink">Permalink</a>' +
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
