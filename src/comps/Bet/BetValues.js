// на сервер

export const BetValues = []

const rows = [
  { start: 0.1, step: 0.1, count: 9 },
  { start: 1, step: 1, count: 9 },
  { start: 10, step: 5, count: 8 },
  { start: 50, step: 10, count: 5 },
  { start: 100, step: 25, count: 4 },
  { start: 200, step: 50, count: 17 },
]

for (const row of rows) {
  for (let i = 0; i < row.count; i++) {
    BetValues.push(Number((row.start + i * row.step).toFixed(2)))
  }
}
