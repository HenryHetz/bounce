'use strict'

export class Ghost extends Phaser.GameObjects.Image {
  constructor(scene) {
    super(scene)
    this.scene.add.existing(this)

    this.init()
    // this.create()
    this.createEvents()
  }
  createEvents() {
    this.scene.events.on('gameEvent', (data) => {
      if (
        data.mode === 'FINISH' &&
        !data.hasCashOut &&
        data.hasBet &&
        !this.active
      ) {
        const random = this.scene.rnd.between(0, 100)
        // console.log('ghost activate', random)
        if (random > 50) this.create()
      }
    })
    this.scene.events.on('update', this.update, this)
  }
  init() {
    this.setAlive(false)
  }
  create() {
    let y = this.scene.rnd.between(300, 700)
    let x = this.scene.rnd.between(100, 540)
    let alpha = this.scene.rnd.between(0.05, 0.2)

    this.ghost = this.scene.add
      .rope(x, y, 'ghost', null, 64, true)
      .setRotation(-1.6)
      .setScale(0.3)
      .setAlpha(0)
    // .setActive(0)
    this.ropeCount = 0

    this.activate()
  }
  activate() {
    this.setAlive(true)
    this.hide()
  }
  update(time, delta) {
    if (!this.active) return
    // console.log('ghost update')
    this.ropeCount += 0.01 // скорость изгибов? - fix
    const curve = 0.1 // fix
    const amplitude = 20 // 10 - 20
    const up = 1 // 0.5 - 1
    const points = this.ghost.points
    // console.log('points1', points[0], points[points.length - 1])
    for (let i = 0; i < points.length; i++) {
      points[i].y = Math.sin(i * curve + this.ropeCount) * amplitude
      points[i].x += up

      // dev
      // if (points[i].x >= 2000) {
      //   // console.log('points1', points[i].x)
      //   points[i].x -= 2000
      //   // console.log('points2', points[i].x)
      // }
    }
    // console.log('points2', points)
    this.ghost.setDirty()
  }

  setAlive(status) {
    // console.log('ghost setAlive', status)
    this.setVisible(status)
    this.setActive(status)
  }
  hide() {
    this.scene.tweens.add({
      targets: this.ghost,
      alpha: this.scene.rnd.between(0.1, 0.3),
      duration: this.scene.rnd.between(2000, 5000),
      delay: this.scene.rnd.between(200, 1000),
      yoyo: true,
      repeat: 0,
      onComplete: () => {
        this.setAlive(false)
        this.destroy()
      },
    })
  }
  destroy() {
    this.ghost.destroy()
  }
}
