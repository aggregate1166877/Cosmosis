enum ActionType {
  // Should not be used outside of debugging contexts. Does all key processing
  // up the very last step, but then isn't handed over to the final processing
  // functions.
  ignored = 0,
  // This triggers a single callback per key press. Can also be thought of as a
  // toggleable in some instances (e.g. press for roof lights, press again for
  // no lights).
  // This value should not change at runtime, and should be thought of as a
  // defining factor of the action it's tied to.
  pulse = 1,
  // If an action is continuous, it means its state is rechecked every frame.
  // This value should not change at runtime, and should be thought of as a
  // defining factor of the action it's tied to.
  continuous = 2,


  // @deprecated
  // Sets things to the exact current mouse or game stick value.
  // If a keyboard button, the value is either 0% or 100% (0-1).
  analogLiteral = 0,
  // @deprecated
  // Add the latest mouse or game stick value.
  // If a keyboard button, the value either 0% or 100% (0-1).
  analogAdditive = 0,
  // @deprecated
  // Sets the value to the device's change in momentum.
  // If a keyboard button, the value either 0% or 100% (0-1).
  analogGravity = 0,
  // @deprecated
  // Think of this the way you would think of an analog stick. Your center is
  // a zero-point, and the value increases as you go outward. You have a
  // maximum amount you can go outward.
  analogThreshold = 0,
}

export {
  ActionType,
}
