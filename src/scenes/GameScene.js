import { DEFAULT_RISK_SETTING } from '../constants/riskConstants'
import { Background } from '../comps/Background'
import { RiskTunerPanel } from '../comps/RiskTuner/RiskTunerPanel'
import { Panel } from '../comps/Auto/Panel'

import { BetValues } from '../comps/Bet/BetValues'

import { Ball } from '../comps/Ball'
import { Platforms } from '../comps/Platforms'
import { FSM } from '../comps/FSM'
import { GameControlPanel } from '../comps/GameControlPanel'
import { on } from 'ws'

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('Game')
  }
  preload() {}
  init() {
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

    this.betValues = BetValues // dev
    this.initialBet = 10 // начальная ставка
    this.currentBetValue = this.initialBet // текущая ставка
    this.pendingBetValue = null // для проверки ставки перед началом раунда

    this.bounceCount = 0 // отскоков

    this.initialDeposit = 10000 // начальная ставка
    this.currentDeposit = this.initialDeposit // начальная сумма

    this.stakeValue = 0 // ставка начальная пока

    this.hasCashOut = false
    this.cashOutAllowed = false // разрешить клик по кнопке "вывести деньги"
    this.hasBet = false
    this.betAllowed = false

    this.roundCounter = 0 // счетчик раундов

    this.houseEdge = 1

    this.defaultRiskSetting = DEFAULT_RISK_SETTING
    this.currentRiskSetting = { ...DEFAULT_RISK_SETTING }

    // на сервере!!!
    this.crashTable = this.generateCrashTable(this.defaultRiskSetting)
    // dev
    // this.checkMath(this.crashTable)
    this.tweens.timeScale = 1
  }
  create() {
    this.background = new Background(this)
    this.createUI() // dev
    this.createParticles() // эммитер передается в Ball

    this.createStartCounter()
    this.createMoneyCounter()

    this.ball = new Ball(this, this.emitter)
    this.platforms = new Platforms(this)
    this.platforms.updatePlatforms(this.crashTable)

    this.riskTuner = new RiskTunerPanel(this, this.defaultRiskSetting)
    this.autoSetting = new Panel(this, this.defaultRiskSetting)

    this.gameControlPanel = new GameControlPanel(this, {
      onCash: () => this.handleButtonClick(),
      onTuner: () => this.riskTuner.show(true),
      onAuto: () => this.autoSetting.show(true),
    })

    if (!this.sounds) this.createSounds()

    this.createEvents()

    this.fsm = new FSM()
    this.setupFSMHandlers()
    this.fsm.toCountdown()

    // dev
    // this.createGrid()
  }
  handleButtonClick() {
    // console.log('handleButtonClick', this.cashOutAllowed)
    const state = this.fsm.getState()
    // console.log('handleButtonClick', state)
    if (state === 'COUNTDOWN' && !this.hasBet) {
      // console.log('handleButtonClick bet')
      this.moneyCounterUpdate(-this.currentBetValue)
      this.hasBet = true
      this.setBetAllowed(false)
      this.events.emit('gameAction', {
        mode: 'BET',
      })
    }

    if (
      state === 'ROUND' &&
      this.cashOutAllowed &&
      this.hasBet &&
      !this.hasCashOut
    ) {
      // обработка вывода денег
      this.setCashOutAllowed(false)

      this.hasCashOut = true
      this.sounds.heart.play()
      this.moneyCounterUpdate(this.stakeValue) // event

      this.events.emit('gameAction', {
        mode: 'CASHOUT',
        hasCashOut: this.hasCashOut,
        stakeValue: this.stakeValue,
      })

      this.stakeValue = 0
    }
  }
  createEvents() {
    this.events.on('riskTuner:apply', (newRiskSetting) => {
      // console.log('[GameScene] riskTuner:apply', newRiskSetting)
      this.pendingRiskSetting = { ...newRiskSetting }
      this.newRiskSettingNotice.show()
    })

    this.events.on('betChanged', (value) => {
      // console.log('[GameScene] betChanged', value, this.betAllowed)
      if (this.betAllowed) {
        this.currentBetValue = value
        // console.log('[GameScene] betChanged', value)
        this.events.emit('gameAction', {
          mode: 'BET_CHANGED',
          betValue: this.currentBetValue,
        })
      }
    })
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

    // this.gridUnit * 1.3
    this.newRiskSettingNotice = this.add
      .text(this.sceneCenterX, this.gridUnit * 9, '', {
        fontSize: '24px',
        color: '#FDD41D',
        fontFamily: 'Courier',
      })
      .setOrigin(0.5, 0)
      .setAlign('center')
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
          `${text} ${setting.minPayout} -> ${setting.maxPayout} | ${setting.steps}`

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
      .text(450, 40, this.currentDeposit.toFixed(2), {
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
        this.currentDeposit += value // добавляем к ставке
      } else {
        // this.moneyCounter
      }
      // депозит не может быть меньше нуля (var1)
      if (this.currentDeposit <= 0)
        this.currentDeposit = this.initialDeposit + this.currentDeposit
      // или не меньше максимальной ставки (var2)
      // if (this.currentDeposit <= this.betValues[this.betValues.length - 1])
      //   this.currentDeposit = this.initialDeposit

      this.moneyCounter.setText(this.currentDeposit.toFixed(2))
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
          this.events.emit('gameState', {
            mode: 'COUNTDOWN',
            betValue: this.currentBetValue,
          })
          this.countdown()
          break
        case 'ROUND':
          this.events.emit('gameState', {
            mode: 'ROUND',
            hasBet: this.hasBet,
          })
          this.round()
          break
        case 'FINISH':
          this.events.emit('gameState', {
            mode: 'FINISH',
            hasBet: this.hasBet,
            hasCashOut: this.hasCashOut,
            cashOutAllowed: this.cashOutAllowed,
            stakeValue: this.stakeValue,
          })
          this.finish()
          break
      }
    })
  }
  // round machine
  countdown() {
    // console.time('Time to betting')
    if (this.pendingBetValue) {
      // можно проверить предварительную ставку
    }

    this.hasBet = false
    this.hasCashOut = false
    this.setBetAllowed(true)

    if (this.pendingRiskSetting) {
      this.handleNewSettings(this.pendingRiskSetting)
      this.platforms.updatePlatforms(this.crashTable)
    }
    this.stakeValue = 0 // здесь??

    let countDown = 8
    let roundPrepareDelay = 3000 // подбор на 6 - 1500
    let roundStartDelay = countDown - roundPrepareDelay / 1000
    // countDown
    this.time.addEvent({
      delay: 1000,
      callback: () => {
        countDown--
        if (countDown == 0) {
          // this.setBetAllowed(false)

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
        // this.moneyCounterUpdate(-this.currentBetValue)

        this.fsm.toRound()
      },
    })
  }
  round() {
    // console.timeEnd('Time to betting')
    // console.time('Round time')
    // console.log('round', this.stakeValue)
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
      const multiplier = this.crashTable[this.bounceCount].multiplier
      this.stakeValue = this.currentBetValue * multiplier

      this.events.emit('gameAction', {
        mode: 'BOUNCE',
        count: this.bounceCount,
        multiplier: multiplier,
        stakeValue: this.stakeValue,
        hasBet: this.hasBet,
      })
      // this.stakeCounterUpdate(this.crashTable[this.bounceCount].multiplier)

      // платформы ловят эвент сам
      this.platforms.hidePlatform(this.bounceCount)
      this.bounceCount++
      this.platforms.moveNextPlatforms(this.bounceCount)
      // на новый цикл
      this.ball.bounce(() => {
        this.bounceHandler()
      })
      // кнопку в отдельный модуль и добавить BET
      if (this.bounceCount === 1 && !this.cashOutAllowed) {
        // this.cashOutAllowed = true // нужно после первой платформы (или второй?)
        this.setCashOutAllowed(true)
      }
    }
  }
  finish() {
    // console.log('this.cashOutAllowed', this.cashOutAllowed)

    this.stopMoving(this.bounceCount)
    this.sounds.dropCoin.play()
    this.setCashOutAllowed(false)

    this.time.addEvent({
      delay: 1500,
      callback: () => {
        // console.timeEnd('Round time')
        this.fsm.toCountdown()
      },
    })
  }
  // вспомогательные методы
  setCashOutAllowed(state) {
    if (this.cashOutAllowed === state) return
    this.cashOutAllowed = state
    this.events.emit('gameAction', {
      mode: 'CASHOUT_ALLOWED',
      cashOutAllowed: state,
      hasBet: this.hasBet,
    })
  }
  setBetAllowed(state) {
    if (this.betAllowed === state) return
    this.betAllowed = state
    this.events.emit('gameAction', {
      mode: 'BET_ALLOWED',
      betAllowed: state,
    })
  }
  handleNewSettings(settings) {
    this.currentRiskSetting = { ...settings }
    this.crashTable = this.generateCrashTable(this.currentRiskSetting)
    this.newRiskSettingNotice.show(settings)
    this.pendingRiskSetting = null
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
}
