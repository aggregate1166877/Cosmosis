import LogicalSceneGroup from './LogicalSceneGroup';
import localClusterStarShader from '../scenes/localClusterStarShader';
import contextualInput from '../local/contextualInput';
import { FreeCam } from '../modeControl/cameraControllers/freeCam';
import * as THREE from 'three';
import { createSpaceShip } from '../levelLogic/spaceShipLoader';

const gameFont = 'node_modules/three/examples/fonts/helvetiker_regular.typeface.json';
const { camController, ActionType } = contextualInput;
let starFieldScene = null;

const freeCam = new FreeCam();
freeCam.init();

function onControlChange({ next, previous }) {
  if (next === freeCam.modeName) {
    freeCam.onControlChange({ next, previous });
  }
}

const starFieldFreeFlight = new LogicalSceneGroup({
  activate: ({ camera, renderer, callback=()=>{} }={ callback: ()=>{} }) => {
    camController.onControlChange(onControlChange);
    renderer.autoClear = true;
    const gl = renderer.context;
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_DST_COLOR);

    if (!starFieldScene) {
      starFieldScene = localClusterStarShader.init();
    }

    starFieldScene.add(camera);
    camController.giveControlTo('freeCam');

    const fontLoader = new THREE.FontLoader();
    fontLoader.load(gameFont, function (font) {
      callback();

      $game.spaceScene = starFieldScene;
      $game.levelScene = starFieldScene;

      // We unfortunately need some form of mesh in order for the game to set
      // up / center itself.
      createSpaceShip({
        scene: starFieldScene,
        modelName: 'minimal scene', onReady: (mesh, bubble) => {
          $game.playerShip = mesh;
          $game.playerShipBubble = bubble;
        }
      });
    });
  },
  deactivate: ({ renderer, callback=()=>{} }={ callback: ()=>{} }) => {
    camController.removeControlListener(onControlChange);
    const gl = renderer.context;
    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    callback();
    starFieldScene = null;
  },
  render: ({ renderer, camera }) => {
    renderer.render(starFieldScene, camera);
  },
  step: ({ delta, isActive }) => {
    if (!isActive) {
      return;
    }
    freeCam.step({ delta });
  },
});

export default starFieldFreeFlight;
