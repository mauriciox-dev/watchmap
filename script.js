// --- CONFIGURAÇÕES DA API (VERSÃO SEGURA - SEM CHAVE!) ---
const BASE_URL_BUSCA = '/api/busca';
const BASE_URL_DETALHES = '/api/detalhes';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// --- O HTML DO SPINNER (Carregamento) ---
const LOADING_SPINNER_HTML = `
    <div class="spinner-container">
        <div class="loading-spinner"></div>
    </div>
`;

// --- URL DA IMAGEM GENÉRICA (Placeholder) ---
const PLACEHOLDER_IMG_URL = 'https://placehold.co/500x750/333/999?text=Sem+P%C3%B4ster&font=monserrat';


// --- PEGANDO OS ELEMENTOS DO HTML ---
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const resultsContainer = document.getElementById('results-container');
const modalOverlay = document.getElementById('modal-overlay');
const closeModalBtn = document.getElementById('close-modal-btn');
const modalMovieTitle = document.getElementById('modal-movie-title');
// Novos elementos do modal (Nível 3)
const modalYear = document.getElementById('modal-year');
const modalRatingValue = document.getElementById('modal-rating-value');
const modalOverview = document.getElementById('modal-overview');

const streamingProvidersContainer = document.getElementById('streaming-providers');


// --- OUVINTES DE EVENTOS ---
searchForm.addEventListener('submit', function(event) {
    event.preventDefault();
    const termoBuscado = searchInput.value;
    if (termoBuscado.trim() !== "") {
        buscarConteudo(termoBuscado);
    }
});

closeModalBtn.addEventListener('click', fecharModal);
modalOverlay.addEventListener('click', function(event) {
    if (event.target === modalOverlay) {
        fecharModal();
    }
});


// --- FUNÇÕES AUXILIARES ---
function abrirModal() {
    modalOverlay.classList.remove('hidden');
}

function fecharModal() {
    modalOverlay.classList.add('hidden');
    streamingProvidersContainer.innerHTML = '<p>Carregando opções...</p>';
    modalMovieTitle.textContent = '';
    // Limpa os dados novos ao fechar
    modalYear.textContent = '';
    modalRatingValue.textContent = '';
    modalOverview.textContent = '';
}


// --- FUNÇÃO PRINCIPAL DE BUSCA ---
async function buscarConteudo(termo) {
    const urlDoPedido = `${BASE_URL_BUSCA}?q=${encodeURIComponent(termo)}`;

    try {
        // Mostra o spinner antes de buscar
        resultsContainer.innerHTML = LOADING_SPINNER_HTML;

        const resposta = await fetch(urlDoPedido);
        if (!resposta.ok) throw new Error('Erro ao buscar conteúdo');
        const dados = await resposta.json();

        // Filtra para mostrar apenas filmes e séries
        const resultadosFiltrados = dados.results.filter(item => item.media_type === 'movie' || item.media_type === 'tv');

        mostrarResultados(resultadosFiltrados);

    } catch (erro) {
        console.error(erro);
        resultsContainer.innerHTML = '<p style="text-align:center; color: red; grid-column: 1/-1;">Ops! Algo deu errado na busca.</p>';
    }
}


// --- FUNÇÃO QUE MOSTRA OS PÔSTERES ---
function mostrarResultados(listaDeItens) {
    resultsContainer.innerHTML = '';

    if (listaDeItens.length === 0) {
        resultsContainer.innerHTML = '<p style="text-align:center; grid-column: 1/-1;">Nenhum filme ou série encontrado.</p>';
        return;
    }

    listaDeItens.forEach(item => {
        const movieCard = document.createElement('div');
        movieCard.classList.add('movie-card');

        const tituloCorreto = item.title || item.name;

        // --- Lógica do Clique no Cartão (Atualizada Nível 3) ---
        movieCard.addEventListener('click', function() {
            // 1. Preenche o Título
            modalMovieTitle.textContent = tituloCorreto;

            // 2. Lógica para o Ano
            const dataBruta = item.release_date || item.first_air_date;
            const anoApenas = dataBruta ? dataBruta.split('-')[0] : 'N/A';
            modalYear.textContent = anoApenas;

            // 3. Lógica para a Nota
            modalRatingValue.textContent = item.vote_average ? item.vote_average.toFixed(1) : '?';

            // 4. Lógica para a Sinopse
            modalOverview.textContent = item.overview || "Sinopse não disponível para este título.";

            // 5. Abre o modal e busca os streamings
            abrirModal();
            buscarOndeAssistir(item.id, item.media_type);
        });

        const posterImg = document.createElement('img');

        // --- Lógica do Placeholder (Nível 2) ---
        if (item.poster_path) {
            posterImg.src = IMAGE_BASE_URL + item.poster_path;
        } else {
            posterImg.src = PLACEHOLDER_IMG_URL;
        }

        posterImg.alt = `Pôster de ${tituloCorreto}`;

        const movieTitle = document.createElement('h3');
        movieTitle.textContent = tituloCorreto;

        movieCard.appendChild(posterImg);
        movieCard.appendChild(movieTitle);
        resultsContainer.appendChild(movieCard);
    });
}


// --- FUNÇÃO: BUSCAR ONDE ASSISTIR ---
async function buscarOndeAssistir(contentId, mediaType) {
    const urlProvider = `${BASE_URL_DETALHES}?id=${contentId}&type=${mediaType}`;

    try {
        const resposta = await fetch(urlProvider);
        if (!resposta.ok) throw new Error('Erro ao buscar providers');
        const dados = await resposta.json();

        if (dados.results && dados.results.BR) {
            const opcoesBR = dados.results.BR.flatrate || dados.results.BR.rent;

            if (opcoesBR && opcoesBR.length > 0) {
                mostrarLogosStreamings(opcoesBR);
            } else {
                streamingProvidersContainer.innerHTML = '<p>Não encontrado em serviços populares no Brasil no momento.</p>';
            }

        } else {
            streamingProvidersContainer.innerHTML = '<p>Informações de streaming não disponíveis para o Brasil.</p>';
        }

    } catch (erro) {
        console.error(erro);
        streamingProvidersContainer.innerHTML = '<p>Erro ao carregar opções de streaming.</p>';
    }
}


// --- FUNÇÃO: DESENHAR OS LOGOS ---
function mostrarLogosStreamings(listaStreamings) {
    streamingProvidersContainer.innerHTML = '';
    listaStreamings.forEach(streaming => {
        const providerItem = document.createElement('div');
        providerItem.classList.add('provider-item');

        const logoImg = document.createElement('img');
        logoImg.src = IMAGE_BASE_URL + streaming.logo_path;
        logoImg.alt = `Logo ${streaming.provider_name}`;

        const providerName = document.createElement('span');
        providerName.textContent = streaming.provider_name;

        providerItem.appendChild(logoImg);
        providerItem.appendChild(providerName);
        streamingProvidersContainer.appendChild(providerItem);
    });
}