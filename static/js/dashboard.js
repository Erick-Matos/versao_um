document.addEventListener('DOMContentLoaded', () => {
  const baseUrl = window.location.origin;
  const token   = localStorage.getItem('token');
  const admin   = localStorage.getItem('admin') === 'true';
  const userId  = parseInt(localStorage.getItem('userId'), 10);

  if (!token) {
    window.location.href = '/';
    return;
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // Elementos
  const btnCriar    = document.querySelector('.btn-anuncio');
  const modal       = document.getElementById('petFormModal');
  const btnFechar   = document.getElementById('closeModal');
  const petForm     = document.getElementById('petForm');
  const list        = document.getElementById('petList');
  const inputCode   = document.getElementById('codigoPais');
  const inputNumber = document.getElementById('telefoneNumero');
  const erroTel     = document.getElementById('erroTelefone');

  // Abre modal
  btnCriar?.addEventListener('click', () => {
    modal.classList.add('active');
  });

  // Fecha modal no X
  btnFechar?.addEventListener('click', () => {
    modal.classList.remove('active');
    petForm.reset();
    erroTel.style.display = 'none';
  });

  // Fecha modal clicando fora
  window.addEventListener('click', e => {
    if (e.target === modal) {
      modal.classList.remove('active');
      petForm.reset();
      erroTel.style.display = 'none';
    }
  });

  // Carrega anúncios
  async function load() {
    const res = await fetch(`${baseUrl}/anuncios`, { headers });
    if (!res.ok) return alert(`Erro ${res.status}`);
    const data = await res.json();
    list.innerHTML = '';
    data.forEach(render);
    window._anuncios = data;
  }

  // Renderiza um card
  function render(a) {
    const code   = String(a.phoneCountry || '').replace(/\D/g,'');
    const number = String(a.phoneNumber || '').replace(/\D/g,'');
    const full   = `+${code}${number}`;

    const card = document.createElement('div');
    card.className = 'pet-card';
    card.innerHTML = `
      <img src="${a.imagem||'/static/img/placeholder.png'}" alt="${a.titulo}" />
      <div class="pet-info">
        <h2>${a.titulo}</h2>
        <span>Idade: ${a.idade} | Sexo: <span class="sexo">${a.sexo}</span></span><br/>
        <span>Telefone: ${full}</span>
        <div class="actions">
          <button class="btn-whatsapp">WhatsApp</button>
          <button class="btn-editar" data-id="${a.id}">Editar</button>
        </div>
      </div>`;
    list.append(card);

    // WhatsApp
    card.querySelector('.btn-whatsapp').addEventListener('click', () => {
      window.open(`https://wa.me/${code}${number}`,'_blank');
    });

    // Editar
    card.querySelector('.btn-editar').addEventListener('click', () => {
      document.getElementById('formTitle').innerText = 'Editar Anúncio';
      petForm.anuncioId.value        = a.id;
      petForm.titulo.value           = a.titulo;
      petForm.descricao.value        = a.descricao;
      petForm.idade.value            = a.idade;
      petForm.sexo.value             = a.sexo;
      inputCode.value                = code;
      inputNumber.value              = number;
      erroTel.style.display = 'none';
      modal.classList.add('active');
    });
  }

  // Só dígitos nos inputs de telefone
  [inputCode,inputNumber].forEach(i => i.addEventListener('input', () => {
    i.value = i.value.replace(/\D/g,'');
    erroTel.style.display = 'none';
  }));

  // Submit do formulário
  petForm.addEventListener('submit', async e => {
    e.preventDefault();
    const id    = petForm.anuncioId.value;
    const titulo = petForm.titulo.value.trim();
    const desc   = petForm.descricao.value.trim();
    const idade  = petForm.idade.value.trim();
    const sexo   = petForm.sexo.value;
    const code   = inputCode.value.trim().replace(/\D/g,'');
    const num    = inputNumber.value.trim().replace(/\D/g,'');

    if (!/^\d{2,3}$/.test(code) || !/^\d{8,}$/.test(num)) {
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

    const url    = id ? `${baseUrl}/anuncios/${id}` : `${baseUrl}/anuncios`;
    const method = id ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers,
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      alert(`Erro ${res.status}`);
    } else {
      modal.classList.remove('active');
      petForm.reset();
      load();
    }
  });

  load();
});
