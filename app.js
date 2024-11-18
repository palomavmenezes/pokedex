const API_URL = 'https://pokeapi.co/api/v2/pokemon?limit=10000&offset=0';
const TYPE_URL = 'https://pokeapi.co/api/v2/type/';
const pokedex = document.getElementById('pokedex');
const typeFilter = document.getElementById('type-filter');
const searchInput = document.getElementById('search');
const currentPageSpan = document.getElementById('current-page');
const modal = document.getElementById('modal');
const pokemonDetails = document.getElementById('pokemon-details');
const closeModal = document.getElementById('close-modal');
const paginationContainer = document.getElementById('pagination');

// Criei variáveis de cores para que aparecesse a cor
// referente ao elemento do pokémon que retorna na API
const typeColors = {
  Normal: '#A8A878',
  Fire: '#F08030',
  Water: '#6890F0',
  Electric: '#F8D030',
  Grass: '#78C850',
  Ice: '#98D8D8',
  Fighting: '#C03028',
  Poison: '#A040A0',
  Ground: '#E0C068',
  Flying: '#A890F0',
  Psychic: '#F85888',
  Bug: '#A8B820',
  Rock: '#B8A038',
  Ghost: '#705898',
  Dragon: '#7038F8',
  Dark: '#705848',
  Steel: '#B8B8D0',
  Fairy: '#EE99AC',
  Unknown: '#A8A8A8',
};

let pokemonList = [];
let filteredPokemon = [];
let currentPage = 1;
const PAGE_SIZE = 18;
const pokemonCache = {};

// Busca dados de todos os Pokémons e armazena no cache
// Armazenei os dados no cache para que não recarregue a página
// toda hora que realizar um comando como busca ou filtro
async function fetchPokemonData() {
  const response = await fetch(API_URL);
  const data = await response.json();
  pokemonList = data.results;

  await Promise.all(pokemonList.map(async (pokemon) => {
    const pokemonData = await fetch(pokemon.url).then(res => res.json());
    pokemonCache[pokemonData.name] = pokemonData;
  }));

  filteredPokemon = [...pokemonList];
  renderPage();
}

// Busca pelos tipos de Pokémon
async function fetchTypes() {
  const response = await fetch(TYPE_URL);
  const data = await response.json();
  data.results.forEach((type) => {
    const option = document.createElement('option');
    option.value = type.name;
    option.textContent = capitalizeFirstLetter(type.name);
    typeFilter.appendChild(option);
  });
}

// O nome que vem da API vem todo em lowercase, essa função adiciona o UpperCase na primeira letra
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Renderiza os cards do Pokémon
function renderPage() {
  pokedex.innerHTML = '';
  const start = (currentPage - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const pageData = filteredPokemon.slice(start, end);

  pageData.forEach(async (pokemon) => {
    const pokemonData = pokemonCache[pokemon.name];
    const type = pokemonData?.types.length > 0 
      ? capitalizeFirstLetter(pokemonData.types[0].type.name) 
      : 'Unknown';
    const typeColor = typeColors[type] || '#000';

    const imageUrl = pokemonData.sprites.other['official-artwork'].front_default;

    const card = document.createElement('div');
    card.classList.add('card');
    card.innerHTML = `
      <div class="content-card">
        <header>
          <span style="color: ${typeColor};">${type}</span>
          <span>#${pokemonData.id.toString().padStart(4, '0')}</span>
        </header>
        <img src="${imageUrl}" alt="${capitalizeFirstLetter(pokemonData.name)}">
        <h3>${capitalizeFirstLetter(pokemonData.name)}</h3>
      </div>
    `;
    
    card.addEventListener('mouseenter', (event) => showTooltip(event, 'Clique para ver informações'));
    card.addEventListener('mouseleave', hideTooltip);

    card.addEventListener('click', () => showDetails(pokemon.url));
    pokedex.appendChild(card);
  });

  renderPagination();
}

// Como não foi pedido no teste, adicionei um tooltip para sinalizar o click que
// implementei no card e abrir o modal com algumas informações do Pokémon.
function showTooltip(event, text) {
  const tooltip = document.createElement('div');
  tooltip.classList.add('tooltip');
  tooltip.textContent = text;
  document.body.appendChild(tooltip);

  const { top, left, width } = event.target.getBoundingClientRect();
  tooltip.style.top = `${top - 30}px`;
  tooltip.style.left = `${left + width / 2}px`;
}

function hideTooltip() {
  const tooltip = document.querySelector('.tooltip');
  if (tooltip) tooltip.remove();
}

// Função para filtrar por tipo de Pokémon
typeFilter.addEventListener('change', async () => {
  const type = typeFilter.value;
  searchInput.value = '';
  if (!type) {
    filteredPokemon = [...pokemonList];
  } else {
    const response = await fetch(`${TYPE_URL}${type}`);
    const data = await response.json();
    filteredPokemon = data.pokemon.map(p => p.pokemon);
  }

  currentPage = 1;
  renderPage();
});

// Filtro da busca dos pokémons
searchInput.addEventListener('input', () => {
  const query = searchInput.value.toLowerCase().trim();
  const type = typeFilter.value;

  if (!query && !type) {
    filteredPokemon = [...pokemonList];
  } else {
    filteredPokemon = pokemonList.filter(pokemon => {
      const pokemonName = pokemon.name.toLowerCase();
      const pokemonData = pokemonCache[pokemon.name];
      const pokemonTypes = pokemonData?.types.map(t => t.type.name) || [];
      const matchesType = type ? pokemonTypes.includes(type) : true;
      const matchesQuery = pokemonName.includes(query);

      return matchesType && matchesQuery;
    });
  }

  currentPage = 1;
  renderPage();
});

// Paginação
function renderPagination() {
  paginationContainer.innerHTML = '';

  const totalPages = Math.ceil(filteredPokemon.length / PAGE_SIZE);

  if (totalPages <= 1) return;

  const visiblePages = 3;
  const startPage = Math.max(1, currentPage - Math.floor(visiblePages / 2));
  const endPage = Math.min(totalPages, startPage + visiblePages - 1);
  const adjustedStartPage = Math.max(1, endPage - visiblePages + 1);

  if (currentPage > 1) {
    const prevButton = document.createElement('button');
    prevButton.textContent = 'Anterior';
    prevButton.addEventListener('click', () => {
      currentPage--;
      renderPage();
    });
    prevButton.classList.add('btn-prev');
    paginationContainer.appendChild(prevButton);
  } else {
    const prevButton = document.createElement('button');
    prevButton.textContent = 'Anterior';
    prevButton.classList.add('btn-prev', 'disabled');
    paginationContainer.appendChild(prevButton);
  }

  for (let i = adjustedStartPage; i <= endPage; i++) {
    const pageButton = document.createElement('button');
    pageButton.textContent = i;
    pageButton.classList.add('btn-page');
    if (i === currentPage) {
      pageButton.classList.add('active');
    }
    pageButton.addEventListener('click', () => {
      currentPage = i;
      renderPage();
    });
    paginationContainer.appendChild(pageButton);
  }

  if (currentPage <= totalPages) {
    const nextButton = document.createElement('button');
    nextButton.textContent = 'Próximo';
    nextButton.addEventListener('click', () => {
      currentPage++;
      renderPage();
    });
    nextButton.classList.add('btn-next');
    paginationContainer.appendChild(nextButton);
  } else {
    const nextButton = document.createElement('button');
    nextButton.textContent = 'Próximo';
    nextButton.classList.add('btn-next', 'disabled');
    paginationContainer.appendChild(nextButton);
  }
}

// Aqui retorna os detalhes do Pokémon no Modal
async function showDetails(url) {
  try {
    const pokemonName = url.split('/')[6];
    let pokemonData = pokemonCache[pokemonName];

    if (!pokemonData) {
      const response = await fetch(url);
      const data = await response.json();
      pokemonData = data;

      pokemonCache[pokemonName] = pokemonData;
    }

    const imageUrl = pokemonData.sprites.other['official-artwork'].front_default;

    // Aqui é onde monta o carddo modal
    pokemonDetails.innerHTML = `
      <div class="content-details">
        <h2>Quem é esse Pokémon? É o ${capitalizeFirstLetter(pokemonData.name)}</h2>
        <img src="${imageUrl}" alt="${pokemonData.name}">
        <footer>
          <p>Altura: ${pokemonData.height}</p>
          <p>Peso: ${pokemonData.weight}</p>
          <p>Experiência: ${pokemonData.base_experience}</p>
        </footer>
      </div>
    `;

    modal.classList.remove('hidden');
  } catch (error) {
    alert.error('Algo não funcionou direito...', error);
  }
}

closeModal.addEventListener('click', () => {
  modal.classList.add('hidden');
});

document.addEventListener('DOMContentLoaded', () => {
  modal.classList.add('hidden');
  fetchPokemonData();
  fetchTypes();
});
