import mysql from "mysql2/promise";
import { config } from "dotenv";
config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

await conn.execute(`
  CREATE TABLE IF NOT EXISTS \`COAPP_CRM_EXPENSE\` (
    \`expe_idno\` int AUTO_INCREMENT NOT NULL,
    \`comp_idno\` int NOT NULL,
    \`clie_idno\` int,
    \`clie_name\` varchar(200),
    \`expe_name\` varchar(200) NOT NULL,
    \`expe_date\` timestamp NOT NULL,
    \`expe_amnt\` decimal(18,2) NOT NULL,
    \`expe_type\` varchar(20) NOT NULL DEFAULT 'receipt',
    \`paym_meth\` varchar(20) NOT NULL DEFAULT 'card',
    \`recr_type\` varchar(20) NOT NULL DEFAULT 'none',
    \`recr_ends\` timestamp NULL,
    \`ai_categ\` varchar(100),
    \`ai_vendor\` varchar(200),
    \`ai_raw\` text,
    \`file_url\` text,
    \`file_key\` varchar(500),
    \`expe_memo\` text,
    \`enab_yesn\` boolean NOT NULL DEFAULT true,
    \`crea_idno\` int NOT NULL,
    \`crea_date\` timestamp NOT NULL DEFAULT (now()),
    \`modi_idno\` int,
    \`modi_date\` timestamp NULL ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT \`COAPP_CRM_EXPENSE_expe_idno\` PRIMARY KEY(\`expe_idno\`)
  )
`);
console.log("Table created.");

const [indexes] = await conn.execute("SHOW INDEX FROM COAPP_CRM_EXPENSE");
const existingIdx = indexes.map((r) => r.Key_name);

if (!existingIdx.includes("ix_expense_comp")) {
  await conn.execute("CREATE INDEX ix_expense_comp ON COAPP_CRM_EXPENSE (comp_idno)");
  console.log("ix_expense_comp created.");
}
if (!existingIdx.includes("ix_expense_clie")) {
  await conn.execute("CREATE INDEX ix_expense_clie ON COAPP_CRM_EXPENSE (clie_idno)");
  console.log("ix_expense_clie created.");
}
if (!existingIdx.includes("ix_expense_date")) {
  await conn.execute("CREATE INDEX ix_expense_date ON COAPP_CRM_EXPENSE (expe_date)");
  console.log("ix_expense_date created.");
}

console.log("Done.");
await conn.end();
