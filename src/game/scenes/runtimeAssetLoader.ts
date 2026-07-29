import Phaser from "phaser";
import {
  battleBackdropManifest,
  creaturePortraitManifest,
  sceneArtManifest,
  type BattleBackdropKey,
  type CreaturePortraitKey,
  type SceneArtKey,
} from "../data/assets";

const pendingTextureLoads = new Set<string>();
const pendingCallbacks = new Map<string, Array<() => void>>();
const pendingRetries = new Set<string>();

const queueCallback = (key: string, callback?: () => void) => {
  if (!callback) {
    return;
  }

  const callbacks = pendingCallbacks.get(key) ?? [];
  callbacks.push(callback);
  pendingCallbacks.set(key, callbacks);
};

const flushCallbacks = (key: string) => {
  pendingTextureLoads.delete(key);
  pendingRetries.delete(key);
  const callbacks = pendingCallbacks.get(key) ?? [];
  pendingCallbacks.delete(key);

  for (const callback of callbacks) {
    callback();
  }
};

const isTextureUsable = (scene: Phaser.Scene, key: string) => {
  if (!scene.textures.exists(key)) {
    return false;
  }
  const texture = scene.textures.get(key) as Phaser.Textures.Texture | undefined;
  return Boolean(texture && texture.key === key && texture.source?.[0]);
};

const ensureTextureLoaded = (
  scene: Phaser.Scene,
  key: string,
  url: string,
  onLoaded?: () => void,
) => {
  if (isTextureUsable(scene, key)) {
    onLoaded?.();
    return;
  }

  if (scene.textures.exists(key)) {
    scene.textures.remove(key);
  }

  queueCallback(key, onLoaded);
  if (pendingTextureLoads.has(key)) {
    if (!pendingRetries.has(key)) {
      pendingRetries.add(key);
      scene.time.delayedCall(750, () => {
        pendingRetries.delete(key);
        if (scene.textures.exists(key) || !pendingTextureLoads.has(key)) {
          return;
        }
        pendingTextureLoads.delete(key);
        ensureTextureLoaded(scene, key, url);
      });
    }
    return;
  }

  pendingTextureLoads.add(key);

  const startLoad = () => {
    if (isTextureUsable(scene, key)) {
      flushCallbacks(key);
      return;
    }

    if (scene.load.isLoading()) {
      scene.load.once(Phaser.Loader.Events.COMPLETE, startLoad);
      return;
    }

    scene.load.image(key, url);
    scene.load.once(Phaser.Loader.Events.COMPLETE, () => flushCallbacks(key));
    scene.load.once(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
      if (file.key === key) {
        flushCallbacks(key);
      }
    });
    scene.load.start();
  };

  startLoad();
};

export const ensureSceneArtLoaded = (
  scene: Phaser.Scene,
  key: SceneArtKey,
  onLoaded?: () => void,
) => ensureTextureLoaded(scene, key, sceneArtManifest[key], onLoaded);

export const ensureBattleBackdropLoaded = (
  scene: Phaser.Scene,
  key: BattleBackdropKey,
  onLoaded?: () => void,
) => ensureTextureLoaded(scene, key, battleBackdropManifest[key], onLoaded);

export const ensureCreaturePortraitLoaded = (
  scene: Phaser.Scene,
  key: CreaturePortraitKey,
  onLoaded?: () => void,
) => ensureTextureLoaded(scene, key, creaturePortraitManifest[key], onLoaded);
