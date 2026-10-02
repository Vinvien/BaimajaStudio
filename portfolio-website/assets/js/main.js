// =========================================================
// Mobile menu toggle
// =========================================================
const menuToggle = document.getElementById('menuToggle');
const mainNav = document.getElementById('mainNav');

if (menuToggle && mainNav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('open');
    menuToggle.classList.toggle('is-open', isOpen);
    menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
}

// Highlight menu aktif berdasarkan file halaman saat ini
(function highlightActiveNav() {
  const current = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.main-nav a').forEach((a) => {
    const href = a.getAttribute('href');
    if (href === current || (current === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });
})();

let refreshPageWhenVisible = false;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    refreshPageWhenVisible = true;
  } else if (refreshPageWhenVisible && !document.body.classList.contains('admin-page')) {
    location.reload();
  }
});

if ('BroadcastChannel' in window && !document.body.classList.contains('admin-page')) {
  const projectUpdates = new BroadcastChannel('baimaja-projects');
  projectUpdates.addEventListener('message', (event) => {
    if (event.data === 'updated') location.reload();
  });
  window.addEventListener('pagehide', () => projectUpdates.close(), { once: true });
}

document.addEventListener('contextmenu', (event) => {
  if (event.target instanceof HTMLImageElement && event.target.classList.contains('protected-artwork')) {
    event.preventDefault();
  }
});

document.addEventListener('dragstart', (event) => {
  if (event.target instanceof HTMLImageElement && event.target.classList.contains('protected-artwork')) {
    event.preventDefault();
  }
});

// =========================================================
// Reveal-on-scroll (satu kali muncul per elemen)
// =========================================================
function initReveal() {
  const revealTargets = document.querySelectorAll('.reveal-group');
  if (!revealTargets.length) return;

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    revealTargets.forEach((el) => observer.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add('is-visible'));
  }
}

document.addEventListener('DOMContentLoaded', initReveal);

// =========================================================
// Carousel gambar project (dipanggil setelah gambar di-render)
// =========================================================
function initCarousel() {
  const track = document.getElementById('carouselTrack');
  if (!track) return;

  const slides = Array.from(track.children);
  const total = slides.length;
  const counterEl = document.getElementById('carouselCounter');
  const dotsWrap = document.getElementById('carouselDots');
  const prevBtn = document.getElementById('carouselPrev');
  const nextBtn = document.getElementById('carouselNext');
  let index = 0;

  if (dotsWrap) {
    dotsWrap.innerHTML = '';
    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.setAttribute('aria-label', `Gambar ${i + 1} dari ${total}`);
      if (i === 0) dot.classList.add('active');
      dot.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(dot);
    });
  }

  function update() {
    track.style.transform = `translateX(-${index * 100}%)`;
    if (counterEl) counterEl.textContent = `${index + 1} / ${total}`;
    if (dotsWrap) {
      Array.from(dotsWrap.children).forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
      });
    }
  }

  function goTo(i) {
    index = (i + total) % total;
    update();
  }

  if (prevBtn) prevBtn.addEventListener('click', () => goTo(index - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => goTo(index + 1));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') goTo(index - 1);
    if (e.key === 'ArrowRight') goTo(index + 1);
  });

  // Swipe di HP — gambar ikut gerak real-time mengikuti jari
  let touchStartX = 0;
  let isDragging = false;

  track.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    isDragging = true;
    track.style.transition = 'none';
  }, { passive: true });

  track.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    const deltaX = e.touches[0].clientX - touchStartX;
    track.style.transform = `translateX(calc(-${index * 100}% + ${deltaX}px))`;
  }, { passive: true });

  track.addEventListener('touchend', (e) => {
    isDragging = false;
    track.style.transition = '';
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    const threshold = track.clientWidth * 0.18;

    if (Math.abs(deltaX) > threshold) {
      deltaX < 0 ? goTo(index + 1) : goTo(index - 1);
    } else {
      update(); // kurang jauh gesernya, balik ke posisi semula
    }
  }, { passive: true });

  update();
}
