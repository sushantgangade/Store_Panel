import type { NextConfig } from 'next';

const config: NextConfig = {
    images: {
        remotePatterns: [{ protocol: 'https', hostname: '**' }],
    },
    experimental: { serverActions: { bodySizeLimit: '2mb' } },
};
export default config;