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
      words = line.split(/\s+/)
      var word_index;
      for (word_index = 0; word_index < words.length; word_index++) {
        var word = words[word_index];
        if (word != "")
          this.tokens.push(word);
      }
      this.tokens.push("\n");
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
