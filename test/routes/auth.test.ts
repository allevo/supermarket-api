import { test } from 'tap'
import { build } from '../helper'

test('auth login', async (t) => {
  const app = await build(t)

  t.test('should return a jwt token', async t => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        username: 'allevo',
        password: 'pippo',
      }
    })
  
    t.equal(res.statusCode, 200)
  
    t.match(res.json(), {
      token: /^.*\..*\..*$/
    })
  })

  t.test('should return 400', async t => {
    const tests = [
      {
        title: 'without username',
        requestBody: { password: 'pippo' }
      },
      {
        title: 'without password',
        requestBody: { username: 'allevo' }
      },
      {
        title: 'on empty object',
        requestBody: {}
      }
    ]

    for (const test of tests) {
      const {title, requestBody} = test

      t.test(title, async t => {
        const res = await app.inject({
          method: 'POST',
          url: '/auth/login',
          payload: requestBody
        })

        t.equal(res.statusCode, 400)

        t.end()
      })
    }

    t.end()
  })

  t.test('should return 401', async t => {
    const tests = [
      {
        title: 'if user not found',
        requestBody: { username: 'unknown-user', password: 'pippo' }
      },
      {
        title: 'if the password is wrong',
        requestBody: { username: 'allevo', password: 'wrong-password' }
      },
    ]

    for (const test of tests) {
      const {title, requestBody} = test

      t.test(title, async t => {
        const res = await app.inject({
          method: 'POST',
          url: '/auth/login',
          payload: requestBody
        })

        t.equal(res.statusCode, 401)

        t.end()
      })
    }

    t.end()
  })
})
