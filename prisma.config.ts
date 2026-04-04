import { defineConfig } from "prisma/config";
import { config } from "dotenv";

// Load .env before Prisma reads process.env
config();

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? "",
  },
});
