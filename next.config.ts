import type { NextConfig } from "next";

// Type définition pour next-pwa
const withPWA = require("next-pwa");

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd()
  },
  images: {
    remotePatterns: []
  },
  // PWA optimization
  compiler: {
    removeConsole: process.env.NODE_ENV === "production"
  },
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      }
    ];
  }
};

// Configuration PWA
const pwaConfig = withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https?.*/, // Cache all external requests
      handler: "NetworkFirst",
      options: {
        cacheName: "offlineCache",
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 86400, // 24 hours
        },
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "images",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 86400 * 30, // 30 days
        },
      },
    },
    {
      urlPattern: /api\/.*$/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "apis",
        expiration: {
          maxEntries: 16,
          maxAgeSeconds: 86400, // 24 hours
        },
        networkTimeoutSeconds: 10, // Fall back to cache if network request takes longer than 10 seconds
      },
    },
    {
      urlPattern: /\.(?:js)$/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "static-js",
        expiration: {
          maxEntries: 48,
          maxAgeSeconds: 86400, // 24 hours
        },
      },
    },
    {
      urlPattern: /\.(?:css)$/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "static-css",
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 86400, // 24 hours
        },
      },
    },
  ],
});

export default pwaConfig(nextConfig);
