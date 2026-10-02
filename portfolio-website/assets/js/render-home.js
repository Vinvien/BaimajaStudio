document.addEventListener('DOMContentLoaded', async () => {
  const projectsLoaded = await loadProjects();
  const totalProjects = document.getElementById('totalProjects');
  if (totalProjects) totalProjects.textContent = projectsLoaded ? `${PROJECTS.length}+` : '—';

  const featuredRow = document.getElementById('featuredRow');
  const featuredEmpty = document.getElementById('featuredEmpty');
  const featured = PROJECTS.filter((p) => p.featured);

  if (featuredRow) {
    if (featured.length === 0) {
      if (featuredEmpty) featuredEmpty.style.display = 'block';
    } else {
      featuredRow.innerHTML = featured.map(projectCardHTML).join('');
    }
  }

  const categoryGrid = document.getElementById('categoryGrid');
  if (categoryGrid) {
    categoryGrid.innerHTML = CATEGORIES.map((c) => `
      <div class="category-card">
        <div class="name">${c.name}</div>
      </div>
    `).join('');
  }
});
