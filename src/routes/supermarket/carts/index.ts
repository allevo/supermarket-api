import { Static, Type } from "@sinclair/typebox";
import { FastifyPluginAsync } from "fastify"
import { Cart, CartType } from "../../../types/cart";
import fastifyMongodb from '@fastify/mongodb'
import { WithId } from "mongodb";
// @ts-ignore
import { Supermarket } from '@allevo/green-supermarket'

declare module 'fastify' {
  interface FastifyInstance {
    supermarket: Supermarket;
  }
}


const example: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.register(fastifyMongodb, {
    url: 'mongodb://localhost:27017/supermarket'
  })

  const supermarket = new Supermarket([
    { id: 'A', price: 50, weigh: 20 },
    { id: 'B', price: 30, weigh: 10 },
    { id: 'C', price: 20, weigh: 2 },
    { id: 'D', price: 15, weigh: 50 }
  ], { deliveryFactor: 0.5 })
  fastify.decorate('supermarket', supermarket)

  const userId = 55;

  fastify.get<{ Reply: CartType }>('/mine', {
    schema: {
      response: {
        200: Cart,
      }
    }
  }, async function (request, reply) {
    const cartsCollection = this.mongo.db!.collection<CartEntity>('carts')
    const supermarket = this.supermarket

    const cartEntity: WithId<CartEntity> | null = await cartsCollection.findOne({ userId, closed: false })
    if (!cartEntity) {
      return {
        userId,
        products: [],
        cost: 0
      }
    }

    const cart = supermarket.createCartFromArray(cartEntity.products)
    const cost = supermarket.createAutomaticCheckout().calculateCartCost(cart)

    return {
      ...cartEntity,
      cost,
    }
  })

  fastify.patch<{ Body: PatchCartType, Reply: CartType }>('/mine', {
    schema: {
      body: PatchCart,
      response: {
        200: Cart,
      }
    }
  }, async function (request, reply) {
    const cartsCollection = this.mongo.db!.collection<CartEntity>('carts')
    const supermarket = this.supermarket

    await cartsCollection.updateOne({ userId, closed: false }, {
      $push: { products: request.body.product },
    }, { upsert: true })

    const cartEntity: WithId<CartEntity> | null = await cartsCollection.findOne({ userId, closed: false })
    if (cartEntity === null) {
      throw new Error('never happen')
    }
    
    const cart = supermarket.createCartFromArray(cartEntity.products)
    const cost = supermarket.createAutomaticCheckout().calculateCartCost(cart)

    return {
      ...cartEntity,
      cost,
    }
  })

  fastify.post<{ Body: CheckoutRequestType, Reply: CheckoutResponseType }>('/mine/checkout', {
    schema: {
      body: CheckoutRequest,
      response: {
        200: CheckoutResponse,
      }
    }
  }, async function (request, reply) {
    const cartsCollection = this.mongo.db!.collection<CartEntity>('carts')
    const supermarket = this.supermarket

    const cartEntity: WithId<CartEntity> | null = await cartsCollection.findOne({ userId, closed: false })
    if (cartEntity === null) {
      throw new Error('Unable to close non-existing cart')
    }
    if (cartEntity.products.length === 0) {
      throw new Error('Unable to close empty cart')
    }

    const cart = supermarket.createCartFromArray(cartEntity.products)
    const cost = supermarket.createAutomaticCheckout().calculateCartCost(cart)
    const cO2Impact = supermarket.calculateCO2Impact(cart, request.body.distance)

    await cartsCollection.updateOne({ userId, closed: false }, {
      $set: {
        closed: true,
        cO2Impact,
        payment: {
          price: cost,
          token: request.body.paymentToken,
          date: new Date(),
        }
      }
    })

    return {
      cost,
      cO2Impact,
    }
  })
}

const PatchCart = Type.Object({
  product: Type.String(),
})
type PatchCartType = Static<typeof PatchCart>;
const CheckoutRequest = Type.Object({
  distance: Type.Number(),
  paymentToken: Type.String(),
})
type CheckoutRequestType = Static<typeof CheckoutRequest>;
const CheckoutResponse = Type.Object({
  cost: Type.Number(),
  cO2Impact: Type.Number(),
})
type CheckoutResponseType = Static<typeof CheckoutResponse>

interface CartEntity {
  userId: number,
  closed: boolean,
  products: string[],
  payment?: PaymentEntity
  cO2Impact?: number,
}
interface PaymentEntity {
  price: number,
  token: string,
  date: Date,
}

export default example;
