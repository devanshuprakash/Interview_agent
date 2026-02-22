import { loadEnv } from "./config/env.js";
import { DatabaseConnection } from "./config/DatabaseConnection.js";
import { compose } from "./composition-root.js";
import { buildApp } from "./app.js";

async function main(): Promise<void> {
  const env = loadEnv();

  const db = DatabaseConnection.getInstance(env.MONGODB_URL);

  const composed = compose(env);
  const app = buildApp(composed, env.CLIENT_ORIGIN);

  app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);
    void db.connect();
  });
}

main().catch((err) => {
  console.error("Fatal error during startup:", err);
  process.exit(1);
});
