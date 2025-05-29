// Referências aos elementos do modal e formulário
const modal = document.getElementById('addModal');
const openModalBtn = document.getElementById('openModal');
const closeModalBtn = document.getElementById('closeModal');
const addForm = document.getElementById('addContactForm');
const contactsTableBody = document.getElementById('contactsTable').getElementsByTagName('tbody')[0];

// Abrir o modal ao clicar no botão de abrir
openModalBtn.onclick = function() {
  modal.style.display = 'block';
};

// Fechar o modal ao clicar no "X"
closeModalBtn.onclick = function() {
  modal.style.display = 'none';
  // Limpar campos do formulário
  addForm.reset();
};

// Fechar o modal ao clicar fora da área do modal (backdrop)
window.onclick = function(event) {
  if (event.target === modal) {
    modal.style.display = 'none';
    addForm.reset();
  }
};

// Função para adicionar uma nova linha na tabela de contatos
function addContactToTable(name, fullPhone) {
  const newRow = contactsTableBody.insertRow();
  // Célula do Nome
  const nameCell = newRow.insertCell(0);
  nameCell.textContent = name;
  // Célula do Telefone com link para WhatsApp
  const phoneCell = newRow.insertCell(1);
  const whatsappLink = document.createElement('a');
  whatsappLink.href = `https://api.whatsapp.com/send?phone=${fullPhone}`;
  whatsappLink.target = "_blank";
  whatsappLink.textContent = fullPhone;
  phoneCell.appendChild(whatsappLink);
  // Célula de Ações (exemplo de botão excluir)
  const actionsCell = newRow.insertCell(2);
  actionsCell.innerHTML = `<button class="delete-btn">Excluir</button>`;
}

// Tratamento do envio do formulário de novo contato
addForm.onsubmit = function(event) {
  event.preventDefault();
  // Obter valores dos campos
  const name = document.getElementById('name').value.trim();
  let country = document.getElementById('countryCode').value.trim();
  let number = document.getElementById('phoneNumber').value.trim();
  // Garantir formatação correta do telefone: +código + número
  if (!country.startsWith('+')) {
    country = '+' + country;
  }
  // Remover espaços ou traços do número (opcional, garante só dígitos)
  number = number.replace(/\D/g, '');
  // Concatenar código do país e número (sem duplicações de +55)
  const fullPhone = country + number;
  // Adicionar o novo contato na tabela
  addContactToTable(name, fullPhone);
  // Fechar o modal e limpar formulário
  modal.style.display = 'none';
  addForm.reset();
};
