'use strict';

// --- CONFIGURATION & CONSTANTES ---
const STORAGE_KEY = 'ghosttab-case-001-v1';

const INITIAL_STATE = Object.freeze({
  clues: [],
  unlocked: false,
  won: false,
  tab: 'mail',
  hints: 0
});

const SITES = {
  mail: ['✉', 'Messagerie', 'courrier.local / réception'],
  forum: ['#', 'Fréquence', 'frequence.local / fils / dernier-signal'],
  archive: ['▤', 'Archives', 'archives.local / dossier-nacre'],
  signal: ['◈', 'Point de contact', 'signal.local / retrouver-nora']
};

const EVIDENCE = [
  { id: 'message', title: 'Le message de Nora', text: 'Son pseudonyme est Mésange. Le forum conserve sa dernière trace.' },
  { id: 'date', title: 'La date commémorative', text: 'L’incendie a eu lieu le 17 avril 1998. Le code est au format JJMMAAAA.' },
  { id: 'place', title: 'Le bâtiment oublié', text: 'L’ancienne station de pompage porte le nom de NACRE.' },
  { id: 'time', title: 'L’heure du rendez-vous', text: 'Le deuxième créneau de maintenance commence à 04:20.' },
  { id: 'word', title: 'Le mot de reconnaissance', text: 'Nora attend le mot A UBE.' }
];

const HINTS = [
  'Commence par le message de Nora. Son pseudonyme relie la messagerie au forum.',
  'Sur Fréquence, la plaque donne une date. Transforme-la en huit chiffres : deux pour le jour, deux pour le mois, quatre pour l’année.',
  'Le code des archives est 17041998. Ouvre le dossier dans l’onglet Archives.',
  'Dans les archives : relève le nom de la station, le début du deuxième créneau et le mot en majuscules de la note.',
  'Le point de contact attend : Nacre, 04:20 et Aube.'
];

// --- ÉTAT ET MINUTERIES ---
let state = loadState();
let toastTimer = null;

// --- UTILITAIRES DOM & TEXTE ---
const $ = (selector) => document.querySelector(selector);

/**
 * Normalise une chaîne (retrait des accents, espaces et minuscules)
 */
const normalize = (str) =>
  str.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

// --- GESTION DU STORAGE ---
function getFreshState() {
  return { ...INITIAL_STATE, clues: [] };
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || typeof saved !== 'object') return getFreshState();

    return {
      clues: Array.isArray(saved.clues)
        ? [...new Set(saved.clues.filter((id) => EVIDENCE.some((e) => e.id === id)))]
        : [],
      unlocked: saved.unlocked === true,
      won: saved.won === true,
      tab: Object.hasOwn(SITES, saved.tab) ? saved.tab : 'mail',
      hints: Number.isInteger(saved.hints) ? Math.max(0, Math.min(5, saved.hints)) : 0
    };
  } catch {
    return getFreshState();
  }
}

function saveState() {
  const statusEl = $('#save-status');
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (statusEl) statusEl.textContent = 'Progression enregistrée sur cet appareil.';
  } catch {
    if (statusEl) statusEl.textContent = 'Sauvegarde indisponible : garde cet onglet ouvert.';
  }
}

// --- MÉTIER & NOTIFICATIONS ---
function renderToast(text) {
  const toastEl = $('#toast');
  if (!toastEl) return;

  toastEl.textContent = text;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2800);
}

function collectClue(id) {
  if (!EVIDENCE.some((e) => e.id === id) || state.clues.includes(id)) return;

  state.clues.push(id);
  saveState();
  renderApp();
  renderToast('Indice ajouté au carnet.');
}

// --- RENDU DES COMPOSANTS ---
function renderCollectButton(id) {
  const isFound = state.clues.includes(id);
  return `<button class="collect" data-clue="${id}" ${isFound ? 'disabled' : ''}>
    ${isFound ? '✓ Indice dans le carnet' : '+ Ajouter au carnet'}
  </button>`;
}

function renderNotebook() {
  $('#progress').textContent = `${state.clues.length} / 5 indices collectés`;
  $('#bar').style.width = `${state.clues.length * 20}%`;

  $('#clues').innerHTML = EVIDENCE.map((e, i) => {
    const isFound = state.clues.includes(e.id);
    return `
      <div class="clue ${isFound ? 'found' : ''}">
        <span class="clue-num">0${i + 1}</span>
        <div>
          <strong>${isFound ? e.title : 'Trace à découvrir'}</strong>
          <p>${isFound ? e.text : 'Explore les onglets pour trouver cet indice.'}</p>
        </div>
      </div>
    `;
  }).join('');
}

function renderMailView() {
  return `
    <div class="site-head">
      <span class="site-logo">courrier<span style="color:var(--green)">.</span></span>
      <span class="badge">1 message épinglé</span>
    </div>
    <p class="eyebrow">RÉCEPTION / 23:41</p>
    <h2>Si tu lis ça, cherche entre les lignes.</h2>
    <div class="mail-meta">
      <div class="avatar">N</div>
      <div><strong>Nora</strong><div class="meta">À toi · Hier, 23:41</div></div>
    </div>
    <div class="mail-body">
      <p>Je vais bien. Mais j’ai dû partir sans mon téléphone. J’ai trouvé quelque chose dans les archives de la ville : la démolition de la station a été autorisée avec un faux rapport.</p>
      <p>Sur <strong>Fréquence</strong>, je suis <strong>Mésange</strong>. Retrouve mon dernier message. Tout ce qu’il te faut pour ouvrir le dossier est dans les réponses.</p>
      <p>Quand tu sauras où et quand me rejoindre, utilise le point de contact. Il te faudra aussi notre mot de reconnaissance.</p>
      <p>Fais confiance aux traces.<br>— N.</p>
    </div>
    ${renderCollectButton('message')}
  `;
}

function renderForumView() {
  return `
    <div class="site-head">
      <span class="site-logo"># fréquence</span>
      <span class="thread-tag">ARCHIVES URBAINES</span>
    </div>
    <h2>Quelqu’un se souvient de la station ?</h2>
    <p class="meta">Fil public · 3 messages · lecture seule</p>
    <article class="post">
      <div class="meta"><strong style="color:#d1c2ff">Mésange</strong> · Hier, 22:58</div>
      <p>J’ai placé le dossier derrière un code. <strong>Huit chiffres, la date de l’incendie : jour, mois, année.</strong> Regardez la plaque commémorative.</p>
    </article>
    <article class="post">
      <div class="meta">Veilleur_14 · Hier, 23:07</div>
      <p>J’ai recopié la plaque : « En mémoire de l’incendie du <strong>17 avril 1998</strong>. » La station avait été évacuée à temps.</p>
      ${renderCollectButton('date')}
    </article>
    <article class="post">
      <div class="meta"><strong style="color:#d1c2ff">Mésange</strong> · Hier, 23:12</div>
      <p>C’est bien celle-là. Le nom du bâtiment et les horaires sont dans le dossier. Le <strong>deuxième créneau</strong> sera le bon.</p>
    </article>
  `;
}

function renderArchiveView() {
  if (!state.unlocked) {
    return `
      <div class="site-head">
        <span class="site-logo">Archives municipales</span>
        <span class="badge">Dossier privé</span>
      </div>
      <p class="eyebrow">FONDS INDUSTRIEL / 1998</p>
      <h2 class="archive-title">Ce qui a été effacé<br>laisse toujours une trace.</h2>
      <p>Ce dossier a été protégé par Nora. Saisis le code à huit chiffres pour consulter les pièces.</p>
      <form id="unlock">
        <div class="field">
          <label for="code">Code d’accès</label>
          <input id="code" name="code" inputmode="numeric" maxlength="8" pattern="[0-9]{8}" placeholder="8 chiffres" autocomplete="off" required aria-describedby="unlock-error">
        </div>
        <button class="primary">Ouvrir le dossier ↗</button>
        <p id="unlock-error" class="error" role="status"></p>
      </form>
      <p class="note">Piste : le fil de discussion sur Fréquence.</p>
    `;
  }

  return `
    <div class="site-head">
      <span class="site-logo">Archives municipales</span>
      <span class="badge">Accès rétabli</span>
    </div>
    <p class="eyebrow">DOSSIER 98 / STATION DE POMPAGE</p>
    <h2 class="archive-title">Les pièces oubliées.</h2>
    <article class="archive-card">
      <p class="meta">PIÈCE 01 · INVENTAIRE DES BÂTIMENTS</p>
      <h3>Station NACRE</h3>
      <p>Ancienne station de pompage du quai nord. Entrée accessible depuis le canal. L’enseigne en façade a été déposée en 2003.</p>
      ${renderCollectButton('place')}
    </article>
    <article class="archive-card">
      <p class="meta">PIÈCE 02 · MAINTENANCE NOCTURNE</p>
      <h3>Horaires des rondes</h3>
      <p>Premier créneau : 01:10–01:30<br><strong>Deuxième créneau : 04:20–04:40</strong><br>Troisième créneau : 06:00–06:20</p>
      <p class="note">Annotation de Nora : « Viens au début du deuxième créneau. »</p>
      ${renderCollectButton('time')}
    </article>
    <article class="archive-card">
      <p class="meta">PIÈCE 03 · NOTE PERSONNELLE</p>
      <p>« Quand tout semble s’éteindre, il reste l’<strong>AUBE</strong>. C’est le mot que j’attendrai. — N. »</p>
      ${renderCollectButton('word')}
    </article>
  `;
}

function renderContactView() {
  if (state.won) {
    return `
      <div class="site-head">
        <span class="site-logo">signal / canal sécurisé</span>
        <span class="badge">Contact établi</span>
      </div>
      <div class="success">
        <p class="stamp">DOSSIER 001 · RÉSOLU</p>
        <h2>« Je savais que tu trouverais. »</h2>
        <p>04:20. La station Nacre émerge du brouillard. Tu prononces « Aube ». Une silhouette ouvre la porte : Nora est là, saine et sauve.</p>
        <p>Elle te confie une copie du rapport original. Le bâtiment n’était pas condamné : quelqu’un voulait faire disparaître les preuves d’une pollution du canal.</p>
        <p>Grâce à toi, les documents pourront être transmis à la rédaction locale. Cette fois, l’histoire ne sera pas effacée.</p>
        <strong>Tu as retrouvé Nora.</strong>
      </div>
      <p class="note">Fin de l’enquête. Tu peux encore explorer les onglets ou recommencer.</p>
    `;
  }

  return `
    <div class="site-head">
      <span class="site-logo">signal / point de contact</span>
      <span class="badge">En attente</span>
    </div>
    <p class="eyebrow">DESTINATAIRE : NORA</p>
    <h2>Trois réponses. Un rendez-vous.</h2>
    <p>Indique le nom de la station, l’heure exacte et le mot de reconnaissance. Les réponses se trouvent dans les traces de Nora.</p>
    <form id="contact">
      <div class="field">
        <label for="place">Nom de la station</label>
        <input id="place" name="place" placeholder="Le nom du bâtiment" autocomplete="off" required>
      </div>
      <div class="field">
        <label for="time">Heure du rendez-vous</label>
        <input id="time" name="time" type="time" required>
      </div>
      <div class="field">
        <label for="word">Mot de reconnaissance</label>
        <input id="word" name="word" placeholder="Le mot laissé par Nora" autocomplete="off" required>
      </div>
      <button class="primary">Établir le contact ↗</button>
      <p id="contact-error" class="error" role="status"></p>
    </form>
  `;
}

const VIEWS = {
  mail: renderMailView,
  forum: renderForumView,
  archive: renderArchiveView,
  signal: renderContactView
};

// --- APPLICATION RENDERING ---
function renderApp() {
  $('#tabs').innerHTML = Object.entries(SITES)
    .map(([key, [icon, name]]) => {
      const isActive = state.tab === key;
      return `<button data-tab="${key}" class="${isActive ? 'active' : ''}" ${isActive ? 'aria-current="page"' : ''}>
        <span aria-hidden="true">${icon}</span> ${name}
      </button>`;
    })
    .join('');

  $('#url').textContent = SITES[state.tab][2];
  $('#screen').innerHTML = VIEWS[state.tab]();
  renderNotebook();
}

// --- ÉVÉNEMENTS ---
function bindEvents() {
  $('#tabs').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-tab]');
    if (!btn) return;
    state.tab = btn.dataset.tab;
    saveState();
    renderApp();
    $('#screen').focus();
  });

  $('#screen').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-clue]');
    if (btn) collectClue(btn.dataset.clue);
  });

  $('#screen').addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(e.target);

    if (e.target.id === 'unlock') {
      if (data.get('code').trim() === '17041998') {
        state.unlocked = true;
        saveState();
        renderApp();
        renderToast('Dossier déverrouillé.');
        $('#screen').focus();
      } else {
        $('#unlock-error').textContent = 'Code incorrect. Vérifie la date et l’ordre : jour, mois, année.';
      }
    }

    if (e.target.id === 'contact') {
      const place = normalize(data.get('place'));
      const time = data.get('time');
      const word = normalize(data.get('word'));
      const validPlaces = ['nacre', 'station nacre', 'station de pompage nacre'];

      if (validPlaces.includes(place) && time === '04:20' && word === 'aube') {
        state.won = true;
        saveState();
        renderApp();
        $('#screen').focus();
        renderToast('Contact établi. Nora est en sécurité.');
      } else {
        $('#contact-error').textContent = 'Le contact reste silencieux. Vérifie les trois réponses dans les archives.';
      }
    }
  });

  $('#hint').addEventListener('click', () => {
    const hintText = HINTS[Math.min(state.hints, HINTS.length - 1)];
    $('#hint-text').textContent = hintText;
    state.hints = Math.min(state.hints + 1, HINTS.length);
    saveState();
  });

  $('#reset').addEventListener('click', () => $('#reset-dialog').showModal());
  $('#cancel-reset').addEventListener('click', () => $('#reset-dialog').close());
  $('#confirm-reset').addEventListener('click', () => {
    state = getFreshState();
    saveState();
    $('#hint-text').textContent = '';
    $('#reset-dialog').close();
    renderApp();
    renderToast('Une nouvelle enquête commence.');
  });

  $('.brand').addEventListener('click', (e) => {
    e.preventDefault();
    state.tab = 'mail';
    saveState();
    renderApp();
  });
}

// --- BOOTSTRAP ---
function init() {
  bindEvents();
  renderApp();
  saveState();
}

init();
