export function isValidTypeScale(value: unknown) {
  const number = Number(value)

  return number % 0.125 === 0 && String(number) === String(value)
}
