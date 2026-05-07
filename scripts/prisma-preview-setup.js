const { spawnSync, execSync } = require("child_process");

typeof process !== "undefined" && process.on("uncaughtException", (error) => {
  console.error("[prisma-preview-setup] Uncaught exception:", error);
});

typeof process !== "undefined" && process.on("unhandledRejection", (reason) => {
  console.error("[prisma-preview-setup] Unhandled rejection:", reason);
});

const log = (message) => {
  console.log(`[prisma-preview-setup] ${message}`);
};

const environment = process.env.VERCEL_ENV;
if (environment !== "preview") {
  log(`Non-preview environment (${environment ?? "undefined"}); skipping Prisma migrations and seed.`);
  return;
}

log("Preview detected");

const databaseUrl = process.env.APP_DATABASE_URL;
if (databaseUrl) {
  try {
    const { host } = new URL(databaseUrl);
    log(`APP_DATABASE_URL host: ${host}`);
  } catch {
    log("APP_DATABASE_URL provided (host hidden due to parse error)");
  }
} else {
  log("APP_DATABASE_URL is not set");
}

log("Running prisma migrate deploy");
const migrate = spawnSync("npx", ["prisma", "migrate", "deploy"], { encoding: "utf-8" });
if (migrate.stdout) process.stdout.write(migrate.stdout);
if (migrate.stderr) process.stderr.write(migrate.stderr);
if (migrate.status !== 0) {
  const output = `${migrate.stdout ?? ""}\n${migrate.stderr ?? ""}`;
  if (output.includes("P3009")) {
    console.warn("[prisma-preview-setup] prisma migrate deploy hit P3009 on preview DB; continuing build");
  } else {
    throw new Error(`[prisma-preview-setup] prisma migrate deploy failed with status ${migrate.status}`);
  }
}

log("Running prisma generate");
execSync("npx prisma generate", { stdio: "inherit" });

log("Running prisma db seed");
try {
  execSync("npx prisma db seed", { stdio: "inherit" });
} catch {
  console.warn("[prisma-preview-setup] prisma db seed failed (continuing)");
}
