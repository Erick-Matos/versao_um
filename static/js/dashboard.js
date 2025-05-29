document.addEventListener('DOMContentLoaded', () => {
  const baseUrl = window.location.origin;
  const token   = localStorage.getItem('token');
  if (!token) return window.location.href = '/';
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  const btnCriar   = document.querySelector('.btn-anuncio');
  const modal      = document.getElementById('petFormModal');
  const btnFechar  = document.getElementById('closeModal');
  const petForm    = document.getElementById('petForm');
  const list       = document.getElementById('petList');
  const inputCode  = document.getElementById('codigoPais');
  const inputNum   = document.getElementById('telefoneNumero');
  const erroTel    = document.getElementById('erroTelefone');

  btnCriar.addEventListener('click', () => modal.classList.add('active'));
  btnFechar.addEventListener('click', () => {
    modal.classList.remove('active');
    petForm.reset();
    erroTel.style.display = 'none';
  });
  window.addEventListener('click', e => {
    if (e.target === modal) {
      modal.classList.remove('active');
      petForm.reset();
      erroTel.style.display = 'none';
    }
  });

  async function load() {
    const res = await fetch(`${baseUrl}/anuncios`, { headers });
    if (!res.ok) return alert(`Erro ${res.status}`);
    const ads = await res.json();
    list.innerHTML = '';
    ads.forEach(a => {
      const code = (a.phoneCountry||'').replace(/\D/g,'');
      const num  = (a.phoneNumber||'').replace(/\D/g,'');
      const full = `+${code}${num}`;
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
            <button class="btn-excluir" data-id="${a.id}">Excluir</button>
          </div>
        </div>`;
      list.append(card);

      card.querySelector('.btn-whatsapp').addEventListener('click', () => {
        window.open(`https://wa.me/${code}${num}`, '_blank');
      });
      card.querySelector('.btn-editar').addEventListener('click', () => {
        document.getElementById('formTitle').innerText = 'Editar Anúncio';
        document.querySelector('[name=anuncioId]').value = a.id;
        document.querySelector('[name=titulo]').value = a.titulo;
        document.querySelector('[name=descricao]').value = a.descricao;
        document.querySelector('[name=idade]').value = a.idade;
        document.querySelector('[name=sexo]').value = a.sexo;
        inputCode.value = code;
        inputNum.value  = num;
        erroTel.style.display = 'none';
        modal.classList.add('active');
      });
      card.querySelector('.btn-excluir').addEventListener('click', async () => {
        if (!confirm('Excluir anúncio?')) return;
        const r = await fetch(`${baseUrl}/anuncios/${a.id}`, { method:'DELETE', headers });
        if (r.ok) load(); else alert(`Erro ${r.status}`);
      });
    });
  }

  [inputCode,inputNum].forEach(i => i.addEventListener('input', () => {
    i.value = i.value.replace(/\D/g,'');
    erroTel.style.display = 'none';
  }));

  petForm.addEventListener('submit', async e => {
    e.preventDefault();
    const id    = petForm.anuncioId.value;
    const t     = petForm.titulo.value.trim();
    const d     = petForm.descricao.value.trim();
    const i     = petForm.idade.value.trim();
    const s     = petForm.sexo.value;
    const code  = inputCode.value.trim().replace(/\D/g,'');
    const num   = inputNum.value.trim().replace(/\D/g,'');
    if (!/^\d{1,3}$/.test(code)||!/^\d{8,}$/.test(num)) {
      erroTel.style.display = 'block'; return;
    }
    const payload = { titulo:t, descricao:d, idade:parseInt(i), sexo:s, phoneCountry:code, phoneNumber:num, imagem_url:petForm.existingImageUrl.value||'' };
    const url    = id ? `${baseUrl}/anuncios/${id}` : `${baseUrl}/anuncios`;
    const method = id ? 'PUT' : 'POST';
    const r = await fetch(url, { method, headers, body: JSON.stringify(payload) });
    if (!r.ok) return alert(`Erro ${r.status}`);
    modal.classList.remove('active');
    petForm.reset();
    load();
  });

  load();
});
