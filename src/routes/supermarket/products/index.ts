import { FastifyPluginAsync } from "fastify"
import { ProductList, ProductListType } from "../../../types/product";

const example: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.get<{ Reply: ProductListType }>('/', {
    schema: {
      response: {
        200: ProductList
      }
    }
  }, async function (request, reply) {
    return [
      { id: 'A', price: 50, weigh: 20 },
      { id: 'B', price: 30, weigh: 10 },
      { id: 'C', price: 20, weigh: 2 },
      { id: 'D', price: 15, weigh: 50 }
    ]
  })
}

export default example;
