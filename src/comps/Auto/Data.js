// на сервер

export function generatePayoutFractionArray() {
  const result = [0]

  for (let i = 1; i < 100; i++) {
    result.push((i / 100).toFixed(2))
  }
  // for (let i = 10; i < 100; i++) {
  //   result.push(i * 10)
  // }
  return result
}

export function generatePayoutNumbersArray() {
  const result = []

  for (let i = 0; i < 100; i++) {
    result.push(i)
  }
  // for (let i = 10; i < 100; i++) {
  //   result.push(i * 10)
  // }
  return result
}

export function generateRoundsArray() {
  const result = []
  for (let i = 0; i <= 100; i++) {
    result.push(i)
  }
  return result
}
