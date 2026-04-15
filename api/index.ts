import { handle } from "hono/vercel";
import { app } from "../src/server/server";

export const config = {
  runtime: "edge", // Using edge for maximum performance on Vercel
};

export default handle(app);
