const esbuild = require('esbuild')

esbuild.build({
  entryPoints: ['./src/index.cjs'],
  bundle: true,
  format: 'cjs',
  outfile: './dist/index.cjs',
  sourcemap: false,
}).catch(() => process.exit(1))
