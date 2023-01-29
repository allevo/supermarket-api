import { Static, Type } from "@sinclair/typebox";

export const Cart = Type.Object({
  userId: Type.Integer(),
  id: Type.Optional(Type.String()),
  products: Type.Array(Type.String()),
  cost: Type.Number(),
})
export type CartType = Static<typeof Cart>;
