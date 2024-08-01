import React from 'react';
import { Grid, GridColumn, GridRow } from 'semantic-ui-react';
import { Navigation } from '../../../../Navigation';
import PluginCacheTracker from '../../../../../../emitters/PluginCacheTracker';
import {
  RegisteredMenu,
} from '../../../../ReactBase/types/compositionSignatures';
import {
  LargeGravitationalSource,
} from '../../../../../../celestialBodies/LargeGravitationalSource';

const { ceil } = Math;

const containerStyle: React.CSSProperties = {
  height: '95%',
};

const gridStyle: React.CSSProperties = {
  height: '100%',
};

const menuItemStyle = {
  padding: 4,
  marginBottom: 2,
  fontWeight: 'bold',
};

const selectedBodyStyle: React.CSSProperties = {
  ...menuItemStyle,
  color: '#000',
  backgroundColor: '#ffc227f7',
};

const unSelectedBodyStyle: React.CSSProperties = {
  ...menuItemStyle,
  color: '#eeb01c',
  backgroundColor: '#ff3e0029',
};

const buttonStyle: React.CSSProperties = {
  color: '#000',
  backgroundColor: '#ffc227f7',
  borderRadius: 4,
  border: 'none',
  marginTop: 20,
};

// -- ✀ Plugin boilerplate ----------------------------------------------------

const pluginDependencies = {
  navigation: Navigation,
};
type Dependencies = typeof pluginDependencies;
const pluginList = Object.keys(pluginDependencies);

// -- ✀ -----------------------------------------------------------------------+

class SolarSystemNav extends React.Component {
  private _pluginCache = new PluginCacheTracker<Dependencies>(pluginList).pluginCache;
  private _bodyCache: LargeGravitationalSource[] = [];

  state = {
    selectedBody: 0,
  };

  genBodyList = () => {
    const bodies = this._bodyCache;
    if (!bodies.length) {
      return 'System offline.';
    }

    const selectedBody = this.state.selectedBody;
    const jsx: JSX.Element[] = [];
    for (let i = 0, len = bodies.length; i < len; i++) {
      const body = bodies[i];

      let style = selectedBody === i ? selectedBodyStyle : unSelectedBodyStyle;

      jsx.push(
        <div key={body.name} style={style}>
          {body.name}
        </div>,
      );
    }
    return jsx;
  };

  genBodyDetails = () => {
    const bodies = this._bodyCache;
    const { selectedBody } = this.state;
    const body = bodies[selectedBody];
    return (
      <div>
        <h3>{body.name}</h3>
        <div>Mass: {body.massKg} kg</div>
        <div>Diameter: {ceil(body.radiusM * 2 * 0.001).toLocaleString()} km</div>
        <div>Axial Tilt: {(body.axialTilt).toFixed(3)}°</div>
        {/*<div>Velocity: {(body.velocity)}m/s</div>*/}

        {/*<Button fluid style={buttonStyle}>Start Navigation</Button>*/}
      </div>
    );
  };

  render() {
    this._bodyCache = this._pluginCache.navigation.getAllPlanetaryBodies();
    return (
      <div style={containerStyle}>
        <b>System: {this._pluginCache.navigation.getSystemName()}</b>
        <Grid columns={2} style={gridStyle}>
          <GridRow>
            <GridColumn>
              {this.genBodyList()}
            </GridColumn>
            <GridColumn style={{ borderLeft: 'thin solid white' }}>
              {this.genBodyDetails()}
            </GridColumn>
          </GridRow>
        </Grid>
      </div>
    );
  }
}

export {
  SolarSystemNav,
};
