'use strict'

export default class Star extends Phaser.GameObjects.Image {
  constructor(scene, x, y, sprite, texture) {
    super(scene, x, y, sprite, texture)
    this.scene.add.existing(this)
    this.scene.physics.add.existing(this)
    this.setDepth(this.scene.depthValue.stars)
    // this.body.enable = true;
    this.setTail()
    this.init()
    this.scene.events.on('update', this.update, this)
  }
  static generateData(scene) {
    let x = scene.rnd.between(0, scene.game.config.width)
    let y = scene.rnd.between(0, 100)
    return { x, y }
  }
  static generate(scene) {
    let data = Star.generateData(scene)
    return new Star(scene, data.x, data.y, 'game', 'star')
  }
  init() {
    // console.log('star init');
    this.scale = 0.1
    this.body.enable = true
    this.velocity = this.scene.game.config.width / 2 - this.x
    // console.log('this.tailEmitter', this.tailEmitter.on);
    if (!this.tailEmitter.on) this.tailEmitter.on = true
    this.tailEmitter.startFollow(this)
    this.scene.tweens.add({
      targets: this,
      scale: 0.6,
      ease: 'Linear',
      duration: 2000,
      onComplete: () => {},
    })
  }
  reset() {
    // console.log('star reset');
    let data = Star.generateData(this.scene)
    this.x = data.x
    this.y = data.y
    this.setAlive(true)
    this.body.setVelocityY(0)
    this.init()
  }
  setTail() {
    // console.log('star setTail');
    this.tail = this.scene.add.particles('yellow')
    this.tailEmitter = this.tail.createEmitter({
      speed: 1,
      // scale: { start: 0.6, end: 0 }, // большой размер yellow
      scale: { start: 2, end: 0 }, // малый размер yellow
      blendMode: 'ADD',
    })
    this.tail.setDepth(5)
  }
  update() {
    // console.log('star update', this.active, this.y);
    if (!this.active) return
    if (
      this.y >= this.scene.game.config.height ||
      this.x < 0 - this.width ||
      this.x > this.scene.game.config.width + this.width
    ) {
      // console.log('star update screen out');
      this.setAlive(false)
    }
  }
  catchStar(piggy) {
    // console.log('star catchStar');
    this.body.enable = false
    // надо придумать другую анимацию попадания звезды в хрюшу
    // магия с маленькими звёздочками через particles
    this.scene.tweens.add({
      targets: this,
      x: piggy.x,
      y: piggy.y - piggy.height / 2,
      scale: 0.2,
      ease: 'Linear',
      duration: 50,
      onComplete: () => {
        // this.tailEmitter.stop();
        this.setAlive(false)
      },
    })
  }
  setAlive(status) {
    this.body.enable = status
    this.setVisible(status)
    this.setActive(status)
    if (!status) this.tailEmitter.stop()

    // console.log('star', status, this.tailEmitter, this.tail);
  }
  move() {
    // console.log('move');
    this.body.setVelocityX(this.velocity)
  }
}
