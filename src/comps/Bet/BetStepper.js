// BetStepper.js
export class BetStepper {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} centerX
   * @param {number} y
   * @param {Array<number>} betValues
   * @param {function(number):void} onValueChange
   */
  constructor(scene, centerX, y, betValues, onValueChange) {
    this.scene = scene
    this.betValues = betValues
    // this.onValueChange = onValueChange
    this.currentIndex = 0
    this.isEnabled = true

    const spacing = scene.gridUnit * 2

    // MINUS button
    this.minusButton = scene.add
      .image(centerX - spacing, y, 'button_bet_minus')
      .setInteractive()
      .on('pointerdown', () => this.changeValue(-1))

    // PLUS button
    this.plusButton = scene.add
      .image(centerX + spacing, y, 'button_bet_plus')
      .setInteractive()
      .on('pointerdown', () => this.changeValue(1))
  }

  /**
   * Change value by delta
   * @param {number} delta
   */
  changeValue(delta) {
    if (!this.isEnabled) return

    const newIndex = Phaser.Math.Clamp(
      this.currentIndex + delta,
      0,
      this.betValues.length - 1
    )
    // console.log('BetStepper changeValue', this.currentIndex, newIndex)
    if (newIndex !== this.currentIndex) this.currentIndex = newIndex
    else return

    // if (this.onValueChange) {
    //   this.onValueChange(this.betValues[this.currentIndex])
    // }
    const betValue = this.betValues[this.currentIndex]
    // console.log('BetStepper changeValue', this.currentIndex, betValue)
    this.scene.events.emit('betChanged', betValue)
  }

  /**
   * Set value directly
   * @param {number} value
   */
  setValue(value) {
    const index = this.betValues.indexOf(value)
    if (index === -1) {
      console.warn('[BetStepper] Value not in betValues:', value)
      return
    }

    this.currentIndex = index
    if (this.onValueChange) {
      this.onValueChange(this.betValues[this.currentIndex])
    }
    // console.log('BetStepper setValue', value, this.currentIndex)
  }

  /**
   * Enable or disable buttons
   * @param {boolean} state
   */
  setEnabled(state) {
    this.isEnabled = state
    this.minusButton.setAlpha(state ? 1 : 0).setInteractive(state)
    this.plusButton.setAlpha(state ? 1 : 0).setInteractive(state)
  }
}
