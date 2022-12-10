/**
 * Fork of the default three.js PointerLockControls. This fork differs in that
 * it allows using the mouse as an analog device (for example, to control
 * things like thrust) without dictating that it should only be used to move
 * the camera.
 */

import { Euler, EventDispatcher } from 'three';

const PointerLockControls = function(camera, domElement) {
  this.camera = camera;
  if (domElement === undefined) {
    console.warn(
      'PointerLockControls: The second parameter "domElement" is now mandatory.',
    );
    domElement = document.body;
  }

  this.domElement = domElement;
  // If true, the browser will hide the cursor.
  this.isPointerLocked = false;

  // // Constrain pitch in headlook mode.
  // this.headXMax = 1565;
  // this.headYMax = 1110;

  // When true, the pressing of the Escape button is simulated when pointerlock
  // is lost. This is needed because we cannot intercept (or even detect) if
  // the user presses escape to exit pointer lock. This is a problem because we
  // use escape for pause menus etc. See onPointerlockChange below.
  // TODO: reimplement - this currently has no effect.
  this.simulateNextEscape = true;

  const scope = this;

  const changeEvent = { type: 'change' };
  const lockEvent = { type: 'lock' };
  const unlockEvent = { type: 'unlock' };

  const euler = new Euler(0, 0, 0, 'YXZ');
  const PI_2 = Math.PI / 2;

  function onPointerlockChange() {
    if (scope.domElement.ownerDocument.pointerLockElement === scope.domElement) {
      scope.dispatchEvent(lockEvent);
      scope.isPointerLocked = true;
    }
    else {
      scope.dispatchEvent(unlockEvent);
      scope.isPointerLocked = false;
      scope.simulateNextEscape = true;
    }
  }

  function onPointerlockError() {
    // Only throw error if game is fully loaded and we have focus.
    if (document.hasFocus()) {
      console.error(
        'THREE.PointerLockControls: Unable to use Pointer Lock API. This ' +
        'could be because the window doesn\'t have focus, or because ' +
        'we\'re attempting a re-lock too soon after the browser forcibly ' +
        'exited lock.',
      );
    }
  }

  this.connect = function() {
    scope.domElement.ownerDocument.addEventListener('pointerlockchange', onPointerlockChange, false);
    scope.domElement.ownerDocument.addEventListener('pointerlockerror', onPointerlockError, false);
  };

  this.disconnect = function() {
    scope.domElement.ownerDocument.removeEventListener('pointerlockchange', onPointerlockChange, false);
    scope.domElement.ownerDocument.removeEventListener('pointerlockerror', onPointerlockError, false);
  };

  this.dispose = function() {
    // this.disconnect();
    console.warn(
      'ptrLockControls tried calling dispose, but this is unexpected. Please investigate.',
    );
  };

  // Locks the mouse pointer.
  this.lock = function() {
    this.domElement.requestPointerLock();
  };

  // Unlocks the mouse pointer.
  this.unlock = function() {
    scope.simulateNextEscape = false;
    scope.domElement.ownerDocument.exitPointerLock();
  };

  // Locks or unlocks the mouse pointer.
  this.toggle = function() {
    if (this.isPointerLocked) {
      this.unlock();
    }
    else {
      this.lock();
    }
  };

  this.connect();
};

PointerLockControls.prototype = Object.create(EventDispatcher.prototype);
PointerLockControls.prototype.constructor = PointerLockControls;

export {
  PointerLockControls,
};
