export function assert(value: unknown, message?: string | Error): asserts value {
  // eslint-disable-next-line typescript/strict-boolean-expressions
  if (!value) {
    throw message instanceof Error ? message : new Error(message ?? 'Assertion failed')
  }
}
