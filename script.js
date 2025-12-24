// --- CONFIGURAÇÕES DA API (VERSÃO SEGURA - SEM CHAVE!) ---
const BASE_URL_BUSCA = '/api/busca';
const BASE_URL_DETALHES = '/api/detalhes';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// --- NOVO: O HTML DO SPINNER ---
const LOADING_SPINNER_HTML = `
    <div class="spinner-container">
        <div class="loading-spinner"></div>
    </div>
`;
// -------------------------------
// --- PLACEHOLDER ---
const PLACEHOLDER_IMG_URL = 'https://placehold.co/500x750/333/999?text=Sem+P%C3%B4ster&font=monserrat';
// ----------------------------------

// --- PEGANDO OS ELEMENTOS DO HTML (Igual) ---
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const resultsContainer = document.getElementById('results-container');
const modalOverlay = document.getElementById('modal-overlay');
const closeModalBtn = document.getElementById('close-modal-btn');
const modalMovieTitle = document.getElementById('modal-movie-title');
const streamingProvidersContainer = document.getElementById('streaming-providers');


// --- OUVINTES DE EVENTOS (Igual) ---
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


// --- FUNÇÕES AUXILIARES (Igual) ---
function abrirModal() {
    modalOverlay.classList.remove('hidden');
}

function fecharModal() {
    modalOverlay.classList.add('hidden');
    streamingProvidersContainer.innerHTML = '<p>Carregando opções...</p>';
    modalMovieTitle.textContent = '';
}


// --- FUNÇÃO PRINCIPAL DE BUSCA (Atualizada para usar nosso backend) ---
async function buscarConteudo(termo) {
    // MUDANÇA 3: A URL agora é simples, chamamos nosso backend passando o termo 'q'
    const urlDoPedido = `${BASE_URL_BUSCA}?q=${encodeURIComponent(termo)}`;

try {
    // MUDANÇA AQUI: Usamos a constante do spinner em vez do texto
    resultsContainer.innerHTML = LOADING_SPINNER_HTML;

    const resposta = await fetch(urlDoPedido);
    // ... resto do código
        if (!resposta.ok) throw new Error('Erro ao buscar conteúdo');
        const dados = await resposta.json();

        // O backend já traz tudo, filtramos aqui no front
        const resultadosFiltrados = dados.results.filter(item => item.media_type === 'movie' || item.media_type === 'tv');

        mostrarResultados(resultadosFiltrados);

    } catch (erro) {
        console.error(erro);
        resultsContainer.innerHTML = '<p style="text-align:center; color: red; grid-column: 1/-1;">Ops! Algo deu errado na busca.</p>';
    }
}


// --- FUNÇÃO QUE MOSTRA OS PÔSTERES (ATUALIZADA COM PLACEHOLDER) ---
function mostrarResultados(listaDeItens) {
    resultsContainer.innerHTML = '';

    if (listaDeItens.length === 0) {
        resultsContainer.innerHTML = '<p style="text-align:center; grid-column: 1/-1;">Nenhum filme ou série encontrado.</p>';
        return;
    }

    listaDeItens.forEach(item => {
        // NOTA: Removemos o "if(item.poster_path)" que tinha aqui antes.

        const movieCard = document.createElement('div');
        movieCard.classList.add('movie-card');

        const tituloCorreto = item.title || item.name;

        movieCard.addEventListener('click', function() {
            modalMovieTitle.textContent = tituloCorreto;
            abrirModal();
            buscarOndeAssistir(item.id, item.media_type);
        });

        const posterImg = document.createElement('img');

        // --- AQUI ESTÁ A MÁGICA DO PLACEHOLDER ---
        // Se o item TEM um pôster oficial...
        if (item.poster_path) {
            // ... usamos a imagem do TMDB.
            posterImg.src = IMAGE_BASE_URL + item.poster_path;
        } else {
            // ... caso contrário (se for null ou vazio), usamos nossa imagem genérica.
            posterImg.src = PLACEHOLDER_IMG_URL;
        }
        // -----------------------------------------

        posterImg.alt = `Pôster de ${tituloCorreto}`;

        const movieTitle = document.createElement('h3');
        movieTitle.textContent = tituloCorreto;

        movieCard.appendChild(posterImg);
        movieCard.appendChild(movieTitle);
        resultsContainer.appendChild(movieCard);
    });
}

// --- FUNÇÃO: BUSCAR ONDE ASSISTIR (Atualizada para usar nosso backend) ---
async function buscarOndeAssistir(contentId, mediaType) {

    // MUDANÇA 4: Chamamos nosso backend passando ID e TYPE na URL
    const urlProvider = `${BASE_URL_DETALHES}?id=${contentId}&type=${mediaType}`;

    try {
        const resposta = await fetch(urlProvider);
        if (!resposta.ok) throw new Error('Erro ao buscar providers');
        const dados = await resposta.json();

        // O resto da lógica continua igual, pois os dados chegam no mesmo formato
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


// --- FUNÇÃO: DESENHAR OS LOGOS (Igual) ---
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