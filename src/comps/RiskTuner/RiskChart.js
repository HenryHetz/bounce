// RiskChart.js

export class RiskChart {
  constructor(scene, chartX, chartY) {
    this.scene = scene
    this.chartX = chartX
    this.chartY = chartY
    this.barWidth = 50
    this.barGap = 10
    this.chartHeight = 400
    this.barsCount = 7

    this.graphics = scene.add.graphics()

    // Данные для анимации
    this.chartData = []
    for (let i = 0; i < this.barsCount; i++) {
      this.chartData.push({ value: 0 })
    }
  }

  redraw() {
    this.graphics.clear()
    this.graphics.fillStyle(0xff0000, 1)

    for (let i = 0; i < this.chartData.length; i++) {
      const progress = Phaser.Math.Clamp(this.chartData[i].value, 0, 1)
      const barHeight = this.chartHeight * progress
      const x = this.chartX + i * (this.barWidth + this.barGap)
      const y = this.chartY - barHeight

      this.graphics.fillRect(x, y, this.barWidth, barHeight)
    }
  }

  animateTo(targetValues) {
    for (let i = 0; i < this.chartData.length; i++) {
      this.scene.tweens.add({
        targets: this.chartData[i],
        value: targetValues[i],
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
