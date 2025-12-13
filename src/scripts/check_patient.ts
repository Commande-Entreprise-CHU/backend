import { db } from "../db";
import { patients } from "../db/schema";
import { desc } from "drizzle-orm";

async function check() {
  const p = await db.select().from(patients).orderBy(desc(patients.createdAt)).limit(5);
  console.log("Latest patients:", JSON.stringify(p.map(x => ({ id: x.id, name: x.name, createdBy: x.createdBy })), null, 2));
  process.exit(0);
}

check();
