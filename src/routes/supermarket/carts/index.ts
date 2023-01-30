import { Static, Type } from "@sinclair/typebox";
import { FastifyPluginAsync, FastifyPluginOptions } from "fastify"
import { Cart, CartType } from "../../../types/cart";
import fastifyMongodb from '@fastify/mongodb'
import { WithId } from "mongodb";
// @ts-ignore
import { Supermarket } from '@allevo/green-supermarket'
import { SupermarketConfType } from "../../../app";

declare module 'fastify' {
  interface FastifyInstance {
    supermarket: Supermarket;
  }
}


const example: FastifyPluginAsync<SupermarketConfType & FastifyPluginOptions> = async (fastify, opts: SupermarketConfType & FastifyPluginOptions): Promise<void> => {
  fastify.register(fastifyMongodb, {
    url: opts.MONGODB_URL,
  })

  const supermarket = new Supermarket([
    { id: 'A', price: 50, weigh: 20 },
    { id: 'B', price: 30, weigh: 10 },
    { id: 'C', price: 20, weigh: 2 },
    { id: 'D', price: 15, weigh: 50 }
  ], { deliveryFactor: 0.5 })
  fastify.decorate('supermarket', supermarket)

  fastify.addHook("onRequest", async (request, reply) => {
    try {
      await request.jwtVerify()
    } catch (err) {
      reply.send(err)
    }
  })

  fastify.get<{ Reply: CartType }>('/mine', {
    schema: {
      response: {
        200: Cart,
      }
    }
  }, async function (request, reply) {
    const cartsCollection = this.mongo.db!.collection<CartEntity>('carts')
    const supermarket = this.supermarket
    const userId = request.user.userId

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
    const userId = request.user.userId

    await cartsCollection.updateOne({ userId, closed: false }, {
      $push: { products: request.body.product },
    }, { upsert: true })

    const cartEntity: WithId<CartEntity> | null = await cartsCollection.findOne({ userId, closed: false })
    /* istanbul ignore if */
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
    if (!request.user.permissions.includes('checkout')) {
      throw this.httpErrors.forbidden('"checkout" permission is missing')
    }

    const cartsCollection = this.mongo.db!.collection<CartEntity>('carts')
    const supermarket = this.supermarket
    const userId = request.user.userId

    const cartEntity: WithId<CartEntity> | null = await cartsCollection.findOne({ userId, closed: false })
    /* istanbul ignore if */
    if (cartEntity === null) {
      throw new Error('Unable to close non-existing cart')
    }
    /* istanbul ignore if */
    if (cartEntity.products.length === 0) {
      throw new Error('Unable to close empty cart')
    }

    const cart = supermarket.createCartFromArray(cartEntity.products)
    const cost = supermarket.createAutomaticCheckout().calculateCartCost(cart)
    const cO2Impact = supermarket.getDelivery().calculateCO2Impact(cart, request.body.distance)

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

export const PatchCart = Type.Object({
  product: Type.String(),
})
export type PatchCartType = Static<typeof PatchCart>;
export const CheckoutRequest = Type.Object({
  distance: Type.Number(),
  paymentToken: Type.String(),
})
export type CheckoutRequestType = Static<typeof CheckoutRequest>;
export const CheckoutResponse = Type.Object({
  cost: Type.Number(),
  cO2Impact: Type.Number(),
})
export type CheckoutResponseType = Static<typeof CheckoutResponse>

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
