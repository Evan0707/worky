import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Prisma 7 CLI only uses the config file for tasks like migrations, which need a direct connection.
    url: env("DATABASE_URL_UNPOOLED"),
  },
});
