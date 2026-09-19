import "dotenv/config";
import { defineConfig } from "prisma/config";

const directUrl = process.env.DIRECT_URL;
console.log(
  "Prisma migration connection:",
  directUrl?.replace(/:[^:@]+@/, ":****@"),
);

if (!directUrl) {
  throw new Error("DIRECT_URL environment variable is not set");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: directUrl,
  },
});