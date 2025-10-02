/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production'
// Set this ONLY if you're using a project site (not username.github.io)
const repo = 'REPO_NAME'

module.exports = {
  output: 'export',
  images: { unoptimized: true },
  // For project sites ONLY (uncomment):
  // basePath: isProd ? `/${repo}` : '',
  // assetPrefix: isProd ? `/${repo}/` : '',
}
