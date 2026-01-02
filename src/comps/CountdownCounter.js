import { Scale } from "phaser"

export class CountdownCounter {
  constructor(scene) {
    this.scene = scene
    this.x = scene.sceneCenterX
    this.y = scene.hitPointY - 30 // 

    this.counter = scene.add
      .text(this.x, this.y, '', {
        // font: '60px japan', // walibi
        fill: this.scene.textColors.red,
        fontFamily: 'JapanRobot',
        fontSize: '60px',
        fill: this.scene.textColors.red, // black
        stroke: this.scene.textColors.black, // red
        strokeThickness: 8
      })
      .setOrigin(0.5)
      .setAlpha(0)

    this.createEvents()
  }

  createEvents() {
    this.scene.events.on('gameEvent', (data) => {
      if (data.mode === 'COUNTDOWN_UPDATE') {
        this.set(data.text)
        this.show(data.show)
      }

      if (data.mode === 'ROUND_PREPARE') {
        // console.log('ROUND_PREPARE',)
        // this.set(data.text)
        // this.show(data.show)
      }

      if (data.mode === 'HIT') {
        // console.log(data.count, 'nextMultiplier', data.nextMultiplier)
        this.setNextMulty(data.nextMultiplier)
      }

      if (data.mode === 'FINISH') {
        // console.log('ROUND_PREPARE',)
        // this.set('')
        // this.show(0)
      }
    })
    // this.scene.events.on('gameEvent', (data) => {
    //   if (data.mode === 'HIT') {
    //     console.log(data.count, 'nextMultiplier', data.nextMultiplier)
    //     this.setNextMulty(data.nextMultiplier)
    //   }
    // })
  }
  setNextMulty(m) {
    let text = ''
    if (!m) {
      this.set(text)
      this.show(0)
      return
    }
    text = m >= 1000 ? m.toFixed(0) : m >= 100 ? m.toFixed(1) : m.toFixed(2)

    if (this.counter.alpha === 0) this.show(1)

    this.scene.tweens.add({
      targets: this.counter,
      // alpha: 0,
      scaleX: 1.05,
      // delay: 1000,
      duration: 100,
      yoyo: true,
      onComplete: () => {
        this.set(text)
        this.counter.setScale(1)
      }
    })
  }
  set(value) {
    this.counter.setText(value)
  }
  show(value) {
    this.counter.setAlpha(value)
  }
}
