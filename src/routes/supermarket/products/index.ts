import { Static, Type } from "@sinclair/typebox";
import Ajv from "ajv";
import { FastifyPluginAsync, FastifyPluginOptions } from "fastify"
import axios from 'axios'
import { ProductList, ProductListType } from "../../../types/product";
import fastifyCircuitBreaker from '@fastify/circuit-breaker'
import { SupermarketConfType } from "../../../app";

const example: FastifyPluginAsync<SupermarketConfType & FastifyPluginOptions> = async (fastify, opts): Promise<void> => {
  await fastify.register(fastifyCircuitBreaker, {
    threshold: 5, // default 5
    timeout: 10000, // default 10000
  })

  const productUrl = opts.PRODUCT_URL

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

    const {data, status} = await axios.get(productUrl, {
      // Avoid to throw error because I want to handle it manually
      validateStatus: () => true,
    })

    if (status !== 200) {
      req.log.info({ status }, 'Fail download products')
      throw this.httpErrors.badGateway('Fail download products')
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
