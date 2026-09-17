import {createApp,computed,h,onBeforeUnmount,onMounted,ref} from '/vendor/vue/vue.runtime.esm-browser.prod.js';

const element=(tag,props,children)=>h(tag,props,children);
const link=(label,href,className='btn btn-ghost btn-sm')=>element('a',{class:className,href},label);

const Dashboard={
  setup(){
    const data=ref(null),loading=ref(true),error=ref(''),lastUpdated=ref('');
    const location=getRememberedLocation();
    let controller;
    const metrics=computed(()=>data.value?[
      ['Regional Risk',`${data.value.regionalRisk}/100`,'High'],
      ['Active Alerts',data.value.alerts,'Moderate'],
      ['Nearby Shelters',data.value.nearbyShelters===null?'Set location':data.value.nearbyShelters,data.value.nearbyShelters===null?'Moderate':'Safe'],
      ['Available Teams',data.value.availableTeams,'Safe'],
      ['Active Incidents',data.value.activeIncidents,'High'],
      ['Critical Warnings',data.value.criticalWarnings,'Severe']
    ]:[]);
    const localAwareness=computed(()=>{
      if(!location)return 'Set your location from the top bar to calculate nearby shelter availability.';
      if(!data.value)return 'Calculating nearby shelter availability…';
      const count=data.value.nearbyShelters;
      return count===0?'No demo shelters were found within 50 km of the selected location.':`${count} demo shelter${count===1?'':'s'} within 50 km of the selected location.`;
    });
    async function loadDashboard(){
      controller?.abort(); controller=new AbortController(); loading.value=true; error.value='';
      try{
        const suffix=location?`?lat=${encodeURIComponent(location.latitude)}&lon=${encodeURIComponent(location.longitude)}`:'';
        data.value=await api('/api/dashboard'+suffix,{signal:controller.signal});
        lastUpdated.value=`Last updated ${formatDate(data.value.lastUpdated)} · Simulated operational dataset.`;
      }catch(err){
        if(!controller.signal.aborted){error.value=err.message;toast(err.message,'error');}
      }finally{loading.value=false;}
    }
    onMounted(loadDashboard);
    onBeforeUnmount(()=>controller?.abort());
    return {data,error,lastUpdated,loading,localAwareness,metrics,loadDashboard};
  },
  render(){
    if(this.loading&&!this.data)return element('section',{class:'card','aria-live':'polite'},'Loading command-center metrics…');
    if(this.error&&!this.data)return element('section',{class:'card notice-danger','aria-live':'assertive'},[
      element('p',{},this.error),element('button',{class:'btn btn-primary btn-sm',type:'button',onClick:this.loadDashboard},'Try again')
    ]);
    const d=this.data;
    return element('div',{},[
      element('div',{class:'metric-grid','aria-live':'polite'},this.metrics.map(([label,value,severity])=>element('article',{class:'card rounded-xl shadow-xl',key:label},[
        element('div',{class:'muted'},label),element('div',{class:'metric'},String(value)),element('span',{class:statusClass(severity)},severity)
      ]))),
      element('div',{class:'split',style:'margin-top:18px'},[
        element('section',{class:'card'},[
          element('div',{style:'display:flex;justify-content:space-between;align-items:center;gap:10px'},[element('h2',{style:'font-size:18px'},'Active alert feed'),link('Open alerts','/app/alerts')]),
          ...(d.alertsFeed||[]).map(alert=>element('div',{class:'task',key:alert.id},[element('div',{},[element('b',{},alert.type),element('div',{class:'muted'},alert.region)]),element('span',{class:statusClass(alert.severity)},alert.severity)]))
        ]),
        element('section',{class:'card'},[
          element('div',{style:'display:flex;justify-content:space-between;align-items:center;gap:10px'},[element('h2',{style:'font-size:18px'},'Incident pulse'),link('Open board','/app/incidents')]),
          ...(d.incidents||[]).map(incident=>element('div',{class:'task',key:incident.id},[element('div',{},[element('b',{},incident.title),element('div',{class:'muted'},incident.team||'Unassigned')]),element('span',{class:statusClass(incident.status)},incident.status)]))
        ])
      ]),
      element('div',{class:'grid grid-3 mt-4',style:'margin-top:18px'},[
        element('section',{class:'card'},[element('h3',{},'Local awareness'),element('p',{class:'muted'},this.localAwareness)]),
        element('section',{class:'card'},[element('h3',{},'Environment widget'),element('p',{class:'metric'},'31°C'),element('p',{class:'muted'},'Simulated · Humidity 68% · Wind 19 km/h')]),
        element('section',{class:'card'},[element('h3',{},'Emergency shortcut'),element('p',{class:'muted'},'For a real emergency in India, use official services. Aegis SOS is a simulation.'),element('div',{class:'card-actions'},[link('Open simulated SOS','/app/sos','btn btn-danger'),link('112 resources','/resources','btn btn-ghost')])])
      ]),
      element('div',{style:'display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:14px'},[
        element('p',{class:'tiny muted'},this.lastUpdated),element('button',{class:'btn btn-ghost btn-sm',type:'button',disabled:this.loading,onClick:this.loadDashboard},this.loading?'Refreshing…':'Refresh data')
      ])
    ]);
  }
};

document.addEventListener('DOMContentLoaded',()=>{
  injectShell('Command Center','Vue-powered regional situational awareness and emergency operations overview.');
  createApp(Dashboard).mount('#vue-dashboard-root');
});
