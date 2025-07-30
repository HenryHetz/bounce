export class RiskSettingNotice {
  constructor(scene) {
    this.scene = scene
    this.x = this.scene.sceneCenterX
    this.y = 9 * this.scene.gridUnit + 20

    this.label = scene.add
      .text(this.x, this.y, '', {
        fontSize: '18px',
        color: '#FDD41D',
        fontFamily: 'AvenirNextCondensedBold',
      })
      .setOrigin(0.5, 0)
      .setAlign('center')
      .setAlpha(0)

    this.createEvents()
  }

  createEvents() {
    this.scene.events.on('gameEvent', (data) => {
      if (data.mode === 'RISK_SETTING_CHANGED') {
        this.handleEvent(data)
      }
      if (data.mode === 'RISK_SETTING_PENDING') {
        this.set('New settings in the next round...')
        this.show(true)
      }
    })
  }
  handleEvent(data) {
    // console.log('RISK_SETTING_CHANGED', data)
    // default: this.defaultRiskSetting,
    // current: this.currentRiskSetting,
    // crashTable: this.crashTable,
    // старый метод
    if (data) {
      // это кастом или дефолт?
      const diffSettings = () => {
        const d = data.default
        const c = data.current
        return (
          d.minPayout !== c.minPayout ||
          d.maxPayout !== c.maxPayout ||
          d.steps !== c.steps
        )
      }
      let text
      if (diffSettings()) text = 'CUSTOM:'
      else text = 'DEFAULT:'

      this.label.text =
        // 'New settings in the next round...',
        `${text} ${data.current.minPayout} -> ${data.current.maxPayout} | ${data.current.steps}`

      this.label.alpha = 1
      this.scene.tweens.add({
        targets: this.label,
        alpha: 0, // ширина экрана
        duration: 7000,
      })
    }

    // this.set(data.text)
    // this.show(data.show)
  }
  set(value) {
    this.label.setText(value)
  }
  show(value) {
    this.label.setAlpha(value)
  }
}
