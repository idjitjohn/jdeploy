const esbuild = require('esbuild')

const buildOptions = {
  entryPoints: {
    login: './src/frontend/login.ts',
    dashboard: './src/frontend/dashboard.ts',
    repositories: './src/frontend/repositories.ts',
    domains: './src/frontend/domains.ts',
    templates: './src/frontend/templates.ts',
    logs: './src/frontend/logs.ts',
  },
  outdir: './public/js',
  bundle: true,
  minify: true,
  sourcemap: true,
  target: 'ES2020',
  format: 'esm',
}

esbuild.build(buildOptions).catch(() => process.exit(1))
