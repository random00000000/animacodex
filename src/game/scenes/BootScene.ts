import Phaser from "phaser";

import { battleBackdropManifest, creaturePortraitManifest, sceneArtManifest } from "../data/assets";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
  }

  preload() {
    // The current slice is small enough to load up front, which keeps battle transitions from opening on blank art.
    for (const [key, url] of Object.entries(sceneArtManifest)) {
      this.load.image(key, url);
    }

    for (const [key, url] of Object.entries(battleBackdropManifest)) {
      this.load.image(key, url);
    }

    for (const [key, url] of Object.entries(creaturePortraitManifest)) {
      this.load.image(key, url);
    }
  }

  create() {
    this.scene.start("world");
  }
}
