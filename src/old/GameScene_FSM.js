import { DEFAULT_RISK_SETTING } from '../constants/riskConstants'
import { Background } from '../comps/Background'
import { RiskTunerPanel } from '../comps/RiskTuner/RiskTunerPanel'
import { Ball } from '../comps/Ball'
import { Platforms } from '../comps/Platforms'
import { BounceFSM } from '../comps/BounceFSM'

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('Game')
    this.state = 'WAITING'
  }

  preload() {}

  init() {
    this.gridUnit = 80
    this.sceneCenterX = 320
    this.ballX = 120
    this.ballY = 250
    this.platformY = this.gridUnit * 8.5
    this.distanceY = this.platformY - this.ballY
    this.duration = 500

    this.houseEdge = 1

    this.defaultRiskSetting = DEFAULT_RISK_SETTING
    this.currentRiskSetting = { ...DEFAULT_RISK_SETTING }
    this.crashTable = this.generateCrashTable(this.defaultRiskSetting)

    this.pendingRiskSetting = null

    this.bounceCount = 0
    this.deposit = 10000
    this.initialBet = 100
    this.stakeCount = 0
    this.allowCashOut = false
    this.roundCounter = 0
    this.outCounter = 0
    this.isCrashed = false

    this.tweens.timeScale = 1
  }

  create() {
    this.background = new Background(this)
    this.createStakeCounter()
    this.createStartCounter()
    this.createParticles()
    this.createUI()
    this.createButtons()
    this.createMoneyCounter()
    this.createGrid()

    this.ball = new Ball(this, this.emitter)
    this.platforms = new Platforms(this)
    this.platforms.updatePlatforms(this.crashTable)

    this.riskTuner = new RiskTunerPanel(this, this.defaultRiskSetting)

    this.events.on('riskTuner:apply', (newRiskSetting) => {
      this.pendingRiskSetting = { ...newRiskSetting }
    })

    if (!this.sounds) this.createSounds()

    this.transitionTo('WAITING')
  }

  transitionTo(state) {
    console.log(`FSM: ${this.state} ➜ ${state}`)
    this.state = state

    switch (state) {
      case 'WAITING':
        this.onWaiting()
        break
      case 'COUNTDOWN':
        this.onCountdown()
        break
      case 'RUNNING':
        this.onRunning()
        break
      case 'CRASH':
        this.onCrash()
        break
      case 'RESET':
        this.onReset()
        break
    }
  }

  onWaiting() {
    if (this.pendingRiskSetting) {
      this.currentRiskSetting = { ...this.pendingRiskSetting }
      this.crashTable = this.generateCrashTable(this.currentRiskSetting)
      this.pendingRiskSetting = null
    }

    this.allowCashOut = false
    this.isCrashed = false
    this.bounceCount = 0

    this.initCrash()

    this.platforms.updatePlatforms(this.crashTable)
    this.ball.reset()
    // this.background.reset()

    this.buttonStake.show(1)
    this.stakeCounter.clearTint()

    this.startCounterUpdate('')
    this.startCounterShow(false)

    this.time.addEvent({
      delay: 3000,
      callback: () => this.transitionTo('COUNTDOWN'),
    })
  }

  onCountdown() {
    let countDown = 8
    this.startCounterShow(true)
    this.startCounterUpdate(countDown)

    this.countdownEvent = this.time.addEvent({
      delay: 1000,
      repeat: countDown - 1,
      callback: () => {
        countDown--
        if (countDown <= 0) {
          this.startCounterUpdate('GO!')
          this.buttonStake.show(0)
        } else {
          this.startCounterUpdate(countDown)
        }
      },
      onComplete: () => {
        this.startCounterShow(false)
        this.transitionTo('RUNNING')
      },
    })
  }

  onRunning() {
    this.moneyCounterUpdate(-this.initialBet)
    this.roundCounter++
    this.events.emit('startRound', true)

    this.platforms.movePlatforms()
    this.background.move()

    this.time.addEvent({
      delay: this.duration * (this.platforms.hiddingCount + 5),
      callback: () => {
        this.ball.fall(() => this.handleBounce())
      },
    })
  }

  handleBounce() {
    if (this.isCrashed) return

    if (this.checkCrash()) {
      this.transitionTo('CRASH')
      return
    }

    this.platforms.hidePlatform(this.bounceCount)
    this.stakeCounterUpdate(this.crashTable[this.bounceCount].multiplier)
    this.bounceCount++

    if (this.bounceCount === 1 && !this.allowCashOut) {
      this.allowCashOut = true
    }

    this.platforms.moveNextPlatforms(this.bounceCount)
    this.ball.bounce(() => this.handleBounce())
  }

  onCrash() {
    this.isCrashed = true
    this.allowCashOut = false
    this.ball.setTint(0xff0000)
    this.sounds.dropCoin.play()

    this.ball.stop()
    this.platforms.hideAndResetPlatforms(this.bounceCount)
    this.background.stop()

    this.time.addEvent({
      delay: 1500,
      callback: () => {
        this.transitionTo('WAITING')
      },
    })
  }

  onReset() {
    this.transitionTo('WAITING')
  }

  checkCrash() {
    return this.bounceCount >= this.crashIndex
  }

  initCrash() {
    let random = Math.random()
    let acc = 0
    let index = 0
    let multiplier = null

    function getCrashIndex(crashTable) {
      for (let i = 0; i < crashTable.length; i++) {
        if (random < crashTable[i].acc) {
          acc = crashTable[i].acc
          multiplier = crashTable[i].multiplier
          index = i
          return i
        }
      }
      return crashTable.length
    }

    this.crashIndex = getCrashIndex(this.crashTable)
    if (this.crashIndex > 0) this.crashIndex += 1

    console.log(
      'random',
      random,
      'crashIndex',
      this.crashIndex,
      'multiplier',
      multiplier
    )
    return this.crashIndex
  }

  generateCrashTable(crashSetting) {
    console.log('crashSetting', crashSetting)
    const ratio = Math.pow(
      crashSetting.maxPayout / crashSetting.minPayout,
      1 / (crashSetting.steps - 2)
    )
    console.log('ratio', ratio)

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
      if (i < crashTable.length - 1 && i !== 0) {
        crashTable[i].probability = crashTable[i].base - crashTable[i + 1].base
      } else {
        crashTable[i].probability = crashTable[i].base
      }
      crashTable[i].acc = 1 - acc
      acc += crashTable[i].probability
      if (i === 0) crashTable[i].probability = 1 - acc
    }

    console.table(crashTable)
    return crashTable
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
  }

  createGrid() {
    this.ui = this.add
      .image(0, 0, 'grid')
      .setOrigin(0)
      .setAlpha(0)
      .setDepth(100)
  }

  createButtons() {
    this.buttonCash = this.add
      .image(this.sceneCenterX, 12 * this.gridUnit, 'button_cash')
      .setOrigin(0.5)
    this.events.on('startRound', (value) => {
      if (value) {
        this.buttonCash.setTexture('button_cash')
        this.buttonCash.setAlpha(1)
        this.cashOutShadow.show(0)
      }
    })

    this.buttonRect = this.add
      .rectangle(this.sceneCenterX, 12 * this.gridUnit, 280, 120, 0x00ccff)
      .setOrigin(0.5)
      .setFillStyle(0x000000, 0)
      .setInteractive()

    this.buttonRect.addListener('pointerdown', () => {
      this.handleCashClick()
    })

    this.buttonStake = this.add
      .image(this.sceneCenterX, 10 * this.gridUnit, 'button_stake')
      .setOrigin(0.5)
      .setAlpha(1)
    this.buttonStake.show = (state) => {
      this.buttonStake.visible = state
    }

    this.buttonNumbers = this.add
      .image(this.gridUnit, 12 * this.gridUnit, 'button_666')
      .setOrigin(0.5)
    this.add
      .text(this.buttonNumbers.x, 11 * this.gridUnit, 'BET', {
        fontFamily: 'AvenirNextCondensedBold',
        fontSize: '18px',
        color: '#13469A',
      })
      .setOrigin(0.5)

    this.buttonRisk = this.add
      .image(640 - this.gridUnit, 12 * this.gridUnit, 'button_risk')
      .setOrigin(0.5)
      .setInteractive()
      .addListener('pointerdown', () => {
        this.riskTuner.show(true)
      })
    this.add
      .text(this.buttonRisk.x, 11 * this.gridUnit, 'TUNER', {
        fontFamily: 'AvenirNextCondensedBold',
        fontSize: '18px',
        color: '#13469A',
      })
      .setOrigin(0.5)
    this.buttonRules = this.add
      .image(this.sceneCenterX, 14 * this.gridUnit, 'button_rules')
      .setOrigin(0.5)
      .setDepth(200)
  }

  handleCashClick() {
    if (this.allowCashOut) {
      this.allowCashOut = false
      this.sounds.heart.play()
      this.moneyCounterUpdate(this.stakeCount)
      this.outCounter += this.stakeCount
      this.buttonCash.setTexture('button_out')
      this.stakeCounter.setTint(0xff0000)
      this.cashOutShadow.show(1)
    }
  }

  createStartCounter() {
    this.startCounter = this.add
      .text(this.sceneCenterX, 6 * this.gridUnit, '', {
        font: '100px walibi',
        fill: 'red',
      })
      .setOrigin(0.5)
      .setAlign('center')
      .setAlpha(0)

    this.startCounterUpdate = (value) => {
      this.startCounter.setText(value)
    }
    this.startCounterShow = (show) => {
      this.startCounter.setAlpha(show)
    }
  }

  createStakeCounter() {
    this.stakeCounter = this.add
      .text(this.sceneCenterX, 10 * this.gridUnit, '', {
        font: '40px walibi',
        fill: 'white',
        stroke: 'black',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setAlign('center')
      .setAlpha(1)

    this.cashOutShadow = this.add
      .text(this.sceneCenterX, 10.5 * this.gridUnit, '', {
        font: '32px walibi',
        fill: 'rgba(0,0,0,0)',
        stroke: 'red',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setAlpha(1)
      .setVisible(0)

    this.cashOutShadow.show = (state) => {
      this.cashOutShadow.alpha = state
    }

    this.stakeCounterUpdate = (value) => {
      this.stakeCount = value ? this.initialBet * value : this.initialBet
      this.stakeCounter.setText(this.stakeCount.toFixed(2))
      this.cashOutShadow.setText(this.stakeCount.toFixed(2))
    }
  }

  createMoneyCounter() {
    this.skull = this.add
      .image(400, 0, 'skull')
      .setOrigin(0.5, 0)
      .setScale(1)
      .setAlpha(1)
      .setDepth(220)
    this.skull.shake = () => {
      this.tweens.add({
        targets: this.skull,
        scale: 1.1,
        repeat: 2,
        duration: 20,
        yoyo: true,
      })
    }

    this.moneyCounter = this.add
      .text(450, 40, this.deposit.toFixed(2), {
        font: '24px walibi',
        fill: 'white',
      })
      .setOrigin(0, 0.5)
      .setAlign('left')
      .setAlpha(1)
      .setDepth(210)

    this.moneyCounterUpdate = (value) => {
      if (value) this.deposit += value
      this.moneyCounter.setText(this.deposit.toFixed(2))
      if (value > 0) this.skull.shake()
    }
  }

  createSounds() {
    this.sounds = {
      fone: this.sound.add('fone1', { loop: true, delay: 5000 }),
      heart: this.sound.add('heart', { volume: 0.2 }),
      dropCoin: this.sound.add('dropCoin', { volume: 0.2 }),
    }
  }

  createParticles() {
    this.emitter = this.add.particles(0, 0, 'yellow', {
      speed: 500,
      lifespan: 500,
      scale: { start: 2, end: 0 },
      blendMode: 'ADD',
      emitting: false,
    })
  }

  update() {}
}
