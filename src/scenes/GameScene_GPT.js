// GameScene.js — аккуратная версия (только сцена)
// Основные изменения:
// - Чёткая структура: константы → типы/enum → класс со сгруппированными секциями
// - Магические числа вынесены в константы
// - Приватные поля через соглашение _name (остаемся в JS)
// - Публичный API не менялся (события и методы)
// - Логика таймеров и FSM стала компактнее и читаемее

import { DEFAULT_RISK_SETTING } from '../constants/riskConstants'
import { DEFAULT_AUTOBET_SETTING } from '../constants/autobetConstants'
import { DEFAULT_GAME_CONFIG } from '../constants/defaultGameConfig'

import { Background } from '../comps/Background'
import { RiskTunerPanel } from '../comps/RiskTuner/RiskTunerPanel'
import { AutoPanel } from '../comps/Auto/AutoPanel'
import { CashoutChart } from '../comps/CashoutChart.js'
import { BetValues } from '../comps/Bet/BetValues'
import { RiskSettingNotice } from '../comps/RiskSettingNotice'
import { CountdownCounter } from '../comps/CountdownCounter'
import { MoneyCounter } from '../comps/MoneyCounter'
import { Skull } from '../comps/Skull'
import { Ball } from '../comps/Ball'
import { Platforms } from '../comps/Platforms'
import { FSM } from '../comps/FSM'
import { GameControlPanel } from '../comps/GameControlPanel'
import { DevUI } from '../comps/DevUI'

// =========================
// Константы
// =========================
const SCENE_KEY = 'Game'
const DEPTH = { HEADER: 200 }
const UI_COLOR = '#13469A'

const GRID_UNIT = 80
const POS = {
  BALL_X: 160,
  BALL_Y: 240,
  PLATFORM_Y: GRID_UNIT * 8.5,
  BUTTON_Y: GRID_UNIT * 11.5,
}

const TIMING = {
  DURATION: 500,
  CRASH_FINISH_DELAY: 2000,
}

const EVENTS = {
  GAME: 'gameEvent',
  RISK_APPLY: 'riskTuner:apply',
  AUTO_APPLY: 'autoBetting:apply',
  BET_CHANGED: 'betChanged',
}

const MODES = {
  BET: 'BET',
  CASHOUT: 'CASHOUT',
  RISK_SETTING_PENDING: 'RISK_SETTING_PENDING',
  AUTO_SETTING_CHANGED: 'AUTO_SETTING_CHANGED',
  BET_CHANGED: 'BET_CHANGED',
  COUNTDOWN: 'COUNTDOWN',
  COUNTDOWN_UPDATE: 'COUNTDOWN_UPDATE',
  ROUND: 'ROUND',
  ROUND_PREPARE: 'ROUND_PREPARE',
  FINISH: 'FINISH',
  CASHOUT_ALLOWED: 'CASHOUT_ALLOWED',
  BET_ALLOWED: 'BET_ALLOWED',
  RISK_SETTING_CHANGED: 'RISK_SETTING_CHANGED',
}

export default class GameScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEY)

    // Параметры UI и геометрии
    this.gridUnit = GRID_UNIT
    this.sceneCenterX = null

    this.ballX = POS.BALL_X
    this.ballY = POS.BALL_Y
    this.platformY = POS.PLATFORM_Y
    this.distanceY = this.platformY - this.ballY

    this.buttonY = POS.BUTTON_Y
    this.buttonNameSpacing = 60
    this.buttonIndent = 100
    this.labelColor = UI_COLOR
    this.duration = TIMING.DURATION

    // Игровые параметры по умолчанию
    this.betValues = BetValues
    this.initialBet = DEFAULT_GAME_CONFIG.initialBet
    this.initialDeposit = DEFAULT_GAME_CONFIG.initialDeposit
    this.quickMode = DEFAULT_GAME_CONFIG.quickMode

    // Системные поля
    this._houseEdge = 1
    this._defaultRiskSetting = DEFAULT_RISK_SETTING
    this._currentRiskSetting = { ...DEFAULT_RISK_SETTING }
    this._pendingRiskSetting = null
    this._defaultAutoSetting = DEFAULT_AUTOBET_SETTING
    this._currentAutoSetting = { ...DEFAULT_AUTOBET_SETTING }

    this._cashoutChart = null
    this._fsm = null
    this._sounds = null
    this._emitter = null

    this.rnd = Phaser.Math.RND
  }

  preload() {}

  init() {
    this.sceneCenterX = this.cameras?.main?.centerX ?? 0
    this._resetRoundState()
    this.tweens.timeScale = 1 // dev
  }

  create() {
    this._createBackground()
    this._createUI()
    this._createAudio()
    this._createParticles()
    this._bindEvents()

    this._applyRiskSettings(this._currentRiskSetting)

    this._fsm = new FSM()
    this._setupFSM()
    this._fsm.toCountdown()
  }

  update() {}

  // =========================
  // UI / WORLD
  // =========================
  _createBackground() {
    this.background = new Background(this)
    this.devUI = new DevUI(this)
    this._cashoutChart = new CashoutChart(this)

    this.header = this.add
      .image(0, 0, 'header')
      .setOrigin(0)
      .setAlpha(1)
      .setScale(1)
      .setDepth(DEPTH.HEADER)
  }

  _createUI() {
    this.countdownCounter = new CountdownCounter(this)
    this.moneyCounter = new MoneyCounter(this, this.initialDeposit)
    this.skull = new Skull(this)
    this.ball = new Ball(this, this._emitter, this._onBounce.bind(this))
    this.platforms = new Platforms(this, this.crashTable)

    this.riskTuner = new RiskTunerPanel(this, this._defaultRiskSetting)
    this.riskSettingNotice = new RiskSettingNotice(this)
    this.autoSetting = new AutoPanel(this, this._defaultAutoSetting)

    this.gameControlPanel = new GameControlPanel(this, {
      onCash: () => this._onCashOrBetButton(),
      onTuner: () => this.riskTuner.show(true),
      onAuto: () => this.autoSetting.show(true, this._currentAutoSetting),
    })
  }

  _createAudio() {
    if (this._sounds) return
    this._sounds = {
      cashout: this.sound.add('cashout', { volume: 0.2 }),
      crash: this.sound.add('crash', { volume: 0.2 }),
      coin: this.sound.add('coin', { volume: 0.2 }),
    }
  }

  _createParticles() {
    this._emitter = this.add.particles(0, 0, 'yellow', {
      speed: 500,
      lifespan: 500,
      scale: { start: 2, end: 0 },
      blendMode: 'ADD',
      emitting: false,
    })
  }

  // =========================
  // Events (UI → Scene)
  // =========================
  _bindEvents() {
    this.events.on(EVENTS.RISK_APPLY, (next) => {
      this._pendingRiskSetting = { ...next }
      this._emit(MODES.RISK_SETTING_PENDING)
    })

    this.events.on(EVENTS.AUTO_APPLY, (next) => {
      this._handleAutoSetting(next)
    })

    this.events.on(EVENTS.BET_CHANGED, (value) => {
      if (!this.betAllowed) return
      this.currentBetValue = value
      this._emit(MODES.BET_CHANGED, { betValue: this.currentBetValue })
    })
  }

  // =========================
  // FSM
  // =========================
  _setupFSM() {
    this._fsm.onChange((state) => {
      switch (state) {
        case 'COUNTDOWN':
          this._emit(MODES.COUNTDOWN, { betValue: this.currentBetValue })
          this._countdown()
          break
        case 'ROUND':
          this._emit(MODES.ROUND, { hasBet: this.hasBet })
          this._round()
          break
        case 'FINISH':
          this._emit(MODES.FINISH, {
            hasBet: this.hasBet,
            hasCashOut: this.hasCashOut,
            cashOutAllowed: this.cashOutAllowed,
            stakeValue: this.stakeValue,
            count: this.bounceCount,
          })
          this._finish()
          break
      }
    })
  }

  // =========================
  // Публичные игровые действия
  // =========================
  _onCashOrBetButton() {
    const state = this._fsm.getState()
    if (state === 'COUNTDOWN' && !this.hasBet) {
      this._makeBet()
      return
    }
    if (
      state === 'ROUND' &&
      this.cashOutAllowed &&
      this.hasBet &&
      !this.hasCashOut
    ) {
      this.cashout('manual')
    }
  }

  _makeBet() {
    this.hasBet = true
    this._setBetAllowed(false)

    this.currentDeposit -= this.currentBetValue
    if (this.currentDeposit <= 0) {
      this.currentDeposit = this.initialDeposit + this.currentDeposit
    }

    this._emit(MODES.BET, {
      bet: this.currentBetValue,
      deposit: this.currentDeposit,
    })
  }

  cashout(method) {
    this._setCashOutAllowed(false)
    this.hasCashOut = true
    this._sounds?.cashout?.play()

    if (this.stakeValue <= 0) {
      this.stakeValue = this.currentBetValue
    }

    this.currentDeposit += this.stakeValue

    this._emit(MODES.CASHOUT, {
      hasCashOut: this.hasCashOut,
      stakeValue: this.stakeValue,
      deposit: this.currentDeposit,
      method,
    })

    this.stakeValue = 0
  }

  // =========================
  // Flow: COUNTDOWN → ROUND → FINISH
  // =========================
  _countdown() {
    this._setBetAllowed(true)
    this.hasCashOut = false
    this.hasBet = false
    this.stakeValue = 0

    if (this._pendingRiskSetting)
      this._applyRiskSettings(this._pendingRiskSetting)
    this.quickMode = this._currentAutoSetting.rounds > 0

    let countDown = this.quickMode ? 4 : 6
    const roundPrepareDelay = countDown * 1000 - 4000
    const roundStartDelay = 4

    this.time.addEvent({
      delay: 1000,
      repeat: countDown - 1,
      callback: () => {
        countDown--
        let text = countDown === 0 ? 'GO!' : String(countDown)
        if (countDown === 0) {
          this.time.addEvent({
            delay: 500,
            callback: () =>
              this._emit(MODES.COUNTDOWN_UPDATE, { text: '', show: false }),
          })
        }
        this._emit(MODES.COUNTDOWN_UPDATE, { text, show: true })
      },
    })

    this.time.addEvent({
      delay: roundPrepareDelay,
      callback: () => this._roundPrepare(roundStartDelay),
    })
  }

  _roundPrepare(roundStartDelay) {
    this._emit(MODES.ROUND_PREPARE)
    this.time.addEvent({
      delay: this.duration * (this.platforms.hiddingCount + roundStartDelay),
      callback: () => {
        this._initCrashIndex()
        this.isCrashed = false
        this.bounceCount = 0
        this.roundCounter++

        if (this._currentAutoSetting.rounds > 0 && !this.hasBet) {
          this._currentAutoSetting.rounds--
          if (this._currentAutoSetting.rounds === 0)
            this._handleAutoSetting(this._currentAutoSetting)
          this._makeBet()
        }
        this._fsm.toRound()
      },
    })
  }

  _round() {}

  _onBounce() {
    this._checkCrash()
    if (this.isCrashed) {
      this._fsm.toFinish()
      return
    }

    const multiplier = this.crashTable[this.bounceCount].multiplier
    this.stakeValue = this.currentBetValue * multiplier

    this._emit(MODES.ROUND, {
      mode: 'BOUNCE',
      count: this.bounceCount,
      multiplier,
      stakeValue: this.stakeValue,
      hasBet: this.hasBet,
    })

    if (this.bounceCount === 0 && !this.cashOutAllowed)
      this._setCashOutAllowed(true)
    if (this._currentAutoSetting.cashout > 0) this._checkAutoCashout(multiplier)

    this.bounceCount++
  }

  _finish() {
    this._sounds?.crash?.play()
    this._setCashOutAllowed(false)
    this.time.addEvent({
      delay: TIMING.CRASH_FINISH_DELAY,
      callback: () => this._fsm.toCountdown(),
    })
  }

  // =========================
  // Helpers
  // =========================
  _resetRoundState() {
    this.isCrashed = false
    this.roundCounter = 0
    this.bounceCount = 0

    this.currentBetValue = this.initialBet
    this.pendingBetValue = null
    this.currentDeposit = this.initialDeposit
    this.stakeValue = 0

    this.hasBet = false
    this.hasCashOut = false
    this.cashOutAllowed = false
    this.betAllowed = false
  }

  _setCashOutAllowed(state) {
    if (this.cashOutAllowed === state) return
    this.cashOutAllowed = state
    this._emit(MODES.CASHOUT_ALLOWED, {
      cashOutAllowed: state,
      hasBet: this.hasBet,
    })
  }

  _setBetAllowed(state) {
    if (this.betAllowed === state) return
    this.betAllowed = state
    this._emit(MODES.BET_ALLOWED, { betAllowed: state })
  }

  _handleAutoSetting(next) {
    this._currentAutoSetting = { ...next }
    this._emit(MODES.AUTO_SETTING_CHANGED, {
      default: this._defaultAutoSetting,
      current: this._currentAutoSetting,
    })
  }

  _applyRiskSettings(next) {
    this._currentRiskSetting = { ...next }
    this.crashTable = this._generateCrashTable(this._currentRiskSetting)
    this._pendingRiskSetting = null

    this._emit(MODES.RISK_SETTING_CHANGED, {
      default: this._defaultRiskSetting,
      current: this._currentRiskSetting,
      crashTable: this.crashTable,
    })
  }

  _checkCrash() {
    if (this.bounceCount >= this.crashIndex) {
      this.isCrashed = true
    }
  }

  _checkAutoCashout(multiplier) {
    if (
      this.cashOutAllowed &&
      this.hasBet &&
      !this.hasCashOut &&
      this._currentAutoSetting.cashout <= multiplier
    ) {
      this.cashout('auto')
    }
  }

  _emit(mode, payload = {}) {
    this.events.emit(EVENTS.GAME, { mode, ...payload })
  }

  // =========================
  // Crash math
  // =========================
  _generateCrashTable(crashSetting) {
    const ratio = Math.pow(
      crashSetting.maxPayout / crashSetting.minPayout,
      1 / (crashSetting.steps - 2)
    )

    const RTP = 1 - this._houseEdge / 100
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

    let accSum = 0
    for (let i = crashTable.length - 1; i >= 0; i--) {
      if (i < crashTable.length - 1 && i !== 0) {
        crashTable[i].probability = crashTable[i].base - crashTable[i + 1].base
      } else {
        crashTable[i].probability = crashTable[i].base
      }
      crashTable[i].acc = 1 - accSum
      accSum += crashTable[i].probability
      if (i === 0) crashTable[i].probability = 1 - accSum
    }

    return crashTable
  }

  _initCrashIndex() {
    const random = Math.random()
    let index = 0
    for (let i = 0; i < this.crashTable.length; i++) {
      if (random < this.crashTable[i].acc) {
        index = i
        break
      }
    }
    this.crashIndex = index
    if (this.crashIndex > 0) this.crashIndex += 1
    return this.crashIndex
  }
}
