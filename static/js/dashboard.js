document.addEventListener('DOMContentLoaded', () => {
  const baseUrl = window.location.origin;
  const token = localStorage.getItem('token');
  const admin = localStorage.getItem('admin') === 'true';
  const userId = parseInt(localStorage.getItem('userId'), 10);

  if (!token) {
    window.location.href = '/';
    return;
  }

  const jsonHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  const btnCriar = document.querySelector('.btn-anuncio');
  const modal = document.getElementById('petFormModal');
  const overlay = modal.querySelector('.modal-overlay');
  const closeModalBtn = document.getElementById('closeModal');
  const petForm = document.getElementById('petForm');
  const listContainer = document.getElementById('petList');
  
  function fecharModal() {
    petForm.reset();
    petForm.anuncioId.value = '';
    petForm.existingImageUrl.value = '';
    modal.classList.remove('active');
  }

  btnCriar?.addEventListener('click', () => modal.classList.add('active'));
  overlay?.addEventListener('click', fecharModal);
  closeModalBtn?.addEventListener('click', fecharModal);

  // MODAL DE DESCRIÇÃO
  document.getElementById('closeDescricaoModal').addEventListener('click', () => {
    document.getElementById('descricaoModal').classList.remove('active');
  });
  document.getElementById('descricaoModal').addEventListener('click', e => {
    if (e.target === e.currentTarget) {
      e.currentTarget.classList.remove('active');
    }
  });

  async function loadAnuncios() {
    try {
      const res = await fetch(`${baseUrl}/anuncios`, { headers: jsonHeaders });
      if (!res.ok) throw new Error(`Erro ${res.status} ao carregar anúncios`);
      const anuncios = await res.json();
      window._anuncios = anuncios;
      renderAnuncios(anuncios);
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  }

  function renderAnuncios(anuncios) {
    listContainer.innerHTML = '';
    anuncios.forEach(a => {
      const imgSrc = a.imagem || '/static/img/placeholder.png';
      const card = document.createElement('div');
      card.className = 'pet-card';
      card.innerHTML = `
        <img src="${imgSrc}" alt="${a.titulo}" />
        <div class="pet-info">
          <h2>${a.titulo}</h2>
          <span>Idade: ${a.idade} | Sexo: <span class="sexo">${a.sexo}</span></span><br/>
          <span>Telefone: ${a.telefone}</span>
          <div class="actions">
            <span class="descricao-icon" title="Ver descrição">🛈</span>
            <a href="https://wa.me/${a.telefone.replace(/\D/g, '')}" target="_blank" class="btn-whatsapp">WhatsApp</a>
            ${(admin || a.usuario_id === userId) ? `
              <button class="btn-editar" data-id="${a.id}">Editar</button>
              <button class="btn-excluir" data-id="${a.id}">Excluir</button>
            ` : ''}
          </div>
        </div>
      `;
      listContainer.appendChild(card);

      // Bind do ícone de descrição
      card.querySelector('.descricao-icon').addEventListener('click', () => {
        document.getElementById('descricaoTexto').innerText = a.descricao || 'Sem descrição';
        document.getElementById('descricaoModal').classList.add('active');
      });
    });

    document.querySelectorAll('.btn-excluir').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Excluir anúncio?')) return;
        const res = await fetch(`${baseUrl}/anuncios/${btn.dataset.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) alert(`Erro ${res.status} ao excluir`);
        else loadAnuncios();
      });
    });

    document.querySelectorAll('.btn-editar').forEach(btn => {
      btn.addEventListener('click', () => {
        const anuncio = window._anuncios.find(a => a.id == btn.dataset.id);
        if (!anuncio) return alert('Anúncio não encontrado');
        petForm.titulo.value = anuncio.titulo;
        petForm.descricao.value = anuncio.descricao || '';
        petForm.idade.value = anuncio.idade;
        petForm.sexo.value = anuncio.sexo;
        petForm.existingImageUrl.value = anuncio.imagem || '';
        petForm.anuncioId.value = anuncio.id;

        // SEPARA CÓDIGO DO PAÍS E NÚMERO
        let cod = '55', num = '';
        if (anuncio.telefone && anuncio.telefone.startsWith('+')) {
          const match = anuncio.telefone.match(/^\+(\d{1,3})(\d{7,})$/);
          if (match) {
            cod = match[1];
            num = match[2];
          } else {
            cod = anuncio.telefone.slice(1, 4).replace(/\D/g, '');
            num = anuncio.telefone.slice(1 + cod.length);
          }
        }
        petForm.codigoPais.value = cod;
        petForm.numeroTelefone.value = num;
        modal.classList.add('active');
      });
    });
  }

  async function uploadImagem(file) {
    const fd = new FormData();
    fd.append('imagem', file);
    const res = await fetch(`${baseUrl}/upload-imagem`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: fd
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Falha no upload (${res.status})`);
    }
    const data = await res.json();
    return data.image_url;
  }

  petForm.addEventListener('submit', async e => {
    e.preventDefault();

    const idToEdit = petForm.anuncioId.value;
    const nome = petForm.titulo.value.trim();
    const descricao = petForm.descricao.value.trim();
    const idade = petForm.idade.value.trim();
    const sexo = petForm.sexo.value;
    const codigoPais = petForm.codigoPais.value.trim();
    const numeroTel = petForm.numeroTelefone.value.trim();
    let imgUrl = petForm.existingImageUrl.value || '';

    if (!nome || !idade || !codigoPais || !numeroTel || !sexo) {
      return alert('Preencha todos os campos!');
    }
    if (!/^\d+$/.test(codigoPais)) {
      return alert('Código do país inválido! Use apenas números.');
    }
    if (!/^\d{8,15}$/.test(numeroTel)) {
      return alert('Telefone inválido! Use só números, de 8 a 15 dígitos.');
    }
    const telefone = `+${codigoPais}${numeroTel}`;

    const fileInput = petForm.imagem;
    if (fileInput && fileInput.files.length) {
      try {
        imgUrl = await uploadImagem(fileInput.files[0]);
      } catch (err) {
        return alert(err.message);
      }
    }

    const payload = {
      titulo: nome,
      descricao: descricao,
      idade: parseInt(idade, 10),
      sexo: sexo,
      telefone: telefone,
      imagem_url: imgUrl
    };

    const url = idToEdit
      ? `${baseUrl}/anuncios/${idToEdit}`
      : `${baseUrl}/anuncios`;
    const method = idToEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: jsonHeaders,
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Erro ${res.status}`);

      petForm.reset();
      petForm.anuncioId.value = '';
      petForm.existingImageUrl.value = '';
      modal.classList.remove('active');
      loadAnuncios();
    } catch (err) {
      alert(err.message);
    }
  });

  loadAnuncios();
});
