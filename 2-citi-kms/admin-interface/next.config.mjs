/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    webpack: (config, context) => {
        config.module.rules.push({
            test: /\.node$/,
            loader: "node-loader",
        });
        return config
    }
};

export default nextConfig;
