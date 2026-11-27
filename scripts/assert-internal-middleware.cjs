const assert = require("node:assert/strict");
const manifest = require("../.next/server/middleware-manifest.json");
const entry = manifest.middleware?.["/"];
assert.ok(entry && entry.files?.length, "Internal access middleware must be included in the build");
assert.ok(entry.matchers?.some(({regexp}) => { const re = new RegExp(regexp); return ["/", "/api/listings", "/inventory", "/_next/static/test.js", "/favicon.ico", "/__internal-access"].every(path => re.test(path)); }), "Internal access middleware must cover all protected routes");
console.log("Internal access middleware build manifest verified");
