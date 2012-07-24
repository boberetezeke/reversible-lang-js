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
      
      // replace single spaces with _'s
      line = line.replace(/"[^"]*"/g, function(match) { return match.replace(/ /g, "_") });

      words = line.split(/\s+/)
      var word_index;
      for (word_index = 0; word_index < words.length; word_index++) {
        var word = words[word_index];
        if (word != "") {
          if (/^"/.exec(word))
            // if it is a string token, put the underscores back to spaces
            word = word.replace(/_/g, " ");
          this.tokens.push(new Token(word, index, 0, 0));
        }
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
