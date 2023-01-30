import Ajv from 'ajv'
import { test } from 'tap'
import { Cart, CartType } from '../../src/types/cart'
import { build } from '../helper'
import { CheckoutResponse, CheckoutResponseType } from '../../src/routes/supermarket/carts';


test('carts', async (t) => {
  const app = await build(t)

  const token = await login(t, app, GOOD_CREDENTIAL)
  const devilToken = await login(t, app, DEVIL_CREDENTIAL)

  await t.test('the user can fetch own cart', async t => {
    const res = await app.inject({
      method: 'GET',
      url: '/supermarket/carts/mine',
      headers: {
        authorization: `Bearer ${token}`
      }
    })
  
    t.equal(res.statusCode, 200)

    const cart = validate<CartType>(t, Cart, res.json())
    t.equal(cart.userId, 42)
    t.strictSame(cart.products, [])

    await t.test('add a product', async t => {
      const res = await app.inject({
        method: 'PATCH',
        url: '/supermarket/carts/mine',
        payload: {
          product: 'A'
        },
        headers: {
          authorization: `Bearer ${token}`
        }
      })
      t.equal(res.statusCode, 200)
      const cart = validate<CartType>(t, Cart, res.json())
      t.equal(cart.userId, 42)
      t.strictSame(cart.products, ['A'])

      const addProductCost = cart.cost

      await t.test('check get my carts has the product', async t => {
        const res = await app.inject({
          method: 'GET',
          url: '/supermarket/carts/mine',
          headers: {
            authorization: `Bearer ${token}`
          }
        })
      
        t.equal(res.statusCode, 200)
    
        const cart = validate<CartType>(t, Cart, res.json())
        t.equal(cart.userId, 42)
        t.strictSame(cart.products, ['A'])

        const cartCost = cart.cost

        t.equal(addProductCost, cartCost)

        t.end()
      })

      await t.test('checkout', async t => {
        const res = await app.inject({
          method: 'POST',
          url: '/supermarket/carts/mine/checkout',
          payload: {
            distance: 5,
            paymentToken: PAYMENT_TOKEN,
          },
          headers: {
            authorization: `Bearer ${token}`
          }
        })
      
        t.equal(res.statusCode, 200)
    
        const output = validate<CheckoutResponseType>(t, CheckoutResponse, res.json())
        t.equal(output.cO2Impact, 50)

        const checkoutCost = output.cost

        t.equal(addProductCost, checkoutCost)

        t.end()
      })

      t.end()
    })

    t.end()
  })

  await t.test('all APIs are protected by a JWT', async t => {
    const [res1, res2, res3] = await Promise.all([
      app.inject({
        method: 'PATCH',
        url: '/supermarket/carts/mine',
        payload: {
          product: 'A'
        }
      }),
      app.inject({
        method: 'GET',
        url: '/supermarket/carts/mine'
      }),
      app.inject({
        method: 'POST',
        url: '/supermarket/carts/mine/checkout',
        payload: {
          distance: 5,
          paymentToken: PAYMENT_TOKEN,
        }
      })
    ])

    t.equal(res1.statusCode, 401)
    t.equal(res2.statusCode, 401)
    t.equal(res3.statusCode, 401)

    t.end()
  })

  await t.test('devil users cannot checkout', async t => {
    const addProductResponse = await app.inject({
      method: 'PATCH',
      url: '/supermarket/carts/mine',
      payload: {
        product: 'A'
      },
      headers: {
        authorization: `Bearer ${devilToken}`
      }
    })
    t.equal(addProductResponse.statusCode, 200)

    const checkoutResponse = await app.inject({
      method: 'POST',
      url: '/supermarket/carts/mine/checkout',
      payload: {
        distance: 5,
        paymentToken: PAYMENT_TOKEN,
      },
      headers: {
        authorization: `Bearer ${devilToken}`
      }
    })

    t.equal(checkoutResponse.statusCode, 403)

    t.end()
  })

  t.end()
})

const PAYMENT_TOKEN = 'a-payment-token-'
const GOOD_CREDENTIAL = { username: 'allevo', password: 'pippo' }
const DEVIL_CREDENTIAL = { username: 'devil', password: 'devil' }

async function login(t: Tap.Test, app: any, { username, password }: { username: string, password: string }) {
  const res = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: { username, password }
  })

  t.equal(res.statusCode, 200)

  return res.json().token
}

const ajv = new Ajv()
function validate<T>(t: Tap.Test, schema: object, input: any): T {
  if (!ajv.validate(schema, input)) {
    t.fail('invalid data')
  }
  return input as T
}