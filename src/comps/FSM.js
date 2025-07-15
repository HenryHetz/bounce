export class FSM {
  constructor() {
    this.state = 'COUNTDOWN'
    this.listeners = []
  }

  getState() {
    return this.state
  }

  onChange(callback) {
    this.listeners.push(callback)
  }

  emitChange() {
    for (const cb of this.listeners) {
      cb(this.state)
    }
  }

  toCountdown() {
    this.state = 'COUNTDOWN'
    this.emitChange()
  }

  toRound() {
    if (this.state !== 'COUNTDOWN') return
    this.state = 'ROUND'
    this.emitChange()
  }

  toFinish() {
    if (this.state !== 'ROUND') return
    this.state = 'FINISH'
    this.emitChange()
  }
}
