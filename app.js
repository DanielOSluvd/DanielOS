const KEY='danielOS.v1';
const defaults={
  days:{}, weeklyGoals:{}, monthlyGoals:{}, importedEvents:[], calendarSubscriptions:{}, calendarVisibility:{}, reviews:{}, goals:[], systemData:{},
  top3:[
    {text:'Store: Set a clear peak plan and coach one observable behaviour.',done:false},
    {text:'Family: Give Mia and your wife an undistracted evening block.',done:false},
    {text:'Self: Complete a short reset instead of chasing a perfect routine.',done:false}
  ]
};
let state=load();
state.days ||= {}; state.weeklyGoals ||= {}; state.monthlyGoals ||= {}; state.importedEvents ||= []; state.reviews ||= {}; state.calendarSubscriptions ||= {}; state.calendarVisibility ||= {}; state.goals ||= []; state.systemData ||= {};
const CALENDARS=[{name:'Work Schedule',color:'#2f80ed'},{name:'Work',color:'#5b8cff'},{name:'Family',color:'#ff7f9f'},{name:'Personal',color:'#b083ff'},{name:'Leisure',color:'#f4b860'},{name:'Gym',color:'#52d19a'},{name:'Self Care',color:'#57c7d4'},{name:'OTHER',color:'#a8b0c3'}];
const SYSTEMS=[
 {id:'starbucks',name:'Starbucks Command Centre',icon:'☕',className:'system-coffee',description:'Store performance, leadership, partner growth and customer experience.'},
 {id:'family',name:'Family HQ',icon:'♡',className:'system-family',description:'Mia, marriage, memories, trips and family routines.'},
 {id:'health',name:'Health OS',icon:'⌁',className:'system-health',description:'Sleep, workouts, supplements, nutrition, energy and recovery.'},
 {id:'finance',name:'Finance HQ',icon:'$',className:'system-finance',description:'Budget, savings, debt, vehicles, property and long-term security.'},
 {id:'growth',name:'Growth & Identity',icon:'✦',className:'system-growth',description:'Identity, spirituality, habits, learning and personal evolution.'},
 {id:'brain',name:'Daniel Brain',icon:'⌕',className:'system-brain',description:'Ideas, decisions, templates, research and projects.'}
];
let activeSystemId='starbucks';
SYSTEMS.forEach(s=>{state.systemData[s.id] ||= {vision:'',timeline:[]}});

CALENDARS.forEach(c=>{if(state.calendarVisibility[c.name]===undefined)state.calendarVisibility[c.name]=true;if(!state.calendarSubscriptions[c.name])state.calendarSubscriptions[c.name]=''});
if(state.calendarUrl && !state.calendarSubscriptions.Personal){state.calendarSubscriptions.Personal=state.calendarUrl;delete state.calendarUrl;save();}
let selectedDate=localDateKey(new Date());
let visualCalendarDate=selectedDate;
let visualCalendarMode='day';
let deferredPrompt=null;

function load(){try{return Object.assign({},defaults,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch{return structuredClone(defaults)}}
function save(){
 localStorage.setItem(KEY,JSON.stringify(state));
 if(window.DanielCloud)window.DanielCloud.scheduleSave(state);
 updateStorageStatus();
}
function updateStorageStatus(){
 const el=document.getElementById('storageStatus');
 if(!el)return;
 const cloud=window.DanielCloud?.status?.();
 el.textContent=cloud?.signedIn?(cloud.syncing?' Syncing…':' Synced to Supabase'):' Saved on this device';
}
function localDateKey(d){const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${day}`}
function displayDate(key){return new Intl.DateTimeFormat('en-CA',{weekday:'long',year:'numeric',month:'long',day:'numeric'}).format(new Date(key+'T12:00:00'))}
function weekKey(key){const d=new Date(key+'T12:00:00');const dayNum=(d.getDay()+6)%7;d.setDate(d.getDate()-dayNum);return localDateKey(d)}
function weekLabel(key){const start=new Date(weekKey(key)+'T12:00:00');const end=new Date(start);end.setDate(end.getDate()+6);const a=new Intl.DateTimeFormat('en-CA',{month:'short',day:'numeric'}).format(start);const b=new Intl.DateTimeFormat('en-CA',{month:'short',day:'numeric',year:'numeric'}).format(end);return `${a} – ${b}`}
function monthKey(key){return key.slice(0,7)}
function monthLabel(key){return new Intl.DateTimeFormat('en-CA',{month:'long',year:'numeric'}).format(new Date(key+'-01T12:00:00'))}
function defaultWeeklyGoals(){return [
 {text:'Create one measurable store improvement',done:false},
 {text:'Complete two meaningful workouts or recovery sessions',done:false},
 {text:'Plan one intentional family moment',done:false}
]}
function defaultMonthlyGoals(){return [
 {text:'Complete the next Daniel OS milestone',done:false},
 {text:'Review budget, savings and upcoming expenses',done:false},
 {text:'Capture and save three meaningful family memories',done:false}
]}
function weeklyGoals(){const k=weekKey(selectedDate);if(!state.weeklyGoals[k])state.weeklyGoals[k]=defaultWeeklyGoals();return state.weeklyGoals[k]}
function monthlyGoals(){const k=monthKey(selectedDate);if(!state.monthlyGoals[k])state.monthlyGoals[k]=defaultMonthlyGoals();return state.monthlyGoals[k]}
function defaultDay(){
 return {theme:'Calm execution',outcome:'Leave work knowing the team had clarity and support.',energy:7,
 goals:[
  {text:'Complete one intentional coaching conversation',done:false},
  {text:'Drink water before second coffee',done:false},
  {text:'Protect 30 minutes of family time',done:false}
 ],
 timeline:[
  {time:'06:00',title:'Start grounded',note:'Water, affirmation, review the day’s Top 3.'},
  {time:'07:00',title:'Store arrival',note:'Walk the store, confirm play, set one clear expectation.'},
  {time:'09:00',title:'Peak leadership',note:'Protect deployment, coach in the moment, watch bottlenecks.'},
  {time:'13:00',title:'Admin sprint',note:'Complete follow-ups, scheduling and one important message.'},
  {time:'16:30',title:'Hard stop',note:'Document tomorrow’s first step and leave on time.'},
  {time:'17:00',title:'Daycare pickup',note:'Transition out of manager mode before walking in.'},
  {time:'20:00',title:'Reset',note:'Choose gym, planning or recovery based on energy.'}
 ],workNotes:'',familyNotes:'',reflectionNotes:''
 }
}
function day(){if(!state.days[selectedDate])state.days[selectedDate]=defaultDay();return state.days[selectedDate]}
function esc(s=''){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function formatTime(t){const [h,m]=t.split(':').map(Number);return new Intl.DateTimeFormat('en-CA',{hour:'numeric',minute:'2-digit'}).format(new Date(2000,0,1,h,m))}
function calendarMeta(name){return CALENDARS.find(c=>c.name===name)||CALENDARS[CALENDARS.length-1]}
function visibleEvents(events){return events.filter(e=>state.calendarVisibility[e.calendar||'OTHER']!==false)}
function currentEvents(){return visibleEvents(state.importedEvents.filter(e=>e.date===selectedDate)).sort((a,b)=>a.start.localeCompare(b.start))}

document.querySelectorAll('.nav').forEach(b=>b.addEventListener('click',()=>show(b.dataset.view)));
document.querySelectorAll('.jump').forEach(b=>b.addEventListener('click',()=>show(b.dataset.jump)));
function show(id){
 document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active-view',v.id===id));
 document.querySelectorAll('.nav').forEach(v=>v.classList.toggle('active',v.dataset.view===id));
 document.getElementById('pageTitle').textContent={home:'Good afternoon, Daniel.',daily:'Daily Command Page',calendar:'Apple Calendar Bridge',goals:'Goals',systems:'Life Systems',systemDetail:systemMeta(activeSystemId).name,review:'Weekly Review',settings:'Settings'}[id];
 if(id==='daily')renderDay(); if(id==='visualCalendar')renderVisualCalendar(); if(id==='calendar')renderCalendar(); if(id==='goals')renderGoals(); if(id==='systems')renderSystems(); if(id==='systemDetail')renderSystemDetail();
}

const affirmations=['I move through today with calm authority, clarity and purpose.','I do not need to rush to be effective.','My presence creates order, confidence and momentum.','I lead my life deliberately instead of reacting to it.','What I consistently embody becomes my reality.'];
let ai=0;document.getElementById('newAffirmation').onclick=()=>{ai=(ai+1)%affirmations.length;document.getElementById('affirmation').textContent=affirmations[ai]};

function renderTop3(){
 const el=document.getElementById('top3List');el.innerHTML='';
 state.top3.forEach((x,i)=>{const row=document.createElement('label');row.className='check-item'+(x.done?' done':'');row.innerHTML=`<input type="checkbox" ${x.done?'checked':''}><span>${esc(x.text)}</span>`;row.querySelector('input').onchange=e=>{x.done=e.target.checked;save();renderTop3()};el.append(row)});
 const c=state.top3.filter(x=>x.done).length;document.getElementById('top3Badge').textContent=`${c} / 3`;document.getElementById('priorityMetric').textContent=`${c}/3`;
}
function timelineHTML(items){return items.map(x=>`<div class="timeline-item"><div class="timeline-time">${formatTime(x.time)}</div><div class="timeline-track"></div><div class="timeline-content"><strong>${esc(x.title)}</strong><small>${esc(x.note||'')}</small></div></div>`).join('')}
function renderHome(){
 renderTop3();document.getElementById('affirmation').textContent=affirmations[ai];
 const d=day();document.getElementById('homeTimeline').innerHTML=timelineHTML(d.timeline.slice(0,5));
 const events=currentEvents();document.getElementById('calendarSnapshot').innerHTML=events.length?events.slice(0,5).map(eventHTML).join(''):'<p class="muted">No imported events for today.</p>';
}
function renderDay(){
 document.getElementById('datePicker').value=selectedDate;document.getElementById('dailyDateTitle').textContent=displayDate(selectedDate);
 const d=day();dayTheme.value=d.theme;dayOutcome.value=d.outcome;dayEnergy.value=d.energy;energyValue.textContent=`${d.energy}/10`;
 workNotes.value=d.workNotes;familyNotes.value=d.familyNotes;reflectionNotes.value=d.reflectionNotes;
 const goals=document.getElementById('goalList');goals.innerHTML='';
 d.goals.forEach((g,i)=>{const r=document.createElement('label');r.className='check-item'+(g.done?' done':'');r.innerHTML=`<input type="checkbox" ${g.done?'checked':''}><span>${esc(g.text)}</span>`;r.querySelector('input').onchange=e=>{g.done=e.target.checked;save();renderDay()};goals.append(r)});
 renderPeriodGoals('weeklyGoalList',weeklyGoals(),'weeklyProgress');
 renderPeriodGoals('monthlyGoalList',monthlyGoals(),'monthlyProgress');
 document.getElementById('weeklyGoalPeriod').textContent=weekLabel(selectedDate);
 document.getElementById('monthlyGoalPeriod').textContent=monthLabel(monthKey(selectedDate));
 document.getElementById('timelineList').innerHTML=timelineHTML(d.timeline);
}
function renderPeriodGoals(listId,items,progressId){
 const list=document.getElementById(listId);list.innerHTML='';
 items.forEach(item=>{const r=document.createElement('label');r.className='check-item'+(item.done?' done':'');r.innerHTML=`<input type="checkbox" ${item.done?'checked':''}><span>${esc(item.text)}</span>`;r.querySelector('input').onchange=e=>{item.done=e.target.checked;save();renderDay()};list.append(r)});
 const complete=items.filter(x=>x.done).length;document.getElementById(progressId).textContent=`${complete} / ${items.length}`;
}
['dayTheme','dayOutcome','workNotes','familyNotes','reflectionNotes'].forEach(id=>document.getElementById(id).addEventListener('input',e=>{const map={dayTheme:'theme',dayOutcome:'outcome',workNotes:'workNotes',familyNotes:'familyNotes',reflectionNotes:'reflectionNotes'};day()[map[id]]=e.target.value;save();renderHome()}));
dayEnergy.oninput=e=>{day().energy=+e.target.value;energyValue.textContent=`${e.target.value}/10`;save()};
datePicker.onchange=e=>{selectedDate=e.target.value;renderDay();renderHome()};
todayBtn.onclick=()=>{selectedDate=localDateKey(new Date());show('daily')};
addGoal.onclick=()=>{const text=prompt('What goal should be added?');if(text?.trim()){day().goals.push({text:text.trim(),done:false});save();renderDay()}};
addWeeklyGoal.onclick=()=>{const text=prompt('What weekly goal should be added?');if(text?.trim()){weeklyGoals().push({text:text.trim(),done:false});save();renderDay()}};
addMonthlyGoal.onclick=()=>{const text=prompt('What monthly goal should be added?');if(text?.trim()){monthlyGoals().push({text:text.trim(),done:false});save();renderDay()}};
addTimeline.onclick=()=>{const time=prompt('Start time (24-hour format, e.g. 18:30):','18:30');if(!/^\d{2}:\d{2}$/.test(time||''))return;const title=prompt('Timeline block title:');if(!title?.trim())return;const note=prompt('Optional note:','')||'';day().timeline.push({time,title:title.trim(),note});day().timeline.sort((a,b)=>a.time.localeCompare(b.time));save();renderDay();renderHome();downloadICS([{date:selectedDate,start:time,end:addHour(time),title,note}],`daniel-os-${selectedDate}.ics`)};

function addHour(t){let [h,m]=t.split(':').map(Number);h=(h+1)%24;return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`}
function eventHTML(e){const cal=e.calendar||'OTHER',meta=calendarMeta(cal);return `<div class="event" style="--event-color:${meta.color}"><div><strong>${esc(e.title)}</strong><small>${formatTime(e.start)}${e.end?' – '+formatTime(e.end):''}</small><span class="event-calendar" style="--event-color:${meta.color}">${esc(cal)}</span></div><span class="pill">${esc(e.date)}</span></div>`}

function dateAdd(key,days){const d=new Date(key+'T12:00:00');d.setDate(d.getDate()+days);return localDateKey(d)}
function mondayOf(key){const d=new Date(key+'T12:00:00'),day=(d.getDay()+6)%7;d.setDate(d.getDate()-day);return localDateKey(d)}
function monthStart(key){return key.slice(0,7)+'-01'}
function eventsForDate(key){return state.importedEvents.filter(e=>e.date===key&&state.calendarVisibility[e.calendar||'OTHER']!==false).sort((a,b)=>a.start.localeCompare(b.start))}
function renderVisualFilters(){visualCalendarFilters.innerHTML=CALENDARS.map(c=>`<label class="calendar-filter ${state.calendarVisibility[c.name]?'':'off'}" style="--calendar-color:${c.color}"><input data-visual-calendar="${esc(c.name)}" type="checkbox" ${state.calendarVisibility[c.name]?'checked':''}><span class="calendar-dot" style="background:${c.color};color:${c.color}"></span>${esc(c.name)}</label>`).join('');document.querySelectorAll('[data-visual-calendar]').forEach(x=>x.onchange=()=>{state.calendarVisibility[x.dataset.visualCalendar]=x.checked;save();renderVisualCalendar();renderCalendar();renderHome()})}
function visualEvent(e,month=false){const m=calendarMeta(e.calendar||'OTHER');return `<div class="${month?'month-event':'calendar-event-block'}" style="--event-color:${m.color}" title="${esc(e.title)}"><strong>${month?formatTime(e.start)+' ':''}${esc(e.title)}</strong>${month?'':`<small>${formatTime(e.start)}${e.end?' – '+formatTime(e.end):''} · ${esc(e.calendar||'OTHER')}</small>`}</div>`}
function renderVisualCalendar(){
 visualCalendarDateInput.value=visualCalendarDate;renderVisualFilters();
 document.querySelectorAll('.calendar-mode').forEach(b=>b.classList.toggle('active',b.dataset.calendarMode===visualCalendarMode));
 visualCalendarCanvas.classList.toggle('compact',calendarDensity.value==='compact');
 if(visualCalendarMode==='day')renderCalendarDay();else if(visualCalendarMode==='week')renderCalendarWeek();else renderCalendarMonth();
}
function renderCalendarDay(){const ev=eventsForDate(visualCalendarDate);visualCalendarTitle.textContent=displayDate(visualCalendarDate);let html='<div class="calendar-day-layout">';for(let h=5;h<=23;h++){const time=`${String(h).padStart(2,'0')}:00`;html+=`<div class="day-hour-label">${formatTime(time)}</div><div class="day-hour-cell">${ev.filter(e=>parseInt(e.start||'0')===h).map(e=>visualEvent(e)).join('')}</div>`}html+='</div>';visualCalendarCanvas.innerHTML=html}
function renderCalendarWeek(){let start=mondayOf(visualCalendarDate),days=Array.from({length:7},(_,i)=>dateAdd(start,i));if(!showWeekends.checked)days=days.slice(0,5);visualCalendarTitle.textContent=`${displayDate(days[0]).replace(/^\w+, /,'')} – ${displayDate(days[days.length-1]).replace(/^\w+, /,'')}`;let html=`<div class="week-calendar" style="--week-cols:${days.length}"><div class="week-corner"></div>`;days.forEach(d=>html+=`<div class="week-head ${d===localDateKey(new Date())?'today':''}"><strong>${new Date(d+'T12:00:00').toLocaleDateString('en-CA',{weekday:'short'})}</strong><br><small>${new Date(d+'T12:00:00').toLocaleDateString('en-CA',{month:'short',day:'numeric'})}</small></div>`);for(let h=5;h<=23;h++){html+=`<div class="week-time">${formatTime(`${String(h).padStart(2,'0')}:00`)}</div>`;days.forEach(d=>html+=`<div class="week-cell">${eventsForDate(d).filter(e=>parseInt(e.start||'0')===h).map(e=>visualEvent(e)).join('')}</div>`)}html+='</div>';visualCalendarCanvas.innerHTML=html}
function renderCalendarMonth(){const first=new Date(monthStart(visualCalendarDate)+'T12:00:00'),year=first.getFullYear(),month=first.getMonth();visualCalendarTitle.textContent=first.toLocaleDateString('en-CA',{month:'long',year:'numeric'});let start=new Date(first);start.setDate(first.getDate()-((first.getDay()+6)%7));let days=Array.from({length:42},(_,i)=>{const d=new Date(start);d.setDate(start.getDate()+i);return localDateKey(d)});let cols=7,weekdays=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];if(!showWeekends.checked){days=days.filter(d=>{const x=new Date(d+'T12:00:00').getDay();return x!==0&&x!==6});cols=5;weekdays=weekdays.slice(0,5)}let html=`<div class="month-calendar" style="--month-cols:${cols}">`;weekdays.forEach(w=>html+=`<div class="month-weekday">${w}</div>`);days.forEach(d=>{const dt=new Date(d+'T12:00:00'),ev=eventsForDate(d);html+=`<div class="month-day ${dt.getMonth()!==month?'outside':''} ${d===localDateKey(new Date())?'today':''}"><div class="month-number"><span>${dt.getDate()}</span><small>${ev.length||''}</small></div>${ev.slice(0,4).map(e=>visualEvent(e,true)).join('')}${ev.length>4?`<small>+${ev.length-4} more</small>`:''}</div>`});html+='</div>';visualCalendarCanvas.innerHTML=html}

function renderCalendar(){
 const shown=visibleEvents(state.importedEvents).sort((a,b)=>(a.date+a.start).localeCompare(b.date+b.start));
 importedEvents.innerHTML=shown.length?shown.map(eventHTML).join(''):'<p class="muted">No visible imported events.</p>';
 calendarSubscriptions.innerHTML=CALENDARS.map(c=>{const url=state.calendarSubscriptions[c.name]||'';return `<div class="subscription-row"><span class="calendar-dot" style="color:${c.color};background:${c.color}"></span><strong>${esc(c.name)}</strong><input data-calendar-url="${esc(c.name)}" type="url" value="${esc(url)}" placeholder="webcal://..."><a class="button-link ghost open-subscription ${url?'':'hidden'}" data-open-calendar="${esc(c.name)}" href="${esc(url)}">Open</a></div>`}).join('');
 calendarFilters.innerHTML=CALENDARS.map(c=>`<label class="calendar-filter ${state.calendarVisibility[c.name]?'':'off'}" style="--calendar-color:${c.color}"><input data-calendar-visible="${esc(c.name)}" type="checkbox" ${state.calendarVisibility[c.name]?'checked':''}><span class="calendar-dot" style="background:${c.color};color:${c.color}"></span>${esc(c.name)}</label>`).join('');
 document.querySelectorAll('[data-calendar-visible]').forEach(x=>x.onchange=e=>{state.calendarVisibility[e.target.dataset.calendarVisible]=e.target.checked;save();renderCalendar();renderHome()});
 document.querySelectorAll('[data-open-calendar]').forEach(a=>a.onclick=e=>{e.preventDefault();const url=state.calendarSubscriptions[a.dataset.openCalendar];if(url)location.href=url});
}
icsImport.onchange=async e=>{const files=[...e.target.files];if(!files.length)return;const category=icsCalendarType.value;let added=[];for(const f of files){const events=parseICS(await f.text()).map(x=>({...x,calendar:category}));added.push(...events)}state.importedEvents=[...state.importedEvents,...added];save();importStatus.textContent=`Imported ${added.length} event${added.length===1?'':'s'} into ${category}.`;renderCalendar();renderHome();e.target.value=''};
function parseICS(text){
 const unfolded=text.replace(/\r?\n[ \t]/g,'');const blocks=unfolded.split('BEGIN:VEVENT').slice(1);return blocks.map(b=>{
  const get=k=>{const line=b.split(/\r?\n/).find(x=>x.startsWith(k));return line?line.slice(line.indexOf(':')+1).trim():''};
  const raw=get('DTSTART'),rawEnd=get('DTEND');const parse=v=>{const z=v.replace(/[^0-9T]/g,'');if(z.includes('T'))return {date:`${z.slice(0,4)}-${z.slice(4,6)}-${z.slice(6,8)}`,time:`${z.slice(9,11)}:${z.slice(11,13)}`};return {date:`${z.slice(0,4)}-${z.slice(4,6)}-${z.slice(6,8)}`,time:'00:00'}};
  const s=parse(raw),en=rawEnd?parse(rawEnd):{time:''};return {date:s.date,start:s.time,end:en.time,title:get('SUMMARY')||'Calendar event',note:get('DESCRIPTION')}
 }).filter(e=>e.date)
}
saveCalendarSubscriptions.onclick=()=>{document.querySelectorAll('[data-calendar-url]').forEach(x=>state.calendarSubscriptions[x.dataset.calendarUrl]=x.value.trim());save();renderCalendar()};
showAllCalendars.onclick=()=>{CALENDARS.forEach(c=>state.calendarVisibility[c.name]=true);save();renderCalendar();renderHome()};
clearEvents.onclick=()=>{if(confirm('Clear all imported calendar events?')){state.importedEvents=[];save();renderCalendar();renderHome()}};

function icsDate(date,time){return date.replaceAll('-','')+'T'+time.replace(':','')+'00'}
function downloadICS(events,name){
 const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Daniel OS//EN','CALSCALE:GREGORIAN'];
 events.forEach((e,i)=>lines.push('BEGIN:VEVENT',`UID:${Date.now()}-${i}@daniel-os`,`DTSTAMP:${new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'')}`,`DTSTART:${icsDate(e.date,e.start)}`,`DTEND:${icsDate(e.date,e.end||addHour(e.start))}`,`SUMMARY:${e.title.replace(/\n/g,' ')}`,`DESCRIPTION:${(e.note||'').replace(/\n/g,'\\n')}`,'END:VEVENT'));lines.push('END:VCALENDAR');
 download(new Blob([lines.join('\r\n')],{type:'text/calendar'}),name)
}
function download(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}


function systemMeta(id){return SYSTEMS.find(s=>s.id===id)||SYSTEMS[0]}
function uid(){return `${Date.now()}-${Math.random().toString(16).slice(2)}`}
function goalProgress(g){if(g.status==='complete')return 100;const m=g.milestones||[];return m.length?Math.round(m.filter(x=>x.done).length/m.length*100):0}
function daysToTarget(date){if(!date)return null;return Math.ceil((new Date(date+'T12:00:00')-new Date(localDateKey(new Date())+'T12:00:00'))/86400000)}
function renderSystems(){
 systemGrid.innerHTML=SYSTEMS.map(s=>{const goals=state.goals.filter(g=>g.system===s.id);const active=goals.filter(g=>g.status==='active').length;return `<button class="card system ${s.className}" data-system-open="${s.id}"><span>${s.icon}</span><h3>${esc(s.name)}</h3><p>${esc(s.description)}</p><div class="system-card-footer"><strong>${active}</strong><small>active goals</small><b>Open system →</b></div></button>`}).join('');
 document.querySelectorAll('[data-system-open]').forEach(b=>b.onclick=()=>{activeSystemId=b.dataset.systemOpen;show('systemDetail')});
}
function populateGoalSelectors(){
 const options=SYSTEMS.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join('');
 goalSystemInput.innerHTML=options;goalSystemFilter.innerHTML=`<option value="all">All systems</option>${options}`;
}
function openGoalDialog(systemId=activeSystemId,goalId=''){
 populateGoalSelectors();goalEditId.value=goalId;const g=state.goals.find(x=>x.id===goalId);
 goalDialogTitle.textContent=g?'Edit goal':'Create a goal';goalTitleInput.value=g?.title||'';goalSystemInput.value=g?.system||systemId;goalTargetInput.value=g?.target||'';goalStatusInput.value=g?.status||'active';goalWhyInput.value=g?.why||'';goalSuccessInput.value=g?.success||'';goalDialog.showModal();
}
goalForm.addEventListener('submit',e=>{
 if(e.submitter?.value==='cancel')return;e.preventDefault();if(!goalTitleInput.value.trim())return;
 let g=state.goals.find(x=>x.id===goalEditId.value);if(!g){g={id:uid(),createdAt:new Date().toISOString(),milestones:[],timeline:[]};state.goals.push(g)}
 Object.assign(g,{title:goalTitleInput.value.trim(),system:goalSystemInput.value,target:goalTargetInput.value,status:goalStatusInput.value,why:goalWhyInput.value.trim(),success:goalSuccessInput.value.trim()});save();goalDialog.close();renderGoals();renderSystems();if(document.getElementById('systemDetail').classList.contains('active-view'))renderSystemDetail();
});
function goalCardHTML(g){
 const s=systemMeta(g.system),p=goalProgress(g),remaining=daysToTarget(g.target),milestones=g.milestones||[],timeline=g.timeline||[];
 return `<article class="card master-goal" style="--system-accent:var(--${g.system},#8da2fb)">
 <div class="goal-card-top"><div><span class="system-chip">${s.icon} ${esc(s.name)}</span><h3>${esc(g.title)}</h3><p>${esc(g.why||g.success||'Add a reason or definition of success to make this goal more meaningful.')}</p></div><span class="status-badge ${g.status}">${g.status}</span></div>
 <div class="goal-progress-row"><div class="progress-track"><i style="width:${p}%"></i></div><strong>${p}%</strong></div>
 <div class="goal-facts"><span>🎯 ${g.target?esc(g.target):'No target date'}</span><span>${remaining===null?'Timeline open':remaining<0?Math.abs(remaining)+' days overdue':remaining+' days remaining'}</span><span>${milestones.filter(x=>x.done).length}/${milestones.length} stepping stones</span></div>
 <details><summary>});
 <div class="goal-card-actions"><button class="ghost" data-edit-goal="${g.id}">Edit</button><button class="ghost" data-toggle-goal="${g.id}">${g.status==='complete'?'Reopen':'Mark complete'}</button><button class="danger" data-delete-goal="${g.id}">Delete</button></div></article>`
}
function wireGoalActions(){
 document.querySelectorAll('[data-edit-goal]').forEach(b=>b.onclick=()=>openGoalDialog('',b.dataset.editGoal));
 document.querySelectorAll('[data-toggle-goal]').forEach(b=>b.onclick=()=>{const g=state.goals.find(x=>x.id===b.dataset.toggleGoal);g.status=g.status==='complete'?'active':'complete';save();renderGoals();renderSystemDetail()});
 document.querySelectorAll('[data-delete-goal]').forEach(b=>b.onclick=()=>{if(confirm('Delete this goal and its stepping stones?')){state.goals=state.goals.filter(x=>x.id!==b.dataset.deleteGoal);save();renderGoals();renderSystemDetail();renderSystems()}});
 document.querySelectorAll('[data-milestone]').forEach(c=>c.onchange=()=>{const g=state.goals.find(x=>x.id===c.dataset.milestone),m=g.milestones.find(x=>x.id===c.dataset.mid);m.done=c.checked;save();renderGoals();if(document.getElementById('systemDetail').classList.contains('active-view'))renderSystemDetail()});
 document.querySelectorAll('[data-add-milestone]').forEach(b=>b.onclick=()=>{const text=prompt('What stepping stone will move this goal forward?');if(text?.trim()){state.goals.find(x=>x.id===b.dataset.addMilestone).milestones.push({id:uid(),text:text.trim(),done:false});save();renderGoals();if(document.getElementById('systemDetail').classList.contains('active-view'))renderSystemDetail()}});
 document.querySelectorAll('[data-add-goal-timeline]').forEach(b=>b.onclick=()=>{const title=prompt('Timeline step or milestone:');if(!title?.trim())return;const date=prompt('Target date (YYYY-MM-DD), or leave blank:','')||'';const note=prompt('Optional note:','')||'';state.goals.find(x=>x.id===b.dataset.addGoalTimeline).timeline.push({id:uid(),title:title.trim(),date,note});save();renderGoals();if(document.getElementById('systemDetail').classList.contains('active-view'))renderSystemDetail()});
}
function renderGoals(){
 populateGoalSelectors();const system=goalSystemFilter.value||'all',status=goalStatusFilter.value||'all',sort=goalSort.value||'target';let goals=[...state.goals].filter(g=>(system==='all'||g.system===system)&&(status==='all'||g.status===status));
 goals.sort((a,b)=>sort==='progress'?goalProgress(b)-goalProgress(a):sort==='system'?systemMeta(a.system).name.localeCompare(systemMeta(b.system).name):sort==='created'?(b.createdAt||'').localeCompare(a.createdAt||''):(a.target||'9999').localeCompare(b.target||'9999'));
 const active=state.goals.filter(g=>g.status==='active').length,complete=state.goals.filter(g=>g.status==='complete').length,avg=state.goals.length?Math.round(state.goals.reduce((n,g)=>n+goalProgress(g),0)/state.goals.length):0;
 goalSummary.innerHTML=`<article class="metric"><span>Total goals</span><strong>${state.goals.length}</strong><small>across all systems</small></article><article class="metric"><span>Active</span><strong>${active}</strong><small>currently moving</small></article><article class="metric"><span>Completed</span><strong>${complete}</strong><small>wins achieved</small></article><article class="metric"><span>Overall progress</span><strong>${avg}%</strong><small>milestone completion</small></article>`;
 masterGoalList.innerHTML=goals.length?goals.map(goalCardHTML).join(''):'<article class="card empty-state"><h3>No goals match these filters</h3><p>Create a goal or change the filters to see more.</p></article>';wireGoalActions();
}
function renderSystemDetail(){
 const s=systemMeta(activeSystemId),data=state.systemData[activeSystemId];pageTitle.textContent=s.name;
 systemDetailHero.className=`card system-detail-hero ${s.className}`;systemDetailHero.innerHTML=`<span class="system-icon-large">${s.icon}</span><div><span class="pill">LIFE SYSTEM</span><h2>${esc(s.name)}</h2><p>${esc(s.description)}</p></div><div class="system-score"><strong>${state.goals.filter(g=>g.system===s.id&&g.status==='active').length}</strong><span>active goals</span></div>`;
 systemVision.value=data.vision||'';systemTimelineList.innerHTML=data.timeline.length?data.timeline.map(t=>`<div class="timeline-item"><div class="timeline-time">${esc(t.date||'Anytime')}</div><div class="timeline-track"></div><div class="timeline-content"><strong>${esc(t.title)}</strong><small>${esc(t.note||'')}</small></div></div>`).join(''):'<p class="muted">No system timeline entries yet.</p>';
 const goals=state.goals.filter(g=>g.system===s.id);systemGoalList.innerHTML=goals.length?goals.map(goalCardHTML).join(''):'<div class="empty-state"><h3>No goals yet</h3><p>Create the first meaningful goal for this life system.</p></div>';wireGoalActions();
}
addMasterGoal.onclick=()=>openGoalDialog(SYSTEMS[0].id);addSystemGoal.onclick=()=>openGoalDialog(activeSystemId);backToSystems.onclick=()=>show('systems');
goalSystemFilter.onchange=renderGoals;goalStatusFilter.onchange=renderGoals;goalSort.onchange=renderGoals;
systemVision.oninput=e=>{state.systemData[activeSystemId].vision=e.target.value;save()};
addSystemTimeline.onclick=()=>{const title=prompt('What system milestone or event should be added?');if(!title?.trim())return;const date=prompt('Target date (YYYY-MM-DD), or leave blank:','')||'';const note=prompt('Optional note:','')||'';state.systemData[activeSystemId].timeline.push({id:uid(),title:title.trim(),date,note});save();renderSystemDetail()};

saveReview.onclick=()=>{const week=selectedDate.slice(0,7);state.reviews[week]={wins:reviewWins.value,friction:reviewFriction.value,lessons:reviewLessons.value,focus:reviewFocus.value};save();alert('Weekly review saved.')};
exportBackup.onclick=()=>download(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),'daniel-os-backup.json');
importBackup.onchange=async e=>{try{state=JSON.parse(await e.target.files[0].text());save();location.reload()}catch{alert('That backup file could not be read.')}};
resetApp.onclick=()=>{if(confirm('Delete all Daniel OS data stored in this browser?')){localStorage.removeItem(KEY);location.reload()}};

window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;installBtn.classList.remove('hidden')});
installBtn.onclick=async()=>{if(deferredPrompt){deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;installBtn.classList.add('hidden')}};


document.querySelectorAll('.calendar-mode').forEach(b=>b.onclick=()=>{visualCalendarMode=b.dataset.calendarMode;renderVisualCalendar()});
const visualCalendarDateInput=document.getElementById('visualCalendarDate');
visualCalendarDateInput.onchange=e=>{visualCalendarDate=e.target.value;renderVisualCalendar()};
calendarToday.onclick=()=>{visualCalendarDate=localDateKey(new Date());renderVisualCalendar()};
calendarPrev.onclick=()=>{visualCalendarDate=visualCalendarMode==='day'?dateAdd(visualCalendarDate,-1):visualCalendarMode==='week'?dateAdd(visualCalendarDate,-7):dateAdd(monthStart(visualCalendarDate),-1);renderVisualCalendar()};
calendarNext.onclick=()=>{if(visualCalendarMode==='day')visualCalendarDate=dateAdd(visualCalendarDate,1);else if(visualCalendarMode==='week')visualCalendarDate=dateAdd(visualCalendarDate,7);else{const d=new Date(monthStart(visualCalendarDate)+'T12:00:00');d.setMonth(d.getMonth()+1);visualCalendarDate=localDateKey(d)}renderVisualCalendar()};
calendarDensity.onchange=renderVisualCalendar;showWeekends.onchange=renderVisualCalendar;visualShowAll.onclick=()=>{CALENDARS.forEach(c=>state.calendarVisibility[c.name]=true);save();renderVisualCalendar();renderCalendar();renderHome()};

document.getElementById('todayLabel').textContent=displayDate(selectedDate);
populateGoalSelectors();renderHome();renderSystems();
