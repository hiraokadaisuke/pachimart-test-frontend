const resolveProtocol = () => {
  if (typeof window !== "undefined") {
    return window.location.protocol;
  }

  return process.env.VERCEL ? "https:" : "http:";
};

const resolveHost = () => {
  if (typeof window !== "undefined") {
    return window.location.host;
  }

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) {
    return vercelUrl;
  }

  const localHost = process.env.HOSTNAME ?? "localhost";
  const localPort = process.env.PORT ?? "3000";
  return `${localHost}:${localPort}`;
};

export const buildApiUrl = (path: string) => {
  const protocol = resolveProtocol();
  const host = resolveHost();

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${protocol}//${host}${normalizedPath}`;
};
