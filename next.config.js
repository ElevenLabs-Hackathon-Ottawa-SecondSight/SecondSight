import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
	turbopack: {
		root: path.dirname(new URL(import.meta.url).pathname),
	},
};

export default nextConfig;
