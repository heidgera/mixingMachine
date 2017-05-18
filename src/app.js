var localStore = null;
var hardwareJS = '';
if (window.isApp === true) {
  localStore = chrome.storage.local;
  hardwareJS = './hardwareChromeApp.js';
} else {
  localStore  = localStorage;
  hardwareJS = './hardware.js';
}

include([hardwareJS, './config.js', 'src/dispenser.js', 'src/button.js', 'src/invert.js'], function() {

  var authLockout = true;

  function timeString() {
    var time = new Date();

    var h = zeroPad(time.getHours(), 2);
    var m = zeroPad(time.getMinutes(), 2);
    var s = zeroPad(time.getSeconds(), 2);

    return h + ':' + m  + ':' + s;
  }

  µ('#complete').spin = µ('#wait', µ('#svgTemp').content).cloneNode(true);
  µ('div', µ('#complete')).appendChild(µ('#complete').spin);
  µ('#complete').spin.setAttribute('fill', '#333');
  µ('#complete').spin.setAttribute('stroke', '#aaa');
  µ('#complete').spin.style.width = '25%';
  µ('#complete').spin.style.left = '37.5%';

  /*function resetNext(num) {
    var key = 'dispense' + num;
    if (num < 7)
      µ('disp-enser:nth-child(' + num + ')').reset(function() {resetNext(num + 1);});
  }*/

  var authClock = null;

  //µ('hard-ware').init();

  /*authClock = setInterval(function() {
    µ('#auth').read();
    console.log('should be reading');
  }, 500);*/

  //store teh settings from the settings dialog when 'okay is clicked'
  //also resets the program after storing the data

  µ('#setOkay').onClick = function() {

    var invKey = 'invertSwitch';
    var serialKey = 'serialPort';
    console.log(invKey + ' is the storage key');
    var store = {};
    store[invKey] = '';
    store[invKey] += µ('#invertSwitch').checked;
    store[serialKey] = '';
    store[serialKey] += µ('#serialSelect').value;
    localStore.set(store);

    µ('#settings').style.display = 'none';
    chrome.runtime.reload();
    chrome.runtime.restart();
  };

  //close the settings dialog on cancel press
  µ('#setCancel').onClick = function() {
    µ('#settings').style.display = 'none';
  };

  //if there is stored data about the serialPort or mouse inversion, grab and
  //use it
  var codeKey = ['invertSwitch', 'serialPort'];
  localStore.get(codeKey, function(resp) {
    console.log('searching storage');
    console.log(resp);
    if (resp.serialPort != null) {
      µ('hard-ware').port = resp.serialPort;
      var s = µ('#serialSelect');
      for (var i = 0; i < s.options.length; i++) {
        if (s.options[i].value == µ('hard-ware').port) {
          s.options[i].selected = true;
          return;
        }
      }
    }

    if (resp.invertSwitch != null) {
      window.invertMouse = (resp.invertSwitch == 'true');
      µ('#invertSwitch').checked = window.invertMouse;
    }

    //connect the arduino; function passed is used when available ports are listed
    µ('hard-ware').begin(function(ports) {
      for (var i = 0; i < ports.length; i++) {
        var opt = document.createElement('option');
        opt.text = ports[i].path;
        µ('#serialSelect').add(opt);
      }
    });
  });

  //
  µ('hard-ware').onReady = function() {
    if (authLockout) {
      authClock = setInterval(function() {
        µ('#auth').read();
      }, 500);
    }

    var disps = µ('disp-enser');
    for (var i = 0; i < disps.length; i++) {
      disps[i].init();
    }

    //resetNext(1);
    //disps[0].fillUp();

    //µ('#cylinder').write(1);

    /*µ('#LinDir').write(0);
    setTimeout(()=> {
      µ('#LinEn').write(1);
      setTimeout(()=> {
        µ('#LinEn').write(0);
        setTimeout(()=> {
          µ('#LinDir').write(0);
          µ('#fogTrig').write(0);

          //µ('hard-ware').arduino.auxBoard.digitalWrite(15, 0);
        }, 500);
      }, 15000);
    }, 500);*/
  };

  µ('#PumpEn').onError = ()=> {
    //µ('disp-enser')[0].stop();
    //console.log('errored!');
    µ('#PumpEn').write(µ('#PumpEn').state);
  };

  µ('#auth').onData = function(val) {
    if (!val) {
      µ('hard-ware').arduino.auxBoard.digitalWrite(15, 1);
      authLockout = false;
      µ('#authLock').style.display = 'none';
      console.log('unlock');
      if (authClock) clearInterval(authClock);
      authClock = null;
    }
  };

  /*µ('#fullReset').onData = function(val) {
    if (val) {
      //resetNext(1);
      chrome.runtime.reload();

      //location.reload();
    }
  };*/

  function touchHandler(event) {
    var first = event.changedTouches[0];
    var type = '';
    switch (event.type)
    {
      case 'touchstart': type = 'mousedown'; break;
      case 'touchmove':  type = 'mousemove'; break;
      case 'touchend':   type = 'mouseup';   break;
      default:           return;
    }

    // initMouseEvent(type, canBubble, cancelable, view, clickCount,
    //                screenX, screenY, clientX, clientY, ctrlKey,
    //                altKey, shiftKey, metaKey, button, relatedTarget);

    var simulatedEvent = document.createEvent('MouseEvent');
    simulatedEvent.initMouseEvent(type, true, true, window, 1,
                                  first.screenX, first.screenY,
                                  first.clientX, first.clientY, false,
                                  false, false, false, 0, null);

    first.target.dispatchEvent(simulatedEvent);
    event.preventDefault();
  }

  document.addEventListener('touchstart', touchHandler, true);
  document.addEventListener('touchmove', touchHandler, true);
  document.addEventListener('touchend', touchHandler, true);
  document.addEventListener('touchcancel', touchHandler, true);

  document.onkeypress = function(e) {

    e.preventDefault();
    var press = String.fromCharCode(e.keyCode);
    if (press == ']') {
      console.log('close');
      µ('#LinDir').write(0);
      setTimeout(()=> {
        µ('#LinEn').write(1);
        setTimeout(()=> {
          µ('#LinEn').write(0);
          setTimeout(()=> {
            µ('#LinDir').write(0);
          }, 500);
        }, 10000);
      }, 500);
    } else if (press == '[') {
      console.log('open');
      µ('#LinDir').write(1);
      setTimeout(()=> {
        µ('#LinEn').write(1);
        setTimeout(()=> {
          µ('#LinEn').write(0);
          setTimeout(()=> {
            µ('#LinDir').write(0);
          }, 500);
        }, 10000);
      }, 500);
    }

  };

  var outputs = ['1', '2', '3', '4', '5', '6'];
  var resets = ['Q', 'W', 'E', 'R', 'T', 'Y'];
  var minReset = ['A', 'S', 'D', 'F', 'G', 'H'];
  var minTimers = {};
  var minTimer = null;

  document.onkeydown = function(e) {

    if (String.fromCharCode(e.which) == 'U') {
      authLockout = false;
      µ('#authLock').style.display = 'none';
      console.log('unlock');
    }
  };

  document.onkeyup = function(e) {

  };
});
