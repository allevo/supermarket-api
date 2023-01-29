import { Static, Type } from "@sinclair/typebox";
import { FastifyPluginAsync } from "fastify"
import fastifyJWT from '@fastify/jwt'

const users = [
  { userId: 42, username: 'allevo', password: 'pippo', permissions: ['checkout'] },
  { userId: 666, username: 'devil', password: 'devil', permissions: [] }
]

const example: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.register(fastifyJWT, {
    secret: 'supersecret'
  })

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
      throw new Error('User not found')
    }
    if (user.password !== password) {
      throw new Error('User not found')
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
