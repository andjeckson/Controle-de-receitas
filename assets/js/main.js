

const WORKER_URL = "https://controledereceitas.andjeckson.workers.dev/";
const $ = document.querySelector.bind(document);

// Atalho para eventos
HTMLElement.prototype.on = function(evento, callback) {
    this.addEventListener(evento, callback);
    return this;
};

let barraDePesquisa     = $('#pesquisar')
let botaoApagarPesquisa = $('#botao-limpar-pesquisa')

botaoApagarPesquisa.onclick = ()=> {
    barraDePesquisa.value = ''
    pesquisarPaciente()
}

barraDePesquisa.oninput = ()=> pesquisarPaciente()


function pesquisarPaciente(){
    let valor = barraDePesquisa.value
    let cards = $('.receitas-grid').querySelectorAll('.receita-card')
    
        cards.forEach((card, i)=>{
            let nomeDoPaciente = card.querySelector('.nome-paciente').textContent
            
            if( String(nomeDoPaciente).startsWith(valor)){
                 card.style.display = ''
            }else{
                 card.style.display = 'none'
            }
        })
}


// Estado global da aplicação
let receitasAtuais = [];

//Procura a lista de pacientes no Cloudflare Worker

async function carregarDados() {
    const container = $('#container-receitas');
    if (!container) return;

    container.innerHTML = `<div class="loading"><i class='bx bx-loader-alt bx-spin'></i> Sincronizando dados...</div>`;

    try {
        const response = await fetch(WORKER_URL);
        if (!response.ok) throw new Error("Erro ao conectar no servidor.");
        
        // O Worker corrigido retorna [] se estiver vazio
        receitasAtuais = await response.json();
        renderizarCards(receitasAtuais);
    } catch (error) {
        console.error(error);
        container.innerHTML = `<p class="error-msg">Não foi possível carregar as receitas. Verifique a ligação.</p>`;
    }
}

/**

 * Desenha os cards na tela com suporte a Quantidade e Unidade
 */
 
function renderizarCards(lista) {
    const container = $('#container-receitas');
    if (!container || !lista) return;

    if (lista.length === 0) {
        container.innerHTML = "<p>Nenhuma receita encontrada.</p>";
        return;
    }

    container.innerHTML = lista.map(item => {
        const dataFormatada = new Date(item.ultimaRenovacao).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
        
        // Lista de medicamentos formatada com os novos campos
        const medsHTML = item.medicamentos.map(m => `
            <li class="item-medicamento">
                <span class="medicamento-nome"><i class='bx bxs-capsule'></i> ${m.nome}</span>
                <span class="medicamento-status"><i class="bx bx-package"></i>${m.quantidade} ${m.unidade}</span>
            </li>
        `).join('');

        return `
            <article class="receita-card">
                <header class="receita-header">
                    <div class="avatar-paciente"><i class='bx bx-user'></i></div>
                    <h3 class="nome-paciente">${item.paciente}</h3>
                </header>
                <div class="receita-corpo">
                    <h4 class="titulo-sessao">Medicamentos</h4>
                    <ul class="lista-medicamentos">${medsHTML}</ul>
                </div>
                <footer class="receita-footer">
                    <div class="data-info">
                        <i class='bx bx-calendar'></i>
                        <div class="data-texto">
                            <span>Renovada em:</span>
                            <strong>${dataFormatada}</strong>
                        </div>
                    </div>
                    <div class="acoes-botoes">
                        <button class="btn-acao btn-editar" onclick="prepararEdicao(${item.id})">
                            <i class='bx bx-pencil'></i>
                        </button>
                        <button class="btn-acao btn-excluir" onclick="excluirRegistro(${item.id})">
                            <i class='bx bx-trash'></i>
                        </button>
                    </div>
                </footer>
            </article>`;
    }).join('');
}

/**
 * 3. LÓGICA DO MODAL (DINÂMICA)
 * Gera o template idêntico à imagem (Nome, Qtd, Unidade)
 */
function gerarTemplateLinha(nome = '', qtd = '', unidade = 'Comprimidos') {
    return `
        <div class="med-card-edit">
            <div class="med-card-row-1">
                <input type="text" value="${nome}" class="input-med-nome" placeholder="Nome do medicamento">
                <button type="button" class="btn-del-med" onclick="this.parentElement.parentElement.remove()">
                    <i class='bx bx-trash'></i>
                </button>
            </div>
            <div class="med-card-row-2">
                <input type="number" value="${qtd}" class="input-med-qtd" placeholder="Quantidade">
                <select class="input-med-unidade" onchange="validarInput(this)">
                    <option value="Contínuo" ${unidade === 'Contínuo' ? 'selected' : ''}>Contínuo</option>
                    <option value="Comprimidos" ${unidade === 'Comprimidos' ? 'selected' : ''}>Comprimidos</option>
                    <option value="Caixa(s)" ${unidade === 'Caixa(s)' ? 'selected' : ''}>Caixa(s)</option>
                    <option value="Ampola(s)" ${unidade === 'Ampola(s)' ? 'selected' : ''}>Ampola(s)</option>
                    <option value="Frasco(s)" ${unidade === 'Frasco(s)' ? 'selected' : ''}>Frasco(s)</option>
                    <option value="Tubo(s)" ${unidade === 'Tubo(s)' ? 'selected' : ''}>Tubo(s)</option>
                </select>
            </div>
        </div>
    `;
}


function validarInput(seletor){
    let inputMedQtd = seletor.parentElement.querySelector('.input-med-qtd')
    
    let valor = seletor.value
    
    if(valor != 'Contínuo'){
        inputMedQtd.disabled = false
    }else{
        inputMedQtd.value = ''
        inputMedQtd.disabled = true
    }
}

function adicionarLinhaMedicamento() {
    const container = $('#container-meds-edit');
    const div = document.createElement('div');
    div.innerHTML = gerarTemplateLinha();
    container.appendChild(div.firstElementChild);
}

/**
 * Funções para Abrir/Fechar o Modal de Cadastro
 */
function abrirModalNovo() {
    // Limpa o formulário antes de abrir
    $('#form-novo').reset();
    $('#container-meds-novo').innerHTML = gerarTemplateLinha(); // Começa com uma linha vazia
    
    // Define a data de hoje como padrão (opcional, igual à imagem)
    const hoje = new Date().toISOString().split('T')[0];
    $('#novo-data').value = hoje;
    
    $('#modal-novo').classList.add('aberto');
}

function fecharModalNovo() {
    $('#modal-novo').classList.remove('aberto');
}

// Atalho para adicionar linha no modal de cadastro
function adicionarLinhaNovo() {
    const container = $('#container-meds-novo');
    const div = document.createElement('div');
    div.innerHTML = gerarTemplateLinha();
    container.appendChild(div.firstElementChild);
}

/**
 * Evento de Salvar Nova Receita
 */
$('#form-novo').on('submit', async function(e) {
    e.preventDefault();
    const btnSalvar = this.querySelector('.btn-update');

    // 1. Coleta os medicamentos do novo formulário
    const cards = document.querySelectorAll('#container-meds-novo .med-card-edit');
    const medicamentos = Array.from(cards).map(card => ({
        nome: card.querySelector('.input-med-nome').value.trim(),
        quantidade: card.querySelector('.input-med-qtd').value.trim(),
        unidade: card.querySelector('.input-med-unidade').value
    }));

    // 2. Cria o novo objeto (gera um ID baseado no timestamp)
    const novaReceita = {
        id: Date.now(),
        paciente: $('#novo-nome').value.trim(),
        ultimaRenovacao: $('#novo-data').value,
        medicamentos: medicamentos
    };

    // 3. Adiciona à lista existente
    const listaAtualizada = [...receitasAtuais, novaReceita];

    // 4. Envia para o Worker
    btnSalvar.disabled = true;
    btnSalvar.innerText = "Salvando...";

    try {
        const response = await fetch(WORKER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(listaAtualizada)
        });

        if (!response.ok) throw new Error("Erro ao salvar");

        receitasAtuais = listaAtualizada;
        renderizarCards(receitasAtuais);
        fecharModalNovo();
        alert("Paciente cadastrado com sucesso!");
    } catch (error) {
        alert("Erro de conexão com o servidor.");
    } finally {
        btnSalvar.disabled = false;
        btnSalvar.innerText = "Salvar";
    }
});


/**
 * 4. ABRIR E FECHAR MODAL
 */
function prepararEdicao(id) {
    const r = receitasAtuais.find(item => item.id === id);
    if (!r) return;

    $('#edit-id').value = r.id;
    $('#edit-nome').value = r.paciente;
    $('#edit-data').value = r.ultimaRenovacao;

    const containerMeds = $('#container-meds-edit');
    // Preenche o modal com os medicamentos existentes (ou linha vazia se não houver)
    containerMeds.innerHTML = r.medicamentos.length > 0 
        ? r.medicamentos.map(m => gerarTemplateLinha(m.nome, m.quantidade, m.unidade)).join('')
        : gerarTemplateLinha();

    $('#modal-edicao').classList.add('aberto');
}

function fecharModal() {
    $('#modal-edicao').classList.remove('aberto');
}

/**
 * 5. SALVAR NO WORKER (POST)
 * Envia a lista completa para o Cloudflare KV
 */
$('#form-edicao').on('submit', async function(e) {
    e.preventDefault();
    const btnSalvar = this.querySelector('.btn-update');
    
    // Captura os dados dos cards de medicamentos
    const cards = document.querySelectorAll('.med-card-edit');
    const medicamentosAtualizados = Array.from(cards).map(card => ({
        nome: card.querySelector('.input-med-nome').value.trim(),
        quantidade: card.querySelector('.input-med-qtd').value.trim(),
        unidade: card.querySelector('.input-med-unidade').value
    }));

    const idEditado = parseInt($('#edit-id').value);

    // Atualiza a lista global (Optimistic Update)
    const novaLista = receitasAtuais.map(r => r.id === idEditado ? {
        ...r,
        paciente: $('#edit-nome').value.trim(),
        ultimaRenovacao: $('#edit-data').value,
        medicamentos: medicamentosAtualizados
    } : r);

    // Feedback visual
    btnSalvar.disabled = true;
    btnSalvar.innerText = "Sincronizando...";

    try {
        const response = await fetch(WORKER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novaLista)
        });

        if (!response.ok) throw new Error("Erro ao salvar");

        receitasAtuais = novaLista;
        renderizarCards(receitasAtuais);
        fecharModal();
    } catch (error) {
        alert("Erro ao guardar dados no servidor.");
    } finally {
        btnSalvar.disabled = false;
        btnSalvar.innerText = "Atualizar";
    }
});

/**
 * 6. EXCLUIR REGISTRO
 */
async function excluirRegistro(id) {
    if (!confirm("Deseja eliminar esta receita permanentemente?")) return;

    const novaLista = receitasAtuais.filter(r => r.id !== id);

    try {
        const response = await fetch(WORKER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novaLista)
        });

        if (response.ok) {
            receitasAtuais = novaLista;
            renderizarCards(receitasAtuais);
        }
    } catch (error) {
        alert("Erro ao eliminar no servidor.");
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', carregarDados);



        
let $scrollReveal = ScrollReveal({
    duration: 1000,
    opacity: 0,
    distance: '20px',
    direction: 'bottom',
    reset: true
})

$scrollReveal.reveal('.receitas-grid .receita-card')
