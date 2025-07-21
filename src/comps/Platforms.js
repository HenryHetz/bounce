export class Platforms {
  constructor(scene, crashTable) {
    this.scene = scene

    // Конфиг
    this.count = 100
    this.spacing = 140
    this.stepping = -5
    this.hiddingCount = 5
    this.ballX = scene.ballX
    this.ballY = scene.ballY
    this.distanceY = scene.distanceY
    this.gridUnit = scene.gridUnit
    this.duration = scene.duration

    this.startX = this.ballX + this.hiddingCount * this.spacing
    this.startY = scene.platformY

    this.platforms = scene.add.container(this.startX, this.startY)

    this.createPlatforms()
    this.updatePlatforms(crashTable)

    this.createEvents()
  }
  createEvents() {
    this.scene.events.on('gameEvent', (data) => {
      this.handleEvent(data)
    })
  }
  handleEvent(data) {
    if (data.mode === 'COUNTDOWN') {
    }
    if (data.mode === 'ROUND_PREPARE') {
      this.movePlatforms()
    }
    if (data.mode === 'BOUNCE') {
      this.hidePlatform(data.count)
      this.moveNextPlatforms(data.count + 1)
    }
    if (data.mode === 'FINISH') {
      this.setRed(data.count)
      this.hideAndResetPlatforms(data.count)
    }
  }
  createPlatforms() {
    const { scene } = this
    const colors = [0xffffff, 0xffff00]

    this.createGradientTexture('fadeRect', '255,255,255', 120, 160)
    this.createGradientTexture('fadeRedRect', '255,0,0', 120, 160)

    for (let i = 0; i < this.count; i++) {
      const color = colors[i % 2]
      // let platform = scene.add
      //   .image(0, 0, 'platform')
      //   .setScale(1)
      //   .setTint(color)
      //   .setOrigin(0.5, 0)
      // пробуем нарисовать
      const width = 120
      // const height = Phaser.Math.Between(40, 120) // случайная высота
      const height = 40

      const platform = scene.add
        .rectangle(0, 0, width, height, 0xffffff, 0.9)
        // .setStrokeStyle(2, 0xffffff, 0.4)
        .setScale(1)
        // .setTint(color)
        .setOrigin(0.5, 0)

      const text = scene.add
        .text(0, 20, '', {
          fontSize: '24px',
          color: '#000',
          fontFamily: 'AvenirNextCondensedBold',
        })
        .setOrigin(0.5, 0.5)

      const img = scene.add.image(0, 40, 'fadeRect').setOrigin(0.5, 0)

      // const y = Phaser.Math.Between(0, 200)
      const y = i * this.stepping * Math.pow(1.02, i)
      const unit = scene.add.container(
        i * this.spacing,
        y, //
        [platform, text, img]
      )
      unit.defaultY = y

      this.platforms.add(unit)
    }
  }

  updatePlatforms(crashTable) {
    // console.log('updatePlatforms')
    this.platforms.list.forEach((unit, i) => {
      // this.setDefaultColor(unit) // сброс цвета
      let text = unit.list[1]
      if (crashTable[i]) {
        unit.setVisible(true)
        let m = crashTable[i].multiplier
        let mult =
          m >= 1000 ? m.toFixed(0) : m >= 100 ? m.toFixed(1) : m.toFixed(2)
        text.setText('X' + mult)
      } else {
        unit.setVisible(false)
      }
    })
  }
  createGradientTexture(key, color, width, height) {
    const canvas = this.scene.textures.createCanvas(key, width, height)
    const ctx = canvas.getContext()

    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, `rgba(${color}, 0.5)`)
    gradient.addColorStop(1, `rgba(${color}, 0)`)

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
    canvas.refresh()
  }

  setRed(count) {
    const platformContainer = this.platforms.list[count]
    if (!platformContainer) return

    const [platform, text, gradientImage] = platformContainer.list

    platform.fillColor = 0xff0000

    // Меняем градиент
    gradientImage.setTexture('fadeRedRect')
  }
  setDefaultColor(count) {
    // console.log('setDefaultColor', count)
    const platformContainer = this.platforms.list[count]
    if (!platformContainer) return
    // console.log('setDefaultColor', platformContainer)

    const [platform, text, gradientImage] = platformContainer.list

    platform.fillColor = 0xffffff // белый цвет

    // Меняем градиент
    gradientImage.setTexture('fadeRect')
  }

  resetPosition(x, y) {
    this.platforms.x = x
    this.platforms.y = y
  }

  hidePlatform(index) {
    const unit = this.platforms.list[index]
    if (!unit) return

    const startY = unit.y
    unit.scene.tweens.add({
      targets: unit,
      y: unit.y + 15,
      alpha: 0,
      duration: 50,
      onComplete: () => {
        unit.y = startY
      },
    })
  }

  hideAndResetPlatforms(startIndex, onComplete) {
    // startIndex = bounceCount в сцене
    const scene = this.scene
    const units = this.platforms.list

    scene.time.addEvent({
      delay: 500, // дать паузу перед началом скрытия
      callback: () => {
        // поочередно скрываем платформы с задержкой между ними
        let quant = 0
        for (let i = startIndex; i < startIndex + this.hiddingCount; i++) {
          if (i < units.length) {
            scene.tweens.add({
              targets: units[i],
              alpha: 0,
              duration: 150,
              delay: quant * 100,
            })
          }
          quant++
        }

        // пауза после всего скрытия, чтобы затем сбросить контейнер
        scene.time.addEvent({
          delay: 1000,
          callback: () => {
            this.platforms.x = this.startX
            this.platforms.y = this.startY
            units.forEach((unit) => {
              unit.alpha = 1
            })
            // сброс цвета платформы
            this.setDefaultColor(startIndex)

            if (onComplete) onComplete()
          },
        })
      },
    })
  }

  movePlatforms() {
    return this.scene.tweens.add({
      targets: this.platforms,
      x: this.ballX,
      duration: this.duration * 2 * this.hiddingCount,
    })
  }

  moveNextPlatforms(step) {
    if (step >= this.platforms.list.length) {
      console.log('платформы закончились', step)
      // там воронка нужна
      return
    }

    const targetUnit = this.platforms.list[step]
    return this.scene.tweens.add({
      targets: this.platforms,
      x: this.ballX - targetUnit.x,
      y: this.ballY - targetUnit.y + this.distanceY,
      duration: this.duration * 2,
    })
  }
}
