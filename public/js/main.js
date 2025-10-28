const apiBase = '/api/clientes';

let currentPage = 1;
const limit = 10;

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const btnInsert = document.getElementById('btn-insert');
  const consultaSection = document.getElementById('consulta');
  const formSection = document.getElementById('form-section');
  const clientForm = document.getElementById('client-form');
  const clientTableBody = document.getElementById('client-table-body');
  const searchInput = document.getElementById('search');
  const btnSearch = document.getElementById('btn-search');
  const pageInfo = document.getElementById('page-info');
  const prevPage = document.getElementById('prev-page');
  const nextPage = document.getElementById('next-page');
  const cancelBtn = document.getElementById('cancel-btn');
  const formTitle = document.getElementById('form-title');
  const deleteModal = document.getElementById('delete-modal');
  const deleteClientId = document.getElementById('delete-client-id');
  const deleteClientName = document.getElementById('delete-client-name');
  const confirmDeleteBtn = document.getElementById('confirm-delete');
  const cancelDeleteBtn = document.getElementById('cancel-delete');

  // Handler for insert button
  btnInsert.addEventListener('click', () => { 
    showForm(); 
    prepareFormForInsert(); 
  });

  btnSearch.addEventListener('click', () => { currentPage = 1; loadClients(); });
  prevPage.addEventListener('click', () => { if (currentPage>1) { currentPage--; loadClients(); } });
  nextPage.addEventListener('click', () => { currentPage++; loadClients(); });

  cancelBtn.addEventListener('click', () => { showConsulta(); });
  cancelDeleteBtn.addEventListener('click', () => {
    deleteModal.style.display = 'none';
  });

  clientForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(clientForm);
    const data = Object.fromEntries(formData.entries());
    // If ID_Client exists -> update
    if (data.ID_Client) {
      const id = data.ID_Client;
      delete data.ID_Client;
      await fetch(`${apiBase}/${id}`, { method: 'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data) });
    } else {
      await fetch(apiBase, { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data) });
    }
    showConsulta();
    loadClients();
  });

  // initial view = consulta
  showConsulta();
  loadClients();

  function showConsulta() {
    btnInsert.classList.remove('active');
    consultaSection.style.display = '';
    formSection.style.display = 'none';
  }

  function showForm() {
    btnInsert.classList.add('active');
    consultaSection.style.display = 'none';
    formSection.style.display = '';
  }

  function prepareFormForInsert() {
    formTitle.textContent = 'Insertar cliente';
    clientForm.reset();
    clientForm['ID_Client'].value = '';
  }

  async function loadClients() {
    const term = encodeURIComponent(searchInput.value || '');
    const res = await fetch(`${apiBase}?term=${term}&page=${currentPage}&limit=${limit}`);
    if (!res.ok) {
      console.error('Error cargando clientes');
      return;
    }
    const json = await res.json();
    renderTable(json.data || []);
    pageInfo.textContent = `Página ${json.page} — Totales: ${json.total}`;
    // disable next if no more
    if ((json.page * json.limit) >= json.total) {
      nextPage.disabled = true;
    } else nextPage.disabled = false;
    prevPage.disabled = json.page <= 1;
  }

  function renderTable(clients) {
    clientTableBody.innerHTML = '';
    if (!clients.length) {
      clientTableBody.innerHTML = `<tr><td colspan="7">No hay registros</td></tr>`;
      return;
    }
    clients.forEach(c => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${c.ID_Client}</td>
        <td>${escapeHtml(c.nombre)}</td>
        <td>${escapeHtml(c.email)}</td>
        <td>${escapeHtml(c.telefono || '')}</td>
        <td>${escapeHtml(c.empresa || '')}</td>
        <td>${escapeHtml(c.cargo || '')}</td>
        <td class="td-temas">${escapeHtml(c.temas_de_interes || '')}</td>
        <td>
          <button data-action="edit" data-id="${c.ID_Client}">Editar</button>
          <button data-action="delete" data-id="${c.ID_Client}">Borrar</button>
        </td>
      `;
      clientTableBody.appendChild(tr);
    });

    clientTableBody.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const action = e.currentTarget.getAttribute('data-action');
            
            if (action === 'edit') {
                const r = await fetch(`${apiBase}/${id}`);
                const client = await r.json();
                showForm();
                formTitle.textContent = 'Editar cliente';
                clientForm['ID_Client'].value = client.ID_Client;
                clientForm['nombre'].value = client.nombre || '';
                clientForm['email'].value = client.email || '';
                clientForm['telefono'].value = client.telefono || '';
                clientForm['empresa'].value = client.empresa || '';
                clientForm['cargo'].value = client.cargo || '';
                clientForm['temas_de_interes'].value = client.temas_de_interes || '';
                // fechas (si existen) en formato legible
                clientForm['created_at'].value = client.created_at ? new Date(client.created_at).toLocaleString() : '';
                clientForm['updated_at'].value = client.updated_at ? new Date(client.updated_at).toLocaleString() : '';
            } else if (action === 'delete') {
                const clientToDelete = clients.find(c => c.ID_Client == id);
                
                // Show modal with client info
                deleteClientId.textContent = clientToDelete.ID_Client;
                deleteClientName.textContent = clientToDelete.nombre;
                deleteModal.style.display = 'flex';

                // Handle delete confirmation
                const handleDelete = async () => {
                    try {
                        const response = await fetch(`${apiBase}/${id}`, { 
                            method: 'DELETE'
                        });
                        if (response.ok) {
                            deleteModal.style.display = 'none';
                            loadClients();
                        } else {
                            alert('Error al intentar borrar el cliente');
                        }
                    } catch (error) {
                        console.error('Error:', error);
                        alert('Error al intentar borrar el cliente');
                    }
                    // Remove event listener after execution
                    confirmDeleteBtn.removeEventListener('click', handleDelete);
                };

                confirmDeleteBtn.addEventListener('click', handleDelete);
            }
        });
    });
  }

  function escapeHtml(s = '') {
    return String(s).replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }

});