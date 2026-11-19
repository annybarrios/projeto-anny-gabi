if (typeof lucide !== 'undefined') {
  lucide.createIcons();
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js')
    .then(() => console.log('Service Worker ativo'))
    .catch((err) => console.error('Erro SW:', err));
}

const LAT_PADRAO = -22.24920;
const LON_PADRAO = -53.34250;

const petsIniciais = [
  {
    id: 1,
    status: 'Perdido',
    nome: 'Thor',
    descricao: 'Golden Retriever dócil, usa coleira azul com identificação. Visto pela última vez próximo à praça central.',
    contato: '(67) 99888-7766',
    localizacao: '-22.24920, -53.34250',
    foto: 'https://unsplash.com',
    favorito: true
  },
  {
    id: 2,
    status: 'Encontrado',
    nome: 'Felino Rajado',
    descricao: 'Encontrado próximo à região central, porte médio, aparenta ser doméstico e bem cuidado.',
    contato: '(67) 99123-4567',
    localizacao: '-22.25150, -53.34600',
    foto: 'https://unsplash.com',
    favorito: false
  }
];

function obterPets() {
  const dados = localStorage.getItem('buscapet_dados_v4');
  if (!dados) {
    localStorage.setItem('buscapet_dados_v4', JSON.stringify(petsIniciais));
    return petsIniciais;
  }
  return JSON.parse(dados);
}

function salvarPets(lista) {
  localStorage.setItem('buscapet_dados_v4', JSON.stringify(lista));
}

function iniciarMapaCard(elementoId, coordsTexto) {
  if (typeof L === 'undefined') return;
  const partes = coordsTexto.split(',');
  if (partes.length < 2) return;

  const lat = parseFloat(partes.at(0).trim());
  const lon = parseFloat(partes.at(1).trim());
  if (isNaN(lat) || isNaN(lon)) return;

  const mapa = L.map(elementoId, { zoomControl: false }).setView([lat, lon], 16);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(mapa);

  L.marker([lat, lon]).addTo(mapa);
  setTimeout(() => mapa.invalidateSize(), 250);
}

function renderizarLista(containerId, apenasFavoritos) {
  const container = document.getElementById(containerId);
  if (!container) return;

  let pets = obterPets();
  if (apenasFavoritos) {
    pets = pets.filter(p => p.favorito);
  }

  if (pets.length === 0) {
    container.innerHTML = '<div class="card" style="text-align:center; padding: 30px;"><p class="desc" style="margin:0;">Nenhum registro encontrado nesta seção.</p></div>';
    return;
  }

  container.innerHTML = pets.map(pet => {
    const coords = pet.localizacao.replace(/\s+/g, '');
    const mapDivId = 'mapa-' + containerId + '-' + pet.id;
    const linkRota = 'https://google.com' + coords;
    const classeBadge = pet.status === 'Perdido' ? 'perdido' : 'encontrado';
    const classeBotao = pet.favorito ? 'secundario' : 'outline';
    const textoBotao = pet.favorito ? 'Remover dos Salvos' : 'Salvar Registro';

    return '<div class="card">' +
      '<img class="foto-pet" src="' + pet.foto + '" alt="' + pet.nome + '">' +
      '<div class="topo-card">' +
        '<span class="badge ' + classeBadge + '">' + pet.status.toUpperCase() + '</span>' +
        '<span style="font-size:12px; color:var(--texto-suave); font-weight:600;">' + pet.localizacao + '</span>' +
      '</div>' +
      '<h3>' + pet.nome + '</h3>' +
      '<p class="desc">' + pet.descricao + '</p>' +
      '<div class="info-box">' +
        '<p><strong>Contato:</strong> ' + pet.contato + '</p>' +
        '<p><strong>Localização:</strong> <a href="' + linkRota + '" target="_blank">Abrir rota externa</a></p>' +
      '</div>' +
      '<div id="' + mapDivId + '" class="mapa-mini"></div>' +
      '<button class="' + classeBotao + '" onclick="alternarFavorito(' + pet.id + ')">' + textoBotao + '</button>' +
    '</div>';
  }).join('');

  pets.forEach(pet => {
    const mapDivId = 'mapa-' + containerId + '-' + pet.id;
    iniciarMapaCard(mapDivId, pet.localizacao);
  });
}

function alternarFavorito(id) {
  const pets = obterPets();
  const index = pets.findIndex(p => p.id === id);
  if (index !== -1) {
    pets.at(index).favorito = !pets.at(index).favorito;
    salvarPets(pets);
    renderizarLista('lista-pets', false);
    renderizarLista('lista-favoritos', true);
  }
}

const mapaCadastroBox = document.getElementById('mapa-cadastro-box');
const btnGps = document.getElementById('btn-gps');
const campoLocal = document.getElementById('localizacao');

if (mapaCadastroBox && typeof L !== 'undefined') {
  const mapaCad = L.map('mapa-cadastro-box').setView([LAT_PADRAO, LON_PADRAO], 15);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(mapaCad);

  const marcador = L.marker([LAT_PADRAO, LON_PADRAO]).addTo(mapaCad);
  campoLocal.value = LAT_PADRAO.toFixed(5) + ', ' + LON_PADRAO.toFixed(5);

  mapaCad.on('click', (e) => {
    const lat = e.latlng.lat.toFixed(5);
    const lon = e.latlng.lng.toFixed(5);
    marcador.setLatLng([lat, lon]);
    campoLocal.value = lat + ', ' + lon;
  });

  if (btnGps) {
    btnGps.addEventListener('click', () => {
      btnGps.textContent = 'Obtendo coordenadas GPS...';
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const lat = pos.coords.latitude.toFixed(5);
            const lon = pos.coords.longitude.toFixed(5);
            mapaCad.setView([lat, lon], 16);
            marcador.setLatLng([lat, lon]);
            campoLocal.value = lat + ', ' + lon;
            btnGps.textContent = 'Localização GPS Atualizada';
          },
          () => {
            btnGps.textContent = 'Capturar Localização Atual (GPS)';
            alert('Não foi possível acessar o GPS automático. Clique diretamente no mapa abaixo para marcar o local.');
          },
          { enableHighAccuracy: true, timeout: 6000 }
        );
      }
    });
  }
}

const formPet = document.getElementById('form-pet');
if (formPet) {
  formPet.addEventListener('submit', (e) => {
    e.preventDefault();
    const inputFoto = document.getElementById('foto');
    const arquivoFoto = inputFoto.files.item(0);
    if (!arquivoFoto) return alert('Selecione ou capture uma fotografia do animal.');

    const reader = new FileReader();
    reader.onload = function(event) {
      const novoPet = {
        id: Date.now(),
        status: document.getElementById('status').value,
        nome: document.getElementById('nome').value,
        descricao: document.getElementById('descricao').value,
        contato: document.getElementById('contato').value,
        localizacao: document.getElementById('localizacao').value,
        foto: event.target.result,
        favorito: true
      };

      const pets = obterPets();
      pets.unshift(novoPet);
      salvarPets(pets);

      dispararNotificacao('Novo registro: ' + novoPet.nome + ' (' + novoPet.status + ')');
      window.location.href = 'index.html';
    };
    reader.readAsDataURL(arquivoFoto);
  });
}

function dispararNotificacao(mensagem) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('BuscaPet', {
      body: mensagem,
      icon: './icon.png'
    });
  }
}

const btnNotif = document.getElementById('btn-notificacao');
if (btnNotif) {
  btnNotif.addEventListener('click', () => {
    Notification.requestPermission().then((permissao) => {
      if (permissao === 'granted') {
        dispararNotificacao('Notificações ativadas com sucesso.');
      } else {
        alert('Permissão de notificação negada pelo navegador.');
      }
    });
  });
}

const btnTestarNotif = document.getElementById('btn-testar-notif');
if (btnTestarNotif) {
  btnTestarNotif.addEventListener('click', () => {
    if (Notification.permission === 'granted') {
      dispararNotificacao('Alerta de proximidade: Novo animal registrado na sua região.');
    } else {
      alert('Ative as notificações primeiro.');
    }
  });
}

renderizarLista('lista-pets', false);
renderizarLista('lista-favoritos', true);
