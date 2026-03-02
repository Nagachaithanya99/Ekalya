import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Always load backend/.env (this file is inside backend/config)
const envPath = path.join(__dirname, "..", ".env");

dotenv.config({ path: envPath });

console.log("✅ ENV LOADED FROM:", envPath);
console.log("✅ ENV CHECK:", {
  MONGO_URI: process.env.MONGO_URI ? "✅" : "❌ missing",
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY ? "✅" : "❌ missing",
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ? "✅" : "❌ missing",
});
