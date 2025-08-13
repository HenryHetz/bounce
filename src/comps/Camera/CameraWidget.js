// camera/CameraWidget.js
// Окошко фронтальной камеры, рисуем прямо в Phaser-текстуру (без искажений).
// Использование в сцене:
//   import { CameraWidget } from '../camera/CameraWidget'
//   this.cam = new CameraWidget(this, 20, 20, 300, 400)
//   this.cam.start().catch(() => { /* показать подсказку Tap to enable */ })
//   ...
//   update() { this.cam && this.cam.update() }

export class CameraWidget {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x - левый верхний X
   * @param {number} y - левый верхний Y
   * @param {number} w - ширина виджета (пиксели)
   * @param {number} h - высота виджета (пиксели)
   * @param {{fit?:'cover'|'contain', mirror?:boolean, depth?:number, border?:boolean}} opts
   */
  constructor(scene, opts = {}) {
    this.scene = scene
    this.x = 240
    this.y = 120
    this.w = 360
    this.h = 360

    // Настройки
    this.fit = opts.fit ?? 'cover' // 'cover' (кроп) или 'contain' (письма)
    this.mirror = opts.mirror ?? true // зеркало для фронталки
    this.depth = opts.depth ?? 5
    this.border = opts.border ?? false

    // Внутреннее состояние
    this.texKey = `camtex_${Phaser.Utils.String.UUID()}`
    this.video = null
    this.stream = null
    this.tex = null
    this.img = null
    this.frame = null
    this.ready = false

    // Размер исходного видеопотока и предрасчитанные прямоугольники
    this.vw = 0
    this.vh = 0
    this.crop = null // {sx,sy,sw,sh}
    this.dst = null // {dx,dy,dw,dh}
  }

  // Асинхронный старт. Бросает ошибку, если нужен пользовательский жест (iOS autoplay policy).
  async start() {
    this.ready = false

    // 1) HTMLVideo
    this.video = document.createElement('video')
    this.video.muted = true
    this.video.autoplay = true
    this.video.playsInline = true // важно для iOS, чтобы не разворачивало фуллскрин

    // 2) Запрашиваем фронтальную камеру (с фолбэком)
    let constraints = {
      video: {
        width: { ideal: this.w },
        height: { ideal: this.h },
        facingMode: { exact: 'user' },
      },
      audio: false,
    }
    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints)
    } catch {
      constraints = { video: { facingMode: 'user' }, audio: false }
      this.stream = await navigator.mediaDevices.getUserMedia(constraints)
    }

    this.video.srcObject = this.stream
    // Если браузеру нужен клик — здесь вылетит исключение → ловим в сцене и просим Tap
    await this.video.play()

    // 3) Узнаём реальные размеры видеопотока и считаем прямоугольники под рендер
    this.vw = this.video.videoWidth || this.w
    this.vh = this.video.videoHeight || this.h
    this._recalcRects()

    // 4) Создаём канвас‑текстуру и картинку в сцене
    this.tex = this.scene.textures.createCanvas(this.texKey, this.w, this.h)
    this.img = this.scene.add
      .image(this.x + this.w / 2, this.y + this.h / 2, this.texKey)
      .setScrollFactor(0)
      .setDepth(this.depth)
    this.img.setDisplaySize(this.w, this.h) // на всякий случай, чтобы Image != масштабировался странно

    if (this.border) {
      this.frame = this.scene.add.graphics().setDepth(this.depth - 1)
      this.frame
        .lineStyle(10, 0xffffff, 0.9)
        .strokeRect(this.x - 2, this.y - 2, this.w + 4, this.h + 4)
    }

    this.ready = true
  }

  // Рендерим следующий кадр камеры в текстуру (учитываем fit и зеркало).
  update() {
    if (!this.ready || !this.tex || !this.video || this.video.readyState < 2)
      return
    const ctx = this.tex.getContext()
    if (!ctx) return

    const { sx, sy, sw, sh } = this.crop
    const { dx, dy, dw, dh } = this.dst

    ctx.save()
    if (this.mirror) {
      // Отзеркалим по X: меняем систему координат и рисуем с поправкой
      ctx.translate(this.w, 0)
      ctx.scale(-1, 1)
      ctx.drawImage(this.video, sx, sy, sw, sh, this.w - dx - dw, dy, dw, dh)
    } else {
      ctx.drawImage(this.video, sx, sy, sw, sh, dx, dy, dw, dh)
    }
    ctx.restore()

    this.tex.refresh()
  }

  // Можно вызывать, если поменяли w/h динамически.
  resize(w, h) {
    this.w = w
    this.h = h
    if (this.tex) this.scene.textures.remove(this.texKey)
    this.texKey = `camtex_${Phaser.Utils.String.UUID()}`
    this.tex = this.scene.textures.createCanvas(this.texKey, this.w, this.h)
    if (this.img) {
      this.img.setTexture(this.texKey)
      this.img.setPosition(this.x + this.w / 2, this.y + this.h / 2)
      this.img.setDisplaySize(this.w, this.h)
    }
    if (this.frame) {
      this.frame.clear()
      this.frame
        .lineStyle(2, 0xffffff, 0.9)
        .strokeRect(this.x - 2, this.y - 2, this.w + 4, this.h + 4)
    }
    if (this.vw && this.vh) this._recalcRects()
  }

  setPosition(x, y) {
    this.x = x
    this.y = y
    if (this.img) this.img.setPosition(this.x + this.w / 2, this.y + this.h / 2)
    if (this.frame) {
      this.frame.clear()
      this.frame
        .lineStyle(2, 0xffffff, 0.9)
        .strokeRect(this.x - 2, this.y - 2, this.w + 4, this.h + 4)
    }
  }

  destroy() {
    this.ready = false
    try {
      this.stream && this.stream.getTracks().forEach((t) => t.stop())
    } catch {}
    if (this.scene?.textures?.exists?.(this.texKey))
      this.scene.textures.remove(this.texKey)
    this.img && this.img.destroy()
    this.frame && this.frame.destroy()
    this.video = null
    this.stream = null
    this.tex = null
    this.img = null
    this.frame = null
  }

  // ===== helpers =====
  _recalcRects() {
    const boxW = this.w,
      boxH = this.h
    const boxAR = boxW / boxH
    const vidAR = this.vw / this.vh

    if (this.fit === 'cover') {
      // Кадр заполняет весь бокс без искажений — режем лишнее
      if (vidAR > boxAR) {
        const sh = this.vh
        const sw = sh * boxAR
        const sx = (this.vw - sw) / 2
        const sy = 0
        this.crop = { sx, sy, sw, sh }
        this.dst = { dx: 0, dy: 0, dw: boxW, dh: boxH }
      } else {
        const sw = this.vw
        const sh = sw / boxAR
        const sx = 0
        const sy = (this.vh - sh) / 2
        this.crop = { sx, sy, sw, sh }
        this.dst = { dx: 0, dy: 0, dw: boxW, dh: boxH }
      }
    } else {
      // 'contain' — вписываем целиком, возможны поля
      if (vidAR > boxAR) {
        const dw = boxW
        const dh = Math.round(boxW / vidAR)
        const dx = 0
        const dy = Math.round((boxH - dh) / 2)
        this.crop = { sx: 0, sy: 0, sw: this.vw, sh: this.vh }
        this.dst = { dx, dy, dw, dh }
      } else {
        const dh = boxH
        const dw = Math.round(boxH * vidAR)
        const dx = Math.round((boxW - dw) / 2)
        const dy = 0
        this.crop = { sx: 0, sy: 0, sw: this.vw, sh: this.vh }
        this.dst = { dx, dy, dw, dh }
      }
    }
  }
}
