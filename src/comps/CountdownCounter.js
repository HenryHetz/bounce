export class CountdownCounter {
  constructor(scene) {
    this.scene = scene
    this.x = this.scene.sceneCenterX
    this.y = 7 * this.scene.gridUnit

    this.label = scene.add
      .text(this.x, this.y, '', {
        font: '100px walibi',
        fill: 'red',
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
  }
  set(value) {
    this.label.setText(value)
  }
  show(value) {
    this.label.setAlpha(value)
  }
}
