// на сервер

export function generateMinPayoutArray() {
  // return [
  //   1.01, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2, 3, 4, 5, 6, 7, 8, 9,
  //   10,
  // ]
  return [
    1.01, 1.02, 1.03, 1.04, 1.05, 1.06, 1.07, 1.08, 1.09,
    1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.0
  ]
}

export function generateMaxPayoutArray() {
  const result = []
  let i = 0
  for (let iteration = 3; iteration < 10; iteration++) {
    for (let index = 1; index < 10; index++) {
      i++
      let multy = 10 ** iteration
      result.push(index * multy)
      if (index * multy === 1000000) return result
    }
  }
  return result
}

export function generateStepsArray() {
  const result = [10]
  for (let i = 1; i < 91; i++) {
    result.push(result[i - 1] + 1)
  }
  return result
}
