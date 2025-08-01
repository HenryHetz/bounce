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

import { ButtonGraphics } from '../ButtonGraphics'

export class RiskTunerPanel {
  constructor(scene, riskSetting) {
    this.scene = scene

    // --- Генерируем массивы дискретных значений
    this.settingArrays = {
      minPayout: generateMinPayoutArray(),
      maxPayout: generateMaxPayoutArray(),
      steps: generateStepsArray(),
    }

    // let customs = 1
    // for (let key of Object.keys(this.settingArrays)) {
    //   console.log(key, this.settingArrays[key].length)
    //   customs *= this.settingArrays[key].length
    // }
    // console.log('Вариантов кастома:', customs)
    // --- Основные состояния
    this.defaultRiskSetting = { ...riskSetting }
    this.currentRiskSetting = { ...riskSetting }
    this.draftRiskSetting = { ...riskSetting }
    this.previousDraftValues = { ...riskSetting }

    // --- Контейнер для всего UI
    this.container = scene.add.container(0, 0).setDepth(20).setVisible(false)

    this.createUI()
    this.createEvents()
  }

  createUI() {
    const { scene, container } = this

    // --- Фон (теперь интерактивный, вместо старого vail)
    this.bg = scene.add
      .image(0, 80, 'tuner_bg')
      .setOrigin(0)
      .setAlpha(1)
      .setInteractive()

    // --- Заголовок
    // this.naming = scene.add
    //   .image(scene.sceneCenterX, scene.gridUnit * 1.8, 'risk_tuner')
    //   .setOrigin(0.5)

    this.naming = scene.add
      .text(scene.sceneCenterX - 200, scene.gridUnit * 1.8, '#RISK_TUNER', {
        fontSize: '38px',
        color: '#FDD41D',
        fontFamily: 'walibi',
      })
      .setOrigin(0, 0.5)

    // --- Нотация
    this.notation = scene.add
      .text(scene.sceneCenterX - 200, scene.gridUnit * 3.2, '', {
        fontSize: '24px',
        color: '#FDD41D',
        fontFamily: 'AvenirNextCondensedBold',
      })
      .setOrigin(0, 0.5)

    this.notation.update = (setting) => {
      const lines = [
        `Steps_${setting.steps}`,
        `Min_X_${setting.minPayout}`,
        `Max_X_${setting.maxPayout}`,
        `EDGE_1%`, // ${scene.houseEdge}
      ]
      this.notation.setText(lines)
    }
    const verticalIndent = 60
    this.blockY = 6.5 * scene.gridUnit
    // --- Чарт
    this.chart = new RiskChart(scene, 120, this.blockY)

    // --- Слайдеры
    this.slider1 = new RiskSlider(
      scene,
      320,
      this.blockY + 2 * verticalIndent,
      'MIN PAYOUT',
      this.settingArrays.minPayout[0],
      this.settingArrays.minPayout[this.settingArrays.minPayout.length - 1]
    )
    this.slider2 = new RiskSlider(
      scene,
      320,
      this.blockY + 3 * verticalIndent,
      'MAX PAYOUT',
      this.settingArrays.maxPayout[0],
      this.settingArrays.maxPayout[this.settingArrays.maxPayout.length - 1]
    )
    this.slider3 = new RiskSlider(
      scene,
      320,
      this.blockY + 1 * verticalIndent,
      'STEPS',
      this.settingArrays.steps[0],
      this.settingArrays.steps[this.settingArrays.steps.length - 1]
    )
    // пресеты
    const presetContainer = scene.add
      .container(0, 10 * scene.gridUnit)
      .setDepth(20)

    const startX = 100
    const indent = 110

    for (let index = 0; index < 5; index++) {
      const button = scene.add
        .image(startX + indent * index, 0, 'button_hell')
        .setOrigin(0.5)
        .setScale(0.8)
      presetContainer.add(button)
    }
    // --- Кнопки
    this.buttonClose = scene.add
      .image(640 - scene.buttonIndent, scene.buttonY, 'button_close')
      .setOrigin(0.5)
      .setScale(0.8)
      .setInteractive()

    this.buttonReset = scene.add
      .image(scene.buttonIndent, scene.buttonY, 'button_reset')
      .setOrigin(0.5)
      .setScale(0.8)
      .setInteractive()
    // .setFlipX(true)
    // .setScale(1)

    // this.buttonAction = scene.add
    //   .image(scene.sceneCenterX, scene.buttonY, 'button_create')
    //   .setOrigin(0.5)
    //   .setInteractive()
    //   .setAlpha(0.6)

    this.buttonAction = new ButtonGraphics(
      this.scene,
      scene.sceneCenterX,
      scene.buttonY,
      'yellow'
    ).setAlpha(0.6)

    this.buttonAction.enableHitbox()
    // this.buttonAction.on('pointerdown', () => this.onCash?.())

    this.buttonActionLabel = this.scene.add
      .text(this.buttonAction.x, this.buttonAction.y, 'SET', {
        font: '40px walibi',
        fill: 'black',
      })
      .setOrigin(0.5)
      .setAlign('center')

    this.textClose = scene.add
      .text(
        this.buttonClose.x,
        this.buttonClose.y - scene.buttonNameSpacing,
        'CLOSE',
        {
          fontFamily: 'AvenirNextCondensedBold',
          fontSize: '18px',
          color: '#13469A',
        }
      )
      .setOrigin(0.5, 0)

    this.textReset = scene.add
      .text(
        this.buttonReset.x,
        this.buttonReset.y - scene.buttonNameSpacing,
        'DEFAULT',
        {
          fontFamily: 'AvenirNextCondensedBold',
          fontSize: '18px',
          color: '#13469A',
        }
      )
      .setOrigin(0.5, 0)

    // --- Добавляем в контейнер
    container.add([
      this.bg,
      this.naming,
      this.notation,
      this.chart.graphics,
      this.buttonClose,
      this.textClose,
      this.buttonReset,
      this.textReset,
      this.buttonAction,
      this.buttonActionLabel,
      this.slider1.container,
      this.slider2.container,
      this.slider3.container,
      presetContainer,
    ])
  }

  createEvents() {
    const { scene } = this

    // --- Слайдеры активируем
    scene.input.setDraggable([
      this.slider1.button,
      this.slider2.button,
      this.slider3.button,
    ])

    // --- Карта слайдеров
    this.sliderSettingsMap = new Map([
      [this.slider1, this.settingArrays.minPayout],
      [this.slider2, this.settingArrays.maxPayout],
      [this.slider3, this.settingArrays.steps],
    ])

    // --- Слушатель drag
    scene.input.on('drag', (pointer, gameObject) => {
      const slider = [this.slider1, this.slider2, this.slider3].find(
        (s) => s.button === gameObject
      )
      if (!slider) return

      const local = slider.container.getLocalPoint(pointer.x, pointer.y)
      slider.button.x = Phaser.Math.Clamp(local.x, slider.min, slider.max)

      const sliderValue = getSliderValue(slider)
      const settingArray = this.sliderSettingsMap.get(slider)
      const discreteValue = getDiscreteValue(settingArray, sliderValue)

      let key
      if (slider === this.slider1) key = 'minPayout'
      else if (slider === this.slider2) key = 'maxPayout'
      else if (slider === this.slider3) key = 'steps'
      if (!key) return

      // === Проверка на изменение ===
      if (this.previousDraftValues[key] === discreteValue) return

      // === Обновляем draft и previous ===
      this.draftRiskSetting[key] = discreteValue
      this.previousDraftValues[key] = discreteValue

      // === Обновляем UI ===
      this.notation.update(this.draftRiskSetting)
      this.updateChart(this.draftRiskSetting)
      this.updateCreateButton()
    })

    // --- Кнопки
    this.buttonClose.on('pointerdown', () => {
      this.show(false)
    })

    this.buttonReset.on('pointerdown', () => {
      this.resetDraft()
    })

    this.buttonAction.on('pointerdown', () => {
      if (this.isDraftChanged()) {
        this.applyDraft()
      }
    })
  }

  updateChart(setting) {
    const targetBars = this.makeChartBarsFromSettings(setting)
    this.chart.animateTo(targetBars)
  }

  isDraftChanged() {
    const d = this.draftRiskSetting
    const c = this.currentRiskSetting
    return (
      d.minPayout !== c.minPayout ||
      d.maxPayout !== c.maxPayout ||
      d.steps !== c.steps
    )
  }

  updateCreateButton() {
    this.buttonAction.setAlpha(this.isDraftChanged() ? 1 : 0.7)
  }

  applyDraft() {
    this.currentRiskSetting = { ...this.draftRiskSetting }
    this.scene.events.emit('riskTuner:apply', this.currentRiskSetting)
    this.show(false)
  }

  resetDraft() {
    this.draftRiskSetting = { ...this.defaultRiskSetting }
    this.previousDraftValues = { ...this.defaultRiskSetting }

    this.setSliders(this.draftRiskSetting)
    this.notation.update(this.draftRiskSetting)
    this.updateChart(this.draftRiskSetting)
    this.updateCreateButton()
  }

  getNormalizedFromArray(array, value) {
    const index = array.indexOf(value)
    if (index === -1) return 0
    return index / (array.length - 1)
  }

  setSliders(setting) {
    const minNorm = this.getNormalizedFromArray(
      this.settingArrays.minPayout,
      setting.minPayout
    )
    const maxNorm = this.getNormalizedFromArray(
      this.settingArrays.maxPayout,
      setting.maxPayout
    )
    const stepsNorm = this.getNormalizedFromArray(
      this.settingArrays.steps,
      setting.steps
    )

    setSliderValue(this.slider1, minNorm)
    setSliderValue(this.slider2, maxNorm)
    setSliderValue(this.slider3, stepsNorm)
  }

  show(state) {
    this.container.setVisible(state)
    if (state) {
      this.draftRiskSetting = { ...this.currentRiskSetting }
      this.previousDraftValues = { ...this.currentRiskSetting }

      this.setSliders(this.draftRiskSetting)
      this.notation.update(this.draftRiskSetting)
      this.updateChart(this.draftRiskSetting)
      this.updateCreateButton()
    }
  }

  makeChartBarsFromSettings(setting) {
    const minIndex = this.settingArrays.minPayout.indexOf(setting.minPayout)
    const maxIndex = this.settingArrays.maxPayout.indexOf(setting.maxPayout)

    const chartHeight = this.chart.chartHeight
    const minStart = 0.05 * chartHeight
    const minFinish = 0.15 * chartHeight
    const maxStart = 0.3 * chartHeight
    const maxFinish = 1 * chartHeight

    const normMin = minIndex / (this.settingArrays.minPayout.length - 1)
    const normMax = maxIndex / (this.settingArrays.maxPayout.length - 1)

    const firstBarHeight = minStart + normMin * (minFinish - minStart)
    const lastBarHeight = maxStart + normMax * (maxFinish - maxStart)

    const curveFactor = 1.3 + 20 / setting.steps

    const bars = []
    for (let i = 0; i < this.chart.barsCount; i++) {
      const t = i / (this.chart.barsCount - 1)
      const curvedT = Math.pow(t, curveFactor)
      const height = firstBarHeight * (1 - curvedT) + lastBarHeight * curvedT
      bars.push(Phaser.Math.Clamp(height / chartHeight, 0, 1))
    }

    return bars
  }
}
