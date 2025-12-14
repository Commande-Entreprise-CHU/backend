import { db } from "../db";
import { users } from "../db/schema";
import { hashPassword } from "../utils/auth";
import { eq } from "drizzle-orm";

const seedAdmin = async () => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminNom = process.env.ADMIN_NOM || "Admin";
  const adminPrenom = process.env.ADMIN_PRENOM || "System";

  if (!adminEmail) {
    console.error("ADMIN_EMAIL must be set to seed an admin user.");
    process.exit(1);
  }

  if (!adminPassword) {
    console.error("ADMIN_PASSWORD must be set to seed an admin user.");
    process.exit(1);
  }

  try {
    const existingAdmin = await db.query.users.findFirst({
      where: eq(users.email, adminEmail),
    });

    if (existingAdmin) {
      console.log("Admin user already exists.");
      process.exit(0);
    }

    const hashedPassword = await hashPassword(adminPassword);

    await db.insert(users).values({
      email: adminEmail,
      password: hashedPassword,
      nom: adminNom,
      prenom: adminPrenom,
      role: "master_admin",
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
