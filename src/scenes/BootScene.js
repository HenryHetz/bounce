'use strict'

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot')
  }
  preload() {
    this.load.image('boot_bg', 'assets/sprites/bg/kb_boot_0.png') // вывести заставку
    // this.load.image('main_bg', 'assets/sprites/bg/bg_8.png')
  }
  create() {
    // this.add.image(0, 0, 'boot_bg').setOrigin(0);
    this.scene.start('Preload')
  }
}
