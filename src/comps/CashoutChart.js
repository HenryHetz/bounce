// components/Cloud/CashoutChart.js

export class CashoutChart {
  constructor(scene) {
    this.scene = scene
    this.init()
    this.create()
    this.simulateServer()
  }
  init() {
    this.x = 450
    this.y = 240
    this.maxRows = 10
    this.entries = []
    this.containers = []
    this.simulationRunning = true
  }
  create() {
    this.container = this.scene.add.container(this.x + 10, this.y).setDepth(0)
    this.scene.add
      .image(this.x, this.y - 60, 'co')
      .setOrigin(0)
      .setAlpha(1)
    // .setScale(1)

    const label = this.scene.add
      .text(this.x + 10, this.y - 50, 'CASHOUTS', {
        font: '18px walibi',
        color: '#000',
        align: 'left',
      })
      .setOrigin(0, 0)
      .setAlpha(0)

    let random = Phaser.Math.FloatBetween(200, 1000).toFixed(0)
    this.liveLabel = this.scene.add
      .text(this.x + 10, this.y - 50, 'LIVE: ' + random, {
        font: '18px walibi',
        color: 'black',
        align: 'center',
      })
      .setOrigin(0, 0)
  }
  simulateServer() {
    const spawn = () => {
      if (!this.simulationRunning) return

      const multiplier = +Phaser.Math.FloatBetween(1.1, 20).toFixed(2)
      const username = this.getRandomName()
      const custom = Phaser.Math.Between(0, 1) === 1

      this.addEntry({ username, multiplier, custom })
      this.layoutEntries()

      const nextDelay = Phaser.Math.Between(200, 5000)
      this.scene.time.delayedCall(nextDelay, spawn)
    }

    spawn()
  }

  getRandomName() {
    const names = ['Lizzy', 'Niko', 'Ghost', 'Star', 'Taro', 'Neon', 'Blade']
    const suffix = Phaser.Math.Between(100, 999)
    return `${Phaser.Utils.Array.GetRandom(names)}_${suffix}`
  }

  addEntry(entry) {
    if (this.entries.length >= this.maxRows) {
      this.entries.pop()
      const removed = this.containers.pop()
      removed.destroy()
    }

    const { multiplier, username, custom } = entry
    const textValue = `x${multiplier.toFixed(2)}`

    const bg = this.scene.add.rectangle(
      0,
      0,
      0,
      18,
      custom ? 0xfdd41d : 0xffffff
    )
    const label = this.scene.add.text(0, 0, textValue, {
      font: '14px AvenirNextCondensedBold',
      color: '#000',
      align: 'left',
    })
    bg.width = label.width + 8
    bg.setOrigin(0, 0.5)
    label.setOrigin(0, 0.5).setX(4)

    const name = this.scene.add
      .text(bg.width + 10, 0, username, {
        font: '14px AvenirNextCondensedBold',
        color: '#ffffff',
        align: 'left',
      })
      .setOrigin(0, 0.5)

    const row = this.scene.add.container(0, 0, [bg, label, name])
    this.container.add(row)

    this.entries.unshift(entry)
    this.containers.unshift(row)
  }

  layoutEntries() {
    const spacing = 10
    this.containers.forEach((container, index) => {
      container.y = index * (20 + spacing)
    })
  }
}
