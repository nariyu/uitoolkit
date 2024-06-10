/** @type {import('next').NextConfig} */

import withPWA from "next-pwa";
import packageJson from "./package.json" assert { type: "json" };

const nextConfig = withPWA({ dest: "public" })({
  env: {
    VERSION: packageJson.version,
    ENV: process.env.ENV,
    VERCEL_URL: process.env.VERCEL_URL,
    VERCEL_GIT_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA,
  },
});

export default nextConfig;
