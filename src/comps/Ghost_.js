'use strict'

class Ghost extends Phaser.GameObjects.Image {
  constructor(scene, x, y, sprite, frame) {
    super(scene, x, y, sprite, frame)
    this.scene.add.existing(this)
    // this.scene.physics.add.existing(this);
    // this.body.enable = true;
    this.init()
    this.create()
    this.scene.events.on('update', this.update, this)
  }
  static generateData(scene) {
    let x = 100 // в зависимости от ширины спрайта облака
    let y = scene.rnd.between(150, 500) // половина высоты спрайта облака минимум
    // let y = 500;
    let id = scene.rnd.between(1, 7) // рандом для картинки облака из атласа - как получить их кол-во?
    return { x, y, id }
  }
  static generate(scene) {
    let data = Ghost.generateData(scene)
    // return new Ghost(scene, data.x, data.y, 'ghost', 'ghost' + data.id)
    return new Ghost(scene, data.x, data.y, 'ghost')
    // this.move(this.ghost)
  }
  init() {
    this.alpha = 1
    this.flipX = this.scene.rnd.between(0, 1) // отзеркаливаем облака рандомно для разнообразия
    this.velocity = this.scene.rnd.between(
      this.scene.wind,
      this.scene.wind + 80
    )
    this.velocity = 10
    console.log('ghost velocity', this.velocity)
    // prod
    // this.depth = 1;
    this.coinDropPointCreator()
    // this.scene.events.on('update', this.update, this);
  }
  create() {
    this.path = new Phaser.Curves.Spline([
      100, 300, 150, 270, 120, 240, 180, 220, 140, 200,
    ])

    // Добавим Rope
    this.rope = this.scene.add.rope(320, 330, 'volume_bar', null, 64)
    // .setRotation(1.7)

    this.t = 0
  }
  reset() {
    // console.log('ghost reset');
    let data = Ghost.generateData(this.scene)
    this.x = data.x
    this.y = data.y
    // this.setTexture('ghost', 'ghost' + data.id)
    this.setAlive(true)
    this.init()
    // console.log('coin reset', this.texture, this.width);
  }
  coinDropPointCreator() {
    // точка падения монетки
    if (this.scene.coinCount > 0) {
      this.coinDropPoint = this.scene.rnd.between(
        40,
        this.scene.game.config.width - 60
      )
    } else {
      // первую монету нужно кидать по центру
      this.coinDropPoint = this.scene.game.config.width / 2
    }
    // this.coinDropPoint = this.scene.game.config.width - 50; // dev
    // console.log('coinDropPoint', this.coinDropPoint);
  }
  update(time, delta) {
    if (!this.active) return

    this.count += 0.1

    let points = this.rope.points

    for (let i = 0; i < points.length; i++) {
      points[i].y = Math.sin(i * 0.15 + this.count) * 24
    }

    this.rope.setDirty()
  }

  setAlive(status) {
    console.log('ghost setAlive', status)
    this.setVisible(status)
    this.setActive(status)
  }
  move(ghost) {
    // this.body.velocity = this.velocity // old
    // console.log('ghost move', ghost)
    // ghost.t = 0
    // let x = ghost.x
    // let y = ghost.y
    // let path = new Phaser.Curves.Path(x, y)
    // path.splineTo([
    //   { x: x + 20, y: y - 20 },
    //   { x: x - 20, y: y - 40 },
    //   { x: x + 10, y: y - 60 },
    // ])
    // this.scene.tweens.add({
    //   targets: ghost,
    //   t: 1,
    //   duration: 5000,
    //   ease: 'Sine.easeInOut',
    //   onUpdate: function (tween, target) {
    //     let point = path.getPoint(target.t)
    //     // console.log('point', target.t, point)
    //     ghost.setPosition(point.x, point.y)
    //   },
    // })
  }
}

export default Ghost
