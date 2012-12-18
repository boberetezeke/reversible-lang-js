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
      this.define_max();
      this.define_min();
      this.define_run();
      this.define_steps();
      this.define_edit();
      this.define_continue();
      this.define_stop();
      this.capture_editor_changes();

      if (program) {
        $(this.selector("editor-textarea")).val(program);
      }

      if (runatstart) {
        if (this.parse()) {
          this.run(); 
        }
      }
    }, 

  program_line: function(index, line, errored) {
    if (errored)
      td_style = "class=\"program-errored-cell\"";
    else
      td_style = ""
    return "<tr><td><span id=\"" + this.prefix + "-ip-" + index + "\"><img src=\"images/green-arrow.jpg\"></span></td><td id=\"" + this.prefix + "-statement-" + index + "\"" + td_style + ">" + line + "</td></tr>"
  },

  insert_program_lines: function(source, error_line) {
    rows = "";
    program_lines = source.split("\n");
    for (var i = 0; i < program_lines.length; i++) {
      rows = rows + this.program_line(i, program_lines[i], (error_line == i));
    }
    rows = rows + this.program_line("last", "&nbsp;", false);
    //console.log("rows = " + rows);
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
      $(this.selector("continue")).hide();
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
      $(this.selector("continue")).show();
      $(this.selector("backward")).hide();
      $(this.selector("backward-disabled")).show();


      this.virtual_machine.start(this.parser.code_block.statements);
    } 

    return !has_errored;
  },

  run: function() {
    var self = this;
    $(".program").hide();
    $(".memory").hide();
    $(self.selector("output")).addClass("max-width");
    $(".output .actions").show();
    setTimeout(function(){self.run_step(self)}, 1000);
  },

  run_step: function(self) {
    if (self.virtual_machine.is_done()) {
      $(this.selector("program-done")).show();
      return;
    }
    else if (self.virtual_machine.can_step()) {
      self.virtual_machine.step();
      var error_info = self.virtual_machine.runtime_error();
      if (error_info) {
        self.display_error(error_info);
        return;
      }
    }
    setTimeout(function(){self.run_step(self)}, 10);
  },

  display_error: function(error_info) {
      $(".program").show();
      $(".memory").show();
      $(this.selector("statement-" + error_info.line_number)).addClass("program-errored-cell");
      $(this.selector("error")).show();
      $(this.selector("error")).html("ERROR: " + error_info.message);

      this.update_steppers();
      $(this.selector("backward")).show();
      $(this.selector("backward-disabled")).hide();
  },

  update_steppers: function() {
    this.update_backward();
    this.update_forward();
  },

  update_backward: function() {
      if (vm.can_unstep()) {
        $(this.selector("backward")).show();
        $(this.selector("backward-disabled")).hide();
      }
      else {
        $(this.selector("backward")).hide();
        $(this.selector("backward-disabled")).show();
      }
  },

  update_forward: function() {
      if (vm.can_step()) {
        $(this.selector("forward")).show();
        $(this.selector("forward-disabled")).hide();
      }
      else {
        $(this.selector("forward")).hide();
        $(this.selector("forward-disabled")).show();
      }
  },

  step: function() {
    vm = this.virtual_machine;
    vm.step();
    var error_info = vm.runtime_error();
    if (error_info) {
      this.display_error(error_info);
    }
    else {
      this.update_steppers();
    }
  },

  resume: function() {
    this.virtual_machine.resume();
    this.update_steppers();
  },

  unstep: function() {
    this.virtual_machine.unstep();
    this.update_steppers();
  },

  edit: function() {
    $(this.selector("editor-section")).show();
    $(this.selector("program-section")).hide();
    $(this.selector("edit-button")).hide();
    $(".program").show();
    $(".memory").show();
    $(".output .actions").hide();
    $(this.selector("output")).removeClass("max-width");
    $(this.selector("program-done")).hide();
  },

  stop: function() {
    $(".program").show();
    $(".memory").show();
    $(".output .actions").hide();
    $(this.selector("output")).removeClass("max-width");
    this.update_steppers();
  },
  
  continue: function() {
    $(".program").hide();
    $(".memory").hide();
    $(".output .actions").show();
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
    $(self.selector("edit-from-output")).click(function() {
      self.edit();
      return false;
    });
  },

  define_continue: function() {
    var self = this;
    $(self.selector("continue")).click(function() {
      self.continue();
      return false;
    });
  },

  define_stop: function() {
    var self = this;
    $(self.selector("stop")).click(function() {
      self.stop();
      return false;
    });
  },

  define_min: function() {
    var self = this;
    $(self.selector("minimize")).hide();
    $(self.selector("minimize")).click(function() {
      $(self.selector("program")).removeClass("max-width");
      $(self.selector("minimize")).hide();
      $(self.selector("maximize")).show();
    });
  },

  define_max: function() {
    var self = this;
    $(self.selector("maximize")).show();
    $(self.selector("maximize")).click(function() {
      $(self.selector("program")).addClass("max-width");
      $(self.selector("maximize")).hide();
      $(self.selector("minimize")).show();
      $(self.selector("editor-textarea")).addClass("max-width");
    });
  },

  define_run: function() {
    var self = this;
    $(self.selector("parse")).click(function() {
      self.parse();
      return false;
    });

    $(self.selector("run")).click(function() {
      if (self.parse()) {
        self.run();
      }
      return false;
    });
  },

  capture_editor_changes: function() {
      var programming_widget = this;
      $(this.selector("editor-textarea")).change(function() {
        var textarea = $(programming_widget.selector("editor-textarea"));
        console.log(textarea.val());

        var encoded_program = encodeURI(textarea.val()).replace(/\&/g, "%26").replace(/\?/g, "%3F");
        var url = window.location.protocol + 
                  "//" + 
                  window.location.host + 
                  window.location.pathname + 
                  "?runonstart=true&program=" + encoded_program;
                  
        console.log("url = " + url);
        $(programming_widget.selector("permalink")).attr("href", url);
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
            '<span id="prefix-maximize-button">&nbsp;<a href="#" id="prefix-maximize" class="button">max</a></span>' + 
            '<span id="prefix-minimize-button">&nbsp;<a href="#" id="prefix-minimize" class="button">min</a></span>' + 
        '</p>' + 
        '<div id="prefix-editor-section" class="editor-section">' + 
          '<textarea id="prefix-editor-textarea" class="editor"></textarea>' + 
          '<div class="actions">' + 
            '<a href="#" id="prefix-parse" class="button">step</a>' + 
            '<a href="#" id="prefix-run" class="button">run</a>' + 
          '</div>' + 
        '</div>' +
        '<div id="prefix-program-section">' + 
          '<table id="prefix-program-table" class="program-table"></table>' + 
          '<div class="actions">' + 
            '<a href="#" id="prefix-backward" class="button">backward</a>' +
            '<span id="prefix-backward-disabled" class="button">backward</span>' +
            '<a href="#" id="prefix-forward" class="button">forward</a>' +
            '<span id="prefix-forward-disabled" class="button">forward</span>' +
            '<a href="#" id="prefix-continue" class="button">run</a>' +
          '</div>' + 
          '<p id="prefix-error"></p>' + 
        '</div>' +
        '<a href="#" id="prefix-permalink">Permalink</a>' +
      '</div>' + 
      '<div id="prefix-memory" class="memory">' +
        '<p>Memory</p>' +
        '<table id="prefix-memory-table" class="memory-table">' +
        '</table>' +
      '</div>' +
      '<div id="prefix-output" class="output">' +
        '<p>Output' +
          '<div class="actions" style="display:none;">' + 
            '<a href="#" id="prefix-stop" class="button">stop</a>' + 
            '<a href="#" id="prefix-edit-from-output" class="button">edit</a>' + 
          '</div>' + 
        '</p>' + 
        '<table id="prefix-output-table" class="output-table"></table>' + 
        '<p id="prefix-program-done" style="display:none;">The program is done</p>' + 
      '</div>' +
      '<div style="clear: both;"></div>' + 
    '</div>';
    $(selector).html(html.replace(/prefix-/g, prefix + "-"));
    }
});
