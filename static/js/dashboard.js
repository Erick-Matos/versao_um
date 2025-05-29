document.addEventListener('DOMContentLoaded', () => {
  const baseUrl = window.location.origin;
  const token   = localStorage.getItem('token');
  if (!token) return window.location.href = '/';


  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type':  'application/json'
  };

  const btnCriar    = document.querySelector('.btn-anuncio');
  const modal       = document.getElementById('petFormModal');
  const btnFechar   = document.getElementById('closeModal');
  const petForm     = document.getElementById('petForm');
  const list        = document.getElementById('petList');
  const inputCode   = document.getElementById('codigoPais');
  const inputNum    = document.getElementById('telefoneNumero');
  const erroTel     = document.getElementById('erroTelefone');

  // Abre modal
  btnCriar.addEventListener('click', () => {
    document.getElementById('formTitle').innerText = 'Novo Anúncio';
    petForm.reset();
    erroTel.style.display = 'none';
    modal.classList.add('active');
  });

  // Fecha modal
  btnFechar.addEventListener('click', closeModal);
  window.addEventListener('click', e => {
    if (e.target === modal) closeModal();
  });
  function closeModal() {
    modal.classList.remove('active');
    petForm.reset();
    erroTel.style.display = 'none';
  }

  // Carrega anúncios
  async function load() {
    const res = await fetch(`${baseUrl}/api/anuncios`, { headers });
    if (!res.ok) return alert(`Erro ${res.status}`);
    const ads = await res.json();
    window._anuncios = ads;
    list.innerHTML = '';
    ads.forEach(renderCard);
  }

  // Renderiza cada card
  function renderCard(a) {
    const code = (a.phoneCountry||'').replace(/\D/g,'');
    const num  = (a.phoneNumber||'').replace(/\D/g,'');
    const full = `+${code}${num}`;
    const imgUrl = a.imagem
      ? `/static/uploads/${a.imagem}`
      : '/static/img/placeholder.png';

    const card = document.createElement('div');
    card.className = 'pet-card';
    card.innerHTML = `
      <img src="${imgUrl}" alt="${a.titulo}" />
      <div class="pet-info">
        <h2>${a.titulo}</h2>
        <span>Idade: ${a.idade} | Sexo: <span class="sexo">${a.sexo}</span></span><br/>
        <span>Telefone: ${full}</span>
        <div class="actions">
          <button class="btn-whatsapp">WhatsApp</button>
          <button class="btn-editar" data-id="${a.id}">Editar</button>
          <button class="btn-excluir" data-id="${a.id}">Excluir</button>
        </div>
      </div>`;
    list.append(card);

    // WhatsApp
    card.querySelector('.btn-whatsapp').onclick = () => {
      window.open(`https://wa.me/${code}${num}`, '_blank');
    };

    // Excluir
    card.querySelector('.btn-excluir').onclick = async () => {
      if (!confirm('Excluir anúncio?')) return;
      const r = await fetch(`${baseUrl}/api/anuncios/${a.id}`, {
        method: 'DELETE',
        headers
      });
      if (r.ok) load();
      else alert(`Erro ${r.status}`);
    };

    // Editar
    card.querySelector('.btn-editar').onclick = () => {
      document.getElementById('formTitle').innerText = 'Editar Anúncio';
      petForm.anuncioId.value        = a.id;
      petForm.titulo.value           = a.titulo;
      petForm.descricao.value        = a.descricao;
      petForm.idade.value            = a.idade;
      petForm.sexo.value             = a.sexo;
      inputCode.value                = code;
      inputNum.value                 = num;
      erroTel.style.display          = 'none';
      modal.classList.add('active');
    };
  }

  // Apenas dígitos nos inputs
  [inputCode, inputNum].forEach(i => {
    i.addEventListener('input', () => {
      i.value = i.value.replace(/\D/g,'');
      erroTel.style.display = 'none';
    });
  });

  // Submissão do formulário
  petForm.addEventListener('submit', async e => {
    e.preventDefault();

    const id    = petForm.anuncioId.value;
    const titulo = petForm.titulo.value.trim();
    const desc   = petForm.descricao.value.trim();
    const idade  = petForm.idade.value.trim();
    const sexo   = petForm.sexo.value;
    const code   = inputCode.value.trim().replace(/\D/g,'');
    const num    = inputNum.value.trim().replace(/\D/g,'');

    if (!/^\d{1,3}$/.test(code) || !/^\d{8,}$/.test(num)) {
      erroTel.textContent = 'Código ou número inválido';
      erroTel.style.display = 'block';
      return;
    }

    const payload = {
      titulo,
      descricao: desc,
      idade: parseInt(idade,10),
      sexo,
      phoneCountry: code,
      phoneNumber: num,
      imagem_url: petForm.existingImageUrl.value || ''
    };

    const url    = id ? `${baseUrl}/api/anuncios/${id}` : `${baseUrl}/api/anuncios`;
    const method = id ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers,
      body: JSON.stringify(payload)
    });
    if (!res.ok) return alert(`Erro ${res.status}`);
    closeModal();
    load();
  });
});
