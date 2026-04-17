import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const sql = readFileSync(new URL("./001_create_tables.sql", import.meta.url), "utf8");

// Split on semicolons and run each statement
const statements = sql
  .split(";")
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

let errors = 0;
for (const stmt of statements) {
  const { error } = await supabase.rpc("exec_sql", { sql: stmt + ";" }).single().catch(() => ({ error: null }));
  if (error) {
    // Try direct query approach
    console.log("[migrate] Running statement...", stmt.slice(0, 60));
  }
}

// Use postgres directly via POSTGRES_URL
import postgres from "postgres";

const connectionString = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
  console.error("No POSTGRES_URL found");
  process.exit(1);
}

const pg = postgres(connectionString, { ssl: "require", max: 1 });

try {
  await pg.unsafe(sql);
  console.log("[migrate] All tables created successfully.");
} catch (err) {
  console.error("[migrate] Error running migration:", err.message);
} finally {
  await pg.end();
}
