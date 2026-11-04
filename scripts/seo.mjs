import { readFile } from 'node:fs/promises';
import { site, pageMetadata, projectTitles } from '../content/site.mjs';
import { capabilities, industries } from '../content/site-copy.mjs';

const esc = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const absolute = path => `${site.url}${path}`;
const orgId = absolute('/#organization');
const websiteId = absolute('/#website');
const imageCache = new Map();

// Read the actual PNG/WebP dimensions so social metadata cannot drift from assets.
async function imageInfo(image) {
  if (imageCache.has(image)) return imageCache.get(image);
  const bytes = await readFile(new URL(`../${image.replace(/^\//,'')}`, import.meta.url));
  let width, height;
  if (bytes.subarray(1,4).toString() === 'PNG') {
    width = bytes.readUInt32BE(16); height = bytes.readUInt32BE(20);
  } else if (bytes.toString('ascii',8,12) === 'WEBP') {
    for (let offset=12; offset+8<bytes.length;) {
      const type=bytes.toString('ascii',offset,offset+4), size=bytes.readUInt32LE(offset+4), start=offset+8;
      if (type==='VP8X') { width=bytes.readUIntLE(start+4,3)+1; height=bytes.readUIntLE(start+7,3)+1; break; }
      if (type==='VP8 ') { width=bytes.readUInt16LE(start+6)&0x3fff; height=bytes.readUInt16LE(start+8)&0x3fff; break; }
      if (type==='VP8L') { const bits=bytes.readUInt32LE(start+1); width=(bits&0x3fff)+1; height=((bits>>>14)&0x3fff)+1; break; }
      offset=start+size+(size%2);
    }
  }
  if (!width || !height) throw new Error(`Cannot read social image dimensions: ${image}`);
  const result={url:absolute(image),width,height,type:image.endsWith('.png')?'image/png':'image/webp'};
  imageCache.set(image,result); return result;
}

function serviceNodes() {
  return capabilities.map(([number,name,,description])=>({
    '@type':'Service','@id':absolute(`/capabilities/#capability-${number}`),name,description,
    serviceType:name,url:absolute(`/capabilities/#capability-${number}`),provider:{'@id':orgId}
  }));
}

function graphFor(route,title,description,project,projects,image,imageAlt) {
  const url=absolute(route);
  const organization={
    '@type':'Organization','@id':orgId,name:site.name,legalName:site.legalName,url:absolute('/'),description:site.description,
    identifier:{'@type':'PropertyValue',propertyID:'SSM',value:site.registration},
    logo:{'@type':'ImageObject',url:absolute('/assets/brand-icon-512.png'),width:512,height:512},
    email:site.email,sameAs:[site.instagram],location:{'@type':'Country',name:site.country},
    contactPoint:{'@type':'ContactPoint',contactType:'Project enquiries',email:site.email,url:absolute('/contact/')},
    founder:{'@id':absolute('/#founder')}
  };
  const website={'@type':'WebSite','@id':websiteId,name:site.name,alternateName:site.legalName,url:absolute('/'),inLanguage:'en',publisher:{'@id':orgId}};
  const webpage={
    '@type':route==='/contact/'?'ContactPage':route==='/studio/'?'AboutPage':['/work/','/industries/'].includes(route)?'CollectionPage':'WebPage',
    '@id':`${url}#webpage`,url,name:title,description,inLanguage:'en',isPartOf:{'@id':websiteId},about:{'@id':orgId},
    primaryImageOfPage:{'@type':'ImageObject',url:image.url,width:image.width,height:image.height,caption:imageAlt}
  };
  const graph=[organization,website,webpage,{'@type':'Person','@id':absolute('/#founder'),name:'Zeyad',url:site.portfolio,worksFor:{'@id':orgId}}];
  if(route==='/') webpage.mainEntity={'@id':orgId};
  if(project) {
    const work={'@type':'CreativeWork','@id':`${url}#project`,name:project.name,headline:project.headline,description:project.summary,
      url,creator:{'@id':orgId},genre:project.type,keywords:[project.industry,...project.services],image:image.url};
    graph.push(work);webpage.mainEntity={'@id':work['@id']};
  }
  if(route==='/work/') webpage.mainEntity={
    '@type':'ItemList',name:'Zencode project case studies',numberOfItems:projects.length,
    itemListElement:projects.map((item,i)=>({'@type':'ListItem',position:i+1,name:item.name,url:absolute(`/work/${item.slug}/`)}))
  };
  if(route==='/capabilities/') {
    const services=serviceNodes();graph.push(...services);
    webpage.mainEntity={'@type':'ItemList',name:'Zencode capabilities',numberOfItems:services.length,
      itemListElement:services.map((service,i)=>({'@type':'ListItem',position:i+1,item:{'@id':service['@id']}}))};
  }
  if(route==='/industries/') webpage.mainEntity={
    '@type':'ItemList',name:'Industries represented in Zencode’s work',numberOfItems:industries.length,
    itemListElement:industries.map(([name],i)=>({'@type':'ListItem',position:i+1,name,url:absolute(`/industries/#industry-${String(i+1).padStart(2,'0')}`)}))
  };
  if(route!=='/' && route!=='/404.html') {
    const trail=[['Home','/'],...(project?[['Work','/work/']]:[]),[project?.name||pageMetadata[route]?.name||title,route]];
    const breadcrumb={'@type':'BreadcrumbList','@id':`${url}#breadcrumb`,itemListElement:trail.map(([name,path],i)=>({'@type':'ListItem',position:i+1,name,item:absolute(path)}))};
    graph.push(breadcrumb);webpage.breadcrumb={'@id':breadcrumb['@id']};
  }
  return {'@context':'https://schema.org','@graph':graph};
}

export async function pageSeo(route,fallbackTitle,fallbackDescription,projects) {
  const project=projects.find(project=>route===`/work/${project.slug}/`);
  const entry=pageMetadata[route];
  const title=`${entry?.title||projectTitles[project?.slug]||fallbackTitle} | ${site.name}`;
  const description=entry?.description||fallbackDescription;
  const imagePath=project?`/assets/projects/${project.image||`${project.slug}-social.webp`}`:site.socialImage;
  const image=await imageInfo(imagePath);
  const imageAlt=project?`${project.name} — ${project.image?'project cover':'illustrative interface study'}. ${project.headline}`:site.socialImageAlt;
  const canonical=absolute(route);
  const markdown=route==='/404.html'?null:`${route}index.md`;
  const schema=JSON.stringify(graphFor(route,title,description,project,projects,image,imageAlt)).replaceAll('<','\\u003c');
  const head=`<title>${esc(title)}</title><meta name="description" content="${esc(description)}"><meta name="theme-color" content="#2d2627"><meta name="robots" content="${route==='/404.html'?'noindex,follow':'index,follow,max-image-preview:large'}"><link rel="canonical" href="${canonical}"><link rel="describedby" href="/llms.txt" type="text/plain">${markdown?`<link rel="alternate" type="text/markdown" href="${markdown}" title="Markdown version">`:''}<meta property="og:type" content="website"><meta property="og:site_name" content="${site.name}"><meta property="og:locale" content="en_MY"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${image.url}"><meta property="og:image:type" content="${image.type}"><meta property="og:image:width" content="${image.width}"><meta property="og:image:height" content="${image.height}"><meta property="og:image:alt" content="${esc(imageAlt)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(description)}"><meta name="twitter:image" content="${image.url}"><meta name="twitter:image:alt" content="${esc(imageAlt)}"><script type="application/ld+json">${schema}</script>`;
  return {title,description,canonical,markdown,head,project};
}
