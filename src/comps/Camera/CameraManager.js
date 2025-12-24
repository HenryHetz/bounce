// camera/CameraManager.js
import { CameraWidget } from './CameraWidget'

const { Events } = Phaser.Scenes

export class CameraManager {
  /**
   * Минимальная интеграция:
   *   this.cameraManager = new CameraManager(this) // только сцена
   *
   * Если нужно — опции можно поменять через this.cameraManager.configure({...})
   */
  constructor(scene, opts) {
    this.scene = scene
    this.widgetOpts = opts
    // console.log('cameraManager widgetOpts', this.widgetOpts)
    // === дефолтные настройки (без передачи из сцены) ===
    this.rect = { x: 300, y: 120, w: 320, h: 360 } // где рисуем окно камеры
    this.rule = { multMin: 2, stepsAfter: 3, durationMs: 10000 } // “красивый момент”
    // this.widgetOpts = { fit: 'cover', mirror: true, depth: 1000, border: true }

    // === внутреннее состояние ===
    this.widget = null
    this.badge = null
    this.timer = null
    this.hint = null
    this.needTap = false

    // контекст раунда
    this.currentMultiplier = 1
    this.bounceCount = 0
    this.lastCashout = null

    // === подписки на события сцены (автономная жизнь менеджера) ===
    this._onGameEvent = this._onGameEvent.bind(this)
    this._onUpdate = this._onUpdate.bind(this)
    this._onShutdown = this._onShutdown.bind(this)

    scene.events.on('gameEvent', this._onGameEvent)
    scene.events.on(Events.UPDATE, this._onUpdate)
    scene.events.once(Events.SHUTDOWN, this._onShutdown)
    scene.events.once(Events.DESTROY, this._onShutdown)
  }

  // опционально — сменить настройки без пересоздания
  configure(opts = {}) {
    if (opts.rect) this.rect = { ...this.rect, ...opts.rect }
    if (opts.rule) this.rule = { ...this.rule, ...opts.rule }
    if (opts.widgetOpts)
      this.widgetOpts = { ...this.widgetOpts, ...opts.widgetOpts }
  }

  // Явный старт/стоп по кнопке (если захочешь вручную)
  start() {
    console.time('widget')
    if (!this.widget)
      this.widget = new CameraWidget(
        this.scene,
        // this.rect.x,
        // this.rect.y,
        // this.rect.w,
        // this.rect.h,
        this.widgetOpts
      )
    return this.widget.start().then(() => this._onStarted())
  }

  stop(whoIs) {
    console.log('camera stop', whoIs)
    console.timeEnd('widget')
    if (this.timer) {
      this.timer.remove(false)
      this.timer = null
    }
    if (this.badge) this.badge.setVisible(false)
    if (this.widget) {
      this.widget.destroy()
      this.widget = null
    }
    if (this.hint) {
      this.hint.destroy()
      this.hint = null
    }
    this.needTap = false
  }

  // ===== внутренние колбэки =====
  _onUpdate() {
    if (this.widget && this.widget.ready) this.widget.update()
  }

  _onGameEvent(e) {
    switch (e.mode) {
      case 'BOUNCE':
        this.bounceCount = e.count
        this.currentMultiplier = e.multiplier

        // тест: если множитель >= 5, включаем камеру и запись
        // if (e.multiplier >= 3 && !this._testTriggered) {
        //   this._testTriggered = true
        //   this.startAndRecord(20000) // 10 сек записи
        // }

        break
      case 'CASHOUT':
        this.lastCashout = {
          step: this.bounceCount,
          mult: this.currentMultiplier,
          time: this.scene.time.now,
        }
        break
      case 'FINISH':
        // this._maybeStartReaction()
        break
      case 'COUNTDOWN':
        // this.stop('COUNTDOWN') // новый раунд — на всякий случай выключаем камеру
        // this._testTriggered = false // dev
        break
    }
  }

  _maybeStartReaction() {
    const { multMin, stepsAfter, durationMs } = this.rule
    const nice =
      this.lastCashout &&
      this.lastCashout.mult >= multMin &&
      this.bounceCount - this.lastCashout.step <= stepsAfter

    if (!nice) return

    if (!this.widget)
      this.widget = new CameraWidget(
        this.scene,
        // this.rect.x,
        // this.rect.y,
        // this.rect.w,
        // this.rect.h,
        this.widgetOpts
      )

    this.widget
      .start()
      .then(() => this._onStarted())
      .catch(() => {
        // нужен пользовательский жест — скромная подсказка
        this.needTap = true
        this.hint = this.scene.add.text(
          this.rect.x,
          this.rect.y + this.rect.h + 8,
          'Tap to enable camera',
          { font: '18px Arial', color: '#ff6666' }
        )
        //   .setDepth((this.widgetOpts.depth ?? 1000) + 1)

        this.scene.input.once('pointerdown', () => {
          this.widget
            .start()
            .then(() => {
              this.needTap = false
              this.hint && this.hint.destroy()
              this._onStarted()
            })
            .catch((err) => console.warn('[Camera] start error', err))
        })
      })
  }

  /** Принудительный старт камеры и запись всего канваса */
  startAndRecord(durationMs) {
    if (!this.widget) {
      this.widget = new CameraWidget(
        this.scene,
        // this.rect.x,
        // this.rect.y,
        // this.rect.w,
        // this.rect.h,
        this.widgetOpts
      )
    }

    this.widget
      .start()
      .then(() => {
        this._onStarted()
        this._startRecording(durationMs)
      })
      .catch((err) => console.warn('[CameraManager] start error', err))
  }

  _startRecording(durationMs) {
    const canvas = this.scene.game.canvas
    const stream = canvas.captureStream(30) // FPS 30

    const recorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp8',
    })
    const chunks = []
    recorder.ondataavailable = (e) => chunks.push(e.data)
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = 'reaction-test.webm'
      a.click()
    }
    recorder.start()

    // Остановим через durationMs
    this.scene.time.delayedCall(durationMs, () => recorder.stop())
  }

  _onStarted() {
    // console.log('camera _onStarted')
    if (!this.badge) {
      this.badge = this.scene.add.text(
        this.rect.x + 8,
        this.rect.y - 26,
        'LIVE',
        {
          font: '18px Arial',
          color: '#ff4d4f',
        }
      )
      // .setDepth((this.widgetOpts.depth ?? 1000) + 1)
    } else {
      this.badge.setVisible(true)
    }
    if (this.timer) this.timer.remove(false)

    this.timer = this.scene.time.addEvent({
      delay: this.rule.durationMs,
      //   callback: () => this.stop('_onStarted'),
    })
  }

  _onShutdown() {
    // авто‑чистка при уничтожении сцены — тебе не нужно вызывать вручную
    this.scene?.events?.off('gameEvent', this._onGameEvent)
    this.scene?.events?.off(Events.UPDATE, this._onUpdate)
    this.stop('_onShutdown')
  }
}
