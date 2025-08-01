import { Scale } from 'phaser'

export class Background {
  constructor(scene) {
    this.scene = scene
    this.duration = scene.duration
    // this.startX = 0
    // this.startY = -50
    this.startX = 420
    this.startY = 40
    this.scale = 1.15

    this.bg = scene.add
      .image(this.startX, this.startY, 'main_bg')
      // .setOrigin(0)
      .setOrigin(0.6, 0.1)
      .setAlpha(0.8)
      .setScale(this.scale)

    this.createEvents()
  }
  createEvents() {
    this.scene.events.on('gameEvent', (data) => {
      this.handleEvent(data)
    })
  }
  handleEvent(data) {
    if (data.mode === 'COUNTDOWN') {
      this.reset()
    }
    if (data.mode === 'ROUND_PREPARE') {
      // this.reset()
      // this.move()
    }
    if (data.mode === 'ROUND') {
      // this.move()
    }
    if (data.mode === 'BOUNCE') {
    }
    if (data.mode === 'FINISH') {
      this.stop()
    }
  }
  reset() {
    this.scene.tweens.add({
      targets: this.bg,
      x: this.startX,
      y: this.startY,
      scale: this.scale,
      duration: 3000,
      // delay: 3000,
    })
  }
  move() {
    // gorizontal
    // this.moveTween = this.scene.tweens.add({
    //   targets: this.bg,
    //   x: this.bg.x - this.bg.width + 640,
    //   duration: this.duration * 2 * 100,
    // })
    // vertical move
    this.moveTween = this.scene.tweens.add({
      targets: this.bg,
      y: 100,
      scale: 2,
      duration: this.duration * 2 * 100,
    })
  }

  stop() {
    if (this.moveTween) this.moveTween.stop()
    // this.scene.tweens.add({
    //   targets: this.bg,
    //   x: this.startX,
    //   duration: 0,
    //   delay: 3000,
    // })
  }
}
