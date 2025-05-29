let adsData = [];

// Adiciona uma nova linha na tabela para um anúncio
function addAdToTable(ad) {
  // Garantir que não haja duplicação de código de país no número
  let country = ad.phoneCountry ? ad.phoneCountry.toString().replace(/\D/g, '') : '';
  let number  = ad.phoneNumber ? ad.phoneNumber.toString().replace(/\D/g, '') : '';
  // Monta a linha da tabela com os dados do anúncio
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>${ad.titulo}</td>
    <td>${ad.descricao}</td>
    <td>+${country}${number}</td>
    <td>
      <a href="https://wa.me/${country}${number}" target="_blank">WhatsApp</a>
      <button class="btnEdit"
              data-id="${ad.id}"
              data-titulo="${ad.titulo}"
              data-descricao="${ad.descricao}"
              data-phone-country="${country}"
              data-phone-number="${number}">
        Editar
      </button>
    </td>
  `;
  document.querySelector('#adsTable tbody').appendChild(tr);
}

// Abre o modal preenchendo os campos para editar um anúncio existente
function openModalForEdit(ad) {
  document.getElementById('adId').value = ad.id;
  document.getElementById('titulo').value = ad.titulo;
  document.getElementById('descricao').value = ad.descricao;
  document.getElementById('phoneCountry').value = ad.phoneCountry || '';
  document.getElementById('phoneNumber').value = ad.phoneNumber || '';
  document.getElementById('modalTitle').innerText = 'Editar Anúncio';
  document.getElementById('adModal').classList.add('show');  // exibe o modal
}

// Abre o modal com campos vazios para cadastrar um novo anúncio
function openModalForNew() {
  document.getElementById('adForm').reset();  // limpa todos os campos do formulário
  document.getElementById('adId').value = '';
  // Opcional: definir um código de país padrão, por exemplo '55'
  // document.getElementById('phoneCountry').value = '55';
  document.getElementById('modalTitle').innerText = 'Novo Anúncio';
  document.getElementById('adModal').classList.add('show');  // exibe o modal
}

// Fecha/oculta o modal
function closeModal() {
  document.getElementById('adModal').classList.remove('show');
}

// Lida com o envio do formulário para criar ou editar um anúncio
function handleFormSubmit(event) {
  event.preventDefault();
  // Obtém valores dos campos do formulário
  const id         = document.getElementById('adId').value;
  const titulo     = document.getElementById('titulo').value.trim();
  const descricao  = document.getElementById('descricao').value.trim();
  let phoneCountry = document.getElementById('phoneCountry').value.trim();
  let phoneNumber  = document.getElementById('phoneNumber').value.trim();
  if (!titulo || !descricao || !phoneCountry || !phoneNumber) {
    return;  // validação básica (campos obrigatórios)
  }
  // Remove qualquer caractere não numérico (como '+' ou espaços) dos campos de telefone
  phoneCountry = phoneCountry.replace(/\D/g, '');
  phoneNumber  = phoneNumber.replace(/\D/g, '');
  // Monta o objeto com os dados do anúncio
  const adData = {
    titulo: titulo,
    descricao: descricao,
    phoneCountry: phoneCountry,
    phoneNumber: phoneNumber
  };

  if (id) {
    // Atualização de anúncio existente (edição)
    adData.id = id;
    fetch(`/api/anuncios/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(adData)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Erro ao atualizar anúncio');
      }
      // Atualiza os dados locais (adsData) com as novas informações
      const index = adsData.findIndex(item => item.id == id);
      if (index !== -1) {
        adsData[index] = adData;
      }
      // Atualiza a linha correspondente na tabela (evitando duplicar código do país)
      const editBtn = document.querySelector(`button[data-id="${id}"]`);
      if (editBtn) {
        editBtn.dataset.titulo = titulo;
        editBtn.dataset.descricao = descricao;
        editBtn.dataset.phoneCountry = phoneCountry;
        editBtn.dataset.phoneNumber = phoneNumber;
        const row = editBtn.closest('tr');
        if (row) {
          row.children[0].textContent = titulo;
          row.children[1].textContent = descricao;
          row.children[2].textContent = `+${phoneCountry}${phoneNumber}`;
          const waLink = row.querySelector('a[href^="https://wa.me/"]');
          if (waLink) {
            waLink.href = `https://wa.me/${phoneCountry}${phoneNumber}`;
          }
        }
      }
      closeModal();  // fecha o modal após atualizar
    })
    .catch(error => {
      console.error(error);
      alert(error.message);
    });
  } else {
    // Criação de um novo anúncio
    fetch('/api/anuncios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(adData)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Erro ao criar anúncio');
      }
      return response.json();
    })
    .then(newAd => {
      // Insere o novo anúncio na lista local e na tabela
      adsData.push(newAd);
      addAdToTable(newAd);
      closeModal();  // fecha o modal após cadastrar
    })
    .catch(error => {
      console.error(error);
      alert(error.message);
    });
  }
}

// Configura os event listeners após carregar o DOM
document.addEventListener('DOMContentLoaded', function() {
  // Carrega os anúncios existentes (supondo que exista uma API para listar anúncios)
  fetch('/api/anuncios')
    .then(response => response.json())
    .then(data => {
      adsData = data;
      data.forEach(ad => addAdToTable(ad));
    })
    .catch(err => console.error('Erro ao carregar anúncios:', err));

  // Botão "Novo Anúncio"
  document.getElementById('btnNewAd').addEventListener('click', openModalForNew);
  // Botão de fechar (X) do modal
  document.getElementById('modalClose').addEventListener('click', closeModal);
  // Delegação de evento para botões "Editar" na tabela
  document.querySelector('#adsTable tbody').addEventListener('click', function(e) {
    if (e.target && e.target.classList.contains('btnEdit')) {
      const btn = e.target;
      const adId = btn.getAttribute('data-id');
      // Busca os dados do anúncio (nos dados locais ou via atributos data)
      let ad = adsData.find(item => item.id == adId);
      if (!ad) {
        ad = {
          id: adId,
          titulo: btn.getAttribute('data-titulo'),
          descricao: btn.getAttribute('data-descricao'),
          phoneCountry: btn.getAttribute('data-phone-country'),
          phoneNumber: btn.getAttribute('data-phone-number')
        };
      }
      openModalForEdit(ad);
    }
  });
  // Submissão do formulário (botão "Salvar")
  document.getElementById('adForm').addEventListener('submit', handleFormSubmit);
});
