import {
  generateCashoutFractionArray,
  generateCashoutNumbersArray,
  generateRoundsArray,
} from './Data'
import { Slider } from './Slider'
import { Chart } from './Chart'
import {
  normalize,
  getDiscreteValue,
  getSliderValue,
  setSliderValue,
} from './Utils'

import { ButtonGraphics } from '../ButtonGraphics'

export class AutoPanel {
  constructor(scene, setting) {
    this.scene = scene

    // --- Генерируем массивы дискретных значений
    this.settingArrays = {
      rounds: generateRoundsArray(),
      cashout: generateCashoutNumbersArray(), // целая часть: 0..99
      fractions: generateCashoutFractionArray(), // дробная часть: 0.00..0.99
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

    // --- Фон
    this.bg = scene.add
      .image(0, 80, 'auto_bg')
      .setOrigin(0)
      .setAlpha(1)
      .setInteractive()

    // --- Заголовок
    this.naming = scene.add
      .text(scene.sceneCenterX, scene.gridUnit * 2, '#AUTO_BETTING', {
        fontSize: '38px',
        color: '#FDD41D',
        fontFamily: 'walibi',
      })
      .setOrigin(0.5)

    // --- Нотация/лейблы
    this.notation = scene.add
      .text(
        scene.sceneCenterX,
        scene.gridUnit * 2.5,
        'Selecting "0" means no action.',
        {
          fontSize: '24px',
          color: '#13469A', // жёлтый '#FDD41D'
          fontFamily: 'AvenirNextCondensedBold',
        }
      )
      .setOrigin(0.5)
      .setAlign('center')

    this.displaysUpdate = (setting) => {
      this.displayRounds.setText(setting.rounds)
      this.displayCashout.setText(Number(setting.cashout).toFixed(2))

      // dev
      const roundsN = clamp(setting.rounds / 100, 0, 1)
      const cashoutN = Phaser.Math.Clamp(Number(setting.cashout) / 100, 0, 1) // 👈 ЛИНЕЙНАЯ

      this.chart?.animateTo([roundsN, cashoutN])
    }

    const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
    const logNorm = (v, min, max) => {
      const vv = clamp(v, min, max)
      return (
        (Math.log10(vv) - Math.log10(min)) / (Math.log10(max) - Math.log10(min))
      )
    }
    const displayY = scene.gridUnit * 5.5
    const displayGap = 80
    // Крупные цифры
    this.displayRounds = scene.add
      .text(scene.sceneCenterX, displayY + displayGap, '', {
        fontSize: '60px',
        color: 'white',
        fontFamily: 'walibi',
      })
      .setOrigin(0.5)
    // .setDepth(20)
    this.displayRoundsLabel = scene.add
      .text(this.displayRounds.x, this.displayRounds.y - 50, 'ROUNDS', {
        fontFamily: 'AvenirNextCondensedBold',
        fontSize: '24px',
        color: '#13469A',
      })
      .setOrigin(0.5)

    this.displayCashout = scene.add
      .text(scene.sceneCenterX, displayY - displayGap, '', {
        fontSize: '60px',
        color: 'white',
        fontFamily: 'walibi',
      })
      .setOrigin(0.5)
    // .setDepth(20)

    this.displayCashoutLabel = scene.add
      .text(this.displayCashout.x, this.displayCashout.y - 50, 'CASHOUT', {
        fontFamily: 'AvenirNextCondensedBold',
        fontSize: '24px',
        color: '#13469A',
      })
      .setOrigin(0.5)
    // --- Чарт
    const chartHeight = 240
    const barWidth = 160

    // this.chart = new Chart(scene, 0, this.displayRounds.y + chartHeight / 2)
    // // два широких столбика строго под цифрами:
    // this.chart.configure({
    //   barsCount: 2,
    //   barWidth,
    //   chartHeight,
    //   anchors: [this.displayRounds.x, this.displayCashout.x], // центры столбиков
    // })

    // --- Слайдеры
    this.slider1 = new Slider(
      scene,
      320,
      9 * scene.gridUnit,
      'CASHOUT • WHOLE',
      this.settingArrays.cashout[0], // 0
      this.settingArrays.cashout[this.settingArrays.cashout.length - 1] // 99
    )

    this.slider2 = new Slider(
      scene,
      320,
      10 * scene.gridUnit,
      'ROUNDS',
      this.settingArrays.rounds[0],
      this.settingArrays.rounds[this.settingArrays.rounds.length - 1]
    )

    this.slider3 = new Slider(
      scene,
      320,
      8 * scene.gridUnit,
      'CASHOUT • FRACTION',
      this.settingArrays.fractions[0], // 0.00
      this.settingArrays.fractions[this.settingArrays.fractions.length - 1] // 0.99
    )

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

    this.buttonAction = new ButtonGraphics(
      this.scene,
      scene.sceneCenterX,
      scene.buttonY,
      'yellow'
    ).setAlpha(0.6)

    this.buttonAction.enableHitbox()

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
      this.displayRounds,
      this.displayRoundsLabel,
      this.displayCashout,
      this.displayCashoutLabel,
      this.buttonClose,
      this.textClose,
      this.buttonReset,
      this.textReset,
      this.buttonAction,
      this.buttonActionLabel,
      this.slider1.container,
      this.slider2.container,
      this.slider3.container,
    ])
  }

  createEvents() {
    const { scene } = this

    scene.events.on('gameEvent', (data) => {
      if (data.mode === 'AUTO_SETTING_CHANGED') {
        // this.handleEvent(data)
        this.currentSetting = { ...data.current }
      }
    })

    // --- Слайдеры активируем
    scene.input.setDraggable([
      this.slider1.button,
      this.slider2.button,
      this.slider3.button,
    ])

    // --- Карта слайдеров
    this.sliderSettingsMap = new Map([
      [this.slider1, this.settingArrays.cashout], // целая часть
      [this.slider2, this.settingArrays.rounds], // раунды
      [this.slider3, this.settingArrays.fractions], // дробная часть
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

      // Обновляем либо раунды, либо целую/дробную часть кэшаута
      if (slider === this.slider2) {
        if (this.previousValues.rounds === discreteValue) return
        this.draftSetting.rounds = discreteValue
        this.previousValues.rounds = discreteValue
      } else {
        const current = Number(this.draftSetting.cashout) || 0
        const currentWhole = Math.trunc(current)
        const currentFrac = +(current - currentWhole).toFixed(2)

        const whole = slider === this.slider1 ? discreteValue : currentWhole
        const fraction = slider === this.slider3 ? discreteValue : currentFrac

        // Собираем с аккуратной фиксацией двух знаков
        const composed = +(whole + fraction).toFixed(2)

        if (this.previousValues.cashout === composed) return
        this.draftSetting.cashout = composed
        this.previousValues.cashout = composed
      }

      // --- Обновляем UI
      this.displaysUpdate(this.draftSetting)
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

    this.buttonAction.on('pointerdown', () => {
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
    return d.cashout !== c.cashout || d.rounds !== c.rounds
  }

  updateCreateButton() {
    this.buttonAction.setAlpha(this.isDraftChanged() ? 1 : 0.7)
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
    this.displaysUpdate(this.draftSetting)
    // this.updateChart(this.draftSetting)
    this.updateCreateButton()
  }

  getNormalizedFromArray(array, value) {
    const index = array.indexOf(value)
    if (index === -1) return 0
    return index / (array.length - 1)
  }

  setSliders(setting) {
    // Разложим cashout на целую и дробную части
    const whole = Math.trunc(Number(setting.cashout) || 0)
    const frac = +((Number(setting.cashout) || 0) - whole).toFixed(2)

    const normWhole = this.getNormalizedFromArray(
      this.settingArrays.cashout,
      whole
    )
    const normFrac = this.getNormalizedFromArray(
      this.settingArrays.fractions,
      frac
    )
    const normRounds = this.getNormalizedFromArray(
      this.settingArrays.rounds,
      setting.rounds
    )

    setSliderValue(this.slider1, normWhole) // целая часть
    setSliderValue(this.slider3, normFrac) // дробная часть
    setSliderValue(this.slider2, normRounds) // раунды
  }

  show(state, setting) {
    this.container.setVisible(state)
    if (state) {
      if (setting) {
        this.draftSetting = { ...setting }
        this.previousValues = { ...setting }
      }

      this.setSliders(this.draftSetting)
      this.displaysUpdate(this.draftSetting)
      // this.updateChart(this.draftSetting)
      this.updateCreateButton()
    }
  }

  makeChartBarsFromSettings(setting) {
    const minIndex = this.settingArrays.cashout.indexOf(
      Math.trunc(setting.cashout)
    )
    const maxIndex = this.settingArrays.rounds.indexOf(setting.rounds)

    const chartHeight = this.chart?.chartHeight ?? 1
    const minStart = 0.05 * chartHeight
    const minFinish = 0.15 * chartHeight
    const maxStart = 0.3 * chartHeight
    const maxFinish = 1 * chartHeight

    const normMin = minIndex / (this.settingArrays.cashout.length - 1)
    const normMax = maxIndex / (this.settingArrays.rounds.length - 1)

    return [
      { x: 0, y0: minStart, y1: minFinish, norm: normMin },
      { x: 100, y0: maxStart, y1: maxFinish, norm: normMax },
    ]
  }
}
