'use strict';

const PHOTO_DATA = [
  {id:'hero',caption:'Лучшее место — вместе',category:'outdoors',categoryLabel:'На природе',width:1536,height:1024},
  {id:'autumn',caption:'По дороге к счастью',category:'outdoors',categoryLabel:'На природе',width:1536,height:1024},
  {id:'picnic',caption:'Выходной без спешки',category:'outdoors',categoryLabel:'На природе',width:1536,height:1024},
  {id:'kitchen',caption:'Утро начинается с нас',category:'home',categoryLabel:'Дома',width:1536,height:1024},
  {id:'beach',caption:'Море. Ветер. Мы.',category:'travel',categoryLabel:'Путешествия',width:1536,height:1024},
  {id:'winter',caption:'Наш самый тёплый праздник',category:'home',categoryLabel:'Дома',width:1536,height:1024},
  {id:'camping',caption:'Ещё одно маленькое приключение',category:'outdoors',categoryLabel:'На природе',width:1536,height:1024},
  {id:'reading',caption:'Дождь снаружи, уют внутри',category:'home',categoryLabel:'Дома',width:1536,height:1024},
  {id:'father',caption:'Александр — главный по приключениям',category:'people',categoryLabel:'Наша команда',width:1086,height:1448},
  {id:'mother',caption:'Мария — хранительница тепла',category:'people',categoryLabel:'Наша команда',width:1086,height:1448},
  {id:'older',caption:'Алиса — генератор идей',category:'people',categoryLabel:'Наша команда',width:1086,height:1448},
  {id:'younger',caption:'София — солнечный человек',category:'people',categoryLabel:'Наша команда',width:1086,height:1448}
];
const byId = new Map(PHOTO_DATA.map(photo => [photo.id,photo]));
const photoSrc = id => 'assets/photos/' + id + '.webp';
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

if ('IntersectionObserver' in window && !motionQuery.matches) {
  document.documentElement.classList.add('js-motion');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {threshold:0.06});
  document.querySelectorAll('.reveal').forEach(item => observer.observe(item));
  motionQuery.addEventListener('change', event => {
    if (event.matches) document.documentElement.classList.remove('js-motion');
  });
}

const navigation = document.querySelector('#navigation');
const menuToggle = document.querySelector('.menu-toggle');
function closeMenu() {
  navigation.classList.remove('is-open');
  menuToggle.setAttribute('aria-expanded','false');
  menuToggle.setAttribute('aria-label','Открыть меню');
}
menuToggle.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') !== 'true';
  navigation.classList.toggle('is-open',open);
  menuToggle.setAttribute('aria-expanded',String(open));
  menuToggle.setAttribute('aria-label',open ? 'Закрыть меню' : 'Открыть меню');
});
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click',closeMenu));
window.matchMedia('(min-width: 761px)').addEventListener('change', event => {
  if (event.matches) closeMenu();
});
if ('IntersectionObserver' in window) {
  const links = [...navigation.querySelectorAll('a')];
  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      links.forEach(link => {
        if (link.hash === '#' + entry.target.id) link.setAttribute('aria-current','location');
        else link.removeAttribute('aria-current');
      });
    });
  }, {rootMargin:'-20% 0px -60% 0px',threshold:0});
  links.forEach(link => sectionObserver.observe(document.querySelector(link.hash)));
}

const galleryGrid = document.querySelector('#galleryGrid');
const galleryCounter = document.querySelector('#galleryCounter');
let currentFilter = 'all';
function visiblePhotos() {return PHOTO_DATA.filter(photo => currentFilter === 'all' || photo.category === currentFilter);}
function photoPlural(count) {
  const mod100 = count % 100, mod10 = count % 10;
  return mod100 >= 11 && mod100 <= 14 ? 'кадров' : mod10 === 1 ? 'кадр' : mod10 >= 2 && mod10 <= 4 ? 'кадра' : 'кадров';
}
function renderGallery() {
  const photos = visiblePhotos();
  galleryGrid.replaceChildren();
  photos.forEach((photo,index) => {
    const button = document.createElement('button');
    button.className = 'gallery-item';
    button.type = 'button';
    button.dataset.photo = photo.id;
    button.dataset.category = photo.category;
    button.setAttribute('aria-label','Открыть фото: ' + photo.caption);
    button.style.setProperty('--delay',Math.min(index,5)*35 + 'ms');
    const imageWrap = document.createElement('span');
    imageWrap.className = 'gallery-item-image';
    const image = document.createElement('img');
    image.src = photoSrc(photo.id);
    image.alt = photo.caption + '. Сгенерированная фотография.';
    image.width = photo.width;
    image.height = photo.height;
    image.loading = 'lazy';
    const arrow = document.createElement('span');
    arrow.className = 'photo-expand';
    arrow.textContent = '↗';
    arrow.setAttribute('aria-hidden','true');
    imageWrap.append(image,arrow);
    const caption = document.createElement('span');
    caption.className = 'gallery-item-caption';
    const title = document.createElement('span');
    title.textContent = photo.caption;
    const category = document.createElement('small');
    category.textContent = photo.categoryLabel;
    caption.append(title,category);
    button.append(imageWrap,caption);
    button.addEventListener('click',() => openLightbox(photo.id,photos.map(item => item.id),button));
    galleryGrid.append(button);
  });
  galleryCounter.textContent = photos.length + ' ' + photoPlural(photos.length);
}
document.querySelectorAll('[data-filter]').forEach(button => {
  button.addEventListener('click',() => {
    currentFilter = button.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach(filter => {
      const active = filter === button;
      filter.classList.toggle('active',active);
      filter.setAttribute('aria-pressed',String(active));
    });
    renderGallery();
  });
});
document.querySelector('#photoCount').textContent = PHOTO_DATA.length;

const lightbox = document.querySelector('#lightbox');
const lightboxImage = document.querySelector('#lightboxImage');
const previousButton = document.querySelector('#lightboxPrev');
const nextButton = document.querySelector('#lightboxNext');
let lightboxIds = PHOTO_DATA.map(photo => photo.id);
let lightboxIndex = 0;
let lightboxTrigger = null;
function renderLightbox() {
  const photo = byId.get(lightboxIds[lightboxIndex]);
  if (!photo) return;
  lightboxImage.src = photoSrc(photo.id);
  lightboxImage.alt = photo.caption + '. Сгенерированная фотография.';
  lightboxImage.width = photo.width;
  lightboxImage.height = photo.height;
  document.querySelector('#lightboxCaption').textContent = photo.caption;
  document.querySelector('#lightboxCategory').textContent = photo.categoryLabel + ' · Фотография создана ИИ';
  document.querySelector('#lightboxCounter').textContent = String(lightboxIndex+1).padStart(2,'0') + ' / ' + String(lightboxIds.length).padStart(2,'0');
  previousButton.disabled = nextButton.disabled = lightboxIds.length < 2;
}
function openLightbox(id,ids = PHOTO_DATA.map(photo => photo.id),trigger = document.activeElement) {
  if (!byId.has(id)) return;
  const validIds = ids.filter(key => byId.has(key));
  if (!validIds.includes(id)) return;
  lightboxIds = validIds;
  lightboxIndex = lightboxIds.indexOf(id);
  lightboxTrigger = trigger;
  renderLightbox();
  closeMenu();
  lightbox.showModal();
  document.body.classList.add('dialog-open');
  document.querySelector('#lightboxClose').focus();
}
function stepLightbox(direction) {
  if (lightboxIds.length < 2) return;
  lightboxIndex = (lightboxIndex + direction + lightboxIds.length) % lightboxIds.length;
  renderLightbox();
}
document.querySelectorAll('.photo-card[data-photo]').forEach(button => {
  button.addEventListener('click',() => openLightbox(button.dataset.photo,PHOTO_DATA.map(photo => photo.id),button));
});
previousButton.addEventListener('click',() => stepLightbox(-1));
nextButton.addEventListener('click',() => stepLightbox(1));
document.querySelector('#lightboxClose').addEventListener('click',() => lightbox.close());
lightbox.addEventListener('close',() => {
  document.body.classList.remove('dialog-open');
  if (lightboxTrigger && document.contains(lightboxTrigger)) lightboxTrigger.focus();
});
lightbox.addEventListener('click',event => {
  const bounds = lightbox.getBoundingClientRect();
  if (event.target === lightbox && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) lightbox.close();
});
document.addEventListener('keydown',event => {
  if (lightbox.open) {
    if (event.key === 'ArrowLeft') {event.preventDefault();stepLightbox(-1);}
    if (event.key === 'ArrowRight') {event.preventDefault();stepLightbox(1);}
    if (event.key === 'Escape') {event.preventDefault();lightbox.close();}
  } else if (event.key === 'Escape' && navigation.classList.contains('is-open')) {
    closeMenu();menuToggle.focus();
  }
});
let touchStart = null;
const lightboxStage = document.querySelector('#lightboxStage');
lightboxStage.addEventListener('touchstart',event => {
  const touch = event.touches[0];
  touchStart = touch ? {x:touch.clientX,y:touch.clientY} : null;
},{passive:true});
lightboxStage.addEventListener('touchend',event => {
  const touch = event.changedTouches[0];
  if (!touchStart || !touch) return;
  const dx = touch.clientX-touchStart.x, dy = touch.clientY-touchStart.y;
  if (Math.abs(dx)>50 && Math.abs(dx)>Math.abs(dy)) stepLightbox(dx<0?1:-1);
  touchStart = null;
},{passive:true});
lightboxStage.addEventListener('touchcancel',() => {touchStart=null;},{passive:true});

const audio = document.querySelector('#backgroundMusic');
const musicFab = document.querySelector('#musicFab');
const musicControls = [musicFab,...document.querySelectorAll('[data-music-toggle]')];
const audioAnnouncement = document.querySelector('#audioAnnouncement');
audio.volume = .35;
function reflectMusic(playing) {
  musicFab.classList.toggle('playing',playing);
  musicControls.forEach(button => {
    button.setAttribute('aria-pressed',String(playing));
    button.setAttribute('aria-label',playing?'Выключить музыку':'Включить музыку');
  });
  document.querySelector('#musicStatus').textContent = playing?'Играет · нажмите для паузы':'Нажмите, чтобы включить';
  document.querySelectorAll('[data-music-text]').forEach(text => {text.textContent=playing?'Поставить на паузу':'Музыка нашего дома';});
}
let musicBusy = false;
async function toggleMusic() {
  if (musicBusy) return;
  audioAnnouncement.textContent = '';
  if (!audio.paused) {audio.pause();return;}
  musicBusy = true;
  try {await audio.play();}
  catch {audioAnnouncement.textContent='Не удалось включить музыку. Попробуйте ещё раз.';reflectMusic(false);}
  finally {musicBusy=false;}
}
musicControls.forEach(button => button.addEventListener('click',toggleMusic));
audio.addEventListener('play',() => reflectMusic(true));
audio.addEventListener('pause',() => reflectMusic(false));
audio.addEventListener('error',() => {
  reflectMusic(false);
  audioAnnouncement.textContent='Музыка пока недоступна.';
});
reflectMusic(false);
renderGallery();
document.querySelector('#year').textContent = new Date().getFullYear();
