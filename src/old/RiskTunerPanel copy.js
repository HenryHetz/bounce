// RiskTunerPanel.js

import {
  generateMinPayoutArray,
  generateMaxPayoutArray,
  generateStepsArray,
} from './RiskTunerData'

import { RiskSlider } from './RiskSlider'
import { RiskChart } from './RiskChart'
import {
  normalize,
  getDiscreteValue,
  getSliderValue,
  setSliderValue,
} from './RiskTunerUtils'

export class RiskTunerPanel {
  constructor(scene, vail, defaultRiskSetting) {
    this.scene = scene
    this.vail = vail
    this.defaultRiskSetting = defaultRiskSetting

    this.container = scene.add.container(0, 0).setDepth(20)

    // ✅ Settings ranges
    this.settings = {
      minPayout: generateMinPayoutArray(),
      maxPayout: generateMaxPayoutArray(),
      steps: generateStepsArray(),
    }

    // ✅ Create all UI
    this.createUI()

    // ✅ Setup dragging
    this.setupDragging()

    // ✅ Init state
    this.show(false)
  }

  createUI() {
    const { scene, container } = this

    // Background or header image
    this.roadToRisk = scene.add
      .image(scene.sceneCenterX, scene.gridUnit * 2, 'naming')
      .setOrigin(0.5)

    // Title text
    this.notation = scene.add
      .text(scene.sceneCenterX - 100, scene.gridUnit * 4, 'v.1.5', {
        fontSize: '24px',
        color: '#FDD41D',
      })
      .setOrigin(0, 0.5)

    // Update method
    this.notation.update = (setting) => {
      const lines = [
        `Steps: ${setting.steps}`,
        `Min X: ${setting.minPayout}`,
        `Max X: ${setting.maxPayout}`,
        `MODE: LIGHT`,
      ]
      this.notation.setText(lines)
    }

    // Chart
    this.riskChart = new RiskChart(scene, 120, 9 * scene.gridUnit, 50, 9, 400)

    // Sliders
    this.slider1 = new RiskSlider(
      scene,
      60,
      7 * scene.gridUnit,
      300,
      true,
      'volume_bar',
      'button_volume'
    )
    this.slider2 = new RiskSlider(
      scene,
      640 - 60,
      7 * scene.gridUnit,
      300,
      true,
      'volume_bar',
      'button_volume'
    )
    this.slider3 = new RiskSlider(
      scene,
      320,
      10 * scene.gridUnit,
      300,
      true,
      'volume_bar',
      'button_volume'
    )
    this.slider3.container.setRotation(Phaser.Math.DegToRad(90))

    // Buttons
    this.buttonClose = scene.add
      .image(640 - scene.gridUnit, 12 * scene.gridUnit, 'button_close')
      .setOrigin(0.5)
      .setInteractive()
      .on('pointerdown', () => {
        this.show(false)
      })

    this.buttonReset = scene.add
      .image(scene.gridUnit, 12 * scene.gridUnit, 'button_fire')
      .setOrigin(0.5)
      .setInteractive()
      .setFlipX(true)
      .setScale(0.9)
      .on('pointerdown', () => {
        console.log('Reset clicked (placeholder)')
      })

    this.buttonCreate = scene.add
      .image(scene.sceneCenterX, 12 * scene.gridUnit, 'button_create')
      .setOrigin(0.5)
      .setInteractive()
      .on('pointerdown', () => {
        console.log('Create clicked (placeholder)')
      })

    this.textClose = scene.add
      .text(this.buttonClose.x, 11 * scene.gridUnit, 'CLOSE', {
        fontFamily: 'AvenirNextCondensedBold',
        fontSize: '18px',
        color: '#13469A',
      })
      .setOrigin(0.5, 0)

    this.textReset = scene.add
      .text(this.buttonReset.x, 11 * scene.gridUnit, 'RESET', {
        fontFamily: 'AvenirNextCondensedBold',
        fontSize: '18px',
        color: '#13469A',
      })
      .setOrigin(0.5, 0)

    // Add all to container
    container.add([
      this.roadToRisk,
      this.notation,
      this.riskChart.graphics,
      this.buttonClose,
      this.buttonReset,
      this.textClose,
      this.textReset,
      this.buttonCreate,
      this.slider1.container,
      this.slider2.container,
      this.slider3.container,
    ])
  }

  setupDragging() {
    const { scene } = this

    scene.input.setDraggable([
      this.slider1.button,
      this.slider2.button,
      this.slider3.button,
    ])

    const sliderSettingsMap = new Map([
      [this.slider1, this.settings.minPayout],
      [this.slider2, this.settings.maxPayout],
      [this.slider3, this.settings.steps],
    ])

    scene.input.on('drag', (pointer, gameObject) => {
      const slider = [this.slider1, this.slider2, this.slider3].find(
        (s) => s.button === gameObject
      )
      if (!slider) return

      const local = slider.container.getLocalPoint(pointer.x, pointer.y)
      if (slider.axis === 'y') {
        slider.button.y = Phaser.Math.Clamp(local.y, slider.min, slider.max)
      } else {
        slider.button.x = Phaser.Math.Clamp(local.x, slider.min, slider.max)
      }

      const sliderValue = getSliderValue(slider)
      const settingArray = sliderSettingsMap.get(slider)
      const discreteValue = getDiscreteValue(settingArray, sliderValue)

      console.log('Value:', discreteValue)
    })
  }

  setSliders(setting) {
    console.log('setSliders:', setting)

    const minNorm = normalize(setting.minPayout, 1.1, 10)
    const maxNorm = normalize(setting.maxPayout, 0, 1000000)
    const stepsNorm = normalize(setting.steps, 10, 100)

    setSliderValue(this.slider1, minNorm)
    setSliderValue(this.slider2, maxNorm)
    setSliderValue(this.slider3, stepsNorm)
  }

  show(state) {
    this.container.setVisible(state)
    this.vail.setVisible(state)

    if (state) {
      this.notation.update(this.defaultRiskSetting)
      this.setSliders(this.defaultRiskSetting)

      // animate chart
      this.riskChart.animateTo(
        this.calculateTargetValues(this.defaultRiskSetting)
      )
    } else {
      this.riskChart.reset()
    }
  }

  // Chart shape calculation
  calculateTargetValues(setting) {
    const chartHeight = 400

    const findIndex = (array, value) =>
      array.findIndex((item) => item === value)

    const minIndex = findIndex(this.settings.minPayout, setting.minPayout)
    const maxIndex = findIndex(this.settings.maxPayout, setting.maxPayout)
    const stepsIndex = findIndex(this.settings.steps, setting.steps)

    let minStart = 0.05 * chartHeight
    let minFinish = 0.2 * chartHeight
    let minLengt = minFinish - minStart
    let maxStart = 0.25 * chartHeight
    let maxFinish = 1 * chartHeight
    let maxLengt = maxFinish - maxStart

    let minHeight =
      minStart + (minIndex / (this.settings.minPayout.length - 1)) * minLengt
    let maxHeight =
      maxStart + (maxIndex / (this.settings.maxPayout.length - 1)) * maxLengt

    const payoutAt = (step) => {
      const ratio =
        (setting.maxPayout / setting.minPayout) ** (step / setting.steps)
      return setting.minPayout * ratio
    }

    const bars = []
    for (let i = 0; i < 7; i++) {
      const stepPos = (i / 6) * setting.steps
      const payout = payoutAt(stepPos)
      const normalized = Math.pow(payout / setting.maxPayout, 1 / 3)
      bars.push(normalized)
    }

    const lowClip = 0.15
    return bars.map((v) => lowClip + (1 - lowClip) * Phaser.Math.Clamp(v, 0, 1))
  }
}
