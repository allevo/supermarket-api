import { Static, Type } from "@sinclair/typebox";
import { ProductList } from "./product";

export const Cart = Type.Object({
  id: Type.Integer(),
  products: ProductList,
  cost: Type.Number(),
})
export type CartType = Static<typeof Cart>;
