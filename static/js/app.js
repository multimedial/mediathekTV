let playlist = [];
let currentIndex = 0;

const player = document.getElementById('tvPlayer');
const videoSource = document.getElementById('videoSource');
const currentTitle = document.getElementById('currentTitle');
const currentMeta = document.getElementById('currentMeta');
const playlistContainer = document.getElementById('playlistContainer');
const playlistSearchQuery = document.getElementById('playlistSearchQuery');
const noResultsMessage = document.getElementById('noResultsMessage');
const searchedKeyword = document.getElementById('searchedKeyword');
const muteBtn = document.getElementById('muteToggleBtn');
const muteIcon = document.getElementById('muteIcon');

async function loadPlaylist() {
    const searchQuery = window.SEARCH_QUERY || "";
    
    // Suchbegriff in der Headerzeile anzeigen
    if (playlistSearchQuery) {
        playlistSearchQuery.textContent = searchQuery ? `Thema: "${searchQuery}"` : 'Standard-Programm';
    }

    const res = await fetch(`/api/playlist?q=${encodeURIComponent(searchQuery)}`);
    const rawPlaylist = await res.json();

    // Doubletten anhand von Titel + Kanal + Laufzeit entfernen
    const seenSignatures = new Set();

    playlist = rawPlaylist.filter(item => {
        if (!item.title || !item.channel) return false;

        // Signatur bilden: Titel + Kanal + Dauer (Laufzeit)
        // Wir gehen davon aus, dass item.duration vorhanden ist (z.B. in Sekunden)
        const duration = item.duration || 0;
        const signature = `${item.channel.trim().toLowerCase()}_${item.title.trim().toLowerCase()}_${duration}`;

        if (seenSignatures.has(signature)) {
            return false;
        }

        seenSignatures.add(signature);
        return true;
    });

    if (playlist.length > 0) {
        noResultsMessage.style.display = 'none';
        renderPlaylist();
        playIndex(0);
    } else {
        searchedKeyword.textContent = `"${searchQuery}"`;
        noResultsMessage.style.display = 'block';

        currentTitle.textContent = "Keine Sendungen vorhanden";
        currentMeta.textContent = "Bitte gib oben einen anderen Begriff ein.";
        playlistContainer.innerHTML = '<div class="no-items-placeholder">Keine Sendungen verfügbar.</div>';
    }
}

function playIndex(index) {
    if (index < 0 || index >= playlist.length) index = 0;
    currentIndex = index;

    const item = playlist[currentIndex];
    videoSource.src = item.video_url;
    player.load();

    // Muted lassen, damit Autoplay zuverlässig funktioniert
    player.muted = true;
    updateMuteUI();

    player.play().catch(e => console.log("Autoplay-Status:", e));

    currentTitle.textContent = item.title;
    currentMeta.textContent = `${item.channel} ${item.topic ? '• ' + item.topic : ''}`;

    updatePlaylistUI();
}

function renderPlaylist() {
    playlistContainer.innerHTML = '';
    playlist.forEach((item, idx) => {
        const div = document.createElement('div');
        div.className = `program-item ${idx === currentIndex ? 'active' : ''}`;
        div.onclick = () => {
            playIndex(idx);
        };
        
        div.innerHTML = `
            <div class="item-channel">${item.channel}</div>
            <div class="item-title">${item.title}</div>
        `;
        playlistContainer.appendChild(div);
    });
}

function updatePlaylistUI() {
    const items = playlistContainer.querySelectorAll('.program-item');
    items.forEach((el, idx) => {
        if (idx === currentIndex) {
            el.classList.add('active');
            playlistContainer.scrollTop = el.offsetTop - playlistContainer.offsetTop;
        } else {
            el.classList.remove('active');
        }
    });
}

function toggleMute() {
    player.muted = !player.muted;
    updateMuteUI();
}

function updateMuteUI() {
    if (player.muted) {
        muteIcon.textContent = '🔇';
        muteBtn.classList.remove('unmuted');
        muteBtn.setAttribute('aria-label', 'Ton einschalten');
    } else {
        muteIcon.textContent = '🔊';
        muteBtn.classList.add('unmuted');
        muteBtn.setAttribute('aria-label', 'Ton stummschalten');
    }
}

// Event-Listener
muteBtn.addEventListener('click', toggleMute);
player.addEventListener('volumechange', updateMuteUI);
player.addEventListener('ended', () => {
    playIndex(currentIndex + 1);
});

// Starten
loadPlaylist();