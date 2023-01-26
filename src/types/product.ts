import { Static, Type } from "@sinclair/typebox";

export const Product = Type.Object({
  id: Type.String(),
  price: Type.Number(),
  weigh: Type.Number(),
})
export type ProductType = Static<typeof Product>;

export const ProductList = Type.Array(Product)
export type ProductListType = Static<typeof ProductList>;
