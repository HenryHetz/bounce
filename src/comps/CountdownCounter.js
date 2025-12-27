import { Scale } from "phaser"

export class CountdownCounter {
  constructor(scene) {
    this.scene = scene
    this.x = this.scene.sceneCenterX
    this.y = 420 // 600

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
    })
    this.scene.events.on('gameEvent', (data) => {
      if (data.mode === 'BOUNCE') {
        this.setNextMulty(data.count)
      }
    })
  }
  setNextMulty(step) {
    let text = ''
    const table = this.scene.logicCenter.getCrashTable()
    const row = table[step + 1] // следующий шаг
    if (!row) {
      console.warn('No row found for step:', step)
      return
    }
    // console.log('setNextMulty step:', step, 'row:', row)

    const m = row.multiplier
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

    // dev
    return
    const from = table[step].multiplier   // текущее число
    const to = table[step + 1].multiplier    // новое число

    if (this.counter.alpha === 0) this.show(1)

    this.scene.tweens.add({
      targets: { v: from },
      v: to,
      duration: 100,
      ease: 'Sine.easeOut',
      onUpdate: (tw, obj) => {
        const val = obj.v;      // или fixed(2) для X
        const text = val >= 1000 ? val.toFixed(0) : val >= 100 ? val.toFixed(1) : val.toFixed(2)
        this.set(text)
      },
      onComplete: () => {
        const text = to >= 1000 ? to.toFixed(0) : to >= 100 ? to.toFixed(1) : to.toFixed(2)
        this.set(text)
      }
    });
  }
  set(value) {
    this.counter.setText(value)
  }
  show(value) {
    this.counter.setAlpha(value)
  }
}
