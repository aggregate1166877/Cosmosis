import * as THREE from 'three';
import CosmosisPlugin from '../../types/CosmosisPlugin';
import PluginCacheTracker from '../../../emitters/PluginCacheTracker';
import Core from '../Core';
import Player from '../Player';
import {
  BUFFER_TYPE,
  ROT_W,
  ROT_X,
  ROT_Y,
  ROT_Z,
  API_BRIDGE_REQUEST,
  SBA_LENGTH,
  SEND_SKYBOX,
  TYPE_POSITIONAL_DATA,
  FRONT_SIDE,
  RIGHT_SIDE,
  BACK_SIDE,
  TOP_SIDE,
  BOTTOM_SIDE, LEFT_SIDE,
} from './webWorker/sharedBufferArrayConstants';
import WebWorkerRuntimeBridge from '../../../local/WebWorkerRuntimeBridge';
import { bufferToPng } from './webWorker/workerUtils';
import { gameRuntime } from '../../gameRuntime';

const csmToThree = [
  5, 4, 2, 3, 1, 0,
];

type PluginCompletion = PluginCacheTracker & {
  player: Player, core: Core,
};

class OffscreenGalaxyWorker extends Worker {
  private _pluginTracker!: PluginCacheTracker | PluginCompletion;
  // private transferablePosition!: Float64Array;
  private bridge: WebWorkerRuntimeBridge;
  private debugLiveAnimation = false;
  // If this is hits zero, a skybox is generated. If below zero, the class can
  // still receive updates, but won't apply them to the skybox. This is
  // intended for preemptive cases.
  private skyboxCountDown = 5;
  private skyboxTextures: THREE.CanvasTexture[] | null[] = [ null, null, null, null, null, null ];

  constructor() {
    // Note: Webpack automatically bundles this from ./webWorker/index.ts. The
    // path is defined in /app/plugins/pluginWebWorkersEnabled.json.
    super('./build/offscreenGalaxy.js', { type: 'module' });

    this.bridge = new WebWorkerRuntimeBridge();
    this.addEventListener('message', this.receiveMessage.bind(this));
    this._init();

    // this.transferablePosition = new Float64Array(SBA_LENGTH);

    this._pluginTracker = new PluginCacheTracker([ 'core', 'player' ]);
    this._pluginTracker.onAllPluginsLoaded.getOnce(() => {
      if (this.debugLiveAnimation) {
        this.postMessage({ endpoint: 'actionStartDebugAnimation' });
        this._pluginTracker.core.onAnimate.getEveryChange(() => {
          const cam: THREE.PerspectiveCamera = this._pluginTracker.player.camera;
          if (!cam) {
            return;
          }
          this.sendPositionalInfo(cam);
        });
        // TODO: disable space skybox when doing this.
        return;
      }

      this.skyboxCountDown = 5;
      this.postMessage({
        endpoint: 'mainRequestsSkybox',
      });
    });
    // setInterval(() => {
    //   this.postMessage({
    //     endpoint: 'mainRequestsSkyboxSide',
    //     options: { side: THREE.MathUtils.randInt(0, 5) },
    //   });
    // }, 1000);
  }

  _init() {
    // @ts-ignore
    const canvas: HTMLCanvasElement = document.getElementById('galaxy-canvas');
    if (!canvas || !('transferControlToOffscreen' in canvas)) {
      // TODO: handle this better. Or not - we choose the NW.js version, and
      //  won't choose something that doesn't boot. Needs thought.
      console.error('[OffscreenGalaxyWorker] Error creating offscreen canvas.');
      return;
    }

    // TODO: on resize, post a message telling to change size.
    // @ts-ignore
    const offscreen = canvas.transferControlToOffscreen();
    this.postMessage({
      endpoint: 'init',
      canvas: offscreen,
      width: window.innerWidth,
      height: window.innerHeight,
      pixelRatio: window.devicePixelRatio,
      path: '..',
    }, [ offscreen ]);
  }

  receiveMessage(message: { data: { buffer, rpc, replyTo, options } }) {
    // console.log('OffscreenGalaxyWorker received', { message });
    const data = message.data;
    // if (data.buffer) {
    //   // This allows us to create an oscillating effect where the variable is
    //   // passed back and forth between threads. It's currently unkown which
    //   // produces more lag better bidirectional sharing and recreating
    //   // Float64Array from scratch each frame.
    //   // this.transferablePosition = data;
    // }
    // else {
    const { rpc, replyTo, options, buffer }: {
      rpc: number,
      replyTo: string,
      options: { [key: string]: any },
      buffer: ArrayBuffer | ImageBitmap
    } = data;
      // Skybox requesting data.
      if (rpc === API_BRIDGE_REQUEST) {
        this.bridge.auto(options, (error, { serialData, bufferData }) => {
          if (bufferData) {
            this.postMessage({
              endpoint: replyTo,
              buffer: bufferData.buffer,
              serialData,
            }, [bufferData.buffer]);
          }
          else {
            this.postMessage({
              endpoint: replyTo,
              serialData,
            });
          }
        });
      }
      // Skybox sending data.
      else if (rpc === SEND_SKYBOX) {
        console.log(`=======> ${SEND_SKYBOX}[${options.side}]`, buffer);

        const start = performance.now();
        const side = options.side;
        const texture = new THREE.CanvasTexture(buffer as ImageBitmap);
        texture.image = buffer;
        // @ts-ignore
        this.skyboxTextures[csmToThree[side]] = texture;
        // Try to keep this under 1ms. The only real lag should come from
        // offscreen GPU use. This averages 0.09-0.5ms on my laptop, depending
        // on how busy the machine already is.
        console.log(`[OffscreenGalaxyWorker] side cost the main thread ${(performance.now() - start)}ms.`);

        if (this.skyboxCountDown-- === 0) {
          this.buildSkybox();
        }
      }
      else {
        console.warn(
          '[OffscreenGalaxyWorker] Posted message not understood:', message,
        );
      }
    // }
  }

  sendPositionalInfo(camera: THREE.PerspectiveCamera) {
    const bufferArray = new Float64Array(SBA_LENGTH);

    // if (!bufferArray.byteLength) {
    //   // Variable is currently locked by another thread and is not usable.
    //   return;
    // }

    const quaternion = camera.quaternion;

    bufferArray[BUFFER_TYPE] = TYPE_POSITIONAL_DATA;
    bufferArray[ROT_X] = quaternion.x;
    bufferArray[ROT_Y] = quaternion.y;
    bufferArray[ROT_Z] = quaternion.z;
    bufferArray[ROT_W] = quaternion.w;

    this.postMessage({
      endpoint: 'receivePositionalInfo',
      buffer: bufferArray.buffer,
    }, [ bufferArray.buffer ]);
  }

  buildSkybox() {
    console.log('--> building skybox on main thread');
    const start = performance.now();
    const currentTextures = this.skyboxTextures;
    this.skyboxTextures = [ null, null, null, null, null, null ];
    let i: number, len: number;

    const materials: THREE.MeshBasicMaterial[] = [];
    for (i = 0, len = currentTextures.length; i < len; i++) {
      // @ts-ignore
      const bitmap: THREE.CanvasTexture = currentTextures[i];
      bitmap.colorSpace = 'srgb';
      // bitmap.image.
      const newMaterial = new THREE.MeshBasicMaterial({ map: bitmap, side: THREE.BackSide });
      materials.push(newMaterial);
    }

    // skybox.materials = materials;

    const size = 200000;
    const geometry = new THREE.BoxGeometry(size, size, size);
    // const material = new THREE.MeshBasicMaterial({ color: 0x000000 });
    // material.side = THREE.BackSide;
    // material.side = THREE.BackSide;
    const skybox = new THREE.Mesh(geometry, materials);

    console.log(`[OffscreenGalaxyWorker] side cost the main thread ${(performance.now() - start)}ms.`);

    gameRuntime.tracked.levelScene.getOnce((scene) => {
      scene.add(skybox);
    });
  }
}

const offscreenGalaxyWorkerPlugin = new CosmosisPlugin('offscreenGalaxyWorker', OffscreenGalaxyWorker);

export {
  OffscreenGalaxyWorker,
  offscreenGalaxyWorkerPlugin,
}
