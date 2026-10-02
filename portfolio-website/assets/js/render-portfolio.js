document.addEventListener('DOMContentLoaded', async () => {
  await loadProjects();
  const grid = document.getElementById('portfolioGrid');
  const emptyState = document.getElementById('portfolioEmpty');
  const filterRow = document.getElementById('filterRow');

  const params = new URLSearchParams(location.search);
  let activeSlug = params.get('kategori') || '';

  function render() {
    if (projectLoadError) {
      grid.style.display = 'none';
      emptyState.style.display = 'block';
      emptyState.querySelector('h3').textContent = 'Portfolio tidak dapat dimuat';
      emptyState.querySelector('p').textContent = projectLoadError;
      return;
    }

    const filtered = activeSlug
      ? PROJECTS.filter((p) => p.category === activeSlug)
      : PROJECTS;

    if (filtered.length === 0) {
      grid.style.display = 'none';
      emptyState.style.display = 'block';
    } else {
      grid.style.display = 'grid';
      emptyState.style.display = 'none';
      grid.innerHTML = filtered.map(projectCardHTML).join('');
    }

    // update tampilan pill aktif
    filterRow.querySelectorAll('.filter-pill').forEach((pill) => {
      pill.classList.toggle('active', pill.dataset.slug === activeSlug);
    });
  }

  // Bikin filter pill: All + semua kategori
  const pillsHTML = [`<button class="filter-pill" data-slug="">All</button>`]
    .concat(CATEGORIES.map((c) => `<button class="filter-pill" data-slug="${c.slug}">${c.name}</button>`))
    .join('');
  filterRow.innerHTML = pillsHTML;

  filterRow.querySelectorAll('.filter-pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      activeSlug = pill.dataset.slug;
      const url = new URL(location);
      if (activeSlug) url.searchParams.set('kategori', activeSlug);
      else url.searchParams.delete('kategori');
      history.replaceState({}, '', url);
      render();
    });
  });

  render();
});
