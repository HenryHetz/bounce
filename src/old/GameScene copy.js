import { DEFAULT_RISK_SETTING } from '../constants/riskConstants'
import { RiskTunerPanel } from '../features/RiskTuner/RiskTunerPanel'
import { Platforms } from '../comps/Platforms'

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('Game')
  }
  preload() {}
  init() {
    this.isCrashed = false // проигрыш

    this.gridUnit = 80
    this.sceneCenterX = 320 // центр сцены по X - через width найти
    this.ballX = 120
    this.ballY = 250

    // this.platformCount = 100 // сколько платформ
    this.platformHiddingCount = 6
    // this.platformSpacing = 140
    // this.platformStepping = -5 // -30
    // this.platformX =
    //   this.ballX + this.platformHiddingCount * this.platformSpacing
    this.platformY = this.gridUnit * 8.5

    this.distanceY = this.platformY - this.ballY
    // console.log('distance', this.distanceY)

    this.duration = 500
    this.isBouncing = false
    this.nextJumpTime = 0
    this.jumpInterval = 700

    this.bounceCount = 0 // отскоков
    this.deposit = 10000 // начальная сумма
    this.initialBet = 100 // начальная ставка
    this.stakeCount = 0 // ставка начальная пока
    this.allowCashOut = false // разрешить клик по кнопке "вывести деньги"
    this.roundCounter = 0 // счетчик раундов
    this.outCounter = 0 // счетчик вывода денег

    // dev
    this.tweens.timeScale = 1
    this.houseEdge = 1

    // this.defaultRiskSetting = {
    //   minPayout: 1.01,
    //   maxPayout: 10000,
    //   steps: 100,
    // }

    // this.currentRiskSetting = {
    //   minPayout: null,
    //   maxPayout: null,
    //   steps: null,
    // }

    this.defaultRiskSetting = DEFAULT_RISK_SETTING
    this.currentRiskSetting = { ...DEFAULT_RISK_SETTING }

    // на сервере!!!
    this.crashTable = this.generateCrashTable(this.defaultRiskSetting)
    // dev
    // this.checkMath()
  }
  create() {
    this.createBackground()
    // this.createVail()

    this.createBall()
    // this.createPlatforms()
    this.createStakeCounter()
    this.createStartCounter()
    // this.createDepositCounter()
    this.createParticles()
    this.createUI()
    this.createButtons()
    this.createMoneyCounter()

    this.createGrid()

    this.platforms = new Platforms(this)
    this.platforms.updatePlatforms(this.crashTable)

    this.riskTuner = new RiskTunerPanel(this, this.defaultRiskSetting)

    this.events.on('riskTuner:apply', (newRiskSetting) => {
      console.log('[GameScene] riskTuner:apply', newRiskSetting)
      this.pendingRiskSetting = { ...newRiskSetting }
    })

    if (!this.sounds) this.createSounds()

    this.initRound()
    // dev
    // this.createBallSheet()
  }
  createUI() {
    this.ui = this.add
      .image(0, 0, 'dev_ui')
      .setOrigin(0)
      .setAlpha(0)
      .setScale(1)

    this.header = this.add
      .image(0, 0, 'header')
      .setOrigin(0)
      .setAlpha(1)
      .setScale(1)
      .setDepth(200)
  }
  createGrid() {
    this.ui = this.add
      .image(0, 0, 'grid')
      .setOrigin(0)
      .setAlpha(0)
      .setDepth(100)
  }
  createButtons() {
    this.buttonCash = this.add
      .image(this.sceneCenterX, 12 * this.gridUnit, 'button_cash')
      .setOrigin(0.5, 0.5)
    // .setInteractive()
    this.events.on('startRound', (value) => {
      console.log('startRound теперь', value)

      if (value) {
        this.buttonCash.setTexture('button_cash')
        this.buttonCash.setAlpha(1)
        this.cashOutShadow.show(0)
        // this.stakeCounter.clearTint() // dev
      } else {
        // this.buttonCash.setAlpha(0.8)
      }
    })

    this.buttonRect = this.add
      .rectangle(this.sceneCenterX, 12 * this.gridUnit, 280, 120, 0x00ccff)
      .setOrigin(0.5)
      .setFillStyle(0x000000, 0)
      .setInteractive({ useHandCursor: false }) // курсор-рука при наведении

    this.buttonRect.addListener('pointerdown', () => {
      //   console.log('buttonRect clicked')
      handleCashClick.call(this)
    })

    function handleCashClick() {
      console.log('handleCashClick', this.allowCashOut)

      if (this.allowCashOut) {
        // обработка вывода денег
        this.allowCashOut = false
        this.sounds.heart.play()
        this.moneyCounterUpdate(this.stakeCount)
        this.outCounter += this.stakeCount
        this.buttonCash.setTexture('button_out')
        this.stakeCounter.setTint(0xff0000) // dev
        this.cashOutShadow.show(1)
        console.log(
          'rounds',
          this.roundCounter,
          'out ave',
          this.outCounter / this.roundCounter,
          'balance',
          this.outCounter - this.roundCounter * this.initialBet,
          'RTP%',
          (this.outCounter / (this.roundCounter * this.initialBet)) * 100
        )
      }
    }

    this.buttonStake = this.add
      .image(this.sceneCenterX, 10 * this.gridUnit, 'button_stake')
      .setOrigin(0.5, 0.5)
      .setAlpha(1)
    this.buttonStake.show = (state) => {
      this.buttonStake.visible = state
    }

    this.buttonNumbers = this.add
      .image(this.gridUnit, 12 * this.gridUnit, 'button_666')
      .setOrigin(0.5, 0.5)

    this.add
      .text(this.buttonNumbers.x, 11 * this.gridUnit, 'BET', {
        fontFamily: 'AvenirNextCondensedBold',
        fontSize: '18px',
        color: '#13469A',
      })
      .setOrigin(0.5, 0)

    this.buttonRisk = this.add
      .image(640 - this.gridUnit, 12 * this.gridUnit, 'button_risk')
      .setOrigin(0.5, 0.5)
      .setInteractive()
      .addListener('pointerdown', () => {
        console.log('buttonRisk clicked')
        this.riskTuner.show(true)
      })

    this.add
      .text(this.buttonRisk.x, 11 * this.gridUnit, 'TUNER', {
        fontFamily: 'AvenirNextCondensedBold',
        fontSize: '18px',
        color: '#13469A',
      })
      .setOrigin(0.5, 0)

    this.buttonRules = this.add
      .image(this.sceneCenterX, 14 * this.gridUnit, 'button_rules')
      .setOrigin(0.5, 0.5)
      .setDepth(200)
  }

  createBackground() {
    this.background = this.add
      .image(0, -100, 'main_bg')
      .setOrigin(0)
      .setAlpha(1)
      .setScale(1)
  }
  moveBack() {
    this.backgroundMove = this.tweens.add({
      targets: this.background,
      x: this.background.x - this.background.width + 640, // ширина экрана
      //   x: this.background.x, // на месте
      duration: this.duration * 2 * 100,
      // yoyo: true,
    })
  }
  stopBack() {
    this.backgroundMove.stop()
    this.tweens.add({
      targets: this.background,
      x: 0, // ширина экрана
      duration: 0,
      delay: 3000,
    })
  }
  createStartCounter() {
    this.startCounter = this.add
      .text(this.sceneCenterX, 6 * this.gridUnit, '', {
        font: '100px walibi',
        fill: 'red', // цвет '#FC03B5'
        // stroke: 'black', // обводка
        // strokeThickness: 6, // толщина обводки
      })
      .setOrigin(0.5)
      .setAlign('center')
      .setAlpha(0)

    this.startCounterUpdate = function (value) {
      this.startCounter.setText(value)
    }
    this.startCounterShow = function (show) {
      //   console.log('startCounterShow', show)
      // this.settingNotation.setAlpha(show)
      this.startCounter.setAlpha(show)
      // if (show) {
      //   this.startCounter.setAlpha(1)
      // } else {
      //   this.startCounter.setAlpha(0)
      // }
    }
  }
  createStakeCounter() {
    this.stakeCounter = this.add
      .text(this.sceneCenterX, 10 * this.gridUnit, '', {
        font: '40px walibi',
        fill: 'white', // цвет '#FC03B5'
        stroke: 'black', // обводка
        strokeThickness: 3, // толщина обводки
      })
      .setOrigin(0.5)
      .setAlign('center')
      .setAlpha(1)

    this.cashOutShadow = this.add
      .text(this.sceneCenterX, 10.5 * this.gridUnit, '', {
        font: '32px walibi',
        fill: 'rgba(0,0,0,0)', // цвет '#FC03B5'
        stroke: 'red', // обводка
        strokeThickness: 6, // толщина обводки
      })
      .setOrigin(0.5)
      .setAlign('center')
      .setAlpha(1)
      .setVisible(0)
    this.cashOutShadow.show = (state) => {
      this.cashOutShadow.alpha = state
    }
    this.stakeCounterUpdate = function (value) {
      if (value) {
        this.stakeCount = this.initialBet * value // добавляем к ставке
      } else {
        this.stakeCount = this.initialBet // сброс ставки
      }
      this.stakeCounter.setText(this.stakeCount.toFixed(2))
      this.cashOutShadow.setText(this.stakeCount.toFixed(2))
    }
  }
  createMoneyCounter() {
    // this.add
    //   .text(370, 40, '$$', {
    //     font: '40px walibi',
    //     fill: 'yellow', // цвет '#FC03B5'
    //     // stroke: 'black', // обводка
    //     // strokeThickness: 6, // толщина обводки
    //   })
    //   .setOrigin(0.5)
    this.skull = this.add
      .image(400, 0, 'skull')
      .setOrigin(0.5, 0)
      .setScale(1)
      .setAlpha(1)
      .setDepth(220)

    this.skull.shake = () => {
      this.tweens.add({
        targets: this.skull,
        scale: 1.1, // ширина экрана
        repeat: 2,
        duration: 20,
        yoyo: true,
      })
    }

    this.moneyCounter = this.add
      .text(450, 40, this.deposit.toFixed(2), {
        font: '24px walibi',
        fill: 'white', // цвет '#FC03B5'
        // stroke: 'black', // обводка
        // strokeThickness: 6, // толщина обводки
      })
      .setOrigin(0, 0.5)
      .setAlign('left')
      .setAlpha(1)
      .setDepth(210)

    this.moneyCounterUpdate = function (value) {
      if (value) {
        this.deposit += value // добавляем к ставке
      } else {
        // this.moneyCounter
      }
      this.moneyCounter.setText(this.deposit.toFixed(2))
      if (value > 0) this.skull.shake()
    }
  }
  createBall() {
    this.ball = this.add
      .image(this.ballX, this.ballY, 'ball')
      .setOrigin(0.5, 1)
      .setScale(0.8)
      .setAlpha(0)
  }
  // createPlatforms() {
  //   this.platforms = this.add.container(this.platformX, this.platformY)
  //   const colors = [0xffffff, 0xb0e0e6]

  //   for (let i = 0; i < this.platformCount; i++) {
  //     let color = colors[i % 2]
  //     //   console.log('color', color)
  //     let platform = this.add
  //       .image(0, 0, 'platform')
  //       .setScale(1)
  //       .setTint(color)
  //       .setOrigin(0.5, 0)

  //     let text = this.add
  //       .text(0, 20, '', {
  //         fontSize: '24px',
  //         color: '#000',
  //       })
  //       .setOrigin(0.5, 0.5)

  //     let unit = this.add.container(
  //       i * this.platformSpacing,
  //       i * this.platformStepping * Math.pow(1.02, i), // * Math.pow(1.02, i)
  //       [platform, text]
  //     )

  //     this.platforms.add(unit)
  //   }

  //   this.platforms.updatePlatforms(this.crashTable)
  // }
  initCrash() {
    let random = Math.random()
    // random = 0.9999999999999 // dev
    let multiplier = null
    let index = 0
    let acc = 0
    function getCrashIndex(crashTable) {
      for (let i = 0; i < crashTable.length; i++) {
        // acc += crashTable[i].probability
        if (random < crashTable[i].acc) {
          acc = crashTable[i].acc
          multiplier = crashTable[i].multiplier
          index = i
          return i
        }
      }
      return crashTable.length // fallback - проверить
    }
    this.crashIndex = getCrashIndex(this.crashTable) // следующий будет краш!
    this.crashIndex > 0 ? (this.crashIndex += 1) : 0
    // this.crashIndex = 99 // для тестов
    console.log(
      'random',
      random,
      'acc',
      acc,
      'index',
      index,
      'crashIndex',
      this.crashIndex,
      'multiplier',
      multiplier
    )
    return this.crashIndex
  }
  initRound() {
    if (this.pendingRiskSetting) {
      this.currentRiskSetting = { ...this.pendingRiskSetting }
      this.crashTable = this.generateCrashTable(this.currentRiskSetting)
      this.pendingRiskSetting = null
    }
    this.bounceCount = 0
    // this.random = Math.random()
    // console.log('random 1', this.random)
    this.initCrash()
    // console.log('crashIndex', this.crashIndex)
    this.isCrashed = false
    let countDown = 8
    // this.stakeCounterUpdate(this.stakeCount)

    this.time.addEvent({
      delay: 1000,
      callback: () => {
        countDown--
        if (countDown == 0) {
          this.buttonStake.show(0)
          this.startCounterUpdate('GO!')
          this.time.addEvent({
            delay: 500,
            callback: () => {
              this.startCounterShow(false)
            },
          })
        } else {
          this.startCounterUpdate(countDown)
          this.startCounterShow(true)
        }
      },
      repeat: countDown - 1,
      onComplete: () => {
        // console.log('startCounterShow')
        // this.startCounterShow(false)
      },
    })

    this.time.addEvent({
      delay: 3000,
      callback: () => {
        // this.startCounterShow(false)
        this.startRound()
      },
    })
  }
  startRound() {
    this.stakeCounterUpdate()
    this.stakeCounter.clearTint() // dev
    this.moneyCounterUpdate(-this.initialBet)

    this.platforms.updatePlatforms(this.crashTable)
    this.platforms.movePlatforms()

    this.ballReset()
    this.buttonStake.show(1)
    this.time.addEvent({
      delay: this.duration * (this.platformHiddingCount + 5),
      callback: () => {
        // this.ballReset()
        this.ballBouncing()
        this.moveBack()

        // dev
        this.roundCounter++
        this.events.emit('startRound', true)
      },
    })
  }
  checkCrash() {
    // console.log('checkCrash', this.bounceCount)
    if (this.bounceCount >= this.crashIndex) {
      console.log('CRASH!')
      this.isCrashed = true
      this.ball.setTint(0xff0000)
      //   return this.isCrashed
    }
  }
  // updatePlatforms(crashTable) {
  //   console.log('updatePlatforms', this.platforms)
  //   // var2
  //   this.platforms.list.forEach((unit, i) => {
  //     let text = unit.list[1]
  //     if (crashTable[i]) {
  //       unit.setVisible(true)
  //       let m = crashTable[i].multiplier
  //       let mult =
  //         m >= 1000 ? m.toFixed(0) : m >= 100 ? m.toFixed(1) : m.toFixed(2)
  //       text.setText('X' + mult)
  //     } else unit.setVisible(false)
  //   })
  // var1
  // for (let i = 0; i < this.platformCount; i++) {
  //   const unit = this.platforms.list[i]
  //   // let sprite = unit.list[0]
  //   let text = unit.list[1]
  //   let mult = null
  //   // dev
  //   if (crashTable[i]) {
  //     unit.visible = 1
  //     mult = crashTable[i].multiplier.toFixed(2) // например 'X3.25'
  //     if (crashTable[i].multiplier >= 100)
  //       mult = crashTable[i].multiplier.toFixed(1)
  //     if (crashTable[i].multiplier >= 1000)
  //       mult = crashTable[i].multiplier.toFixed(0)
  //     // if (crashTable[i].multiplier >= 10000) mult.toFixed(2) // нужно 10к делать
  //     text.setText('X' + mult)
  //   } else {
  //     unit.visible = 0
  //   }
  // }
  // }
  resetPlatform(array) {
    // console.log('resetPlatform', this.platforms.x)
    this.platforms.x = this.platformX
    this.platforms.y = this.platformY
    // console.log('resetPlatform', this.platforms.x)
    this.time.addEvent({
      delay: 1000,
      callback: () => {
        for (let i = 0; i < this.platforms.list.length; i++) {
          this.platforms.list[i].alpha = 1
          // console.log('platform', i, this.platforms[i].x, this.platforms[i].y)
        }
      },
    })
  }
  // movePlatforms_() {
  //   // console.log('movePlatforms')
  //   this.platformMoving = this.tweens.add({
  //     targets: this.platforms,
  //     x: this.platforms.x - this.platformSpacing * 105,
  //     // y: this.platforms.y - this.platformStepping * 105,
  //     duration: this.duration * 2 * 105,
  //     //   onComplete: () => {
  //     //     this.hidePlatform()
  //     //   },
  //   })
  // }
  // movePlatforms() {
  //   console.log('movePlatforms')
  //   this.platformMoving = this.tweens.add({
  //     targets: this.platforms,
  //     x: this.ballX,
  //     // y: this.platforms.y - this.platformStepping * 105,
  //     duration: this.duration * 2 * this.platformHiddingCount,
  //     //   onComplete: () => {
  //     //     this.hidePlatform()
  //     //   },
  //   })
  // }
  // moveNextPlatforms(step) {
  //   // console.log('moveNextPlatforms', step)
  //   // console.log(
  //   //   'x, y',
  //   //   this.platforms.list[step].x,
  //   //   this.platforms.list[step].y
  //   // )
  //   if (step < this.platforms.list.length) {
  //     this.platformMoving = this.tweens.add({
  //       targets: this.platforms,
  //       x: this.ballX - this.platforms.list[step].x,
  //       y: this.ballY - this.platforms.list[step].y + this.distanceY,
  //       // this.platformStepping / 2, //?
  //       duration: this.duration * 2,
  //       //   onComplete: () => {
  //       //     this.hidePlatform()
  //       //   },
  //     })
  //   } else {
  //     console.log('платформы закочились', step)
  //   }
  // }
  hidePlatform() {
    let unit = this.platforms.list[this.bounceCount]
    let y = unit.y
    let platformSprite = unit.list[0]
    let text = unit.list[1]
    // console.log('hidePlatform', unit)

    this.tweens.add({
      targets: unit,
      y: unit.y + 15,
      alpha: 0,
      duration: 50,
      onComplete: () => {
        unit.y = y
      },
    })
  }
  ballBouncing() {
    // console.log('ballBouncing')
    console.time('round duration')
    this.bounce = this.tweens.add({
      targets: this.ball,
      y: this.ballY + this.distanceY,
      duration: this.duration,
      yoyo: true,
      ease: 'Sine.easeIn',
      onYoyo: () => {
        // console.log('bounceCount', this.bounceCount)
        // dev
        if (this.bounceCount === 1 && !this.allowCashOut) {
          this.allowCashOut = true // нужно после первой платформы (или второй?)
          // this.events.emit('allowCashOutChanged', this.allowCashOut)
        }

        this.checkCrash(this.bounceCount)
        if (this.isCrashed) {
          this.stopMoving(this.bounceCount)
          console.timeEnd('round duration')
          this.sounds.dropCoin.play()
          this.initRound()
          this.allowCashOut = false
          // this.events.emit('allowCashOutChanged', this.allowCashOut)
        } else {
          this.platforms.hidePlatform(this.bounceCount)
          this.stakeCounterUpdate(this.crashTable[this.bounceCount].multiplier)
          this.bounceCount++
          this.platforms.moveNextPlatforms(this.bounceCount)
          //   this.stakeCounter.updateText(this.bounceCount)
          //   this.bounce.timeScale = 1 + this.bounceCount * 0.02
        }
      },
      onRepeat: () => {
        // this.bounceCount++
        // this.duration = -count * 20
        // console.log('onRepeat', this.bounceCount)
      },
      onComplete: () => {
        // this.duration - count * 20
      },
      repeat: -1, // бесконечное повторение
      repeatDelay: 0, // задержка между повторениями
    })
  }
  stopMoving(bounceCount) {
    this.stopBall()
    this.platforms.hideAndResetPlatforms(bounceCount)
    this.stopBack()
  }
  // stopPlatforms() {
  //   // console.log('stopPlatforms', this.bounceCount)
  //   let dissapearPlatformStart = this.bounceCount
  //   // this.platformMoving.stop()
  //   this.time.addEvent({
  //     delay: 500,
  //     callback: () => {
  //       this.dissapearPlatform(dissapearPlatformStart)
  //       this.time.addEvent({
  //         delay: 1000,
  //         callback: () => {
  //           this.resetPlatform()
  //         },
  //         // loop: true
  //       })
  //     },
  //     // loop: true
  //   })
  //   // this.movePlatforms()
  // }
  // dissapearPlatform(count) {
  //   // console.log('dissapearPlatform', count)
  //   let quant = 0
  //   for (let i = count; i < count + this.platformHiddingCount; i++) {
  //     //   this.platforms.list[i].alpha = 1
  //     if (i <= this.platforms.list.length - 1) {
  //       this.tweens.add({
  //         targets: this.platforms.list[i],
  //         alpha: 0,
  //         duration: 150,
  //         delay: quant * 100,
  //         //   yoyo: true,
  //       })
  //     }
  //     quant++
  //   }
  // }
  stopBall() {
    // console.log('stopBall', this.bounceCount)
    this.bounce.stop()
    // разбить и убить
    this.emitter.explode(30, this.ball.x, this.ball.y)
    // потом поднять
    this.ballUp()
  }
  ballUp() {
    // this.ball.alpha = 0
    this.tweens.add({
      targets: this.ball,
      delay: 10,
      alpha: 0,
      duration: 0,
      onComplete: () => {
        this.tweens.add({
          targets: this.ball,
          delay: 1000,
          y: this.ballY,
          duration: 0,
          onComplete: () => {
            // this.stakeCounterUpdate(this.stakeCount)
          },
        })
      },
    })
  }
  ballReset() {
    this.ball.clearTint()
    this.ball.y = this.ballY
    let scale = this.ball.scale
    // this.ball.alpha = 1
    this.tweens.add({
      targets: this.ball,
      //   delay: 10,
      alpha: 1,
      duration: 3000,
      onComplete: () => {
        // придумать что-то другое
        // this.tweens.add({
        //   targets: this.ball,
        //   delay: 0,
        //   scale: scale * 1.1,
        //   y: this.ball.y + 10,
        //   duration: 200,
        //   repeat: 5,
        //   yoyo: true,
        //   onComplete: () => {
        //     // this.stakeCounterUpdate(this.stakeCount)
        //     this.ball.scale = scale
        //   },
        // })
      },
    })
    // console.log('ballReset', this.ball.alpha, this.ball.y)
  }
  createSounds() {
    this.sounds = {
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
    }
  }
  createParticles() {
    this.emitter = this.add.particles(
      0,
      0, // стартовая позиция, не важна — мы двигаем emitter потом
      'yellow',
      {
        speed: 500,
        lifespan: 500,
        scale: { start: 2, end: 0 },
        blendMode: 'ADD',
        emitting: false,
      }
    )
  }
  update(time, delta) {
    if (this.isCrashed || !this.isBouncing) return

    // if (time >= this.nextJumpTime) {
    //   this.performBounce()
    //   this.nextJumpTime = time + this.jumpInterval
    // }
  }
  generateCrashTable(crashSetting) {
    console.log('crashSetting', crashSetting)

    const ratio = Math.pow(
      crashSetting.maxPayout / crashSetting.minPayout,
      1 / (crashSetting.steps - 2)
    )
    console.log('ratio', ratio)

    const RTP = 1 - this.houseEdge / 100

    let acc = 0

    const crashTable = []

    for (let i = 0; i < crashSetting.steps; i++) {
      let multiplier, base
      if (i === 0) {
        multiplier = 0
        base = 0
      } else {
        multiplier = crashSetting.minPayout * Math.pow(ratio, i - 1)
        base = RTP / multiplier
      }

      crashTable.push({
        step: i,
        multiplier,
        probability: undefined,
        acc: undefined,
        base,
      })
    }

    for (let i = crashTable.length - 1; i >= 0; i--) {
      // console.log(i, 'обратка', i, crashTable[i].multiplier)
      if (i < crashTable.length - 1 && i !== 0) {
        crashTable[i].probability = crashTable[i].base - crashTable[i + 1].base
      } else {
        crashTable[i].probability = crashTable[i].base
      }
      crashTable[i].acc = 1 - acc
      acc += crashTable[i].probability
      if (i === 0) crashTable[i].probability = 1 - acc
    }

    console.table(crashTable)
    return crashTable
  }
  checkMath() {
    const roundCount = 1000000
    const result = []
    let RTP = 0

    for (let index = 1; index < this.crashTable.length; index++) {
      const playerChoice = this.crashTable[index].multiplier
      let winCount = 0
      let x1 = 0

      for (let ind = 0; ind < roundCount; ind++) {
        let acc = 0
        let multiplier = 0
        let random = Math.random() // первый на х1 краш

        for (let i = 0; i < this.crashTable.length; i++) {
          // можно один раз зафиксировать асс и не считать
          // let half = this.crashTable[i].probability * 0.5 // половина
          // if (i === 0) acc += this.crashTable[i].probability
          // else acc += half
          // acc += this.crashTable[i].probability

          if (random < this.crashTable[i].acc) {
            multiplier = this.crashTable[i].multiplier
            if (playerChoice <= multiplier) {
              winCount++
            }
            if (multiplier === 0) x1++
            break
          }
          // if (i > 0) acc += half
        }
      }
      let rtp = ((winCount * playerChoice) / roundCount) * 100
      RTP += rtp
      result.push({
        index,
        Crashes: x1,
        playerChoice,
        winCount,
        win: winCount * playerChoice,
        'RTP %': rtp,
      })
    }
    console.table(result)
    console.log('ave RTP', RTP / (this.crashTable.length - 1))
  }
}
