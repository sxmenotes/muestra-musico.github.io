import '@fontsource/cormorant-garamond/latin-400.css';
import '@fontsource/cormorant-garamond/latin-400-italic.css';
import '@fontsource/cormorant-garamond/latin-500.css';
import '@fontsource/manrope/latin-400.css';
import '@fontsource/manrope/latin-500.css';
import '@fontsource/manrope/latin-600.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
function closeMenu() {
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Abrir menú');
  navigation.classList.remove('is-open');
}
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  navigation.classList.toggle('is-open', open);
});
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    menuButton.focus();
  }
});
document.addEventListener('click', event => {
  if (!event.target.closest('.site-header')) closeMenu();
});
window.matchMedia('(min-width: 761px)').addEventListener('change', closeMenu);

const motion = gsap.matchMedia();
motion.add('(prefers-reduced-motion: no-preference)', () => {
  gsap.timeline({ defaults: { ease: 'power3.out' } })
    .from('.hero', { opacity: 0, duration: 1 }, 0)
    .from('.hero-copy > *', { opacity: 0, y: 22, duration: .8, stagger: .1, clearProps: 'transform' }, .2)
    .from('.hero-scroll', { opacity: 0, duration: .8 }, .9);
  gsap.utils.toArray('.reveal').forEach(element => {
    gsap.from(element, { y: 28, opacity: 0, duration: .85, ease: 'power2.out', scrollTrigger: { trigger: element, start: 'top 92%', once: true } });
  });
});

// Original, synthesized demo sketches: no external audio requests or autoplay.
const tracks = [
  { title: 'Donde empieza todo', chords: [[60,64,67,72],[57,60,64,69],[53,57,60,65],[55,59,62,67]] },
  { title: 'Luz de domingo', chords: [[62,66,69,74],[59,62,66,71],[55,59,62,67],[57,61,64,69]] },
  { title: 'Siempre, contigo', chords: [[57,60,64,69],[53,57,60,65],[60,64,67,72],[55,59,62,67]] }
];
const trackButtons = [...document.querySelectorAll('.track')];
const playerStatus = document.querySelector('#player-status');
const progress = document.querySelector('.audio-progress');
const progressFill = progress.querySelector('span');
let context = null;
let activeTrack = -1;
let frame = 0;
let waveAnimation = null;
let recordAnimation = null;
const duration = 24;

function stopPlayback(message = 'Elijan una melodía para empezar.') {
  cancelAnimationFrame(frame);
  if (context) { context.close().catch(() => {}); context = null; }
  activeTrack = -1;
  trackButtons.forEach((button, index) => {
    button.setAttribute('aria-pressed', 'false');
    button.setAttribute('aria-label', `Reproducir ${tracks[index].title}`);
    button.querySelector('.track-play').textContent = '▷';
  });
  waveAnimation?.kill();
  recordAnimation?.kill();
  gsap.set('.sound-wave i', { clearProps: 'transform' });
  progressFill.style.width = '0%';
  progress.setAttribute('aria-valuenow', '0');
  playerStatus.textContent = message;
}

function playNote(audio, output, midi, time, length, volume) {
  const oscillator = audio.createOscillator();
  const envelope = audio.createGain();
  oscillator.type = 'triangle';
  oscillator.frequency.value = 440 * 2 ** ((midi - 69) / 12);
  envelope.gain.setValueAtTime(0, time);
  envelope.gain.linearRampToValueAtTime(volume, time + .015);
  envelope.gain.exponentialRampToValueAtTime(.001, time + length);
  oscillator.connect(envelope);
  envelope.connect(output);
  oscillator.start(time);
  oscillator.stop(time + length + .02);
  oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); };
}

async function playTrack(index) {
  if (activeTrack === index) { stopPlayback('Música detenida. Vuelvan cuando quieran.'); return; }
  stopPlayback();
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    playerStatus.textContent = 'Este navegador no permite reproducir la muestra. Prueben con un navegador actualizado.';
    return;
  }
  let audio;
  try {
    audio = new AudioContextClass();
    context = audio;
    activeTrack = index;
    await audio.resume();
    if (context !== audio) return;
    const master = audio.createGain();
    const filter = audio.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1900;
    master.gain.value = .45;
    master.connect(filter);
    filter.connect(audio.destination);
    const start = audio.currentTime + .08;
    for (let beat = 0; beat < 48; beat++) {
      const chord = tracks[index].chords[Math.floor(beat / 12) % 4];
      const note = chord[[0,1,2,3,2,1][beat % 6]];
      playNote(audio, master, note, start + beat * .5, Math.min(1.6, duration - beat * .5), .15);
      if (beat % 6 === 0) playNote(audio, master, chord[0] - 12, start + beat * .5, 2.6, .16);
    }
    const button = trackButtons[index];
    button.setAttribute('aria-pressed', 'true');
    button.setAttribute('aria-label', `Detener ${tracks[index].title}`);
    button.querySelector('.track-play').textContent = 'Ⅱ';
    playerStatus.textContent = `Sonando: ${tracks[index].title}`;
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      waveAnimation = gsap.to('.sound-wave i', { scaleY: .3, duration: .4, repeat: -1, yoyo: true, stagger: .08, ease: 'sine.inOut' });
      recordAnimation = gsap.to('.record', { rotation: '+=360', duration: 9, repeat: -1, ease: 'none' });
    }
    function updateProgress() {
      if (context !== audio) return;
      const elapsed = Math.max(0, audio.currentTime - start);
      const percentage = Math.min(100, elapsed / duration * 100);
      progressFill.style.width = `${percentage}%`;
      progress.setAttribute('aria-valuenow', String(Math.round(percentage)));
      if (elapsed >= duration) { stopPlayback('Un pequeño adelanto de un gran día. ¿Escuchamos otra?'); return; }
      frame = requestAnimationFrame(updateProgress);
    }
    updateProgress();
  } catch {
    if (context === audio) {
      stopPlayback('No pudimos iniciar el audio. Vuelvan a pulsar reproducir.');
      }
  }
}
trackButtons.forEach((button, index) => button.addEventListener('click', () => playTrack(index)));
window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', event => {
  if (event.matches) { waveAnimation?.kill(); recordAnimation?.kill(); gsap.set('.sound-wave i', { clearProps: 'transform' }); }
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden && activeTrack !== -1) stopPlayback('Música detenida. Pulsen play para volver a escuchar.');
});
window.addEventListener('pagehide', () => stopPlayback());

const form = document.querySelector('.contact-form');
const dateField = document.querySelector('#date');
const today = new Date();
const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
dateField.min = localDate;
form.addEventListener('submit', event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const names = document.querySelector('#names').value.trim();
  const location = document.querySelector('#location').value.trim();
  if (!names || !location) {
    document.querySelector('#form-status').textContent = 'Completen sus nombres y el lugar de la celebración para continuar.';
    return;
  }
  document.querySelector('#form-status').textContent = `¡Qué bonita historia, ${names}! Así se vería la confirmación de su consulta. Esta es una demostración: no se envió ningún mensaje ni se guardaron sus datos.`;
});


// Demo channels remain local until real social accounts are supplied.
const socialDialog = document.querySelector('.social-dialog');
const socialTitle = document.querySelector('#social-title');
const socialDescription = document.querySelector('#social-description');
document.querySelectorAll('[data-social]').forEach(button => {
  button.addEventListener('click', () => {
    const channel = button.dataset.social;
    socialTitle.textContent = channel === 'WhatsApp' ? 'Un hola por WhatsApp.' : `Nos encontramos en ${channel}.`;
    socialDescription.textContent = `Julián Alba es un artista ficticio. Este acceso de demostración no está vinculado a una cuenta real de ${channel}. Pueden seguir explorando la propuesta desde el formulario.`;
    socialDialog.showModal();
  });
});
socialDialog.querySelector('.dialog-close').addEventListener('click', () => socialDialog.close());
socialDialog.querySelector('.dialog-contact').addEventListener('click', () => socialDialog.close());
socialDialog.addEventListener('click', event => {
  const rect = socialDialog.getBoundingClientRect();
  if (event.target === socialDialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) socialDialog.close();
});
