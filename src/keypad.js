function keypad(color) {
  var ret = µ('+div');
  ret.className = color + ' keypad';
  ret.input = '';
  ret.dotDone = false;

  ret.onChange = function() {
    console.log(ret.input);
  };

  ret.addChar = function(char) {
    if (ret.input.length < 10 && (char != '.' || !ret.dotDone))
      ret.input += char;
    if (char == '.') ret.dotDone = true;
    ret.onChange();
  };

  ret.popChar = function() {
    if (ret.input.length > 0) {
      if (ret.input.charAt(ret.input.length - 1) == '.')
        ret.dotDone = false;
      ret.input = ret.input.substring(0, ret.input.length - 1);
    }

    ret.onChange();
  };

  function stylize(el, text, f) {
    el.className = 'key block';
    el.textContent = text;
    el.onmousedown = function(e) {
      e.preventDefault();
      el.clicked = true;
      console.log(µ('con-fig')[color].hex);
      this.style.backgroundColor = µ('con-fig')[color].hex;
      this.style.color = '#000';
      if (typeof f != 'function') {
        ret.addChar(this.textContent);
      } else f();
    };

    el.onmouseout = el.onmouseup = function() {
      if (el.clicked) {
        el.clicked = false;
        this.style.color = µ('con-fig')[color].hex;
        this.style.backgroundColor = '#000';
      }
    };
  }

  for (var i = 1; i < 11; i++) {
    var next = µ('+div', ret);
    stylize(next, (i % 10).toString());
  }

  var back = ret.insertBefore(µ('+div'), ret.lastChild);
  stylize(back, 'DEL', ret.popChar);

  var dot = µ('+div', ret);
  stylize(dot, '.');

  return ret;
}
