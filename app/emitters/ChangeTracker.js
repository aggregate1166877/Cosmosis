// Mechanism to keep track of when a variable changes.
export default class ChangeTracker {
  constructor() {
    // The primary variable of this object.
    this._value = null; // TODO: delete this. It should be inaccessible anyway.
    // Tracks if the variable has been set at least once.
    this._valueAlreadySet = false;
    // Contains all one-off listeners.
    this._singleListeners = [];
    // Contains all listeners that should be notified for every change.
    this._multiListeners = [];
    // Like _singleListeners, but ignored current value.
    this._nextListeners = [];
  }

  // Using this, you'll be notified the first time the value changes. If the
  // value has already been set, you'll be notified immediately.
  getOnce(callback) {
    if (this._valueAlreadySet) {
      callback(this._value);
    }
    else {
      this._singleListeners.push(callback);
    }
  }

  // Using this, you'll be notified every time the value changes. If the value
  // has already been set, you'll be notified immediately.
  getEveryChange(callback) {
    this._multiListeners.push(callback);
    if (this._valueAlreadySet) {
      callback(this._value);
    }
  }

  // Notified you the next time the value changes. Does not return the current
  // value.
  getNext(callback) {
    this._nextListeners.push(callback);
  }

  // Sets the value, then notifies those waiting for it.
  setValue(value) {
    this._value = value;
    if (!this._valueAlreadySet) {
      this._valueAlreadySet = true;

      // Notify all one-off listeners.
      const singleListeners = this._singleListeners;
      for (let i = 0; i < singleListeners.length; i++) {
        singleListeners[i](value);
      }

      // Mark for garbage collection.
      this._singleListeners = null;
    }

    // Notify next-only listeners.
    const nextListeners = this._nextListeners.slice();
    for (let i = 0; i < nextListeners.length; i++) {
      nextListeners[i](value);
    }

    // Mark next-only listeners for garbage collection.
    this._nextListeners = [];

    // Notify all subscribers.
    for (let i = 0; i < this._multiListeners.length; i++) {
      this._multiListeners[i](value);
    }
  }
}
