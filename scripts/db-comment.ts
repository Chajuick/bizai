import "dotenv/config";
import { execSync } from "node:child_process";
import { URL } from "node:url";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not set");

const db = new URL(databaseUrl);

const host = db.hostname;
const port = db.port || "3306";
const user = decodeURIComponent(db.username);
const password = decodeURIComponent(db.password);
const database = db.pathname.replace(/^\//, "");

const files = [
  "server/core/db/comment/comment_ai.sql",
  "server/core/db/comment/comment_billing.sql",
  "server/core/db/comment/comment_core.sql",
  "server/core/db/comment/comment_crm.sql",
];

for (const file of files) {
  const cmd = `mysql -h ${host} -P ${port} -u ${user} -p${password} ${database} < ${file}`;
  console.log(`[db:comment] applying ${file}`);
  execSync(cmd, { stdio: "inherit" });
}

console.log("[db:comment] all comment files applied");