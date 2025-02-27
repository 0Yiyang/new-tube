// import { neon } from "@neondatabase/serverless";
// import { drizzle } from "drizzle-orm/neon-http";

// const sql = neon(process.env.DATABASE_URL!);
// const db = drizzle({ client: sql });
import { drizzle } from "drizzle-orm/neon-http";

const db = drizzle(process.env.DATABASE_URL);
export default db;
