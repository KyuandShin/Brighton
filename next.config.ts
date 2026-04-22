import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@neondatabase/auth'],
  experimental: {
    authInterrupts: false
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "api.dicebear.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            // Allow Jitsi Meet iframe to load
            key: "Content-Security-Policy",
            value: [
              "default-src 'self' chrome-extension:",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://meet.jit.si chrome-extension:",
              "frame-src 'self' https://meet.jit.si chrome-extension:",
              "connect-src 'self' data: https://meet.jit.si wss://meet.jit.si https://api.cloudinary.com chrome-extension:",
              "media-src 'self' blob: mediastream: https://res.cloudinary.com",
              "img-src 'self' data: blob: https: chrome-extension: https://res.cloudinary.com",
              "style-src 'self' 'unsafe-inline' 'unsafe-hashes' chrome-extension:",
              "font-src 'self' data: https: chrome-extension:",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
