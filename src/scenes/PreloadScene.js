'use strict'

export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload')
  }
  init() {
    this.createScreen()
    this.createProgressBar()
  }
  preload() {
    // const loadingBar = new LoadingBar(this);
    this.preloadAssets()

    // так шрифты гарантировано не загружаются
    const fontsToLoad = [
      new FontFace('walibi', 'url(assets/fonts/walibi.ttf)'),
      new FontFace(
        'AvenirNextCondensedBold',
        'url(assets/fonts/AvenirNextCondensedBold.ttf)'
      ),
      new FontFace('JapanRobot', 'url(assets/fonts/JapaneseRobot.ttf)'),
      new FontFace('AvenirBlack', 'url(assets/fonts/AvenirBlack.ttf)'),
    ]

    // загружаем все параллельно
    Promise.all(fontsToLoad.map((font) => font.load()))
      .then((loadedFonts) => {
        loadedFonts.forEach((loaded) => {
          document.fonts.add(loaded)
        })

        // console.log('✅ Все шрифты загружены!')

        // можно подождать для красоты (как у тебя было)
        // this.time.delayedCall(1000, () => {
        //   this.scene.start('Game')
        // })
      })
      .catch((err) => {
        console.error('❌ Ошибка загрузки шрифтов:', err)
        // всё равно можно стартовать игру
        // this.scene.start('Game')
      })
    this.load.once('complete', () => {
      // можно подождать для красоты (как у тебя было)
      this.scene.start('Game')
      // this.time.delayedCall(1000, () => {
      //   this.scene.start('Game')
      // })
    })
  }
  createScreen() {
    this.add.image(0, 0, 'boot_bg').setOrigin(0).setAlpha(1).setScale(1)
  }
  createProgressBar() {
    let barWidth = 302
    let barHeight = 16
    let x = 170
    let y = 990

    let progressBar = this.add.graphics({
      fillStyle: {
        color: 0xff0000, // 00C4E5
        // alpha: 0.6,
      },
    })

    this.load.on('progress', (progress) => {
      //   console.log('load progress', progress)
      //   shape.scaleX = progress
      progressBar.clear()
      progressBar.fillStyle(0xff0000, 1)
      progressBar.fillRect(x, y, barWidth * progress, barHeight)
    })
  }
  preloadAssets() {
    // dev
    this.load.image('flash_copy', 'assets/sprites/elements/flash_copy.png')
    this.load.image('camera_frame', 'assets/sprites/dev/camera_frame.png')
    // this.load.image('dev_ui', 'assets/sprites/dev/drops_ui_5.png')
    // this.load.image('grid', 'assets/sprites/dev/grid.png')
    this.load.image('co', 'assets/sprites/dev/co_2.png')
    // this.load.image('bot_chat', 'assets/sprites/dev/bot_chart_4.jpg')

    // атласы
    this.load.atlas(
      'smileys',
      'assets/sprites/sheets/smileys.png',
      'assets/sprites/sheets/smileys.json'
    )
    // bg
    this.load.image('main_bg', 'assets/sprites/bg/BOUNCE_FUJI_BG_T_1.png')
    this.load.image('tuner_bg', 'assets/sprites/bg/tuner_bg.jpg')
    this.load.image('pattern', 'assets/sprites/bg/pattern.jpg')
    // console.log('pattern texture key:', pattern.texture.key)
    // elements
    // this.load.image('ball', 'assets/sprites/elements/ball_2.png')
    // this.load.image('platform', 'assets/sprites/elements/platform_2.png')

    // this.load.image('button_red', 'assets/sprites/elements/button_red.png')
    // this.load.image('button_black', 'assets/sprites/elements/button_black.png')
    // this.load.image(
    //   'button_yellow',
    //   'assets/sprites/elements/button_yellow.png'
    // )

    this.load.image('button_rules', 'assets/sprites/elements/button_rules.png')
    this.load.image(
      'button_auto_on',
      'assets/sprites/elements/button_auto_on.png'
    )
    this.load.image(
      'button_auto_off',
      'assets/sprites/elements/button_auto_off.png'
    )
    this.load.image('button_tuner', 'assets/sprites/elements/button_tuner.png')
    this.load.image('button_close', 'assets/sprites/elements/button_close.png')
    this.load.image('button_reset', 'assets/sprites/elements/button_reset.png')
    this.load.image('button_settings', 'assets/sprites/elements/button_settings.png')

    this.load.image(
      'slider_button',
      'assets/sprites/elements/slider_button.png'
    )
    // this.load.image(
    //   'button_create',
    //   'assets/sprites/elements/button_create.png'
    // )
    this.load.image(
      'button_bet_minus',
      'assets/sprites/elements/button_bet_minus.png'
    )
    this.load.image(
      'button_bet_plus',
      'assets/sprites/elements/button_bet_plus.png'
    )
    this.load.image('header', 'assets/sprites/bg/header.png')
    this.load.image('skull', 'assets/sprites/elements/skull_.png')
    this.load.image('ghost', 'assets/sprites/elements/ghost.png')
    this.load.image('volume_bar', 'assets/sprites/elements/volume_bar.png')

    // sounds
    this.load.audio('crash', 'assets/sounds/crash.mp3')
    this.load.audio('cashout', 'assets/sounds/cashout.mp3')
    this.load.audio('coin', 'assets/sounds/coin.mp3')
    this.load.audio('domino', 'assets/sounds/domino_2.mp3')
    this.load.audio('hit', 'assets/sounds/hit.mp3')
    this.load.audio('jingle', 'assets/sounds/jingle.mp3')
    this.load.audio('puck', 'assets/sounds/puck_down.mp3')

    // particles
    this.load.image('yellow', 'assets/sprites/particles/yellow.png')
    this.load.image('red', 'assets/sprites/particles/red.png')
  }

  startGame() {
    // console.log('this.game.data', this.game.data);
    this.scene.start('Game')
  }
}
