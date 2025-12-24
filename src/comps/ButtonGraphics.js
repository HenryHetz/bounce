export class ButtonGraphics extends Phaser.GameObjects.Graphics {
  constructor(scene, x, y, color) {
    super(scene, { x, y })
    this.scene = scene
    // console.log('ButtonGraphics', x, y, color)
    // Параметры по умолчанию
    const width = 240
    const height = 100
    const skew = 8
    const fillColor = this.colorStringToHex(color)
    // const fillColor = color
    const strokeColor = 'black'
    const strokeWidth = 3

    this.width = width
    this.height = height
    this.skew = skew

    // Рисуем кнопку
    this.lineStyle(strokeWidth, strokeColor, 1)
    this.fillStyle(fillColor, 1)

    this.beginPath()
    this.moveTo(-width / 2 + skew, -height / 2)
    this.lineTo(width / 2 - skew, -height / 2 - 5)
    this.lineTo(width / 2, height / 2)
    this.lineTo(-width / 2, height / 2)
    this.closePath()

    this.fillPath()
    this.strokePath()

    scene.add.existing(this)
  }
  enableHitbox() {
    this.setInteractive(
      new Phaser.Geom.Rectangle(
        -this.width / 2,
        -this.height / 2,
        this.width,
        this.height
      ),
      Phaser.Geom.Rectangle.Contains
    )
  }
  // если нужно обновлять цвет
  setColor(color) {
    // console.log('setColor', color)
    let fillColor = this.colorStringToHex(color)
    // if (color === 'red') fillColor = 0xff0000
    // if (color === 'black') fillColor = 0x000000
    // if (color === 'yellow') fillColor = 0xfdd41d
    this.clear()

    this.fillStyle(fillColor, 1)
    this.lineStyle(this.strokeWidth, this.strokeColor, 1)

    this.beginPath()
    this.moveTo(-this.width / 2 + this.skew, -this.height / 2)
    this.lineTo(this.width / 2 - this.skew, -this.height / 2 - 5)
    this.lineTo(this.width / 2, this.height / 2)
    this.lineTo(-this.width / 2, this.height / 2)
    this.closePath()

    this.fillPath()
    this.strokePath()
  }
  colorStringToHex(name) {
    const colors = {
      red: this.scene.standartColors.red,
      black: this.scene.standartColors.black,
      yellow: this.scene.standartColors.yellow,
      white: this.scene.standartColors.white,
      // green: 0x00ff00,
      // blue: 0x0000ff,
      // gray: 0x888888,
    }
    return colors[name] ?? 0xff0000 // красная по умолчанию
  }
}
