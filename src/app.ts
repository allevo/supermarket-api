import { join } from 'path';
import AutoLoad, {AutoloadPluginOptions} from '@fastify/autoload';
import { FastifyPluginAsync } from 'fastify';
import { Static, Type } from '@sinclair/typebox';
import Ajv from 'ajv';
import fastifyJwt from '@fastify/jwt';

export type AppOptions = {
  // Place your custom options for app below here.
} & Partial<AutoloadPluginOptions>;


// Pass --options via CLI arguments in command to enable these options.
const options: AppOptions = {
}

const app: FastifyPluginAsync<AppOptions> = async (
    fastify,
    opts
): Promise<void> => {
  // Place here your custom code!

  const config = { ...process.env, ...opts }

  const ajv = new Ajv()
  const validateConfig = ajv.compile(SupermarketConf)
  /* istanbul ignore if */
  if (!validateConfig(config)) {
    fastify.log.error({ errors: validateConfig.errors }, 'Invalid configuration')
    throw new Error('Invalid configuration')
  }

  fastify.register(fastifyJwt, {
    secret: (config as SupermarketConfType).JWT_SECRET
  })

  // Do not touch the following lines

  // This loads all plugins defined in plugins
  // those should be support plugins that are reused
  // through your application
  void fastify.register(AutoLoad, {
    dir: join(__dirname, 'plugins'),
    options: opts
  })

  // This loads all plugins defined in routes
  // define your routes in one of these
  void fastify.register(AutoLoad, {
    dir: join(__dirname, 'routes'),
    options: config
  })

};

export const SupermarketConf = Type.Object({
  MONGODB_URL: Type.String(),
  JWT_SECRET: Type.String(),
  PRODUCT_URL: Type.String(),
})
export type SupermarketConfType = Static<typeof SupermarketConf>;

export default app;
export { app, options }

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { userId: number, permissions: string[] }
  }
}
