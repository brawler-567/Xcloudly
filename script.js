const SUPABASE_CONFIG = {
    url: 'https://yxxqmabcrffoqegdtfpr.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4eHFtYWJjcmZmb3FlZ2R0ZnByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNDQ3NzcsImV4cCI6MjA3NjkyMDc3N30.0L8en_UyCCyDsqrQ6Ympt5ZsPDv3DujmYmaCbsZ5b0Y'
};

const supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);

const CLOUDINARY_CONFIG = {
    cloudName: 'dfvpw70ig',
    uploadPreset: 'Music_Storage'
};

let musicLibrary = [];
let playlists = [];
let currentSection = 'home';
let currentPlaylist = localStorage.getItem('currentPlaylist') || null;
let currentTrackIndex = 0;
let isPlaying = false;
let currentFile = null;
let currentFileDuration = 0;
let currentFileSize = 0;
let currentPlaylistForAdding = null;
let currentUser = null;
let playlistToDelete = null;
let isMuted = false;
let lastVolume = 50;
let isRepeat = false;
let isShuffle = false;
let originalPlaylistOrder = [];
let currentPlaylistSongs = [];

document.addEventListener('DOMContentLoaded', async function() {
    currentUser = await getCurrentUser();
    console.log('Текущий пользователь:', currentUser);

    await loadMusicLibrary();

    await loadPlaylists();
    
    console.log('Загружено плейлистов:', playlists.length);
    console.log('Загружено песен:', musicLibrary.length);
    
    showSection('home');
    updatePlaylistsSidebar();
    setupDragAndDrop();
    setupFileInput();
    initializeVolume();
    
    document.getElementById('searchInput').addEventListener('input', performSearch);
    updateVolumeIcon(50);
    document.getElementById('audioElement').addEventListener('ended', function() {
        if (isRepeat) {
            this.currentTime = 0;
            this.play();
        } else {
            let songs;
        
            if (isShuffle && currentPlaylistSongs.length > 0) {
                songs = currentPlaylistSongs;
            } else {
                songs = currentPlaylist ? getPlaylistSongs() : musicLibrary;
            }
        
            if (songs.length === 0) return;

            if (currentTrackIndex === songs.length - 1) {
                currentTrackIndex = 0;
            } else {
                currentTrackIndex++;
            }
        
            playSong(songs[currentTrackIndex].id, songs);
        }
        updateAllPlayButtons();
    });
});

async function getCurrentUser() {
    let userId = localStorage.getItem('musicApp_userId');
    
    if (!userId) {
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('musicApp_userId', userId);
    }
    
    return userId;
}

function normalizePlaylistData(playlist) {
    if (!playlist.songs) {
        playlist.songs = [];
        return playlist;
    }

    if (typeof playlist.songs === 'string') {
        try {
            playlist.songs = JSON.parse(playlist.songs);
        } catch (error) {
            console.error('Ошибка парсинга songs:', error);
            playlist.songs = [];
        }
    }

    if (!Array.isArray(playlist.songs)) {
        playlist.songs = [];
    }
    
    return playlist;
}

async function loadMusicLibrary() {
    try {
        const { data, error } = await supabase
            .from('songs')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        musicLibrary = data || [];
        performSearch();
    } catch (error) {
        console.error('Ошибка загрузки библиотеки:', error);
        musicLibrary = [];
    }
}

async function loadPlaylists() {
    try {
        const userId = await getCurrentUser();
        
        const { data, error } = await supabase
            .from('playlists')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        playlists = (data || []).map(normalizePlaylistData);
        
        updatePlaylistsSidebar();

        if (currentPlaylist) {
            const playlistExists = playlists.find(p => p.id === currentPlaylist);
            if (playlistExists) {
                showSection('playlist', currentPlaylist);
            } else {
                currentPlaylist = null;
                localStorage.removeItem('currentPlaylist');
            }
        }
        
    } catch (error) {
        console.error('Ошибка загрузки плейлистов:', error);
        playlists = [];
    }
}

async function addSongToDatabase(songData) {
    try {
        const { data, error } = await supabase
            .from('songs')
            .insert([songData])
            .select();
        
        if (error) throw error;
        
        return data[0];
    } catch (error) {
        console.error('Ошибка добавления в базу:', error);
        throw error;
    }
}

async function createPlaylistInDatabase(playlistData) {
    try {
        const normalizedData = {
            ...playlistData,
            songs: JSON.stringify(playlistData.songs || [])
        };
        
        const { data, error } = await supabase
            .from('playlists')
            .insert([normalizedData])
            .select();
        
        if (error) throw error;

        return normalizePlaylistData(data[0]);
    } catch (error) {
        console.error('Ошибка создания плейлиста:', error);
        throw error;
    }
}

async function updatePlaylistInDatabase(playlistId, updates) {
    try {
        const normalizedUpdates = { ...updates };
        if (updates.songs) {
            normalizedUpdates.songs = JSON.stringify(updates.songs);
        }
        
        const { error } = await supabase
            .from('playlists')
            .update(normalizedUpdates)
            .eq('id', playlistId);
        
        if (error) throw error;

        const playlistIndex = playlists.findIndex(p => p.id === playlistId);
        if (playlistIndex !== -1) {
            playlists[playlistIndex] = {
                ...playlists[playlistIndex],
                ...updates
            };
            playlists[playlistIndex] = normalizePlaylistData(playlists[playlistIndex]);
        }
        
    } catch (error) {
        console.error('Ошибка обновления плейлиста:', error);
        throw error;
    }
}

function setupDragAndDrop() {
    const uploadZone = document.getElementById('uploadZone');
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadZone.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadZone.addEventListener(eventName, unhighlight, false);
    });

    uploadZone.addEventListener('drop', handleDrop, false);
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function highlight() {
    document.getElementById('uploadZone').classList.add('dragover');
}

function unhighlight() {
    document.getElementById('uploadZone').classList.remove('dragover');
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files.length > 0) {
        handleFiles(files);
    }
}

function setupFileInput() {
    document.getElementById('fileInput').addEventListener('change', function() {
        if (this.files.length > 0) {
            handleFiles(this.files);
        }
    });
}

function handleFiles(files) {
    const file = files[0];
    
    if (!file.type.startsWith('audio/')) {
        alert('Пожалуйста, загружайте только аудио файлы!');
        return;
    }

    currentFile = file;
    validateAndPreviewFile(file);
}

function validateAndPreviewFile(file) {
    const audio = new Audio();
    const objectUrl = URL.createObjectURL(file);
    
    audio.src = objectUrl;
    
    audio.addEventListener('loadedmetadata', function() {
        const duration = audio.duration;
        currentFileDuration = duration;
        currentFileSize = file.size;
        
        const minutes = Math.floor(duration / 60);
        const seconds = Math.floor(duration % 60);
        
        const isValid = duration >= 30 && duration <= 300;
        
        document.getElementById('fileDetails').innerHTML = `
            <div class="file-details">
                <div class="file-detail">
                    <span>Имя файла:</span>
                    <span>${file.name}</span>
                </div>
                <div class="file-detail">
                    <span>Размер:</span>
                    <span>${(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                </div>
                <div class="file-detail">
                    <span>Длительность:</span>
                    <span class="${isValid ? 'duration-valid' : 'duration-invalid'}">
                        ${minutes}:${seconds.toString().padStart(2, '0')}
                    </span>
                </div>
                <div class="file-detail">
                    <span>Статус:</span>
                    <span class="${isValid ? 'duration-valid' : 'duration-invalid'}">
                        ${isValid ? '✓ Подходит' : '✗ Должен быть 30 сек - 3 мин'}
                    </span>
                </div>
            </div>
        `;
        
        document.getElementById('fileInfo').style.display = 'block';
        
        const confirmBtn = document.getElementById('confirmUpload');
        const cancelBtn = document.getElementById('cancelUpload');

        confirmBtn.onclick = isValid ? () => showMetadataModal(file) : null;
        confirmBtn.disabled = !isValid;
        confirmBtn.style.background = isValid ? '#28a745' : '#ccc';
        
        cancelBtn.onclick = cancelUpload;
        
        URL.revokeObjectURL(objectUrl);
    });
    
    audio.addEventListener('error', function() {
        alert('Ошибка при чтении файла. Возможно, файл поврежден.');
    });
}

async function uploadToCloudinary(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    formData.append('resource_type', 'auto');
    
    try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/upload`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) throw new Error('Ошибка загрузки на Cloudinary');
        
        const data = await response.json();
        return {
            url: data.secure_url,
            publicId: data.public_id,
            duration: data.duration || 0
        };
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw new Error('Не удалось загрузить файл на сервер');
    }
}

async function addToLibrary(file, duration, title, artist) {
    try {
        document.getElementById('confirmUpload').innerHTML = 'Введите название трека и исполнителя';
        document.getElementById('confirmUpload').disabled = true;

        const cloudinaryData = await uploadToCloudinary(file);
        
        const songData = {
            name: title,
            artist: artist,
            duration: Math.round(cloudinaryData.duration || duration),
            size: file.size,
            url: cloudinaryData.url,
            public_id: cloudinaryData.publicId
        };

        const newSong = await addSongToDatabase(songData);

        await loadMusicLibrary();

        cancelUpload();
        showSection('home');

    } catch (error) {
        document.getElementById('confirmUpload').innerHTML = '✅ Добавить в библиотеку';
        document.getElementById('confirmUpload').disabled = false;
    }
}

function cancelUpload() {
    document.getElementById('fileInput').value = '';
    document.getElementById('fileInfo').style.display = 'none';
    currentFile = null;
}

function clearLibrary() {
    if (confirm('Вы уверены, что хотите удалить ВСЕ треки из библиотеки?')) {
        musicLibrary = [];
        localStorage.setItem('musicLibrary', JSON.stringify(musicLibrary));
        alert('Библиотека очищена!');
        performSearch();
    }
}

function showSection(sectionName, playlistId = null) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    if (sectionName === 'playlist' && playlistId) {
        currentPlaylist = playlistId;
        localStorage.setItem('currentPlaylist', playlistId);
        showPlaylistSection(playlistId);

        const playlistItem = document.querySelector(`[onclick*="${playlistId}"]`);
        if (playlistItem) {
            playlistItem.classList.add('active');
        }
    } else {
        currentPlaylist = null;
        localStorage.removeItem('currentPlaylist');
        document.getElementById(sectionName + '-section').classList.add('active');

        const navItems = document.querySelectorAll('.nav-item');
        for (let item of navItems) {
            const navText = item.querySelector('.nav-text').textContent.toLowerCase();
            if ((sectionName === 'home' && navText === 'главная') ||
                (sectionName === 'upload' && navText === 'добавить музыку') ||
                (sectionName === 'playlist' && navText.includes('создать плейлист'))) {
                item.classList.add('active');
                break;
            }
        }
    }
    
    currentSection = sectionName;
}

function performSearch() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const results = document.getElementById('searchResults');
    
    let filtered = musicLibrary;
    
    if (query) {
        filtered = musicLibrary.filter(song => 
            song.name.toLowerCase().includes(query) || 
            (song.artist && song.artist.toLowerCase().includes(query))
        );
    }
    
    if (filtered.length === 0) {
        results.innerHTML = '<p style="text-align: center; color: #b3b3b3; grid-column: 1 / -1;">Ничего не найдено</p>';
        return;
    }
    
    results.innerHTML = filtered.map(song => `
        <div class="song-card" data-song-id="${song.id}" data-song-url="${song.url}">
            <div class="album-art">🎵</div>
            <div class="play-overlay" onclick="playSong('${song.id}')">
                <div class="play-icon"></div>
                <div class="pause-icon"></div>
            </div>
            <button class="add-to-playlist-card-btn" onclick="event.stopPropagation(); showAddToPlaylistModal('${song.id}')" title="Добавить в плейлист">
            </button>
            <div class="song-info">
                <h4>${song.name}</h4>
                <p>${song.artist}</p>
            </div>
        </div>
    `).join('');
    
    updateAllPlayButtons();
}

function playSong(songId, playlistSongs = null) {
    let songs;
    
    if (isShuffle && currentPlaylistSongs.length > 0) {
        songs = currentPlaylistSongs;
    } else {
        songs = playlistSongs || musicLibrary;
    }
    
    const songIndex = songs.findIndex(s => s.id === songId);
    
    if (songIndex === -1) return;
    
    currentTrackIndex = songIndex;
    const song = songs[songIndex];
    
    const audioElement = document.getElementById('audioElement');
    const nowPlayingTitle = document.getElementById('nowPlayingTitle');
    const nowPlayingArtist = document.getElementById('nowPlayingArtist');

    if (audioElement.src === song.url && !audioElement.paused) {
        togglePlay();
        return;
    }
    
    audioElement.src = song.url;
    nowPlayingTitle.textContent = song.name;
    nowPlayingArtist.textContent = song.artist;

    updateAllPlayButtons();
    
    togglePlay();
}

function togglePlay() {
    const audio = document.getElementById('audioElement');
    const playBtn = document.querySelector('.play-pause');
    
    if (audio.paused) {
        audio.play();
        playBtn.classList.add('playing');
        isPlaying = true;
    } else {
        audio.pause();
        playBtn.classList.remove('playing');
        isPlaying = false;
    }
    
    updateAllPlayButtons();
}

function toggleRepeat() {
    const repeatBtn = document.querySelector('.repeat-btn');
    isRepeat = !isRepeat;
    
    if (isRepeat) {
        repeatBtn.classList.add('active');
        repeatBtn.title = 'Отключить зацикливание';
    } else {
        repeatBtn.classList.remove('active');
        repeatBtn.title = 'Зациклить трек';
    }
}

function toggleShuffle() {
    const shuffleBtn = document.querySelector('.shuffle-btn');
    isShuffle = !isShuffle;
    
    if (isShuffle) {
        shuffleBtn.classList.add('active');
        shuffleBtn.title = 'Отключить случайный порядок';
        enableShuffle();
    } else {
        shuffleBtn.classList.remove('active');
        shuffleBtn.title = 'Случайный порядок';
        disableShuffle();
    }
}

function enableShuffle() {
    const songs = currentPlaylist ? getPlaylistSongs() : musicLibrary;
    originalPlaylistOrder = [...songs];
    currentPlaylistSongs = [...songs];

    for (let i = currentPlaylistSongs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [currentPlaylistSongs[i], currentPlaylistSongs[j]] = [currentPlaylistSongs[j], currentPlaylistSongs[i]];
    }

    const currentSong = document.getElementById('audioElement').src;
    const currentIndex = currentPlaylistSongs.findIndex(song => song.url === currentSong);
    currentTrackIndex = currentIndex !== -1 ? currentIndex : 0;
}

function disableShuffle() {
    if (originalPlaylistOrder.length > 0) {
        const currentSong = document.getElementById('audioElement').src;
        const currentIndex = originalPlaylistOrder.findIndex(song => song.url === currentSong);
        currentTrackIndex = currentIndex !== -1 ? currentIndex : 0;
        currentPlaylistSongs = [...originalPlaylistOrder];
    }
}

function previousTrack() {
    let songs;
    
    if (isShuffle && currentPlaylistSongs.length > 0) {
        songs = currentPlaylistSongs;
    } else {
        songs = currentPlaylist ? getPlaylistSongs() : musicLibrary;
    }
    
    if (songs.length === 0) return;

    if (currentTrackIndex === 0) {
        currentTrackIndex = songs.length - 1;
    } else {
        currentTrackIndex = (currentTrackIndex - 1 + songs.length) % songs.length;
    }
    
    playSong(songs[currentTrackIndex].id, songs);
}

function nextTrack() {
    let songs;
    
    if (isShuffle && currentPlaylistSongs.length > 0) {
        songs = currentPlaylistSongs;
    } else {
        songs = currentPlaylist ? getPlaylistSongs() : musicLibrary;
    }
    
    if (songs.length === 0) return;

    if (currentTrackIndex === songs.length - 1) {
        currentTrackIndex = 0;
    } else {
        currentTrackIndex = (currentTrackIndex + 1) % songs.length;
    }
    
    playSong(songs[currentTrackIndex].id, songs);
}

function toggleMute() {
    const audio = document.getElementById('audioElement');
    const volumeBtn = document.querySelector('.volume-btn');
    const volumeSlider = document.getElementById('volume');
    
    if (audio.muted) {
        audio.muted = false;
        volumeSlider.value = lastVolume;
        audio.volume = lastVolume / 100;
        volumeBtn.classList.remove('muted');
        updateVolumeIcon(lastVolume);
    } else {
        lastVolume = audio.volume * 100;
        audio.muted = true;
        volumeSlider.value = 0;
        volumeBtn.classList.add('muted');
        volumeBtn.classList.remove('low', 'medium', 'high');
    }
}

function initializeVolume() {
    const volumeSlider = document.getElementById('volume');
    const audio = document.getElementById('audioElement');

    audio.volume = volumeSlider.value / 100;
    updateVolumeIcon(volumeSlider.value);
}

function changeVolume(value) {
    const audio = document.getElementById('audioElement');
    const volumeBtn = document.querySelector('.volume-btn');
    
    audio.volume = value / 100;
    audio.muted = false;

    updateVolumeIcon(value);

    lastVolume = value;
}

function updateVolumeIcon(volume) {
    const volumeBtn = document.querySelector('.volume-btn');

    volumeBtn.classList.remove('muted', 'low', 'medium', 'high');
    
    if (volume == 0) {
        volumeBtn.classList.add('muted');
    } else if (volume > 0 && volume <= 33) {
        volumeBtn.classList.add('low');
    } else if (volume > 33 && volume <= 66) {
        volumeBtn.classList.add('medium');
    } else {
        volumeBtn.classList.add('high');
    }
}

function updateProgress() {
    const audio = document.getElementById('audioElement');
    const progress = document.getElementById('progress');
    const currentTime = document.getElementById('currentTime');
    const duration = document.getElementById('duration');
    
    if (audio.duration) {
        const progressPercent = (audio.currentTime / audio.duration) * 100;
        progress.style.width = progressPercent + '%';
        
        currentTime.textContent = formatTime(audio.currentTime);
        duration.textContent = formatTime(audio.duration);
    }
}

function seek(event) {
    const audio = document.getElementById('audioElement');
    const progressBar = event.currentTarget;
    const clickPosition = event.offsetX;
    const progressBarWidth = progressBar.offsetWidth;
    const seekTime = (clickPosition / progressBarWidth) * audio.duration;
    
    audio.currentTime = seekTime;
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function createNewPlaylist() {
    document.getElementById('playlistName').value = '';
    document.getElementById('playlistModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('playlistModal').style.display = 'none';
}

async function savePlaylist() {
    const name = document.getElementById('playlistName').value.trim();
    
    if (!name) {
        alert('Введите название плейлиста');
        return;
    }
    
    try {
        const userId = await getCurrentUser();
        
        const playlistData = {
            name: name,
            user_id: userId,
            songs: []
        };
        
        const newPlaylist = await createPlaylistInDatabase(playlistData);
        
        playlists.push(newPlaylist);
        updatePlaylistsSidebar();
        createPlaylistSection(newPlaylist);
        
        closeModal();

        showSection('playlist', newPlaylist.id);
        
    } catch (error) {
        alert('Ошибка создания плейлиста: ' + error.message);
    }
}

function updatePlaylistsSidebar() {
    const playlistsList = document.getElementById('playlistsList');
    
    playlistsList.innerHTML = playlists.map(playlist => {
        const songsArray = Array.isArray(playlist.songs) ? playlist.songs : [];
        const songsCount = songsArray.length;
        
        return `
            <div class="nav-item playlist-item" onclick="showSection('playlist', '${playlist.id}')">
                <span class="nav-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 22a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H3zm6-4h6a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1z"/>
                    </svg>
                </span>
                <span class="nav-text">${playlist.name} <span style="color: #b3b3b3; font-size: 12px;">(${songsCount})</span></span>
                <button class="delete-playlist-btn" onclick="event.stopPropagation(); showDeleteConfirmation('${playlist.id}', '${playlist.name.replace(/'/g, "\\'")}')">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 10.586l4.95-4.95 1.414 1.414-4.95 4.95 4.95 4.95-1.414 1.414L12 13.414l-4.95 4.95-1.414-1.414 4.95-4.95-4.95-4.95L7.05 5.636z"/>
                    </svg>
                </button>
            </div>
        `;
    }).join('');

    if (currentSection === 'playlist' && currentPlaylist) {
        const activePlaylistItem = document.querySelector(`[onclick*="${currentPlaylist}"]`);
        if (activePlaylistItem) {
            activePlaylistItem.classList.add('active');
        }
    }
}

function showPlaylistSection(playlistId) {
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return;

    createPlaylistSection(playlist);
    const section = document.getElementById(`playlist-${playlistId}`);
    
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    section.classList.add('active');

    setTimeout(() => updateAllPlayButtons(), 0);
}

function getPlaylistSongs(playlistId = null) {
    const targetPlaylistId = playlistId || currentPlaylist;
    const playlist = playlists.find(p => p.id === targetPlaylistId);
    
    if (!playlist) {
        console.log('Плейлист не найден:', targetPlaylistId);
        return [];
    }

    console.log('Данные плейлиста:', playlist);
    
    const songsArray = Array.isArray(playlist.songs) ? playlist.songs : [];
    console.log('ID песен в плейлисте:', songsArray);
    
    const result = songsArray
        .map(songId => {
            const song = musicLibrary.find(s => s.id === songId);
            if (!song) {
                console.log('Песня не найдена в библиотеке:', songId);
            }
            return song;
        })
        .filter(song => song !== undefined && song !== null);
    
    console.log('Найденные песни:', result);
    return result;
}

function createPlaylistSection(playlist) {
    const playlistSections = document.getElementById('playlist-sections');

    const oldSection = document.getElementById(`playlist-${playlist.id}`);
    if (oldSection) {
        oldSection.remove();
    }
    
    const section = document.createElement('section');
    section.id = `playlist-${playlist.id}`;
    section.className = 'content-section playlist-section';

    const playlistSongs = getPlaylistSongs(playlist.id);
    const songsCount = playlistSongs.length;

    section.innerHTML = `
        <header class="content-header">
            <div>
                <h1>${playlist.name}</h1>
                <p>${songsCount} треков</p>
            </div>
        </header>
        <div class="music-grid" id="playlist-${playlist.id}-songs">
            ${songsCount === 0 ? 
                '<p style="text-align: center; color: #b3b3b3; grid-column: 1 / -1; margin: 40px 0;">Плейлист пуст</p>' : 
                playlistSongs.map(song => `
                    <div class="song-card" data-song-id="${song.id}" data-song-url="${song.url}">
                        <div class="album-art">🎵</div>
                        <div class="play-overlay" onclick="playSong('${song.id}', getPlaylistSongs('${playlist.id}'))">
                            <div class="play-icon"></div>
                            <div class="pause-icon"></div>
                        </div>
                        <div class="song-info">
                            <h4>${song.name}</h4>
                            <p>${song.artist}</p>
                        </div>
                    </div>
                `).join('')
            }
        </div>
    `;
    
    playlistSections.appendChild(section);

    setTimeout(() => updateAllPlayButtons(), 100);
}

function showAddSongsModal(songs, playlistName) {
    document.getElementById('addSongsModalTitle').textContent = `Добавить треки в "${playlistName}"`;
    
    const songsList = document.getElementById('availableSongsList');
    
    if (songs.length === 0) {
        songsList.innerHTML = '<div class="no-songs-message">Нет доступных треков для добавления</div>';
    } else {
        songsList.innerHTML = songs.map(song => `
            <div class="song-selection-item">
                <div class="song-selection-info">
                    <h4>${song.name}</h4>
                    <p>${song.artist} • ${formatTime(song.duration)}</p>
                </div>
                <button class="add-to-playlist-btn" onclick="addSongToPlaylist('${song.id}')">
                    ➕ Добавить
                </button>
            </div>
        `).join('');
    }
    
    document.getElementById('addSongsModal').style.display = 'flex';
}

function closeAddSongsModal() {
    document.getElementById('addSongsModal').style.display = 'none';
    currentPlaylistForAdding = null;
}

async function addSongToPlaylist(songId, playlistId = null) {
    const targetPlaylistId = playlistId || currentPlaylistForAdding;
    if (!targetPlaylistId) return;
    
    const playlist = playlists.find(p => p.id === targetPlaylistId);
    if (!playlist) return;
    
    try {
        const songsArray = Array.isArray(playlist.songs) ? playlist.songs : [];

        if (songsArray.includes(songId)) {
            showTempNotification('Этот трек уже есть в плейлисте!');
            return;
        }
        
        const updatedSongs = [...songsArray, songId];
        
        await updatePlaylistInDatabase(targetPlaylistId, { songs: updatedSongs });

        const updatedPlaylist = playlists.find(p => p.id === targetPlaylistId);
        if (updatedPlaylist) {
            updatedPlaylist.songs = updatedSongs;
        }
        
        const song = musicLibrary.find(s => s.id === songId);
        if (song) {
            showTempNotification(`"${song.name}" добавлен в плейлист "${playlist.name}"!`);
        }

        if (currentPlaylist === targetPlaylistId) {
            createPlaylistSection(playlist);
        }

        updatePlaylistsSidebar();

        if (!playlistId) {
            closeAddSongsModal();
        }
        
    } catch (error) {
        console.error('Ошибка добавления в плейлист:', error);
        alert('Ошибка добавления в плейлист: ' + error.message);
    }
}

function showTempNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #1db954;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 10000;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function showMetadataModal(file) {
    currentFile = file;

    const cleanName = cleanFileName(file.name);
    document.getElementById('songTitle').value = cleanName;
    document.getElementById('songArtist').value = 'Неизвестный исполнитель';

    document.getElementById('originalFileName').textContent = file.name;
    document.getElementById('filePreview').style.display = 'block';

    showAutoSuggestion(cleanName);
    
    document.getElementById('metadataModal').style.display = 'flex';
}

function cleanFileName(filename) {
    return filename
        .replace(/\.mp3$/i, '')
        .replace(/\.MP3$/i, '')
        .replace(/\.m4a$/i, '')
        .replace(/\.wav$/i, '')
        .replace(/\.flac$/i, '')
        .replace(/undefined/gi, '')
        .replace(/\([^)]*\)/g, '') // удаляет (2024), (Official Audio) и т.д.
        .replace(/\[[^\]]*\]/g, '') // удаляет [Official], [HD] и т.д.
        .replace(/_/g, ' ') // заменяет подчеркивания на пробелы
        .replace(/\s+/g, ' ') // убирает множественные пробелы
        .replace(/^\s+|\s+$/g, '') // убирает пробелы в начале и конце
        .replace(/^[0-9]+\s*-\s*/, '') // удаляет номер трека "01 - ", "1. " и т.д.
        .trim();
}

function showAutoSuggestion(cleanName) {
    const separators = [' - ', ' – ', ' — ', ' | '];
    
    for (let separator of separators) {
        if (cleanName.includes(separator)) {
            const parts = cleanName.split(separator);
            if (parts.length === 2) {
                const suggestedArtist = parts[0].trim();
                const suggestedTitle = parts[1].trim();

                const suggestion = document.createElement('div');
                suggestion.className = 'auto-suggestion';
                suggestion.innerHTML = `💡 Авто-определение: <strong>${suggestedArtist}</strong> - <strong>${suggestedTitle}</strong>`;
                suggestion.onclick = function() {
                    document.getElementById('songArtist').value = suggestedArtist;
                    document.getElementById('songTitle').value = suggestedTitle;
                    suggestion.remove();
                };
                
                const existingSuggestion = document.querySelector('.auto-suggestion');
                if (existingSuggestion) {
                    existingSuggestion.remove();
                }
                
                document.getElementById('songTitle').parentNode.appendChild(suggestion);
                break;
            }
        }
    }
}

function confirmMetadata() {
    const title = document.getElementById('songTitle').value.trim();
    const artist = document.getElementById('songArtist').value.trim();
    
    if (!title) {
        alert('Пожалуйста, введите название трека');
        return;
    }
    
    if (!artist) {
        alert('Пожалуйста, введите имя исполнителя');
        return;
    }

    document.getElementById('metadataModal').style.display = 'none';

    addToLibrary(currentFile, currentFileDuration, title, artist);
}

function cancelMetadata() {
    document.getElementById('metadataModal').style.display = 'none';
    cancelUpload();
}

async function getCurrentUser() {
    let userId = localStorage.getItem('musicApp_userId');
    
    if (!userId) {
        userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('musicApp_userId', userId);

        try {
            await supabase
                .from('users')
                .insert([{ id: userId, created_at: new Date().toISOString() }]);
        } catch (error) {
            console.log('Пользователь уже существует или ошибка создания:', error);
        }
    }
    
    return userId;
}

function showDeleteConfirmation(playlistId, playlistName) {
    playlistToDelete = playlistId;
    
    const message = `Вы точно хотите удалить плейлист "${playlistName}"? Это действие нельзя отменить.`;
    document.getElementById('deletePlaylistMessage').textContent = message;
    
    document.getElementById('deletePlaylistModal').style.display = 'flex';
}

function cancelDeletePlaylist() {
    playlistToDelete = null;
    document.getElementById('deletePlaylistModal').style.display = 'none';
}

async function confirmDeletePlaylist() {
    if (!playlistToDelete) return;
    
    try {
        const { error } = await supabase
            .from('playlists')
            .delete()
            .eq('id', playlistToDelete);
        
        if (error) throw error;

        const playlistIndex = playlists.findIndex(p => p.id === playlistToDelete);
        const playlistName = playlists[playlistIndex]?.name || 'Плейлист';
        
        if (playlistIndex !== -1) {
            playlists.splice(playlistIndex, 1);
        }

        const playlistSection = document.getElementById(`playlist-${playlistToDelete}`);
        if (playlistSection) {
            playlistSection.remove();
        }

        updatePlaylistsSidebar();
        
        showTempNotification(`Плейлист "${playlistName}" удален`);

        if (currentPlaylist === playlistToDelete) {
            showSection('home');
        }
        
    } catch (error) {
        console.error('Ошибка удаления плейлиста:', error);
        alert('Ошибка при удалении плейлиста: ' + error.message);
    } finally {
        cancelDeletePlaylist();
    }
}

function showAddToPlaylistModal(songId) {
    const song = musicLibrary.find(s => s.id === songId);
    if (!song) return;

    document.getElementById('addSongsModalTitle').textContent = `Добавить "${song.name}" в плейлист`;
    
    const songsList = document.getElementById('availableSongsList');
    
    if (playlists.length === 0) {
        songsList.innerHTML = '<div class="no-songs-message">У вас нет плейлистов. Создайте плейлист сначала.</div>';
    } else {
        songsList.innerHTML = playlists.map(playlist => {
            const songsArray = Array.isArray(playlist.songs) ? playlist.songs : [];
            const alreadyAdded = songsArray.includes(songId);
            
            return `
                <div class="song-selection-item">
                    <div class="song-selection-info">
                        <h4>${playlist.name}</h4>
                        <p>${songsArray.length} треков</p>
                    </div>
                    <button class="add-to-playlist-btn ${alreadyAdded ? 'added' : ''}" 
                            onclick="addSongToPlaylistFromModal('${songId}', '${playlist.id}')"
                            ${alreadyAdded ? 'disabled' : ''}>
                        ${alreadyAdded ? '✅ Добавлено' : '➕ Добавить'}
                    </button>
                </div>
            `;
        }).join('');
    }
    
    document.getElementById('addSongsModal').style.display = 'flex';
}

function addSongToPlaylistFromModal(songId, playlistId) {
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return;
    
    const song = musicLibrary.find(s => s.id === songId);
    if (!song) return;
    
    addSongToPlaylist(songId, playlistId);

    const buttons = document.querySelectorAll('.add-to-playlist-btn');
    buttons.forEach(btn => {
        if (btn.onclick && btn.onclick.toString().includes(songId) && btn.onclick.toString().includes(playlistId)) {
            btn.textContent = '✅ Добавлено';
            btn.classList.add('added');
            btn.disabled = true;
            btn.onclick = null;
        }
    });
}

function updateAllPlayButtons() {
    const audio = document.getElementById('audioElement');
    const currentSongUrl = audio.src;
    const isCurrentlyPlaying = !audio.paused && currentSongUrl;
    
    document.querySelectorAll('.song-card').forEach(card => {
        const playButton = card.querySelector('.play-overlay');
        const songUrl = card.getAttribute('data-song-url') || 
                       musicLibrary.find(song => song.id === card.getAttribute('data-song-id'))?.url;
        
        if (songUrl === currentSongUrl && isCurrentlyPlaying) {
            playButton.classList.add('playing');
        } else {
            playButton.classList.remove('playing');
        }
    });
}

