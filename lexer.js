var Token = Class.extend({
  init: function(string, line_number, start_column, end_column) {
    this.string = string;
    this.line_number = line_number;
    this.start_column = start_column;
    this.end_column = end_column;
  },

  is_equal_to: function(compare_string) {
    return this.string == compare_string;
  },

  is_end_of_line: function() {
    return this.string == "\n";
  },

  is_one_of: function(array_of_strings) {
    var i;

    for (i = 0; i < array_of_strings.length; i++) {
      if (array_of_strings[i] == this.string)
        return true;
    }
    return false;
  }
});

var Lexer = Class.extend({
  init: function(source) {
    this.source = source;
    this.token_index = 0;
    this.tokens = [];
  },

  tokenize: function() {
    var lines = this.source.split(/\n/)
    var index = 0;
    
    for (index = 0; index < lines.length; index++) {
      line = lines[index];
      strings = [];
      var regex = /^(\s+)|((["'])(?:(?=(\\?))\4.)*?\3)|([A-Za-z_][\w_]*)|(\d+(\.\d+)?|\.\d+)|([/()+*/%!<>&|=-]+)|(\S+)/

      while (line.length > 0) {
        var match = regex.exec(line);
        if (!match[1]) {
          this.tokens.push(new Token(match[0], index, 0, 0));
        }
        line = line.slice(match[0].length)
      }
      this.tokens.push(new Token("\n", index, 0, 0));
    }
    return this.tokens.length;
  },

  next_token: function() {
    if (this.token_index >= this.tokens.length)
      return null;
    else
      return this.tokens[this.token_index++];
  },

  unnext_token: function() {
    if (this.token_index > 0) {
      this.token_index--;
    }
  },

  end_of_tokens: function() {
    return this.token_index == this.tokens.length;
  }

});
