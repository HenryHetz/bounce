'use strict'

export class Ghost extends Phaser.GameObjects.Image {
  constructor(scene) {
    super(scene)
    this.scene.add.existing(this)

    this.init()
    this.create()
    this.scene.events.on('update', this.update, this)
  }
  init() {}
  create() {
    let y = this.scene.rnd.between(300, 700)
    let x = this.scene.rnd.between(100, 540)
    let alpha = this.scene.rnd.between(0.05, 0.2)

    this.ghost = this.scene.add
      .rope(x, y, 'ghost', null, 64, true)
      .setRotation(-1.6)
      .setScale(0.3)
      .setAlpha(alpha)
      .setActive(1)
    this.ropeCount = 0

    this.move()
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

  update(time, delta) {
    if (!this.active) return
    this.ropeCount += 0.01 // скорость изгибов? - fix
    const curve = 0.1 // fix
    const amplitude = 20 // 10 - 20
    const up = 1 // 0.5 - 1
    const points = this.ghost.points
    // console.log('points1', points[0], points[points.length - 1])
    for (let i = 0; i < points.length; i++) {
      points[i].y = Math.sin(i * curve + this.ropeCount) * amplitude
      points[i].x += up
      if (points[i].x >= 2000) {
        // console.log('points1', points[i].x)
        points[i].x -= 2000
        // console.log('points2', points[i].x)
      }
    }
    // console.log('points2', points)
    this.ghost.setDirty()
  }

  setAlive(status) {
    console.log('ghost setAlive', status)
    this.setVisible(status)
    this.setActive(status)
  }
  move() {
    this.scene.tweens.add({
      targets: this.ghost,
      alpha: 0.4,
      duration: 5000,
      yoyo: true,
      repeat: 4,
      onComplete: () => {
        // this.ghost.x = 200
        // this.ghost.y = 600
        // this.ghost.alpha = 0
      },
    })
  }
}

// export default Ghost
