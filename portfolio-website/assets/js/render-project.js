document.addEventListener('DOMContentLoaded', async () => {
  const projectsLoaded = await loadProjects();
  const params = new URLSearchParams(location.search);
  const id = params.get('id') || '';
  const slug = params.get('slug') || '';
  const project = id
    ? PROJECTS.find((p) => p.id === id)
    : PROJECTS.find((p) => p.slug === slug);

  const foundWrap = document.getElementById('projectFound');
  const notFoundWrap = document.getElementById('projectNotFound');

  if (!project) {
    notFoundWrap.style.display = 'block';
    foundWrap.style.display = 'none';
    if (!projectsLoaded) {
      notFoundWrap.querySelector('h3').textContent = 'Project tidak dapat dimuat';
      notFoundWrap.querySelector('p').textContent = projectLoadError;
    }
    return;
  }

  foundWrap.style.display = 'block';
  notFoundWrap.style.display = 'none';

  document.title = `${project.title} — Studio`;
  document.getElementById('projectTitleTop').textContent = project.title;
  document.getElementById('projectCatTag').textContent = getCategoryName(project.category);
  document.getElementById('projectTitle').textContent = project.title;
  document.getElementById('projectDesc').textContent = project.description || '';
  document.getElementById('categoryLink').href = `portfolio.html?kategori=${encodeURIComponent(project.category)}`;

  const track = document.getElementById('carouselTrack');
  const counter = document.getElementById('carouselCounter');
  const images = project.images && project.images.length ? project.images : [];

  if (images.length === 0) {
    document.getElementById('carouselWrap').innerHTML = '<div class="thumb-placeholder" style="aspect-ratio:4/5;">NO IMAGE</div>';
  } else {
    document.getElementById('carouselWrap').classList.add('protected-artwork-frame');
    track.innerHTML = images.map((img) => `<img class="protected-artwork" draggable="false" src="${escapeHTML(projectImageURL(img))}" alt="${escapeHTML(project.title)}">`).join('');
    counter.textContent = `1 / ${images.length}`;
    initCarousel();
  }
});
