import {build} from 'esbuild';
import {writeFile} from 'node:fs/promises';
import {prepareRelease} from './release.mjs';
const release=await prepareRelease();
await build({entryPoints:['src/app.js'],bundle:true,minify:true,splitting:true,format:'esm',target:'es2022',outdir:'dist',chunkNames:'chunks/[name]-[hash]',define:{__APP_RELEASE__:JSON.stringify(release)},logLevel:'info'});
await writeFile('dist/release.json',JSON.stringify(release,null,2)+'\n');
console.log('Application version: v'+release.version);
