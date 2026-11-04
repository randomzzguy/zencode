import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { site } from '../content/site.mjs';
const root=path.resolve('dist');
async function walk(dir){const files=[];for(const e of await readdir(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())files.push(...await walk(p));else files.push(p);}return files;}
const pages=(await walk(root)).filter(p=>p.endsWith('.html'));
const errors=[];
const titles=new Set(), descriptions=new Set(), canonicalUrls=[];
const decode=text=>text.replaceAll('&amp;','&').replaceAll('&quot;','"').replaceAll('&lt;','<').replaceAll('&gt;','>');
const projects=[...JSON.parse(await readFile('content/flagship-projects.json','utf8')),...JSON.parse(await readFile('content/projects.json','utf8'))];
for(const file of pages){
 const html=await readFile(file,'utf8');
 if((html.match(/<h1[ >]/g)||[]).length!==1)errors.push(`${file}: expected one h1`);
 if(!html.includes('<title>')||!html.includes('name="description"'))errors.push(`${file}: missing page metadata`);
 const relative=path.relative(root,file).replaceAll('\\','/');
 const route=relative==='404.html'?'/404.html':`/${relative.replace(/index\.html$/,'')}`;
 const canonical=`${site.url}${route}`;
 const meta=new Map([...html.matchAll(/<meta\b([^>]+)>/g)].map(([,attributes])=>{
  const values=Object.fromEntries([...attributes.matchAll(/([\w:-]+)="([^"]*)"/g)].map(([,key,value])=>[key,decode(value)]));
  return [values.name||values.property,values.content];
 }));
 const title=decode(html.match(/<title>(.*?)<\/title>/)?.[1]||'');
 if(titles.has(title))errors.push(`${file}: duplicate title`);titles.add(title);
 if(descriptions.has(meta.get('description')))errors.push(`${file}: duplicate description`);descriptions.add(meta.get('description'));
 if(!html.includes(`<link rel="canonical" href="${canonical}">`))errors.push(`${file}: incorrect canonical URL`);
 for(const [key,value] of [['og:title',title],['twitter:title',title],['og:description',meta.get('description')],['twitter:description',meta.get('description')],['og:url',canonical]]){
  if(meta.get(key)!==value)errors.push(`${file}: inconsistent ${key}`);
 }
 if(meta.get('og:image')!==meta.get('twitter:image')||!meta.get('og:image')?.startsWith(site.url+'/assets/'))errors.push(`${file}: invalid social image`);
 if(!Number(meta.get('og:image:width'))||!Number(meta.get('og:image:height'))||!meta.get('og:image:alt'))errors.push(`${file}: missing social image dimensions/description`);
 try{await stat(path.join(root,new URL(meta.get('og:image')).pathname));}catch{errors.push(`${file}: missing social image file`);}
 try{
  const graph=JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/)?.[1]||'{}')['@graph'];
  const organization=graph?.find(node=>node['@type']==='Organization');
  if(organization?.legalName!==site.legalName||organization?.identifier?.value!==site.registration)errors.push(`${file}: inconsistent business identity`);
  const webpage=graph?.find(node=>['WebPage','CollectionPage','AboutPage','ContactPage'].includes(node['@type']));
  if(webpage?.url!==canonical||webpage?.name!==title)errors.push(`${file}: inconsistent page schema`);
  if(route!=='/'&&route!=='/404.html'&&!graph.some(node=>node['@type']==='BreadcrumbList'))errors.push(`${file}: missing breadcrumbs`);
  const project=projects.find(project=>route===`/work/${project.slug}/`);
  if(project&&!graph.some(node=>node['@type']==='CreativeWork'&&node.name===project.name))errors.push(`${file}: missing project schema`);
 }catch{errors.push(`${file}: invalid JSON-LD`);}
 if(route==='/404.html'){
  if(!meta.get('robots')?.includes('noindex'))errors.push(`${file}: 404 must not be indexed`);
 }else{
  canonicalUrls.push(canonical);
  if(meta.get('robots')?.includes('noindex'))errors.push(`${file}: public page is noindex`);
  if(!html.includes(`href="${route}index.md"`))errors.push(`${file}: missing Markdown alternate`);
  try{await stat(path.join(root,route,'index.md'));}catch{errors.push(`${file}: missing Markdown document`);}
 }
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
 if(new Set(ids).size!==ids.length)errors.push(`${file}: duplicate IDs`);
 for(const [,url] of html.matchAll(/(?:href|src)="([^"#]+)"/g)){
  if(!url.startsWith('/')||url.startsWith('//'))continue;
  const pathname=decodeURIComponent(url.split(/[?#]/)[0]);
  let target=path.join(root,pathname);
  try{if((await stat(target)).isDirectory())target=path.join(target,'index.html');await stat(target);}catch{errors.push(`${file}: missing ${url}`);}
 }
}
const robots=await readFile(path.join(root,'robots.txt'),'utf8');
if(!robots.includes(`Sitemap: ${site.url}/sitemap.xml`)||!robots.includes('Allow: /')||/^Disallow:\s*\/$/m.test(robots))errors.push('robots.txt: incorrect public crawl policy');
const sitemap=await readFile(path.join(root,'sitemap.xml'),'utf8');
const sitemapUrls=[...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(([,url])=>decode(url));
if(new Set(sitemapUrls).size!==canonicalUrls.length||sitemapUrls.length!==canonicalUrls.length||canonicalUrls.some(url=>!sitemapUrls.includes(url)))errors.push('sitemap.xml: must contain each indexable canonical exactly once');
if(sitemapUrls.some(url=>url.includes('404')))errors.push('sitemap.xml: includes 404');
const llms=await readFile(path.join(root,'llms.txt'),'utf8');
const full=await readFile(path.join(root,'llms-full.txt'),'utf8');
if(!llms.startsWith(`# ${site.legalName}\n\n> `)||!llms.includes(site.registration))errors.push('llms.txt: missing current business overview');
for(const project of projects){
 if(!llms.includes(`/work/${project.slug}/index.md`)||!full.includes(`# ${project.name}`)||!full.includes(project.note))errors.push(`LLM reference: missing ${project.name} or its project context`);
}
for(const [,target] of llms.matchAll(/\]\((https:\/\/zencode\.my[^)]+)\)/g)){
 try{await stat(path.join(root,new URL(target).pathname));}catch{errors.push(`llms.txt: broken reference ${target}`);}
}
if(/C:\\Users\\|access_key|BEGIN PRIVATE KEY|\.env\.local/.test(llms+full))errors.push('LLM reference: contains non-public implementation material');
if(errors.length){console.error([...new Set(errors)].join('\n'));process.exit(1);}
console.log(`Checked ${pages.length} HTML pages: links, assets, metadata, social cards, canonical URLs, JSON-LD and business identity passed. Verified ${canonicalUrls.length} sitemap URLs, Markdown alternates and complete project coverage in llms.txt / llms-full.txt.`);
