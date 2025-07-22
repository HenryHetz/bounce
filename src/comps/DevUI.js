export class DevUI {
  constructor(scene) {
    this.scene = scene

    this.scene.add.image(0, 0, 'dev_ui').setOrigin(0).setAlpha(0).setScale(1)

    this.scene.add
      .image(640, 80, 'bot_chat')
      .setOrigin(1, 0)
      .setAlpha(1)
      .setScale(1)

    this.scene.add.image(0, 0, 'grid').setOrigin(0).setAlpha(0).setDepth(100)

    this.createEvents()
  }

  createEvents() {
    // this.scene.events.on('gameEvent', (data) => {
    //   if (data.mode === 'CASHOUT') {
    //     this.shake()
    //   }
    //   if (data.mode === 'BET') {
    //     // this.set(data.deposit)
    //   }
    // })
  }
}
