export class CameraWidget {
  constructor(scene, x, y, w = 300, h = 400) {
    this.scene = scene
    this.x = 300
    this.y = 200
    this.w = w
    this.h = h
    this.texKey = `camtex_${Phaser.Utils.String.UUID()}`
    this.stream = null
    this.video = null
    this.img = null
    this.frame = null
    this.fit = 'cover' // 'cover' | 'contain'
    this.mirror = true // зеркало для фронталки
    this.ready = false
    this.vw = 0
    this.vh = 0 // реальные размеры видео
    this.crop = null // {sx,sy,sw,sh} для cover
    this.dst = null // {dx,dy,dw,dh} для contain
  }

  async start() {
    this.ready = false
    this.video = document.createElement('video')
    this.video.muted = true
    this.video.autoplay = true
    this.video.playsInline = true

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
    } catch (_) {
      constraints = { video: { facingMode: 'user' }, audio: false }
      this.stream = await navigator.mediaDevices.getUserMedia(constraints)
    }
    this.video.srcObject = this.stream
    await this.video.play() // если нужен тап — вылетит в catch наверх

    this.vw = this.video.videoWidth || this.w
    this.vh = this.video.videoHeight || this.h
    this._recalcRects()
    this.ready = true

    // создаём текстуру только после успешного play()
    this.tex = this.scene.textures.createCanvas(this.texKey, this.w, this.h)
    this.img = this.scene.add
      .image(this.x + this.w / 2, this.y + this.h / 2, this.texKey)
      .setScrollFactor(0)
      .setDepth(1000)

    this.frame = this.scene.add.graphics().setDepth(999)
    this.frame
      .lineStyle(2, 0xffffff, 0.85)
      .strokeRect(this.x - 2, this.y - 2, this.w + 4, this.h + 4)

    this.ready = true // <— теперь можно обновлять
  }

  update() {
    if (!this.ready || !this.tex || !this.video || this.video.readyState < 2)
      return
    const ctx = this.tex.getContext()
    if (!ctx) return
    ctx.drawImage(this.video, 0, 0, this.w, this.h)
    this.tex.refresh()
  }

  destroy() {
    this.ready = false
    try {
      this.stream && this.stream.getTracks().forEach((t) => t.stop())
    } catch {}
    if (this.scene.textures.exists(this.texKey))
      this.scene.textures.remove(this.texKey)
    this.img && this.img.destroy()
    this.frame && this.frame.destroy()
  }
}
