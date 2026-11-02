import "dotenv/config";
import { createSessionToken } from "../auth.js";

// Generate signed session token valid for 7 days
const token = createSessionToken({ email: "test@local", name: "Local Tester" }, 7);

// Print ONLY the cookie header format: ems_session=<token>
console.log(`ems_session=${token}`);
