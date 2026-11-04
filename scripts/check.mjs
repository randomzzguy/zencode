import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('dist');
async function walk(dir){const files=[];for(const e of await readdir(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())files.push(...await walk(p));else files.push(p);}return files;}
const pages=(await walk(root)).filter(p=>p.endsWith('.html'));
const errors=[];
for(const file of pages){
 const html=await readFile(file,'utf8');
 if((html.match(/<h1[ >]/g)||[]).length!==1)errors.push(`${file}: expected one h1`);
 if(!html.includes('<title>')||!html.includes('name="description"'))errors.push(`${file}: missing page metadata`);
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 if(new Set(ids).size!==ids.length)errors.push(`${file}: duplicate IDs`);
 for(const [,url] of html.matchAll(/(?:href|src)="([^"#]+)"/g)){
  if(!url.startsWith('/')||url.startsWith('//'))continue;
  const pathname=decodeURIComponent(url.split(/[?#]/)[0]);
  let target=path.join(root,pathname);
  try{if((await stat(target)).isDirectory())target=path.join(target,'index.html');await stat(target);}catch{errors.push(`${file}: missing ${url}`);}
 }
}
if(errors.length){console.error([...new Set(errors)].join('\n'));process.exit(1);}
console.log(`Checked ${pages.length} pages: local links, assets, unique IDs, headings and metadata passed.`);
