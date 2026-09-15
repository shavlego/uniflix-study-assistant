const STORAGE_KEY='ufsaLectures';
const FAVORITE_COURSES_KEY='ufsaFavoriteCourses';
const LISTS_KEY='ufsaLists';
let all=[];let favorites=[];let lists={};let currentFilter='all';
const $=s=>document.querySelector(s);const $$=s=>Array.from(document.querySelectorAll(s));
const fmt=s=>{s=Number.isFinite(s)?Math.max(0,s):0;const sec=Math.floor(s%60).toString().padStart(2,'0');const min=Math.floor((s/60)%60).toString().padStart(2,'0');const h=Math.floor(s/3600);return h?`${h}:${min}:${sec}`:`${Number(min)}:${sec}`};
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const pct=x=>x.duration>0?Math.min(100,Math.max(0,(x.progress/x.duration)*100)):0;
const date=ts=>ts?new Date(ts).toLocaleString('el-GR'):'—';
const course=x=>x.courseTitle||x.title||'UniFlix';

function load(){chrome.storage.local.get([STORAGE_KEY,FAVORITE_COURSES_KEY,LISTS_KEY],d=>{all=Object.values(d[STORAGE_KEY]||{});favorites=Array.isArray(d[FAVORITE_COURSES_KEY])?d[FAVORITE_COURSES_KEY]:[];lists=d[LISTS_KEY]||{};render()})}
function saveLectures(cb){const obj=Object.fromEntries(all.map(x=>[x.url,x]));chrome.storage.local.set({[STORAGE_KEY]:obj},()=>{cb?.();render()})}
function saveFavorites(cb){chrome.storage.local.set({[FAVORITE_COURSES_KEY]:[...new Set(favorites)]},()=>{cb?.();render()})}
function saveLists(cb){chrome.storage.local.set({[LISTS_KEY]:lists},()=>{cb?.();render()})}
function remove(url){all=all.filter(x=>x.url!==url);for(const l of Object.values(lists))l.lectureUrls=(l.lectureUrls||[]).filter(u=>u!==url);chrome.storage.local.set({[STORAGE_KEY]:Object.fromEntries(all.map(x=>[x.url,x])),[LISTS_KEY]:lists},render)}

function filterArray(){
  const q=$('#search').value.trim().toLowerCase();const sort=$('#sort').value;
  let arr=all.filter(x=>(x.title||'').toLowerCase().includes(q)||(course(x)||'').toLowerCase().includes(q)||(x.url||'').toLowerCase().includes(q));
  if(currentFilter==='favorites')arr=arr.filter(x=>favorites.includes(course(x)));
  if(currentFilter==='sos')arr=arr.filter(x=>x.sos);
  if(currentFilter==='later')arr=arr.filter(x=>x.watchLater);
  if(sort==='recent')arr.sort((a,b)=>(b.lastWatched||0)-(a.lastWatched||0));
  if(sort==='progress')arr.sort((a,b)=>pct(b)-pct(a));
  if(sort==='title')arr.sort((a,b)=>(a.title||'').localeCompare(b.title||'','el'));
  return arr;
}

function render(){
  const totalNotes=all.reduce((s,x)=>s+(x.notes?.length||0),0);const totalBookmarks=all.reduce((s,x)=>s+(x.bookmarks?.length||0),0);const avg=all.length?Math.round(all.reduce((s,x)=>s+pct(x),0)/all.length):0;
  const uniqueCourses=[...new Set(all.map(course))];
  $('#stats').innerHTML=`<div class="stat stat-blue"><span class="stat-icon">▦</span><b>${all.length}</b><small>Διαλέξεις</small></div><div class="stat stat-violet"><span class="stat-icon">◫</span><b>${uniqueCourses.length}</b><small>Μαθήματα</small></div><div class="stat stat-gold"><span class="stat-icon">⚠</span><b>${all.filter(x=>x.sos).length}</b><small>SOS</small></div><div class="stat stat-green"><span class="stat-icon">◷</span><b>${all.filter(x=>x.watchLater).length}</b><small>Για αργότερα</small></div><div class="stat"><span class="stat-icon">✓</span><b>${avg}%</b><small>Μέση πρόοδος</small></div>`;
  $('#countAll').textContent=all.length;$('#countFav').textContent=favorites.length;$('#countSos').textContent=all.filter(x=>x.sos).length;$('#countLater').textContent=all.filter(x=>x.watchLater).length;$('#countLists').textContent=Object.keys(lists).length;
  renderSpotlight();
  if(currentFilter==='lists'){renderListsView();$('#lectures').classList.add('hidden');$('#listsView').classList.remove('hidden')}else{$('#listsView').classList.add('hidden');$('#lectures').classList.remove('hidden');renderLectures(filterArray())}
  const labels={all:['Όλες οι διαλέξεις','Συνέχισε εκεί που σταμάτησες.','Βιβλιοθήκη'],favorites:['Αγαπημένα μαθήματα','Οι διαλέξεις από τα μαθήματα που ξεχώρισες.','♥ Αγαπημένα'],sos:['SOS διαλέξεις','Ό,τι θέλεις να έχεις μπροστά σου πριν την εξεταστική.','⚠ SOS'],later:['Παρακολούθηση αργότερα','Οι διαλέξεις που δεν θέλεις να ξεχάσεις.','◷ Αργότερα'],lists:['Οι λίστες μου','Οργάνωση με τον δικό σου τρόπο.','☷ Λίστες']};
  [$('#sectionTitle').textContent,$('#sectionSubtitle').textContent,$('#viewBadge').textContent]=labels[currentFilter];
}

function renderSpotlight(){
  const favCourses=[...new Set(all.filter(x=>favorites.includes(course(x))).map(course))].slice(0,4);const next=all.filter(x=>x.progress>0&&pct(x)<98).sort((a,b)=>(b.lastWatched||0)-(a.lastWatched||0))[0];
  $('#spotlight').innerHTML=`<article class="spot-card continue-card"><div class="spot-label">ΣΥΝΕΧΙΣΕ ΤΩΡΑ</div>${next?`<h3>${esc(next.title)}</h3><p>${esc(course(next))}</p><div class="spot-progress"><i style="width:${pct(next).toFixed(1)}%"></i></div><div class="spot-foot"><span>${pct(next).toFixed(0)}% · ${fmt(next.progress)} / ${fmt(next.duration)}</span><a href="${esc(next.url)}" target="_blank">▶ Συνέχεια</a></div>`:'<h3>Η επόμενη διάλεξή σου θα εμφανιστεί εδώ</h3><p>Άνοιξε μία διάλεξη στο UniFlix.</p>'}</article><article class="spot-card fav-courses"><div class="spot-label">ΑΓΑΠΗΜΕΝΑ ΜΑΘΗΜΑΤΑ</div>${favCourses.length?favCourses.map(c=>`<button data-course="${esc(c)}"><span>♥</span><b>${esc(c)}</b><small>${all.filter(x=>course(x)===c).length} διαλέξεις</small></button>`).join(''):'<div class="mini-empty">Πάτησε ♥ σε ένα μάθημα από το extension για να το βρεις εδώ.</div>'}</article>`;
  $$('[data-course]').forEach(btn=>btn.addEventListener('click',()=>{$('#search').value=btn.dataset.course;currentFilter='favorites';syncNav();render()}));
}

function renderLectures(arr){
  const host=$('#lectures');host.innerHTML='';if(!arr.length){host.innerHTML='<div class="empty">Δεν βρέθηκαν διαλέξεις σε αυτή την κατηγορία.</div>';return}
  for(const x of arr){const p=pct(x);const card=document.createElement('article');card.className='card';const notes=(x.notes||[]).slice(-3).reverse();const fav=favorites.includes(course(x));const inLists=Object.values(lists).filter(l=>(l.lectureUrls||[]).includes(x.url));
    card.innerHTML=`<div class="card-ribbon">${x.sos?'<span class="ribbon sos">SOS</span>':''}${x.watchLater?'<span class="ribbon later">ΓΙΑ ΑΡΓΟΤΕΡΑ</span>':''}${fav?'<span class="ribbon fav">♥ ΑΓΑΠΗΜΕΝΟ ΜΑΘΗΜΑ</span>':''}</div><div class="card-top"><div><div class="course">${esc(course(x))}</div><div class="title">${esc(x.title||'UniFlix lecture')}</div><div class="meta">Τελευταία προβολή: ${esc(date(x.lastWatched))}</div></div><span class="percent">${p.toFixed(0)}%</span></div><div class="progress"><div class="bar" style="width:${p.toFixed(1)}%"></div></div><div class="progress-row"><span>${fmt(x.progress||0)} / ${fmt(x.duration||0)}</span><span>${x.playbackRate||1}×</span></div><div class="chips"><span>📝 ${(x.notes||[]).length}</span><span>🔖 ${(x.bookmarks||[]).length}</span>${inLists.map(l=>`<span>☷ ${esc(l.name)}</span>`).join('')}</div><div class="actions"><a class="btn primary" href="${esc(x.url)}" target="_blank">▶ Συνέχεια</a><button class="icon-action favToggle" title="Αγαπημένο μάθημα">${fav?'♥':'♡'}</button><button class="icon-action sosToggle" title="SOS">⚠</button><button class="icon-action laterToggle" title="Για αργότερα">◷</button><button class="btn secondary toggle">Σημειώσεις</button><button class="btn danger delete">Διαγραφή</button></div><div class="notes hidden">${notes.length?notes.map(n=>`<div class="note"><span class="time">${fmt(n.time)}</span> — ${esc(n.text)}</div>`).join(''):'<div class="note">Δεν υπάρχουν σημειώσεις.</div>'}</div>`;
    card.querySelector('.toggle').addEventListener('click',()=>card.querySelector('.notes').classList.toggle('hidden'));
    card.querySelector('.delete').addEventListener('click',()=>{if(confirm('Να διαγραφεί η αποθηκευμένη πρόοδος, οι σημειώσεις και τα bookmarks αυτής της διάλεξης;'))remove(x.url)});
    card.querySelector('.favToggle').addEventListener('click',()=>toggleFavorite(course(x)));
    card.querySelector('.sosToggle').addEventListener('click',()=>{x.sos=!x.sos;saveLectures(()=>toast(x.sos?'SOS ενεργό':'SOS αφαιρέθηκε'))});
    card.querySelector('.laterToggle').addEventListener('click',()=>{x.watchLater=!x.watchLater;saveLectures(()=>toast(x.watchLater?'Αποθηκεύτηκε για αργότερα':'Αφαιρέθηκε'))});
    host.appendChild(card);
  }
}

function toggleFavorite(c){favorites=favorites.includes(c)?favorites.filter(x=>x!==c):[...favorites,c];saveFavorites(()=>toast(favorites.includes(c)?'Μπήκε στα αγαπημένα ♥':'Αφαιρέθηκε από τα αγαπημένα'))}

function renderListsView(){
  const host=$('#listsView');const vals=Object.values(lists).sort((a,b)=>(a.name||'').localeCompare(b.name||'','el'));if(!vals.length){host.innerHTML='<div class="empty">Δεν έχεις δημιουργήσει λίστες ακόμη.<br><button id="emptyNewList" class="primary compact">＋ Δημιουργία πρώτης λίστας</button></div>';$('#emptyNewList')?.addEventListener('click',openModal);return}
  host.innerHTML=vals.map(l=>{const items=(l.lectureUrls||[]).map(url=>all.find(x=>x.url===url)).filter(Boolean);return `<article class="list-card"><div class="list-card-head"><div><span class="list-icon">☷</span><div><h3>${esc(l.name)}</h3><p>${items.length} διαλέξεις</p></div></div><button class="delete-list" data-delete-list="${esc(l.id)}">×</button></div><div class="list-items">${items.length?items.slice(0,5).map(x=>`<a href="${esc(x.url)}" target="_blank"><span>${esc(x.title)}</span><b>${pct(x).toFixed(0)}%</b></a>`).join(''):'<div class="mini-empty">Η λίστα είναι άδεια.</div>'}</div></article>`}).join('');
  $$('[data-delete-list]').forEach(btn=>btn.addEventListener('click',()=>{const l=lists[btn.dataset.deleteList];if(l&&confirm(`Να διαγραφεί η λίστα «${l.name}»; Οι διαλέξεις δεν θα διαγραφούν.`)){delete lists[btn.dataset.deleteList];saveLists(()=>toast('Η λίστα διαγράφηκε'))}}));
}

function openModal(){$('#modal').classList.remove('hidden');$('#modalListName').value='';setTimeout(()=>$('#modalListName').focus(),30)}function closeModal(){$('#modal').classList.add('hidden')}
function createList(){const name=$('#modalListName').value.trim();if(!name)return toast('Γράψε όνομα λίστας');if(Object.values(lists).some(x=>x.name.toLowerCase()===name.toLowerCase()))return toast('Υπάρχει ήδη λίστα με αυτό το όνομα');const id=crypto.randomUUID?.()||`list-${Date.now()}`;lists[id]={id,name,lectureUrls:[],createdAt:Date.now()};saveLists(()=>{closeModal();currentFilter='lists';syncNav();toast(`Δημιουργήθηκε «${name}»`)})}
function syncNav(){$$('#filters .nav').forEach(b=>b.classList.toggle('active',b.dataset.filter===currentFilter))}
function toast(msg){const el=document.createElement('div');el.className='toast';el.textContent=msg;$('#toastHost').appendChild(el);setTimeout(()=>el.remove(),2000)}

$$('#filters .nav').forEach(btn=>btn.addEventListener('click',()=>{currentFilter=btn.dataset.filter;syncNav();render()}));
$('#search').addEventListener('input',render);$('#sort').addEventListener('change',render);$('#newList').addEventListener('click',openModal);$('#modalClose').addEventListener('click',closeModal);$('#modal').addEventListener('click',e=>{if(e.target.id==='modal')closeModal()});$('#modalCreate').addEventListener('click',createList);$('#modalListName').addEventListener('keydown',e=>{if(e.key==='Enter')createList()});
$('#export').addEventListener('click',()=>chrome.storage.local.get(null,data=>{const blob=new Blob([JSON.stringify({exportedAt:new Date().toISOString(),data},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='uniflix-study-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Το backup δημιουργήθηκε.')}));
$('#importBtn').addEventListener('click',()=>$('#importFile').click());$('#importFile').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{const parsed=JSON.parse(await file.text());const data=parsed.data||parsed;if(typeof data!=='object'||Array.isArray(data))throw new Error();chrome.storage.local.set(data,()=>{load();toast('Το backup εισήχθη επιτυχώς.');});}catch(_){alert('Το αρχείο δεν φαίνεται να είναι έγκυρο backup.');}e.target.value='';});
load();
