function generateCrashTable(minPayout, maxPayout, steps) {
  const crashTable = []
  const ratio = Math.pow(maxPayout / minPayout, 1 / (steps - 1))
  const RTP = 0.99
  let acc = 0

  for (let i = 0; i < steps; i++) {
    const multiplier = minPayout * Math.pow(ratio, i)
    let rate = 1 / multiplier
    acc += rate
    crashTable.push({
      step: i + 1,
      multiplier: Number(multiplier), // округляем до 3 знаков
      rate,
      acc,
    })
  }

  return crashTable
}

// Пример использования:
const table = generateCrashTable(1.1, 10, 100)
console.table(table)

// const roundCount = 100
// const wins = []
// let random = Math.random()
// let acc = 0

// for (let i = 0; i < roundCount; i++) {}
