import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { login } from "../shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  console.log("AUTH ROUTE HIT");
  console.log(request.url);

  return login(request);
}