import { DEFAULT_RISK_SETTING } from '../constants/riskConstants'
import { DEFAULT_AUTOBET_SETTING } from '../constants/autobetConstants'
import { DEFAULT_GAME_CONFIG } from '../constants/defaultGameConfig'

import { Background } from '../comps/Background'
import { RiskTunerPanel } from '../comps/RiskTuner/RiskTunerPanel'
import { AutoPanel } from '../comps/Auto/AutoPanel'

import { CashoutChart } from '../comps/CashoutChart.js'
import { BetValues } from '../comps/Bet/BetValues'
import { BotManager } from '../comps/BotManager'
import { RiskSettingNotice } from '../comps/RiskSettingNotice'
import { CountdownCounter } from '../comps/CountdownCounter'
import { MoneyCounter } from '../comps/MoneyCounter'
import { Skull } from '../comps/Skull'
import { Ball } from '../comps/Ball'
import { Platforms } from '../comps/Platforms'
import { FSM } from '../comps/FSM'
import { GameControlPanel } from '../comps/GameControlPanel'
// import { on } from 'ws'

import { DevUI } from '../comps/DevUI'
import { LiveOpsManager } from '../liveOps/LiveOpsManager'
// import { GhostGroup } from '../comps/GhostGroup.js'
import { Ghost } from '../comps/Ghost'
import { CameraManager } from '../comps/Camera/CameraManager'

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('Game')
  }
  preload() {}
  init() {
    // GAME STATE
    this.isCrashed = false
    this.roundCounter = 0
    this.bounceCount = 0
    this.quickMode = DEFAULT_GAME_CONFIG.quickMode

    // DIMENSIONS
    this.gridUnit = 80
    this.sceneCenterX = this.cameras.main.centerX
    this.ballX = 160
    this.ballY = 240
    this.platformY = this.gridUnit * 8.5
    this.distanceY = this.platformY - this.ballY
    this.buttonY = 11.5 * this.gridUnit
    this.buttonNameSpacing = 60
    this.buttonIndent = 120
    this.labelColor = '#13469A'
    this.duration = 500

    // STAKES & BALANCE
    this.betValues = BetValues
    this.initialBet = DEFAULT_GAME_CONFIG.initialBet
    this.currentBetValue = this.initialBet
    this.pendingBetValue = null
    this.initialDeposit = DEFAULT_GAME_CONFIG.initialDeposit
    this.currentDeposit = this.initialDeposit
    this.stakeValue = 0

    // FLAGS
    this.hasBet = false
    this.hasCashOut = false
    this.cashOutAllowed = false
    this.betAllowed = false

    // AUTOBET & RISK SETTINGS
    this.houseEdge = 1 // server

    this.defaultRiskSetting = DEFAULT_RISK_SETTING
    this.currentRiskSetting = { ...DEFAULT_RISK_SETTING }

    this.defaultAutoSetting = DEFAULT_AUTOBET_SETTING
    this.currentAutoSetting = { ...DEFAULT_AUTOBET_SETTING }

    // TWEENS (DEV)
    this.tweens.timeScale = 1
    this.rnd = Phaser.Math.RND
    this.smallShakeX = 5
    this.medShakeX = 20

    // Camera
    this.camWidget = null
    this.camNeedTap = false
    this.camHint = null
  }
  create() {
    this.background = new Background(this)
    // dev
    this.devUI = new DevUI(this)
    this.cashoutChart = new CashoutChart(this)
    // this.liveOps = new LiveOpsManager(this) // нужно изучить
    this.ghost = new Ghost(this)

    this.header = this.add
      .image(0, 0, 'header')
      .setOrigin(0)
      .setAlpha(1)
      .setScale(1)
      .setDepth(200)

    this.createParticles() // эммитер передается в Ball

    this.countdownCounter = new CountdownCounter(this)
    this.moneyCounter = new MoneyCounter(this, this.initialDeposit)
    this.skull = new Skull(this)
    this.ball = new Ball(this, this.emitter, this.bounceHandler.bind(this))
    this.platforms = new Platforms(this, this.crashTable)

    this.riskTuner = new RiskTunerPanel(this, this.defaultRiskSetting)
    this.riskSettingNotice = new RiskSettingNotice(this)

    this.autoSetting = new AutoPanel(this, this.defaultAutoSetting)

    // this.botManager = new BotManager(this, this.betValues)

    this.gameControlPanel = new GameControlPanel(this, {
      onCash: () => this.handleButtonClick(),
      onTuner: () => this.riskTuner.show(true),
      onAuto: () => this.autoSetting.show(true, this.currentAutoSetting),
    })

    if (!this.sounds) this.createSounds()

    this.createEvents()

    this.handleRiskSettings(this.currentRiskSetting)

    this.fsm = new FSM()
    this.setupFSMHandlers()

    // start loop
    // в реале нужно дождаться от сервера таблицу множителей
    // и команду на старт раунда
    this.fsm.toCountdown()

    this.cameraManager = new CameraManager(this)
    // this.cameraManager.start() // метод работает, но нужно настраивать стоп и запись

    // Камера 400x300 в левом верхнем углу
    // this.camWidget = new CameraWidget(this, 20, 20)
    // this.camWidget
    //   .start()
    //   .then(() => {
    //     // камера успешно запустилась
    //   })
    //   .catch(() => {
    //     // нужен тап (iOS / autoplay policy)
    //     this.camNeedTap = true
    //     this.camHint = this.add.text(24, 330, 'Tap to enable camera', {
    //       font: '18px Arial',
    //       color: '#ff6666',
    //     })
    //     this.input.once('pointerdown', () => {
    //       this.camWidget
    //         .start()
    //         .then(() => {
    //           this.camNeedTap = false
    //           this.camHint && this.camHint.destroy()
    //         })
    //         .catch((err) => console.warn('[Camera] start error', err))
    //     })
    //   })

    // // Хоткей на перезапуск
    // this.input.keyboard?.on('keydown-R', () => {
    //   this.camWidget && this.camWidget.destroy()
    //   this.camWidget = new CameraWidget(this, 20, 20, 400, 300)
    //   this.camWidget.start().catch((err) => console.warn(err))
    // })
  }
  handleButtonClick() {
    // console.log('handleButtonClick')
    const state = this.fsm.getState()
    // console.log('handleButtonClick', state)
    if (state === 'COUNTDOWN' && !this.hasBet) {
      this.handleBet()
      return
    }

    if (
      state === 'ROUND' &&
      this.cashOutAllowed &&
      this.hasBet &&
      !this.hasCashOut
    ) {
      this.handleCashout('manual')
      return
    }
  }
  handleBet() {
    this.hasBet = true
    this.setBetAllowed(false)

    this.currentDeposit -= this.currentBetValue
    if (this.currentDeposit <= 0)
      this.currentDeposit = this.initialDeposit + this.currentDeposit

    this.events.emit('gameEvent', {
      mode: 'BET',
      bet: this.currentBetValue,
      deposit: this.currentDeposit,
    })
  }
  handleCashout(method) {
    // console.log('handleCashout method', method)
    this.setCashOutAllowed(false)

    this.hasCashOut = true
    this.sounds.cashout.play()
    // если выход после 0, то нужно что-то менять...
    if (this.stakeValue <= 0) {
      // что-то странное
      this.stakeValue = this.currentBetValue //
    }

    this.currentDeposit += this.stakeValue // добавляем к депозиту

    this.events.emit('gameEvent', {
      mode: 'CASHOUT',
      hasCashOut: this.hasCashOut,
      stakeValue: this.stakeValue,
      deposit: this.currentDeposit,
      method,
    })

    this.stakeValue = 0
  }
  createEvents() {
    this.events.on('riskTuner:apply', (newRiskSetting) => {
      // console.log('[GameScene] riskTuner:apply', newRiskSetting)
      this.pendingRiskSetting = { ...newRiskSetting }
      this.events.emit('gameEvent', {
        mode: 'RISK_SETTING_PENDING',
        // betValue: this.currentBetValue,
      })
    })
    this.events.on('autoBetting:apply', (newSetting) => {
      // console.log('[GameScene] autoBetting:apply', newSetting)
      this.handleAutoSetting(newSetting)
      // this.pendingAutoSetting = { ...newSetting }
      // this.events.emit('gameEvent', {
      //   mode: 'AUTO_SETTING_PENDING',
      //   // betValue: this.currentBetValue,
      // })
    })
    this.events.on('betChanged', (value) => {
      // console.log('[GameScene] betChanged', value, this.betAllowed)
      if (this.betAllowed) {
        this.currentBetValue = value
        // console.log('[GameScene] betChanged', value)
        this.events.emit('gameEvent', {
          mode: 'BET_CHANGED',
          betValue: this.currentBetValue,
        })
      }
    })
    this.game.events.on(Phaser.Core.Events.BLUR, () => this.scene.pause())
    this.game.events.on(Phaser.Core.Events.FOCUS, () => this.scene.resume())
  }
  createSounds() {
    this.sounds = {
      // fone: this.sound.add('fone1', {
      //   // volume: 0.01,
      //   loop: true,
      //   delay: 5000,
      // }),
      cashout: this.sound.add('cashout', {
        volume: 0.2,
      }),
      crash: this.sound.add('crash', {
        volume: 0.2,
      }),
      coin: this.sound.add('coin', {
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
  createGradientTexture(key, color, width, height) {
    const canvas = this.textures.createCanvas(key, width, height)
    const ctx = canvas.getContext()

    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, `rgba(${color}, 0.5)`)
    gradient.addColorStop(1, `rgba(${color}, 0)`)

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
    canvas.refresh()
  }
  update(time, delta) {
    // if (this.camWidget && this.camWidget.ready) {
    //   this.camWidget.update()
    // }
    // this.cameraManager?.update()
  }

  // FSM setup
  setupFSMHandlers() {
    this.fsm.onChange((state) => {
      // console.log('FSM state:', state)
      switch (state) {
        case 'COUNTDOWN':
          this.events.emit('gameEvent', {
            mode: 'COUNTDOWN',
            betValue: this.currentBetValue,
          })
          this.countdown()
          break
        case 'ROUND':
          this.events.emit('gameEvent', {
            mode: 'ROUND',
            hasBet: this.hasBet,
          })
          this.round()
          break
        case 'FINISH':
          this.events.emit('gameEvent', {
            mode: 'FINISH',
            hasBet: this.hasBet,
            hasCashOut: this.hasCashOut,
            cashOutAllowed: this.cashOutAllowed,
            stakeValue: this.stakeValue,
            count: this.bounceCount,
          })
          this.finish()
          break
      }
    })
  }
  // round machine
  countdown() {
    // console.time('Time to betting')

    this.setBetAllowed(true)
    this.hasCashOut = false
    this.hasBet = false
    this.stakeValue = 0

    if (this.pendingRiskSetting)
      this.handleRiskSettings(this.pendingRiskSetting)

    // if (this.pendingAutoSetting) this.handleAutoSetting(this.pendingAutoSetting)
    if (this.currentAutoSetting.rounds > 0) this.quickMode = true
    else this.quickMode = false

    let countDown = 6
    if (this.quickMode) countDown = 4

    let roundPrepareDelay = countDown * 1000 - 4000
    let roundStartDelay = 4

    let text = ''
    // countDown
    this.time.addEvent({
      delay: 1000,
      callback: () => {
        countDown--
        text = countDown.toString()

        if (countDown === 0) {
          text = 'GO!'
          // спрятать GO
          this.time.addEvent({
            delay: 500,
            callback: () => {
              this.events.emit('gameEvent', {
                mode: 'COUNTDOWN_UPDATE',
                text: '',
                show: false,
              })
            },
          })
        }
        this.events.emit('gameEvent', {
          mode: 'COUNTDOWN_UPDATE',
          text: text,
          show: true,
        })
      },
      repeat: countDown - 1,
    })
    // round start after...
    this.time.addEvent({
      delay: roundPrepareDelay,
      callback: () => {
        this.roundPrepare(roundStartDelay)
      },
    })
  }
  roundPrepare(roundStartDelay) {
    this.events.emit('gameEvent', {
      mode: 'ROUND_PREPARE',
    })

    this.time.addEvent({
      delay: this.duration * (this.platforms.hiddingCount + roundStartDelay),
      callback: () => {
        this.initCrashIndex() // хранить на сервере, запрашивать isCrash каждое касание (за 100 мс)

        this.isCrashed = false
        this.bounceCount = 0
        this.roundCounter++

        // if (this.pendingAutoSetting)
        //   this.handleAutoSetting(this.pendingAutoSetting)

        // автоигра
        if (this.currentAutoSetting.rounds > 0 && !this.hasBet) {
          this.currentAutoSetting.rounds-- // слишком просто?
          // console.log('currentAutoSetting', this.currentAutoSetting.rounds)
          if (this.currentAutoSetting.rounds === 0)
            this.handleAutoSetting(this.currentAutoSetting)
          this.handleBet()
        }

        this.fsm.toRound()
      },
    })
  }
  round() {
    // console.timeEnd('Time to betting')
    // console.time('Round time')
    // console.log('round', this.stakeValue)
  }
  bounceHandler() {
    // console.log('bounceHandler')
    this.checkCrash(this.bounceCount)
    // ещё надо чекать последнюю платформу
    if (this.isCrashed) this.fsm.toFinish()
    else {
      const multiplier = this.crashTable[this.bounceCount].multiplier
      this.stakeValue = this.currentBetValue * multiplier

      this.events.emit('gameEvent', {
        mode: 'BOUNCE',
        count: this.bounceCount,
        multiplier: multiplier,
        stakeValue: this.stakeValue,
        hasBet: this.hasBet,
      })

      if (this.bounceCount === 0 && !this.cashOutAllowed)
        this.setCashOutAllowed(true)

      if (this.currentAutoSetting.cashout > 0) this.checkAutoCashout(multiplier)

      this.bounceCount++
      // this.sounds.coin.play()

      // dev
      // if (multiplier >= this.smallShakeX && multiplier < this.medShakeX)
      //   this.cameras.main.shake(100, 0.002)
      if (multiplier >= this.medShakeX) this.cameras.main.shake(100, 0.002)
    }
  }
  finish() {
    // console.log('this.cashOutAllowed', this.cashOutAllowed)
    this.sounds.crash.play()
    this.setCashOutAllowed(false)

    this.time.addEvent({
      delay: 2000,
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

    this.events.emit('gameEvent', {
      mode: 'CASHOUT_ALLOWED',
      cashOutAllowed: state,
      hasBet: this.hasBet,
    })
  }
  setBetAllowed(state) {
    if (this.betAllowed === state) return
    this.betAllowed = state

    this.events.emit('gameEvent', {
      mode: 'BET_ALLOWED',
      betAllowed: state,
    })
  }
  handleAutoSetting(settings) {
    this.currentAutoSetting = { ...settings }
    this.pendingAutoSetting = null

    this.events.emit('gameEvent', {
      mode: 'AUTO_SETTING_CHANGED',
      default: this.defaultAutoSetting,
      current: this.currentAutoSetting,
    })
  }
  handleRiskSettings(settings) {
    this.currentRiskSetting = { ...settings }
    this.crashTable = this.generateCrashTable(this.currentRiskSetting)
    this.pendingRiskSetting = null

    this.events.emit('gameEvent', {
      mode: 'RISK_SETTING_CHANGED',
      default: this.defaultRiskSetting,
      current: this.currentRiskSetting,
      crashTable: this.crashTable,
    })
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
    }
  }
  checkAutoCashout(multiplier) {
    if (
      this.cashOutAllowed &&
      this.hasBet &&
      !this.hasCashOut &&
      this.currentAutoSetting.cashout <= multiplier
    )
      this.handleCashout('auto')
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
        multiplier = 1
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
    random = 0.99 // dev
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
