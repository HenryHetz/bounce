export class Skull {
  constructor(scene) {
    this.scene = scene
    this.x = 400
    this.y = 0
    this.scale = 1

    this.skull = this.scene.add
      .image(this.x, this.y, 'skull')
      .setOrigin(0.5, 0)
      .setScale(this.scale)
      .setAlpha(1)
      .setDepth(220)

    this.createEvents()
  }

  createEvents() {
    this.scene.events.on('gameEvent', (data) => {
      if (data.mode === 'CASHOUT') {
        this.shake()
      }
      if (data.mode === 'BET') {
        // this.set(data.deposit)
      }
    })
  }

  shake() {
    this.scene.tweens.add({
      targets: this.skull,
      scale: this.scale * 1.1,
      repeat: 2,
      duration: 20,
      yoyo: true,
    })
  }
}
