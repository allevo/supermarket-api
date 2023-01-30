import { test } from 'tap'
import {join} from 'path'
import { build } from '../helper'
import nock from 'nock'

test('products', async (t) => {
  const app = await build(t)

  t.test('should return a list of products', async t => {
    const scope = nock('https://fakestoreapi.com')
      .get('/products')
      .replyWithFile(200, join(__dirname, 'fakestoreapi-products.json'), {
        'Content-Type': 'application/json',
      })

    const res = await app.inject({
      method: 'GET',
      url: '/supermarket/products',
    })
  
    t.equal(res.statusCode, 200)

    scope.done()
  
    const list = res.json()
    t.equal(list.length, 20)

    t.end()
  })

  t.test('should return 503 on fakestoreapi error', async t => {
    const scope = nock('https://fakestoreapi.com')
      .get('/products')
      .reply(500, {})

    const res = await app.inject({
      method: 'GET',
      url: '/supermarket/products',
    })
  
    t.equal(res.statusCode, 502)

    scope.done()

    t.end()
  })

  t.test('should return 503 if fakestoreapi returns an unknown response', async t => {
    const scope = nock('https://fakestoreapi.com')
      .get('/products')
      .reply(200, [{}])

    const res = await app.inject({
      method: 'GET',
      url: '/supermarket/products',
    })
  
    t.equal(res.statusCode, 500)

    scope.done()

    t.end()
  })

  t.end()
})

