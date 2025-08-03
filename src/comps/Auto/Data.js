// на сервер

export function generateCashoutFractionArray() {
  const result = [0]
  for (let i = 1; i < 100; i++) {
    // было: (i / 100).toFixed(2) -> string
    result.push(parseFloat((i / 100).toFixed(2))) // теперь number: 0.01, 0.02, ...
  }
  return result
}

export function generateCashoutNumbersArray() {
  const result = []
  for (let i = 0; i < 11; i++) {
    result.push(i)
  }
  for (let i = 2; i < 11; i++) {
    result.push(i * 10)
  }
  return result
}

export function generateRoundsArray() {
  const result = []
  for (let i = 0; i <= 100; i++) {
    result.push(i)
  }
  return result
}
