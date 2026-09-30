/* ============================================================
   GAME.JS — Inti logika permainan untuk semua level
   ============================================================ */

const LEVEL_INFO = {
  1: { judul: "Kenalan Dulu", emoji: "🏠" },
  2: { judul: "Detektif Kelas", emoji: "🔎" },
  3: { judul: "Mystery Box", emoji: "🎁" },
  4: { judul: "Memory Match", emoji: "🧠" },
  5: { judul: "Final Challenge", emoji: "🏆" }
};

let session = JSON.parse(localStorage.getItem("kt_session") || '{"score":0,"lives":5}');
let currentLevel = 1;
let activeTimer = null;

/* ---------------- Util umum ---------------- */

function shuffleArr(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandomFriends(n, excludeIds = []) {
  const pool = FRIENDS.filter((f) => !excludeIds.includes(f.id));
  return shuffleArr(pool).slice(0, n);
}

function avatarFrameHTML(friend, size = "") {
  return `
    <div class="avatar-frame ${size}" style="background:${friend.warna}">
      <img src="${friend.foto}" alt="${friend.nama}"
           onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex';">
      <div class="avatar-fallback">${friend.inisial}</div>
    </div>
  `;
}

function saveSession() {
  localStorage.setItem("kt_session", JSON.stringify(session));
}

function updateHud() {
  document.getElementById("gameScore").textContent = "⭐ " + session.score;
  const heartsWrap = document.getElementById("gameHearts");
  heartsWrap.innerHTML = "";
  for (let i = 0; i < 5; i++) {
    const span = document.createElement("span");
    span.textContent = "❤️";
    if (i >= session.lives) span.classList.add("heart-lost");
    heartsWrap.appendChild(span);
  }
}

function addScore(n) {
  session.score += n;
  saveSession();
  updateHud();
}

function loseLife() {
  session.lives -= 1;
  saveSession();
  updateHud();
  if (session.lives <= 0) {
    stopActiveTimer();
    SoundKit.gameOver();
    setTimeout(showGameOver, 500);
    return true;
  }
  return false;
}

function stopActiveTimer() {
  if (activeTimer) {
    clearInterval(activeTimer);
    activeTimer = null;
  }
}

function closeAnyOverlay() {
  document.querySelectorAll(".dynamic-overlay").forEach((el) => el.remove());
}

function showOverlay(html) {
  const div = document.createElement("div");
  div.className = "overlay dynamic-overlay";
  div.innerHTML = `<div class="overlay-card">${html}</div>`;
  document.body.appendChild(div);
  return div;
}

function showGameOver() {
  closeAnyOverlay();
  const ov = showOverlay(`
    <span class="overlay-emoji">💔</span>
    <h2>Game Over</h2>
    <p>Nyawa kamu habis di Level ${currentLevel}. Semangat, coba lagi ya!</p>
    <button class="btn btn-block" id="btnCobaLagi">🔄 Coba Lagi</button>
  `);
  ov.querySelector("#btnCobaLagi").addEventListener("click", () => {
    localStorage.setItem("kt_progress", "1");
    localStorage.setItem("kt_session", JSON.stringify({ score: 0, lives: 5 }));
    window.location.href = "map.html";
  });
}

function showLevelClear() {
  stopActiveTimer();
  SoundKit.win();
  spawnConfetti();
  closeAnyOverlay();
  const ov = showOverlay(`
    <span class="overlay-emoji">🎉</span>
    <h2>Level ${currentLevel} Selesai!</h2>
    <p>Skor kamu sekarang: <b>${session.score}</b></p>
    <button class="btn btn-block" id="btnLanjut">${currentLevel === 5 ? "🏁 Lihat Hasil" : "➡️ Lanjut ke Peta"}</button>
  `);
  localStorage.setItem("kt_completed_level", String(currentLevel));
  ov.querySelector("#btnLanjut").addEventListener("click", () => {
    const progress = parseInt(localStorage.getItem("kt_progress") || "1", 10);
    if (currentLevel === 5) {
      finalizeGame();
    } else {
      localStorage.setItem("kt_progress", String(Math.max(progress, currentLevel + 1)));
      window.location.href = "map.html";
    }
  });
}

function finalizeGame() {
  const highscore = parseInt(localStorage.getItem("kt_highscore") || "0", 10);
  if (session.score > highscore) {
    localStorage.setItem("kt_highscore", String(session.score));
  }
  localStorage.setItem("kt_lastscore", String(session.score));
  localStorage.setItem("kt_progress", "6");
  window.location.href = "hasil.html";
}

function spawnConfetti() {
  const colors = ["#FF9EC1", "#FFC857", "#7FDDC4", "#7FB8E0", "#F76E9C"];
  for (let i = 0; i < 40; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    piece.style.left = Math.random() * 100 + "vw";
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDuration = 1.8 + Math.random() * 1.4 + "s";
    piece.style.borderRadius = Math.random() > 0.5 ? "50%" : "2px";
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), 3200);
  }
}

/* ============================================================
   LEVEL 1 — Kenalan Dulu (tebak nama dari foto)
   ============================================================ */
function initLevel1() {
  const total = CONFIG.level1.totalSoal;
  const soalFriends = pickRandomFriends(total);
  let qIndex = 0;

  function render() {
    if (qIndex >= total) return showLevelClear();
    const friend = soalFriends[qIndex];
    const distractors = pickRandomFriends(3, [friend.id]);
    const choices = shuffleArr([friend, ...distractors]);

    document.getElementById("gameArea").innerHTML = `
      <p class="small-note" style="margin-bottom:10px;">Soal ${qIndex + 1} dari ${total}</p>
      <div class="question-photo-wrap">${avatarFrameHTML(friend)}</div>
      <h3 class="center-col" style="margin-bottom:14px;">Siapa nama teman ini?</h3>
      <div class="choice-grid" id="choiceGrid">
        ${choices.map((c) => `<button class="choice-btn" data-id="${c.id}">${c.nama}</button>`).join("")}
      </div>
    `;

    document.querySelectorAll(".choice-btn").forEach((btn) => {
      btn.addEventListener("click", () => handleAnswer(btn, friend.id));
    });
  }

  function handleAnswer(btn, correctId) {
    document.querySelectorAll(".choice-btn").forEach((b) => b.classList.add("disabled-choice"));
    const isCorrect = btn.dataset.id === correctId;
    if (isCorrect) {
      btn.classList.add("correct");
      SoundKit.correct();
      addScore(CONFIG.level1.poinBenar);
    } else {
      btn.classList.add("wrong");
      document.querySelector(`.choice-btn[data-id="${correctId}"]`).classList.add("correct");
      SoundKit.wrong();
      if (loseLife()) return;
    }
    setTimeout(() => {
      qIndex++;
      render();
    }, 900);
  }

  render();
}

/* ============================================================
   LEVEL 2 — Detektif Kelas (petunjuk + timer)
   ============================================================ */
function initLevel2() {
  const total = CONFIG.level2.totalSoal;
  const waktu = CONFIG.level2.waktuPerSoal;
  const soalFriends = pickRandomFriends(total);
  let qIndex = 0;

  function render() {
    if (qIndex >= total) return showLevelClear();
    const friend = soalFriends[qIndex];
    const distractors = pickRandomFriends(3, [friend.id]);
    const choices = shuffleArr([friend, ...distractors]);
    let remaining = waktu;

    document.getElementById("gameArea").innerHTML = `
      <p class="small-note" style="margin-bottom:10px;">Soal ${qIndex + 1} dari ${total}</p>
      <div class="timer-bar-outer"><div class="timer-bar-inner" id="timerBar" style="width:100%"></div></div>
      <ul class="clue-list">
        <li>🏊 ${friend.hobi}</li>
        <li>🍽️ Makanan favorit: ${friend.makanan}</li>
      </ul>
      <h3 class="center-col" style="margin-bottom:14px;">Siapakah dia?</h3>
      <div class="choice-grid" id="choiceGrid">
        ${choices.map((c) => `<button class="choice-btn" data-id="${c.id}">${avatarFrameHTML(c, "small")}<br>${c.nama}</button>`).join("")}
      </div>
    `;

    document.querySelectorAll(".choice-btn").forEach((btn) => {
      btn.addEventListener("click", () => handleAnswer(btn, friend.id));
    });

    stopActiveTimer();
    activeTimer = setInterval(() => {
      remaining -= 0.1;
      const pct = Math.max(0, (remaining / waktu) * 100);
      const bar = document.getElementById("timerBar");
      if (bar) {
        bar.style.width = pct + "%";
        bar.classList.toggle("warning", pct < 35);
      }
      if (remaining <= 0) {
        stopActiveTimer();
        forceTimeout(friend.id);
      }
    }, 100);
  }

  function forceTimeout(correctId) {
    document.querySelectorAll(".choice-btn").forEach((b) => b.classList.add("disabled-choice"));
    const correctBtn = document.querySelector(`.choice-btn[data-id="${correctId}"]`);
    if (correctBtn) correctBtn.classList.add("correct");
    SoundKit.wrong();
    if (loseLife()) return;
    setTimeout(() => {
      qIndex++;
      render();
    }, 900);
  }

  function handleAnswer(btn, correctId) {
    stopActiveTimer();
    document.querySelectorAll(".choice-btn").forEach((b) => b.classList.add("disabled-choice"));
    const isCorrect = btn.dataset.id === correctId;
    if (isCorrect) {
      btn.classList.add("correct");
      SoundKit.correct();
      addScore(CONFIG.level2.poinBenar);
    } else {
      btn.classList.add("wrong");
      const correctBtn = document.querySelector(`.choice-btn[data-id="${correctId}"]`);
      if (correctBtn) correctBtn.classList.add("correct");
      SoundKit.wrong();
      if (loseLife()) return;
    }
    setTimeout(() => {
      qIndex++;
      render();
    }, 900);
  }

  render();
}

/* ============================================================
   LEVEL 3 — Mystery Box
   ============================================================ */
function initLevel3() {
  const totalKotakDibuka = CONFIG.level3.totalKotak;
  const totalBoxRendered = 6;
  let openedCount = 0;
  const openedBoxes = new Set();

  function render() {
    document.getElementById("gameArea").innerHTML = `
      <p class="small-note" style="margin-bottom:10px;">
        Buka ${totalKotakDibuka} dari ${totalBoxRendered} kotak misteri (${openedCount}/${totalKotakDibuka} terbuka)
      </p>
      <div class="box-grid" id="boxGrid">
        ${Array.from({ length: totalBoxRendered }).map((_, i) => `<button class="mystery-box" data-idx="${i}">❔</button>`).join("")}
      </div>
    `;
    document.querySelectorAll(".mystery-box").forEach((box) => {
      box.addEventListener("click", () => openBox(box));
    });
  }

  function openBox(box) {
    const boxIndex = box.dataset.idx;
    if (openedCount >= totalKotakDibuka || openedBoxes.has(boxIndex)) return;
    openedBoxes.add(boxIndex);
    openedCount++;
    SoundKit.click();
    box.disabled = true;
    const progressNote = document.querySelector("#gameArea .small-note");
    if (progressNote) {
      progressNote.textContent = `Buka ${totalKotakDibuka} dari ${totalBoxRendered} kotak misteri (${openedCount}/${totalKotakDibuka} terbuka)`;
    }

    box.innerHTML = `<span class="box-reveal-emoji">❓</span>`;
    box.classList.add("opened");
    askMiniQuestion(box);
  }

  function askMiniQuestion(box) {
    const friend = pickRandomFriends(1)[0];
    const distractors = pickRandomFriends(3, [friend.id]);
    const choices = shuffleArr([friend, ...distractors]);
    const ov = showOverlay(`
      <span class="overlay-emoji">❓</span>
      <h2>Pertanyaan Mystery Box</h2>
      <ul class="clue-list">
        <li>🏊 ${friend.hobi}</li>
        <li>🍽️ Makanan favorit: ${friend.makanan}</li>
      </ul>
      <p>Siapakah teman ini?</p>
      <div class="choice-grid" id="miniChoiceGrid">
        ${choices.map((c) => `<button class="choice-btn" data-id="${c.id}">${c.nama}</button>`).join("")}
      </div>
    `);

    ov.querySelectorAll(".choice-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        ov.querySelectorAll(".choice-btn").forEach((b) => b.classList.add("disabled-choice"));
        const isCorrect = btn.dataset.id === friend.id;
        if (isCorrect) {
          btn.classList.add("correct");
          SoundKit.correct();
          addScore(15);
        } else {
          btn.classList.add("wrong");
          const cb = ov.querySelector(`.choice-btn[data-id="${friend.id}"]`);
          if (cb) cb.classList.add("correct");
          SoundKit.wrong();
          if (loseLife()) return;
        }
        setTimeout(() => {
          ov.remove();
          finishBox(isCorrect ? "🎉 Jawaban benar!" : `Jawaban yang benar: ${friend.nama}`);
        }, 900);
      });
    });
  }

  function finishBox(msg) {
    if (openedCount >= totalKotakDibuka) {
      setTimeout(showLevelClear, 500);
    }
  }

  render();
}

/* ============================================================
   LEVEL 4 — Memory Match
   ============================================================ */
function initLevel4() {
  const jumlahPasangan = CONFIG.level4.jumlahPasangan;
  const chosen = pickRandomFriends(jumlahPasangan);
  let cards = [];
  chosen.forEach((friend) => {
    cards.push({ friendId: friend.id, type: "photo" });
    cards.push({ friendId: friend.id, type: "name" });
  });
  cards = shuffleArr(cards).map((card, index) => ({ ...card, uid: index }));

  let flipped = [];
  let matchedCount = 0;
  let lock = false;

  function cardBackHTML(card) {
    const friend = FRIENDS.find((item) => item.id === card.friendId);
    if (card.type === "photo") return avatarFrameHTML(friend, "small");
    return `<div class="memory-name">${friend.nama}</div>`;
  }

  function render() {
    document.getElementById("gameArea").innerHTML = `
      <p class="small-note" style="margin-bottom:10px;">Cocokkan foto dengan nama teman (${matchedCount}/${jumlahPasangan} pasang)</p>
      <div class="memory-grid" id="memoryGrid">
        ${cards.map((card) => `
          <div class="memory-card" data-uid="${card.uid}">
            <div class="memory-card-inner">
              <div class="memory-face front">❔</div>
              <div class="memory-face back">${cardBackHTML(card)}</div>
            </div>
          </div>
        `).join("")}
      </div>
    `;
    document.querySelectorAll(".memory-card").forEach((card) => {
      card.addEventListener("click", () => handleFlip(card));
    });
  }

  function handleFlip(element) {
    if (lock || flipped.length >= 2) return;
    const uid = parseInt(element.dataset.uid, 10);
    if (element.classList.contains("flipped") || element.classList.contains("matched")) return;

    element.classList.add("flipped");
    SoundKit.flip();
    flipped.push({ element, data: cards.find((card) => card.uid === uid) });

    if (flipped.length !== 2) return;

    lock = true;
    const [first, second] = flipped;
    const isMatch = first.data.friendId === second.data.friendId && first.data.type !== second.data.type;
    if (isMatch) {
      first.element.classList.add("matched");
      second.element.classList.add("matched");
      SoundKit.correct();
      addScore(15);
      matchedCount++;
      flipped = [];
      lock = false;
      if (matchedCount >= jumlahPasangan) setTimeout(showLevelClear, 500);
      return;
    }

    SoundKit.wrong();
    setTimeout(() => {
      first.element.classList.remove("flipped");
      second.element.classList.remove("flipped");
      flipped = [];
      lock = false;
    }, 800);
  }

  render();
}

/* ============================================================
   LEVEL 5 — Final Challenge (campuran + lebih cepat)
   ============================================================ */
function initLevel5() {
  const total = CONFIG.level5.totalSoal;
  const waktu = CONFIG.level5.waktuPerSoal;
  const soalFriends = pickRandomFriends(Math.min(total, FRIENDS.length));
  while (soalFriends.length < total) {
    soalFriends.push(...pickRandomFriends(total - soalFriends.length));
  }
  const soalList = soalFriends.slice(0, total).map((f) => ({
    friend: f,
    tipe: Math.random() > 0.5 ? "foto" : "petunjuk"
  }));
  let qIndex = 0;

  function render() {
    if (qIndex >= total) return showLevelClear();
    const soal = soalList[qIndex];
    const friend = soal.friend;
    const distractors = pickRandomFriends(3, [friend.id]);
    const choices = shuffleArr([friend, ...distractors]);
    let remaining = waktu;

    const kontenSoal = soal.tipe === "foto"
      ? `<div class="question-photo-wrap">${avatarFrameHTML(friend)}</div><h3 class="center-col" style="margin-bottom:14px;">Siapa nama teman ini?</h3>`
      : `<ul class="clue-list"><li>🏊 ${friend.hobi}</li><li>🍽️ ${friend.makanan}</li></ul><h3 class="center-col" style="margin-bottom:14px;">Siapakah dia?</h3>`;

    document.getElementById("gameArea").innerHTML = `
      <p class="small-note" style="margin-bottom:10px;">Soal ${qIndex + 1} dari ${total} — cepat!</p>
      <div class="timer-bar-outer"><div class="timer-bar-inner" id="timerBar" style="width:100%"></div></div>
      ${kontenSoal}
      <div class="choice-grid" id="choiceGrid">
        ${choices.map((c) => `<button class="choice-btn" data-id="${c.id}">${c.nama}</button>`).join("")}
      </div>
    `;

    document.querySelectorAll(".choice-btn").forEach((btn) => {
      btn.addEventListener("click", () => handleAnswer(btn, friend.id));
    });

    stopActiveTimer();
    activeTimer = setInterval(() => {
      remaining -= 0.1;
      const pct = Math.max(0, (remaining / waktu) * 100);
      const bar = document.getElementById("timerBar");
      if (bar) {
        bar.style.width = pct + "%";
        bar.classList.toggle("warning", pct < 35);
      }
      if (remaining <= 0) {
        stopActiveTimer();
        settle(null, friend.id);
      }
    }, 100);
  }

  function handleAnswer(btn, correctId) {
    stopActiveTimer();
    settle(btn, correctId);
  }

  function settle(btn, correctId) {
    document.querySelectorAll(".choice-btn").forEach((b) => b.classList.add("disabled-choice"));
    const isCorrect = btn && btn.dataset.id === correctId;
    const correctBtn = document.querySelector(`.choice-btn[data-id="${correctId}"]`);
    if (isCorrect) {
      btn.classList.add("correct");
      SoundKit.correct();
      addScore(CONFIG.level5.poinBenar);
    } else {
      if (btn) btn.classList.add("wrong");
      if (correctBtn) correctBtn.classList.add("correct");
      SoundKit.wrong();
      if (loseLife()) return;
    }
    setTimeout(() => {
      qIndex++;
      render();
    }, 800);
  }

  render();
}

/* ============================================================
   INISIALISASI HALAMAN
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  currentLevel = parseInt(params.get("level") || "1", 10);
  if (currentLevel < 1 || currentLevel > 5) currentLevel = 1;

  const completedLevel = parseInt(localStorage.getItem("kt_completed_level") || "0", 10);
  const savedProgress = parseInt(localStorage.getItem("kt_progress") || "1", 10);
  const progress = completedLevel > 0 ? Math.max(savedProgress, completedLevel + 1) : 1;
  if (currentLevel > progress) {
    window.location.href = "map.html";
    return;
  }

  const info = LEVEL_INFO[currentLevel];
  document.getElementById("levelTitle").textContent = `${info.emoji} Level ${currentLevel} — ${info.judul}`;

  updateHud();

  document.getElementById("hudMute").addEventListener("click", () => {
    const muted = SoundKit.toggleMute();
    document.getElementById("hudMute").textContent = muted ? "🔇" : "🔊";
  });
  document.getElementById("hudMute").textContent = SoundKit.isMuted() ? "🔇" : "🔊";

  if (session.lives <= 0) {
    session = { score: 0, lives: 5 };
    saveSession();
  }

  const initFns = { 1: initLevel1, 2: initLevel2, 3: initLevel3, 4: initLevel4, 5: initLevel5 };
  initFns[currentLevel]();
});