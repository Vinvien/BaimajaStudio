/**
 * data.js
 * ===========================================================
 * Public category definitions and helpers shared by the website pages.
 * ===========================================================
 */

const CATEGORIES = [
  { name: 'Illustration', slug: 'illustration' },
  { name: 'Branding', slug: 'branding' },
  { name: 'T-Shirt', slug: 't-shirt' },
  { name: 'Logo', slug: 'logo' },
  { name: 'Cover', slug: 'cover' },
  { name: 'Poster', slug: 'poster' },
  { name: 'Other', slug: 'other' },
];

const PROJECTS = [];
let projectLoadError = '';

function getCategoryName(slug) {
  const found = CATEGORIES.find((c) => c.slug === slug);
  return found ? found.name : slug;
}

async function loadProjects() {
  try {
    const response = await fetch('api/projects', { cache: 'no-store' });
    if (!response.ok) throw new Error('Project tidak dapat dimuat.');
    const data = await response.json();
    if (!Array.isArray(data.projects)) throw new Error('Data project tidak valid.');
    PROJECTS.splice(0, PROJECTS.length, ...data.projects);
    projectLoadError = '';
    return true;
  } catch (error) {
    console.error(error);
    PROJECTS.splice(0, PROJECTS.length);
    projectLoadError = 'Project tidak dapat dimuat. Buka website melalui server PHP yang sama dengan panel admin.';
    return false;
  }
}

function projectImageURL(image) {
  const value = String(image || '');

  // Supabase Storage URL
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }

  // Legacy local image path
  const path = value.startsWith('assets/img/')
    ? value
    : `assets/img/${value}`;

  return path.split('/').map((part) => encodeURIComponent(part)).join('/');
}

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

function projectCardHTML(project) {
  const hasImage = Boolean(project.images && project.images[0]);
  const thumb = hasImage
    ? `<img class="protected-artwork" draggable="false" src="${escapeHTML(projectImageURL(project.images[0]))}" alt="${escapeHTML(project.title)}">`
    : `<div class="thumb-placeholder">NO IMAGE</div>`;
  const frameClass = hasImage ? 'thumb protected-artwork-frame' : 'thumb';

  const projectURL = project.id
    ? `project.html?id=${encodeURIComponent(project.id)}`
    : `project.html?slug=${encodeURIComponent(project.slug)}`;

  return `
    <a href="${projectURL}" class="project-card">
      <div class="${frameClass}">${thumb}</div>
      <div class="meta">
        <div class="title">${escapeHTML(project.title)}</div>
        <div class="cat">${escapeHTML(getCategoryName(project.category))}</div>
      </div>
    </a>
  `;
}
