'use strict';

include([], function() {
  var buttonTag = inheritFrom(HTMLElement, function() {
    this.attachedCallback = function() {
      var _this = this;
      var oldClass = _this.className;

      _this.onClick = () => {};

      _this.onmouseup = () => {
        if (_this.pressed) _this.onClick();
        _this.pressed = false;
        if (document.onmouseup == _this.onmouseup) document.onmouseup = null;
        _this.className = oldClass;
      };

      _this.onmousedown = function(e) {
        e.preventDefault();
        _this.pressed = true;
        document.onmouseup = _this.onmouseup;
        oldClass = _this.className;
        _this.className = oldClass + ' active';
      };
    };
  });

  var ButtonTag = document.registerElement('but-ton', buttonTag);
});
