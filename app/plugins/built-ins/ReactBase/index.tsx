import React from 'react';
import * as ReactDOM from 'react-dom';
import CosmosisPlugin from '../../types/CosmosisPlugin';
import { onDocumentReady } from '../../../local/windowLoadListener';
import ChangeTracker from 'change-tracker/src';
import RootNode from './types/RootNode';
import InputBridge from './types/InputBridge';

class ReactBase {
  private _input = new InputBridge();
  public onUiLoaded = new ChangeTracker();

  private _rootNode = null;

  constructor() {
    onDocumentReady(this.setupReact.bind(this));
  }

  getInputBridge() {
    return this._input;
  }

  setupReact() {
    this._rootNode = ReactDOM.render(
      <RootNode inputBridge={this._input}/>,
      document.getElementById('reactRoot'),
    );
  }
}

const reactBasePlugin = new CosmosisPlugin('reactBase', ReactBase);

export {
  ReactBase,
  reactBasePlugin,
}
