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

    const fontsToLoad = [
      new FontFace('walibi', 'url(assets/fonts/walibi.ttf)'),
      new FontFace(
        'AvenirNextCondensedBold',
        'url(assets/fonts/AvenirNextCondensedBold.ttf)'
      ),
      // new FontFace('anotherFont', 'url(assets/fonts/AnotherFont.ttf)')
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
      this.time.delayedCall(1000, () => {
        this.scene.start('Game')
      })
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
    // main
    this.load.image('risk_bg', 'assets/sprites/bg/risk_bg.png')
    this.load.image('main_bg', 'assets/sprites/bg/bg_8.png')
    // elements
    this.load.image('ball', 'assets/sprites/elements/ball_2.png')
    this.load.image('platform', 'assets/sprites/elements/platform_2.png')
    this.load.image('button_cash', 'assets/sprites/elements/button_cash.png')
    this.load.image('button_out', 'assets/sprites/elements/button_out.png')
    this.load.image(
      'button_rules',
      'assets/sprites/elements/button_rules_3.png'
    )
    this.load.image('button_stake', 'assets/sprites/elements/button_stake.png')
    this.load.image('button_auto', 'assets/sprites/elements/button_auto.png')
    this.load.image('button_tuner', 'assets/sprites/elements/button_tuner.png')
    this.load.image('button_x', 'assets/sprites/elements/button_x.png')
    this.load.image(
      'button_close',
      'assets/sprites/elements/button_close_2.png'
    )
    this.load.image('button_reset', 'assets/sprites/elements/button_reset.png')
    this.load.image(
      'slider_button',
      'assets/sprites/elements/slider_button.png'
    )
    this.load.image(
      'button_create',
      'assets/sprites/elements/button_create.png'
    )
    this.load.image(
      'button_bet_minus',
      'assets/sprites/elements/button_bet_minus.png'
    )
    this.load.image(
      'button_bet_plus',
      'assets/sprites/elements/button_bet_plus.png'
    )
    this.load.image('header', 'assets/sprites/elements/header_2.png')
    // this.load.image('road_to_hell', 'assets/sprites/elements/road_to_hell.png')
    this.load.image('risk_tuner', 'assets/sprites/elements/risk_tuner.png')
    this.load.image('skull', 'assets/sprites/elements/skull_.png')
    this.load.image('volume_bar', 'assets/sprites/elements/volume_bar.png')

    // dev
    // this.load.image('dev_ui', 'assets/sprites/BOUNCE_7.png')
    this.load.image('grid', 'assets/sprites/dev/grid.png')
    // this.load.image('setting_hell', 'assets/sprites/setting_hell.png')

    // sounds
    this.load.audio('dropCoin', 'assets/sounds/dropCoin.mp3')
    this.load.audio('heart', 'assets/sounds/heart.mp3')
    // this.load.audio('fone1', 'assets/sounds/fone1.mp3')

    // particles
    this.load.image('yellow', 'assets/sprites/particles/yellow.png')
    // this.load.atlas(
    //   'particles',
    //   'assets/sprites/particles/particles.png',
    //   'assets/sprites/particles/particles.json'
    // )

    // this.load.atlas(
    //   'particles_2',
    //   'assets/sprites/particles_2.png',
    //   'assets/sprites/particles_2.json'
    // )
    // this.load.atlas(
    //   'flash_fx_circle',
    //   'assets/sprites/vfx/flash_fx_circle-0.png',
    //   'assets/sprites/vfx/flash_fx_circle-0.json'
    // )
    // this.load.atlas(
    //   'flash_fx_line',
    //   'assets/sprites/vfx/flash_fx_line.png',
    //   'assets/sprites/vfx/flash_fx_line.json'
    // )
    // this.load.atlas(
    //   'flash_fx_figure',
    //   'assets/sprites/vfx/flash_fx_figure.png',
    //   'assets/sprites/vfx/flash_fx_figure.json'
    // )
    // this.load.atlas(
    //   'flash_fx_attack',
    //   'assets/sprites/vfx/flash_fx_attack.png',
    //   'assets/sprites/vfx/flash_fx_attack.json'
    // )

    // this.load.atlas(
    //   'vfx_electricity',
    //   'assets/sprites/vfx/vfx_electricity.png',
    //   'assets/sprites/vfx/vfx_electricity.json'
    // )
    // this.load.atlas(
    //   'vfx_explosion',
    //   'assets/sprites/vfx/vfx_explosion.png',
    //   'assets/sprites/vfx/vfx_explosion.json'
    // )
    // this.load.atlas(
    //   'vfx_smoke',
    //   'assets/sprites/vfx/vfx_smoke.png',
    //   'assets/sprites/vfx/vfx_smoke.json'
    // )
    // this.load.atlas(
    //   'vfx_fire',
    //   'assets/sprites/vfx/vfx_fire.png',
    //   'assets/sprites/vfx/vfx_fire.json'
    // )
    // this.load.atlas(
    //   'vfx_orb_2',
    //   'assets/sprites/vfx/vfx_orb_2.png',
    //   'assets/sprites/vfx/vfx_orb_2.json'
    // )

    // this.load.atlas(
    //   'portal_10_blue',
    //   'assets/sprites/vfx/portal_10_blue.png',
    //   'assets/sprites/vfx/portal_10_blue.json'
    // )
    // this.load.atlas(
    //   'portal_9_blue',
    //   'assets/sprites/vfx/portal_9_blue.png',
    //   'assets/sprites/vfx/portal_9_blue.json'
    // )
    // this.load.atlas(
    //   'portal_3_blue',
    //   'assets/sprites/vfx/portal_3_blue.png',
    //   'assets/sprites/vfx/portal_3_blue.json'
    // )

    // this.load.once('complete', () => {
    //   // this.createFramesArrays();
    //   this.startGame()
    // })
  }

  startGame() {
    // console.log('this.game.data', this.game.data);
    this.scene.start('Game')
  }
}
