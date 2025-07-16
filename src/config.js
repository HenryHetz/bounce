import BootScene from './scenes/BootScene.js'
import PreloadScene from './scenes/PreloadScene.js'
// import MainMenuScene from './scenes/MainMenuScene.js'
import GameScene from './scenes/GameScene.js'

export default {
  type: Phaser.AUTO, // Можно AUTO, CANVAS, WEBGL
  width: 640,
  height: 1120,
  scale: {
    mode: Phaser.Scale.FIT,
    // autoCenter: Phaser.Scale.NO_CENTER,
  },
  // physics: {
  //   default: 'arcade',
  //   arcade: {
  //     gravity: { y: 2000 },
  //     debug: false,
  //   },
  // },
  render: {
    powerPreference: 'high-performance',
  },
  backgroundColor: 0x111111,
  scene: [BootScene, PreloadScene, GameScene],
}
