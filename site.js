const menu = document.querySelector('#menu');
const links = document.querySelector('#links');
const mobileNav = matchMedia('(max-width: 759px)');

function toggleMenu(open) {
  links.inert = mobileNav.matches && !open;
  links.classList.toggle('open', open);
  menu.setAttribute('aria-expanded', String(open));
}
toggleMenu(false);
mobileNav.addListener(() => toggleMenu(false));
menu.addEventListener('click', () => toggleMenu(!links.classList.contains('open')));
links.addEventListener('click', () => toggleMenu(false));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && links.classList.contains('open')) {
    toggleMenu(false);
    menu.focus();
  }
});
document.addEventListener('click', event => {
  if (!event.target.closest('header')) toggleMenu(false);
});


const reduced = matchMedia('(prefers-reduced-motion: reduce)');

const hero = document.querySelector('.opening');
const heroArt = hero.querySelector('.hero-art');
const catalog = document.querySelector('.product-story');
const ensemble = catalog.querySelector('.ensemble');
const journey = document.querySelector('.journey');
const rider = journey.querySelector('.moto');
const road = journey.querySelector('#delivery-road');
const trace = journey.querySelector('.route-trace');
const benchLight = journey.querySelector('.bench-light');
const tripSteps = [...journey.querySelectorAll('figcaption span')];
trace.setAttribute('d', road.getAttribute('d'));
const roadLength = road.getTotalLength();
const clamp = x => Math.min(1, Math.max(0, x));
function ease(p, start, end) {
  const t = clamp((p-start)/(end-start));
  return t*t*(3-2*t);
}

const tripDuration = 4600;
const tripPause = 10000;
let tripTimer = 0;
let elapsed = 0;
let lastFrame = null;
let tripFrame = 0;
let routeVisible = false;
function drawTrip(p) {
  const outbound = ease(p,.09,.43);
  const returning = ease(p,.64,.96);
  const progress = outbound - returning;
  const point = road.getPointAtLength(progress * roadLength);
  const facing = 1 - 2 * ease(p,.53,.62);
  rider.setAttribute('transform', `translate(${point.x} ${point.y}) scale(${facing} 1)`);
  trace.setAttribute('stroke-dashoffset', String(1 - outbound));
  benchLight.setAttribute('opacity', String(.72 * ease(p,.40,.47) * (1-ease(p,.58,.65))));
  const phase = p < .43 ? 0 : p < .64 ? 1 : 2;
  tripSteps.forEach((step,i) => {
    step.classList.toggle('reached',i<=phase);
  });
}
function advanceTrip(now) {
  tripFrame = 0;
  if(lastFrame!==null) elapsed = Math.min(tripDuration,elapsed+now-lastFrame);
  lastFrame=now;
  drawTrip(elapsed/tripDuration);
  if(elapsed<tripDuration) tripFrame=requestAnimationFrame(advanceTrip);
  else syncTrip();
}
function syncTrip(){
  if (!routeVisible || document.hidden || reduced.matches) {
    clearTimeout(tripTimer);
    tripTimer=0;
    cancelAnimationFrame(tripFrame);
    tripFrame=0;
    lastFrame=null;
    return;
  }
  if (elapsed < tripDuration) {
    if (!tripFrame) tripFrame=requestAnimationFrame(advanceTrip);
  } else if (!tripTimer) {
    tripTimer=setTimeout(() => {
      tripTimer=0;
      elapsed=0;
      lastFrame=null;
      syncTrip();
    }, tripPause);
  }
}
// Celulares presentes na lista de atendimento e no formulário publicado.
const names = ['Apple','Samsung','Motorola','Xiaomi','LG'];
const rolls = [...document.querySelectorAll('.slot')];
const brandbar = document.querySelector('.brandbar');
let nextGroup = rolls.length;
let interval = 0, initial = 0, completion = 0;
function finishRoll() {
  for (const slot of rolls) {
    const strip = slot.firstElementChild;
    if (strip.childElementCount > 1) strip.firstElementChild.remove();
    slot.classList.remove('slide');
  }
}
function roll() {
  rolls.forEach((slot, index) => {
    const name = names[(nextGroup + index) % names.length];
    const face = document.createElement('span');
    face.className = 'logo-face';
    const logo = document.createElement('img');
    logo.alt = name;
    logo.src = 'assets/brands/' + name.toLowerCase() + '.svg';
    face.append(logo);
    slot.firstElementChild.append(face);
    slot.classList.add('slide');
  });
  nextGroup = (nextGroup + rolls.length) % names.length;
  completion = setTimeout(finishRoll, 900);
}
const visible=new Set();
let raf=0;
// Move the native scroll position so dragging and keyboard focus still work.
const shelf = document.querySelector('.shelf');
const group = shelf.querySelector('.shelf-group');
const copy = group.cloneNode(true);
copy.setAttribute('aria-hidden','true');
copy.querySelectorAll('a').forEach(link => { link.tabIndex = -1; });
shelf.append(copy);
const lead = copy.cloneNode(true);
shelf.prepend(lead);
// Three identical groups: keep scrollLeft inside the middle one so scrolling loops both ways.
function wrapShelf() {
  const w = group.getBoundingClientRect().width;
  if (w <= 0 || reduced.matches) return false;
  const x = shelf.scrollLeft;
  if (x < w) shelf.scrollLeft = x + w;
  else if (x >= 2*w) shelf.scrollLeft = x - w;
  else return false;
  return true;
}
function centerShelf() {
  const w = group.getBoundingClientRect().width;
  if (w > 0 && !reduced.matches && (shelf.scrollLeft < w || shelf.scrollLeft >= 2*w)) shelf.scrollLeft = w + (shelf.scrollLeft % w);
}

let shelfFrame = 0, shelfLast = 0, shelfPosition = 0;
let shelfTouch = false, shelfHover = false, shelfResume = 0;
function advanceShelf(now) {
  if (reduced.matches || document.hidden) {
    shelfFrame = 0;
    return;
  }
  const width = group.getBoundingClientRect().width;
  if (width > 0 && shelfLast && now > shelfResume) {
    shelfPosition = shelf.scrollLeft + width * Math.min(now-shelfLast,64)/40000;
    shelf.scrollLeft = shelfPosition;
    wrapShelf();
  } else shelfPosition = shelf.scrollLeft;
  shelfLast = now;
  shelfFrame = requestAnimationFrame(advanceShelf);
}
function syncShelf() {
  const run = visible.has(shelf) && !document.hidden && !reduced.matches &&
    !shelfHover && !shelfTouch && !shelf.matches(':focus-within');
  if (run && !shelfFrame) {
    shelfLast = 0;
    shelfFrame = requestAnimationFrame(advanceShelf);
  } else if (!run && shelfFrame) {
    cancelAnimationFrame(shelfFrame);
    shelfFrame = 0;
  }
}
shelf.addEventListener('scroll', wrapShelf, {passive:true});
addEventListener('resize', centerShelf);
addEventListener('load', centerShelf);
centerShelf();
shelf.addEventListener('pointerenter', e => { shelfHover = e.pointerType === 'mouse'; syncShelf(); });
shelf.addEventListener('pointerleave', () => { shelfHover = false; syncShelf(); });
shelf.addEventListener('touchstart', () => { shelfTouch = true; syncShelf(); }, {passive:true});
function releaseShelf() {
  shelfTouch = false;
  shelfResume = performance.now()+1200;
  syncShelf();
}
shelf.addEventListener('touchend', releaseShelf, {passive:true});
shelf.addEventListener('touchcancel', releaseShelf, {passive:true});
shelf.addEventListener('wheel', () => { shelfResume=performance.now()+1200; }, {passive:true});
shelf.addEventListener('focusin', syncShelf);
shelf.addEventListener('focusout', () => queueMicrotask(syncShelf));
function syncPlayback(){
  syncShelf();
  const active=!document.hidden&&!reduced.matches;
  hero.classList.toggle('in-view',active&&visible.has(hero));
  if(active&&visible.has(brandbar)){
    if (!initial && !interval) initial = setTimeout(() => {
      initial = 0;
      roll();
      interval = setInterval(roll, 2500);
    }, 500);
  } else {
    clearTimeout(initial); initial=0;
    clearInterval(interval); interval=0;
    clearTimeout(completion); finishRoll();
  }
}
function paint(){
  raf=0;
  if(document.hidden||reduced.matches)return;
  if(visible.has(hero)){
    const r=hero.getBoundingClientRect(),p=clamp(-r.top/r.height);
    heroArt.style.transform=`perspective(900px) translateY(${p*38}px) rotateY(${-9*p}deg) scale(${1+.10*p})`;
  }
}
function schedule(){
  if(!raf&&visible.size&&!document.hidden&&!reduced.matches)raf=requestAnimationFrame(paint);
}
function configure(){
  if(reduced.matches){
    heroArt.style.removeProperty('transform');
    ensemble.classList.remove('folded');
    drawTrip(1);
  }else{
    drawTrip(elapsed/tripDuration);
  }
  syncTrip();
  syncPlayback(); schedule();
}
if('IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>{
    for(const e of entries) if(e.isIntersecting) visible.add(e.target); else visible.delete(e.target);
    syncPlayback(); schedule();
  });
  [hero,brandbar,shelf].forEach(el=>observer.observe(el));
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',schedule);
  document.addEventListener('visibilitychange',()=>{syncPlayback();schedule()});
  const studioObserver = new IntersectionObserver(entries=>{
    for(const entry of entries){
      if(entry.target===ensemble){
        ensemble.classList.toggle('folded',!entry.isIntersecting && !reduced.matches);
        catalog.parentElement.classList.toggle('show-categories', entry.isIntersecting);
      }else{
        routeVisible=entry.isIntersecting;
        syncTrip();
      }
    }
  },{threshold:.42});
  studioObserver.observe(ensemble);
  studioObserver.observe(journey);
  document.addEventListener('visibilitychange',syncTrip);
  reduced.addListener(configure);
  configure();
}

const stores=document.querySelector('.stores');
const picker=document.querySelector('.store-picker');
const tabs=[...picker.querySelectorAll('button')];
const cards=[...stores.children];
picker.hidden=false;
function selectStore(i){
  tabs.forEach((tab,j)=>tab.setAttribute('aria-pressed',String(i===j)));
  cards.forEach((card,j)=>card.classList.toggle('selected',i===j));
}
tabs.forEach((tab,i)=>tab.addEventListener('click',()=>{
  const offset=cards[i].getBoundingClientRect().left-stores.getBoundingClientRect().left;
  stores.scrollTo({left:stores.scrollLeft+offset,behavior:reduced.matches?'auto':'smooth'});
  selectStore(i);
}));
stores.addEventListener('scroll',()=>{
  const left=stores.getBoundingClientRect().left;
  const offsets=cards.map(card=>Math.abs(card.getBoundingClientRect().left-left));
  selectStore(offsets.indexOf(Math.min(...offsets)));
},{passive:true});
selectStore(0);








