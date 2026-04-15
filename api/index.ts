import { handle } from "hono/vercel";
import { app } from "../src/server/server";

export const config = {
  runtime: "nodejs", // Standard Node.js for maximum library compatibility
};

export default handle(app);
