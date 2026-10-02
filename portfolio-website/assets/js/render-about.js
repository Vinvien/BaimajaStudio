document.addEventListener('DOMContentLoaded', () => {
  const totalEl = document.getElementById('totalProjects');
  if (totalEl) totalEl.textContent = `${PROJECTS.length}+`;

  const categoryGrid = document.getElementById('categoryGrid');
  if (categoryGrid) {
    categoryGrid.innerHTML = CATEGORIES.map((c) => `
      <a href="portfolio.html?kategori=${encodeURIComponent(c.slug)}" class="category-card">
        <div class="name">${c.name}</div>
      </a>
    `).join('');
  }
});
