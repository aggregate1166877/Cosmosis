// Project resource loader. Figures out file extensions on your behalf, which
// for example means you're allowed to use jpg for one image and png for
// another (useful for dev builds where the size needs to be kept to a
// minimum).
//
// First looks for assets in the production assets directory. If the requested
// asset does not exist, looks for the requested assets in the dev path
// instead. It's recommended the implemented run bootTest() when the
// application starts to look for obvious problems such as no production
// directory existing at all, indicating the user did a clone without obtaining
// the high quality assets.

import { fuzzyFindFile, forEachFn } from "./utils";

const devPath = 'potatoLqAssets';
const prodPath = 'prodHqAssets';

const cachedPaths = {};

const assetDefaults = {
  icons: {
    dir: 'icons',
    extensions: [ 'jpg', 'png', 'gif' ],
  },
  models: {
    dir: 'models',
    extensions: [ 'gltf' ],
  },
  music: {
    dir: 'music',
    extensions: [ 'mp3', 'ogg' ],
  },
  planetImg: {
    dir: 'planetImg',
    extensions: [ 'jpg', 'png', 'gif' ],
  },
  sfx: {
    dir: 'sfx',
    extensions: [ 'mp3', 'ogg' ],
  },
  // skyboxes: {
  //   dir: 'skyboxes',
  //   extensions: [ 'jpg', 'png', 'gif' ],
  // },
  spaceShips: {
    dir: 'spaceShips',
    extensions: [ 'gltf', 'glb' ],
    // Helps to make things 'just work' in dev builds, although doing this
    // should always generate an error indicating that assets are missing.
    placeholder: 'DS69F',
  },
  voicePacks: {
    dir: 'voicePacks',
    extensions: [ 'mp3', 'ogg' ],
  },
};

function getCache(dir, name) {
  if (cachedPaths[dir] && cachedPaths[dir][name]) {
    return cachedPaths[dir][name];
  }
}

function AssetFinder() {}

AssetFinder.prototype.getRes = function getRes(name, options={}, callback) {
  const { dir, extensions, placeholder } = options;

  const cache = getCache(dir, name);
  if (cache) {
    console.log('--> [AssetFinder.getRes] cached hit:', cache);
    return cache;
  }

  const dev = `${devPath}/${dir}`;
  const prod = `${prodPath}/${dir}`;

  // Look for resource in HQ dir. If not found, look in potato.
  forEachFn([
    (cb) => fuzzyFindFile({ name, extensions, path: prod, onFind: cb }),
    (cb) => fuzzyFindFile({ name, extensions, path: dev, onFind: cb }),
  ], (error, fileName, parentDir) => {
    if (!error) {
      // Return first file name found: this will be prod if exists, else dev.
      callback(error, fileName, parentDir);
      // Signal that we can stop looking.
      return false;
    }
  }, (error) => {
    if (error) {
      console.error('forEachFn onReachEnd error:', error)
    }
    else {
      let errorMessage = `No '${dir}' files found matching name: '${name}'.`
      if (placeholder) {
        errorMessage += ` Will instead try default placeholder '${placeholder}'.`;
        console.error(errorMessage);
        // Try once more with the default placeholder. Null it out to prevent
        // further attempts if it fails.
        const retryOpts = { ...options, placeholder: null };
        this.getRes(placeholder, retryOpts, callback);
      }
      else {
        console.error(errorMessage);
      }
    }
  });
};

AssetFinder.prototype.getIcon = function getIcon(name, callback=()=>{}) {
  this.getRes(name, assetDefaults.icons, callback);
};

AssetFinder.prototype.getModel = function getModel(name, callback=()=>{}) {
  this.getRes(name, assetDefaults.models, callback);
};

AssetFinder.prototype.getMusic = function getMusic(name, callback=()=>{}) {
  this.getRes(name, assetDefaults.music, callback);
};

AssetFinder.prototype.getPlanetImg = function getPlanetImg(name, callback=()=>{}) {
  this.getRes(name, assetDefaults.planetImg, callback);
};

AssetFinder.prototype.getSfx = function getSfx(name, callback=()=>{}) {
  this.getRes(name, assetDefaults.sfx, callback);
};

// AssetFinder.prototype.getSkybox = function getSkybox(name, callback=()=>{}) {
//   this.getRes(name, assetDefaults.skyboxes, callback);
// };

AssetFinder.prototype.getSpaceShip = function getSpaceShip(name, callback=()=>{}) {
  this.getRes(name, assetDefaults.spaceShips, callback);
};

AssetFinder.prototype.getVoiceFile = function getVoiceFile(name, callback=()=>{}) {
  this.getRes(name, assetDefaults.voicePacks, callback);
};

const finder = new AssetFinder();
export default finder;

// TODO: tests should ensure that some obvious results are sane. For example,
//  an image over 50kb is obviously a mistake, whereas a 500kb space ship is
//  normal. Tests should also check if the prod folder contains stuff that dev
//  doesn't; this indicates the user forgot to make a low quality version.
