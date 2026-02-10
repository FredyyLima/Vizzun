const fs = require("node:fs");
const path = require("node:path");

const migrationsDir = path.join(process.cwd(), "prisma", "migrations");

if (!fs.existsSync(migrationsDir)) {
  console.log("[migrations] directory not found, skipping normalization.");
  process.exit(0);
}

const stack = [migrationsDir];
let normalized = 0;

while (stack.length > 0) {
  const current = stack.pop();
  if (!current) continue;

  for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
    const fullPath = path.join(current, entry.name);

    if (entry.isDirectory()) {
      stack.push(fullPath);
      continue;
    }

    if (!entry.isFile() || !entry.name.endsWith(".sql")) {
      continue;
    }

    const content = fs.readFileSync(fullPath, "utf8");
    if (content.charCodeAt(0) === 0xfeff) {
      fs.writeFileSync(fullPath, content.slice(1), "utf8");
      normalized += 1;
    }
  }
}

console.log(`[migrations] normalized ${normalized} SQL file(s).`);
