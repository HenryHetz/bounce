// Минимальная дуга Cashout: линейно, один цвет, без тиков и скруглений.
export class CashoutArc {
  constructor(scene, cfg) {
    this.scene = scene
    this.cx = cfg.x
    this.cy = cfg.y
    this.radius = cfg.radius ?? 150
    this.thickness = cfg.thickness ?? 22
    this.min = cfg.min ?? 0
    this.max = cfg.max ?? 50
    this.startDeg = (cfg.startDeg ?? 200) % 360
    this.sweepDeg = cfg.sweepDeg ?? 220
    this.mirrorHorizontal = !!cfg.mirrorHorizontal
    this.trackColor = cfg.trackColor ?? 0x0a2a4f
    this.trackAlpha = cfg.trackAlpha ?? 0.28
    this.fillColor = cfg.fillColor ?? 0xfdd41d
    this.ease = cfg.ease ?? 'Quad.easeOut'
    this.duration = cfg.duration ?? 400
    this.depth = cfg.depth ?? 1

    this.progress = 0
    this._tween = null

    // Отдельные graphics для фона и заливки.
    this.gTrack = scene.add
      .graphics()
      .setDepth(this.depth)
      .setPosition(this.cx, this.cy)
    this.gFill = scene.add
      .graphics()
      .setDepth(this.depth)
      .setPosition(this.cx, this.cy)

    this._drawTrack()
    this._redrawFill(0)
  }

  setValue(value, animate = true) {
    const clamped = Phaser.Math.Clamp(Number(value) || 0, this.min, this.max)
    const target = (clamped - this.min) / (this.max - this.min || 1)

    if (!animate) {
      this.progress = target
      this._redrawFill(target)
      return
    }

    this._tween?.stop()
    const proxy = { t: this.progress }
    this._tween = this.scene.tweens.add({
      targets: proxy,
      t: target,
      duration: this.duration,
      ease: this.ease,
      onUpdate: () => {
        this.progress = proxy.t
        this._redrawFill(proxy.t)
      },
      onComplete: () => {
        this.progress = target
        this._redrawFill(target)
      },
    })
  }

  setVisible(v) {
    this.gTrack.setVisible(v)
    this.gFill.setVisible(v)
  }
  destroy() {
    this._tween?.stop()
    this.gTrack.destroy()
    this.gFill.destroy()
  }

  // --- Внутреннее ---
  _toRad(deg) {
    // зеркалим по горизонтали (если нужно): θ' = 360° − θ
    const d = this.mirrorHorizontal ? (360 - deg) % 360 : deg
    return Phaser.Math.DegToRad(d)
  }

  _drawTrack() {
    const g = this.gTrack
    g.clear()
    const a0 = this._toRad(this.startDeg)
    const a1 = this._toRad(this.startDeg - this.sweepDeg)
    const anticlockwise = this.mirrorHorizontal ? false : true

    g.lineStyle(this.thickness, this.trackColor, this.trackAlpha)
    g.beginPath()
    g.arc(0, 0, this.radius, a0, a1, anticlockwise)
    g.strokePath()
  }

  _redrawFill(p) {
    const g = this.gFill
    g.clear()
    const clamped = Phaser.Math.Clamp(p, 0, 1)
    if (clamped <= 0) return

    const a0 = this._toRad(this.startDeg)
    const aEnd = this._toRad(this.startDeg - this.sweepDeg * clamped)
    const anticlockwise = this.mirrorHorizontal ? false : true

    g.lineStyle(this.thickness, this.fillColor, 1)
    g.beginPath()
    g.arc(0, 0, this.radius, a0, aEnd, anticlockwise)
    g.strokePath()
  }
}
