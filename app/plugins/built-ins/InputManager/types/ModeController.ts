import _ from 'lodash';
import ChangeTracker from 'change-tracker/src';
import userProfile from '../../../../userProfile';
import { gameRuntime } from '../../../gameRuntime';
import { InputManager } from '../index';
import { ModeId } from './ModeId';
import { ActionType } from './ActionType';
import { ControlSchema } from '../interfaces/ControlSchema';
import { arrayContainsArray } from '../../../../local/utils';

export default class ModeController {
  public name: string;
  public modeId: ModeId;
  public controlSchema: ControlSchema;
  public controlsByKey: {};
  public state: { [action: string]: number };
  public pulse: { [actionName: string]: ChangeTracker };
  private readonly continualAdders: { [action: string]: Function };

  constructor(name: string, modeId: ModeId, controlSchema: ControlSchema) {
    this.name = name;
    this.modeId = modeId;
    this.controlSchema = {};
    this.controlsByKey = {};

    // Stores analog values, usually "key was pressed" kinda-stuff.
    this.state = {};

    // Designed for instant actions and toggleables. Contains change trackers.
    this.pulse = {};

    // Used for controls that need to simulate pre-frame key presses.
    this.continualAdders = {};

    // Control setup.
    this.extendControlSchema(controlSchema);

    const inputManager: InputManager = gameRuntime.tracked.inputManager.cachedValue;
    inputManager.registerController(this);
  }

  // This allows both core code and modders to add their own control bindings.
  extendControlSchema(controlSchema) {
    const savedControls = userProfile.getCurrentConfig({ identifier: 'controls' }).controls;
    _.each(controlSchema, (control, actionName) => {
      if (savedControls[actionName]) {
        // Override default controls with user-chosen ones.
        controlSchema[actionName].current = savedControls[actionName];
      }
      else {
        // User profile does not have this control stored. Use default.
        controlSchema[actionName].current = controlSchema[actionName].default;
      }

      if (!controlSchema[actionName].kbAmount) {
        controlSchema[actionName].kbAmount = 1;
      }
    });

    const allowedConflicts = {};

    // Set up controlsByKey, state, and pulse.
    _.each(controlSchema, (control: ControlSchema['key'], actionName: string) => {
      if (this.controlSchema[actionName]) {
        return console.error(
          `[ModeController] Ignoring attempt to set register control action ` +
          `'${actionName}' in mode ${this.name} - ${this.name} already has `
          + `that action defined for something else.`
        );
      }

      this.controlSchema[actionName] = control;

      // Conflicts are rarely allowed in cases where a single mode internally
      // disambiguates conflicts.
      if (control.allowKeyConflicts) {
        if (!allowedConflicts[actionName]) {
          allowedConflicts[actionName] = [];
        }

        _.each(control.allowKeyConflicts, (conflictAction) => {
          if (!allowedConflicts[actionName].includes(conflictAction)) {
            // Example: allowedConflicts['lookUp'] = [ 'pitchUp' ];
            allowedConflicts[actionName].push(conflictAction);
          }

          // Rewrite the conflicting keys to allow conflict with these keys. This
          // allows devs and modders to define allowed conflicts in any order.
          if (!allowedConflicts[conflictAction]) {
            allowedConflicts[conflictAction] = [];
          }
          if (!allowedConflicts[conflictAction].includes(actionName)) {
            // Example: allowedConflicts['pitchUp'] = [ 'lookUp' ];
            allowedConflicts[conflictAction].push(actionName);
          }
        });
      }

      const keys = control.current;
      // The user can assign multiple keys to each action; store them all in
      // controlsByKey individually.
      _.each(keys, (key) => {
        const ctrlByKey = this.controlsByKey[key];
        // console.log(`-> arrayContainsArray(`, allowedConflicts?.[actionName], `,`, this.controlsByKey[key], `) === `, arrayContainsArray(allowedConflicts?.[actionName], this.controlsByKey[key]));
        if (this.controlsByKey[key] && !arrayContainsArray(allowedConflicts?.[actionName], this.controlsByKey[key])) {
          console.warn(
            `[ModeController] Ignoring attempt to set the same key (${key}) ` +
            `for than one action (${actionName} would conflict with ` +
            `${this.controlsByKey[key]})`,
          );
        }
        else {
          if (!this.controlsByKey[key]) {
            this.controlsByKey[key] = [];
          }
          this.controlsByKey[key].push(actionName);
        }
      });

      if (control.actionType === ActionType.pulse) {
        this.pulse[actionName] = new ChangeTracker();
      }
      else {
        this.state[actionName] = 0;
      }
    });
  }

  receiveAction({ action, isDown, analogData }) {
    const control = this.controlSchema[action];
    const actionType = control.actionType;
    const kbAmount = control.kbAmount;

    if (actionType === ActionType.analogLiteral) {
      this.handleReceiveLiteral({ action, isDown, analogData, kbAmount });
    }
    else if (actionType === ActionType.analogGravity) {
      this.handleReceiveGravity({ action, isDown, analogData, kbAmount });
    }
    else if (actionType === ActionType.pulse) {
      this.handlePulse({ action, isDown });
    }
    else if (actionType === ActionType.analogAdditive) {
      this.handleReceiveAdditive({ action, isDown, analogData, kbAmount });
    }
  }

  handleReceiveLiteral({ action, isDown, analogData, kbAmount }) {
    if (analogData) {
      this.state[action] = analogData.delta;
    }
    else {
      this.state[action] = isDown === true ? kbAmount : 0;
    }
  }

  handleReceiveGravity({ action, isDown, analogData, kbAmount }) {
    if (analogData) {
      this.state[action] = analogData.gravDelta;
    }
    else {
      this.state[action] = isDown === true ? kbAmount : 0;
    }
  }

  handleReceiveAdditive({ action, isDown, analogData, kbAmount }) {
    if (analogData) {
      this.state[action] += analogData.delta;
    }
    else if (isDown) {
      this.continualAdders[action] = ({ delta }) => {
        // @ts-ignore
        this.state[action] += delta * kbAmount;
      };
      gameRuntime.tracked.core.cachedValue.onAnimate.getEveryChange(this.continualAdders[action]);
    }
    else {
      gameRuntime.tracked.core.cachedValue.onAnimate.removeGetEveryChangeListener(this.continualAdders[action]);
    }
  }

  handlePulse({ action, isDown }) {
    // Pulse once if the button is down. We don't pulse on release.
    if (isDown) {
      this.pulse[action].setValue(1);
    }
  }

  onActivateController() {
    // The ModeController base class does not use activation itself.
  }

  step(delta) {
    // The ModeController base class does not use stepping itself.
  }
}
