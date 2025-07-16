// GameControlPanel.js
import { BetStepper } from './Bet/BetStepper'
import { BetValues } from './Bet/BetValues'

export class GameControlPanel {
  constructor(scene, config) {
    this.scene = scene
    this.gridUnit = scene.gridUnit
    this.centerX = scene.sceneCenterX
    this.betValues = BetValues
    // console.log('betValues', this.betValues)

    this.onCash = config.onCash
    this.onTuner = config.onTuner

    this.createElements()
    this.createEvents()
  }
  createElements() {
    const buttonY = 11.5 * this.gridUnit
    const indent = 100
    const nameSpacing = 60
    // StakeCounter
    this.stakeCounter = this.scene.add
      .text(this.centerX, 10 * this.gridUnit, '', {
        font: '40px walibi',
        fill: 'white',
        stroke: 'black',
        strokeThickness: 3,
      })
      .setOrigin(0.5)

    // BetStepper
    this.betStepper = new BetStepper(
      this.scene,
      this.centerX,
      this.stakeCounter.y,
      this.betValues
    )

    // Main Cash Button
    this.buttonCash = this.scene.add
      .image(this.centerX, buttonY, 'button_bet')
      .setOrigin(0.5)
      .setInteractive()
      .on('pointerdown', () => {
        this.onCash && this.onCash()
      })

    // Auto Button
    this.buttonAuto = this.scene.add
      .image(indent, buttonY, 'button_auto')
      .setOrigin(0.5)
      .setScale(0.8)

    this.autoLabel = this.scene.add
      .text(indent, buttonY - nameSpacing, 'AUTO', {
        fontFamily: 'AvenirNextCondensedBold',
        fontSize: '18px',
        color: '#13469A',
      })
      .setOrigin(0.5, 0)

    // Tuner Button
    this.buttonTuner = this.scene.add
      .image(this.centerX * 2 - indent, buttonY, 'button_tuner')
      .setOrigin(0.5)
      .setScale(0.8)
      .setInteractive()
      .on('pointerdown', () => this.onTuner && this.onTuner())

    this.tunerLabel = this.scene.add
      .text(this.buttonTuner.x, this.buttonTuner.y - nameSpacing, 'TUNER', {
        fontFamily: 'AvenirNextCondensedBold',
        fontSize: '18px',
        color: '#13469A',
      })
      .setOrigin(0.5, 0)

    // Rules/Info Block
    this.buttonRules = this.scene.add
      .image(this.centerX, 13 * this.gridUnit, 'button_rules')
      .setOrigin(0.5)
      .setDepth(200)
  }
  createEvents() {
    this.scene.events.on('gameState', (data) => {
      this.handleGameState(data)
    })
    this.scene.events.on('gameAction', (data) => {
      this.handleGameAction(data)
    })
  }

  handleGameState(data) {
    // console.log('gameState', data)
    if (data.mode === 'COUNTDOWN') {
      this.buttonCash.setTexture('button_bet')
      this.stakeCounter.clearTint()
      this.betStepper.setValue(data.betValue)
      this.updateStakeText(data.betValue)
      this.buttonCash.setAlpha(1)
    }
    if (data.mode === 'ROUND') {
      if (!data.hasBet) {
        // this.buttonCash.setTexture('button_cash')
        this.buttonCash.setAlpha(0.5)
      }
    }
    if (data.mode === 'FINISH') {
      //   console.log('gameState FINISH', data)
      if (!data.hasCashOut && data.hasBet) this.updateStakeText(0)
    }
  }
  handleGameAction(data) {
    // console.log('gameAction', data)
    if (data.mode === 'CASHOUT') {
      this.buttonCash.setTexture('button_out')
      this.stakeCounter.setTint(0xff0000) // dev
    }
    if (data.mode === 'CASHOUT_ALLOWED') {
      if (data.cashOutAllowed && data.hasBet) {
        this.buttonCash.setTexture('button_cash')
        this.buttonCash.setAlpha(1)
      }
    }
    if (data.mode === 'BET_CHANGED') {
      this.updateStakeText(data.betValue)
    }
    if (data.mode === 'BET_ALLOWED') {
      this.setBetAllowed(data.betAllowed)
    }
    if (data.mode === 'BET') {
      //   this.setBetAllowed(false)
      this.buttonCash.setAlpha(0.5)
    }
    if (data.mode === 'BOUNCE') {
      if (data.count > 0 && data.hasBet) this.updateStakeText(data.stakeValue)
    }
  }
  /** Set initial/current bet value */
  setStakeValue(value) {
    // this.currentBetValue = value
    this.betStepper.setValue(value)
    this.updateStakeText(value)
  }

  /** Update stake text directly */
  updateStakeText(value) {
    // нужна проверка на NaN

    if (!isNaN(value)) this.stakeCounter.setText(value.toFixed(2))
  }

  /** Enable or disable betting */
  setBetAllowed(state) {
    this.betStepper.setEnabled(state)
    // this.buttonCash.setAlpha(state ? 1 : 0.5)
    this.buttonCash.setInteractive(state)
  }
}
