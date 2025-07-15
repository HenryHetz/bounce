export class Background {
  constructor(scene) {
    this.scene = scene
    this.duration = scene.duration

    this.bg = scene.add
      .image(0, -100, 'main_bg')
      .setOrigin(0)
      .setAlpha(1)
      .setScale(1)
  }

  move() {
    this.moveTween = this.scene.tweens.add({
      targets: this.bg,
      x: this.bg.x - this.bg.width + 640,
      duration: this.duration * 2 * 100,
    })
  }

  stop() {
    if (this.moveTween) this.moveTween.stop()
    this.scene.tweens.add({
      targets: this.bg,
      x: 0,
      duration: 0,
      delay: 3000,
    })
  }
}
