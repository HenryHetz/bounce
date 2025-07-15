// 📦 Phaser 3.9 Scene with live video using CanvasTexture (K-pop Bingo style)
import Phaser from 'phaser'

class KpopBingoScene extends Phaser.Scene {
  constructor() {
    super('KpopBingoScene')
  }

  preload() {
    this.load.image('board', 'assets/board.png') // 🎯 Заменить на свои ассеты
    this.load.image('tile', 'assets/tile.png')
  }

  create() {
    // 🎥 1. Инициализируем видео с камеры
    const video = document.createElement('video')
    video.autoplay = true
    video.muted = true
    video.playsInline = true

    navigator.mediaDevices
      .getUserMedia({ video: { width: 320, height: 240 } })
      .then((stream) => {
        video.srcObject = stream
        video.play()

        // 🖼️ 2. Создаём CanvasTexture и привязываем к сцене
        const canvasTexture = this.textures.createCanvas('liveCam', 320, 240)
        const ctx = canvasTexture.getSourceImage().getContext('2d')

        // 🎯 3. Отображаем как Image (можно масштабировать, стилизовать)
        const camSprite = this.add.image(400, 200, 'liveCam').setDepth(1)
        camSprite.setDisplaySize(320, 240)
        camSprite.setAlpha(0.95)
        camSprite.setMask(
          new Phaser.Display.Masks.GeometryMask(
            this,
            this.make
              .graphics({ x: 400, y: 200, add: false })
              .fillCircle(0, 0, 100)
          )
        )

        // ♻️ 4. Обновляем текстуру каждый кадр
        this.time.addEvent({
          delay: 33,
          loop: true,
          callback: () => {
            ctx.drawImage(video, 0, 0, 320, 240)
            canvasTexture.refresh()
          },
        })
      })

    // 🎲 5. UI: Бинго-доска и клетки (заглушки)
    this.add.image(400, 500, 'board').setDepth(2)

    const startX = 240,
      startY = 400
    const size = 64,
      spacing = 10

    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        const tile = this.add.image(
          startX + col * (size + spacing),
          startY + row * (size + spacing),
          'tile'
        )
        tile.setDisplaySize(size, size)
        tile.setDepth(3)
      }
    }
  }
}

const config = {
  type: Phaser.WEBGL,
  width: 800,
  height: 600,
  backgroundColor: '#141426',
  scene: [KpopBingoScene],
  parent: 'game-container',
}

new Phaser.Game(config)
