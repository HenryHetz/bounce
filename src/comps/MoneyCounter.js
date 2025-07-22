export class MoneyCounter {
  constructor(scene, initial = 0) {
    this.scene = scene
    this.x = 450
    this.y = 40

    this.label = scene.add
      .text(this.x, this.y, initial.toFixed(2), {
        font: '24px walibi',
        fill: 'white',
      })
      .setOrigin(0, 0.5)
      .setAlign('left')
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
