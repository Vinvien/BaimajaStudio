document.addEventListener('DOMContentLoaded', () => {
  const SUPABASE_URL = 'https://yxzutksvvdocjdedcjlk.supabase.co';

  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_n-fWq4XZoA8bjuNiMdi-eg_zovs5bMT';

  const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
  );
  const authPanel = document.getElementById('authPanel');
  const authForm = document.getElementById('authForm');
  const authTitle = document.getElementById('authTitle');
  const authIntro = document.getElementById('authIntro');
  const authSubmit = document.getElementById('authSubmit');
  const authMessage = document.getElementById('authMessage');
  const confirmField = document.getElementById('confirmPasswordField');
  const confirmInput = document.getElementById('adminPasswordConfirm');
  const dashboard = document.getElementById('adminDashboard');
  const projectForm = document.getElementById('projectForm');
  const projectList = document.getElementById('adminProjectList');
  const projectMessage = document.getElementById('projectMessage');
  const imageInput = document.getElementById('projectImagesInput');
  const imagePreview = document.getElementById('imagePreview');
  let csrfToken = '';
  let setupRequired = false;
  let projects = [];
  let previewURLs = [];
  const projectUpdates = 'BroadcastChannel' in window
    ? new BroadcastChannel('baimaja-projects')
    : null;

  function notifyProjectUpdate() {
    projectUpdates?.postMessage('updated');
  }

  function showMessage(element, message, isError = false) {
    element.textContent = message;
    element.classList.toggle('is-error', isError);
  }

  async function requestJSON(url, options = {}) {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Permintaan gagal.');
    return data;
  }

  function setAuthMode(needsSetup) {
    setupRequired = needsSetup;
    authTitle.textContent = needsSetup ? 'Buat akun admin' : 'Login Admin';
    authIntro.textContent = needsSetup
      ? 'Buat username dan password admin pertama dari komputer ini.'
      : 'Masuk untuk mengelola project portfolio.';
    authSubmit.textContent = needsSetup ? 'Buat akun dan masuk' : 'Login';
    confirmField.hidden = !needsSetup;
    confirmInput.required = needsSetup;
    document.getElementById('adminPassword').autocomplete = needsSetup ? 'new-password' : 'current-password';
    document.getElementById('adminPassword').minLength = needsSetup ? 12 : 1;
  }

  async function loadManagedProjects() {
    const data = await requestJSON('/api/projects', { cache: 'no-store' });
    if (!Array.isArray(data.projects)) throw new Error('Data project tidak valid.');
    projects = data.projects;
    PROJECTS.splice(0, PROJECTS.length, ...projects);
    renderProjectList();
  }

  function renderProjectList() {
    document.getElementById('projectCount').textContent = `${projects.length} project`;
    projectList.replaceChildren();

    if (projects.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'admin-empty';
      empty.textContent = 'Belum ada project. Tambahkan karya pertama melalui formulir.';
      projectList.appendChild(empty);
      return;
    }

    projects.forEach((project) => {
      const item = document.createElement('article');
      item.className = 'admin-project-row';

      if (project.images && project.images[0]) {
        const image = document.createElement('img');
        image.src = projectImageURL(project.images[0]);
        image.alt = project.title;
        image.className = 'admin-project-thumb';
        item.appendChild(image);
      } else {
        const placeholder = document.createElement('div');
        placeholder.className = 'admin-project-thumb thumb-placeholder';
        placeholder.textContent = 'NO IMAGE';
        item.appendChild(placeholder);
      }

      const details = document.createElement('div');
      details.className = 'admin-project-details';
      const title = document.createElement('h3');
      title.textContent = project.title;
      const category = document.createElement('p');
      category.className = 'admin-project-category';
      category.textContent = getCategoryName(project.category);
      const description = document.createElement('p');
      description.className = 'admin-project-description';
      description.textContent = project.description || 'Tanpa deskripsi';
      details.append(title, category, description);

      const actions = document.createElement('div');
      actions.className = 'admin-project-actions';
      const editButton = document.createElement('button');
      editButton.type = 'button';
      editButton.className = 'btn btn-outline admin-small-button';
      editButton.textContent = 'Edit';
      editButton.addEventListener('click', () => beginEdit(project));
      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.className = 'admin-delete-button';
      deleteButton.textContent = 'Hapus';
      deleteButton.addEventListener('click', () => deleteProject(project));
      actions.append(editButton, deleteButton);

      item.append(details, actions);
      projectList.appendChild(item);
    });
  }

  function clearImagePreview() {
    previewURLs.forEach((url) => URL.revokeObjectURL(url));
    previewURLs = [];
    imagePreview.replaceChildren();
  }

  function showExistingImages(project) {
    clearImagePreview();
    (project.images || []).forEach((path) => {
      const image = document.createElement('img');
      image.src = projectImageURL(path);
      image.alt = `Gambar ${project.title}`;
      imagePreview.appendChild(image);
    });
  }

  function beginEdit(project) {
    document.getElementById('projectId').value = project.id;
    document.getElementById('projectTitleInput').value = project.title;
    document.getElementById('projectCategoryInput').value = project.category;
    document.getElementById('projectDescriptionInput').value = project.description || '';
    document.getElementById('projectFeaturedInput').checked = Boolean(project.featured);
    imageInput.value = '';
    document.getElementById('projectFormTitle').textContent = 'Edit project';
    document.getElementById('saveProjectButton').textContent = 'Simpan perubahan';
    document.getElementById('cancelEditButton').hidden = false;
    showExistingImages(project);
    showMessage(projectMessage, 'Pilih gambar baru jika ingin mengganti gambar yang tersimpan.');
    projectForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function resetProjectForm() {
    projectForm.reset();
    document.getElementById('projectId').value = '';
    document.getElementById('projectFormTitle').textContent = 'Tambah project';
    document.getElementById('saveProjectButton').textContent = 'Tambah project';
    document.getElementById('cancelEditButton').hidden = true;
    clearImagePreview();
    showMessage(projectMessage, '');
  }

  function makeSlug(title) {
    return title.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  async function deleteProject(project) {
    if (!window.confirm(`Hapus project "${project.title}" beserta gambar yang diunggah?`)) return;
    const body = new FormData();
    body.set('action', 'delete');
    body.set('id', project.id);
    body.set('csrfToken', csrfToken);
    try {
      const data = await requestJSON('api/projects.php', { method: 'POST', body });
      projects = data.projects;
      PROJECTS.splice(0, PROJECTS.length, ...projects);
      renderProjectList();
      notifyProjectUpdate();
      showMessage(projectMessage, `Project "${project.title}" sudah dihapus.`);
    } catch (error) {
      showMessage(projectMessage, error.message, true);
    }
  }

  CATEGORIES.forEach((category) => {
    const option = document.createElement('option');
    option.value = category.slug;
    option.textContent = category.name;
    document.getElementById('projectCategoryInput').appendChild(option);
  });

  imageInput.addEventListener('change', () => {
    clearImagePreview();
    Array.from(imageInput.files || []).forEach((file) => {
      const url = URL.createObjectURL(file);
      previewURLs.push(url);
      const image = document.createElement('img');
      image.src = url;
      image.alt = file.name;
      imagePreview.appendChild(image);
    });
  });

authForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const email = document.getElementById('adminUsername').value.trim();
  const password = document.getElementById('adminPassword').value;

  authSubmit.disabled = true;
  showMessage(authMessage, 'Memproses login...');

  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (!data.session) {
      throw new Error('Session login tidak ditemukan.');
    }

    authPanel.hidden = true;
    dashboard.hidden = false;

    await loadManagedProjects();

    showMessage(authMessage, '');
  } catch (error) {
    showMessage(authMessage, error.message, true);
  } finally {
    authSubmit.disabled = false;
  }
});

  projectForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const id = document.getElementById('projectId').value;
    const title = document.getElementById('projectTitleInput').value.trim();
    const body = new FormData(projectForm);
    body.set('action', 'save');
    body.set('id', id);
    body.set('slug', makeSlug(title));
    body.set('featured', document.getElementById('projectFeaturedInput').checked ? 'true' : 'false');
    body.set('csrfToken', csrfToken);

    const saveButton = document.getElementById('saveProjectButton');
    saveButton.disabled = true;
    showMessage(projectMessage, 'Menyimpan project...');
    try {
      const data = await requestJSON('api/projects.php', { method: 'POST', body });
      projects = data.projects;
      PROJECTS.splice(0, PROJECTS.length, ...projects);
      renderProjectList();
      notifyProjectUpdate();
      resetProjectForm();
      showMessage(projectMessage, id ? 'Perubahan project berhasil disimpan.' : 'Project baru berhasil ditambahkan.');
    } catch (error) {
      showMessage(projectMessage, error.message, true);
    } finally {
      saveButton.disabled = false;
    }
  });

  document.getElementById('cancelEditButton').addEventListener('click', resetProjectForm);

  document.getElementById('logoutButton').addEventListener('click', async () => {
    try {
      const data = await requestJSON('api/auth.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout', csrfToken }),
      });
      csrfToken = data.csrfToken;
      dashboard.hidden = true;
      authPanel.hidden = false;
      authForm.reset();
      showMessage(authMessage, '');
    } catch (error) {
      showMessage(projectMessage, error.message, true);
    }
  });

  supabaseClient.auth.getSession()
    .then(async ({ data, error }) => {
      if (error) throw error;
  
      if (data.session) {
        authPanel.hidden = true;
        dashboard.hidden = false;
        await loadManagedProjects();
      }
    })
    .catch((error) => showMessage(authMessage, error.message, true));
});
