/**
 * WATCHMAP - Arquivo Principal de Lógica (Frontend)
 * * Este arquivo controla toda a interatividade do site:
 * 1. Captura o que o usuário digita na busca.
 * 2. Chama nosso backend seguro na Vercel (/api/...) para buscar dados.
 * 3. Recebe os dados (filmes, detalhes, streamings) e desenha na tela.
 */

// =======================================================
// 1. CONFIGURAÇÕES E CONSTANTES GLOBAIS
// =======================================================

// Rotas para o nosso backend (Serverless Functions na Vercel)
// Usamos caminhos relativos ('/api/...') para que funcione tanto localmente quanto na nuvem.
const BASE_URL_BUSCA = '/api/busca';
const BASE_URL_DETALHES = '/api/detalhes';

// URL base do TMDB para carregar imagens (pôsteres e logos)
// 'w500' define a largura da imagem (500px), bom equilíbrio entre qualidade e performance.
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// HTML do "Spinner" de carregamento.
// É injetado na tela para dar feedback visual enquanto a busca está acontecendo.
const LOADING_SPINNER_HTML = `
    <div class="spinner-container">
        <div class="loading-spinner" aria-label="Carregando..."></div>
    </div>
`;

// URL de uma imagem genérica (placeholder).
// Usada quando a API não retorna um pôster oficial para o filme/série.
const PLACEHOLDER_IMG_URL = 'https://placehold.co/500x750/333/999?text=Sem+P%C3%B4ster&font=monserrat';


// =======================================================
// 2. CAPTURA DE ELEMENTOS DO DOM (HTML)
// =======================================================
// Pegamos referências aos elementos da página que vamos manipular.

// Elementos da Busca e Resultados
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const resultsContainer = document.getElementById('results-container');

// Elementos da Janela Modal (Pop-up de detalhes)
const modalOverlay = document.getElementById('modal-overlay');
const closeModalBtn = document.getElementById('close-modal-btn');
const modalMovieTitle = document.getElementById('modal-movie-title');
const modalYear = document.getElementById('modal-year');
const modalRatingValue = document.getElementById('modal-rating-value');
const modalOverview = document.getElementById('modal-overview');
const streamingProvidersContainer = document.getElementById('streaming-providers');


// =======================================================
// 3. OUVINTES DE EVENTOS (INTERATIVIDADE)
// =======================================================

// Evento: Quando o usuário envia o formulário de busca (aperta Enter ou clica no botão)
searchForm.addEventListener('submit', function(event) {
    event.preventDefault(); // Impede a página de recarregar (comportamento padrão do form)
    const termoBuscado = searchInput.value;
    
    // Só inicia a busca se o usuário digitou algo que não seja só espaços em branco
    if (termoBuscado.trim() !== "") {
        buscarConteudo(termoBuscado);
    }
});

// Eventos: Fechar o Modal
closeModalBtn.addEventListener('click', fecharModal); // Ao clicar no 'X'
modalOverlay.addEventListener('click', function(event) {
    // Ao clicar no fundo escuro (fora da caixinha branca)
    if (event.target === modalOverlay) {
        fecharModal();
    }
});


// =======================================================
// 4. FUNÇÕES AUXILIARES (MODAL)
// =======================================================

// Mostra a janela modal na tela
function abrirModal() {
    modalOverlay.classList.remove('hidden');
    // Uma pequena trava para evitar rolagem da página de fundo quando o modal está aberto (opcional, mas boa prática de UX)
    document.body.style.overflow = 'hidden';
}

// Esconde a janela modal e limpa os dados antigos
function fecharModal() {
    modalOverlay.classList.add('hidden');
    document.body.style.overflow = ''; // Libera a rolagem da página de fundo
    
    // Reseta o conteúdo para evitar que dados do filme anterior "pisquem" ao abrir o próximo
    streamingProvidersContainer.innerHTML = '<p>Carregando opções...</p>';
    modalMovieTitle.textContent = '';
    modalYear.textContent = '';
    modalRatingValue.textContent = '';
    modalOverview.textContent = '';
}


// =======================================================
// 5. FUNÇÕES PRINCIPAIS (LÓGICA DE BUSCA E EXIBIÇÃO)
// =======================================================

/**
 * Função: buscarConteudo(termo)
 * Responsável por chamar o backend para pesquisar filmes/séries.
 */
async function buscarConteudo(termo) {
    // Monta a URL para nosso backend. encodeURIComponent garante que espaços e caracteres especiais não quebrem a URL.
    const urlDoPedido = `${BASE_URL_BUSCA}?q=${encodeURIComponent(termo)}`;

    try {
        // 1. Feedback visual: Mostra o spinner antes de começar o pedido
        resultsContainer.innerHTML = LOADING_SPINNER_HTML;

        // 2. Faz o pedido ao nosso backend (fetch)
        const resposta = await fetch(urlDoPedido);
        
        // Se o backend retornou um erro (ex: 404, 500), lança uma exceção
        if (!resposta.ok) throw new Error('Erro na comunicação com o servidor');
        
        // 3. Converte a resposta de texto para JSON (objeto Javascript)
        const dados = await resposta.json();

        // 4. Filtragem de Segurança no Frontend:
        // Embora o backend já deva filtrar, garantimos aqui que só vamos processar filmes ('movie') ou séries ('tv').
        // Isso descarta resultados indesejados como 'person' (atores).
        const resultadosFiltrados = dados.results.filter(item => item.media_type === 'movie' || item.media_type === 'tv');

        // 5. Chama a função que desenha os resultados na tela
        mostrarResultados(resultadosFiltrados);

    } catch (erro) {
        // Tratamento de Erro: Se algo deu errado (internet caiu, backend fora do ar)
        console.error("Erro na busca:", erro);
        resultsContainer.innerHTML = '<p style="text-align:center; color: var(--color-watch-red); grid-column: 1/-1; font-weight:bold;">Ops! Algo deu errado ao tentar buscar. Tente novamente.</p>';
    }
}


/**
 * Função: mostrarResultados(listaDeItens)
 * Recebe a lista de filmes/séries e cria os cartões (cards) na tela.
 */
function mostrarResultados(listaDeItens) {
    // Limpa o container (remove o spinner ou resultados anteriores)
    resultsContainer.innerHTML = '';

    // Se a busca não retornou nada
    if (listaDeItens.length === 0) {
        resultsContainer.innerHTML = '<p style="text-align:center; grid-column: 1/-1; color: var(--color-text-gray);">Nenhum filme ou série encontrado para essa busca.</p>';
        return; // Sai da função
    }

    // Loop principal: Para cada item encontrado...
    listaDeItens.forEach(item => {
        // 1. Cria o elemento principal do cartão
        const movieCard = document.createElement('div');
        movieCard.classList.add('movie-card');

        // Normaliza o título (filmes usam 'title', séries usam 'name')
        const tituloCorreto = item.title || item.name;

        // 2. Adiciona o evento de CLIQUE no cartão
        // É aqui que preparamos os dados para abrir o Modal
        movieCard.addEventListener('click', function() {
            // Preenche Título
            modalMovieTitle.textContent = tituloCorreto;

            // Preenche Ano (pega só os 4 primeiros dígitos da data: YYYY)
            const dataBruta = item.release_date || item.first_air_date;
            modalYear.textContent = dataBruta ? dataBruta.split('-')[0] : 'N/A';

            // Preenche Nota (arredonda para 1 casa decimal se existir)
            modalRatingValue.textContent = item.vote_average ? item.vote_average.toFixed(1) : '?';

            // Preenche Sinopse (ou texto padrão se não houver)
            modalOverview.textContent = item.overview || "Sinopse não disponível para este título.";

            // Abre o modal e dispara a busca secundária pelos streamings
            abrirModal();
            buscarOndeAssistir(item.id, item.media_type);
        });

        // 3. Cria a Imagem do Pôster
        const posterImg = document.createElement('img');
        // Lógica do Placeholder: Usa imagem oficial se tiver, senão usa a genérica.
        if (item.poster_path) {
            posterImg.src = IMAGE_BASE_URL + item.poster_path;
        } else {
            posterImg.src = PLACEHOLDER_IMG_URL;
        }
        posterImg.alt = `Pôster de ${tituloCorreto}`;
        // Adiciona 'loading="lazy"' para performance (só carrega a imagem quando ela está perto de aparecer na tela)
        posterImg.loading = 'lazy'; 

        // 4. Cria o Título abaixo do pôster
        const movieTitle = document.createElement('h3');
        movieTitle.textContent = tituloCorreto;

        // 5. Monta o cartão e adiciona na grade de resultados
        movieCard.appendChild(posterImg);
        movieCard.appendChild(movieTitle);
        resultsContainer.appendChild(movieCard);
    });
}


/**
 * Função: buscarOndeAssistir(contentId, mediaType)
 * Busca os provedores de streaming para um ID específico.
 */
async function buscarOndeAssistir(contentId, mediaType) {
    // Monta URL para o backend de detalhes, passando ID e Tipo (movie/tv)
    const urlProvider = `${BASE_URL_DETALHES}?id=${contentId}&type=${mediaType}`;

    try {
        const resposta = await fetch(urlProvider);
        if (!resposta.ok) throw new Error('Erro ao buscar providers');
        const dados = await resposta.json();

        // Verifica se existem dados para o Brasil (BR)
        if (dados.results && dados.results.BR) {
            // Junta as opções de "flatrate" (assinatura tipo Netflix) e "rent" (aluguel)
            const opcoesBR = [];
            if (dados.results.BR.flatrate) opcoesBR.push(...dados.results.BR.flatrate);
            if (dados.results.BR.rent) opcoesBR.push(...dados.results.BR.rent);

            // Se encontrou alguma opção, chama a função para desenhar os logos
            if (opcoesBR.length > 0) {
                // Remove duplicatas (às vezes o mesmo streaming aparece em aluguel e assinatura)
                const opcoesUnicas = opcoesBR.filter((v,i,a)=>a.findIndex(t=>(t.provider_id===v.provider_id))===i);
                mostrarLogosStreamings(opcoesUnicas);
            } else {
                streamingProvidersContainer.innerHTML = '<p>Não encontrado em serviços populares no Brasil no momento.</p>';
            }

        } else {
            // Se a API do TMDB não tiver dados para a região BR
            streamingProvidersContainer.innerHTML = '<p>Informações de streaming não disponíveis para o Brasil.</p>';
        }

    } catch (erro) {
        console.error("Erro ao buscar streamings:", erro);
        streamingProvidersContainer.innerHTML = '<p style="color: var(--color-watch-red);">Erro ao carregar opções de streaming.</p>';
    }
}


/**
 * Função: mostrarLogosStreamings(listaStreamings)
 * Desenha os pequenos ícones dos provedores dentro do modal.
 */
function mostrarLogosStreamings(listaStreamings) {
    // Limpa o texto de "Carregando..."
    streamingProvidersContainer.innerHTML = '';
    
    listaStreamings.forEach(streaming => {
        // Cria o container do item (logo + nome)
        const providerItem = document.createElement('div');
        providerItem.classList.add('provider-item');

        // Cria a imagem do logo
        const logoImg = document.createElement('img');
        logoImg.src = IMAGE_BASE_URL + streaming.logo_path;
        logoImg.alt = `Logo ${streaming.provider_name}`;

        // Cria o nome do streaming abaixo do logo
        const providerName = document.createElement('span');
        providerName.textContent = streaming.provider_name;

        // Monta o item e adiciona no container do modal
        providerItem.appendChild(logoImg);
        providerItem.appendChild(providerName);
        streamingProvidersContainer.appendChild(providerItem);
    });
}