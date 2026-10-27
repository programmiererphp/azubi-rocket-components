import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const esbuild=process.env.ESBUILD_MODULE?await import(pathToFileURL(process.env.ESBUILD_MODULE).href):await import('esbuild');
const base=new URL('./',import.meta.url);
await mkdir(new URL('dist/',base),{recursive:true});
await esbuild.build({absWorkingDir:base.pathname,entryPoints:['src/index.js'],outfile:'dist/index.js',bundle:true,format:'esm',target:'es2022',minify:false,legalComments:'eof',loader:{'.ttf':'binary','.woff2':'dataurl'}});
const path=new URL('manifest.json',base),manifest=JSON.parse(await readFile(path,'utf8'));
const bytes=await readFile(new URL('dist/index.js',base));manifest.entrypoints.sha256=createHash('sha256').update(bytes).digest('hex');
await writeFile(path,JSON.stringify(manifest,null,2)+'\n');console.log(JSON.stringify({id:manifest.component_id,bytes:bytes.length,sha256:manifest.entrypoints.sha256}));

