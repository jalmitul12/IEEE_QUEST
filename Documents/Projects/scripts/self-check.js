const fs=require('fs');
const path=require('path');
const root=path.join(__dirname,'..');
const required=[
'package.json','.env.example','.gitignore','SECURITY.md','server/index.js','server/config.js','server/routes/auth.js','server/routes/api.js','server/middleware/auth.js','server/middleware/security.js','server/utils/store.js','server/utils/validation.js','server/services/risk.js','scripts/script.js','scripts/app.js','scripts/build-tailwind.js','scripts/display.js','scripts/read-json.js','scripts/multi-dimensional-JSON-display.js','public/index.html','public/login.html','public/register.html','public/system-check.html','public/awareness.html','public/css/tailwind-aegis.css','public/js/app.js','public/js/common.js','public/js/awareness.js','public/app/dashboard.html','public/app/map.html','public/app/risk.html','public/app/alerts.html','public/app/sos.html','public/app/shelters.html','public/app/evacuation.html','public/app/preparedness.html','public/app/incidents.html','public/app/teams.html','public/app/analytics.html','public/app/notifications.html','public/app/profile.html','public/app/settings.html','data/disasters.json','data/shelters.json','data/alerts.json','data/teams.json','data/incidents.json','data/resources.json','README.md','docs/PRACTICAL-MAPPING.md'
];
let failed=false;
for(const f of required){const ok=fs.existsSync(path.join(root,f));console.log(ok?'✓':'✗',f);if(!ok)failed=true;}
const thresholds={ 'disasters.json':15,'shelters.json':10,'alerts.json':10,'teams.json':8,'incidents.json':10 };
for(const [name,min] of Object.entries(thresholds)){try{const data=JSON.parse(fs.readFileSync(path.join(root,'data',name),'utf8'));const ok=Array.isArray(data)&&data.length>=min;console.log(ok?'✓':'✗',`${name}: ${data.length}/${min}+ seeded records`);if(!ok)failed=true;}catch(e){console.log('✗',name,e.message);failed=true;}}
const incidentHtml=fs.readFileSync(path.join(root,'public/app/incidents.html'),'utf8');
for(const status of ['Reported','Verified','Team Assigned','Responding','Resolved']){const ok=incidentHtml.includes(`data-status="${status}"`);console.log(ok?'✓':'✗',`incident lane: ${status}`);if(!ok)failed=true;}
const awareness=fs.readFileSync(path.join(root,'public/awareness.html'),'utf8');
for(const field of ['book-title','book-author','book-publisher','book-year','book-isbn','book-quantity']){const ok=awareness.includes(`id="${field}"`);console.log(ok?'✓':'✗',`Tailwind preparedness-library field: ${field}`);if(!ok)failed=true;}
const packageJson=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
for(const script of ['build','test','start','check','verify']){const ok=!!packageJson.scripts?.[script];console.log(ok?'✓':'✗',`npm script: ${script}`);if(!ok)failed=true;}
for(const [name,version] of Object.entries(packageJson.dependencies||{})){const ok=!/^[~^*><=]/.test(version);console.log(ok?'✓':'✗',`pinned dependency: ${name}@${version}`);if(!ok)failed=true;}
for(const [name,version] of Object.entries(packageJson.devDependencies||{})){const ok=!/^[~^*><=]/.test(version);console.log(ok?'✓':'✗',`pinned dev dependency: ${name}@${version}`);if(!ok)failed=true;}
const twBuild=packageJson.scripts?.['build:tailwind'];if(twBuild){console.log('✓','Tailwind local build script');}else{console.log('✗','Tailwind local build script');failed=true;}
if(failed)process.exit(1);
console.log('\nAegis structural, security and academic self-check passed.');
