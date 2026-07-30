(() => {
  'use strict';
  const STORAGE_KEY = 'danielOS.v1';
  const CALENDARS = [
    ['Work Schedule','#2f80ed'],['Work','#5b8cff'],['Family','#ff7f9f'],['Personal','#b083ff'],
    ['Leisure','#f4b860'],['Gym','#52d19a'],['Self Care','#57c7d4'],['OTHER','#a8b0c3']
  ];
  let mode = 'month';
  let focusDate = dateKey(new Date());
  let lastSignature = '';

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function readState(){
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {}; }
    catch { return {}; }
  }
  function dateKey(d){
    const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${day}`;
  }
  function parseKey(key){ const d=new Date(`${key}T12:00:00`); return Number.isNaN(d.getTime())?new Date():d; }
  function addDays(key,n){ const d=parseKey(key); d.setDate(d.getDate()+n); return dateKey(d); }
  function monday(key){ const d=parseKey(key); d.setDate(d.getDate()-((d.getDay()+6)%7)); return dateKey(d); }
  function monthFirst(key){ return `${key.slice(0,7)}-01`; }
  function normalizeDate(value){
    if(!value) return '';
    const text=String(value);
    const exact=text.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
    if(exact) return exact;
    const d=new Date(text); return Number.isNaN(d.getTime())?'':dateKey(d);
  }
  function normalizeTime(value){
    if(!value) return '';
    const text=String(value);
    const match=text.match(/(?:T|^)(\d{1,2}):(\d{2})/);
    return match ? `${String(match[1]).padStart(2,'0')}:${match[2]}` : '';
  }
  function normalizedEvents(){
    const state=readState();
    const visibility=state.calendarVisibility || {};
    return (Array.isArray(state.importedEvents)?state.importedEvents:[]).map((e,i)=>({
      id:e.uid || e.id || `event-${i}`,
      date:normalizeDate(e.date || e.startDate || e.start),
      start:normalizeTime(e.startTime || e.start),
      end:normalizeTime(e.endTime || e.end),
      title:e.title || e.summary || 'Untitled event',
      note:e.note || e.description || '',
      location:e.location || '',
      calendar:e.calendar || e.calendarName || 'OTHER',
      allDay:e.allDay === true || (!normalizeTime(e.startTime || e.start) && !normalizeTime(e.endTime || e.end))
    })).filter(e=>e.date && visibility[e.calendar] !== false);
  }
  function meta(name){ const found=CALENDARS.find(x=>x[0]===name)||CALENDARS.at(-1); return {name:found[0],color:found[1]}; }
  function fmtTime(t){ if(!t) return 'All day'; const [h,m]=t.split(':').map(Number); return new Date(2000,0,1,h,m).toLocaleTimeString('en-CA',{hour:'numeric',minute:'2-digit'}); }
  function minutes(t){ if(!t)return 0; const [h,m]=t.split(':').map(Number); return h*60+m; }
  function forDate(key){ return normalizedEvents().filter(e=>e.date===key).sort((a,b)=>Number(b.allDay)-Number(a.allDay)||a.start.localeCompare(b.start)); }
  function eventChip(e, compact=false){
    const m=meta(e.calendar); const time=e.allDay?'All day':`${fmtTime(e.start)}${e.end?`–${fmtTime(e.end)}`:''}`;
    return `<button type="button" class="cv-event ${compact?'cv-event-compact':''}" data-cv-date="${esc(e.date)}" style="--cv-color:${m.color}" title="${esc(`${e.title} · ${time} · ${e.calendar}`)}"><strong>${esc(e.title)}</strong><span>${esc(time)}${compact?'':` · ${esc(e.calendar)}`}</span></button>`;
  }
  function renderFilters(){
    const host=$('visualCalendarFilters'); if(!host)return;
    const state=readState(), visibility=state.calendarVisibility || {};
    host.innerHTML=CALENDARS.map(([name,color])=>`<label class="calendar-filter ${visibility[name]===false?'off':''}" style="--calendar-color:${color}"><input type="checkbox" data-cv-filter="${esc(name)}" ${visibility[name]===false?'':'checked'}><span class="calendar-dot" style="background:${color};color:${color}"></span>${esc(name)}</label>`).join('');
    host.querySelectorAll('[data-cv-filter]').forEach(input=>input.addEventListener('change',()=>{
      const state=readState(); state.calendarVisibility ||= {}; state.calendarVisibility[input.dataset.cvFilter]=input.checked;
      localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); render();
    }));
  }
  function renderDay(canvas,title){
    const events=forDate(focusDate), all=events.filter(e=>e.allDay), timed=events.filter(e=>!e.allDay);
    title.textContent=parseKey(focusDate).toLocaleDateString('en-CA',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
    const firstHour=Math.max(0,Math.min(23,...timed.map(e=>Number(e.start.slice(0,2))||23),7)-1), lastHour=Math.min(24,Math.max(...timed.map(e=>Number(e.end?.slice(0,2)||e.start.slice(0,2))||0),18)+2);
    const hours=Array.from({length:lastHour-firstHour},(_,i)=>i+firstHour);
    canvas.innerHTML=`<div class="cv-shell"><div class="cv-day-summary"><span>${events.length} event${events.length===1?'':'s'}</span><span>${esc(focusDate)}</span></div>${all.length?`<div class="cv-all-day"><b>All day</b><div>${all.map(e=>eventChip(e,true)).join('')}</div></div>`:''}<div class="cv-day-grid"><div class="cv-time-rail">${hours.map(h=>`<div>${fmtTime(`${String(h).padStart(2,'0')}:00`)}</div>`).join('')}</div><div class="cv-day-track" style="--cv-hours:${hours.length}">${hours.map(()=>'<div class="cv-hour-line"></div>').join('')}${timed.map(e=>{const top=Math.max(0,minutes(e.start)-firstHour*60),height=Math.max(34,(e.end?minutes(e.end)-minutes(e.start):60));return `<div class="cv-positioned" style="--cv-top:${top}px;--cv-height:${height}px">${eventChip(e)}</div>`}).join('')}${events.length?'':'<div class="cv-empty"><b>No events</b><span>No visible events are saved for this day.</span></div>'}</div></div></div>`;
  }
  function renderWeek(canvas,title){
    const start=monday(focusDate), showWeekends=$('showWeekends')?.checked!==false;
    let days=Array.from({length:7},(_,i)=>addDays(start,i)); if(!showWeekends)days=days.slice(0,5);
    title.textContent=`${parseKey(days[0]).toLocaleDateString('en-CA',{month:'short',day:'numeric'})} – ${parseKey(days.at(-1)).toLocaleDateString('en-CA',{month:'short',day:'numeric',year:'numeric'})}`;
    canvas.innerHTML=`<div class="cv-shell cv-week-shell"><div class="cv-week-grid" style="--cv-cols:${days.length}">${days.map(d=>{const events=forDate(d),dt=parseKey(d);return `<section class="cv-week-day ${d===dateKey(new Date())?'is-today':''}"><button type="button" class="cv-day-heading" data-cv-date="${d}"><span>${dt.toLocaleDateString('en-CA',{weekday:'short'})}</span><strong>${dt.getDate()}</strong></button><div class="cv-week-events">${events.length?events.map(e=>eventChip(e,true)).join(''):'<span class="cv-no-events">No events</span>'}</div></section>`}).join('')}</div></div>`;
  }
  function renderMonth(canvas,title){
    const first=parseKey(monthFirst(focusDate)), month=first.getMonth(), showWeekends=$('showWeekends')?.checked!==false;
    title.textContent=first.toLocaleDateString('en-CA',{month:'long',year:'numeric'});
    const gridStart=new Date(first); gridStart.setDate(first.getDate()-((first.getDay()+6)%7));
    let days=Array.from({length:42},(_,i)=>{const d=new Date(gridStart);d.setDate(gridStart.getDate()+i);return dateKey(d)});
    let labels=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    if(!showWeekends){days=days.filter(d=>![0,6].includes(parseKey(d).getDay()));labels=labels.slice(0,5)}
    canvas.innerHTML=`<div class="cv-shell cv-month-shell"><div class="cv-month-grid" style="--cv-cols:${labels.length}">${labels.map(x=>`<div class="cv-weekday">${x}</div>`).join('')}${days.map(d=>{const dt=parseKey(d),events=forDate(d);return `<button type="button" class="cv-month-day ${dt.getMonth()!==month?'outside':''} ${d===dateKey(new Date())?'is-today':''}" data-cv-date="${d}"><span class="cv-date-number">${dt.getDate()}</span><div class="cv-month-events">${events.slice(0,3).map(e=>eventChip(e,true)).join('')}${events.length>3?`<span class="cv-more">+${events.length-3} more</span>`:''}</div></button>`}).join('')}</div></div>`;
  }
  function wireCanvas(canvas){
    canvas.querySelectorAll('[data-cv-date]').forEach(el=>el.addEventListener('click',(ev)=>{ev.stopPropagation();focusDate=el.dataset.cvDate;mode='day';render()}));
  }
  function render(){
    const canvas=$('visualCalendarCanvas'), title=$('visualCalendarTitle'), dateInput=$('visualCalendarDate'); if(!canvas||!title)return;
    if(dateInput)dateInput.value=focusDate;
    document.querySelectorAll('.calendar-mode').forEach(b=>b.classList.toggle('active',b.dataset.calendarMode===mode));
    renderFilters();
    if(mode==='day')renderDay(canvas,title); else if(mode==='week')renderWeek(canvas,title); else renderMonth(canvas,title);
    wireCanvas(canvas);
    lastSignature=JSON.stringify(normalizedEvents().map(e=>[e.id,e.date,e.start,e.title]));
  }
  function shift(n){
    if(mode==='day')focusDate=addDays(focusDate,n);
    else if(mode==='week')focusDate=addDays(focusDate,n*7);
    else {const d=parseKey(monthFirst(focusDate));d.setMonth(d.getMonth()+n);focusDate=dateKey(d)}
    render();
  }
  function init(){
    document.querySelectorAll('.calendar-mode').forEach(btn=>btn.addEventListener('click',(e)=>{e.preventDefault();mode=btn.dataset.calendarMode||'month';render()}));
    $('calendarPrev')?.addEventListener('click',(e)=>{e.preventDefault();shift(-1)});
    $('calendarNext')?.addEventListener('click',(e)=>{e.preventDefault();shift(1)});
    $('calendarToday')?.addEventListener('click',(e)=>{e.preventDefault();focusDate=dateKey(new Date());render()});
    $('visualCalendarDate')?.addEventListener('change',(e)=>{if(e.target.value){focusDate=e.target.value;render()}});
    $('showWeekends')?.addEventListener('change',render);
    $('visualShowAll')?.addEventListener('click',(e)=>{e.preventDefault();const state=readState();state.calendarVisibility ||= {};CALENDARS.forEach(([n])=>state.calendarVisibility[n]=true);localStorage.setItem(STORAGE_KEY,JSON.stringify(state));render()});
    document.querySelector('[data-view="visualCalendar"]')?.addEventListener('click',()=>setTimeout(render,0));
    const section=$('visualCalendar'); if(section)new MutationObserver(()=>{if(section.classList.contains('active-view')||section.classList.contains('active'))render()}).observe(section,{attributes:true,attributeFilter:['class']});
    window.addEventListener('storage',render);
    setInterval(()=>{const sig=JSON.stringify(normalizedEvents().map(e=>[e.id,e.date,e.start,e.title]));if(sig!==lastSignature&&($('visualCalendar')?.classList.contains('active-view')||$('visualCalendar')?.classList.contains('active')))render()},1500);
    render();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
