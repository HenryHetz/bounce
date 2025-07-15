export class Platforms {
  constructor(scene) {
    this.scene = scene

    // Конфиг
    this.count = 100
    this.spacing = 140
    this.stepping = -5
    this.hiddingCount = 6
    this.ballX = scene.ballX
    this.ballY = scene.ballY
    this.distanceY = scene.distanceY
    this.gridUnit = scene.gridUnit
    this.duration = scene.duration

    this.startX = this.ballX + this.hiddingCount * this.spacing
    this.startY = this.gridUnit * 8.5

    this.platforms = scene.add.container(this.startX, this.startY)

    this.createPlatforms()
  }

  createPlatforms() {
    const { scene } = this
    const colors = [0xffffff, 0xb0e0e6]

    for (let i = 0; i < this.count; i++) {
      let color = colors[i % 2]
      let platform = scene.add
        .image(0, 0, 'platform')
        .setScale(1)
        .setTint(color)
        .setOrigin(0.5, 0)

      let text = scene.add
        .text(0, 20, '', {
          fontSize: '24px',
          color: '#000',
          fontFamily: 'Courier',
        })
        .setOrigin(0.5, 0.5)

      let unit = scene.add.container(
        i * this.spacing,
        i * this.stepping * Math.pow(1.02, i),
        [platform, text]
      )

      this.platforms.add(unit)
    }
  }

  updatePlatforms(crashTable) {
    // console.log('updatePlatforms')
    this.platforms.list.forEach((unit, i) => {
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
