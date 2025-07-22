export class Background {
  constructor(scene) {
    this.scene = scene
    this.duration = scene.duration
    this.startX = 0

    this.bg = scene.add
      .image(this.startX, 80, 'main_bg')
      .setOrigin(0)
      .setAlpha(1)
      .setScale(1)
  }

  move() {
    // gorizontal
    this.moveTween = this.scene.tweens.add({
      targets: this.bg,
      x: this.bg.x - this.bg.width + 640,
      duration: this.duration * 2 * 100,
    })
    // vertical move
    // this.moveTween = this.scene.tweens.add({
    //   targets: this.bg,
    //   y: 400,
    //   duration: this.duration * 2 * 100,
    // })
  }

  stop() {
    if (this.moveTween) this.moveTween.stop()
    this.scene.tweens.add({
      targets: this.bg,
      x: this.startX,
      duration: 0,
      delay: 3000,
    })
  }
}
