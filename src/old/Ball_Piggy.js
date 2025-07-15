'use strict'

export default class Ball extends Phaser.GameObjects.Image {
  constructor(scene, x, y, sprite, texture, value) {
    super(scene, x, y, sprite, texture, value)
    this.value = value
    this.setDepth(this.scene.depthValue.coins)
    // this.sys.physicsManager = this.physics.world;
    this.init()
    this.scene.events.on('update', this.update, this)
  }
  static generate(scene, x, y) {
    // console.log(scene);
    // здесь определять номинал и спрайт
    // let value = scene.coinsValue[Phaser.Math.Between(0, scene.coinsValue.length - 1)];
    let value = scene.rnd.pick(scene.coinsValue)
    return new Coin(scene, x, y, 'game', 'coin' + value, value) // выводить монетку по номиналу из атласа
  }
  init() {
    this.scene.add.existing(this)
    this.scene.physics.add.existing(this)
    // console.log(this);
    this.x += this.body.halfWidth
    this.y += this.body.height
    // this.depth = 2;
    this.isBall = true
    this.body.enable = true
    this.path = undefined
    // можно утилизировать по факту падения на землю
    this.particles = this.scene.add.particles('yellow')
    this.emitter = this.particles.createEmitter({
      speed: 500,
      lifespan: 500, // продолжительность жизни
      // scale: { start: 0.5, end: 0 }, // большие частицы
      scale: { start: 2, end: 0 }, // маленькие частицы
      blendMode: 'ADD',
      on: false,
    })
  }
  reset(x, y) {
    // console.log('coin reset');
    this.x = x + this.body.halfWidth
    this.y = y + this.body.height
    this.value = this.scene.rnd.pick(this.scene.coinsValue)
    this.setTexture('game', 'coin' + this.value)
    this.setScale(1)
    this.setAlive(true)
    this.body.setVelocityY(0)
    // console.log('coin reset', this.texture, this.width);
  }
  update() {
    if (!this.scene) return
    // console.log('coin update', this.body.velocity.x);
    if (this.active && this.y >= 400 && this.scene.isMagnet) {
      // && !this.path
      // проверяем на магнит

      let deltaX = this.scene.piggy.x - this.x
      if (deltaX < 0) deltaX = -deltaX
      // console.log('deltaX', deltaX);
      let deltaY = this.scene.piggy.y - this.scene.piggy.height / 2 - this.y
      // console.log('deltaY', deltaY);
      let speedX = deltaX - deltaY
      // console.log('speedX', speedX);
      if (speedX < 0) speedX = 0
      if (this.scene.piggy.x - this.x < 0) speedX = -speedX
      // console.log('speedX', speedX);
      this.body.setVelocityX(speedX * 2)
    }
    if (
      this.active &&
      this.y >= 760 - this.height / 2 &&
      this.body.velocity.y > 0
    ) {
      // монета упала на землю
      if (this.scene.isBall && this.isBall) this.makeBounce()
      else this.dropCoin()
    }
  }
  makeBounce() {
    // делаем отскок
    this.body.setVelocityY(-1) // замереть
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.2,
      scaleY: 0.8,
      ease: 'Linear',
      duration: 50,
      onComplete: () => {
        // this.setAlive(false);
        if (!this.body) return
        if (!this.body.enable) return
        this.scale = 1
        this.body.setVelocityY(-450)
        this.scene.sounds.coinBounce.play()
        // this.isBall = false;
      },
    })
  }
  dropCoin() {
    // console.log('coin dropCoin', this.x);
    this.body.enable = false
    this.setActive(false)
    this.scene.dropCoin()
    this.particles.emitParticleAt(this.x, this.y, 30)
    this.scene.camera.shake(50, 0.005)
    this.scene.coinsRowCheck({ value: this.value, catch: false })
    this.setAlive(false)
  }
  catchCoin(piggy) {
    // console.log('coin catchCoin');
    this.body.enable = false
    this.scene.tweens.add({
      targets: this,
      x: piggy.x,
      y: piggy.y - piggy.height / 2,
      scale: 0.2,
      ease: 'Linear',
      duration: 50,
      onComplete: () => {
        // this.setAlive(false);
        this.destroy(true)
      },
    })
    this.scene.coinsRowCheck({ value: this.value, catch: true })
  }
  setAlive(status) {
    // if (!status) this.destroy();
    this.body.enable = status
    this.setVisible(status)
    this.setActive(status)
    // console.log('coins body', this.body);
    if (!status) this.destroy()
  }
}

// движение по пути
// this.path = this.scene.add.path();
// let curve = new Phaser.Curves.QuadraticBezier([
//         this.x,
//         this.y,
//         this.x,
//         // this.scene.piggy.y,
//         this.y + (this.scene.piggy.y - this.y) / 1.4,
//         this.scene.piggy.x,
//         this.scene.piggy.y - this.scene.piggy.height / 2,
// ]);

// this.path.add(curve);
// // console.log('path', this.path);
// let graphics = this.scene.add.graphics({
//         lineStyle: {
//                 width: 1,
//                 color: 0xffffff,
//                 alpha: 1,
//         },
//         add: true,
// });
// this.path.draw(graphics);
