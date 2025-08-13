export class Ball {
  constructor(scene, emitter, bounceHandler) {
    this.scene = scene
    this.x = this.scene.ballX
    this.y = this.scene.ballY
    this.diameter = 80
    this.color = 0xff0000 // красный цвет
    this.distanceY = scene.distanceY
    this.gridUnit = scene.gridUnit
    this.duration = scene.duration
    this.emitter = emitter
    this.bounceHandler = bounceHandler
    this.depth = 10

    // this.ball = scene.add
    //   .image(this.x, this.y, 'ball')
    //   .setOrigin(0.5, 1)
    //   .setScale(0.8)
    //   .setAlpha(0)

    this.ball = scene.add
      .ellipse(this.x, this.y, this.diameter, this.diameter, this.color)
      .setOrigin(0.5, 1)
      .setAlpha(0)
      .setDepth(this.depth)

    this.bounceTween = null

    this.createEvents()
    this.createEffects()
  }
  createEffects() {
    // Создаем emitter на старте сцены
    this.ballTrailEmitter = this.scene.add.particles(
      0,
      0,
      'red', // Твоя текстура трейла
      {
        follow: this.ball, // Привязываем к шару!
        speed: { min: 10, max: 100 },
        // angle: { min: 1800, max: 3600 },
        // x: { min: -100, max: 100 },
        lifespan: 1000,
        alpha: { start: 0.5, end: 0 },
        scale: { start: 5, end: 0 },
        quantity: 1,
        frequency: 25,
        blendMode: 'ADD',
        emitting: false,
      }
    )
    // старый эмиттер в пигги
    // this.tail = this.scene.add.particles('red');
    // this.tailEmitter = this.tail.createEmitter({
    //   speed: { min: 10, max: 50 },
    //   lifespan: 3000,
    //   gravityY: -50,
    //   quantity: 1,
    //   // scale: { start: 0.6, end: 0, ease: 'Power3' }, // большой размер частиц
    //   scale: { start: 2, end: 0, ease: 'Power3' }, // малый размер частиц
    //   blendMode: 'ADD', // ADD, COLOR_DODGE,
    //   active: true,
    // });
    // пульсация
    this.pulseTween = this.scene.tweens.add({
      targets: this.ball,
      scale: { from: 1, to: 1.05 },
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      duration: 50,
      paused: true,
    })
    // свечение
  }
  updateEffects(multiplier) {
    // console.log('updateEffects', multiplier)
    if (
      multiplier >= this.scene.smallShakeX &&
      !this.ballTrailEmitter.emitting
    ) {
      this.ballTrailEmitter.emitting = true
      // this.pulseTween.resume()
    }
    if (multiplier >= this.scene.medShakeX && this.pulseTween.paused) {
      console.log('updateEffects pulseTween')
      this.pulseTween.resume()
    }
  }
  update() {
    // console.log('ball update')
    // this.ballTrailEmitter.setPosition(this.ball.x, this.ball.y)
  }
  createEvents() {
    this.scene.events.on('gameEvent', (data) => {
      this.handleEvent(data)
    })
    this.scene.events.on('update', this.update, this)
  }
  handleEvent(data) {
    if (data.mode === 'COUNTDOWN') {
    }
    if (data.mode === 'ROUND_PREPARE') {
      this.reset()
    }
    if (data.mode === 'ROUND') {
      this.fall(this.bounceHandler)
    }
    if (data.mode === 'BOUNCE') {
      this.bounce(this.bounceHandler)
      this.updateEffects(data.multiplier)
    }
    if (data.mode === 'FINISH') {
      this.stop()
    }
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
    // dev
    this.ballTrailEmitter.emitting = false
    if (this.pulseTween) this.pulseTween.pause()
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
