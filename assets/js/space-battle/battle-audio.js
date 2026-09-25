// Reuses the established Space Junkz weapon identity without coupling the
// decorative Command Centre battle layer to the game engine.
//
// Browser autoplay rules require one user interaction before audible playback.
// A click/drag/key press anywhere on the page activates subsequent loop sounds.
const JUNKZ_REVISION = "eb14a0a9194486f083fc6b9f3f8ec0be041d51ee";
const JUNKZ_SOUND_ROOT =
  `https://raw.githubusercontent.com/999nike/space-junkz-shooter/${JUNKZ_REVISION}/src/game/sounds`;

const DEFINITIONS = Object.freeze({
  playerShot: {
    src: `${JUNKZ_SOUND_ROOT}/Sci-Fi%20Weapon%20SFX%20by%20Lentikula/Laser%20Pistol%201.wav`,
    // Matches the effective default loudness used by Space Junkz (0.336 * 0.7).
    volume: .235,
    pool: 4
  },
  bossLaser: {
    src: `${JUNKZ_SOUND_ROOT}/Sci-Fi%20Weapon%20SFX%20by%20Lentikula/Laser%20Beam%202.wav`,
    volume: .385,
    pool: 2
  },
  enemyExplosion: {
    src: `${JUNKZ_SOUND_ROOT}/sci-fi-sfx/retro_explosion.ogg`,
    volume: .28,
    pool: 2
  }
});

function createVoices(definition) {
  return Array.from({ length: definition.pool }, () => {
    const audio = new Audio(definition.src);
    audio.preload = "auto";
    audio.volume = definition.volume;
    return { audio, lastUsed: 0 };
  });
}

export function createSpaceBattleAudio({
  playerShotTimes,
  impactTimes,
  bossFireTime,
  loopSeconds
}) {
  const pools = Object.fromEntries(
    Object.entries(DEFINITIONS).map(([name, definition]) => [name, createVoices(definition)])
  );

  const events = [
    ...playerShotTimes.map((time) => ({ time, name: "playerShot" })),
    { time: bossFireTime, name: "bossLaser" },
    // Use the normal-enemy explosion from Junkz only at the end of each
    // three-shot player burst, rather than on every projectile impact.
    { time: impactTimes[2], name: "enemyExplosion" },
    { time: impactTimes[5], name: "enemyExplosion" }
  ].sort((a, b) => a.time - b.time);

  let active = false;
  let primed = false;
  let lastTime = null;
  let disposed = false;

  function primeAudio() {
    if (disposed || primed) return;
    primed = true;
    active = true;

    // Chrome/Safari may still block delayed media playback unless an element
    // actually starts during the trusted user gesture. Prime one voice from
    // each pool almost silently, then rewind it for the cinematic timeline.
    Object.entries(pools).forEach(([name, voices]) => {
      const voice = voices[0];
      const definition = DEFINITIONS[name];
      voice.audio.volume = .0001;
      voice.audio.muted = false;
      try { voice.audio.currentTime = 0; } catch (_) {}

      try {
        const playback = voice.audio.play();
        if (playback && typeof playback.then === "function") {
          playback.then(() => {
            window.setTimeout(() => {
              if (disposed) return;
              voice.audio.pause();
              try { voice.audio.currentTime = 0; } catch (_) {}
              voice.audio.volume = definition.volume;
            }, 45);
          }).catch((error) => {
            primed = false;
            console.warn(`Orbital battle audio prime failed for ${name}:`, error);
          });
        }
      } catch (error) {
        primed = false;
        console.warn(`Orbital battle audio prime failed for ${name}:`, error);
      }
    });

    console.info("Orbital battle audio enabled.");
  }

  document.addEventListener("pointerdown", primeAudio, { passive: true });
  document.addEventListener("keydown", primeAudio);

  function play(name) {
    if (!active || disposed) return;
    const definition = DEFINITIONS[name];
    const pool = pools[name];
    if (!definition || !pool) return;

    const now = performance.now();
    const voice =
      pool.find(({ audio }) => audio.paused || audio.ended) ||
      pool.reduce((oldest, candidate) =>
        candidate.lastUsed < oldest.lastUsed ? candidate : oldest
      );

    voice.lastUsed = now;
    voice.audio.volume = definition.volume;
    try { voice.audio.currentTime = 0; } catch (_) {}
    try {
      const playback = voice.audio.play();
      if (playback && typeof playback.catch === "function") {
        playback.catch((error) => {
          console.warn(`Orbital battle sound failed (${name}):`, error);
        });
      }
    } catch (error) {
      console.warn(`Orbital battle sound failed (${name}):`, error);
    }
  }

  function update(time) {
    if (disposed) return;

    const current = ((time % loopSeconds) + loopSeconds) % loopSeconds;
    if (lastTime === null) {
      lastTime = current;
      return;
    }

    const wrapped = current < lastTime;
    for (const event of events) {
      const crossed = wrapped
        ? event.time > lastTime || event.time <= current
        : event.time > lastTime && event.time <= current;
      if (crossed) play(event.name);
    }

    lastTime = current;
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    document.removeEventListener("pointerdown", primeAudio);
    document.removeEventListener("keydown", primeAudio);
    Object.values(pools).flat().forEach(({ audio }) => {
      audio.pause();
      try { audio.currentTime = 0; } catch (_) {}
    });
  }

  return { update, dispose };
}
