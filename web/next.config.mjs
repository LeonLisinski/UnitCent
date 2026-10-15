/** @type {import("next").NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Provjere builda idu u zasebnu mapu (NEXT_DIST_DIR) da ne smetaju pokrenutom `npm run dev`.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};
export default nextConfig;
