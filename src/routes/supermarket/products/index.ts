import { Static, Type } from "@sinclair/typebox";
import Ajv from "ajv";
import { FastifyPluginAsync } from "fastify"
import axios from 'axios'
import { ProductList, ProductListType } from "../../../types/product";
import fastifyCircuitBreaker from '@fastify/circuit-breaker'

const example: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  await fastify.register(fastifyCircuitBreaker, {
    threshold: 1, // default 5
    timeout: 500, // default 10000
  })

  const ajv = new Ajv({})
  const isAValidProductList = ajv.compile(FakeStoreProducts)

  fastify.get<{ Reply: ProductListType }>('/', {
    schema: {
      response: {
        200: ProductList
      }
    },
    preHandler: fastify.circuitBreaker(),
  }, async function (req, reply) {
    req.log.info('Get products')

    const {data, status } = await axios.get('https://fakestoreapi.com/products')

    if (status !== 200) {
      throw new Error('Fail download products')
    }

    const products: FakeStoreProductsType = data
    if (!isAValidProductList(products)) {
      throw new Error('Invalid products')
    }

    req.log.info({ count: products.length }, 'Found')

    return products.map(p => {
      return {
        id: `${p.id}`,
        title: p.title,
        price: p.price,
        weigh: p.price * 2
      }
    })
  })
}

const FakeStoreProduct = Type.Object({
  id: Type.Number(),
  title: Type.String(),
  price: Type.Number(),
})
const FakeStoreProducts = Type.Array(FakeStoreProduct)
export type FakeStoreProductsType = Static<typeof FakeStoreProducts>;

export default example;
