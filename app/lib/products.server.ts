// app/lib/products.server.ts
import { authenticate } from "../shopify.server";

export interface ProductItem {
  id:           string;
  variantId:    string;
  title:        string;
  price:        number;   // in cents
  image:        string | null;
  available:    boolean;
  collectionId: string;
}

export async function getProductsForCollection(
  request: Request,
  collectionId: string,
  limit = 50,
): Promise<ProductItem[]> {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(
    `#graphql
    query collectionProducts($id: ID!, $first: Int!) {
      collection(id: $id) {
        products(first: $first) {
          edges {
            node {
              id
              title
              featuredImage { url }
              variants(first: 1) {
                edges {
                  node {
                    id
                    price
                    availableForSale
                  }
                }
              }
            }
          }
        }
      }
    }`,
    { variables: { id: collectionId, first: limit } },
  );

  const data = await response.json();
  const edges = data?.data?.collection?.products?.edges ?? [];

  return edges.map((e: any) => {
    const product = e.node;
    const variant = product.variants.edges[0]?.node;
    return {
      id:           product.id,
      variantId:    variant?.id           ?? "",
      title:        product.title,
      price:        Math.round(parseFloat(variant?.price ?? "0") * 100),
      image:        product.featuredImage?.url ?? null,
      available:    variant?.availableForSale  ?? false,
      collectionId,
    };
  });
}
