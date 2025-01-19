const esbuild = require('esbuild')

esbuild.build({
  entryPoints: ['./src/index.mjs'],
  bundle: true,
  format: 'esm',
  outfile: './dist/index.js',
  sourcemap: false,
}).catch(() => process.exit(1))
