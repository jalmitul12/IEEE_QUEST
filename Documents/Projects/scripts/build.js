const fs=require('fs');
const path=require('path');
const cp=require('child_process');
const root=path.join(__dirname,'..');
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>{const p=path.join(dir,e.name);if(e.name==='node_modules'||e.name==='.git')return [];return e.isDirectory()?walk(p):[p];});}
let failed=false;
function pass(label){console.log('✓',label);}function fail(label,detail=''){failed=true;console.error('✗',label,detail);}
for(const file of walk(root).filter(f=>f.endsWith('.js'))){const r=cp.spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(r.status!==0){fail(`JS syntax ${path.relative(root,file)}`,r.stderr);}else pass(`JS syntax ${path.relative(root,file)}`);}
for(const file of walk(path.join(root,'data')).filter(f=>f.endsWith('.json'))){try{JSON.parse(fs.readFileSync(file,'utf8'));pass(`JSON ${path.relative(root,file)}`);}catch(e){fail(`JSON ${path.relative(root,file)}`,e.message);}}
for(const file of walk(path.join(root,'public')).filter(f=>f.endsWith('.html'))){const html=fs.readFileSync(file,'utf8');const rel=path.relative(root,file);if(!html.includes('name="viewport"'))fail(`viewport ${rel}`);else pass(`viewport ${rel}`);const inlineScripts=[...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>/gi)];if(inlineScripts.length && rel!==path.join('public','system-check.html'))fail(`unexpected inline script ${rel}`);const ids=[...html.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]),dupes=[...new Set(ids.filter((x,i)=>ids.indexOf(x)!==i))];if(dupes.length)fail(`duplicate HTML ids ${rel}`,dupes.join(', '));}
const publicJs=walk(path.join(root,'public','js')).filter(f=>f.endsWith('.js'));
for(const f of publicJs){const src=fs.readFileSync(f,'utf8');if(/\.innerHTML\s*=|insertAdjacentHTML\s*\(/.test(src))fail(`unsafe dynamic HTML assignment ${path.relative(root,f)}`);}
const sensitiveHtml=['public/login.html',...walk(path.join(root,'public','app')).filter(f=>f.endsWith('.html')).map(f=>path.relative(root,f))];
for(const rel of sensitiveHtml){const html=fs.readFileSync(path.join(root,rel),'utf8');if(/<script[^>]+src="https?:\/\//i.test(html))fail(`third-party runtime script on sensitive page ${rel}`);else pass(`no third-party runtime script ${rel}`);}
const awareness=fs.readFileSync(path.join(root,'public','awareness.html'),'utf8');if(!awareness.includes('https://cdn.tailwindcss.com'))fail('Tailwind Play CDN academic demo');else pass('Tailwind Play CDN academic demo');for(const id of ['book-title','book-author','book-publisher','book-year','book-isbn','book-quantity']){if(!awareness.includes(`id="${id}"`))fail(`Practical-6 field ${id}`);else pass(`Practical-6 field ${id}`);}
const dangerous=[['predictable JWT fallback','aegis-development-secret-change-me'],['broken mobile menu message','Use browser navigation or rotate'],['unsafe incident mass merge','{...incidents[i],...req.body']];
for(const [label,needle] of dangerous){const matches=walk(root).filter(f=>/\.(js|html)$/.test(f)&&path.relative(root,f)!==path.join('scripts','build.js')&&fs.readFileSync(f,'utf8').includes(needle));if(matches.length)fail(label,matches.map(x=>path.relative(root,x)).join(', '));else pass(`${label} absent`);}
const appJs=fs.readFileSync(path.join(root,'public/js/app.js'),'utf8'),css=fs.readFileSync(path.join(root,'public/css/main.css'),'utf8');if(appJs.includes('data-menu-toggle')&&css.includes('.sidebar.open'))pass('mobile navigation drawer');else fail('mobile navigation drawer');
const api=fs.readFileSync(path.join(root,'server/routes/api.js'),'utf8');for(const needle of ['INCIDENT_TRANSITIONS','findAssignableTeam','assignedSosId','requirePatch']){if(api.includes(needle))pass(`API hardening ${needle}`);else fail(`API hardening ${needle}`);}
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));for(const [name,version] of Object.entries(pkg.dependencies||{})){if(/^[~^*><=]/.test(version))fail(`unpinned dependency ${name}`,version);else pass(`pinned dependency ${name}@${version}`);}
for(const [name,version] of Object.entries(pkg.devDependencies||{})){if(/^[~^*><=]/.test(version))fail(`unpinned dev dependency ${name}`,version);else pass(`pinned dev dependency ${name}@${version}`);}
const tailwindCss=fs.readFileSync(path.join(root,'public/css/tailwind-aegis.css'),'utf8');if(tailwindCss.includes('tailwindcss v4.1.10'))pass('locally compiled Tailwind CSS artifact');else fail('locally compiled Tailwind CSS artifact');
const check=cp.spawnSync(process.execPath,[path.join(root,'scripts/self-check.js')],{encoding:'utf8'});process.stdout.write(check.stdout);process.stderr.write(check.stderr);if(check.status!==0)failed=true;
if(failed)process.exit(1);
console.log('\nBuild verification passed: syntax, JSON, HTML, CSP-sensitive pages, XSS regressions, workflow hardening and academic structure.');
