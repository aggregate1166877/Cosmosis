// Generate a number of text labels, from 1µm in size up to 100,000,000 light years
// Try to use some descriptive real-world examples of objects at each scale

import * as THREE from 'three';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';

import core from '../local/core';

// const demo = new CANNON.Demo();
// console.log(demo)

var quality = 16, step = 1024 / quality;

const labelData = [
  // {size: .01, scale: 0.0001, label: "microscopic (1µm)"}, // FIXME - triangulating text fails at this size, so we scale instead
  // {size: .01, scale: 0.1, label: "minuscule (1mm)"},
  // {size: .01, scale: 1.0, label: "tiny (1cm)"},
  // {size: 1, scale: 1.0, label: "child (1m)"},
  // {size: 10, scale: 1.0, label: "tree (10m)"},
  // {size: 100, scale: 1.0, label: "building (100m)"},
  // {size: 1000, scale: 1.0, label: "medium (1km)"},
  // {size: 10000, scale: 1.0, label: "city (10km)"},
  // https://www.scientificamerican.com/article/why-do-the-moon-and-the-s/#:~:text=Because%20the%20moon%20is%20changing,the%20moon%20appear%20very%20large.
  // TODO: make these use the res loader.
  {size: 3474000, scale: 1.0, label: "moon (3,474 Km)", grouped: false, nogroupOffset: -384400000, image: 'prodHqAssets/planetImg/Moon_lroc_color_poles_8k.jpg'},
  {size: 12742000, scale: 1.0, label: "earth (12,742 km)", grouped: false, nogroupOffset: 0, image: 'prodHqAssets/planetImg/Land_ocean_ice_cloud_hires.jpg'},
  {size: 1392700000, scale: 1.0, label: "sun (1,392,700 km)", brightness: 10, grouped: false, nogroupOffset: 149540000000, image: 'prodHqAssets/planetImg/sun_euvi_aia304_2012_carrington.jpg'},
  // {size: 3474000, scale: 1.0, label: "moon (3,474 Km)", grouped: false, nogroupOffset: 384400000, image: 'potatoLqAssets/planetImg/Moon_lroc_color_poles_8k.jpg'},
  // {size: 12742000, scale: 1.0, label: "earth (12,742 km)", grouped: false, nogroupOffset: 0, image: 'potatoLqAssets/planetImg/Land_ocean_ice_cloud_hires.jpg'},
  // {size: 1392700000, scale: 1.0, label: "sun (1,392,700 km)", brightness: 10, grouped: false, nogroupOffset: -149540000000, image: 'potatoLqAssets/planetImg/sun_euvi_aia304_2012_carrington.jpg'},
  {size: 7.47e12, scale: 1.0, label: "solar system (50Au)"},
  {size: 9.4605284e15, scale: 1.0, label: "gargantuan (1 light year)"},
  {size: 3.08567758e16, scale: 1.0, label: "ludicrous (1 parsec)"},
  {size: 1e19, scale: 1.0, label: "mind boggling (1000 light years)"}
];

// bookm
// function register() {
//   core.registerScene({
//     name: 'localCluster',
//     init,
//   });
// }

function init({ font }) {
  const scene = new THREE.Scene();
  // scene.add(new THREE.AmbientLight(0x222222));
  // const light = new THREE.DirectionalLight(0xffffff, 1);
  // light.position.set(100, 100, 100);
  // scene.add(light);

  // Massive space bodies part below.
  const geometry = new THREE.SphereBufferGeometry(0.5, 24*10, 12*10);

  // var data = generateHeight( 1024, 1024 );
  // var texture = new THREE.Texture( generateTexture( data, 1024, 1024 ) );
  // texture.needsUpdate = true;

  for (let i = 0; i < labelData.length; i++) {
    const body = labelData[i];
    const scale = body.scale || 1;

    const materialArgs = {
      color: 0xffffff,
      specular: 0x050505,
      shininess: 50,
      emissive: 0x000000,
      emissiveIntensity: body.brightness ? body.brightness : 1,
    };

    const labelGeo = new TextGeometry(body.label, {
      font: font,
      size: body.size,
      height: body.size / 2
    });

    labelGeo.computeBoundingSphere();

    // center text
    labelGeo.translate(-labelGeo.boundingSphere.radius, 0, 0);

    const group = new THREE.Group();
    group.position.z = -body.size * scale;
    scene.add(group);

    materialArgs.color = new THREE.Color().setHSL(Math.random(), 0.5, 0.5);
    const material = new THREE.MeshPhongMaterial(materialArgs);

    const textMesh = new THREE.Mesh(labelGeo, material);
    textMesh.scale.set(scale, scale, scale);
    textMesh.position.z = -body.size * scale;
    textMesh.position.y = body.size / 4 * scale;
    if (body.grouped !== false) {
      group.add(textMesh);
    }

    // console.log(`[z] ${body.label}:`, -body.size * scale);

    if (body.image) {
      const loader = new THREE.TextureLoader();
      loader.load( body.image, function ( texture ) {

        // var plane = new THREE.SphereGeometry(4096, 64, 64);
        // for ( var i = 0, l = plane.vertices.length; i < l; i ++ ) {
        //   var x = i % quality, y = ~~ ( i / quality );
        //   //plane.vertices[ i ].y = data[ ( x * step ) + ( y * step ) * 1024 ] * 2 - 128;
        //   // changing points randomly instead of reading off of a height map
        //   plane.vertices[ i ].x += Math.floor((Math.random()*50)+1) - 25;
        //   plane.vertices[ i ].y += Math.floor((Math.random()*100)+1) - 50;
        //   plane.vertices[ i ].z += Math.floor((Math.random()*50)+1) - 25;
        // }
        // // plane.computeCentroids();
        // plane.computeFaceNormals();

        const material = new THREE.MeshBasicMaterial({map: texture});
        // const material = new THREE.MeshPhongMaterial({map: texture});
        const mesh = new THREE.Mesh(geometry, material);
        // mesh.castShadow = true;
        mesh.receiveShadow = true;

        // const mesh = new THREE.Mesh(plane, material);
        // mesh.position.y = -body.size / 4 * scale;

        if (body.grouped === false) {
          mesh.scale.multiplyScalar(body.size * scale);
          // mesh.updateMatrix();
          mesh.position.x = body.nogroupOffset;
          scene.add(mesh);
        }
        else {
          // mesh.scale.multiplyScalar(body.size * scale);
          // group.add(mesh);
        }
      });
    }
    else {
      const dotMesh = new THREE.Mesh(geometry, material);
      dotMesh.position.y = -body.size / 4 * scale;
      dotMesh.scale.multiplyScalar(body.size * scale);

      if (body.grouped !== false) {
        group.add(dotMesh);
      }
    }
  }

  return scene;
}

// TODO: figure out wtf is going on here.
//  So, very simply: 3000 cubes @ 4 verts each = 12,000 verts = 11fps on an RTX 2080TI.
//  Or, add a compressed gltf scene from blender with 2 million verts - 60 fps constant. wut..?
//  The real confusing part here is the actual resource usage - CPU 10%, GPU 20%, RAM 50%. I.e system
//  not being utilised.
// startupEmitter.on(startupEvent.ready, () => {
//   const objects = generateCubeField({
//     scene: $game.scene,
//     position: $game.camera.position,
//   });
//   console.log('cube space:', objects);
// });

// startupEmitter.on(startupEvent.ready, () => {
//   const objects = generateCubeField({
//     scene: $game.scene,
//     position: $game.camera.position,
//     cubeCount: 25,
//     distanceMultiplier: 0.5
//   });
// });

// startupEmitter.on(startupEvent.ready, () => {
// const objects = generateCubeField({
//   scene: $game.scene,
//   position: $game.camera.position,
//   cubeCount: 100,
// });
// console.log('cube space:', objects);
// });

const definition = {
  init,
  // register,
};

export default definition;

// export {
//   // name: 'localCluster',
//   init,
//   register,
// }
