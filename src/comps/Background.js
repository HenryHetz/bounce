import { Scale } from 'phaser'

export class Background {
  constructor(scene) {
    this.scene = scene
    this.duration = scene.duration
    this.startX = 320
    this.startY = 0
    this.scale = 1.0
    this.alpha = 1.0

    this.bg = scene.add
      .image(this.startX, this.startY, 'main_bg')
      // .setOrigin(0)
      .setOrigin(0.5, 0)
      .setAlpha(this.alpha)
      .setScale(this.scale)
    // .setDepth(-10)

    this.createEvents()
  }
  createEvents() {
    this.scene.events.on('gameEvent', (data) => {
      this.handleEvent(data)
    })
    this.shake = this.scene.tweens.add({
      targets: this.bg,
      scale: { from: 1, to: 1.02 },
      // y: this.startY + 10,
      yoyo: true,
      // repeat: -1,
      ease: 'Sine.easeInOut',
      duration: 50,
      paused: true,
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
      if (data.multiplier >= 1) {
        // this.bg.alpha = this.alpha - data.count / 200
      }
    }
    if (data.mode === 'FINISH') {
      this.stop()
      this.bg.alpha = this.alpha
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
