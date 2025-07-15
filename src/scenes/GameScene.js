import { DEFAULT_RISK_SETTING } from '../constants/riskConstants'
import { Background } from '../comps/Background'
import { RiskTunerPanel } from '../comps/RiskTuner/RiskTunerPanel'
import { RiskSlider } from '../comps/RiskTuner/RiskSlider'
import { BetSlider } from '../comps/Bet/BetSlider'
import {
  normalize,
  getDiscreteValue,
  getSliderValue,
  setSliderValue,
} from '../comps/RiskTuner/RiskTunerUtils'

import { Ball } from '../comps/Ball'
import { Platforms } from '../comps/Platforms'
import { FSM } from '../comps/FSM'

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('Game')
  }
  preload() {}
  init() {
    this.betAllowed = false
    this.isCrashed = false // проигрыш
    this.gridUnit = 80
    this.sceneCenterX = this.cameras.main.centerX // центр сцены по X - через width найти
    this.ballX = 120
    this.ballY = 250
    this.platformY = this.gridUnit * 8
    this.distanceY = this.platformY - this.ballY
    // console.log('distance', this.distanceY)
    this.buttonY = 11.5 * this.gridUnit // где блок кнопок считать из высоты экрана
    // или прибить к низу
    this.buttonNameSpacing = 60
    this.buttonIndent = 100

    this.duration = 500

    this.bounceCount = 0 // отскоков
    this.deposit = 10000 // начальная сумма
    this.initialBet = 1 // начальная ставка
    this.stakeCount = 0 // ставка начальная пока
    this.allowCashOut = false // разрешить клик по кнопке "вывести деньги"
    this.roundCounter = 0 // счетчик раундов
    this.outCounter = 0 // счетчик вывода денег

    // dev
    this.tweens.timeScale = 1
    this.houseEdge = 1

    this.defaultRiskSetting = DEFAULT_RISK_SETTING
    this.currentRiskSetting = { ...DEFAULT_RISK_SETTING }

    // на сервере!!!
    this.crashTable = this.generateCrashTable(this.defaultRiskSetting)
    // dev
    // this.checkMath(this.crashTable)
  }
  create() {
    this.background = new Background(this)
    this.createStakeCounter()
    this.createStartCounter()
    // this.createDepositCounter()
    this.createParticles()
    this.createUI()
    this.createButtons()
    this.createMoneyCounter()

    this.ball = new Ball(this, this.emitter)
    this.platforms = new Platforms(this)
    this.platforms.updatePlatforms(this.crashTable)

    this.riskTuner = new RiskTunerPanel(this, this.defaultRiskSetting)

    this.events.on('riskTuner:apply', (newRiskSetting) => {
      // console.log('[GameScene] riskTuner:apply', newRiskSetting)
      this.pendingRiskSetting = { ...newRiskSetting }
      this.newRiskSettingNotice.show()
    })

    if (!this.sounds) this.createSounds()

    this.fsm = new FSM()
    this.setupFSMHandlers()
    this.fsm.toCountdown()

    // dev
    // this.countdown()
    // this.createBallSheet()
    this.createGrid()
  }
  createUI() {
    this.ui = this.add
      .image(0, 0, 'dev_ui')
      .setOrigin(0)
      .setAlpha(0)
      .setScale(1)

    this.header = this.add
      .image(0, 0, 'header')
      .setOrigin(0)
      .setAlpha(1)
      .setScale(1)
      .setDepth(200)

    this.newRiskSettingNotice = this.add
      .text(this.sceneCenterX, this.gridUnit * 1.3, '', {
        fontSize: '24px',
        color: '#FDD41D',
        fontFamily: 'Courier',
      })
      .setOrigin(0.5, 0)
      .setAlpha(0)

    this.newRiskSettingNotice.show = (setting) => {
      if (setting) {
        // это кастом или дефолт?
        const diffSettings = () => {
          const d = this.defaultRiskSetting
          const c = setting
          return (
            d.minPayout !== c.minPayout ||
            d.maxPayout !== c.maxPayout ||
            d.steps !== c.steps
          )
        }
        let text
        if (diffSettings()) text = 'NEW CUSTOM:'
        else text = 'SET DEFAULT:'

        this.newRiskSettingNotice.text =
          // 'New settings in the next round...',
          `${text} ${setting.minPayout} -> ${setting.maxPayout} | ${setting.steps} `

        this.newRiskSettingNotice.alpha = 1
        this.tweens.add({
          targets: this.newRiskSettingNotice,
          alpha: 0, // ширина экрана
          duration: 7000,
        })
      } else {
        // если прилетели новые настройки, но не сейчас
        this.newRiskSettingNotice.text = 'New settings in the next round...'

        this.newRiskSettingNotice.alpha = 1
      }
    }

    this.newRiskSettingNotice.show(this.defaultRiskSetting)
  }
  createGrid() {
    this.ui = this.add
      .image(0, 0, 'grid')
      .setOrigin(0)
      .setAlpha(0)
      .setDepth(100)
  }
  createButtons() {
    this.buttonY = 11.5 * this.gridUnit
    this.buttonCash = this.add
      .image(this.sceneCenterX, this.buttonY, 'button_cash')
      .setOrigin(0.5, 0.5)
    // .setInteractive()
    this.events.on('round', (value) => {
      // console.log('round теперь', value)

      if (value) {
        this.buttonCash.setTexture('button_cash')
        this.buttonCash.setAlpha(1)
        // this.cashOutShadow.show(0)
        // this.stakeCounter.clearTint() // dev
      } else {
        // this.buttonCash.setAlpha(0.8)
      }
    })

    this.buttonRect = this.add
      .rectangle(this.sceneCenterX, this.buttonY, 280, 120, 0x00ccff)
      .setOrigin(0.5)
      .setFillStyle(0x000000, 0)
      .setInteractive({ useHandCursor: false }) // курсор-рука при наведении

    this.buttonRect.addListener('pointerdown', () => {
      //   console.log('buttonRect clicked')
      handleCashClick.call(this)
    })

    function handleCashClick() {
      // console.log('handleCashClick', this.allowCashOut)

      if (this.allowCashOut) {
        // обработка вывода денег
        this.allowCashOut = false
        this.sounds.heart.play()
        this.moneyCounterUpdate(this.stakeCount)
        this.outCounter += this.stakeCount
        this.buttonCash.setTexture('button_out')
        this.stakeCounter.setTint(0xff0000) // dev
        // this.cashOutShadow.show(1)
        // console.log(
        //   'rounds',
        //   this.roundCounter,
        //   'out ave',
        //   this.outCounter / this.roundCounter,
        //   'balance',
        //   this.outCounter - this.roundCounter * this.currentBetValue,
        //   'RTP%',
        //   (this.outCounter / (this.roundCounter * this.currentBetValue)) * 100
        // )
      }
    }

    // this.buttonStake = this.add
    //   .image(this.sceneCenterX, 10 * this.gridUnit, 'button_stake')
    //   .setOrigin(0.5, 0.5)
    //   .setAlpha(0)
    // this.buttonStake.show = (state) => {
    //   this.buttonStake.visible = state
    // }

    this.buttonAuto = this.add
      .image(this.buttonIndent, this.buttonY, 'button_auto')
      .setOrigin(0.5, 0.5)
      .setScale(0.8)

    this.add
      .text(
        this.buttonAuto.x,
        this.buttonAuto.y - this.buttonNameSpacing,
        'AUTO',
        {
          fontFamily: 'AvenirNextCondensedBold',
          fontSize: '18px',
          color: '#13469A',
        }
      )
      .setOrigin(0.5, 0)

    this.buttonTuner = this.add
      .image(
        this.sceneCenterX * 2 - this.buttonIndent,
        this.buttonY,
        'button_tuner'
      )
      .setOrigin(0.5, 0.5)
      .setScale(0.8)
      .setInteractive()
      .addListener('pointerdown', () => {
        // console.log('buttonTuner clicked')
        this.riskTuner.show(true)
      })

    this.add
      .text(
        this.buttonTuner.x,
        this.buttonTuner.y - this.buttonNameSpacing,
        'TUNER',
        {
          fontFamily: 'AvenirNextCondensedBold',
          fontSize: '18px',
          color: '#13469A',
        }
      )
      .setOrigin(0.5, 0)

    this.buttonRules = this.add
      .image(
        this.sceneCenterX,
        13 * this.gridUnit, // нужно в блок всё собрать!!!
        'button_rules'
      )
      .setOrigin(0.5, 0.5)
      .setDepth(200)
      .setAlpha(1)
  }
  createStartCounter() {
    this.startCounter = this.add
      .text(this.sceneCenterX, 6 * this.gridUnit, '', {
        font: '100px walibi',
        fill: 'red', // цвет '#FC03B5'
        // stroke: 'black', // обводка
        // strokeThickness: 6, // толщина обводки
      })
      .setOrigin(0.5)
      .setAlign('center')
      .setAlpha(0)

    this.startCounterUpdate = function (value) {
      this.startCounter.setText(value)
    }
    this.startCounterShow = function (show) {
      //   console.log('startCounterShow', show)
      // this.settingNotation.setAlpha(show)
      this.startCounter.setAlpha(show)
      // if (show) {
      //   this.startCounter.setAlpha(1)
      // } else {
      //   this.startCounter.setAlpha(0)
      // }
    }
  }
  createStakeCounter() {
    this.currentBetValue = this.initialBet // dev

    this.stakeCounter = this.add
      .text(this.sceneCenterX, 9 * this.gridUnit, '', {
        font: '40px walibi',
        fill: 'white', // цвет '#FC03B5'
        stroke: 'black', // обводка
        strokeThickness: 3, // толщина обводки
      })
      .setOrigin(0.5, 0)
      .setAlign('center')
      .setAlpha(1)

    // this.cashOutShadow = this.add
    //   .text(this.sceneCenterX, 10.5 * this.gridUnit, '', {
    //     font: '32px walibi',
    //     fill: 'rgba(0,0,0,0)', // цвет '#FC03B5'
    //     stroke: 'red', // обводка
    //     strokeThickness: 6, // толщина обводки
    //   })
    //   .setOrigin(0.5)
    //   .setAlign('center')
    //   .setAlpha(1)
    //   .setVisible(0)
    // this.cashOutShadow.show = (state) => {
    //   this.cashOutShadow.alpha = state
    // }

    this.stakeCounterUpdate = function (value) {
      if (value) {
        this.stakeCount = this.currentBetValue * value // добавляем к ставке
      } else {
        this.stakeCount = this.currentBetValue // сброс ставки
      }
      this.stakeCounter.setText(this.stakeCount.toFixed(2))
      // this.cashOutShadow.setText(this.stakeCount.toFixed(2))
    }

    // dev
    const betValues = []
    // 0.1 -> 0.2 | 0.3 | 0.4 | 0.5 | 0.6 | 0.7 | 0.8 | 0.9 | 1
    // 1 -> 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
    // 10 -> 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90 | 100
    // 100 -> 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 1000

    // добавляем первый ряд отдельно (десятые)
    // for (let i = 1; i < 10; i++) {
    //   betValues.push(i / 10)
    // }

    // // остальные ряды
    // for (let pow = 0; pow < 3; pow++) {
    //   for (let i = 1; i < 10; i++) {
    //     betValues.push(i * 10 ** pow)
    //   }
    // }

    const rows = [
      { start: 0.1, step: 0.1, count: 9 },
      { start: 1, step: 1, count: 9 },
      { start: 10, step: 5, count: 18 },
      { start: 100, step: 10, count: 91 },
    ]

    for (const row of rows) {
      for (let i = 0; i < row.count; i++) {
        betValues.push(Number((row.start + i * row.step).toFixed(2)))
      }
    }
    console.table(betValues)

    // this.sliderBet = new RiskSlider(
    //   this,
    //   this.sceneCenterX,
    //   10 * this.gridUnit,
    //   '',
    //   betValues[0],
    //   betValues[betValues.length - 1]
    // )

    // this.sliderBet.show = (state) => {
    //   this.sliderBet.container.setVisible(state)
    //   this.sliderBet.button.setInteractive(state)
    //   if (!state && this.input.dragState) {
    //     this.input.stopDrag(this.sliderBet.button)
    //   }
    // }

    // // Делаем кнопку draggable
    // this.input.setDraggable(this.sliderBet.button)

    // // Слушаем drag-событие
    // this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
    //   if (gameObject !== this.sliderBet.button) return
    //   if (!this.betAllowed) return

    //   // Находим локальные координаты
    //   const local = this.sliderBet.container.getLocalPoint(pointer.x, pointer.y)

    //   // Ограничиваем по оси
    //   this.sliderBet.button.x = Phaser.Math.Clamp(
    //     local.x,
    //     this.sliderBet.min,
    //     this.sliderBet.max
    //   )

    //   // Получаем нормализованное значение (0..1)
    //   const norm = getSliderValue(this.sliderBet)

    //   // Преобразуем в дискретное (если хочешь)
    //   const index = Math.round(norm * (betValues.length - 1))
    //   const discreteValue = betValues[index]

    //   // console.log('Selected value:', discreteValue)
    //   if (this.currentBetValue !== discreteValue) {
    //     this.currentBetValue = discreteValue
    //     // console.log('Selected discrete value:', discreteValue)
    //     onSliderValueChange(discreteValue)
    //   }
    //   // onSliderValueChange(discreteValue)
    // })

    // const onSliderValueChange = (value) => {
    //   // console.log('Selected discrete value:', value)
    //   this.stakeCounter.setText(value.toFixed(2))
    // }

    // const setSlider = (value) => {
    //   const index = betValues.indexOf(value)
    //   if (index === -1) return

    //   const norm = index / (betValues.length - 1)
    //   // console.log('Setting slider value:', norm)
    //   setSliderValue(this.sliderBet, norm)
    // }
    // setSlider(this.currentBetValue)

    // new
    this.sliderBet = new BetSlider(
      this,
      this.sceneCenterX,
      10 * this.gridUnit,
      betValues,
      (value) => {
        this.currentBetValue = value
        this.stakeCounter.setText(value.toFixed(2))
      }
    )

    this.sliderBet.setValue(this.currentBetValue)
    // this.sliderBet.show(true)
    // this.sliderBet.setActive(this.betAllowed)
  }
  createMoneyCounter() {
    // this.add
    //   .text(370, 40, '$$', {
    //     font: '40px walibi',
    //     fill: 'yellow', // цвет '#FC03B5'
    //     // stroke: 'black', // обводка
    //     // strokeThickness: 6, // толщина обводки
    //   })
    //   .setOrigin(0.5)
    this.skull = this.add
      .image(400, 0, 'skull')
      .setOrigin(0.5, 0)
      .setScale(1)
      .setAlpha(1)
      .setDepth(220)

    this.skull.shake = () => {
      this.tweens.add({
        targets: this.skull,
        scale: 1.1, // ширина экрана
        repeat: 2,
        duration: 20,
        yoyo: true,
      })
    }

    this.moneyCounter = this.add
      .text(450, 40, this.deposit.toFixed(2), {
        font: '24px walibi',
        fill: 'white', // цвет '#FC03B5'
        // stroke: 'black', // обводка
        // strokeThickness: 6, // толщина обводки
      })
      .setOrigin(0, 0.5)
      .setAlign('left')
      .setAlpha(1)
      .setDepth(210)

    this.moneyCounterUpdate = function (value) {
      if (value) {
        this.deposit += value // добавляем к ставке
      } else {
        // this.moneyCounter
      }
      this.moneyCounter.setText(this.deposit.toFixed(2))
      if (value > 0) this.skull.shake()
    }
  }
  createSounds() {
    this.sounds = {
      // fone: this.sound.add('fone1', {
      //   // volume: 0.01,
      //   loop: true,
      //   delay: 5000,
      // }),
      heart: this.sound.add('heart', {
        volume: 0.2,
      }),
      dropCoin: this.sound.add('dropCoin', {
        volume: 0.2,
      }),
    }
  }
  createParticles() {
    this.emitter = this.add.particles(
      0,
      0, // стартовая позиция, не важна — мы двигаем emitter потом
      'yellow',
      {
        speed: 500,
        lifespan: 500,
        scale: { start: 2, end: 0 },
        blendMode: 'ADD',
        emitting: false,
      }
    )
  }
  update(time, delta) {}

  // FSM setup
  setupFSMHandlers() {
    this.fsm.onChange((state) => {
      // console.log('FSM state:', state)
      switch (state) {
        case 'COUNTDOWN':
          // this.handleCountdown()
          this.countdown()
          break
        case 'ROUND':
          // this.handleRunning()
          this.round()
          break
        case 'FINISH':
          this.finish()
          break
      }
    })
  }
  // round machine
  countdown() {
    // console.time('Time to betting')
    //
    this.stakeCounterUpdate() // не здесь...
    this.stakeCounter.clearTint()

    // this.betAllowed = true // разрешаем ставить
    // this.sliderBet.setActive(this.betAllowed)

    this.setBetAllowed(true)

    if (this.pendingRiskSetting) {
      this.handleNewSettings(this.pendingRiskSetting)
      this.platforms.updatePlatforms(this.crashTable)
    }

    let countDown = 8
    let roundPrepareDelay = 3000 // подбор на 6 - 1500
    let roundStartDelay = countDown - roundPrepareDelay / 1000
    // countDown
    this.time.addEvent({
      delay: 1000,
      callback: () => {
        countDown--
        if (countDown == 0) {
          this.setBetAllowed(false)
          // this.betAllowed = false
          // this.sliderBet.setActive(this.betAllowed)

          this.startCounterUpdate('GO!')
          // спрятать GO
          this.time.addEvent({
            delay: 500,
            callback: () => {
              this.startCounterShow(false)
            },
          })
        } else {
          this.startCounterUpdate(countDown)
          this.startCounterShow(true)
        }
      },
      repeat: countDown - 1,
    })
    // round start after...
    this.time.addEvent({
      delay: roundPrepareDelay,
      callback: () => {
        this.roundPrepare(roundStartDelay)
        // this.fsm.toRound()
      },
    })
  }
  roundPrepare(roundStartDelay) {
    this.platforms.movePlatforms()
    this.ball.reset()

    this.time.addEvent({
      delay: this.duration * (this.platforms.hiddingCount + roundStartDelay),
      callback: () => {
        this.initCrashIndex() // хранить на сервере, запрашивать isCrash каждое касание (за 100 мс)

        this.isCrashed = false
        this.bounceCount = 0

        this.background.move()
        this.roundCounter++
        this.moneyCounterUpdate(-this.currentBetValue)

        this.events.emit('round', true) // нужно?
        // this.betAllowed = false
        this.fsm.toRound()
      },
    })
  }
  round() {
    // console.timeEnd('Time to betting')
    // console.time('Round time')
    this.ball.fall(() => {
      this.bounceHandler()
    })
  }
  bounceHandler() {
    // console.log('bounceHandler')
    this.checkCrash(this.bounceCount)
    // ещё надо чекать последнюю платформу
    if (this.isCrashed) this.fsm.toFinish()
    else {
      this.platforms.hidePlatform(this.bounceCount)
      this.stakeCounterUpdate(this.crashTable[this.bounceCount].multiplier)
      this.bounceCount++
      this.platforms.moveNextPlatforms(this.bounceCount)
      // на новый цикл
      this.ball.bounce(() => {
        this.bounceHandler()
      })
      // кнопку в отдельный модуль и добавить BET
      if (this.bounceCount === 1 && !this.allowCashOut) {
        this.allowCashOut = true // нужно после первой платформы (или второй?)
        // this.events.emit('allowCashOutChanged', this.allowCashOut)
      }
    }
  }
  finish() {
    // console.timeEnd('round duration')
    this.stopMoving(this.bounceCount)
    this.sounds.dropCoin.play()
    this.allowCashOut = false
    this.events.emit('round', false) // нужно?
    // this.countdown()
    this.time.addEvent({
      delay: 1500,
      callback: () => {
        // console.timeEnd('Round time')
        this.fsm.toCountdown()
      },
    })
  }
  // вспомогательные методы
  setBetAllowed(state) {
    if (this.betAllowed === state) return
    this.betAllowed = state
    this.sliderBet.setActive(state)
  }
  handleNewSettings(settings) {
    this.currentRiskSetting = { ...settings }
    this.crashTable = this.generateCrashTable(this.currentRiskSetting)
    this.newRiskSettingNotice.show(settings)
    this.pendingRiskSetting = null
  }
  initCrashIndex() {
    let random = Math.random()
    // random = 0.9999999999999 // dev
    let multiplier = null
    let index = 0
    let acc = 0
    function getCrashIndex(crashTable) {
      for (let i = 0; i < crashTable.length; i++) {
        // acc += crashTable[i].probability
        if (random < crashTable[i].acc) {
          acc = crashTable[i].acc
          multiplier = crashTable[i].multiplier
          index = i
          return i
        }
      }
      // return crashTable.length // fallback - проверить
    }
    this.crashIndex = getCrashIndex(this.crashTable) // следующий будет краш!
    this.crashIndex > 0 ? (this.crashIndex += 1) : 0
    // console.log(
    //   'random',
    //   random,
    //   'acc',
    //   acc,
    //   'index',
    //   index,
    //   'crashIndex',
    //   this.crashIndex,
    //   'multiplier',
    //   multiplier
    // )
    return this.crashIndex
  }
  checkCrash() {
    // console.log('checkCrash', this.bounceCount)
    // логика проверки краша:
    // до касания платформы делаем запрос на сервер с номером подходящей платформы
    // isCrash?
    // если да, крашим
    if (this.bounceCount >= this.crashIndex) {
      // console.log('CRASH!')
      this.isCrashed = true
      this.ball.setTint(0xff0000)
      //   return this.isCrashed
    }
  }
  stopMoving(bounceCount) {
    // this.stopBall()
    this.ball.stop()
    this.platforms.hideAndResetPlatforms(bounceCount)
    // this.stopBack()
    this.background.stop()
  }

  // вынести на сервер
  generateCrashTable(crashSetting) {
    // console.log('crashSetting', crashSetting)

    const ratio = Math.pow(
      crashSetting.maxPayout / crashSetting.minPayout,
      1 / (crashSetting.steps - 2)
    )
    // console.log('ratio', ratio)

    const RTP = 1 - this.houseEdge / 100

    let acc = 0

    const crashTable = []

    for (let i = 0; i < crashSetting.steps; i++) {
      let multiplier, base
      if (i === 0) {
        multiplier = 0
        base = 0
      } else {
        multiplier = crashSetting.minPayout * Math.pow(ratio, i - 1)
        base = RTP / multiplier
      }

      crashTable.push({
        step: i,
        multiplier,
        probability: undefined,
        acc: undefined,
        base,
      })
    }

    for (let i = crashTable.length - 1; i >= 0; i--) {
      // console.log(i, 'обратка', i, crashTable[i].multiplier)
      if (i < crashTable.length - 1 && i !== 0) {
        crashTable[i].probability = crashTable[i].base - crashTable[i + 1].base
      } else {
        crashTable[i].probability = crashTable[i].base
      }
      crashTable[i].acc = 1 - acc
      acc += crashTable[i].probability
      if (i === 0) crashTable[i].probability = 1 - acc
    }

    // console.table(crashTable)
    // dev
    // this.checkMath(crashTable)
    return crashTable
  }
  checkMath(crashTable) {
    const roundCount = 1000000
    const result = []
    let RTP = 0

    for (let index = 1; index < crashTable.length; index++) {
      const playerChoice = crashTable[index].multiplier
      let winCount = 0
      let x1 = 0

      for (let ind = 0; ind < roundCount; ind++) {
        let acc = 0
        let multiplier = 0
        let random = Math.random() // первый на х1 краш

        for (let i = 0; i < crashTable.length; i++) {
          // можно один раз зафиксировать асс и не считать
          // let half = this.crashTable[i].probability * 0.5 // половина
          // if (i === 0) acc += this.crashTable[i].probability
          // else acc += half
          // acc += this.crashTable[i].probability

          if (random < crashTable[i].acc) {
            multiplier = crashTable[i].multiplier
            if (playerChoice <= multiplier) {
              winCount++
            }
            if (multiplier === 0) x1++
            break
          }
          // if (i > 0) acc += half
        }
      }
      let rtp = ((winCount * playerChoice) / roundCount) * 100
      RTP += rtp
      result.push({
        index,
        Crashes: x1,
        playerChoice,
        winCount,
        win: winCount * playerChoice,
        'RTP %': rtp,
      })
    }
    console.table(result)
    console.log('ave RTP', RTP / (crashTable.length - 1))
  }
}
