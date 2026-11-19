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

// Ilustrações vetoriais embutidas para os exemplos iniciais nunca falharem (nem offline)
const FOTO_EXEMPLO_1 = "data:image/svg+xml;utf8,<svg xmlns='http://w3.org' width='600' height='360' viewBox='0 0 600 360'><rect width='600' height='360' fill='%23e5d2c4'/><circle cx='300' cy='150' r='65' fill='%2396305a'/><ellipse cx='245' cy='125' rx='22' ry='42' transform='rotate(-20 245 125)' fill='%237a2347'/><ellipse cx='355' cy='125' rx='22' ry='42' transform='rotate(20 355 125)' fill='%237a2347'/><circle cx='280' cy='140' r='7' fill='white'/><circle cx='320' cy='140' r='7' fill='white'/><ellipse cx='300' cy='165' rx='12' ry='9' fill='%233b2f2f'/><text x='300' y='285' font-family='sans-serif' font-size='22' font-weight='bold' fill='%2396305a' text-anchor='middle'>Thor - Golden Retriever</text></svg>";

const FOTO_EXEMPLO_2 = "data:image/svg+xml;utf8,<svg xmlns='http://w3.org' width='600' height='360' viewBox='0 0 600 360'><rect width='600' height='360' fill='%23f2e8e1'/><polygon points='240,120 265,65 290,115' fill='%23ca678e'/><polygon points='360,120 335,65 310,115' fill='%23ca678e'/><circle cx='300' cy='155' r='60' fill='%23ca678e'/><circle cx='280' cy='145' r='7' fill='white'/><circle cx='320' cy='145' r='7' fill='white'/><polygon points='293,165 307,165 300,174' fill='%2396305a'/><text x='300' y='285' font-family='sans-serif' font-size='22' font-weight='bold' fill='%2396305a' text-anchor='middle'>Mel - Felino Domestico</text></svg>";

const petsIniciais = [
  {
    id: 1,
    status: 'Perdido',
    nome: 'Thor',
    descricao: 'Golden Retriever dócil, usa coleira azul com identificação. Visto pela última vez próximo à praça central.',
    contato: '(67) 99888-7766',
    localizacao: '-22.24920, -53.34250',
    foto: FOTO_EXEMPLO_1,
    favorito: true
  },
  {
    id: 2,
    status: 'Encontrado',
    nome: 'Mel',
    descricao: 'Gatinha encontrada próximo à região central, porte médio, muito mansa e bem cuidada.',
    contato: '(67) 99123-4567',
    localizacao: '-22.25150, -53.34600',
    foto: FOTO_EXEMPLO_2,
    favorito: false
  }
];

function obterPets() {
  const dados = localStorage.getItem('buscapet_dados_final');
  if (!dados) {
    localStorage.setItem('buscapet_dados_final', JSON.stringify(petsIniciais));
    return petsIniciais;
  }
  return JSON.parse(dados);
}

function salvarPets(lista) {
  localStorage.setItem('buscapet_dados_final', JSON.stringify(lista));
}

function iniciarMapaCard(elementoId, coordsTexto) {
  const box = document.getElementById(elementoId);
  if (!box) return;

  const partes = coordsTexto.split(',');
  const lat = parseFloat(partes.at(0).trim());
  const lon = parseFloat(partes.at(1).trim());

  if (typeof L !== 'undefined' && !isNaN(lat) && !isNaN(lon)) {
    const mapa = L.map(elementoId, { zoomControl: false }).setView([lat, lon], 16);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(mapa);
    L.marker([lat, lon]).addTo(mapa);
    setTimeout(() => mapa.invalidateSize(), 300);
  } else {
    box.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;background:#f2e8e1;color:#96305a;font-weight:700;font-size:13px;">Coordenadas GPS: ' + coordsTexto + '</div>';
  }
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
    const linkRota = 'https://openstreetmap.org' + coords.split(',').at(0) + '&mlon=' + coords.split(',').at(1) + '#map=17/' + coords.replace(',', '/');
    const classeBadge = pet.status === 'Perdido' ? 'perdido' : 'encontrado';
    const classeBotao = pet.favorito ? 'secundario' : 'outline';
    const textoBotao = pet.favorito ? 'Remover dos Salvos' : 'Salvar Registro';

    return '<div class="card">' +
      '<img class="foto-pet" src="' + pet.foto + '" alt="' + pet.nome + '">' +
      '<div class="topo-card">' +
        '<span class="badge ' + classeBadge + '">' + pet.status.toUpperCase() + '</span>' +
        '<span style="font-size:12px; color:var(--texto-suave); font-weight:600;">GPS: ' + pet.localizacao + '</span>' +
      '</div>' +
      '<h3>' + pet.nome + '</h3>' +
      '<p class="desc">' + pet.descricao + '</p>' +
      '<div class="info-box">' +
        '<p><strong>Contato:</strong> ' + pet.contato + '</p>' +
        '<p><strong>Localização:</strong> <a href="' + linkRota + '" target="_blank">Ver ponto exato no mapa</a></p>' +
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

// Mapa interativo na tela de Reportar (salva coordenadas e pino)
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
  setTimeout(() => mapaCad.invalidateSize(), 300);

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
            btnGps.textContent = 'Localização GPS Capturada';
          },
          () => {
            btnGps.textContent = 'Capturar Localização Atual (GPS)';
            alert('GPS automático indisponível neste dispositivo. Clique em qualquer ponto do mapa abaixo para marcar o local exato.');
          },
          { enableHighAccuracy: true, timeout: 6000 }
        );
      }
    });
  }
}

// Salvar novo pet com foto real (câmera/galeria) e coordenadas GPS
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
      body: mensagem
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
