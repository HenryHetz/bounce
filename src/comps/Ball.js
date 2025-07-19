export class Ball {
  constructor(scene, emitter) {
    this.scene = scene
    this.x = this.scene.ballX
    this.y = this.scene.ballY
    this.diameter = 80
    this.color = 0xff0000 // красный цвет
    this.distanceY = scene.distanceY
    this.gridUnit = scene.gridUnit
    this.duration = scene.duration
    this.emitter = emitter

    // this.ball = scene.add
    //   .image(this.x, this.y, 'ball')
    //   .setOrigin(0.5, 1)
    //   .setScale(0.8)
    //   .setAlpha(0)

    this.ball = scene.add
      .ellipse(this.x, this.y, this.diameter, this.diameter, this.color)
      .setOrigin(0.5, 1)

    this.bounceTween = null
  }

  reset() {
    this.clearTint()
    this.ball.y = this.y
    this.scene.tweens.add({
      targets: this.ball,
      alpha: 1,
      duration: 3000,
    })
  }

  up() {
    this.scene.tweens.add({
      targets: this.ball,
      delay: 10,
      alpha: 0,
      duration: 0,
      onComplete: () => {
        this.scene.tweens.add({
          targets: this.ball,
          delay: 1000,
          y: this.y,
          duration: 0,
        })
      },
    })
  }
  fall(callback) {
    this.scene.tweens.add({
      targets: this.ball,
      y: this.y + this.distanceY,
      duration: this.duration,
      //   yoyo: true,
      ease: 'Sine.easeIn',
      onComplete: () => {
        if (callback) callback()
      },
    })
  }
  bounce(callback) {
    this.scene.tweens.add({
      targets: this.ball,
      y: this.y,
      duration: this.duration,
      yoyo: true,
      ease: 'Sine.easeOut',
      onYoyo: () => {},
      onComplete: () => {
        if (callback) callback()
      },
    })
  }
  stop() {
    if (this.bounceTween) this.bounceTween.stop()
    this.emitter.explode(30, this.ball.x, this.ball.y)
    this.up()
  }

  setBounceTween(tween) {
    this.bounceTween = tween
  }

  setTint(color) {
    // this.ball.setTint(color)
  }

  clearTint() {
    // this.ball.clearTint()
  }

  getX() {
    return this.ball.x
  }

  getY() {
    return this.ball.y
  }
}
