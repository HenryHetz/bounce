// components/Cloud/CashoutChart.js
import { FlashCopy } from './FlashCopy'

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
    this.flashCopy = null
  }
  create() {
    this.container = this.scene.add.container(this.x + 10, this.y).setDepth(0)

    this.bgImage = this.scene.add
      .image(this.x, this.y - 60, 'co')
      .setOrigin(0)
      .setAlpha(1)
      .setInteractive()

    this.bgImage.on('pointerdown', (pointer) => {
      // console.log('bg click', pointer.worldY, this.container.y)
      const localY = pointer.worldY - this.container.y
      const rowHeight = 20 + 10 // 20 высота строки, 10 spacing
      const index = Math.floor(localY / rowHeight)

      if (index >= 0 && index < this.containers.length) {
        const row = this.containers[index]
        const entry = this.entries[index]
        this.onRowClick(row, entry)
      } else {
        // кликнули мимо — спрятать флеш
        // this.flashCopy.hide()
      }
    })

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

    this.flashCopy = new FlashCopy(this.scene)

    // глобальный слушатель для кликов вне чарта
    this.scene.input.on('pointerdown', (pointer, objects) => {
      // если флеш скрыт — ничего
      if (!this.flashCopy.container.visible) return

      // проверим: тап был по bgImage? если да — обрабатывается отдельно
      if (objects.includes(this.bgImage)) return

      // иначе — спрятать флеш
      this.flashCopy.hide()
    })
  }
  simulateServer() {
    const spawn = () => {
      if (!this.simulationRunning) return

      const multiplier = +Phaser.Math.FloatBetween(1.1, 20).toFixed(2)
      const username = this.getRandomName()
      const custom = Phaser.Math.Between(0, 1) === 1
      const riskSetting = this.makeRandomSetting(custom) // временно

      this.addEntry({ username, multiplier, custom, riskSetting })
      this.layoutEntries()

      const nextDelay = Phaser.Math.Between(200, 5000)
      this.scene.time.delayedCall(nextDelay, spawn)
    }
    spawn()
  }
  makeRandomSetting(custom) {
    // заглушка — в бою сюда подставишь реальные настройки игрока
    if (!custom) return { steps: 100, minPayout: 1.01, maxPayout: 10000 }

    const stepsArr = [10, 20, 25, 50, 100, 100, 100, 100]
    const minArr = [
      1.01, 1.01, 1.01, 1.1, 1.2, 1.3, 1.4, 1.5, 2.0, 2.5, 1.1, 1.2,
    ]
    const maxArr = [1000, 1000, 1000, 10000, 20000, 50000, 100000, 1000000]
    return {
      steps: Phaser.Utils.Array.GetRandom(stepsArr),
      minPayout: Phaser.Utils.Array.GetRandom(minArr),
      maxPayout: Phaser.Utils.Array.GetRandom(maxArr),
    }
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

    // размеры и интерактивность каждой строки
    const rowWidth = bg.width + 10 + name.width
    // row.setSize(rowWidth, 20)
    // row.setInteractive(
    //   new Phaser.Geom.Rectangle(0, -10, rowWidth, 20),
    //   Phaser.Geom.Rectangle.Contains
    // )
    // row.on('pointerdown', () => this.onRowClick(row, entry))

    this.entries.unshift(entry)
    this.containers.unshift(row)
  }

  layoutEntries() {
    const spacing = 10
    this.containers.forEach((container, index) => {
      container.y = index * (20 + spacing)
    })
  }
  onRowClick(row, entry) {
    // мировые координаты центра строки
    const worldX = this.container.x + row.x
    const worldY = this.container.y + row.y
    // габариты строки в мировых координатах (для рамочки)
    const b = row.getBounds() // локальные в контейнере
    const rowBounds = new Phaser.Geom.Rectangle(
      this.container.x + b.x,
      this.container.y + b.y,
      b.width,
      b.height
    )
    this.flashCopy.show({ worldX, worldY, entry, rowBounds })
  }
}
