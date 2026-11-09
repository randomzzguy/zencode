import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { site, pageMetadata } from '../content/site.mjs';
import { capabilities, industries } from '../content/site-copy.mjs';

const url = route => `${site.url}${route}`;
const projectLink = project => `[${project.name}](${url(`/work/${project.slug}/`)})`;
const mdLink = (name,route) => `[${name}](${url(`${route}index.md`)})`;
const escapeXml = text => text.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');

function projectDocument(project) {
  return `# ${project.name}

> ${project.summary}

Website: ${url(`/work/${project.slug}/`)}
Industry: ${project.industry}
Project context: ${project.type}
Services: ${project.services.join(', ')}

## ${project.headline}

### The starting point

${project.challenge}

### The approach

${project.approach}

## What went into the build

${project.features.map(([title,copy])=>`### ${title}\n\n${copy}`).join('\n\n')}
${project.scope?`\n## Scope\n\n${project.scope.map(item=>`- ${item}`).join('\n')}\n`:''}
${project.journey?`\n## Workflow\n\n${project.journey.map(([title,copy],i)=>`${i+1}. **${title}:** ${copy}`).join('\n')}\n`:''}
${project.decisions?`\n## Engineering decisions\n\n${project.decisions.map(([title,copy])=>`### ${title}\n\n${copy}`).join('\n\n')}\n`:''}
${project.stack?`\n## Built with\n\n${project.stack.join(', ')}\n`:''}
## Project context

${project.note}
${project.url?`\nExternal project website: ${project.url}\n`:''}${project.source?`\nPublic source: ${project.source}\n`:''}
Project enquiry: ${url('/contact/')}
`;
}

// The privacy article uses a small, fixed HTML vocabulary; convert its source
// rather than maintaining a second independently edited privacy statement.
function privacyMarkdown(body) {
  const article=body.match(/<article class="wrap prose|<article class="prose wrap/);
  const start=article?body.indexOf('>',article.index)+1:0;
  return body.slice(start,body.indexOf('</article>',start))
    .replace(/<a\b[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/g,(_,href,text)=>`[${text}](${href.startsWith('/')?url(href):href})`)
    .replace(/<h2>(.*?)<\/h2>/g,'\n\n## $1\n\n').replace(/<\/p>/g,'\n\n').replace(/<[^>]+>/g,'').replace(/\n{3,}/g,'\n\n').trim();
}

function pageDocument(page,projects,selectedWork,faqs) {
  if(page.project) return projectDocument(page.project);
  const preface=`# ${pageMetadata[page.route]?.name||site.name}\n\n> ${page.description}\n\nWebsite: ${url(page.route)}\n\n`;
  if(page.route==='/') return `# ${site.legalName}\n\n> ${site.description}\n\nOfficial website: ${url('/')}\nSSM: ${site.registration}\nBased in ${site.country}. Open to conversations wherever you are.\n\n## What we do\n\n${capabilities.map(([n,name,,copy])=>`- [${name}](${url(`/capabilities/#capability-${n}`)}): ${copy}`).join('\n')}\n\n## Selected work\n\n${selectedWork.map(({project})=>`- ${projectLink(project)}: ${project.summary}`).join('\n')}\n\n## How a project starts\n\n${site.engagement}\n\n## Contact\n\nEmail: ${site.email}\nWhatsApp: ${site.whatsapp}\nEnquiry form: ${url('/contact/')}\n\n## Understanding the portfolio\n\n${site.projectContext}\n`;
  if(page.route==='/work/') return preface+`## ${projects.length} project stories\n\n${site.projectContext}\n\n${projects.map(project=>`### ${projectLink(project)}\n\n${project.summary}\n\nIndustry: ${project.industry}. Context: ${project.type}.\nServices: ${project.services.join(', ')}.\nMarkdown: ${url(`/work/${project.slug}/index.md`)}`).join('\n\n')}\n`;
  if(page.route==='/capabilities/') return preface+capabilities.map(([n,name,title,copy,items,slugs])=>`## ${name}\n\n${title}\n\n${copy}\n\n${items.map(item=>`- ${item}`).join('\n')}\n\nExamples: ${slugs.map(slug=>projectLink(projects.find(project=>project.slug===slug))).join(', ')}.`).join('\n\n')+`\n\n## Our approach\n\nUnderstand the business and its users; agree the scope and approach; build with working progress and feedback; launch with a handover and an agreed support plan.\n\n${site.engagement}\n\n## Questions and answers\n\n${faqs.map(([question,answer])=>`### ${question}\n\n${answer}`).join('\n\n')}\n`;
  if(page.route==='/industries/') return preface+industries.map(([name,title,copy,slugs])=>`## ${name}\n\n${title}\n\n${copy}\n\nRelated work: ${slugs.map(slug=>projectLink(projects.find(project=>project.slug===slug))).join(', ')}.`).join('\n\n')+`\n\n## A new industry\n\nWe start by understanding the customers, processes and details that make a business different. Contact: ${url('/contact/')}\n`;
  if(page.route==='/studio/') return preface+`## ${site.legalName}\n\n${site.description}\n\nSSM: ${site.registration}\n\nZencode is led by Zeyad, a developer and product builder with a design background. Our work combines thoughtful interfaces, practical systems and personal ownership of the details.\n\nZeyad’s portfolio: ${site.portfolio}\n\n## How we work\n\n- Ask questions before recommending technology.\n- Explain options and trade-offs clearly.\n- Share working progress and use feedback to shape the result.\n- Take care of the interface, workflow and handover.\n\n${site.engagement}\n`;
  if(page.route==='/contact/') return preface+`## Start a conversation\n\nEmail: ${site.email}\nWhatsApp: ${site.whatsapp}\nEnquiry form: ${url('/contact/')}\n\nYou can ask about a stronger online presence, a better business workflow, practical AI, or a new product idea. A technical brief is not required.\n\n${site.engagement}\n\nBased in ${site.country}.\nLegal business name: ${site.legalName}\nSSM: ${site.registration}\n\nPrivacy notice: ${url('/privacy/')}\n`;
  if(page.route==='/ai-assistant/') return preface+`## What it is

Zencode sets up an AI assistant, built on Qlynk, that answers a business’s customer questions from its own approved information. It gets its own page and QR code at qlynk.site/yourbusiness and a chat button for the business website. Owners log in to read conversations and see questions it could not answer yet.

## Price

- Starter: RM 900 one-time setup, ready in 3 days.
- Standard: RM 1,800 one-time setup, ready in 5 to 7 days, with answers written together and 30 days of tweaks.

No monthly charge from Zencode. Qlynk’s Creator plan is free with 5,000 messages a month; its optional Agency plan is US$38 a month, paid to Qlynk.

Start: ${site.whatsapp}
`;
  if(page.route==='/privacy/') return preface+privacyMarkdown(page.body)+'\n';
  throw new Error(`Missing Markdown content for ${page.route}`);
}

export async function writeDiscovery(out,pages,projects,selectedWork,faqs) {
  const publicPages=pages.filter(page=>page.route!=='/404.html');
  const documents=new Map();
  for(const page of publicPages) {
    const content=pageDocument(page,projects,selectedWork,faqs);
    const target=path.join(out,page.route,'index.md');
    await mkdir(path.dirname(target),{recursive:true});await writeFile(target,content);
    documents.set(page.route,content);
  }
  const llms=`# ${site.legalName}

> ${site.description}

Official website: ${url('/')}. Brand name: ${site.name}. SSM: ${site.registration}.
Contact: ${site.email}. WhatsApp: ${site.whatsapp}.
${site.engagement}
${site.projectContext}

## Company and services

${['/','/capabilities/','/ai-assistant/','/industries/','/studio/','/contact/'].map(route=>`- ${mdLink(pageMetadata[route].name,route)}: ${pageMetadata[route].description}`).join('\n')}

## Projects

- ${mdLink('Project collection','/work/')}: ${projects.length} case studies spanning client work, independent products and explorations.
${projects.map(project=>`- ${mdLink(project.name,`/work/${project.slug}/`)}: ${project.summary} Context: ${project.type}.`).join('\n')}

## Optional

- [Complete public reference](${url('/llms-full.txt')}): Expanded company, service, industry and project information in one file.
- ${mdLink('Privacy notice','/privacy/')}: Enquiries, website preferences and third-party services.
- [Sitemap](${url('/sitemap.xml')}): Canonical HTML pages.
`;
  await writeFile(path.join(out,'llms.txt'),llms);
  await writeFile(path.join(out,'llms-full.txt'),`# ${site.legalName} — Complete Public Reference\n\n> ${site.description}\n\n${site.projectContext}\n\n${[...documents].map(([route,content])=>`---\n\nSource: ${url(route)}\nMarkdown: ${url(`${route}index.md`)}\n\n${content}`).join('\n\n')}`);
  await writeFile(path.join(out,'robots.txt'),`# Public website of ${site.legalName}\nUser-agent: *\nAllow: /\n\nSitemap: ${url('/sitemap.xml')}\n\n# LLM-readable overview: ${url('/llms.txt')}\n`);
  await writeFile(path.join(out,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${publicPages.map(page=>`  <url><loc>${escapeXml(url(page.route))}</loc></url>`).join('\n')}\n</urlset>\n`);
}
