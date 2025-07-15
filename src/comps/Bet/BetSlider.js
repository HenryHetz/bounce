// BetSlider.js

import { Slider } from '../Slider'
import {
  getSliderValue,
  getDiscreteValue,
  setSliderValue,
} from '../RiskTuner/RiskTunerUtils'

export class BetSlider {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {Array<number>} betValues
   * @param {function(number):void} onValueChange
   */
  constructor(scene, x, y, betValues, onValueChange) {
    this.scene = scene
    this.betValues = betValues
    this.onValueChange = onValueChange
    this.previousValue = null
    this.isLocked = false

    // --- Slider
    this.slider = new Slider(
      scene,
      x,
      y,
      '',
      String(betValues[0]),
      String(betValues[betValues.length - 1])
    )

    // --- Draggable
    this.scene.input.setDraggable(this.slider.button)
    this.scene.input.on('drag', this.handleDrag, this)
  }

  handleDrag(pointer, gameObject) {
    if (gameObject !== this.slider.button) return
    if (this.isLocked) return

    const local = this.slider.container.getLocalPoint(pointer.x, pointer.y)
    this.slider.button.x = Phaser.Math.Clamp(
      local.x,
      this.slider.min,
      this.slider.max
    )

    const norm = getSliderValue(this.slider)
    const discreteValue = getDiscreteValue(this.betValues, norm)

    if (this.previousValue !== discreteValue) {
      this.previousValue = discreteValue
      this.onValueChange(discreteValue)
    }
  }
  setActive(state) {
    this.slider.button.setVisible(state)
    this.slider.button.setInteractive(state)
    this.isLocked = !state

    if (!state) {
      if (this.scene.input.stopDrag) {
        this.scene.input.stopDrag(this.slider.button)
      } else {
        this.scene.input.setDraggable(this.slider.button, false)
      }
    } else {
      this.scene.input.setDraggable(this.slider.button, true)
    }
  }

  /**
   * Показывать/скрывать
   * @param {boolean} state
   */
  //   show(state) {
  //     this.slider.container.setVisible(state)
  //     this.slider.button.setInteractive(state)

  //     // Прервать активный drag, если был
  //     if (!state) {
  //       this.scene.input.stopDrag(this.slider.button)
  //     }
  //   }

  /**
   * Программно установить значение
   * @param {number} value
   */
  setValue(value) {
    const index = this.betValues.indexOf(value)
    if (index === -1) {
      console.warn('[BetSlider] Value not found in betValues:', value)
      return
    }

    const norm = index / (this.betValues.length - 1)
    setSliderValue(this.slider, norm)
    this.previousValue = value
  }

  /**
   * Заблокировать изменения
   * @param {boolean} state
   */
  //   lock(state) {
  //     this.isLocked = state
  //   }
}
