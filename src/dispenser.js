include(['src/keypad.js'], function() {

  var localStore = null;
  var hardwareJS = '';
  if (window.isApp === true) localStore = chrome.storage.local, console.log('app');
  else localStore  = localStorage;

  var dispenser = inheritFrom(HTMLElement, function() {
    this.createdCallback = function() {
      var _this = this;

      this.programMode = false;

      this.color = µ('|>color', this);

      //this.stroke = µ('|>stroke', this);
      this.fill = µ('|>fill', this);
      this.num = µ('|>output', this);
      this.output = µ('#tube' + this.num);
      this.resetPin = µ('#reset' + this.num);
      this.time = µ('|>time', this);
      this.attempts = 10;
      this.done = false;
      this.dispensing = false;

      this.failTime = 30;
      this.fail = false;

      var codeKey = 'dispenseCode' + _this.num;
      localStore.get(codeKey, function(resp) {
        console.log(resp[codeKey] + ' is the code');
        if (resp[codeKey] != null) {
          _this.code = resp[codeKey];
        } else {
          //grab attributes from the tag.
          _this.code = µ('|>code', _this);
        }
      });

      /*var svgs = null;

      ajax('data/svg.xml', function(xml) {
        _this.appendChild(µ('#beaker', xml).cloneNode(true));
      });*/

      //////////////////////////////
      // Create each of the sub divs

      //make it be the button itself.
      this.button = µ('+div', this);
      this.button.className = 'select block ' + this.color;

      var ctx = new window.AudioContext();

      function playSound(arrBuff) { // Obtain arrBuffer from XHR
        var src = ctx.createBufferSource();
        src.buffer = ctx.createBuffer(arrBuff, false /*mix2Mono*/);
        src.looping = true;

        src.connect(ctx.destination);
        src.noteOn(0); // Play immediately.
      }

      this.audSteady = µ('#pumpSteady');
      this.audSteady.load();

      this.audStart = µ('#pumpStart');
      this.audStart.load();
      this.audStart.onplay = function() {
        setTimeout(function() {
          _this.audSteady.currentTime = 0;
          _this.audSteady.play();
        }, _this.audStart.duration - 0.5);
      };

      this.audEnd = µ('#pumpEnd');
      this.audEnd.load();

      this.mixAudio = µ('#mixAudio');
      this.mixAudio.load();

      //this.appendChild(this.audSteady);

      var beaker = µ('#beaker', µ('#svgTemp').content).cloneNode(true);
      µ('con-fig').whenLoaded(function() {
        console.log('beaker');
        beaker.setAttribute('fill', µ('con-fig')[_this.color].fill);
        beaker.setAttribute('stroke', µ('con-fig')[_this.color].hex);
      });

      this.button.appendChild(beaker);

      var dim = µ('+div', this.button);
      dim.className = 'over';

      this.name = µ('+div', dim);
      for (var i = 0; i < this.id.length; i++) {
        if (this.id.charCodeAt(i) >= 48 && this.id.charCodeAt(i) <= 57)
          this.name.innerHTML += '<sub>' + this.id.charAt(i) + '</sub>';
        else this.name.innerHTML += this.id.charAt(i);
      }

      this.name.className = 'formula';
      this.tries = µ('+div', dim);
      this.tries.className = 'attempts';

      //make the interface div
      this.face = µ('+div', this);
      this.face.className = 'interface block ' + this.color;

      //make the keypad and push into interface
      this.keypad = new keypad(this.color);
      this.face.appendChild(this.keypad);

      //text box to hold keypresses
      this.text = µ('+div', this.face);
      this.text.className = 'textBox block ' + this.color;

      //Make the submit button
      this.submit = µ('+div', this.face);
      this.submit.className = 'submit block ' + this.color;
      this.submit.textContent = 'ENTER';

      //create the instruction div
      this.instruct = µ('+div', this.face);
      this.instruct.className = 'instruct ' + this.color;
      this.instruct.textContent = 'Enter amount on keypad';

      //create the return button
      this.ret = µ('+div', this.face);
      this.ret.className = 'retBut block ' + this.color;
      this.ret.textContent = '<- RETURN';

      //create the dialog box
      var fade = µ('+div', this);
      fade.className = 'overlay';
      this.dialog = µ('+div', fade);
      this.dialog.className = 'dialog block ' + this.color;
      this.dialog.spin = µ('#wait', µ('#svgTemp').content).cloneNode(true);
      this.dialog.appendChild(this.dialog.spin);
      µ('con-fig').whenLoaded(function() {
        _this.dialog.spin.setAttribute('fill', µ('con-fig')[_this.color].fill);
        _this.dialog.spin.setAttribute('stroke', µ('con-fig')[_this.color].hex);
      });

      this.dialog.text = µ('+p', this.dialog);
      this.dialog.text.textContent = 'Dispensing, please wait...';

      this.button.onmousedown = function(e) {
        e.preventDefault();
        _this.open();
        return false;
      };

      //this.face.ontouchstart = function (e) {
      //e.preventDefault();
      //return false;
      //}

      this.open = function() {
        if (!_this.done)
          this.face.style.display = 'block';
      };

      this.close = function() {
        this.face.style.display = 'none';
      };

      var failTimer = null;

      this.failCount = function(time) {
        if (time > 0) {
          var sec = (time == 1) ? ' second' : ' seconds';
          _this.instruct.textContent = 'Verification failed; retry in ' + time + sec;
          _this.tries.textContent = 'Wait ' + time + sec;
          if (failTimer) clearTimeout(failTimer);
          failTimer = setTimeout(function() {_this.failCount(time - 1);}, 1000);
        } else {
          _this.fail = false;
          _this.instruct.textContent = 'System Ready; Enter Passcode';
          _this.tries.textContent = 'Ready';
          _this.attempts = 2;
        }
      };

      this.check = function() {
        if (_this.programMode) {
          _this.programMode = false;
          _this.code = _this.keypad.input;
          var codeKey = 'dispenseCode' + _this.num;
          console.log(codeKey + ' is the storage key');
          var store = {};
          store[codeKey] = '';
          store[codeKey] += _this.code;
          console.log(store[codeKey] + ' is the new code');
          localStore.set(store);
          _this.instruct.textContent = 'Code changed successfully.';
          setTimeout(function() {
            _this.text.textContent = _this.keypad.input = '';
            _this.instruct.textContent = 'Enter amount on keypad';
          }, 3000);
        } else if (this.keypad.input == this.code) {
          this.instruct.textContent = 'Dispensing...';
          _this.dispense();
        } else if (this.keypad.input == '4243845') {
          _this.text.textContent = _this.keypad.input = '';
          this.programMode = true;
          this.instruct.textContent = 'Enter new code.';
        } else if (this.keypad.input == '31415') {
          //_this.text.textContent = _this.keypad.input = '';
          //this.programMode = true;
          //this.instruct.textContent = 'Enter new code.';
          µ('#settings').style.display = 'block';
        } else {
          _this.text.textContent = this.keypad.input = '';
          if (--this.attempts >= 1) {
            var atmp = (this.attempts == 1) ? ' attempt remains' : ' attempts remain';
            this.instruct.textContent = 'Invalid amount; ' + this.attempts + atmp;
            this.tries.textContent = this.attempts + atmp;
          } else {
            _this.fail = true;
            this.failCount(30);
          }
        }
      };

      this.reset = function(fxn) {
        var key = 'dispense' + _this.num;
        localStore.get(key, function(resp) {
          if (resp[key] == 'true' && µ('hard-ware').ready) {
            console.log('resetting ' + _this.num);
            _this.output.write(0);
            _this.resetPin.write(1);
            setTimeout(function() {
              _this.output.write(0);
              _this.resetPin.write(0);
              var store = {};
              store[key] = '';
              store[key] += false;
              localStore.set(store);
              console.log('done resetting ' + _this.num);
              fxn();
            }, _this.time);
          } else {
            console.log('tube ' + _this.num + ' does not need resetting');
            fxn();
          }
        });
      };

      this.dispense = function() {
        fade.style.display = 'block';
        _this.dispensing = true;

        if (µ('hard-ware').ready) {
          _this.resetPin.write(0);
          _this.output.write(1);
        }

        _this.audStart.play();
        setTimeout(function() {
          _this.audSteady.pause();
          _this.audEnd.play();
          _this.dispensing = false;
          _this.done = true;
          fade.style.display = 'none';
          _this.instruct.textContent = 'Finished dispensing.';

          //_this.name.textContent =  'COMPLETE';
          //_this.name.className = 'done';

          var t = µ('+div', _this.button);
          t.className = 'over';
          var chck = µ('#check', µ('#svgTemp').content).cloneNode(true);
          chck.style.width = 'auto';
          chck.style.height = '90%';
          µ('con-fig').whenLoaded(function() {
            chck.setAttribute('fill', µ('con-fig')[_this.color].fill);
            chck.setAttribute('stroke', µ('con-fig')[_this.color].hex);
          });

          t.appendChild(chck);

          _this.submit.style.opacity = '.25';
          _this.tries.textContent = '';

          var disps = document.querySelectorAll('disp-enser');
          var done = true;
          for (var i = 0; i < disps.length; i++) {
            done = disps[i].done && done;
          }

          if (done) {
            _this.close();
            µ('#complete').style.display = 'block';
            _this.mixAudio.play();
            setTimeout(function() {
              µ('#cylinder').write(0);
              console.log('released cylinder');
              µ('div', µ('#complete')).innerHTML = '';
              µ('div', µ('#complete')).textContent = 'Process Complete';
            }, 9000);
          }

          var key = 'dispense' + _this.num;
          var store = {};
          store[key] = '';
          store[key] += true;
          localStore.set(store);
          if (µ('hard-ware').ready)
            _this.output.write(0);
        }, this.time);
      };

      this.keypad.onChange = function() {
        _this.text.textContent = _this.keypad.input;
      };

      this.submit.onmousedown = function(e) {
        e.preventDefault();
        if (!(_this.done || _this.dispensing || _this.fail)) {
          this.clicked = true;
          this.style.backgroundColor = µ('con-fig')[_this.color].hex;
          this.style.color = '#000';
          _this.check();
        }
      };

      this.submit.onmouseout = this.submit.onmouseup = function() {
        if (this.clicked && !this.dispensing) {
          this.clicked = false;
          this.style.color = µ('con-fig')[_this.color].hex;
          this.style.backgroundColor = '#000';
        }
      };

      this.ret.onmousedown = function(e) {
        e.preventDefault();
        _this.close();
      };

    };
  });

  document.registerElement('disp-enser', dispenser);
});
