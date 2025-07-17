// нормализация, дискретизация

export function normalize(value, min, max) {
  return Phaser.Math.Clamp((value - min) / (max - min), 0, 1)
}

export function getDiscreteValue(array, normalizedPosition) {
  const step = 1 / (array.length - 1)
  const index = Math.round(normalizedPosition / step)
  return array[Phaser.Math.Clamp(index, 0, array.length - 1)]
}

export function getSliderValue(slider) {
  if (slider.axis === 'y') {
    return Phaser.Math.Clamp(
      1 - (slider.button.y - slider.min) / (slider.max - slider.min),
      0,
      1
    )
  } else {
    return Phaser.Math.Clamp(
      (slider.button.x - slider.min) / (slider.max - slider.min),
      0,
      1
    )
  }
}

export function setSliderValue(slider, value) {
  value = Phaser.Math.Clamp(value, 0, 1)
  // slider.button.x = slider.min + value * (slider.max - slider.min)
  if (slider.axis === 'y') {
    slider.button.y = slider.min + (1 - value) * (slider.max - slider.min)
  } else {
    slider.button.x = slider.min + value * (slider.max - slider.min)
  }
}
