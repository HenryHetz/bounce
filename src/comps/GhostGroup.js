'use strict'
// import Ghost from './Ghost'

export class GhostGroup extends Phaser.GameObjects.Group {
  constructor(scene) {
    super()
    this.scene = scene
    // this.defaults.setAllowGravity = false;
    this.startMaxDelay = 3000
    this.minDelay = 1000
    this.maxDelay = 3000
    this.maxCloud = 20 // было 30

    this.speedTimer = this.scene.time.addEvent({
      delay: 5000, // было 10000
      loop: true,
      callback: this.tick,
      callbackScope: this,
    })

    this.cloudTimer = this.scene.time.addEvent({
      // delay: 1000, // dev
      delay: Phaser.Math.Between(this.minDelay, this.maxDelay), // prod
      loop: true,
      callback: this.createCloud,
      callbackScope: this,
    })
    // console.log('this', this);
  }
  tick() {
    // ускоряем таймер появления облаков и ветер
    if (this.scene.isPaused) return
    this.scene.wind++
    if (this.scene.wind >= 60) this.scene.wind = 20 // было 60, спорно
    if (this.maxCloud < 40) this.maxCloud++
    if (this.minDelay > 100) this.minDelay -= 10
    if (this.maxDelay > 1000) this.maxDelay -= 10
    else this.maxDelay = this.startMaxDelay
    this.cloudTimer.delay = Phaser.Math.Between(this.minDelay, this.maxDelay)
    // console.log('wind, maxCloud, cloudCount', this.scene.wind, this.maxCloud, this.scene.cloudCount);
    // console.log('ghost init delay', this.minDelay, this.maxDelay, this.cloudTimer.delay);
    // if (this.cloudCount > 10) this.cloudTimer.paused = true; // работает пауза
  }
  createCloud() {
    // this.scene.cloudCount++;
    let ghost = this.getFirstDead()
    // console.log('ghost child', this.children.size);
    if (!ghost) {
      if (this.scene.cloudCount >= this.maxCloud) return
      ghost = Ghost.generate(this.scene)
      this.add(ghost)
      // ghost.move(ghost)
      this.scene.cloudCount++
    } else {
      ghost.reset()
    }

    // ghost.move();
  }
}

// export default GhostGroup;
