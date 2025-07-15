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
  constructor(scene, currentSetting, onDraftChange) {
    this.scene = scene
    this.onDraftChange = onDraftChange

    this.settingArrays = {
      minPayout: generateMinPayoutArray(),
      maxPayout: generateMaxPayoutArray(),
      steps: generateStepsArray(),
    }

    this.currentRiskSetting = { ...currentSetting }
    this.draftRiskSetting = { ...currentSetting }

    // --- Краши на нуле
    // this.instantCrashes = {}
    // this.settingArrays.minPayout.forEach((minPayout) => {
    //   let setting = {
    //     minPayout: minPayout,
    //     maxPayout: 100,
    //     steps: 100,
    //   }
    //   const probability = scene.generateCrashTable(setting)[0].probability
    //   this.instantCrashes[minPayout] = probability * 100
    // })
    // console.log(this.instantCrashes)
    this.container = scene.add.container(0, 0).setDepth(20).setVisible(false)

    this.createUI()
    this.createEvents()
  }

  createUI() {
    const { scene, container } = this

    // Заглушка фон (можно .setInteractive())
    this.bg = scene.add
      .image(0, 80, 'risk_bg')
      .setOrigin(0)
      .setAlpha(1)
      .setInteractive()

    // Заголовок
    this.naming = scene.add
      .image(scene.sceneCenterX - 200, scene.gridUnit * 1.8, 'risk_tuner')
      .setOrigin(0, 0.5)
    //   .setScale(0.9)

    // this.title = scene.add
    //   .text(scene.sceneCenterX, scene.gridUnit * 2.5, 'RISK TUNER', {
    //     fontFamily: 'AvenirNextCondensedBold',
    //     fontSize: '26px',
    //     color: '#13469A',
    //   })
    //   .setOrigin(0.5, 0)

    // Нотация
    this.notation = scene.add
      .text(scene.sceneCenterX - 200, scene.gridUnit * 3, '', {
        // fontFamily: 'walibi',
        fontSize: '24px',
        color: '#FDD41D',
      })
      .setOrigin(0, 0.5)

    this.notation.update = (setting) => {
      const lines = [
        `Steps: ${setting.steps}`,
        `Min X: ${setting.minPayout}`,
        `Max X: ${setting.maxPayout}`,
        `MODE: LIGHT`, // VOLATILITY?
      ]
      this.notation.setText(lines)
    }

    // Чарт
    this.chart = new RiskChart(scene, 120, 7 * scene.gridUnit)

    // Слайдеры
    this.slider1 = new RiskSlider(
      scene,
      320,
      9 * scene.gridUnit,
      'MIN PAYOUT',
      this.settingArrays.minPayout[0],
      this.settingArrays.minPayout[this.settingArrays.minPayout.length - 1]
    )
    this.slider2 = new RiskSlider(
      scene,
      320,
      10 * scene.gridUnit,
      'MAX PAYOUT',
      this.settingArrays.maxPayout[0],
      this.settingArrays.maxPayout[this.settingArrays.maxPayout.length - 1]
    )
    this.slider3 = new RiskSlider(
      scene,
      320,
      8 * scene.gridUnit,
      'STEPS',
      this.settingArrays.steps[0],
      this.settingArrays.steps[this.settingArrays.steps.length - 1]
    )
    // this.slider3.container.setRotation(Phaser.Math.DegToRad(90))

    // Кнопки
    this.buttonClose = scene.add
      .image(640 - scene.gridUnit, 12 * scene.gridUnit, 'button_close')
      .setOrigin(0.5)
      .setInteractive()

    this.buttonReset = scene.add
      .image(scene.gridUnit, 12 * scene.gridUnit, 'button_fire')
      .setOrigin(0.5)
      .setInteractive()
      .setFlipX(true)
      .setScale(0.9)

    this.buttonCreate = scene.add
      .image(scene.sceneCenterX, 12 * scene.gridUnit, 'button_create')
      .setOrigin(0.5)
      .setInteractive()
      .setAlpha(0.6) // неактивна по умолчанию

    this.textClose = scene.add
      .text(this.buttonClose.x, 11 * scene.gridUnit, 'CLOSE', {
        fontFamily: 'AvenirNextCondensedBold',
        fontSize: '18px',
        color: '#13469A',
      })
      .setOrigin(0.5, 0)

    this.textReset = scene.add
      .text(this.buttonReset.x, 11 * scene.gridUnit, 'DEFAULT', {
        fontFamily: 'AvenirNextCondensedBold',
        fontSize: '18px',
        color: '#13469A',
      })
      .setOrigin(0.5, 0)

    // Добавляем в контейнер
    container.add([
      this.bg,
      this.naming,
      //   this.title,
      this.notation,
      this.chart.graphics,
      this.buttonClose,
      this.textClose,
      this.buttonReset,
      this.textReset,
      this.buttonCreate,
      this.slider1.container,
      this.slider2.container,
      this.slider3.container,
    ])
  }

  createEvents() {
    const { scene } = this

    // Слайдеры активируем
    scene.input.setDraggable([
      this.slider1.button,
      this.slider2.button,
      this.slider3.button,
    ])

    // Карта слайдеров
    this.sliderSettingsMap = new Map([
      [this.slider1, this.settingArrays.minPayout],
      [this.slider2, this.settingArrays.maxPayout],
      [this.slider3, this.settingArrays.steps],
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
      const settingArray = this.sliderSettingsMap.get(slider)
      const discreteValue = getDiscreteValue(settingArray, sliderValue)

      // === НОВОЕ: определяем ключ для draftRiskSetting ===
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

      // === Обновляем текст нотации ===
      this.notation.update(this.draftRiskSetting)

      // === Анимация графика только если поменялось ===
      this.updateChart(this.draftRiskSetting)

      // кнопка
      this.updateCreateButton()
    })

    // Кнопка Close
    this.buttonClose.on('pointerdown', () => {
      this.show(false)
    })

    // Кнопка Reset
    this.buttonReset.on('pointerdown', () => {
      this.resetDraft()
    })

    // Кнопка Create
    this.buttonCreate.on('pointerdown', () => {
      if (this.isDraftChanged()) {
        this.applyDraft()
      }
    })
  }

  updateDraft(slider, value) {
    if (slider === this.slider1) this.draftRiskSetting.minPayout = value
    if (slider === this.slider2) this.draftRiskSetting.maxPayout = value
    if (slider === this.slider3) this.draftRiskSetting.steps = value

    this.updateNotation()
    this.updateCreateButton()
    this.updateChart()
  }

  updateNotation() {
    const s = this.draftRiskSetting
    this.notation.setText([
      `Steps: ${s.steps}`,
      `Min X: ${s.minPayout}`,
      `Max X: ${s.maxPayout}`,
      `MODE: LIGHT`,
    ])
  }

  updateChart(settings) {
    // console.log('updateChart', settings)
    const targetBars = this.makeChartBarsFromSettings(settings) // settings
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
    // console.log('updateCreateButton')
    this.buttonCreate.setAlpha(this.isDraftChanged() ? 1 : 0.6)
  }

  applyDraft() {
    this.currentRiskSetting = { ...this.draftRiskSetting }
    // например отправить наружу событие:
    this.scene.events.emit('riskTuner:apply', this.currentRiskSetting)
    this.show(false)
  }

  resetDraft() {
    this.draftRiskSetting = { ...this.defaultRiskSetting }
    this.setSliders(this.draftRiskSetting)
    this.updateNotation(this.draftRiskSetting)
    this.updateChart(this.draftRiskSetting)
    this.updateCreateButton()
  }

  getNormalizedFromArray(array, value) {
    const index = array.findIndex((v) => v === value)
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
    // this.vail.setVisible(state)
    if (state) {
      this.draftRiskSetting = { ...this.currentRiskSetting }
      this.setSliders(this.draftRiskSetting)
      this.updateNotation(this.draftRiskSetting)
      this.updateChart(this.draftRiskSetting)
      this.updateCreateButton()
    }
  }

  makeChartBarsFromSettings(setting) {
    // console.log('makeChartBarsFromSettings', setting)

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

    // console.log(
    //   'firstBarHeight',
    //   firstBarHeight,
    //   'lastBarHeight',
    //   lastBarHeight
    // )

    // curveFactor определяет насколько кривая крутая
    const curveFactor = 1.3 + 20 / setting.steps // ~1.5 + 10 тоже хорошо
    // console.log('curveFactor', curveFactor)

    const bars = []
    for (let i = 0; i < this.chart.barsCount; i++) {
      const t = i / (this.chart.barsCount - 1)

      // Apply curve
      const curvedT = Math.pow(t, curveFactor)

      const height = firstBarHeight * (1 - curvedT) + lastBarHeight * curvedT

      bars.push(Phaser.Math.Clamp(height / chartHeight, 0, 1))
    }

    // console.table('bars', bars)

    return bars
  }
}
