import { Static, Type } from "@sinclair/typebox";
import { FastifyPluginAsync, FastifyPluginOptions } from "fastify"
import { SupermarketConfType } from "../../app";

const users = [
  { userId: 42, username: 'allevo', password: 'pippo', permissions: ['checkout'] },
  { userId: 666, username: 'devil', password: 'devil', permissions: [] }
]

const example: FastifyPluginAsync<SupermarketConfType & FastifyPluginOptions> = async (fastify, opts): Promise<void> => {

  fastify.post<{ Body: LoginRequestType, Reply: LoginResponseType }>('/login', {
    schema: {
      body: LoginRequest,
      response: {
        200: LoginResponse,
      }
    }
  }, async function (request, reply) {
    const { username, password } = request.body

    const user = users.find(u => u.username === username)
    if (!user) {
      throw fastify.httpErrors.unauthorized('Wrong credential')
    }
    if (user.password !== password) {
      throw fastify.httpErrors.unauthorized('Wrong credential')
    }

    const { userId, permissions } = user

    const token = fastify.jwt.sign({ userId, permissions })

    return {
      token,
    }
  })
}

const LoginRequest = Type.Object({
  username: Type.String(),
  password: Type.String(),
})
type LoginRequestType = Static<typeof LoginRequest>;
const LoginResponse = Type.Object({
  token: Type.String(),
})
type LoginResponseType = Static<typeof LoginResponse>;

export default example;
