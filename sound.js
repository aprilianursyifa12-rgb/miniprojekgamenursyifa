/* ============================================================
   SOUND.JS — Efek suara & musik latar
   ------------------------------------------------------------
   Efek suara (klik, benar, salah, menang, kalah) dibuat langsung
   pakai Web Audio API, jadi game TETAP punya suara walaupun kamu
   belum menaruh file audio apapun.

   Musik latar (opsional): kalau kamu taruh file mp3 di
   audio/background.mp3, game otomatis memutarnya pelan-pelan
   saat kamu menekan tombol Mulai. Kalau filenya belum ada,
   bagian ini otomatis dilewati (tidak akan error).
   ============================================================ */

const SoundKit = (() => {
  let ctx = null;
  let muted = localStorage.getItem("kt_muted") === "1";
  let bgAudio = null;

  function getCtx() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return ctx;
  }

  function tone(freq, duration, type = "sine", volume = 0.18, delay = 0) {
    if (muted) return;
    try {
      const ac = getCtx();
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.value = volume;
      osc.connect(gain);
      gain.connect(ac.destination);
      const startAt = ac.currentTime + delay;
      osc.start(startAt);
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
      osc.stop(startAt + duration + 0.02);
    } catch (e) {
      /* Abaikan kalau browser memblokir audio sebelum interaksi user */
    }
  }

  return {
    isMuted: () => muted,

    toggleMute() {
      muted = !muted;
      localStorage.setItem("kt_muted", muted ? "1" : "0");
      if (bgAudio) bgAudio.muted = muted;
      return muted;
    },

    click() {
      tone(520, 0.08, "square", 0.12);
    },

    correct() {
      tone(660, 0.12, "sine", 0.2);
      tone(880, 0.16, "sine", 0.18, 0.1);
    },

    wrong() {
      tone(220, 0.2, "sawtooth", 0.18);
      tone(160, 0.25, "sawtooth", 0.15, 0.12);
    },

    win() {
      [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.18, "sine", 0.2, i * 0.12));
    },

    gameOver() {
      [392, 349, 293, 220].forEach((f, i) => tone(f, 0.25, "triangle", 0.18, i * 0.15));
    },

    flip() {
      tone(440, 0.06, "square", 0.1);
    },

    startMusic() {
      if (bgAudio) return;
      bgAudio = new Audio("audio/background.mp3");
      bgAudio.loop = true;
      bgAudio.volume = 0.25;
      bgAudio.muted = muted;
      bgAudio.play().catch(() => {
        /* Belum ada file audio/background.mp3 — tidak apa-apa, dilewati saja */
        bgAudio = null;
      });
    }
  };
})();