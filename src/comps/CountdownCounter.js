export class CountdownCounter {
  constructor(scene) {
    this.scene = scene
    this.x = this.scene.sceneCenterX
    this.y = 480 // 600

    this.label = scene.add
      .text(this.x, this.y, '', {
        // font: '60px japan', // walibi
        fill: this.scene.textColors.red,
        fontFamily: 'JapanRobot',
        fontSize: '60px',
        fill: this.scene.textColors.black, // 
        stroke: this.scene.textColors.red,
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
  }
  set(value) {
    this.label.setText(value)
  }
  show(value) {
    this.label.setAlpha(value)
  }
}
