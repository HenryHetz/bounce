// GameControlPanel.js
import { BetStepper } from './Bet/BetStepper'
// import { BetValues } from './Bet/BetValues'

export class GameControlPanel {
  constructor(scene, config) {
    this.scene = scene
    this.gridUnit = scene.gridUnit
    this.centerX = scene.sceneCenterX

    this.onCash = config.onCash
    this.onTuner = config.onTuner
    this.onAuto = config.onAuto

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
      this.scene.betValues
    )

    // Main Cash Button
    this.buttonAction = this.scene.add
      .image(this.centerX, buttonY, 'button_red')
      .setOrigin(0.5)
      .setInteractive()
      .on('pointerdown', () => {
        this.onCash && this.onCash()
      })
    this.buttonActionLabel = this.scene.add
      .text(this.buttonAction.x, this.buttonAction.y, 'BET', {
        font: '40px walibi',
        fill: 'black',
      })
      .setOrigin(0.5)
      .setAlign('center')
    // Auto Button
    this.buttonAuto = this.scene.add
      .image(indent, buttonY, 'button_auto')
      .setOrigin(0.5)
      .setScale(0.8)
      .setInteractive()
      .on('pointerdown', () => this.onAuto && this.onAuto())

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
    this.scene.events.on('gameEvent', (data) => {
      this.handleGameState(data)
    })
    this.scene.events.on('gameEvent', (data) => {
      this.handleGameAction(data)
    })
  }

  handleGameState(data) {
    // console.log('gameEvent', data)
    if (data.mode === 'COUNTDOWN') {
      // buttonAction
      this.buttonAction.setTexture('button_red')
      this.buttonAction.setAlpha(1)
      //   this.buttonActionLabel.setText('BET')
      //   this.buttonActionLabel.setStyle({ fill: 'black' })
      this.updateActionLabel('BET', 'black')

      this.stakeCounter.clearTint()
      this.betStepper.setValue(data.betValue)
      this.updateStakeText(data.betValue)
    }
    if (data.mode === 'ROUND') {
      if (!data.hasBet) {
        // this.buttonAction.setTexture('button_cash')
        this.buttonAction.setAlpha(0.7)
      }
    }
    if (data.mode === 'FINISH') {
      //   console.log('gameEvent FINISH', data)
      if (!data.hasCashOut && data.hasBet) this.updateStakeText(0)
    }
  }
  handleGameAction(data) {
    // console.log('gameEvent', data)
    if (data.mode === 'CASHOUT') {
      this.buttonAction.setTexture('button_black')
      //   this.buttonActionLabel.setText('OUT')
      //   this.buttonActionLabel.setStyle({ fill: '#ff0000' })
      this.updateActionLabel('OUT', '#ff0000')

      this.stakeCounter.setTint(0xff0000) // dev
    }
    if (data.mode === 'CASHOUT_ALLOWED') {
      if (data.cashOutAllowed && data.hasBet) {
        this.buttonAction.setTexture('button_red')
        this.buttonAction.setAlpha(1)
        // this.buttonActionLabel.setText('CASH')
        this.updateActionLabel('CASH')
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
      this.buttonAction.setAlpha(0.7)
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

  updateActionLabel(text, fill = 'black') {
    this.buttonActionLabel.setText(text)
    this.buttonActionLabel.setStyle({ fill })
  }

  /** Update stake text directly */
  updateStakeText(value) {
    if (typeof value === 'number' && !isNaN(value)) {
      this.stakeCounter.setText(value.toFixed(2))
    }
  }

  /** Enable or disable betting */
  setBetAllowed(state) {
    this.betStepper.setEnabled(state)
    // this.buttonAction.setAlpha(state ? 1 : 0.5)
    this.buttonAction.setInteractive(state)
  }
}
