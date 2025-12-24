// components/Cloud/FlashCopy.js
export class FlashCopy {
  constructor(scene) {
    this.scene = scene
    this.container = scene.add.container(0, 0).setDepth(100).setVisible(1)

    // фон-плашка
    // this.bg = scene.add
    //   .rectangle(0, 0, 220, 120, 0x11233a, 0.9)
    //   .setOrigin(1, 0.5)
    //   .setStrokeStyle(2, 0xfdd41d)

    this.bg = this.scene.add
      .image(0, -20, 'flash_copy')
      .setOrigin(1, 0)
      //   .setAlpha(1)
      .setInteractive()

    // имя
    this.nameText = scene.add
      .text(this.bg.x - 62, this.bg.y + 20, '', {
        font: '18px walibi',
        color: '#FFF', //  #FDD41D'
      })
      .setOrigin(0.5)
      .setAlign('center')

    // сеттинги
    this.settingsText = scene.add
      .text(this.bg.x - 116, this.bg.y + 56, '', {
        font: '16px AvenirNextCondensedBold',
        color: '#000',
      })
      .setOrigin(0, 0)

    // кнопка SET (делаем всю плашку интерактивной, но оставим явную кнопку)
    // this.btn = scene.add
    //   .rectangle(-110, 34, 190, 34, 0xfdd41d)
    //   .setOrigin(0.5)
    //   .setInteractive({ useHandCursor: true })

    this.btnLabel = scene.add
      .text(this.bg.x - 62, this.bg.y + 156, 'SET', {
        font: '32px walibi',
        color: '#000',
      })
      .setOrigin(0.5)

    this.container.add([
      this.bg,
      this.nameText,
      this.settingsText,
      //   this.btn,
      this.btnLabel,
    ])

    // рамочка вокруг выбранной строки
    this.focusGfx = scene.add.graphics().setDepth(99).setVisible(false)

    this.bg.on('pointerdown', () => {
      if (!this.entry) return
      // Отправляем как будто RiskTunerPanel сделал applyDraft()
      this.scene.events.emit('riskTuner:apply', this.entry.riskSetting)
      this.hide()
    })

    // тап мимо — закрыть
    // scene.input.on('pointerdown', (p, objs) => {
    //   if (!this.container.visible) return
    //   if (objs && objs.includes(this.btn)) return // нажали по кнопке
    //   // если клик не по нашей плашке
    //   if (
    //     !objs ||
    //     !objs.some(
    //       (o) => o === this.bg || o === this.nameText || o === this.settingsText
    //     )
    //   ) {
    //     this.hide()
    //   }
    // })
  }

  show({ worldX, worldY, entry, rowBounds }) {
    // console.log('fc show', entry)
    this.entry = entry
    // текст
    this.nameText.setText(entry.username)
    const s = entry.riskSetting
    this.settingsText.setText(
      `Steps: ${s.steps}\nMin_X: ${s.minPayout}\nMax_X: ${s.maxPayout}`
    )

    // позиция плашки — слева от строки
    this.container.setPosition(worldX - 20, worldY)
    this.container.setVisible(true)

    // подсветка строки
    this.focusGfx.clear().lineStyle(2, 0xfdd41d, 1)
    this.focusGfx.strokeRoundedRect(
      rowBounds.x - 4,
      rowBounds.y - 2,
      rowBounds.width + 8,
      rowBounds.height + 4,
      4
    )
    this.focusGfx.setVisible(true)
  }

  hide() {
    this.container.setVisible(false)
    this.focusGfx.clear().setVisible(false)
    this.entry = null
  }
}
