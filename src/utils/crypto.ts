import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;

let devEphemeralKey: Buffer | null = null;

const getKey = () => {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    if (process.env.APP_ENV === "production") {
      throw new Error(
        "FATAL: ENCRYPTION_KEY is not set in production environment."
      );
    }
    if (!devEphemeralKey) {
      devEphemeralKey = crypto.randomBytes(32);
      console.warn(
        "WARNING: ENCRYPTION_KEY not set; using an ephemeral dev key (data will be unreadable after restart)."
      );
    }
    return devEphemeralKey;
  }
  return crypto.createHash("sha256").update(key).digest();
};

export const encrypt = (data: any): string => {
  const text = JSON.stringify(data);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const tag = cipher.getAuthTag();

  // Format: iv:tag:encrypted
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted}`;
};

export const decrypt = (encryptedText: string): any => {
  // Handle case where data might not be encrypted (migration phase)
  if (!encryptedText.includes(":")) {
    try {
      return JSON.parse(encryptedText);
    } catch {
      return encryptedText;
    }
  }

  const parts = encryptedText.split(":");
  // Basic validation of format
  if (parts.length !== 3) {
    // Fallback: try to parse as JSON directly in case it wasn't encrypted
    try {
      return JSON.parse(encryptedText);
    } catch {
      return encryptedText; // Return as is if it fails
    }
  }

  const [ivHex, tagHex, encryptedHex] = parts;

  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const key = getKey();

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return JSON.parse(decrypted);
};
