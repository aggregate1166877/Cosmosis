import ChangeTracker from 'change-tracker/src';
import { builtInPluginsEnabled } from '../pluginsEnabled';
import { PluginEntry } from '../interfaces/PluginEntry';
import { TypeReplacements } from '../interfaces/TypeReplacements';
import CosmosisPlugin from './CosmosisPlugin';

export default class PluginLoader {
  public onLoaded: ChangeTracker;

  private _communityManifestPath: string;
  private _runIndex: number;
  private readonly _dependenciesLoaded: { [key: string]: boolean };
  // Plugins that reached loading stage but had unmet dependencies.
  private readonly _shovedPlugins: Array<PluginEntry>;
  // Anything stored in here will have its class replaced with something else.
  private readonly _pluginOverrides: TypeReplacements;

  constructor() {
    this._communityManifestPath = './pluginCommunity/pluginsEnabled.json';
    this._runIndex = -1;
    this._dependenciesLoaded = {};
    this._shovedPlugins = [];
    this._pluginOverrides = {};
    this.onLoaded = new ChangeTracker();
  }

  start(onLoaded: Function) {
    if (!onLoaded) {
      throw '[PluginLoader] start needs a callback.';
    }
    this.onLoaded.getOnce(onLoaded);
    this._doPluginRun(builtInPluginsEnabled, false);
  }

  _doPluginRun(array: Array<PluginEntry>, disableShoving: boolean) {
    const index = ++this._runIndex;
    if (index >= array.length) {
      // Restart the loop, but process shoved plugins (if any).
      if (!disableShoving) {
        disableShoving = true;
        this._runIndex = -1;
        this._doPluginRun(this._shovedPlugins, true);
      }
      else {
        console.log('[PluginLoader] All plugins loaded.');
        this.onLoaded.setValue(true);
      }
      return;
    }

    // -----------------------------------------------------------------------------
    const { name, dependencies, pluginInstance, timeoutWarn = 3000 } = array[index];
    // -----------------------------------------------------------------------------
    let disallowRun = false;
    let shoved = false;
    if (dependencies) {
      for (let di = 0, len = dependencies.length; di < len; di++) {
        const dependency = dependencies[di];
        const dependencyMissing = !this._dependenciesLoaded[dependency];
        if (dependencyMissing) {
          console.log('----> Missing dependency', dependency);
          disallowRun = true;
          if (disableShoving) {
            console.error('[PluginLoader] Error:', name, 'is missing dependency', dependency);
          }
          else if (!shoved) {
            shoved = true;
            this._shovedPlugins.push(array[index]);
          }
        }
      }
    }

    if (!disallowRun && !shoved) {
      let plugin: CosmosisPlugin;
      if (pluginInstance) {
        plugin = pluginInstance;
      }
      // @ts-ignore
      else if (window.$earlyPlugin[name]) {
        // Plugin is community-offered.
        // @ts-ignore
        plugin = window.$earlyPlugin[name];
      }
      // @ts-ignore
      else if (window.$latePlugin[name]) {
        // Plugin is community-offered.
        // @ts-ignore
        plugin = window.$latePlugin[name];
      }
      else {
        console.error('[PluginLoader] Error:', name, 'does not appear to have a valid instance registered.');
        setTimeout(() => this._doPluginRun(array, disableShoving));
        return;
      }

      const pluginOverrides = this._pluginOverrides[name];
      if (pluginOverrides) {
        plugin.TrackedClass = pluginOverrides.replaceClassWith;
      }

      const warnTimer = setTimeout(() => {
        console.warn(`[PluginLoader] Warning: plugin '${name}' has not finished loading after ${timeoutWarn}ms`);
      }, timeoutWarn);

      plugin.onDependenciesMet({
        next: () => {
          clearTimeout(warnTimer);
          this._dependenciesLoaded[name] = true;
          setTimeout(() => this._doPluginRun(array, disableShoving));
        },
        replaceClass: ({ pluginName, replaceClassWith }) => {
          this._pluginOverrides[pluginName] = {
            name: pluginName,
            replaceClassWith,
          }
        }
      });
    }
  }
}
