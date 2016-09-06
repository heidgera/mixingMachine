include([], function() {
  window.invertMouse = false;
  function invertHandler(event) {
    if (!event.ctrlKey && window.invertMouse) {
      console.log('inverting...');
      var type = event.type;

      // initMouseEvent(type, canBubble, cancelable, view, clickCount,
      //                screenX, screenY, clientX, clientY, ctrlKey,
      //                altKey, shiftKey, metaKey, button, relatedTarget);

      var simulatedEvent = document.createEvent('MouseEvent');
      simulatedEvent.initMouseEvent(type, true, true, window, 1,
                                    screen.width - event.screenX, screen.height - event.screenY,
                                    window.innerWidth - event.clientX, window.innerHeight - event.clientY,
                                    true, false, false, false, 0, null);

      document.elementFromPoint(window.innerWidth - event.clientX, window.innerHeight - event.clientY).dispatchEvent(simulatedEvent);
      event.preventDefault();
      event.stopPropagation();
    }
  }

  document.addEventListener('mousedown', invertHandler, true);
  document.addEventListener('mouseup', invertHandler, true);
  document.addEventListener('mousemove', invertHandler, true);
  /*document.addEventListener('click', (ev)=> {
    ev.preventDefault();
    ev.stopPropagation();
  }, true);*/
});
