'use strict';
import Star from './Star';

class StarsGroup extends Phaser.Physics.Arcade.Group {
        constructor(scene) {
                super(scene.physics.world);
                this.scene = scene;
                this.starCounter = 0;
                this.timer = this.scene.time.addEvent({
                        // startAt: 2000, // работает?
                        // delay: 1000, // dev
                        delay: Phaser.Math.Between(3000, 10000), // было 4000, 10000
                        loop: true,
                        callback: this.tick,
                        callbackScope: this,
                });
                // console.log('timer', this.timer);
        }
        getStarCounter() {
                return this.starCounter;
        }
        tick() {
                if (this.scene.coinCount < 3) return; // подобрать нужный старт
                this.createStar();
        }
        createStar() {
                if (this.scene.isPaused) return;
                let star = this.getFirstDead();
                // console.log('star child', this.children.size);
                if (!star) {
                        star = Star.generate(this.scene);
                        this.add(star);
                        this.starCounter++;
                } else {
                        star.reset();
                }
                star.move();
        }
}

export default StarsGroup;
