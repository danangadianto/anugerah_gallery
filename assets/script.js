const DATA_PATH = './data.json';
const BATCH = 60;

async function loadData(){
  try{
    const r = await fetch(DATA_PATH);
    return await r.json();
  }catch(e){
    console.error('Gagal memuat data.json',e);
    return {years:[]};
  }
}

function el(tag,cls){const n=document.createElement(tag);if(cls)n.className=cls;return n}

function renderCatalog(data){
  const catalog = document.getElementById('catalog');
  catalog.innerHTML='';
  data.years.forEach(y=>{
    const sec = el('section','year-section');
    const h = el('h2'); h.textContent = y.year; sec.appendChild(h);
    const grid = el('div','events');
    y.events.forEach(ev=>{
      const card = el('div','card');
      const thumb = el('img','thumb');
      thumb.loading='lazy';
      thumb.src = ev.thumb || (ev.photos && ev.photos[0]) || '';
      thumb.alt = ev.title || ev.name;
      const title = el('div','title'); title.textContent = ev.title||ev.name;
      const sub = el('div','sub'); sub.textContent = ev.photos? (ev.photos.length+' foto') : '0 foto';
      card.appendChild(thumb); card.appendChild(title); card.appendChild(sub);
      card.addEventListener('click',()=>openGallery(ev, y.year));
      grid.appendChild(card);
    });
    sec.appendChild(grid); catalog.appendChild(sec);
  })
}

let currentPhotos = []; let currentIndex = 0; let shown = 0; let observer = null; let zoomLevel = 1; let dragMode = false; let dragStartX = 0; let dragStartY = 0; let offsetX = 0; let offsetY = 0; let clickTimer = null; let clickTriggered = false;
function openGallery(ev, year){
  currentPhotos = ev.photos || [];
  currentIndex = 0; shown = 0;
  document.getElementById('catalog').classList.add('hidden');
  const gv = document.getElementById('gallery-view'); gv.classList.remove('hidden');
  document.getElementById('gallery-title').textContent = `${year} — ${ev.title||ev.name}`;
  renderPhotosBatch();
}

function renderPhotosBatch(){
  const grid = document.getElementById('photos-grid');
  const next = currentPhotos.slice(shown, shown + BATCH);
  next.forEach((p,i)=>{
    const f = el('div','photo');
    const img = el('img'); img.loading='lazy'; img.src=p; img.alt='';
    const idx = shown + i; // capture absolute index so click opens correct image later
    img.addEventListener('click',()=>openLightbox(idx));
    f.appendChild(img); grid.appendChild(f);
  })
  shown += next.length;
  // remove old sentinel
  const old = document.getElementById('scroll-sentinel'); if(old) old.remove();
  // if more photos available, add sentinel to trigger next batch
  if(shown < currentPhotos.length){
    const sentinel = el('div'); sentinel.id = 'scroll-sentinel'; sentinel.style.width = '100%'; sentinel.style.height = '1px';
    grid.appendChild(sentinel);
    ensureObserver(sentinel);
  } else {
    // no more photos: disconnect observer
    if(observer){ observer.disconnect(); observer = null; }
  }
}

function ensureObserver(target){
  if(!('IntersectionObserver' in window)) return; // fallback: user can still click images
  if(observer) observer.disconnect();
  observer = new IntersectionObserver((entries)=>{
    entries.forEach(en=>{
      if(en.isIntersecting){
        // small timeout to avoid rapid-fire
        setTimeout(()=>{ if(shown < currentPhotos.length) renderPhotosBatch(); }, 100);
      }
    })
  },{root:null,rootMargin:'200px',threshold:0});
  observer.observe(target);
}

function closeGallery(){
  document.getElementById('photos-grid').innerHTML='';
  document.getElementById('catalog').classList.remove('hidden');
  document.getElementById('gallery-view').classList.add('hidden');
}

/* Lightbox */
function openLightbox(idx){ currentIndex = idx; showLightbox(); }
function updateLightboxZoom(){
  const img = document.getElementById('lb-img');
  img.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${zoomLevel})`;
  img.style.cursor = zoomLevel > 1 ? (dragMode ? 'grabbing' : 'grab') : 'zoom-in';
}
function resetLightboxZoom(){
  zoomLevel = 1;
  offsetX = 0;
  offsetY = 0;
  dragMode = false;
  updateLightboxZoom();
}
function showLightbox(){
  const lb = document.getElementById('lightbox'); lb.classList.remove('hidden'); lb.setAttribute('aria-hidden','false');
  const img = document.getElementById('lb-img'); img.src = currentPhotos[currentIndex];
  document.getElementById('lb-caption').textContent = `${currentIndex+1} / ${currentPhotos.length}`;
  const dl = document.getElementById('lb-download'); dl.href = currentPhotos[currentIndex]; dl.setAttribute('download','');
  resetLightboxZoom();
}
function hideLightbox(){
  const lb = document.getElementById('lightbox'); lb.classList.add('hidden'); lb.setAttribute('aria-hidden','true');
  resetLightboxZoom();
}
function prevLight(){ if(currentIndex>0){currentIndex--; showLightbox()} }
function nextLight(){ if(currentIndex<currentPhotos.length-1){currentIndex++; showLightbox()} }
function handleLightboxWheel(event){
  if(window.innerWidth < 1024) return;
  if(document.getElementById('lightbox').classList.contains('hidden')) return;
  event.preventDefault();
  const delta = event.deltaY < 0 ? 0.1 : -0.1;
  zoomLevel = Math.min(3, Math.max(1, zoomLevel + delta));
  if(zoomLevel === 1){ offsetX = 0; offsetY = 0; }
  updateLightboxZoom();
}
function startDrag(event){
  if(event.button !== 0) return;
  clickTriggered = false;
  if(clickTimer) clearTimeout(clickTimer);
  clickTimer = setTimeout(()=>{
    clickTriggered = true;
  }, 180);
  dragMode = true;
  dragStartX = event.clientX - offsetX;
  dragStartY = event.clientY - offsetY;
  event.preventDefault();
  updateLightboxZoom();
}
function onDrag(event){
  if(!dragMode) return;
  offsetX = event.clientX - dragStartX;
  offsetY = event.clientY - dragStartY;
  updateLightboxZoom();
}
function endDrag(event){
  if(!dragMode) return;
  if(event && event.button !== undefined && event.button !== 0) return;
  dragMode = false;
  if(clickTimer) clearTimeout(clickTimer);
  if(!clickTriggered){
    if(zoomLevel <= 1){
      zoomLevel = 1.8;
    } else {
      zoomLevel = 1;
      offsetX = 0;
      offsetY = 0;
    }
    updateLightboxZoom();
  }
  updateLightboxZoom();
}

document.addEventListener('DOMContentLoaded',async()=>{
  const data = await loadData(); renderCatalog(data);
  const img = document.getElementById('lb-img');
  document.getElementById('back-btn').addEventListener('click',closeGallery);
  document.getElementById('lb-close').addEventListener('click',hideLightbox);
  document.getElementById('lb-prev').addEventListener('click',()=>{prevLight()});
  document.getElementById('lb-next').addEventListener('click',()=>{nextLight()});
  img.addEventListener('wheel',handleLightboxWheel,{passive:false});
  img.addEventListener('mousedown',startDrag);
  window.addEventListener('mousemove',onDrag);
  window.addEventListener('mouseup',endDrag);
  window.addEventListener('mouseleave',endDrag);
  img.addEventListener('dblclick',()=>{
    zoomLevel = zoomLevel > 1 ? 1 : 1.8;
    if(zoomLevel === 1){ offsetX = 0; offsetY = 0; }
    updateLightboxZoom();
  });
  document.addEventListener('keydown',e=>{
    if(document.getElementById('lightbox').classList.contains('hidden')) return;
    if(e.key==='ArrowLeft') prevLight();
    if(e.key==='ArrowRight') nextLight();
    if(e.key==='Escape') hideLightbox();
  })
});
