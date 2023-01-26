import { Static, Type } from "@sinclair/typebox";
import { FastifyPluginAsync } from "fastify"
import { Cart, CartType } from "../../../types/cart";
import { ProductList } from "../../../types/product";

const example: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.get<{ Reply: CartType }>('/mine', {
    schema: {
      response: {
        200: Cart,
      }
    }
  }, async function (request, reply) {
    return {
      id: 4,
      products: [],
      cost: 0
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
    return {
      id: 4,
      products: [],
      cost: 0
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
    return {
      cost: 0,
      cO2Cost: 0,
    }
  })
}

const PatchCart = Type.Object({
  products: ProductList,
})
type PatchCartType = Static<typeof PatchCart>;
const CheckoutRequest = Type.Object({
  card: Type.String(),
  cvv2: Type.String(),
})
type CheckoutRequestType = Static<typeof CheckoutRequest>;
const CheckoutResponse = Type.Object({
  cost: Type.Number(),
  cO2Cost: Type.Number(),
})
type CheckoutResponseType = Static<typeof CheckoutResponse>


export default example;
