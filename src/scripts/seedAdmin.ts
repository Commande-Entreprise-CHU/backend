import { db } from "../db";
import { users } from "../db/schema";
import { hashPassword } from "../utils/auth";
import { eq } from "drizzle-orm";

const seedAdmin = async () => {
  const adminEmail = "admin@admin.admin";

  try {
    const existingAdmin = await db.query.users.findFirst({
      where: eq(users.email, adminEmail),
    });

    if (existingAdmin) {
      console.log("Admin user already exists.");
      process.exit(0);
    }

    const hashedPassword = await hashPassword("admin");

    await db.insert(users).values({
      email: adminEmail,
      password: hashedPassword,
      nom: "Admin",
      prenom: "System",
      role: "admin",
      isActive: true,
    });

    console.log("Admin user created successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding admin:", error);
    process.exit(1);
  }
};

seedAdmin();
