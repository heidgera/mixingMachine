var localStore = null;
var hardwareJS = '';
if (window.isApp === true) {
  localStore = chrome.storage.local;
  hardwareJS = './hardwareApp.js';
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

  function resetNext(num) {
    var key = 'dispense' + num;
    if (num < 7)
      µ('disp-enser:nth-child(' + num + ')').reset(function() {resetNext(num + 1);});
  }

  var authClock = null;

  //µ('hard-ware').init();

  /*authClock = setInterval(function() {
    µ('#auth').read();
    console.log('should be reading');
  }, 500);*/

  µ('#setOkay').onClick = function() {
    //console.log(µ('#invertSwitch').checked);
    //console.log(µ('#serialSelect').value + ' is the new serialPort');

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
  };

  µ('#setCancel').onClick = function() {
    µ('#settings').style.display = 'none';
  };

  var codeKey = ['invertSwitch', 'serialPort'];
  localStore.get(codeKey, function(resp) {
    console.log('searching storage');
    console.log(resp);
    if (resp.serialPort != null) {
      µ('hard-ware').port = resp.serialPort;
      console.log(resp.serialPort + ' is the serial response');
    }

    if (resp.invertSwitch != null) {
      //µ('hard-ware').port = resp['serialKey'];
      window.invertMouse = (resp.invertSwitch == 'true');
      console.log(resp.invertSwitch + ' is the serial response');
    }

    µ('hard-ware').begin(function(ports) {
      for (var i = 0; i < ports.length; i++) {
        var opt = document.createElement('option');
        opt.text = ports[i].path;
        µ('#serialSelect').add(opt);
      }
    });
  });

  µ('hard-ware').onReady = function() {
    if (authLockout) {
      authClock = setInterval(function() {
        µ('#auth').read();
      }, 500);
    }

    resetNext(1);
    µ('#cylinder').write(1);
  };

  µ('#auth').onData = function(val) {
    if (val) {
      authLockout = false;
      µ('#authLock').style.display = 'none';
      console.log('unlock');
      if (authClock) clearInterval(authClock);
      authClock = null;
    }
  };

  µ('#fullReset').onData = function(val) {
    if (val) {
      //resetNext(1);
      chrome.runtime.reload();

      //location.reload();
    }
  };

  function touchHandler(event) {
    var first = event.changedTouches[0],
        type = '';
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
                                  false, false, false, 0/*left*/, null);

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
    if (press == ' ') {
      console.log('release');
      µ('#cylinder').write(0);
    } else if (press == '=') {
      console.log('close');
      µ('#cylinder').write(1);
    }

  };

  var outputs = ['1', '2', '3', '4', '5', '6'];
  var resets = ['Q', 'W', 'E', 'R', 'T', 'Y'];
  var minReset = ['A', 'S', 'D', 'F', 'G', 'H'];
  var minTimers = {};
  var minTimer = null;

  document.onkeydown = function(e) {
    for (var i = 0; i < 6; i++) {
      if (String.fromCharCode(e.which) == outputs[i]) {
        µ('#reset' + (i + 1)).write(1);
        µ('#tube' + (i + 1)).write(0);
      } else if (String.fromCharCode(e.which) == resets[i]) {
        µ('#reset' + (i + 1)).write(0);
        µ('#tube' + (i + 1)).write(1);
      } else if (String.fromCharCode(e.which) == minReset[i]) {
        for (var j = 0; j < 6; j++) {
          µ('#tube' + (j + 1)).write(0);
          µ('#reset' + (j + 1)).write(0);
          console.log((j + 1) + ' stopped');
          clearTimeout(minTimer);
        }

        µ('#reset' + (i + 1)).write(1);
        µ('#tube' + (i + 1)).write(0);
        console.log('start ' + (i + 1));
        var tubeStop = µ('#reset' + (i + 1));

        setTimeout(function() {
          tubeStop.write(1);
        }, 250);

        //minTimers[minReset[i]]
        console.log('setting timeout for ' + (i + 1));
        minTimer = setTimeout(function() {
          tubeStop.write(0);
          console.log('auto stop ' + tubeStop.id);
        }, 180000);
      }
    }

    if (String.fromCharCode(e.which) == 'U') {
      authLockout = false;
      µ('#authLock').style.display = 'none';
      console.log('unlock');
    }
  };

  document.onkeyup = function(e) {
    for (var i = 0; i < 6; i++) {
      if (String.fromCharCode(e.which) == outputs[i] ||
       String.fromCharCode(e.which) == resets[i]) {
        µ('#tube' + (i + 1)).write(0);
        µ('#reset' + (i + 1)).write(0);
        if (minTimers[minReset[i]])
          clearTimeout(minTimers[minReset[i]]);
      }
    }
  };
});
