// components/Live/LiveOpsManager.js

export class LiveOpsManager {
  constructor(scene) {
    this.scene = scene
    this.activeModifiers = []
    this.collectedTokens = 0
    this.totalRounds = 0

    this.registerEvents()
  }

  registerEvents() {
    this.scene.events.on('gameEvent', (data) => {
      if (data.mode === 'ROUND_START') {
        this.totalRounds++
        this.checkScheduledBonuses()
      }

      if (data.mode === 'CASHOUT') {
        this.checkCashoutBonus(data)
        this.checkTokenProgress(data)
      }

      if (data.mode === 'CRASH') {
        this.checkLossBonus()
      }
    })
  }

  checkScheduledBonuses() {
    // Example: every 5th round gives a bonus payout modifier
    if (this.totalRounds % 5 === 0) {
      this.activateModifier({
        id: 'extra_payout',
        label: '+10% payout',
        rounds: 1,
        effect: 'bonus_payout_10',
      })
    }
  }

  checkCashoutBonus(data) {
    if (data.multiplier >= 100) {
      this.scene.events.emit('liveops:flex', {
        x: data.multiplier,
        stake: data.stakeValue,
      })
    }
  }

  checkTokenProgress(data) {
    if (data.stakeValue >= 10) {
      this.collectedTokens++
      this.scene.events.emit('liveops:token', {
        tokens: this.collectedTokens,
        goal: 10,
      })

      if (this.collectedTokens >= 10) {
        this.collectedTokens = 0
        this.activateModifier({
          id: 'free_round',
          label: 'Free round!',
          rounds: 1,
          effect: 'stake_free',
        })
      }
    }
  }

  checkLossBonus() {
    // Could trigger anti-tilt bonus
    // Optional expansion
  }

  activateModifier(mod) {
    this.activeModifiers.push(mod)
    this.scene.events.emit('liveops:modifier', mod)
  }
}
