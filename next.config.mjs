/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prevent webpack from bundling Node.js-only packages (for App Router + instrumentation)
  serverExternalPackages: ['nodemailer', 'web-push', 'https-proxy-agent', 'agent-base', 'bullmq', 'puppeteer-extra', 'puppeteer-extra-plugin-stealth'],

  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize Node.js-only packages so webpack doesn't try to bundle them
      const existingExternals = config.externals || [];
      config.externals = [
        ...(Array.isArray(existingExternals) ? existingExternals : [existingExternals]),
        'nodemailer',
        'web-push',
        'https-proxy-agent',
        'agent-base',
        'bullmq',
        'puppeteer-extra',
        'puppeteer-extra-plugin-stealth'
      ];
    }
    return config;
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.dsmcdn.com' },
      { protocol: 'https', hostname: 'productimages.hepsiburada.net' },
      { protocol: 'https', hostname: 'm.media-amazon.com' },
    ],
  },

  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS' },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
