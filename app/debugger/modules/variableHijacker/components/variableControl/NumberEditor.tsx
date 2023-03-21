import React from 'react';
import { Button, Icon } from 'semantic-ui-react';
import NumericSlider from '../subcomponents/NumericSlider';
import NumericInput from '../subcomponents/NumericInput';
import NumberSliderRange from '../subcomponents/NumberSliderRange';

const CONTAINER_STYLE = {
  fontFamily: 'Consolas, monospace, Lato, sans-serif',
  borderLeft: '2px solid #d2d2d2',
  marginTop: 4,
  marginLeft: 3,
  padding: 4,
  paddingLeft: 19,
};

const BUTTON_STYLE = {
  margin: 0,
};

const INPUT_STYLE = {
  color: '#ffffff',
  backgroundColor: '#565b5d',
};

const SLIDER_STYLE = {
  width: '100%',
};

interface Props {
  target: string,
  parent: object,
}

export default class NumberEditor extends React.Component<Props> {
  constructor(props) {
    super(props);
  }

  render() {
    console.log('=> target:', this.props.target, 'parent:', this.props.parent);

    return (
      <div style={CONTAINER_STYLE}>
        <NumericInput/>
        &nbsp;
        <Button positive={false} style={{ width: 55 }}>
          <Icon name="unlock"/>
        </Button>
        <br/>
        <NumericSlider min={-1} max={100} value={24}/>
        <NumberSliderRange/>
      </div>
    );
  }
}
