export class BotManager {
  constructor(scene, betValues) {
    this.scene = scene
    this.betValues = betValues
    this.bots = []
    this.textObject = null

    this.createEvents()
  }
  createEvents() {
    this.scene.events.on('gameEvent', (data) => {
      this.handleEvent(data)
    })
  }
  handleEvent(data) {
    if (data.mode === 'COUNTDOWN') {
      this.generate()
      this.render()
    }
    if (data.mode === 'BOUNCE') {
      this.update(data.multiplier)
      this.render()
    }
    if (data.mode === 'FINISH') {
      //   this.clear()
    }
  }
  generate(count = 5) {
    const names = [
      'Alice',
      'Bob',
      'Charlie',
      'Dana',
      'Eve',
      'Frank',
      'Ghost',
      'Zed',
    ]
    this.bots = []

    for (let i = 0; i < count; i++) {
      const name = names[i % names.length] + Phaser.Math.Between(1, 99)
      const bet = Phaser.Math.RND.pick(this.betValues)
      const exitX = +Phaser.Math.FloatBetween(1.2, 5).toFixed(2)

      this.bots.push({
        name,
        bet,
        exitX,
        willExit: false,
        hasExited: false,
        payout: null,
      })
    }
  }

  update(multiplier) {
    this.bots.forEach((bot) => {
      //   console.log('bot update', bot.exitX, multiplier)
      if (!bot.willExit && !bot.hasExited && multiplier >= bot.exitX) {
        // console.log('bot update', bot.exitX, multiplier)
        bot.willExit = true
        const delay = Phaser.Math.Between(200, 1000)

        this.scene.time.delayedCall(delay, () => {
          if (!bot.hasExited) {
            bot.hasExited = true
            bot.payout = +(bot.bet * multiplier).toFixed(2)
          }
        })
      }
    })
  }

  render(x = 360, y = 100) {
    if (this.textObject) this.textObject.destroy()

    const lines = this.bots.map((bot) => {
      const status = bot.hasExited
        ? `✅ x${(bot.payout / bot.bet).toFixed(2)} → ${bot.payout.toFixed(2)}`
        : `❌`
      return `${bot.name.padEnd(8)} ${bot.bet.toFixed(2)}   ${status}`
    })

    this.textObject = this.scene.add
      .text(x, y, lines.join('\n'), {
        font: '20px AvenirNextCondensedBold',
        fill: '#ffffff',
        align: 'left',
      })
      .setDepth(100)
  }

  clear() {
    if (this.textObject) this.textObject.destroy()
    this.bots = []
  }
}
