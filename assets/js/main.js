var $ = document.querySelector.bind(document);

HTMLElement.prototype.on = function(evento, callback){
      return this.addEventListener(evento, callback)
}

// Apaga tudo da barra de pequisa.
const pesquisar    = $('#pesquisar')
const botaoResetar = $('#barra-de-pesquisa #x')
      botaoResetar.on('click', ()=> pesquisar.value='')
