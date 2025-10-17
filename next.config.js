/** @type {import('next').NextConfig} */
const nextConfig = {
  // React strict mode for development
  reactStrictMode: true,

  // Temporarily ignore ESLint errors during build
  // TODO: Fix ESLint errors in billing modules
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Experimental features
  experimental: {
    typedRoutes: true,
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [];
  },

  // Image optimization
  images: {
    domains: [],
    formats: ['image/avif', 'image/webp'],
  },

  // Environment variables validation
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },

  // Compiler options
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },

  // Output
  output: 'standalone',

  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Externalize playwright-core on server to avoid bundling issues
    if (isServer) {
      // Add playwright-core to externals so it's not bundled
      config.externals = config.externals || [];

      // Handle externals array or function
      if (Array.isArray(config.externals)) {
        config.externals.push('playwright-core');
      } else if (typeof config.externals === 'function') {
        const origExternals = config.externals;
        config.externals = async (context, request, callback) => {
          if (request === 'playwright-core' || request.startsWith('playwright-core/')) {
            return callback(null, `commonjs ${request}`);
          }
          return origExternals(context, request, callback);
        };
      }
    } else {
      // Client-side: ignore server-only modules
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
      };
    }

    return config;
  },
};

module.exports = nextConfig;
