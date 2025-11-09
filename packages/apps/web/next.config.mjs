/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    transpilePackages: [
        '@flowsplit/shared',
        '@flowsplit/prisma',
    ],
};

export default nextConfig;