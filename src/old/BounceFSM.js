export class BounceFSM {
  constructor(onCrashCallback) {
    this.state = 'WAITING_FOR_BETS'
    this.bounceCount = 0
    this.crashIndex = null
    this.onCrashCallback = onCrashCallback
  }

  startRound(crashIndex) {
    if (this.state !== 'WAITING_FOR_BETS') return
    this.state = 'COUNTDOWN'
    this.bounceCount = 0
    this.crashIndex = crashIndex
  }

  finishCountdown() {
    if (this.state !== 'COUNTDOWN') return
    this.state = 'RUNNING'
  }

  onBounce() {
    if (this.state !== 'RUNNING') return

    if (this.bounceCount >= this.crashIndex) {
      this.crash()
    } else {
      this.bounceCount++
    }
  }

  crash() {
    this.state = 'CRASHED'
    if (this.onCrashCallback) {
      this.onCrashCallback(this.bounceCount)
    }
  }

  isWaiting() {
    return this.state === 'WAITING_FOR_BETS'
  }

  isCountdown() {
    return this.state === 'COUNTDOWN'
  }

  isRunning() {
    return this.state === 'RUNNING'
  }

  isCrashed() {
    return this.state === 'CRASHED'
  }
}
