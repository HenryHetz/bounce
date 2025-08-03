export class Chart {
  constructor(scene, chartX, chartY) {
    this.scene = scene
    this.chartX = chartX
    this.chartY = chartY
    this.barWidth = 50
    this.barGap = 10
    this.chartHeight = 440
    this.barsCount = 7

    this.anchors = null // массив X-координат (центров) столбиков, если нужен кастомный расклад
    this._barTweens = [] // твины по столбикам

    this.graphics = scene.add.graphics()

    // Данные для анимации
    this.chartData = []
    for (let i = 0; i < this.barsCount; i++) {
      this.chartData.push({ value: 0 })
      this._barTweens.push(null)
    }
  }

  // Новая: позволяет задать 2 столбика, их ширину/высоту и X-координаты
  configure({ barsCount, barWidth, chartHeight, anchors, barGap } = {}) {
    if (typeof barsCount === 'number' && barsCount !== this.barsCount) {
      this.barsCount = barsCount
      // перестраиваем данные
      this.chartData = Array.from({ length: this.barsCount }, () => ({
        value: 0,
      }))
      this._barTweens = Array.from({ length: this.barsCount }, () => null)
    }
    if (typeof barWidth === 'number') this.barWidth = barWidth
    if (typeof chartHeight === 'number') this.chartHeight = chartHeight
    if (typeof barGap === 'number') this.barGap = barGap
    if (Array.isArray(anchors)) this.anchors = anchors
    this.redraw()
  }

  _getBarX(i) {
    if (this.anchors && this.anchors[i] != null) {
      return this.anchors[i] - this.barWidth / 2 // anchors — центр столбика
    }
    // старое поведение по умолчанию
    return this.chartX + i * (this.barWidth + this.barGap)
  }

  redraw() {
    this.graphics.clear()
    this.graphics.fillStyle(0xff0000, 1)

    for (let i = 0; i < this.chartData.length; i++) {
      const progress = Phaser.Math.Clamp(this.chartData[i].value, 0, 1)
      const barHeight = Math.max(2, Math.round(this.chartHeight * progress))
      const x = this._getBarX(i)
      const y = this.chartY - barHeight

      this.graphics.fillRect(x, y, this.barWidth, barHeight)
    }
  }

  animateTo(targetValues) {
    for (let i = 0; i < this.chartData.length; i++) {
      const target = Phaser.Math.Clamp(targetValues[i] ?? 0, 0, 1)

      // останавливаем предыдущий твин, чтобы не дёргалось
      const prev = this._barTweens[i]
      if (prev && prev.isPlaying()) prev.stop()

      this._barTweens[i] = this.scene.tweens.add({
        targets: this.chartData[i],
        value: target,
        duration: 500,
        ease: 'Back.easeOut',
        onUpdate: () => this.redraw(),
      })
    }
  }

  reset() {
    for (let i = 0; i < this.chartData.length; i++) {
      this.chartData[i].value = 0
    }
    this.redraw()
  }
}
