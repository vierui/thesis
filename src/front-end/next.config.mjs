/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // Standalone output for Docker optimization
  output: 'standalone',
  // Externalize native modules for both Turbopack and Webpack
  serverExternalPackages: ['ssh2', 'ssh2-sftp-client', 'cpu-features'],
  // Turbopack configuration (Next.js 16 default)
  turbopack: {},
  // webpack: (config, context) => {
  //   config.module.rules.push({
  //     test: /\.node$/,
  //     loader: "node-loader",
  //   });
  //   return config;
  // },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('ssh2', 'cpu-features');
    }

    // Optimize file watching to reduce inotify watcher usage
    config.watchOptions = {
      poll: 1000, // Check for changes every second
      aggregateTimeout: 300, // Delay rebuilding after the first change
      ignored: [
        '**/node_modules/**',
        '**/.next/**',
        '**/.git/**',
        '**/dist/**',
        '**/build/**',
        '**/.turbo/**',
        '**/coverage/**',
      ],
    };

    return config;
  },
  async headers() {
    return [
      {
        // matching all API routes
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" }, // replace this your actual origin
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,DELETE,PATCH,POST,PUT",
          },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
    ],
  },
};

export default nextConfig;
