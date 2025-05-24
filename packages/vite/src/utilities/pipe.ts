/* eslint-disable typescript/no-unsafe-return */
/* eslint-disable typescript/no-unsafe-call */
/* eslint-disable typescript/no-unsafe-function-type */
/* eslint-disable typescript/no-explicit-any */
interface Pipe {
  <A>(value: A): A
  <A, B>(value: A, function1: (input: A) => B): B
  <A, B, C>(value: A, function1: (input: A) => B, function2: (input: B) => C): C
  <A, B, C, D>(
    value: A,
    function1: (input: A) => B,
    function2: (input: B) => C,
    function3: (input: C) => D,
  ): D
  <A, B, C, D, E>(
    value: A,
    function1: (input: A) => B,
    function2: (input: B) => C,
    function3: (input: C) => D,
    function4: (input: D) => E,
  ): E
  // ... and so on
}

export const pipe: Pipe = (value: any, ...fns: Function[]): unknown =>
  fns.reduce((accumulator, function_) => function_(accumulator), value)
