
import "dotenv/config";
import cloudinary from "./config/cloudinary.js";

try {
  const result = await cloudinary.api.ping();

  console.log("✅ Cloudinary Connected Successfully");
  console.log(result);
} catch (error) {
  console.error("❌ Cloudinary Connection Failed");
  console.error(error.message);
}
