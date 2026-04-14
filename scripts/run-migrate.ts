import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

config({ path: ".env.local" });
config({ path: ".env.development.local" });

const runMigrate = async () => {
  const url = process.env.POSTGRES_URL;
  if (!url) {
    console.log("POSTGRES_URL not set, skipping migration");
    process.exit(0);
  }

  console.log("Connecting to:", url.replace(/:([^@]+)@/, ":****@"));

  const connection = postgres(url, { max: 1, ssl: "require" });
  const db = drizzle(connection);

  console.log("Running migrations...");
  const start = Date.now();

  try {
    await migrate(db, { migrationsFolder: "./lib/db/migrations" });
    console.log("Migrations completed in", Date.now() - start, "ms");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await connection.end();
  }
};

runMigrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
