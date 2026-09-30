/* ============================================================
   MAP.JS — Logika halaman peta level (map.html)
   ============================================================ */

const LEVELS = [
  { id: 1, judul: "Kenalan Dulu", sub: "Tebak dari foto", emoji: "🏠", align: "left" },
  { id: 2, judul: "Detektif Kelas", sub: "Ikuti petunjuk", emoji: "🔎", align: "right" },
  { id: 3, judul: "Mystery Box", sub: "Buka kejutan", emoji: "🎁", align: "left" },
  { id: 4, judul: "Memory Match", sub: "Cocokkan kartu", emoji: "🧠", align: "right" },
  { id: 5, judul: "Final Challenge", sub: "Campuran & cepat", emoji: "🏆", align: "center" }
];

function getProgress() {
  const completedLevel = parseInt(localStorage.getItem("kt_completed_level") || "0", 10);
  const savedProgress = parseInt(localStorage.getItem("kt_progress") || "1", 10);
  if (completedLevel <= 0) return 1;
  return Math.max(savedProgress, completedLevel + 1);
}

function renderMap() {
  const progress = getProgress();
  const pathEl = document.getElementById("levelPath");
  pathEl.innerHTML = "";

  LEVELS.forEach((lvl) => {
    const row = document.createElement("div");
    row.className = "level-node-row align-" + lvl.align;

    const btn = document.createElement("button");
    const unlocked = lvl.id <= progress;
    const done = lvl.id < progress;
    btn.className = "level-node" + (done ? " done" : "");
    btn.disabled = !unlocked;

    btn.innerHTML = `
      <div class="node-circle">${done ? "⭐" : lvl.emoji}</div>
      <div class="node-label">Level ${lvl.id}</div>
      <div class="node-sub">${lvl.judul}</div>
    `;

    btn.addEventListener("click", () => {
      if (!unlocked) return;
      SoundKit.click();
      window.location.href = "game.html?level=" + lvl.id;
    });

    row.appendChild(btn);
    pathEl.appendChild(row);
  });
}

function renderSessionHud() {
  const session = JSON.parse(localStorage.getItem("kt_session") || '{"score":0,"lives":5}');
  document.getElementById("mapScore").textContent = "⭐ " + session.score;
  const heartsWrap = document.getElementById("mapHearts");
  heartsWrap.innerHTML = "";
  for (let i = 0; i < 5; i++) {
    const span = document.createElement("span");
    span.textContent = "❤️";
    if (i >= session.lives) span.classList.add("heart-lost");
    heartsWrap.appendChild(span);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderMap();
  renderSessionHud();

  document.getElementById("btnResetProgress").addEventListener("click", () => {
    if (confirm("Ulangi petualangan dari Level 1? Progres peta akan direset.")) {
      localStorage.setItem("kt_progress", "1");
      localStorage.removeItem("kt_completed_level");
      localStorage.setItem("kt_session", JSON.stringify({ score: 0, lives: 5 }));
      renderMap();
      renderSessionHud();
      SoundKit.click();
    }
  });

  document.getElementById("hudMute").addEventListener("click", () => {
    const muted = SoundKit.toggleMute();
    document.getElementById("hudMute").textContent = muted ? "🔇" : "🔊";
  });
  document.getElementById("hudMute").textContent = SoundKit.isMuted() ? "🔇" : "🔊";
});