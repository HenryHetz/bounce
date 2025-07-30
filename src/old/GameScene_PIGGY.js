'use strict';
import { Tap, Swipe, Press } from 'phaser3-rex-plugins/plugins/gestures.js';
import { Buttons } from 'phaser3-rex-plugins/templates/ui/ui-components.js';
import Clock from 'phaser3-rex-plugins/plugins/clock.js';
import ContainerLite from 'phaser3-rex-plugins/plugins/containerlite.js';

import Boosters from '../Boosters';
import Goals from '../Goals';
import Settings from '../Settings';
import GameOver from '../GameOver';
import Piggy from '../Piggy';
import Bee from '../Bee';
import Bird from '../Bird';
// import Wolf from './Wolf';
import Rules from '../Rules';
import Tuple from '../Tuple';
import CloudsGroup from '../CloudsGroup';
import CoinsGroup from '../CoinsGroup';
import StarsGroup from '../StarsGroup';
// import StonesGroup from './StonesGroup';
import BirdItemsGroup from '../BirdItemsGroup';

class GameScene extends Phaser.Scene {
        constructor() {
                super('Game');
        }
        init() {
                // console.log('userData3', this.game.userData);
                // console.log('physics', this.physics);
                // this.physics.world.gravity.y = 400;
                //FACEBOOK 
                this.isAdsAllow = false;
                this.scale.lockOrientation('portrait');
                // this.physics.world.setBounds(20, 0, this.game.config.width - 40, 775, false, false, false, true);
                // this.physics.world.on('worldbounds', this.worldBounceCollide, this);
                this.rnd = Phaser.Math.RND;
                this.camera = this.cameras.main;
                this.depthValue = {
                        // background: 0,
                        counters: 1,
                        goals: 2,
                        coins: 2,
                        stars: 5,
                        // piggy: 0,
                        wolf: 5,
                        pause: 8,
                };
                this.game.userData.total.games +=1;
                this.totalGames = this.game.userData.total.games || 0;
                this.userLevel = this.game.userData.userLevel || 1;
                this.diamondsForLevelUp = this.game.userData.diamondsForLevelUp || 15;
                this.progress = this.game.userData.progress;
                this.totalMoney = this.game.userData.total.money || 0;
                this.diamondsCurrent = this.game.userData.diamonds.current || 0;
               
                // нужно прочекать current life на предмет срока годности добавленных и посчитать
                // this.game.userData.life.add = [
                //         { quant: 1, expiresGame: 10, gameStart: 691 },
                //         { quant: 2, expiresGame: 10, gameStart: 695 },
                //         { quant: 0, expiresGame: 0, gameStart: 0 }
                // ]
                this.expiresGame = 5;
                this.checkLifeExpires();
                // this.lifeCount = this.game.userData.life.current;
                // this.lifeCount = 9;
                this.moneyCount = 0;
                this.starCount = 0;
                this.coinCount = 0; // 0
                this.dropCount = 0;
                this.streak = 0;
                this.streakBest = 0;
                this.cloudCount = 0;
                this.tupleCount = 0;
                this.coinsValue = [1, 1, 1, 1, 2, 2, 2, 5, 5, 10];
                this.wind = 20;
                this.isMagnet = false;
                this.isBall = false;
                this.isPaused = false;
                this.isGameOver = false;
                // this.musicOn = this.game.userData.musicOn || true; // вкл / выкл музыка
                this.pausedStone = 0;
                this.pausedCoin = 0;
                this.lifeAdd = 3; // сколько жизней добавить за бриллианты
                this.lifeAddDiamondPrice = 2; // цена продолжения в бриллиантах - вынести в data
                this.lifeAdvertAdd = 2; // сколько жизней добавить за рекламу
                this.moneyRatio = 1;
                this.moneyRatio2xTreshold = 70;
                this.moneyRatio3xTreshold = 150; 
                // console.log('game scene init');
                this.initFont();
                this.initTouch();
                // dev
        }
        initFont() {
                this.textStyle = {
                        font: '30px', // здесь же другой шрифт можно указать
                        fill: '#ffffff', // цвет
                };
                this.countStyle = {
                        font: '30px Bracheos',
                        fill: '#FDE331', // цвет
                        stroke: '#762D0B', // обводка
                        strokeThickness: 6,
                };
                this.miniCountStyle = {
                        font: '20px Bracheos',
                        fill: '#6B280E', // цвет
                        // stroke: '#762D0B', // обводка
                        // strokeThickness: 6,
                };
                this.whiteCountStyle = {
                        font: '16px Bracheos',
                        fill: '#fff', // цвет
                        align: 'center',
                        stroke: '#762D0B', // обводка
                        strokeThickness: 4,
                };
        }
        initTouch() {
                this.pointer = {};
                this.pointer.x = 320;

                this.topLine = 140;
                this.bottomLine = 830;
                this.zonePigControl = this.add.zone(0, 200, this.game.config.width, this.bottomLine).setOrigin(0);
                // this.zoneBoostControl = this.add.zone(0, this.bottomLine, this.game.config.width, this.game.config.height).setOrigin(0);
                // this.zoneBoostControl.input.on('gameobjectdown', (pointer, gameObject, event) => {
                //         console.log('tap boosters', pointer, gameObject, event);
                // });
                // this.input.on('gameobjectdown', (pointer, gameObject, event) => {
                //         console.log('tap gameObject', pointer, gameObject, event);
                // });
                // this.zonePigControl.setInteractive();
                this.input.on(
                        'pointerdown',
                        function (pointer) {
                                // console.log('pointerdown', pointer.y);
                                if (pointer.y > this.bottomLine || pointer.y < this.topLine || this.isPaused) return;
                                this.pointer.x = pointer.x;
                                this.swipeLeft = false;
                                this.swipeRight = false;
                        },
                        this
                );
                // fullscreen
                // this.input.on(
                //         'pointerup',
                //         function (pointer) {
                //                 console.log('pointerup');
                //                 if (!this.scale.isFullscreen) {
                //                         this.scale.startFullscreen();
                //                 } else {
                //                         // scene.scale.startFullscreen();
                //                         // On start fulll screen
                //                 }
                //                 console.log('screen', this.scale.isFullscreen);
                //         },
                //         this
                // );

                this.swipe = new Swipe(this, { dir: 1 }).on(
                        'swipe',
                        (swipe) => {
                                // console.log('swipe', swipe.left, swipe.right);
                                if (this.isPaused) return;
                                if (swipe.left) this.pointer.x = 60; // можно перенести это в обработку движения
                                if (swipe.right) this.pointer.x = 580;
                                // this.piggy.findNearestCoin(swipe.left, swipe.right);
                                // }
                        },
                        this
                );
        }
        preload() {
                // this.load.audio('music_129', 'assets/sounds/music_129_1.mp3');
                // this.load.audio('game_over', 'assets/sounds/game_over.mp3');
                // this.load.audio('heart', 'assets/sounds/heart.mp3');
                // this.load.audio('coin2', 'assets/sounds/coin2.mp3');
                // this.load.audio('dropCoin', 'assets/sounds/dropCoin.mp3');
                // this.load.audio('star4', 'assets/sounds/star4.mp3');
                // this.load.audio('fone1', 'assets/sounds/fone1.mp3');
                // this.load.audio('clap', 'assets/sounds/clap.mp3');
                // this.load.audio('bee_jump', 'assets/sounds/bee_jump.mp3');
                // this.load.audio('seagull', 'assets/sounds/seagull2.mp3');
                // this.load.audio('puck_up', 'assets/sounds/puck_up.mp3');
                // this.load.audio('puck_down', 'assets/sounds/puck_down.mp3');
                // this.load.audio('coin_bounce', 'assets/sounds/coin_bounce.mp3');
                // this.load.audio('ratio_up', 'assets/sounds/ratio_up.mp3');
                // this.load.audio('ratio_down', 'assets/sounds/ratio_down.mp3');
        }
        create() {
                this.createBackground();
                this.createShrooms();

                if (!this.sounds) this.createSounds();
                // else this.sounds.setActive(true);
                this.sound.pauseOnBlur = false;
                this.sound.setMute(!this.game.userData.soundOn);
                this.gameSoundPlay();

                this.piggy = new Piggy(this);
                this.moveCounter = -1;
                this.bee = new Bee(this);
                this.bird = new Bird(this);
                this.coins = new CoinsGroup(this); //группа монет
                this.clouds = new CloudsGroup(this); //группа облаков
                this.stars = new StarsGroup(this); //группа звёзд
                this.birdItems = new BirdItemsGroup(this);
                if (this.totalGames < 10) this.rules = new Rules(this);
                // else // сделать предложение по звёздам, колесо фортуны
                
                // this.stones = new StonesGroup(this); //группа камней
                // this.wolf = new Wolf(this);
                this.createUI();
                this.addOverlap();
                // this.createAnim();
                this.game.saveUserData('main');
                
                if (!this.resume) {
                        this.resume = this.events.on('resume', (system, data) => {
                                // console.log('scene resume', data);
                                this.diamondsCurrent = this.game.userData.diamonds.current; // можно проверить на изменение
                                if (this.gameOver) {
                                        // console.log('this.gameOver', this.gameOver);
                                        if (this.gameOver.gemsCount.active) this.gameOver.gemsCount.setText(this.diamondsCurrent);
                                }
                                if (data.boosters) this.addBoosters(data.boosters);
                        });
                }
                // dev
                // this.gameOver = new GameOver(this); 
                // this.showPause('coin');
                // this.stopGame('coin');

        }
        createUI() {
                this.createLife();
                this.checkLife();
                this.createClock();
                this.createCounters();

                this.boosters = new Boosters(this); // бустеры
                this.goals = new Goals(this); // цели
                this.settingButton = new Settings(this); // настройки
                // this.shop = new Shop(this); // магазин
        }
        gameSoundPlay() {
                // console.log('gameSoundPlay', this.game.userData.musicOn);
                this.sounds.fone.play();
                if (this.game.userData.musicOn) this.sounds.theme.play();
                else this.sounds.theme.stop();
        }
        gamePauseOn() {
                this.isPaused = true;
                this.clock.pause();
        }
        gamePauseOff() {
                this.isPaused = false;
                this.clockText.setAlpha(1)
                this.clock.resume();
        }
        checkConditionsContinueGame(data) {
                // console.log('continue game', data);
                let conditions = false;

                if (this.pausedStone) {
                        // console.log('продолжение после камня');
                        // нужно как-то убирать камень!!!
                        this.stoppedStone.setAlive(false);
                }
                if (this.pausedCoin) {
                        // console.log('продолжение после монет');
                        if (data === 'diamonds') {
                                // console.log('всего бриллиантов', this.game.userData.diamonds.current);
                                if (this.checkDiamonds( this.lifeAddDiamondPrice, 'spent' )) {
                                        // console.log('спишем бриллианты');
                                        // this.game.userData.diamonds.current -= this.lifeAddDiamondPrice;
                                        this.lifeCount = this.lifeAdd;
                                        conditions = true;
                                } else {
                                        // console.log('недостаточно бриллиантов');
                                        // запускать магазин бриллиантов
                                }  
                        }
                        if (data === 'advert') {
                                // проверять сколько реклам сегодня просмотрено?
                                // запускать рекламу, а потом добавлять жизни
                                this.lifeCount = this.lifeAdvertAdd;
                                conditions = true;
                        }
                }
                if (conditions) this.continueGame();
                return conditions;
        }
        continueGame() {
                this.hidePause();
                this.gamePauseOff()
                this.gameSoundPlay();
                if (this.sounds.pause.isPlaying) this.sounds.pause.stop();
                this.checkLife();
        }
        stopGame(data) {
                // console.log('stop game', data);
                this.gamePauseOn()
                this.sounds.theme.stop();
                // this.sounds.pause.play();
                if (this.pausedCoin + this.pausedStone > 1) {
                        this.showGameOver();
                } else this.showPause(data);
        }
        checkUserData() {
                // console.log('checkUserData', this.game.userData.musicOn);
                let gameTime = +this.clockText.text;
                this.game.userData.total.time += gameTime;
                this.game.userData.total.money += this.moneyCount;

                if (this.game.userData.records.time < gameTime) this.game.userData.records.time = gameTime;
                if (this.game.userData.records.money < this.moneyCount) this.game.userData.records.money = this.moneyCount;
                if (this.game.userData.records.streak < this.streakBest) this.game.userData.records.streak = this.streakBest;
                // goals - просчитаны
                this.game.userData.goalsValue.forEach( (item, index) => {
                        this.goals.upgradeGoal(index);
                });
                this.game.userData.progress = this.game.userData.diamonds.achieved % this.diamondsForLevelUp;
                this.game.userData.userLevel = Phaser.Math.Snap.Floor(this.game.userData.diamonds.achieved / this.diamondsForLevelUp, 1) + 1;
                
                // console.log('userData4', this.game.userData);
                this.game.saveUserData('main');
        }
        restartGame() {
                // console.log('restart game');
                this.events.off('update');
                this.scene.restart();
        }
        showGameOver() {
                this.isGameOver = true;
                this.gameOver = new GameOver(this);
                this.checkUserData();
        }
        checkDiamonds(quant, method) {
                // console.log('checkDiamonds', quant, method);
                // проверим на остаток
                if (method === 'spent' && this.game.userData.diamonds.current - quant < 0) return false; // если не хватает бриллиантов на расход
                // суммировать и вычитать бриллианты
                this.game.userData.diamonds[method] += quant;
                this.game.userData.diamonds.total = this.game.userData.diamonds.achieved + this.game.userData.diamonds.bought + this.game.userData.diamonds.gifts;
                this.game.userData.diamonds.current = this.game.userData.diamonds.total - this.game.userData.diamonds.spent;
                // console.log('diamonds.current', this.game.userData.diamonds.current);
                this.game.saveUserData('main');
                this.diamondsCurrent = this.game.userData.diamonds.current; 
                return true;
        }
        createSounds() {
                this.sounds = {
                        theme: this.sound.add('music_129', {
                                volume: 0.05,
                                loop: true,
                                // delay: 5000,
                        }),
                        game_over: this.sound.add('game_over', {
                                volume: 0.1,
                        }),
                        pause: this.sound.add('pause_loop', {
                                volume: 0.05,
                                loop: true,
                                rate: 0.5,
                        }),
                        fone: this.sound.add('fone1', {
                                // volume: 0.01,
                                loop: true,
                                delay: 5000,
                        }),
                        heart: this.sound.add('heart', {
                                volume: 0.2,
                        }),
                        dropCoin: this.sound.add('dropCoin', {
                                volume: 0.2,
                        }),
                        coinCollect: this.sound.add('coin2', {
                                // volume: 0.2,
                        }),
                        starCollect: this.sound.add('star4', {
                                volume: 0.2,
                        }),
                        beeJump: this.sound.add('bee_jump', {
                                volume: 0.2,
                        }),
                        birdHurt: this.sound.add('seagull', {
                                volume: 0.05,
                        }),
                        // boom: this.sound.add('boom', {
                        //         volume: 0.1,
                        // }),
                        puckUp: this.sound.add('puck_up', {
                                volume: 0.5,
                        }),
                        puckDown: this.sound.add('puck_down', {
                                volume: 0.8,
                        }),
                        // impact: this.sound.add('impact', {
                        //         volume: 0.5,
                        // }),
                        button: this.sound.add('button', {
                                volume: 0.5,
                        }),
                        coinBounce: this.sound.add('coin_bounce', {
                                volume: 0.1,
                        }),
                        diamond: this.sound.add('diamond', {
                                volume: 0.1,
                        }),
                        ratio_up: this.sound.add('ratio_up', {
                                volume: 0.1,
                        }),
                        ratio_down: this.sound.add('ratio_down', {
                                volume: 0.1,
                        }),
                        clap: this.sound.add('clap', {
                                volume: 0.5,
                        }),
                        success: this.sound.add('success', {
                                volume: 0.5,
                        }),
                };
        }
        checkLifeExpires() {
                // console.log('checkLifeExpires', this.game.userData.life.add);
                let count = 0;
                this.game.userData.life.add.forEach(( item, index ) => {
                        // console.log('проверяем кол-во добавленных жизней', item);
                        if (item.quant) { // есть какое-то кол-во
                                // проверяем срок годности
                                let games = item.gameStart + item.expiresGame;
                                if (!games) games = 0;
                                if (this.totalGames > games) {
                                        // console.log('обнуляем дополнительную жизнь, срок вышел');
                                        item.quant = 0;
                                        item.gameStart = 0;
                                        item.expiresGame = 0;
                                }
                                if (item.quant > 0) count += item.quant;
                        }
                })
                // console.log('add lifes count', count);
                // return count;
                this.game.userData.life.current = this.game.userData.life.normal + count;
                this.lifeCount = this.game.userData.life.current;
        }
        addLife(quant) {
                // console.log('add lifes', quant);
                let add = this.game.userData.life.max - this.game.userData.life.current;
                if (add === 0) return;
                if (quant > add) quant = add;
                let array = this.game.userData.life.add;
                let isFinish = false;

                for (let index = 0; index < array.length; index++) {
                        if (array[index].quant === 0 && !isFinish) {
                                array[index].quant = quant;
                                array[index].expiresGame = this.expiresGame;
                                array[index].gameStart = this.totalGames;
                                isFinish = true;
                        } 
                }
                this.checkLifeExpires();
                this.checkLife();
        }
        createLife() {
                let x = 150;
                let y = 40;
                this.lifeCounterWrapper = this.add.image(x, y, 'game', 'counter_wrapper').setDepth(1).setScale(1).setAlpha(1);
                this.lifeNoticeText = this.add.text(x, y, 'Full', this.miniCountStyle).setAlign('center').setOrigin(0.5).setDepth(1);
               
                // plus button
                // this.lifeCounterPlusButton = this.add
                //         .image(x + 70, y, 'game', 'green_circle')
                //         .setDepth(1)
                //         .setScale(1.2)
                //         .setAlpha(1);
                // this.add
                //         .text(x + 70, y - 2, '+', this.whiteCountStyle)
                //         .setFontSize(40)
                //         .setDepth(1)
                //         .setOrigin(0.5);

                this.lifeHeart = this.add
                        .image(x - 80, y, 'game', 'heart')
                        .setScale(1)
                        .setAngle(-15)
                        .setAlpha(1)
                        .setDepth(1);
                this.lifeCountText = this.add.text(x - 80, y, this.lifeCount, this.countStyle)
                .setFont('20px Bracheos').setAlign('center').setOrigin(0.5).setDepth(1);
        }
        checkLife() {
                // console.log('checkLife', this.lifeCount, this.game.userData.life.current, this.game.userData.life.normal);
                let diff = this.lifeCount - this.game.userData.life.normal;
                if (diff > 0) this.lifeNoticeText.setText('+ ' + diff);
                if (diff < 0) this.lifeNoticeText.setText(diff);
                // максимум
                if (this.lifeCount >= this.game.userData.life.max) {
                        this.lifeCount = this.game.userData.life.max;
                        this.lifeNoticeText.setText('MAX');
                }
                // нуль
                if (this.lifeCount < 0) {
                        this.lifeCount = 0;
                        this.lifeNoticeText.setText('ZERO');
                }
                if (this.lifeCount === this.game.userData.life.normal) this.lifeNoticeText.setText('FULL');
                this.lifeCountText.setText(this.lifeCount);

                // анимация биения сердца при изменениях
                if (this.lifeHeartShake) this.lifeHeartShake.restart();
                else {
                        this.lifeHeartShake = this.tweens.add({
                                targets: [this.lifeHeart, this.lifeCountText],
                                scale: 0.7,
                                ease: 'Linear',
                                duration: 200,
                                repeat: 2,
                                yoyo: true,
                                onComplete: () => {
                                        this.lifeHeart.setScale(1);
                                        this.lifeCountText.setScale(1);
                                },
                        });
                }
                if (this.lifeCount <= 0) {
                        // console.log('Game over');
                        // this.lifeHeart.setAlpha(0.5);
                        this.pausedCoin++;
                        this.stopGame('coin');
                }
        }
        dropCoin() {
                // console.log('dropCoin');
                if (this.isPaused) return;
                this.dropCount++;
                this.lifeCount--;
                this.sounds.dropCoin.play();
                this.checkLife();
        }
        createClock() {
                this.clock = new Clock(this);
                this.clock.start();
                let x = 110;
                let y = 95;
                // по центру
                // this.add.image(320, 43, 'game', 'counter_wrapper').setDepth(1);
                // this.clockText = this.add.text(270, 25, '0', this.miniCountStyle).setDepth(1);
                // this.add.image(230, 38, 'game', 'clock').setDepth(1).setAngle(-15).setScale(0.7);

                // слева под сердцем
                this.clockWrapper = this.add.image(x, y, 'game', 'counter_wrapper').setDepth(1).setAlpha(1).setScale(1);
                this.clockText = this.add
                        .text(x - 45, y, '0', this.miniCountStyle)
                        .setDepth(1)
                        .setOrigin(0, 0.5);
                this.add
                        .image(x - 75, y - 5, 'game', 'clock')
                        .setDepth(1)
                        .setAngle(-15)
                        .setScale(0.6)
                        .setAlpha(1);
        }
        clockCount() {
                let value = Phaser.Math.Snap.To(this.clock.now, 100) / 1000;
                // let value = this.clock.now * 1000;
                // console.log(value);
                // let milisecond = value / 100;
                // let second = value % 60;
                // let minute = (value - second) / 60;
                // if (minute < 10) minute = "0" + minute;
                // if (minute <= 0) minute = "00";
                // if (minute > 59) minute = "00";
                // if (second < 10) second = "0" + second;
                // if (second < 0) second = "00";
                // if (minute <=0 )
                // this.clockValue = minute + ':' + second;
                return value;
        }
        addOverlap() {
                this.physics.add.overlap(this.piggy, this.coins, this.coinCollide, this.targetOverlapControl, this);
                this.physics.add.overlap(this.piggy, this.stars, this.starCollide, this.targetOverlapControl, this);
                this.physics.add.overlap(this.piggy, this.bee, this.beeCollide, this.targetOverlapControl, this);
                this.physics.add.overlap(this.piggy, this.birdItems, this.itemCollide, this.targetOverlapControl, this);
                this.physics.add.overlap(this.piggy, this.stones, this.stoneCollide, this.stoneOverlapControl, this);
        }
        coinCollide(piggy, coin) {
                // console.log('coin collide', piggy, coin);
                this.piggy.growth();
                coin.catchCoin(piggy);
                // меняем счётчик
                this.moneyCount += coin.value * this.moneyRatio;
                this.tupleCheck();
                this.goals.checkGoal(this.moneyCount, 1);
                this.sounds.coinCollect.play();
                this.moneyCountText.setText(this.moneyCount);
        }
        tupleCheck() {
                if (this.moveCounter < this.piggy.moveCounter) {
                        this.tupleCount++;
                        // console.log('tupleCheck');
                } else {
                        // console.log('tupleCheck', this.tupleCount);
                        if (this.tupleCount > 1) {
                                Tuple.generate(this, this.tupleCount);
                        }
                        this.tupleCount = 0;
                }
        }
        starCollide(piggy, star) {
                // console.log('coin collide', piggy, star);
                this.piggy.growth();
                star.catchStar(piggy);
                // меняем счётчик
                this.starCount++;
                this.sounds.starCollect.play();
                this.checkStarsCounter();
        }
        checkStarsCounter() {
                if (this.starsCounterSpriteShake) this.starsCounterSpriteShake.restart();
                else {
                        this.starsCounterSpriteShake = this.tweens.add({
                                targets: this.starsCounterSprite,
                                scale: '+=0.2',
                                ease: 'Linear',
                                duration: 200,
                                repeat: 1,
                                yoyo: true,
                                onComplete: () => {
                                        this.starsCounterSprite.setScale(0.6);
                                },
                        });
                }
                this.starsCountText.setText(this.starCount);
                this.boosters.checkBoosterButtonAlpha();
        }
        itemCollide(piggy, item) {
                // console.log('item collide', piggy, item);
                this.piggy.growth();
                item.catchItem(piggy);
                if (item.frame.name == 'heart') {
                        this.lifeCount++;
                        this.sounds.heart.play();
                        this.checkLife();
                }
                if (item.frame.name == 'shroom') {
                        this.piggy.miniSize();
                }
        }
        beeCollide(piggy, bee) {
                bee.jump();
                this.sounds.beeJump.play();
        }
        targetOverlapControl(piggy, target) {
                // console.log('targetOverlapControl', piggy.y, target.y);
                if (this.isPaused) return false;
                if (!target.active) return false;
                let sqrt = Phaser.Math.Distance.Between(target.x, target.y, piggy.x, piggy.y);
                // console.log('расстояние до хрюши', sqrt);
                if (sqrt > piggy.width / 2 + target.width / 2) return false;
        }
        stoneOverlapControl(piggy, stone) {
                // console.log('stoneOverlapControl', piggy.y, stone.y);
                if (this.isPaused) return false;
                if (!stone.active) return false;
                let sqrt = Phaser.Math.Distance.Between(stone.x, stone.y, piggy.x, piggy.y);
                // console.log('расстояние до хрюши', sqrt);
                if (sqrt > piggy.height / 2 + 20) return false;
        }
        stoneCollide(piggy, stone) {
                if (this.isPaused) return;
                if (!stone.active) return;
                // console.log('stone collide', piggy, stone);
                if (piggy.isHelmet) {
                        // stone.body.checkCollision.none = true;
                        stone.bounceStone(piggy);
                        piggy.removeHelmet();
                        this.sounds.impact.play();
                } else {
                        // хрюша смотрит в камеру!
                        this.pausedStone++;
                        stone.setActive(false);
                        stone.body.enable = false;
                        stone.body.checkCollision.none = true;
                        this.stopGame('stone');
                        this.stoppedStone = stone;
                }
        }
        createBackground() {
                this.background = this.add.image(-10, -15, 'bg').setOrigin(0).setAlpha(1); // нужно ставить в центр
        }
        createShrooms() {
                this.shroom1 = this.add.sprite(170, 735, 'shroom').setScale(0.7).setAngle(-10); // 170
                this.shroom2 = this.add.sprite(200, 730, 'shroom').setScale(1); // 200
                this.shroom3 = this.add.sprite(500, 730, 'shroom').setScale(0.9); // 500
                // console.log('sprite', this.shroom3);
                const frames = this.anims.generateFrameNames('shroom');
                // console.log('frames', frames);
                this.anims.create({
                        key: 'shroom',
                        frames,
                        frameRate: 4,
                        repeat: -1,
                });
                // this.shroom1.play('shroom');
                this.anims.staggerPlay('shroom', [this.shroom1, this.shroom2, this.shroom3], 100);
        }
        createPause() {
                let x = 320;
                let y = 320;
                // this.add.image(x, y, 'pause_example').setDepth(this.depthValue.pause).setScale(1.2).setAlpha(1);
                this.pauseWrapper = this.add.image(x, y, 'game', 'pause').setDepth(this.depthValue.pause).setScale(1.2).setAlpha(1);
                this.pauseText = this.add
                        .text(x, y - 130, 'II PAUSE', { font: '44px Bracheos' })
                        .setAlign('center')
                        .setOrigin(0.5)
                        .setDepth(this.depthValue.pause);

                this.pauseArticleText = this.add
                        .text(x, y - 75, 'PIGGY IS ALMOST DEAD!\nYOU CAN SAVE HER\nAND  CONTINUE OR\nSTART A NEW GAME', this.countStyle)
                        .setAlign('center')
                        .setOrigin(0.5, 0)
                        .setDepth(this.depthValue.pause)
                        .setFont('22px Bracheos');

                this.continueButton = this.add
                        .image(x - 120, y + 135, 'button_pause', 'button_pink')
                        .setDepth(this.depthValue.pause)
                        .setAlpha(1)
                        .setScale(0.8, 1.2)
                        .setAngle(2)
                
                this.continueButtonIcon = this.add
                        .image(this.continueButton.x + 15, this.continueButton.y, 'diamond', 'diamond_icon2')
                        .setDepth(this.depthValue.pause)
                        .setAlpha(1)
                        .setScale(0.45)
                        .setAngle(20)

                this.continueButtonText = this.add
                        .text(this.continueButton.x - 15, this.continueButton.y, this.lifeAddDiamondPrice, this.miniCountStyle)
                        .setFontSize(20)
                        .setDepth(this.depthValue.pause)
                        .setOrigin(0.5);

                this.pauseHeart = this.add
                        .image(this.continueButton.x - 45, y + 100, 'game', 'heart')
                        .setScale(0.65)
                        .setAngle(-15)
                        .setAlpha(1)
                        .setDepth(this.depthValue.pause);

                this.pauseLifeAdd = this.add
                        .text(this.pauseHeart.x, this.pauseHeart.y, '+' + this.lifeAdd, this.countStyle)
                        .setFont('14px Bracheos')
                        .setAlign('center')
                        .setOrigin(0.5)
                        .setDepth(this.depthValue.pause);

                this.continueButtonAdvert = this.add
                        .image(x, y + 137, 'button_pause', 'button_pink')
                        .setDepth(this.depthValue.pause)
                        .setAlpha(1)
                        .setScale(0.8, 1.2)
                        
                this.continueButtonAdvertIcon = this.add
                        .image(this.continueButtonAdvert.x + 20, this.continueButtonAdvert.y, 'game', 'ad_icon')
                        .setDepth(this.depthValue.pause)
                        .setAlpha(1)
                        .setScale(0.4)
                        
                this.continueButtonAdvertText = this.add
                        .text(this.continueButtonAdvert.x - 20, this.continueButtonAdvert.y, 'ADS', this.miniCountStyle)
                        .setFont('17px Bracheos')
                        .setDepth(this.depthValue.pause)
                        .setOrigin(0.5);

                this.pauseHeartAdvert = this.add
                        .image(this.continueButtonAdvert.x - 45, y + 100, 'game', 'heart')
                        .setScale(0.65)
                        .setAngle(-15)
                        .setAlpha(1)
                        .setDepth(this.depthValue.pause);

                this.pauseLifeAdvertAdd = this.add
                        .text(this.pauseHeartAdvert.x, this.pauseHeartAdvert.y, '+' + this.lifeAdvertAdd, this.countStyle)
                        .setFont('14px Bracheos')
                        .setAlign('center')
                        .setOrigin(0.5)
                        .setDepth(this.depthValue.pause);

                this.finishButton = this.add
                        .image(x + 120, y + 135, 'button_pause', 'button_yellow')
                        .setDepth(this.depthValue.pause)
                        .setAlpha(1)
                        .setScale(0.8, 1.2)
                        .setAngle(-2)
                        
                this.restartButtonText = this.add
                        .text(this.finishButton.x, y + 135, 'FINISH', this.miniCountStyle)
                        .setFont('17px Bracheos')
                        .setDepth(this.depthValue.pause)
                        .setOrigin(0.5);

                // кнопки активировать после проверки условий?
                this.continueButton.setInteractive().on('pointerdown', () => {
                        // console.log('tap continueButton');
                        if (this.checkConditionsContinueGame('diamonds')) this.sounds.heart.play();
                        else {
                                // не хватает бриллиантов? откроем магазин на странице с бриллиантами
                                this.openShop('diamonds');
                        }
                });

                this.continueButtonAdvert.setInteractive().once('pointerdown', () => {
                        // console.log('tap adsButton');
                        if (!this.isAdsAllow) {
                                // реклама недоступна
                                this.continueButtonAdvert.setTexture('button_pause', 'button_yellow');
                                return;
                        }
                        this.checkConditionsContinueGame('advert');
                        this.sounds.heart.play();
                });

                this.finishButton.setInteractive().once('pointerdown', () => {
                        // console.log('tap finishButton');
                        // this.restartGame();
                        this.hidePause();
                        this.showGameOver();
                        this.clockText.setAlpha(1)
                        // this.sounds.button.play();
                });

                this.pauseGroupe = this.add.group({ classType: Phaser.GameObjects.Image });
                this.pauseGroupe.addMultiple([
                        this.pauseWrapper,
                        this.pauseArticleText,
                        this.pauseText,
                        this.continueButton,
                        this.continueButtonIcon,
                        this.continueButtonText,
                        this.pauseHeart,
                        this.pauseLifeAdd,
                        this.continueButtonAdvert,
                        this.continueButtonAdvertIcon,
                        this.continueButtonAdvertText,
                        this.pauseHeartAdvert,
                        this.pauseLifeAdvertAdd,
                        this.finishButton,
                        this.restartButtonText,
                ]);
                this.pauseGroupe.setAlpha(0);
        }
        showPause(data) {
                // data - определять текст
                this.createPause();
                this.sounds.pause.play();
                // console.log('showPause', data, this.pauseGroupe);
                if (data == 'stone') {
                        this.pauseArticleText.setText('PIGGY IS ALMOST DEAD!\nYOU CAN SAVE HER\nAND  CONTINUE OR\nSTART A NEW GAME');
                        this.continueButtonText.setText('SAVE PIGGY');
                }
                if (data == 'coin') {
                        this.pauseArticleText.setText("Piggy'S LIVES ARE OVER!\nYOU CAN ADD LIVES\nAND  CONTINUE OR\nSTART A NEW GAME");
                        this.continueButtonText.setText(this.lifeAddDiamondPrice);
                }
                this.tweens.add({
                        targets: this.pauseGroupe.getChildren(),
                        alpha: 1,
                        y: '+=100',
                        ease: 'Linear',
                        duration: 200,
                        onComplete: () => {
                                if (data != 'coin') this.pauseLifeAdd.setVisible(false);
                                this.pauseHeartTweens = this.tweens.add({
                                        targets: [this.pauseHeart, this.pauseHeartAdvert],
                                        scale: '+=0.1',
                                        ease: 'Linear',
                                        duration: 200,
                                        yoyo: true,
                                        repeat: -1,
                                });
                                this.pauseTextTweens = this.tweens.add({
                                        targets: [this.pauseText, this.clockText],
                                        alpha: 0,
                                        ease: 'Linear',
                                        duration: 500,
                                        repeat: -1,
                                        yoyo: true,
                                        onComplete: () => {
                                                this.pauseText;
                                        },
                                });
                        },
                });
        }
        hidePause() {
                if (this.pauseTextTweens) this.pauseTextTweens.remove();
                if (this.pauseHeartTweens) this.pauseHeartTweens.remove();
                this.pauseGroupe.setAlpha(0);
                // this.pauseGroupe.clear(true, true);
                this.pauseGroupe.destroy(true);
        }
        createCounters() {
                // вверху всё
                let xS = 360;
                let yS = 40;
                this.starsCounterWrapper = this.add.image(xS, yS, 'game', 'counter_wrapper').setDepth(1).setScale(1).setAlpha(1);
                // console.log('image', this.starsCounterWrapper);
                this.starsCountText = this.add.text(xS, yS, this.starCount, this.miniCountStyle);
                this.starsCountText.setAlign('center').setOrigin(0.5).setDepth(1);
                this.starsCounterSprite = this.add
                        .image(xS - 70, yS - 2, 'game', 'star')
                        .setScale(0.6)
                        .setDepth(this.depthValue.counters)
                        // .setAngle(-15)
                        .setAlpha(1);
                // plus button
                // this.starsCounterPlusButton = this.add
                //         .image(xS + 70, yS, 'game', 'green_circle')
                //         .setDepth(this.depthValue.counters)
                //         .setScale(1.2)
                //         .setVisible(this.totalGames > 4);
                // this.starsCounterPlus = this.add
                //         .text(xS + 70, yS - 2, '+', this.whiteCountStyle)
                //         .setFontSize(40)
                //         .setDepth(this.depthValue.counters)
                //         .setOrigin(0.5)
                //         .setVisible(this.totalGames > 4);


                this.xM = 330;
                this.yM = 95;
                this.moneyCounterWrapper = this.add.image(this.xM, this.yM, 'game', 'counter_wrapper').setDepth(this.depthValue.counters).setScale(1).setAlpha(1);
                this.moneyCountText = this.add.text(this.xM, this.yM, this.moneyCount, this.miniCountStyle);
                this.moneyCountText.setAlign('center').setOrigin(0.5).setDepth(this.depthValue.counters);
                // this.moneyFireBallAnim = this.add
                //         .sprite(this.xM - 71, this.yM, 'fire_ball')
                //         .setDepth(this.depthValue.counters)
                //         .setScale(1)
                //         .setAlpha(1);
                this.moneyCounterIcon = this.add
                        .image(this.xM - 80, this.yM, 'game', 'coin$')
                        .setScale(1.1)
                        .setDepth(this.depthValue.counters)
                        // .setAngle(-15)
                        .setAlpha(1);
                this.moneyRatioFlag = this.add
                        .image(this.xM + 95, this.yM, 'game', 'notice_flag_green')
                        .setDepth(this.depthValue.counters)
                        .setScale(1, 1.1)
                        .setAlpha(0);

                this.moneyRatioText = this.add
                        .text(this.xM + 100, this.yM - 1, 'x2', this.whiteCountStyle)
                        .setFontSize(18)
                        .setDepth(this.depthValue.counters)
                        .setOrigin(0.5)
                        .setAlpha(0);

                let xSt = 550;
                let ySt = 65;        
                
                this.streakCounterWrapper = this.add.sprite(xSt, ySt, 'streak_wrapper', 'streak_wrapper_back').setDepth(this.depthValue.counters).setScale(1, 0.9).setAlpha(1);
                this.streakCounterWrapperTop = this.add.sprite(xSt, ySt, 'streak_wrapper', 'streak_wrapper_top_blue').setDepth(this.depthValue.counters).setScale(1, 0.9).setAlpha(1);
                this.streakIcon = [];
                for (let index = 0; index < 3; index++) {
                        this.streakIcon[index] = this.add
                        .image(xSt - 70 + index * 15, ySt - 49, 'game', 'coin$')
                        .setScale(0.5)
                        .setDepth(this.depthValue.counters)
                }
                this.streakCountText = this.add
                        .text(xSt, ySt - 45, this.streak, this.countStyle)
                        .setFontSize(44)
                        .setAlign('center')
                        .setOrigin(0.5, 0)
                        .setDepth(this.depthValue.counters);
                this.streakBestText = this.add.text(490, 87, 'Best:', this.miniCountStyle).setFont('16px Bracheos').setDepth(this.depthValue.counters);
                this.streakBestCountText = this.add
                        .text(560, 87, this.streakBest, this.miniCountStyle)
                        .setFont('16px Bracheos')
                        .setDepth(this.depthValue.counters);
                // this.ratio2xCoin = this.add.image(603, 63, 'coinX2').setDepth(this.depthValue.counters).setScale(0.6).setAlpha(0.8);
                this.ratioStreakText = this.add
                        .text(xSt + 15, ySt - 50, this.moneyRatio2xTreshold, this.countStyle)
                        .setFont('16px Bracheos')
                        .setAlign('right')
                        .setOrigin(1, 0.5)
                        .setDepth(this.depthValue.counters)
                        .setAlpha(1);

                this.ratioStreakNoticeText = this.add
                        .text(xSt + 50, ySt - 50, '>>> x2', this.countStyle)
                        .setFont('16px Bracheos')
                        .setAlign('center')
                        .setOrigin(0.5)
                        .setDepth(this.depthValue.counters)
                        .setAlpha(1);
        }
        coinsRowCheck(data) {
                // console.log('coinRowCheck', data);
                if (!data.catch) {
                        // если монета упала, ряд заканчивается
                        // if (this.streak > this.streakBest) {
                        //         this.streakBest = this.streak;
                        //         this.streakBestCountText.setText(this.streakBest);
                        // }
                        this.streak = 0; // обнуляем счётчик

                        this.tweens.add({
                                targets: this.streakCounterWrapper,
                                angle: { start: -5, to: 5 },
                                ease: 'Linear',
                                duration: 20,
                                repeat: 1,
                                yoyo: true,
                                onComplete: () => {
                                        this.streakCounterWrapper.setAngle(0);
                                },
                        });
                } else {
                        // this.streak += data.value; // если считаем деньги
                        this.streak++; // если считаем монеты
                        // if (this.streak > this.streakBest) {
                        //         this.streakBest = this.streak;
                        //         this.streakBestCountText.setText(this.streakBest);
                        // }
                }
                if (this.streak > this.streakBest) {
                        this.streakBest = this.streak;
                        this.streakBestCountText.setText(this.streakBest);
                }
                this.streakCountText.setText(this.streak);
                this.checkMoneyRatio();
                this.goals.checkGoal(this.streak, 2);
        }
        checkMoneyRatio() {
                let ratio;
                if (this.streak < this.moneyRatio2xTreshold) ratio = 1;
                else if (this.streak >= this.moneyRatio3xTreshold) ratio = 3;
                else ratio = 2;
                // console.log('ratio', ratio);
                if (ratio != this.moneyRatio) this.changeMoneyRatio(ratio);
        }
        changeMoneyRatio(ratio) {
                // let scale = this.moneyCounterIcon.scale;
                // console.log('scale', scale);
                if (ratio < this.moneyRatio) {
                        // понижение всегда до 1 со сбросом индикатора
                        this.sounds.ratio_down.play();
                        
                        this.moneyRatioText.setAlpha(0);
                        this.moneyRatioFlag.setAlpha(0);

                        if (this.moneyRatioFlagTweens) {
                                this.moneyRatioFlagTweens.remove();
                                this.moneyRatioFlag.setX(this.xM + 95);
                                this.moneyRatioText.setX(this.xM + 100);
                        }
                        
                        this.ratioStreakText.setText(this.moneyRatio2xTreshold);
                        this.ratioStreakNoticeText.setText('>>> x2');
                        this.streakCounterWrapperTop.setTexture('streak_wrapper', 'streak_wrapper_top_blue')
                        // this.streakCountText.setFontSize(30);

                        if (this.moneyIconTweens) {
                                // this.moneyIconTweens.stop();
                                this.moneyIconTweens.remove();
                                this.moneyCounterIcon.setScale(1.1)
                        }
                } else {
                        // повышение отображается на индикаторе
                        this.sounds.ratio_up.play();
                        this.moneyRatioText.setAlpha(1);
                        this.moneyRatioFlag.setAlpha(1);

                        if (ratio === 2) {
                                this.moneyRatioText.setText('x2');
                                this.moneyRatioFlag.setTexture('game', 'notice_flag_green');
                                this.ratioStreakText.setText(this.moneyRatio3xTreshold);
                                this.ratioStreakNoticeText.setText('>>> x3');
                                this.streakCounterWrapperTop.setTexture('streak_wrapper', 'streak_wrapper_top_green');
                        }
                        if (ratio === 3) {
                                this.moneyRatioText.setText('x3');
                                this.moneyRatioFlag.setTexture('game', 'notice_flag_pink');
                                this.ratioStreakText.setText('');
                                this.ratioStreakNoticeText.setText('');
                                this.streakCounterWrapperTop.setTexture('streak_wrapper', 'streak_wrapper_top_pink');
                        }
                        // console.log('this.moneyRatioFlagTweens', this.moneyRatioFlagTweens);
                        if (!this.moneyRatioFlagTweens) {
                                this.moneyRatioFlagTweens = this.tweens.add({
                                        targets: [this.moneyRatioText, this.moneyRatioFlag],
                                        x: '-=10',
                                        ease: 'Power1',
                                        yoyo: true,
                                        repeat: -1,
                                        duration: 500,
                                });
                                // console.log('this.moneyRatioFlagTweens new', this.moneyRatioFlagTweens);
                        } else if (!this.moneyRatioFlagTweens.isPlaying()) {
                                this.moneyRatioFlagTweens.totalDuration = 1000;
                                this.moneyRatioFlagTweens.restart();
                        } 
                        
                        // else this.moneyRatioFlagTweens.play();

                        // if (!this.moneyIconTweens) {
                        //         console.log('this.moneyIconTweens первый запуск');
                        //         this.moneyIconTweens = this.tweens.add({
                        //                 targets: this.moneyCounterIcon,
                        //                 scale: '+=0.1',
                        //                 ease: 'Linear',
                        //                 duration: 200,
                        //                 repeat: -1,
                        //                 yoyo: true,
                        //                 onComplete: () => {},
                        //                 callbackScope: this.moneyIconTweens
                        //         });
                        // } else if (!this.moneyIconTweens.isPlaying()) {
                        //         // console.log('this.moneyIconTweens перезапуск');
                        //         // this.moneyIconTweens.duration = 200
                        //         this.moneyIconTweens.restart();
                        // } else {
                        //         // console.log('this.moneyIconTweens ничего не делаем');
                        // }
                        // this.moneyRatioText.setAlpha(1);
                        Tuple.generate(this, 20 + ratio);
                }
                this.moneyRatio = ratio;
                // console.log('ratio', this.moneyRatio);
        }
        update() {
                // console.log(this.clock.now);
                this.clockText.setText(this.clockCount());
        }
        createAnim() {
                const fireBall = this.anims.generateFrameNames('fire_ball', {
                        prefix: 'fire_ball_circle_red',
                        start: 1,
                        end: 12,
                });
                // console.log('fireBall', fireBall);
                this.anims.create({
                        key: 'fireBall',
                        frames: fireBall,
                        frameRate: 6,
                        repeat: -1,
                });
                const fireRing = this.anims.generateFrameNames('fire_ball', {
                        prefix: 'flame_ring_hole_red',
                        start: 1,
                        end: 5,
                });
                // console.log('fireBall', fireBall);
                this.anims.create({
                        key: 'fireRing',
                        frames: fireRing,
                        frameRate: 8,
                        repeat: -1,
                });
                const flameExplode = this.anims.generateFrameNames('fire_ball', {
                        prefix: 'flame_explode',
                        start: 1,
                        end: 8,
                });
                // console.log('fireBall', fireBall);
                this.anims.create({
                        key: 'flameExplode',
                        frames: flameExplode,
                        frameRate: 8,
                        repeat: -1,
                });
                // this.moneyFireBallAnim.anims.play('flameExplode', true);
        }
        openShop(data) {
                this.scene.pause();
                this.scene.launch('Shop', data);
        }
        dispatchGift(gift) {
                // console.log('addGift', gift);
                if (gift.type === 'booster') {
                        this.boosters.addBooster( gift.name, gift.quant, true );
                } 
                if (gift.type === 'heart') {
                        this.addLife(gift.quant);
                } 
                if (gift.type === 'diamond') {
                        this.checkDiamonds(gift.quant, 'gifts');
                        if (this.gameOver) {
                                if (this.gameOver.gemsCount) this.gameOver.gemsCount.setText(this.diamondsCurrent);
                        }
                } 
        }
        addBoosters(set) {
                // console.log('addBoosters', set);
                this.boosters.boosters.forEach(( item, index ) => {
                        this.time.delayedCall(
                                1000 + 500 * index, 
                                () => {
                                        this.boosters.addBooster( item.name, set.quant, true );
                                        this.sounds.puckUp.play();
                                },
                        );
                })
        }
}

export default GameScene;
