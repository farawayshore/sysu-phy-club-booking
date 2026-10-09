import { build } from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const result = await build({absWorkingDir:root,entryPoints:['offline/entry.tsx'],bundle:true,write:false,format:'iife',platform:'browser',target:['es2022'],jsx:'automatic',minify:true,define:{'process.env.NODE_ENV':'"production"'},legalComments:'inline'});
const script = result.outputFiles[0].text.replace(/<\/script/gi,'<\\/script');
const css = await readFile(resolve(root,'app/globals.css'),'utf8');
const icon = await readFile(resolve(root,'public/favicon.svg'),'utf8');
const html = `<!doctype html>
<html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><title>物院社团时间预约（本地版）</title><meta name="description" content="社团预约本地版，预约仅保存在当前浏览器。"><link rel="icon" href="data:image/svg+xml,${encodeURIComponent(icon)}"><style>${css}</style></head><body><div id="root"></div><noscript>请启用 JavaScript，以使用预约日历。</noscript><script>${script}</script></body></html>`;
await mkdir(resolve(root,'outputs'),{recursive:true});
const output=resolve(root,'outputs/物院社团时间预约.html');
await writeFile(output,html);
// Update the prior file in place too, preserving its browser-local storage origin.
await writeFile(resolve(root,'outputs/共时-社团预约-本地版.html'),html);
console.log(JSON.stringify({output,bytes:Buffer.byteLength(html)}));
