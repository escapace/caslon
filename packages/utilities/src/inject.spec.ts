import { assert, describe, test } from 'vitest'
import { createApp, defineComponent } from 'vue'
import { inject } from './inject'

describe('inject', () => {
  test('.', () => {
    const app = createApp(defineComponent({}))

    app.provide('hello', 'world')

    assert.deepEqual(inject(app, 'hello'), 'world')
    assert.deepEqual(inject(app, 'abc'), undefined)
  })

  test('.', () => {
    const app = createApp(defineComponent({}))

    app.provide(Symbol.for('hello'), 'world')

    assert.deepEqual(inject(app, 'hello'), 'world')
    assert.deepEqual(inject(app, Symbol.for('hello')), 'world')
    assert.deepEqual(inject(app, 'abc'), undefined)
  })
})
