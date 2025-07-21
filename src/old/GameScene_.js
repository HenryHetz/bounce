import { DEFAULT_RISK_SETTING } from '../constants/riskConstants'
import { Background } from '../comps/Background'
import { RiskTunerPanel } from '../comps/RiskTuner/RiskTunerPanel'
import { Ball } from '../comps/Ball'
import { Platforms } from '../comps/Platforms'
import { FSM } from '../comps/BounceFSM'

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
    this.platformY = this.gridUnit * 8.5
    this.distanceY = this.platformY - this.ballY
    // console.log('distance', this.distanceY)

    this.duration = 500

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

    this.defaultRiskSetting = DEFAULT_RISK_SETTING
    this.currentRiskSetting = { ...DEFAULT_RISK_SETTING }

    // на сервере!!!
    this.crashTable = this.generateCrashTable(this.defaultRiskSetting)
    // dev
    // this.checkMath()
  }
  create() {
    this.background = new Background(this)
    this.createStakeCounter()
    this.createStartCounter()
    // this.createDepositCounter()
    this.createParticles()
    this.createUI()
    this.createButtons()
    this.createMoneyCounter()

    this.ball = new Ball(this, this.emitter)
    this.platforms = new Platforms(this)
    this.platforms.updatePlatforms(this.crashTable)

    this.riskTuner = new RiskTunerPanel(this, this.defaultRiskSetting)

    this.events.on('riskTuner:apply', (newRiskSetting) => {
      // console.log('[GameScene] riskTuner:apply', newRiskSetting)
      this.pendingRiskSetting = { ...newRiskSetting }
      // this.newRiskSettingNotice.show()
    })

    if (!this.sounds) this.createSounds()

    this.initRound()
    // dev
    // this.createBallSheet()
    // this.createGrid()
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

    this.newRiskSettingNotice = this.add
      .text(this.sceneCenterX, this.gridUnit * 1.3, '', {
        fontSize: '24px',
        color: '#FDD41D',
        fontFamily: 'AvenirNextCondensedBold',
      })
      .setOrigin(0.5, 0)
      .setAlpha(0)

    this.newRiskSettingNotice.show = (setting) => {
      if (setting) {
        // это кастом или дефолт?
        const diffSettings = () => {
          const d = this.defaultRiskSetting
          const c = setting
          return (
            d.minPayout !== c.minPayout ||
            d.maxPayout !== c.maxPayout ||
            d.steps !== c.steps
          )
        }
        let text
        if (diffSettings()) text = 'NEW CUSTOMS:'
        else text = 'SET DEFAULTS:'

        this.newRiskSettingNotice.text =
          // 'New settings in the next round...',
          `${text} ${setting.minPayout} -> ${setting.steps} -> ${setting.maxPayout}`

        this.newRiskSettingNotice.alpha = 1
        this.tweens.add({
          targets: this.newRiskSettingNotice,
          alpha: 0, // ширина экрана
          duration: 5000,
        })
      }
    }

    this.newRiskSettingNotice.show(this.defaultRiskSetting)
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
      // console.log('startRound теперь', value)

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
      // console.log('handleCashClick', this.allowCashOut)

      if (this.allowCashOut) {
        // обработка вывода денег
        this.allowCashOut = false
        this.sounds.heart.play()
        this.moneyCounterUpdate(this.stakeCount)
        this.outCounter += this.stakeCount
        this.buttonCash.setTexture('button_out')
        this.stakeCounter.setTint(0xff0000) // dev
        this.cashOutShadow.show(1)
        // console.log(
        //   'rounds',
        //   this.roundCounter,
        //   'out ave',
        //   this.outCounter / this.roundCounter,
        //   'balance',
        //   this.outCounter - this.roundCounter * this.initialBet,
        //   'RTP%',
        //   (this.outCounter / (this.roundCounter * this.initialBet)) * 100
        // )
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
        // console.log('buttonRisk clicked')
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
  update(time, delta) {}

  // на сервер
  generateCrashTable(crashSetting) {
    // console.log('crashSetting', crashSetting)

    const ratio = Math.pow(
      crashSetting.maxPayout / crashSetting.minPayout,
      1 / (crashSetting.steps - 2)
    )
    // console.log('ratio', ratio)

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

    // console.table(crashTable)
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
  initRound() {
    if (this.pendingRiskSetting) {
      this.currentRiskSetting = { ...this.pendingRiskSetting }
      this.crashTable = this.generateCrashTable(this.currentRiskSetting)
      this.newRiskSettingNotice.show(this.pendingRiskSetting)
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
    // console.log(
    //   'random',
    //   random,
    //   'acc',
    //   acc,
    //   'index',
    //   index,
    //   'crashIndex',
    //   this.crashIndex,
    //   'multiplier',
    //   multiplier
    // )
    return this.crashIndex
  }
  startRound() {
    this.stakeCounterUpdate()
    this.stakeCounter.clearTint() // dev
    this.moneyCounterUpdate(-this.initialBet)

    this.platforms.updatePlatforms(this.crashTable)
    this.platforms.movePlatforms()

    this.ball.reset()
    this.buttonStake.show(1)

    this.time.addEvent({
      delay: this.duration * (this.platforms.hiddingCount + 5),
      callback: () => {
        // this.ballBouncing()
        this.ball.fall(() => {
          this.bounceHandler()
        })
        // this.moveBack()
        this.background.move()
        // dev
        this.roundCounter++
        this.events.emit('startRound', true)
      },
    })
  }
  bounceHandler() {
    // console.log('bounceHandler')
    this.checkCrash(this.bounceCount)
    if (this.isCrashed) {
      // console.timeEnd('round duration')
      this.stopMoving(this.bounceCount)
      this.sounds.dropCoin.play()
      this.initRound()
      this.allowCashOut = false
      // this.events.emit('allowCashOutChanged', this.allowCashOut)
    } else {
      this.platforms.hidePlatform(this.bounceCount)
      this.stakeCounterUpdate(this.crashTable[this.bounceCount].multiplier)
      this.bounceCount++
      this.platforms.moveNextPlatforms(this.bounceCount)
      this.ball.bounce(() => {
        this.bounceHandler()
      })

      if (this.bounceCount === 1 && !this.allowCashOut) {
        this.allowCashOut = true // нужно после первой платформы (или второй?)
        // this.events.emit('allowCashOutChanged', this.allowCashOut)
      }
    }
  }
  checkCrash() {
    // console.log('checkCrash', this.bounceCount)
    // логика проверки краша:
    // до касания платформы делаем запрос на сервер с номером подходящей платформы
    // isCrash?
    // если да, крашим
    if (this.bounceCount >= this.crashIndex) {
      // console.log('CRASH!')
      this.isCrashed = true
      this.ball.setTint(0xff0000)
      //   return this.isCrashed
    }
  }
  stopMoving(bounceCount) {
    // this.stopBall()
    this.ball.stop()
    this.platforms.hideAndResetPlatforms(bounceCount)
    // this.stopBack()
    this.background.stop()
  }
}
