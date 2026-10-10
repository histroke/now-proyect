// Páginas del menú y sus temas (edítalos a tu gusto)
const PAGES = {
  ingles:   {name:'Inglés',    sub:'English corner: grammar, vocabulary and pronunciation.', topics:['Gramática','Vocabulario','Pronunciación']},
  espanol:  {name:'Español',   sub:'Rincón del español: gramática, vocabulario y cultura.',  topics:['Gramática','Vocabulario','Cultura']},
  comunidad:{name:'Comunidad', sub:'Preguntas, recursos y eventos de nuestra comunidad.',    topics:['Preguntas','Recursos','Eventos']}
};

const KEY = 'linguabridge-posts-v1';
let posts = [], state = {page:'ingles', topic:null};

// Cargar publicaciones guardadas (o crear ejemplos la primera vez)
function load(){
  try{ posts = JSON.parse(localStorage.getItem(KEY)) || []; }catch(e){ posts = []; }
  if(!posts.length){
    posts = [
      {id:1,page:'ingles',topic:'Gramática',name:'Equipo',title:'Present Simple vs Present Continuous',text:'Usa el Present Simple para hábitos ("I work every day") y el Present Continuous para acciones en este momento ("I am working now").',img:'',date:Date.now(),comments:[]},
      {id:2,page:'espanol',topic:'Vocabulario',name:'Equipo',title:'Ser vs Estar',text:'Ser describe identidad y características; estar indica estado o ubicación. Ejemplo: "Soy alto" / "Estoy cansado".',img:'',date:Date.now(),comments:[]},
      {id:3,page:'comunidad',topic:'Eventos',name:'Equipo',title:'¡Bienvenidos! / Welcome!',text:'Comparte tus dudas y recursos. Share your questions and resources here.',img:'',date:Date.now(),comments:[]}
    ];
  }
}

function save(){
  try{ localStorage.setItem(KEY, JSON.stringify(posts)); }
  catch(e){ alert('No se pudo guardar (imagen muy grande o almacenamiento lleno).'); }
}

// Ayudante para crear elementos de forma segura (evita inyección de HTML)
function el(tag, attrs={}, ...kids){
  const n = document.createElement(tag);
  for(const k in attrs){
    k==='class' ? n.className=attrs[k]
    : k.startsWith('on') ? n.addEventListener(k.slice(2),attrs[k])
    : n.setAttribute(k,attrs[k]);
  }
  kids.forEach(c => n.append(c));
  return n;
}

// Cambiar de página/tema
function go(page, topic=null){
  state = {page, topic};
  document.querySelectorAll('.dd').forEach(d=>d.classList.remove('open'));
  render();
  window.scrollTo({top:0,behavior:'smooth'});
}

// Menú superior con desplegables
function renderNav(){
  const nav = document.getElementById('nav'); nav.innerHTML='';
  for(const id in PAGES){
    const p = PAGES[id];
    const btn = el('button',{class: state.page===id?'active':'', onclick:e=>{
      const dd = e.currentTarget.parentElement, was = dd.classList.contains('open');
      document.querySelectorAll('.dd').forEach(d=>d.classList.remove('open'));
      if(!was) dd.classList.add('open');
    }}, p.name+' ▾');
    const menu = el('div',{class:'menu'}, el('button',{onclick:()=>go(id)},'Ver todo'));
    p.topics.forEach(t => menu.append(el('button',{onclick:()=>go(id,t)},t)));
    nav.append(el('div',{class:'dd'},btn,menu));
  }
}

// Filtros por tema y selector del formulario
function renderChips(){
  const c = document.getElementById('chips'); c.innerHTML='';
  const p = PAGES[state.page];
  c.append(el('button',{class:'chip'+(!state.topic?' on':''),onclick:()=>go(state.page)},'Todo'));
  p.topics.forEach(t => c.append(el('button',{class:'chip'+(state.topic===t?' on':''),onclick:()=>go(state.page,t)},t)));
  const sel = document.getElementById('fTopic'); sel.innerHTML='';
  p.topics.forEach(t => sel.append(el('option',{value:t},t)));
  if(state.topic) sel.value = state.topic;
}

// Lista de publicaciones con comentarios
function renderPosts(){
  const list = document.getElementById('list'); list.innerHTML='';
  const items = posts
    .filter(p => p.page===state.page && (!state.topic || p.topic===state.topic))
    .sort((a,b) => b.date - a.date);

  if(!items.length){
    list.append(el('div',{class:'empty'},'Aún no hay publicaciones. ¡Sé el primero! / No posts yet.'));
    return;
  }

  items.forEach(p => {
    const card = el('article',{class:'card post'},
      el('div',{class:'meta'}, el('span',{class:'tag'},p.topic), `${p.name} · ${new Date(p.date).toLocaleDateString()}`),
      el('h3',{},p.title));
    if(p.img) card.append(el('img',{src:p.img,alt:p.title}));
    card.append(el('p',{},p.text));
    card.append(el('button',{class:'btn ghost',onclick:()=>{
      if(confirm('¿Eliminar publicación?')){ posts = posts.filter(x=>x.id!==p.id); save(); render(); }
    }},'Eliminar'));

    const cm = el('div',{class:'comments'}, el('b',{},`💬 Comentarios (${p.comments.length})`));
    p.comments.forEach(c => cm.append(el('div',{class:'comment'}, el('b',{},c.name+': '), c.text)));

    const n = el('input',{placeholder:'Nombre',maxlength:'40'});
    const t = el('input',{placeholder:'Escribe un comentario…',maxlength:'500'});
    const add = () => {
      if(!n.value.trim() || !t.value.trim()) return;
      p.comments.push({name:n.value.trim(), text:t.value.trim()});
      save(); render();
    };
    t.addEventListener('keydown', e => { if(e.key==='Enter') add(); });
    cm.append(el('div',{class:'crow'}, n, t, el('button',{class:'btn',onclick:add},'Enviar')));

    card.append(cm);
    list.append(card);
  });
}

function render(){
  const p = PAGES[state.page];
  document.getElementById('title').textContent = p.name + (state.topic ? ' · '+state.topic : '');
  document.getElementById('sub').textContent = p.sub;
  renderNav(); renderChips(); renderPosts();
}

// Publicar una nueva entrada (con imagen opcional de máx. 500 KB)
document.getElementById('form').addEventListener('submit', e => {
  e.preventDefault();
  const file = document.getElementById('fImg').files[0];
  const finish = img => {
    posts.push({
      id:Date.now(), page:state.page, topic:fTopic.value,
      name:fName.value.trim(), title:fTitle.value.trim(), text:fText.value.trim(),
      img, date:Date.now(), comments:[]
    });
    save(); e.target.reset();
    document.getElementById('formWrap').open = false;
    render();
  };
  if(file){
    if(file.size > 500*1024){ alert('La imagen debe pesar menos de 500 KB.'); return; }
    const r = new FileReader();
    r.onload = () => finish(r.result);
    r.readAsDataURL(file);
  } else finish('');
});

// Cerrar menús al hacer clic fuera
document.addEventListener('click', e => {
  if(!e.target.closest('.dd')) document.querySelectorAll('.dd').forEach(d=>d.classList.remove('open'));
});

load();
render();