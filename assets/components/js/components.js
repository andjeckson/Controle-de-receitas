class AppDropdown extends HTMLElement {
    constructor() {
        super();
        this._root = this.attachShadow({ mode: 'open' });
        this.valor = null;
        this.button = document.createElement('button');
        this.list = document.createElement('ul');

        // Fazemos o bind para garantir que o 'this' seja sempre a classe
        this._handleOutsideClick = this._handleOutsideClick.bind(this);
    }

    connectedCallback() {
        this.render();
        this.setupEvents();
        // Adiciona o listener global
        window.addEventListener('click', this._handleOutsideClick);
    }

    disconnectedCallback() {
        window.removeEventListener('click', this._handleOutsideClick);
    }

    _handleOutsideClick(event) {
        const path = event.composedPath();
        
        if (!path.includes(this)) {
            this.list.classList.remove('abrir');
        }
    }

    setupEvents() {
        // Toggle do Dropdown (usando stopPropagation para não fechar no próprio clique)
        this.button.onclick = (e) => {
            e.stopPropagation(); 
            this.list.classList.toggle('abrir');
        };

        this.list.onclick = (e) => {
            const li = e.target.closest('li');
            if (!li) return;

            const valor = li.dataset.valor;
            this._selecionarEstilo(li);
            this._atualizarEstado(valor);
            this.list.classList.remove('abrir');
            this.dispararEvento(valor);
        };
    }

    // ... (restante dos métodos render, _selecionarEstilo, _atualizarEstado permanecem iguais)
    
    render() {
        const css = this.carregarCSS('assets/components/css/dropdown.css');
        const indexSelecionado = Number(this.getAttribute('selecionar')) || 0;
        const valoresRaw = this.getAttribute('valores') || "";
        const arrayValores = valoresRaw.split(",").map(v => v.trim());

        this.list.innerHTML = '';
        arrayValores.forEach((valor, i) => {
            const li = document.createElement('li');
            li.textContent = valor;
            li.dataset.valor = valor;
            if (i + 1 === indexSelecionado) {
                this._selecionarEstilo(li);
                this._atualizarEstado(valor);
            }
            this.list.appendChild(li);
        });
        this._root.append(css, this.button, this.list);
    }

    _selecionarEstilo(itemSelecionado) {
        this.list.querySelectorAll('li').forEach(li => li.classList.remove('selecionado'));
        itemSelecionado.classList.add('selecionado');
    }

    _atualizarEstado(valor) {
        this.valor = valor;
        this.button.textContent = valor;
    }

    dispararEvento(valor) {
        this.dispatchEvent(new CustomEvent('selecionar', {
            detail: { valor: valor },
            bubbles: true,
            composed: true
        }));
    }

    carregarCSS(url) {
        return Object.assign(document.createElement('link'), {
            rel: 'stylesheet',
            href: url
        });
    }
}

customElements.define('app-dropdown', AppDropdown);



