import {
  generatePayoutFractionArray,
  generatePayoutNumbersArray,
  generateRoundsArray,
} from './Data'
import { Slider } from './Slider'
// import { Chart } from './Chart'
import {
  normalize,
  getDiscreteValue,
  getSliderValue,
  setSliderValue,
} from './Utils'

export class AutoPanel {
  constructor(scene, setting) {
    this.scene = scene

    // --- Генерируем массивы дискретных значений
    this.settingArrays = {
      rounds: generateRoundsArray(),
      payout: generatePayoutNumbersArray(),
    }

    // --- Основные состояния
    this.defaultSetting = { ...setting }
    this.currentSetting = { ...setting }
    this.draftSetting = { ...setting }
    this.previousValues = { ...setting }

    // --- Контейнер для всего UI
    this.container = scene.add.container(0, 0).setDepth(20).setVisible(false)

    this.createUI()
    this.createEvents()
  }

  createUI() {
    const { scene, container } = this

    // --- Фон (теперь интерактивный, вместо старого vail)
    this.bg = scene.add
      .image(0, 80, 'auto_bg')
      .setOrigin(0)
      .setAlpha(1)
      .setInteractive()

    // --- Заголовок
    this.naming = scene.add
      .text(scene.sceneCenterX - 200, scene.gridUnit * 1.8, '#AUTO_BETTING', {
        fontSize: '38px',
        color: '#FDD41D',
        fontFamily: 'walibi',
      })
      .setOrigin(0, 0.5)

    // --- Нотация
    this.notation = scene.add
      .text(scene.sceneCenterX - 200, scene.gridUnit * 3, '', {
        fontSize: '30px',
        color: '#FDD41D',
        fontFamily: 'AvenirNextCondensedBold',
      })
      .setOrigin(0, 0.5)

    this.notation.update = (setting) => {
      // console.log('Auto notation.update', setting)

      const lines = [
        `Rounds_${setting.rounds}`,
        `Payout_${Number(setting.payout).toFixed(2)}`,
        // `Max_X_${setting.rounds}`,
      ]
      this.notation.setText(lines)
    }

    // --- Чарт
    // this.chart = new Chart(scene, 120, 7 * scene.gridUnit)

    // --- Слайдеры
    this.slider1 = new Slider(
      scene,
      320,
      9 * scene.gridUnit,
      'PAYOUT',
      this.settingArrays.payout[0],
      this.settingArrays.payout[this.settingArrays.payout.length - 1]
    )
    this.slider2 = new Slider(
      scene,
      320,
      10 * scene.gridUnit,
      'ROUNDS',
      this.settingArrays.rounds[0],
      this.settingArrays.rounds[this.settingArrays.rounds.length - 1]
    )
    // this.slider3 = new Slider(
    //   scene,
    //   320,
    //   8 * scene.gridUnit,
    //   'STEPS',
    //   this.settingArrays.rounds[0],
    //   this.settingArrays.rounds[this.settingArrays.rounds.length - 1]
    // )

    // --- Кнопки
    this.buttonClose = scene.add
      .image(scene.buttonIndent, scene.buttonY, 'button_close')
      .setOrigin(0.5)
      .setScale(0.8)
      .setInteractive()

    this.buttonReset = scene.add
      .image(640 - scene.buttonIndent, scene.buttonY, 'button_reset')
      .setOrigin(0.5)
      .setScale(0.8)
      .setInteractive()
    // .setFlipX(true)
    // .setScale(1)

    this.buttonCreate = scene.add
      .image(scene.sceneCenterX, scene.buttonY, 'button_create')
      .setOrigin(0.5)
      .setInteractive()
      .setAlpha(0.6)

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
        'RESET',
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
      // this.chart.graphics,
      this.buttonClose,
      this.textClose,
      this.buttonReset,
      this.textReset,
      this.buttonCreate,
      this.slider1.container,
      this.slider2.container,
      // this.slider3.container,
    ])
  }

  createEvents() {
    const { scene } = this

    // --- Слайдеры активируем
    scene.input.setDraggable([
      this.slider1.button,
      this.slider2.button,
      // this.slider3.button,
    ])

    // --- Карта слайдеров
    this.sliderSettingsMap = new Map([
      [this.slider1, this.settingArrays.payout],
      [this.slider2, this.settingArrays.rounds],
      // [this.slider3, this.settingArrays.rounds],
    ])

    // --- Слушатель drag
    scene.input.on('drag', (pointer, gameObject) => {
      const slider = [this.slider1, this.slider2].find(
        (s) => s.button === gameObject
      )
      if (!slider) return

      const local = slider.container.getLocalPoint(pointer.x, pointer.y)
      slider.button.x = Phaser.Math.Clamp(local.x, slider.min, slider.max)

      const sliderValue = getSliderValue(slider)
      const settingArray = this.sliderSettingsMap.get(slider)
      const discreteValue = getDiscreteValue(settingArray, sliderValue)

      let key
      if (slider === this.slider1) key = 'payout'
      else if (slider === this.slider2) key = 'rounds'
      // else if (slider === this.slider3) key = 'rounds'
      if (!key) return

      // === Проверка на изменение ===
      if (this.previousValues[key] === discreteValue) return

      // === Обновляем draft и previous ===
      this.draftSetting[key] = discreteValue
      this.previousValues[key] = discreteValue

      // === Обновляем UI ===
      this.notation.update(this.draftSetting)
      // this.updateChart(this.draftSetting)
      this.updateCreateButton()
    })

    // --- Кнопки
    this.buttonClose.on('pointerdown', () => {
      this.show(false)
    })

    this.buttonReset.on('pointerdown', () => {
      this.resetDraft()
    })

    this.buttonCreate.on('pointerdown', () => {
      if (this.isDraftChanged()) {
        this.applyDraft()
      }
    })
  }

  updateChart(setting) {
    // const targetBars = this.makeChartBarsFromSettings(setting)
    // this.chart.animateTo(targetBars)
  }

  isDraftChanged() {
    const d = this.draftSetting
    const c = this.currentSetting
    return d.payout !== c.payout || d.rounds !== c.rounds
  }

  updateCreateButton() {
    this.buttonCreate.setAlpha(this.isDraftChanged() ? 1 : 0.7)
  }

  applyDraft() {
    this.currentSetting = { ...this.draftSetting }
    this.scene.events.emit('autoBetting:apply', this.currentSetting)
    this.show(false)
  }

  resetDraft() {
    this.draftSetting = { ...this.defaultSetting }
    this.previousValues = { ...this.defaultSetting }

    this.setSliders(this.draftSetting)
    this.notation.update(this.draftSetting)
    // this.updateChart(this.draftSetting)
    this.updateCreateButton()
  }

  getNormalizedFromArray(array, value) {
    const index = array.indexOf(value)
    if (index === -1) return 0
    return index / (array.length - 1)
  }

  setSliders(setting) {
    const minNorm = this.getNormalizedFromArray(
      this.settingArrays.payout,
      setting.payout
    )
    const maxNorm = this.getNormalizedFromArray(
      this.settingArrays.rounds,
      setting.rounds
    )
    // const stepsNorm = this.getNormalizedFromArray(
    //   this.settingArrays.rounds,
    //   setting.rounds
    // )

    setSliderValue(this.slider1, minNorm)
    setSliderValue(this.slider2, maxNorm)
    // setSliderValue(this.slider3, stepsNorm)
  }

  show(state, setting) {
    this.container.setVisible(state)
    if (state) {
      if (setting) {
        // console.log('Auto show', setting)
        this.draftSetting = { ...setting }
        this.previousValues = { ...setting }
      }

      this.setSliders(this.draftSetting)
      this.notation.update(this.draftSetting)
      // this.updateChart(this.draftSetting)
      this.updateCreateButton()
    }
  }

  makeChartBarsFromSettings(setting) {
    const minIndex = this.settingArrays.payout.indexOf(setting.payout)
    const maxIndex = this.settingArrays.rounds.indexOf(setting.rounds)

    const chartHeight = this.chart.chartHeight
    const minStart = 0.05 * chartHeight
    const minFinish = 0.15 * chartHeight
    const maxStart = 0.3 * chartHeight
    const maxFinish = 1 * chartHeight

    const normMin = minIndex / (this.settingArrays.payout.length - 1)
    const normMax = maxIndex / (this.settingArrays.rounds.length - 1)

    const firstBarHeight = minStart + normMin * (minFinish - minStart)
    const lastBarHeight = maxStart + normMax * (maxFinish - maxStart)

    const curveFactor = 1.3 + 20 / setting.rounds

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
