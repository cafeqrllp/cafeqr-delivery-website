/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: '**.supabase.in' },
      { protocol: 'https', hostname: 'cafeqr.in' },
    ],
  },
  // Allow firebase-admin on server side only
  serverExternalPackages: ['firebase-admin'],
};

export default nextConfig;
