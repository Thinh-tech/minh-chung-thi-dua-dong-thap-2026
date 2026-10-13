import {build} from 'esbuild';
await build({entryPoints:['src/app.js'],bundle:true,minify:true,splitting:true,format:'esm',target:'es2022',outdir:'dist',chunkNames:'chunks/[name]-[hash]',logLevel:'info'});
