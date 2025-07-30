export class Slider {
  constructor(scene, x, y, name, minText, maxText) {
    this.scene = scene
    this.axis = 'x'

    this.imageBar = 'volume_bar'
    this.imageButton = 'slider_button'
    this.length = 300
    this.min = -this.length / 2
    this.max = this.length / 2

    this.container = scene.add.container(x, y)

    this.bar = scene.add.image(0, 0, this.imageBar)
    // .setRotation(Phaser.Math.DegToRad(90))

    this.button = scene.add.image(0, 0, this.imageButton).setInteractive()

    // .setRotation(Phaser.Math.DegToRad(90))
    this.text = scene.add
      .text(this.bar.x, this.bar.y - 30, name, {
        fontFamily: 'AvenirNextCondensedBold',
        fontSize: '24px',
        color: '#13469A',
      })
      .setOrigin(0.5)

    this.minText = scene.add
      .text(this.bar.x - this.length / 2 - 40, this.bar.y, minText, {
        // fontFamily: 'AvenirNextCondensedBold',
        fontFamily: 'AvenirNextCondensedBold',
        fontSize: '24px',
        color: 'yellow',
      })
      .setOrigin(1, 0.5)
    this.maxText = scene.add
      .text(this.bar.x + this.length / 2 + 40, this.bar.y, maxText, {
        // fontFamily: 'AvenirNextCondensedBold',
        fontFamily: 'AvenirNextCondensedBold',
        fontSize: '24px',
        color: 'yellow',
      })
      .setOrigin(0, 0.5)

    this.container.add([
      this.bar,
      this.text,
      this.button,
      this.minText,
      this.maxText,
    ])
  }
}
