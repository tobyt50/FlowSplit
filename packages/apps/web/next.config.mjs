/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    transpilePackages: [
        '@flowsplit/shared',
        '@flowsplit/prisma',
    ],
    output: 'standalone',
};

export default nextConfig;