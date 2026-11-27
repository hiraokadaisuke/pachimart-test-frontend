import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const cookieName = "__Host-internal-access";
const ttl = 30 * 24 * 60 * 60;
const encoder = new TextEncoder();
const headers = {
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "Cache-Control": "private, no-store",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
};
function protect(response: NextResponse) {
  for (const [name, value] of Object.entries(headers)) response.headers.set(name, value);
  return response;
}
async function sign(value: string, secret: string) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), {name:"HMAC", hash:"SHA-256"}, false, ["sign"]);
  return Array.from(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value))), b => b.toString(16).padStart(2,"0")).join("");
}
function equal(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
function login(error = false, status = 401) {
  return protect(new NextResponse(`<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Restricted Access</title><link rel="icon" href="data:,"><style>body{margin:0;background:#f5f6f8;font:16px system-ui;color:#20242a;display:grid;place-items:center;min-height:100vh}main{background:white;padding:32px;border:1px solid #ddd;border-radius:12px;width:min(320px,80vw)}h1{font-size:22px}input,button{box-sizing:border-box;width:100%;padding:12px;margin-top:12px;border-radius:6px;border:1px solid #bbb;font:inherit}button{background:#303846;color:white;cursor:pointer}p{font-size:14px}</style></head><body><main><h1>Restricted Access</h1><form method="post" action="/__internal-access"><label for="password">パスワード</label><input id="password" name="password" type="password" required maxlength="256" autocomplete="current-password"><button>ログイン</button>${error ? '<p role="alert">認証できませんでした。</p>' : ''}</form></main></body></html>`, {status,headers:{"Content-Type":"text/html; charset=utf-8","Content-Security-Policy":"default-src 'none'; style-src 'unsafe-inline'; img-src data:; form-action 'self'; frame-ancestors 'none'; base-uri 'none'"}}));
}
export async function middleware(request: NextRequest) {
  const {pathname} = request.nextUrl;
  const password = process.env.INTERNAL_ACCESS_PASSWORD;
  const secret = process.env.INTERNAL_ACCESS_SECRET;
  if (!password || password.length < 16 || !secret || secret.length < 32) {
    return protect(new NextResponse("Restricted Access", {status:503}));
  }
  const key = secret + ":" + password;
  if (pathname === "/__internal-access" && request.method === "POST") {
    if (request.headers.get("origin") !== request.nextUrl.origin) return protect(new NextResponse("Forbidden", {status:403}));
    const form = await request.formData().catch(() => null);
    const input = form?.get("password");
    if (typeof input !== "string" || input.length > 256 || !equal(await sign(input,secret),await sign(password,secret))) return login(true);
    const expiration = String(Math.floor(Date.now()/1000)+ttl);
    const response = NextResponse.redirect(new URL("/",request.url),303);
    response.cookies.set(cookieName, expiration+"."+await sign(expiration,key), {httpOnly:true,secure:true,sameSite:"strict",path:"/",maxAge:ttl});
    return protect(response);
  }
  const token = request.cookies.get(cookieName)?.value || "";
  const [expiration,signature,...extra] = token.split(".");
  const expires = Number(expiration);
  const now = Math.floor(Date.now()/1000);
  const authenticated = extra.length === 0 && Number.isInteger(expires) && expires > now && expires <= now+ttl && !!signature && equal(signature,await sign(expiration,key));
  if (!authenticated) {
    if (request.method === "GET" && request.headers.get("accept")?.includes("text/html") && !pathname.startsWith("/api/")) return login();
    return protect(new NextResponse("Unauthorized",{status:401}));
  }
  if (pathname === "/__internal-logout") {
    if (request.method === "GET") return protect(new NextResponse('<!doctype html><html lang="ja"><meta charset="utf-8"><title>Logout</title><form method="post"><button>ログアウト</button></form></html>',{headers:{"Content-Type":"text/html; charset=utf-8","Content-Security-Policy":"default-src 'none'; form-action 'self'; frame-ancestors 'none'"}}));
    if (request.method !== "POST" || request.headers.get("origin") !== request.nextUrl.origin) return protect(new NextResponse("Forbidden",{status:403}));
    const response = NextResponse.redirect(new URL("/",request.url),303);
    response.cookies.set(cookieName,"",{httpOnly:true,secure:true,sameSite:"strict",path:"/",maxAge:0});
    return protect(response);
  }
  if (pathname === "/trade-navi" || pathname.startsWith("/trade-navi/")) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = pathname.replace(/^\/trade-navi/, "/market/navi");
    return protect(NextResponse.redirect(redirectUrl));
  }
  return protect(NextResponse.next());
}
export const config = { matcher: ["/:path*"] };
