/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: [
    'vm-78r255q3m66kdke131ztwszo.vusercontent.net',
    'vm-7e7olb8e5qexertp4f58cd8t.vusercontent.net',
    'localhost',
    '127.0.0.1',
  ],
}

export default nextConfig
