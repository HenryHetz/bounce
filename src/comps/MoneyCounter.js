export class MoneyCounter {
  constructor(scene, initial = 0) {
    this.scene = scene
    this.currentValue = initial
    this.x = 625
    this.y = 44

    this.counter = scene.add
      .text(this.x, this.y, initial.toFixed(2), {
        // font: '24px walibi',
        // fill: 'white',
        fontFamily: 'JapanRobot',
        fontSize: '24px',
        fill: scene.textColors.red,
        // stroke: this.textColors.white,
        // strokeThickness: 6
      })
      .setOrigin(1, 0.5)
      .setAlign('right')
      .setAlpha(1)
      .setDepth(210)

    this.createEvents()
  }

  createEvents() {
    this.scene.events.on('gameEvent', (data) => {
      if (data.mode === 'CASHOUT') {
        this.change(data.deposit, true)
      }
      if (data.mode === 'BET') {
        this.change(data.deposit, false)
      }
    })
  }

  change(value, isCashout = false) {
    // проверка на NaN нужна, чтобы избежать ошибок
    if (isNaN(value)) {
      console.warn('Invalid value for MoneyCounter:', value)
      return
    }

    const from = this.currentValue
    const to = value
    this.currentValue = value

    if (isCashout) {
      this.scene.tweens.add({
        targets: { v: from },
        v: to,
        duration: 1000,
        ease: 'Sine.easeOut',
        onUpdate: (tw, obj) => {
          // const val = obj.v;      // или fixed(2) для X
          // const text = val >= 1000 ? val.toFixed(0) : val >= 100 ? val.toFixed(1) : val.toFixed(2)
          // const value = obj.v.toFixed(2)
          this.set(obj.v)
        },
        onComplete: () => {
          this.set(to)
        }
      })
    } else this.set(this.currentValue)

  }

  set(value) {
    this.counter.setText(value.toFixed(2))
  }
}
