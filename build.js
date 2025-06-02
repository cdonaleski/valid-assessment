const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['js/supabase-client.js'],
  bundle: true,
  outfile: 'js/bundle.js',
  format: 'esm',
  platform: 'browser',
  target: ['es2020'],
  minify: true,
  sourcemap: true,
  loader: { '.js': 'jsx' },
  define: {
    'process.env.NODE_ENV': '"production"'
  },
  alias: {
    '@supabase/supabase-js': require.resolve('@supabase/supabase-js'),
    '@supabase/auth-js': require.resolve('@supabase/auth-js'),
    '@supabase/functions-js': require.resolve('@supabase/functions-js'),
    '@supabase/postgrest-js': require.resolve('@supabase/postgrest-js'),
    '@supabase/realtime-js': require.resolve('@supabase/realtime-js'),
    '@supabase/storage-js': require.resolve('@supabase/storage-js')
  },
  external: [],
  metafile: true
}).then(result => {
  // Log build result
  console.log('Build complete');
  if (result.metafile) {
    console.log('Bundled files:', Object.keys(result.metafile.inputs).length);
  }
}).catch(() => process.exit(1)); 