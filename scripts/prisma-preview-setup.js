const { execSync } = require("child_process");

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
  } catch (error) {
    log("APP_DATABASE_URL provided (host hidden due to parse error)");
  }
} else {
  log("APP_DATABASE_URL is not set");
}

log("Running prisma migrate deploy");
try {
  execSync("npx prisma migrate deploy", { stdio: "inherit" });
} catch (error) {
  console.error("[prisma-preview-setup] prisma migrate deploy failed", error);
  throw error;
}

log("Running prisma generate");
try {
  execSync("npx prisma generate", { stdio: "inherit" });
} catch (error) {
  console.error("[prisma-preview-setup] prisma generate failed", error);
  throw error;
}

log("Running prisma db seed");
try {
  execSync("npx prisma db seed", { stdio: "inherit" });
} catch (error) {
  console.warn("[prisma-preview-setup] prisma db seed failed (continuing)");
}
