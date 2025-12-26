export class MoneyCounter {
  constructor(scene, initial = 0) {
    this.scene = scene
    this.x = 625
    this.y = 50

    this.label = scene.add
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
        this.set(data.deposit)
      }
      if (data.mode === 'BET') {
        this.set(data.deposit)
      }
    })
  }

  set(value) {
    // проверка на NaN нужна, чтобы избежать ошибок
    if (isNaN(value)) {
      console.warn('Invalid value for MoneyCounter:', value)
      return
    }
    this.label.setText(value.toFixed(2))
  }
}
