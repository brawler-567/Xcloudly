const {
  createClient
} = window.supabase;
const vCreateClient = createClient("https://yxxqmabcrffoqegdtfpr.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4eHFtYWJjcmZmb3FlZ2R0ZnByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzNDQ3NzcsImV4cCI6MjA3NjkyMDc3N30.0L8en_UyCCyDsqrQ6Ympt5ZsPDv3DujmYmaCbsZ5b0Y");
let vA = [];
let vA2 = [];
let vLSHome = "home";
let v = localStorage.getItem("currentPlaylist") || null;
let vLN0 = 0;
let v2 = false;
let v3 = null;
let vLN02 = 0;
let vLN03 = 0;
let v4 = null;
let v5 = null;
let v6 = null;
let v7 = false;
let vLN50 = 50;
let v8 = false;
let v9 = false;
let vA3 = [];
let vA4 = [];
let vLN1 = 1;
let v10 = null;
let v11 = new Set();
let v12 = null;
let v13 = null;
let v14 = false;

// Console command: type verify() to unlock all file size and duration limits
window.verify = function () {
  v14 = true;
  console.log("%c✅ Verified! All file size and duration restrictions are now disabled.", "color: #1db954; font-size: 14px; font-weight: bold;");
};
document.addEventListener("DOMContentLoaded", async function () {
  document.getElementById("loader").style.display = "flex";
  v5 = await f52();
  console.log("Текущий пользователь:", v5);
  await f3();
  await f4();
  console.log("Загружено плейлистов:", vA2.length);
  console.log("Загружено песен:", vA.length);
  f19("home");
  f39();
  f8();
  f13();
  f30();
  document.getElementById("searchInput").addEventListener("input", f20);
  f32(50);
  // TOLOOK
  setTimeout(() => {
    f61();
  }, 2000);
  document.getElementById("audioElement").addEventListener("ended", function () {
    if (v8) {
      this.currentTime = 0;
      this.play();
    } else {
      let v15;
      if (v9 && vA4.length > 0) {
        v15 = vA4;
      } else {
        v15 = v ? f41() : vA;
      }
      if (v15.length === 0) {
        return;
      }
      if (vLN0 === v15.length - 1) {
        vLN0 = 0;
      } else {
        vLN0++;
      }
      f21(v15[vLN0].id, v15);
    }
    f58();
  });
  // TOLOOK
  setTimeout(() => {
    document.getElementById("loader").style.display = "none";
    document.querySelector(".app-container").classList.add("loaded");
    document.querySelector(".spotify-player").classList.add("loaded");
  }, 1000);
  window.addEventListener("beforeunload", f65);
  window.addEventListener("pagehide", f65);
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      if (v12) {
        clearInterval(v12);
        v12 = null;
      }
    } else if (!v12) {
      v12 = // TOLOOK
      setInterval(f62, 30000);
      f62();
    }
  });
});
async function f52() {
  let v16 = localStorage.getItem("musicApp_userId");
  if (!v16) {
    v16 = "user_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
    localStorage.setItem("musicApp_userId", v16);
  }
  return v16;
}
function f2(p2) {
  if (!p2.songs) {
    p2.songs = [];
    return p2;
  }
  if (typeof p2.songs === "string") {
    try {
      p2.songs = JSON.parse(p2.songs);
    } catch (e2) {
      console.error("Ошибка парсинга songs:", e2);
      p2.songs = [];
    }
  }
  if (!Array.isArray(p2.songs)) {
    p2.songs = [];
  }
  return p2;
}
async function f3() {
  try {
    const {
      data,
      error
    } = await vCreateClient.from("songs").select("*").order("created_at", {
      ascending: false
    });
    if (error) {
      throw error;
    }
    vA = data || [];
    f20();
  } catch (e3) {
    console.error("Ошибка загрузки библиотеки:", e3);
    vA = [];
  }
}
async function f4() {
  try {
    const v17 = await f52();
    const {
      data,
      error
    } = await vCreateClient.from("playlists").select("*").eq("user_id", v17).order("created_at", {
      ascending: false
    });
    if (error) {
      throw error;
    }
    vA2 = (data || []).map(f2);
    f39();
    if (v) {
      const v18 = vA2.find(p3 => p3.id === v);
      if (v18) {
        f19("playlist", v);
      } else {
        v = null;
        localStorage.removeItem("currentPlaylist");
      }
    }
  } catch (e4) {
    console.error("Ошибка загрузки плейлистов:", e4);
    vA2 = [];
  }
}
async function f5(p4) {
  try {
    const {
      data,
      error
    } = await vCreateClient.from("songs").insert([p4]).select();
    if (error) {
      throw error;
    }
    return data[0];
  } catch (e5) {
    console.error("Ошибка добавления в базу:", e5);
    throw e5;
  }
}
async function f6(p5) {
  try {
    const vO = {
      ...p5,
      songs: JSON.stringify(p5.songs || [])
    };
    const {
      data,
      error
    } = await vCreateClient.from("playlists").insert([vO]).select();
    if (error) {
      throw error;
    }
    return f2(data[0]);
  } catch (e6) {
    console.error("Ошибка создания плейлиста:", e6);
    throw e6;
  }
}
async function f7(p6, p7) {
  try {
    const vO2 = {
      ...p7
    };
    if (p7.songs) {
      vO2.songs = JSON.stringify(p7.songs);
    }
    const {
      error
    } = await vCreateClient.from("playlists").update(vO2).eq("id", p6);
    if (error) {
      throw error;
    }
    const v19 = vA2.findIndex(p8 => p8.id === p6);
    if (v19 !== -1) {
      vA2[v19] = {
        ...vA2[v19],
        ...p7
      };
      vA2[v19] = f2(vA2[v19]);
    }
  } catch (e7) {
    console.error("Ошибка обновления плейлиста:", e7);
    throw e7;
  }
}
function f8() {
  const v20 = document.getElementById("uploadZone");
  ["dragenter", "dragover", "dragleave", "drop"].forEach(p9 => {
    v20.addEventListener(p9, f9, false);
  });
  ["dragenter", "dragover"].forEach(p10 => {
    v20.addEventListener(p10, f10, false);
  });
  ["dragleave", "drop"].forEach(p11 => {
    v20.addEventListener(p11, f11, false);
  });
  v20.addEventListener("drop", f12, false);
}
function f9(p12) {
  p12.preventDefault();
  p12.stopPropagation();
}
function f10() {
  document.getElementById("uploadZone").classList.add("dragover");
}
function f11() {
  document.getElementById("uploadZone").classList.remove("dragover");
}
function f12(p13) {
  const v21 = p13.dataTransfer;
  const v22 = v21.files;
  if (v22.length > 0) {
    f14(v22);
  }
}
function f13() {
  document.getElementById("fileInput").addEventListener("change", function () {
    if (this.files.length > 0) {
      f14(this.files);
    }
  });
}
function f14(p14) {
  const v23 = p14[0];
  if (!v23.type.startsWith("audio/")) {
    alert("Пожалуйста, загружайте только аудио файлы!");
    return;
  }
  v3 = v23;
  f15(v23);
}
function f15(p15) {
  const v24 = new Audio();
  const v25 = URL.createObjectURL(p15);
  v24.src = v25;
  v24.addEventListener("loadedmetadata", function () {
    const v26 = v24.duration;
    vLN02 = v26;
    vLN03 = p15.size;
    const v27 = Math.floor(v26 / 60);
    const v28 = Math.floor(v26 % 60);
    const v29 = v14 || v26 >= 30 && v26 <= 360;
    document.getElementById("fileDetails").innerHTML = `
            <div class="file-details">
                <div class="file-detail">
                    <span>Имя файла:</span>
                    <span>${p15.name}</span>
                </div>
                <div class="file-detail">
                    <span>Размер:</span>
                    <span>${(p15.size / 1048576).toFixed(2)} MB</span>
                </div>
                <div class="file-detail">
                    <span>Длительность:</span>
                    <span class="${v29 ? "duration-valid" : "duration-invalid"}">
                        ${v27}:${v28.toString().padStart(2, "0")}
                    </span>
                </div>
                <div class="file-detail">
                    <span>Статус:</span>
                    <span class="${v29 ? "duration-valid" : "duration-invalid"}">
                        ${v29 ? v14 ? "✓ Verified — без ограничений" : "✓ Подходит" : "✗ Должен быть 30 сек - 6 мин"}
                    </span>
                </div>
            </div>
        `;
    document.getElementById("fileInfo").style.display = "block";
    const v30 = document.getElementById("confirmUpload");
    const v31 = document.getElementById("cancelUpload");
    v30.onclick = v29 ? () => f47(p15) : null;
    v30.disabled = !v29;
    v30.style.background = v29 ? "#28a745" : "#ccc";
    v31.onclick = f18;
    URL.revokeObjectURL(v25);
  });
  v24.addEventListener("error", function () {
    alert("Ошибка при чтении файла. Возможно, файл поврежден.");
  });
}
async function f16(p16) {
  const v32 = new FormData();
  v32.append("file", p16);
  v32.append("upload_preset", "Music_Storage");
  v32.append("resource_type", "auto");
  try {
    const v33 = await fetch(`https://api.cloudinary.com/v1_1/dfvpw70ig/upload`, {
      method: "POST",
      body: v32
    });
    if (!v33.ok) {
      throw new Error("Ошибка загрузки на Cloudinary");
    }
    const v34 = await v33.json();
    return {
      url: v34.secure_url,
      publicId: v34.public_id,
      duration: v34.duration || 0
    };
  } catch (e8) {
    console.error("Cloudinary upload error:", e8);
    throw new Error("Не удалось загрузить файл на сервер");
  }
}
async function f17(p17, p18, p19, p20) {
  try {
    document.getElementById("confirmUpload").innerHTML = "Введите название трека и исполнителя";
    document.getElementById("confirmUpload").disabled = true;
    const v35 = await f16(p17);
    const vO3 = {
      name: p19,
      artist: p20,
      duration: Math.round(v35.duration || p18),
      size: p17.size,
      url: v35.url,
      public_id: v35.publicId
    };
    const v36 = await f5(vO3);
    await f3();
    f18();
    f19("home");
  } catch (e9) {
    document.getElementById("confirmUpload").innerHTML = "✅ Добавить в библиотеку";
    document.getElementById("confirmUpload").disabled = false;
  }
}
function f18() {
  document.getElementById("fileInput").value = "";
  document.getElementById("fileInfo").style.display = "none";
  v3 = null;
}
function f19(p21, p22 = null) {
  document.querySelectorAll(".content-section").forEach(p23 => {
    p23.classList.remove("active");
  });
  document.querySelectorAll(".nav-item").forEach(p24 => {
    p24.classList.remove("active");
  });
  if (p21 === "playlist" && p22) {
    v = p22;
    localStorage.setItem("currentPlaylist", p22);
    f40(p22);
    const v37 = document.querySelector(`[onclick*="${p22}"]`);
    if (v37) {
      v37.classList.add("active");
    }
  } else {
    v = null;
    localStorage.removeItem("currentPlaylist");
    document.getElementById(p21 + "-section").classList.add("active");
    const v38 = document.querySelectorAll(".nav-item");
    for (let v39 of v38) {
      const v40 = v39.querySelector(".nav-text").textContent.toLowerCase();
      if (p21 === "home" && v40 === "главная" || p21 === "upload" && v40 === "добавить музыку" || p21 === "playlist" && v40.includes("создать плейлист")) {
        v39.classList.add("active");
        break;
      }
    }
  }
  vLSHome = p21;
}
function f20() {
  const v41 = document.getElementById("searchInput").value.toLowerCase();
  const v42 = document.getElementById("searchResults");
  let vVA = vA;
  if (v41) {
    vVA = vA.filter(p25 => p25.name.toLowerCase().includes(v41) || p25.artist && p25.artist.toLowerCase().includes(v41));
  }
  if (vVA.length === 0) {
    v42.innerHTML = "<p style=\"text-align: center; color: #b3b3b3; grid-column: 1 / -1;\">Ничего не найдено</p>";
    return;
  }
  v42.innerHTML = vVA.map(p26 => `
        <div class="song-card" data-song-id="${p26.id}" data-song-url="${p26.url}">
            <div class="album-art">🎵</div>
            <div class="play-overlay" onclick="playSong('${p26.id}')">
                <div class="play-icon"></div>
                <div class="pause-icon"></div>
            </div>
            <button class="add-to-playlist-card-btn" onclick="event.stopPropagation(); showAddToPlaylistModal('${p26.id}')" title="Добавить в плейлист">
            </button>
            <div class="song-info">
                <h4>${p26.name}</h4>
                <p>${p26.artist}</p>
            </div>
        </div>
    `).join("");
  f58();
}
function f21(p27, p28 = null) {
  let v43;
  if (v9 && vA4.length > 0) {
    v43 = vA4;
  } else {
    v43 = p28 || vA;
  }
  const v44 = v43.findIndex(p29 => p29.id === p27);
  if (v44 === -1) {
    return;
  }
  vLN0 = v44;
  const v45 = v43[v44];
  const v46 = document.getElementById("audioElement");
  const v47 = document.getElementById("nowPlayingTitle");
  const v48 = document.getElementById("nowPlayingArtist");
  if (v46.src === v45.url && !v46.paused) {
    f22();
    return;
  }
  v46.src = v45.url;
  v47.textContent = v45.name;
  v48.textContent = v45.artist;
  f58();
  f22();
}
function f22() {
  const v49 = document.getElementById("audioElement");
  const v50 = document.querySelector(".play-pause");
  if (v49.paused) {
    v49.play();
    v50.classList.add("playing");
    v2 = true;
  } else {
    v49.pause();
    v50.classList.remove("playing");
    v2 = false;
  }
  f58();
}
function f23() {
  const v51 = document.querySelector(".repeat-btn");
  v8 = !v8;
  if (v8) {
    v51.classList.add("active");
    v51.title = "Отключить зацикливание";
  } else {
    v51.classList.remove("active");
    v51.title = "Зациклить трек";
  }
}
function f24() {
  const v52 = document.querySelector(".shuffle-btn");
  v9 = !v9;
  if (v9) {
    v52.classList.add("active");
    v52.title = "Отключить случайный порядок";
    f25();
  } else {
    v52.classList.remove("active");
    v52.title = "Случайный порядок";
    f26();
  }
}
function f25() {
  const v53 = v ? f41() : vA;
  vA3 = [...v53];
  vA4 = [...v53];
  for (let v54 = vA4.length - 1; v54 > 0; v54--) {
    const v55 = Math.floor(Math.random() * (v54 + 1));
    [vA4[v54], vA4[v55]] = [vA4[v55], vA4[v54]];
  }
  const v56 = document.getElementById("audioElement").src;
  const v57 = vA4.findIndex(p30 => p30.url === v56);
  vLN0 = v57 !== -1 ? v57 : 0;
}
function f26() {
  if (vA3.length > 0) {
    const v58 = document.getElementById("audioElement").src;
    const v59 = vA3.findIndex(p31 => p31.url === v58);
    vLN0 = v59 !== -1 ? v59 : 0;
    vA4 = [...vA3];
  }
}
function f27() {
  let v60;
  if (v9 && vA4.length > 0) {
    v60 = vA4;
  } else {
    v60 = v ? f41() : vA;
  }
  if (v60.length === 0) {
    return;
  }
  if (vLN0 === 0) {
    vLN0 = v60.length - 1;
  } else {
    vLN0 = (vLN0 - 1 + v60.length) % v60.length;
  }
  f21(v60[vLN0].id, v60);
}
function f28() {
  let v61;
  if (v9 && vA4.length > 0) {
    v61 = vA4;
  } else {
    v61 = v ? f41() : vA;
  }
  if (v61.length === 0) {
    return;
  }
  if (vLN0 === v61.length - 1) {
    vLN0 = 0;
  } else {
    vLN0 = (vLN0 + 1) % v61.length;
  }
  f21(v61[vLN0].id, v61);
}
function f29() {
  const v62 = document.getElementById("audioElement");
  const v63 = document.querySelector(".volume-btn");
  const v64 = document.getElementById("volume");
  if (v62.muted) {
    v62.muted = false;
    v64.value = vLN50;
    v62.volume = vLN50 / 100;
    v63.classList.remove("muted");
    f32(vLN50);
  } else {
    vLN50 = v62.volume * 100;
    v62.muted = true;
    v64.value = 0;
    v63.classList.add("muted");
    v63.classList.remove("low", "medium", "high");
  }
}
function f30() {
  const v65 = document.getElementById("volume");
  const v66 = document.getElementById("audioElement");
  v66.volume = v65.value / 100;
  f32(v65.value);
}
function f31(p32) {
  const v67 = document.getElementById("audioElement");
  const v68 = document.querySelector(".volume-btn");
  v67.volume = p32 / 100;
  v67.muted = false;
  f32(p32);
  vLN50 = p32;
}
function f32(p33) {
  const v69 = document.querySelector(".volume-btn");
  v69.classList.remove("muted", "low", "medium", "high");
  if (p33 == 0) {
    v69.classList.add("muted");
  } else if (p33 > 0 && p33 <= 33) {
    v69.classList.add("low");
  } else if (p33 > 33 && p33 <= 66) {
    v69.classList.add("medium");
  } else {
    v69.classList.add("high");
  }
}
function f33() {
  const v70 = document.getElementById("audioElement");
  const v71 = document.getElementById("progress");
  const v72 = document.getElementById("currentTime");
  const v73 = document.getElementById("duration");
  if (v70.duration) {
    const v74 = v70.currentTime / v70.duration * 100;
    v71.style.width = v74 + "%";
    v72.textContent = f35(v70.currentTime);
    v73.textContent = f35(v70.duration);
  }
}
function f34(p34) {
  const v75 = document.getElementById("audioElement");
  const v76 = p34.currentTarget;
  const v77 = p34.offsetX;
  const v78 = v76.offsetWidth;
  const v79 = v77 / v78 * v75.duration;
  v75.currentTime = v79;
}
function f35(p35) {
  const v80 = Math.floor(p35 / 60);
  const v81 = Math.floor(p35 % 60);
  return `${v80}:${v81.toString().padStart(2, "0")}`;
}
function f36() {
  document.getElementById("playlistName").value = "";
  document.getElementById("playlistModal").style.display = "flex";
}
function f37() {
  document.getElementById("playlistModal").style.display = "none";
}
async function f38() {
  const v82 = document.getElementById("playlistName").value.trim();
  if (!v82) {
    alert("Введите название плейлиста");
    return;
  }
  try {
    const v83 = await f52();
    const vO4 = {
      name: v82,
      user_id: v83,
      songs: []
    };
    const v84 = await f6(vO4);
    vA2.push(v84);
    f39();
    f42(v84);
    f37();
    f19("playlist", v84.id);
  } catch (e10) {
    alert("Ошибка создания плейлиста: " + e10.message);
  }
}
function f39() {
  const v85 = document.getElementById("playlistsList");
  v85.innerHTML = vA2.map(p36 => {
    const v86 = Array.isArray(p36.songs) ? p36.songs : [];
    const v87 = v86.length;
    return `
            <div class="nav-item playlist-item" onclick="showSection('playlist', '${p36.id}')">
                <span class="nav-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 22a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H3zm6-4h6a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1z"/>
                    </svg>
                </span>
                <span class="nav-text">${p36.name} <span style="color: #b3b3b3; font-size: 12px;">(${v87})</span></span>
                <button class="delete-playlist-btn" onclick="event.stopPropagation(); showDeleteConfirmation('${p36.id}', '${p36.name.replace(/'/g, "\\'")}')">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 10.586l4.95-4.95 1.414 1.414-4.95 4.95 4.95 4.95-1.414 1.414L12 13.414l-4.95 4.95-1.414-1.414 4.95-4.95-4.95-4.95L7.05 5.636z"/>
                    </svg>
                </button>
            </div>
        `;
  }).join("");
  if (vLSHome === "playlist" && v) {
    const v88 = document.querySelector(`[onclick*="${v}"]`);
    if (v88) {
      v88.classList.add("active");
    }
  }
}
function f40(p37) {
  const v89 = vA2.find(p38 => p38.id === p37);
  if (!v89) {
    return;
  }
  f42(v89);
  const v90 = document.getElementById(`playlist-${p37}`);
  document.querySelectorAll(".content-section").forEach(p39 => p39.classList.remove("active"));
  v90.classList.add("active");
  // TOLOOK
  setTimeout(() => f58(), 0);
}
function f41(p40 = null) {
  const v91 = p40 || v;
  const v92 = vA2.find(p41 => p41.id === v91);
  if (!v92) {
    console.log("Плейлист не найден:", v91);
    return [];
  }
  console.log("Данные плейлиста:", v92);
  const v93 = Array.isArray(v92.songs) ? v92.songs : [];
  console.log("ID песен в плейлисте:", v93);
  const v94 = v93.map(p42 => {
    const v95 = vA.find(p43 => p43.id === p42);
    if (!v95) {
      console.log("Песня не найдена в библиотеке:", p42);
    }
    return v95;
  }).filter(p44 => p44 !== undefined && p44 !== null);
  console.log("Найденные песни:", v94);
  return v94;
}
function f42(p45) {
  const v96 = document.getElementById("playlist-sections");
  const v97 = document.getElementById(`playlist-${p45.id}`);
  if (v97) {
    v97.remove();
  }
  const v98 = document.createElement("section");
  v98.id = `playlist-${p45.id}`;
  v98.className = "content-section playlist-section";
  const vF41 = f41(p45.id);
  const v99 = vF41.length;
  v98.innerHTML = `
        <header class="content-header">
            <div>
                <h1>${p45.name}</h1>
                <p>${v99} треков</p>
            </div>
        </header>
        <div class="music-grid" id="playlist-${p45.id}-songs">
            ${v99 === 0 ? "<p style=\"text-align: center; color: #b3b3b3; grid-column: 1 / -1; margin: 40px 0;\">Плейлист пуст</p>" : vF41.map(p46 => `
                    <div class="song-card" data-song-id="${p46.id}" data-song-url="${p46.url}">
                        <div class="album-art">🎵</div>
                        <div class="play-overlay" onclick="playSong('${p46.id}', getPlaylistSongs('${p45.id}'))">
                            <div class="play-icon"></div>
                            <div class="pause-icon"></div>
                        </div>
                        <button class="remove-from-playlist-btn" onclick="event.stopPropagation(); removeSongFromPlaylist('${p46.id}', '${p45.id}')" title="Удалить из плейлиста">
                            ×
                        </button>
                        <div class="song-info">
                            <h4>${p46.name}</h4>
                            <p>${p46.artist}</p>
                        </div>
                    </div>
                `).join("")}
        </div>
    `;
  v96.appendChild(v98);
  // TOLOOK
  setTimeout(() => f58(), 100);
}
function f43(p47, p48) {
  document.getElementById("addSongsModalTitle").textContent = `Добавить треки в "${p48}"`;
  const v100 = document.getElementById("availableSongsList");
  if (p47.length === 0) {
    v100.innerHTML = "<div class=\"no-songs-message\">Нет доступных треков для добавления</div>";
  } else {
    v100.innerHTML = p47.map(p49 => `
            <div class="song-selection-item">
                <div class="song-selection-info">
                    <h4>${p49.name}</h4>
                    <p>${p49.artist} • ${f35(p49.duration)}</p>
                </div>
                <button class="add-to-playlist-btn" onclick="addSongToPlaylist('${p49.id}')">
                    ➕ Добавить
                </button>
            </div>
        `).join("");
  }
  document.getElementById("addSongsModal").style.display = "flex";
}
function f44() {
  document.getElementById("addSongsModal").style.display = "none";
  v4 = null;
}
async function f45(p50, p51 = null) {
  const v101 = p51 || v4;
  if (!v101) {
    return;
  }
  const v102 = vA2.find(p52 => p52.id === v101);
  if (!v102) {
    return;
  }
  try {
    const v103 = Array.isArray(v102.songs) ? v102.songs : [];
    if (v103.includes(p50)) {
      f46("Этот трек уже есть в плейлисте!");
      return;
    }
    const vA5 = [...v103, p50];
    await f7(v101, {
      songs: vA5
    });
    const v104 = vA2.findIndex(p53 => p53.id === v101);
    if (v104 !== -1) {
      vA2[v104].songs = vA5;
    }
    const v105 = vA.find(p54 => p54.id === p50);
    if (v105) {
      f46(`"${v105.name}" добавлен в плейлист "${v102.name}"!`);
    }
    if (v === v101) {
      f60(v101);
    }
    f39();
    if (!p51) {
      f44();
    }
  } catch (e11) {
    console.error("Ошибка добавления в плейлист:", e11);
  }
}
function f46(p55) {
  const v106 = document.createElement("div");
  v106.style.cssText = `
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
  v106.textContent = p55;
  document.body.appendChild(v106);
  // TOLOOK
  setTimeout(() => {
    v106.remove();
  }, 3000);
}
function f47(p56) {
  v3 = p56;
  const vCleanFileName = f48(p56.name);
  document.getElementById("songTitle").value = vCleanFileName;
  document.getElementById("songArtist").value = "Неизвестный исполнитель";
  document.getElementById("originalFileName").textContent = p56.name;
  document.getElementById("filePreview").style.display = "block";
  f49(vCleanFileName);
  document.getElementById("metadataModal").style.display = "flex";
}
function f48(p57) {
  return p57.replace(/\.mp3$/i, "").replace(/\.MP3$/i, "").replace(/\.m4a$/i, "").replace(/\.wav$/i, "").replace(/\.flac$/i, "").replace(/undefined/gi, "").replace(/\([^)]*\)/g, "") // удаляет (2024), (Official Audio) и т.д.
  .replace(/\[[^\]]*\]/g, "") // удаляет [Official], [HD] и т.д.
  .replace(/_/g, " ") // заменяет подчеркивания на пробелы
  .replace(/\s+/g, " ") // убирает множественные пробелы
  .replace(/^\s+|\s+$/g, "") // убирает пробелы в начале и конце
  .replace(/^[0-9]+\s*-\s*/, "") // удаляет номер трека "01 - ", "1. " и т.д.
  .trim();
}
function f49(p58) {
  const vA6 = [" - ", " – ", " — ", " | "];
  for (let v107 of vA6) {
    if (p58.includes(v107)) {
      const v108 = p58.split(v107);
      if (v108.length === 2) {
        const v109 = v108[0].trim();
        const v110 = v108[1].trim();
        const v111 = document.createElement("div");
        v111.className = "auto-suggestion";
        v111.innerHTML = `💡 Авто-определение: <strong>${v109}</strong> - <strong>${v110}</strong>`;
        v111.onclick = function () {
          document.getElementById("songArtist").value = v109;
          document.getElementById("songTitle").value = v110;
          v111.remove();
        };
        const v112 = document.querySelector(".auto-suggestion");
        if (v112) {
          v112.remove();
        }
        document.getElementById("songTitle").parentNode.appendChild(v111);
        break;
      }
    }
  }
}
function f50() {
  const v113 = document.getElementById("songTitle").value.trim();
  const v114 = document.getElementById("songArtist").value.trim();
  if (!v113) {
    alert("Пожалуйста, введите название трека");
    return;
  }
  if (!v114) {
    alert("Пожалуйста, введите имя исполнителя");
    return;
  }
  document.getElementById("metadataModal").style.display = "none";
  f17(v3, vLN02, v113, v114);
}
function f51() {
  document.getElementById("metadataModal").style.display = "none";
  f18();
}
async function f52() {
  let v115 = localStorage.getItem("musicApp_userId");
  if (!v115) {
    v115 = "user_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
    localStorage.setItem("musicApp_userId", v115);
    try {
      await vCreateClient.from("users").insert([{
        id: v115,
        created_at: new Date().toISOString()
      }]);
    } catch (e12) {
      console.log("Пользователь уже существует или ошибка создания:", e12);
    }
  }
  return v115;
}
function f53(p59, p60) {
  v6 = p59;
  const v116 = `Вы точно хотите удалить плейлист "${p60}"? Это действие нельзя отменить.`;
  document.getElementById("deletePlaylistMessage").textContent = v116;
  document.getElementById("deletePlaylistModal").style.display = "flex";
}
function f54() {
  v6 = null;
  document.getElementById("deletePlaylistModal").style.display = "none";
}
async function f55() {
  if (!v6) {
    return;
  }
  try {
    const {
      error
    } = await vCreateClient.from("playlists").delete().eq("id", v6);
    if (error) {
      throw error;
    }
    const v117 = vA2.findIndex(p61 => p61.id === v6);
    const v118 = vA2[v117]?.name || "Плейлист";
    if (v117 !== -1) {
      vA2.splice(v117, 1);
    }
    const v119 = document.getElementById(`playlist-${v6}`);
    if (v119) {
      v119.remove();
    }
    f39();
    f46(`Плейлист "${v118}" удален`);
    if (v === v6) {
      f19("home");
    }
  } catch (e13) {
    console.error("Ошибка удаления плейлиста:", e13);
    alert("Ошибка при удалении плейлиста: " + e13.message);
  } finally {
    f54();
  }
}
function f56(p62) {
  const v120 = vA.find(p63 => p63.id === p62);
  if (!v120) {
    return;
  }
  document.getElementById("addSongsModalTitle").textContent = `Добавить "${v120.name}" в плейлист`;
  const v121 = document.getElementById("availableSongsList");
  if (vA2.length === 0) {
    v121.innerHTML = "<div class=\"no-songs-message\">У вас нет плейлистов. Создайте плейлист сначала.</div>";
  } else {
    v121.innerHTML = vA2.map(p64 => {
      const v122 = Array.isArray(p64.songs) ? p64.songs : [];
      const v123 = v122.includes(p62);
      return `
                <div class="song-selection-item">
                    <div class="song-selection-info">
                        <h4>${p64.name}</h4>
                        <p>${v122.length} треков</p>
                    </div>
                    <button class="add-to-playlist-btn ${v123 ? "added" : ""}" 
                            onclick="addSongToPlaylistFromModal('${p62}', '${p64.id}')"
                            ${v123 ? "disabled" : ""}>
                        ${v123 ? "✅ Добавлено" : "➕ Добавить"}
                    </button>
                </div>
            `;
    }).join("");
  }
  document.getElementById("addSongsModal").style.display = "flex";
}
function f57(p65, p66) {
  const v124 = vA2.find(p67 => p67.id === p66);
  if (!v124) {
    return;
  }
  const v125 = vA.find(p68 => p68.id === p65);
  if (!v125) {
    return;
  }
  f45(p65, p66);
  const v126 = document.querySelectorAll(".add-to-playlist-btn");
  v126.forEach(p69 => {
    if (p69.onclick && p69.onclick.toString().includes(p65) && p69.onclick.toString().includes(p66)) {
      p69.textContent = "✅ Добавлено";
      p69.classList.add("added");
      p69.disabled = true;
      p69.onclick = null;
    }
  });
}
function f58() {
  const v127 = document.getElementById("audioElement");
  const v128 = v127.src;
  const v129 = !v127.paused && v128;
  document.querySelectorAll(".song-card").forEach(p70 => {
    const v130 = p70.querySelector(".play-overlay");
    const v131 = p70.getAttribute("data-song-url") || vA.find(p71 => p71.id === p70.getAttribute("data-song-id"))?.url;
    if (v131 === v128 && v129) {
      v130.classList.add("playing");
    } else {
      v130.classList.remove("playing");
    }
  });
}
async function f59(p72, p73) {
  const v132 = vA2.find(p74 => p74.id === p73);
  if (!v132) {
    return;
  }
  const v133 = vA.find(p75 => p75.id === p72);
  if (!v133) {
    return;
  }
  try {
    const v134 = Array.isArray(v132.songs) ? v132.songs : [];
    const v135 = v134.filter(p76 => p76 !== p72);
    await f7(p73, {
      songs: v135
    });
    const v136 = vA2.findIndex(p77 => p77.id === p73);
    if (v136 !== -1) {
      vA2[v136].songs = v135;
    }
    f46(`"${v133.name}" удален из плейлиста "${v132.name}"!`);
    f60(p73);
    f39();
  } catch (e14) {
    console.error("Ошибка удаления из плейлиста:", e14);
  }
}
function f60(p78) {
  const v137 = vA2.find(p79 => p79.id === p78);
  if (!v137) {
    return;
  }
  const vF412 = f41(p78);
  const v138 = vF412.length;
  const v139 = document.getElementById(`playlist-${p78}`);
  if (!v139) {
    return;
  }
  const v140 = v139.querySelector(`#playlist-${p78}-songs`);
  if (!v140) {
    return;
  }
  const v141 = v139.querySelector(".content-header div");
  if (v141) {
    const v142 = v141.querySelector("p");
    if (v142) {
      v142.textContent = `${v138} треков`;
    }
  }
  if (v138 === 0) {
    v140.innerHTML = "<p style=\"text-align: center; color: #b3b3b3; grid-column: 1 / -1; margin: 40px 0;\">Плейлист пуст</p>";
  } else {
    v140.innerHTML = vF412.map(p80 => `
            <div class="song-card" data-song-id="${p80.id}" data-song-url="${p80.url}">
                <div class="album-art">🎵</div>
                <div class="play-overlay" onclick="playSong('${p80.id}', getPlaylistSongs('${p78}'))">
                    <div class="play-icon"></div>
                    <div class="pause-icon"></div>
                </div>
                <button class="remove-from-playlist-btn" onclick="event.stopPropagation(); removeSongFromPlaylist('${p80.id}', '${p78}')" title="Удалить из плейлиста">
                    ×
                </button>
                <div class="song-info">
                    <h4>${p80.name}</h4>
                    <p>${p80.artist}</p>
                </div>
            </div>
        `).join("");
  }
  // TOLOOK
  setTimeout(() => f58(), 100);
}
async function f61() {
  try {
    console.log("Инициализация онлайн пользователей...");

    // Создаем канал для онлайн пользователей
    v10 = vCreateClient.channel("online-users", {
      config: {
        presence: {
          key: v5
        }
      }
    });

    // Подписываемся на события присутствия
    v10.on("presence", {
      event: "sync"
    }, () => {
      console.log("Синхронизация присутствия...");
      const v143 = v10.presenceState();
      console.log("Текущее состояние:", v143);
      const v144 = Object.keys(v143).length;
      console.log("Количество пользователей онлайн:", v144);
      if (v144 !== vLN1 && v144 > 0) {
        f64(v144);
        vLN1 = v144;
      }
    }).on("presence", {
      event: "join"
    }, ({
      key,
      newPresences
    }) => {
      console.log("Пользователь присоединился:", key);
      newPresences.forEach(p81 => {
        v11.add(p81.key);
      });
      f64(v11.size);
    }).on("presence", {
      event: "leave"
    }, ({
      key,
      leftPresences
    }) => {
      console.log("Пользователь вышел:", key);
      leftPresences.forEach(p82 => {
        v11.delete(p82.key);
      });
      f64(v11.size);
    }).subscribe(async p83 => {
      console.log("Статус подписки:", p83);
      if (p83 === "SUBSCRIBED") {
        const v145 = await v10.track({
          user_id: v5,
          online_at: new Date().toISOString(),
          last_seen: new Date().toISOString()
        });
      }
    });
  } catch (e15) {
    console.error("Ошибка инициализации онлайн пользователей:", e15);
    f64(1);
  }
}
async function f62() {
  try {
    const vO5 = {
      user_id: v5,
      last_seen: new Date().toISOString(),
      page_url: window.location.href,
      user_agent: navigator.userAgent
    };
    const {
      error: updateError
    } = await vCreateClient.from("online_users").update(vO5).eq("user_id", v5);

    // Если запись не существует, создаем новую
    if (updateError || !updateError) {
      // Всегда пробуем вставить
      const {
        error: insertError
      } = await vCreateClient.from("online_users").insert([vO5]);
      if (insertError && !insertError.message.includes("duplicate key")) {
        console.error("❌ Ошибка вставки:", insertError);
      }
    }
    console.log("✅ Статус обновлен для пользователя:", v5);
  } catch (e16) {
    console.error("❌ Ошибка обновления онлайн статуса:", e16);
  }
}
async function f63() {
  try {
    // Время 2 минуты назад
    const v146 = new Date(Date.now() - 120000).toISOString();
    const {
      data,
      error,
      count
    } = await vCreateClient.from("online_users").select("user_id", {
      count: "exact"
    }).gt("last_seen", v146);
    if (error) {
      console.error("Ошибка запроса онлайн пользователей:", error);
      // Временно показываем 1 пользователя
      f64(1);
      return;
    }
    const v147 = count || 1; // Минимум 1 (текущий пользователь)

    // Обновляем счетчик
    f64(v147);
    vLN1 = v147;
  } catch (e17) {
    console.error("❌ Ошибка получения онлайн счетчика:", e17);
    // В случае ошибки показываем 1 пользователя
    f64(1);
  }
}
function f64(p84) {
  const v148 = document.getElementById("onlineCounter");
  if (!v148) {
    console.error("Элемент onlineCounter не найден");
    return;
  }
  const v149 = parseInt(v148.textContent) || 1;
  if (v149 === p84) {
    return;
  }
  console.log(`Обновление счетчика: ${v149} -> ${p84}`);

  // Создаем анимацию смены числа
  v148.classList.add("old");
  // TOLOOK
  setTimeout(() => {
    v148.textContent = p84;
    v148.classList.remove("old");
    v148.classList.add("new");
    // TOLOOK
    setTimeout(() => {
      v148.classList.remove("new");
    }, 300);
  }, 150);
}
function f65() {
  console.log("Очистка онлайн пользователей...");
  if (v10) {
    v10.unsubscribe();
    v10 = null;
  }
}
function f66() {
  const v150 = vLN1 + 1;
  f64(v150);
  vLN1 = v150;
}
function f67() {
  if (vLN1 > 1) {
    const v151 = vLN1 - 1;
    f64(v151);
    vLN1 = v151;
  }
}