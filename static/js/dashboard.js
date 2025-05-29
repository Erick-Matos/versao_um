document.addEventListener('DOMContentLoaded', () => {
  const baseUrl = window.location.origin;
  const token   = localStorage.getItem('token');
  const admin   = localStorage.getItem('admin') === 'true';
  const userId  = parseInt(localStorage.getItem('userId'), 10);

  if (!token) {
    window.location.href = '/';
    return;
  }

  const jsonHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type':  'application/json'
  };

  // Elements
  const btnCriar      = document.querySelector('.btn-anuncio');
  const modal         = document.getElementById('petFormModal');
  const closeModal    = document.getElementById('closeModal');
  const petForm       = document.getElementById('petForm');
  const listContainer = document.getElementById('petList');
  const codigoInput   = document.getElementById('codigoPais');
  const numeroInput   = document.getElementById('telefoneNumero');
  const erroTelefone  = document.getElementById('erroTelefone');

  // Open modal
  btnCriar?.addEventListener('click', () => {
    modal.classList.add('active');
  });

  // Close modal on X
  closeModal?.addEventListener('click', () => {
    modal.classList.remove('active');
    petForm.reset();
    erroTelefone.style.display = 'none';
  });

  // Close modal on backdrop
  window.addEventListener('click', e => {
    if (e.target === modal) {
      modal.classList.remove('active');
      petForm.reset();
      erroTelefone.style.display = 'none';
    }
  });

  // Load anuncios
  async function loadAnuncios() {
    const res = await fetch(`${baseUrl}/anuncios`, { headers: jsonHeaders });
    if (!res.ok) return alert(`Erro ${res.status}`);
    const anuncios = await res.json();
    renderAnuncios(anuncios);
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
          <span>Idade: ${a.idade} | Sexo: <span class="sexo">${a.sexo}</span></span>
          <p>Telefone: ${a.telefone}</p>
          <div class="actions">
            <button class="btn-whatsapp" onclick="window.open('https://wa.me/${a.telefone.replace(/\D/g, '')}','_blank')">WhatsApp</button>
            ${ (admin || a.usuario_id===userId)
               ? `<button class="btn-editar" data-id="${a.id}">Editar</button>
                  <button class="btn-excluir" data-id="${a.id}">Excluir</button>`
               : ''
            }
          </div>
        </div>`;
      listContainer.appendChild(card);
    });

    // Excluir
    document.querySelectorAll('.btn-excluir').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Excluir anúncio?')) return;
        const res = await fetch(`${baseUrl}/anuncios/${btn.dataset.id}`, {
          method: 'DELETE',
          headers: {'Authorization': `Bearer ${token}`}
        });
        if (res.ok) loadAnuncios();
        else alert(`Erro ${res.status}`);
      });
    });

    // Editar
    document.querySelectorAll('.btn-editar').forEach(btn => {
      btn.addEventListener('click', () => {
        const a = window._anuncios.find(x => x.id == btn.dataset.id);
        if (!a) return alert('Não encontrado');
        petForm.titulo.value = a.titulo;
        petForm.descricao.value = a.descricao || '';
        petForm.idade.value = a.idade;
        petForm.sexo.value = a.sexo;
        // split code + number
        const m = a.telefone.match(/^\+(\d{1,4})(\d{8,13})$/);
        if (m) { codigoInput.value = m[1]; numeroInput.value = m[2]; }
        else { codigoInput.value = '55'; numeroInput.value = a.telefone.replace(/\D/g,''); }
        petForm.existingImageUrl.value = a.imagem || '';
        petForm.anuncioId.value = a.id;
        erroTelefone.style.display = 'none';
        modal.classList.add('active');
      });
    });
  }

  // Image upload helper
  async function uploadImagem(file) {
    const fd = new FormData();
    fd.append('imagem', file);
    const res = await fetch(`${baseUrl}/upload-imagem`, {
      method: 'POST',
      headers: {'Authorization': `Bearer ${token}`},
      body: fd
    });
    if (!res.ok) {
      const err = await res.json().catch(()=>{});
      throw new Error(err.error||`Erro ${res.status}`);
    }
    return (await res.json()).image_url;
  }

  // Only digits for code/number
  [codigoInput, numeroInput].forEach(inp => {
    inp.addEventListener('input', () => {
      inp.value = inp.value.replace(/\D/g,'');
      erroTelefone.style.display = 'none';
    });
  });

  // Submit form
  petForm.addEventListener('submit', async e => {
    e.preventDefault();
    const nome      = petForm.titulo.value.trim();
    const descricao = petForm.descricao.value.trim();
    const idade     = petForm.idade.value.trim();
    const sexo      = petForm.sexo.value;
    const idToEdit  = petForm.anuncioId.value;
    let imgUrl      = petForm.existingImageUrl.value || '';

    const cod = codigoInput.value.trim();
    const num = numeroInput.value.trim();
    const telefone = `+${cod}${num}`;

    if (!/^\+\d{10,15}$/.test(telefone)) {
      erroTelefone.style.display = 'block';
      return alert('Telefone inválido.');
    }
    if (!nome||!idade||!telefone||!sexo) {
      return alert('Preencha todos os campos!');
    }

    const fileInput = petForm.imagem;
    if (fileInput.files.length) {
      try { imgUrl = await uploadImagem(fileInput.files[0]); }
      catch(err){ return alert(err.message); }
    }

    const payload = { titulo:nome, descricao, idade:parseInt(idade,10),
                      sexo, telefone, imagem_url:imgUrl };

    const url    = idToEdit?`${baseUrl}/anuncios/${idToEdit}`:`${baseUrl}/anuncios`;
    const method = idToEdit?'PUT':'POST';
    try {
      const res = await fetch(url, {
        method, headers: jsonHeaders, body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error((await res.json()).message||res.status);
      modal.classList.remove('active');
      petForm.reset();
      erroTelefone.style.display = 'none';
      loadAnuncios();
    } catch(err){
      alert(err.message);
    }
  });

  // Inicial
  loadAnuncios();
});
