// GameControlPanel.js
import { BetStepper } from './Bet/BetStepper'
import { ButtonGraphics } from './ButtonGraphics'

export class GameControlPanel {
  constructor(scene, config) {
    this.scene = scene
    this.gridUnit = scene.gridUnit
    this.centerX = scene.sceneCenterX

    this.onCash = config.onCash
    this.onTuner = config.onTuner
    this.onAuto = config.onAuto

    this.createElements()
    this.registerHandlers()
    this.createEvents()
  }

  createElements() {
    const buttonY = 11.5 * this.gridUnit
    const indent = this.scene.buttonIndent
    const nameSpacing = this.scene.buttonNameSpacing
    const labelColor = this.scene.labelColor

    // StakeCounter
    this.stakeCounter = this.scene.add
      .text(this.centerX, buttonY - 1.5 * this.gridUnit, '', {
        font: '40px walibi',
        fill: 'white',
        stroke: 'black',
        strokeThickness: 3,
      })
      .setOrigin(0.5)

    this.autoCashoutLabel = this.scene.add
      .text(this.stakeCounter.x, this.stakeCounter.y + 40, 'AUTO CASH: 2.11', {
        font: '18px AvenirNextCondensedBold',
        // color: '#fdd41d',
        color: labelColor,
      })
      .setOrigin(0.5)
      .setAlign('center')
      .setAlpha(0)

    // BetStepper
    this.betStepper = new BetStepper(
      this.scene,
      this.centerX,
      this.stakeCounter.y,
      this.scene.betValues
    )

    // Cash Button
    // this.buttonAction_old = this.scene.add
    //   .image(this.centerX, buttonY, 'button_red')
    //   .setOrigin(0.5)
    // .setAlpha(0.5)
    //   .setInteractive()
    //   .on('pointerdown', () => this.onCash?.())
    // this.buttonBlack = new ButtonGraphics(
    //   this.scene,
    //   this.centerX + 4,
    //   buttonY + 6,
    //   'black'
    // )

    this.buttonAction = new ButtonGraphics(
      this.scene,
      this.centerX,
      buttonY,
      0xff0000
    )
    // .setInteractive()
    // .setAlpha(0.5)
    this.buttonAction.enableHitbox()
    this.buttonAction.on('pointerdown', () => this.onCash?.())

    this.buttonActionLabel = this.scene.add
      .text(this.buttonAction.x, this.buttonAction.y, 'BET', {
        font: '40px walibi',
        fill: 'black',
      })
      .setOrigin(0.5)
      .setAlign('center')

    // Auto Button
    this.buttonAuto = this.scene.add
      .image(indent, buttonY, 'button_auto_off')
      .setOrigin(0.5)
      .setScale(0.8)
      .setInteractive()
      .on('pointerdown', () => this.onAuto?.())

    this.autoLabel = this.scene.add
      .text(indent, buttonY - nameSpacing, 'AUTO', {
        fontFamily: 'AvenirNextCondensedBold',
        fontSize: '18px',
        color: labelColor,
      })
      .setOrigin(0.5, 0)

    // Tuner Button
    this.buttonTuner = this.scene.add
      .image(this.centerX * 2 - indent, buttonY, 'button_tuner')
      .setOrigin(0.5)
      .setScale(0.8)
      .setInteractive()
      .on('pointerdown', () => this.onTuner?.())

    this.tunerLabel = this.scene.add
      .text(this.buttonTuner.x, this.buttonTuner.y - nameSpacing, 'TUNER', {
        fontFamily: 'AvenirNextCondensedBold',
        fontSize: '18px',
        color: labelColor,
      })
      .setOrigin(0.5, 0)

    // Rules Button
    // this.buttonRules = this.scene.add
    //   .image(this.centerX, 13 * this.gridUnit, 'button_rules')
    //   .setOrigin(0.5)
    //   .setDepth(200)
  }

  createEvents() {
    this.scene.events.on('gameEvent', (data) => {
      this.handleEvent(data.mode, data)
    })
  }

  handleEvent(type, data) {
    const handler = this.handlers[type]
    if (handler) {
      handler.call(this, data)
    } else {
      //   console.warn(`[GameControlPanel] No handler for event: ${type}`)
    }
  }

  registerHandlers() {
    this.handlers = {
      // GameState
      COUNTDOWN: this.onCountdown,
      ROUND: this.onRound,
      FINISH: this.onFinish,

      // GameAction
      CASHOUT: this.onCashout,
      CASHOUT_ALLOWED: this.onCashoutAllowed,
      BET_CHANGED: this.onBetChanged,
      BET_ALLOWED: this.onBetAllowed,
      BET: this.onBet,
      BOUNCE: this.onBounce,
      AUTO_SETTING_CHANGED: this.onAutoSetChanged,
    }
  }

  // ==== Handlers ====

  onCountdown(data) {
    // this.buttonAction.setTexture('button_red')
    // this.buttonAction.setAlpha(1)
    // this.updateActionButton('button_red')
    this.updateActionButton('red')
    this.updateActionLabel('BET', 'black')

    this.stakeCounter.clearTint()
    this.betStepper.setValue(data.betValue)
    this.updateStakeText(data.betValue)
  }

  onRound(data) {
    if (!data.hasBet) {
      this.buttonAction.setAlpha(0.7)
    }
  }

  onFinish(data) {
    if (!data.hasCashOut && data.hasBet) {
      this.updateStakeText(0)
    }
  }

  onCashout() {
    // this.buttonAction.setTexture('button_black')
    this.updateActionLabel('OUT', '#ff0000')
    // this.updateActionButton('button_black')
    this.updateActionButton('black')

    this.stakeCounter.setTint(0xff0000)
  }

  onCashoutAllowed(data) {
    if (data.cashOutAllowed && data.hasBet) {
      //   this.buttonAction.setTexture('button_red')
      //   this.buttonAction.setAlpha(1)
      // this.updateActionButton('button_red')
      this.updateActionButton('red')

      this.updateActionLabel('CASH')
    }
  }

  onBetChanged(data) {
    this.updateStakeText(data.betValue)
  }

  onBetAllowed(data) {
    this.setBetAllowed(data.betAllowed)
  }

  onBet() {
    this.buttonAction.setAlpha(0.7)
  }

  onBounce(data) {
    if (data.count > 0 && data.hasBet) {
      this.updateStakeText(data.stakeValue)
      // this.scene.sounds.coin.play()
    }
  }
  onAutoSetChanged(data) {
    // console.log('onAutoSetChanged', data)
    this.updateAutocashText(data.current.cashout)
    this.updateAutoButton(data.current.rounds)
  }

  // ==== Helpers ====

  setStakeValue(value) {
    this.betStepper.setValue(value)
    this.updateStakeText(value)
  }

  updateStakeText(value) {
    if (typeof value === 'number' && !isNaN(value)) {
      this.stakeCounter.setText(value.toFixed(2))
    }
  }

  updateAutocashText(value) {
    if (typeof value === 'number' && !isNaN(value)) {
      this.autoCashoutLabel.setText('AUTO CASH: ' + value.toFixed(2))
      if (value === 0) this.autoCashoutLabel.alpha = 0
      else this.autoCashoutLabel.alpha = 1
    }
  }

  updateAutoButton(value) {
    if (value) this.buttonAuto.setTexture('button_auto_on')
    else this.buttonAuto.setTexture('button_auto_off')
  }

  updateActionButton(color, alpha = 1) {
    // this.buttonAction.setTexture(texture)
    this.buttonAction.setColor(color)
    this.buttonAction.setAlpha(alpha)
  }

  updateActionLabel(text, fill = 'black') {
    this.buttonActionLabel.setText(text)
    this.buttonActionLabel.setStyle({ fill })
  }

  setBetAllowed(state) {
    this.betStepper.setEnabled(state)
    this.buttonAction.setInteractive(state)
  }
}
