/**
 * Moods: short-lived reactions a head has to what the pointer does to it.
 *
 * Every head carries at most one mood. A mood fades in while its cause lasts,
 * is held a moment after the cause ends, and then fades out. A stronger mood
 * can interrupt a weaker one; a weaker one waits until the stronger has gone.
 *
 * The board only decides *which* mood and *how much*. `applyMood` turns that
 * into the pose, gaze, lids and mouth the renderer already understands, and
 * the renderer reads `state.mood` for the parts that need new drawing:
 * swapped eyes, mouths and brows, blush, and the moodlet above the head.
 */

export const MOODS = Object.freeze({
  sleepy: { rank: 0, rise: 0.8, fall: 3, hold: 0.5 },
  yawn: { rank: 0.5, rise: 7, fall: 2.6, hold: 0.25 },
  curious: { rank: 1, rise: 2.5, fall: 3, hold: 0.8 },
  hiccup: { rank: 1.2, rise: 10, fall: 3, hold: 0.3 },
  hum: { rank: 1.5, rise: 2, fall: 1.8, hold: 1.1 },
  wink: { rank: 1.8, rise: 12, fall: 4, hold: 0.2 },
  shy: { rank: 2, rise: 3, fall: 2.2, hold: 0.9 },
  idea: { rank: 2.5, rise: 9, fall: 2.4, hold: 0.3 },
  jealous: { rank: 2.8, rise: 2.2, fall: 1.8, hold: 0.8 },
  love: { rank: 3, rise: 2.5, fall: 1.6, hold: 1.4 },
  giggle: { rank: 3.4, rise: 6, fall: 2.2, hold: 0.7 },
  phew: { rank: 3.6, rise: 8, fall: 2, hold: 0.9 },
  startled: { rank: 4, rise: 14, fall: 2.5, hold: 0.7 },
  proud: { rank: 4.5, rise: 4, fall: 1.8, hold: 0.3 },
  sneeze: { rank: 4.8, rise: 12, fall: 4, hold: 0.2 },
  dizzy: { rank: 5, rise: 5, fall: 1.4, hold: 1.2 },
  raspberry: { rank: 5.5, rise: 8, fall: 2.4, hold: 1.5 },
  annoyed: { rank: 6, rise: 4, fall: 1.2, hold: 2 },
});

/**
 * One-shot moods play through a fixed length of time; their `phase` runs from
 * 0 to 1 over it. Everything else lasts as long as its cause.
 */
export const MOOD_LENGTHS = Object.freeze({
  yawn: 1.4,
  sneeze: 1.9,
  wink: 0.95,
  idea: 2.2,
  proud: 2.6,
  hiccup: 0.5,
});

const HOVER_REACH = 1.15;
const SHY_AFTER = 0.9;
const LOVE_AFTER = 3.2;
const CURIOUS_REACH = 2.6;
const CURIOUS_AFTER = 1.6;
const CURIOUS_SPEED = 260;
const STARTLE_REACH = 2.4;
const STARTLE_SPEED = 2600;
const STARTLE_COOLDOWN = 4;
const SHAKE_REACH = 3.2;
const SHAKE_WINDOW = 0.9;
const SHAKE_REVERSALS = 4;
const SHAKE_MIN_SPEED = 700;
const ANNOYED_AFTER_DIZZY = 2.4;
const SLEEP_AFTER = 13;
const SLEEP_STAGGER = 1.7;
const GASP_REACH = 1.2;
const STILL_AFTER = 0.35;
const HUM_REACH = 2.4;
const HUM_AFTER = 2.5;
const YAWN_LENGTH = MOOD_LENGTHS.yawn;
const YAWN_IDLE = 8;
const YAWN_NEIGHBOUR = 1.2;
const YAWN_HOPS = 2;
const YAWN_CATCH_MIN = 0.4;
const YAWN_CATCH_MAX = 1.2;
const YAWN_COOLDOWN = 16;
const YAWN_SPONTANEOUS_MIN = 40;
const YAWN_SPONTANEOUS_MAX = 90;
/** Tickling: gentle back-and-forth wiggles, slower than a shake. */
const TICKLE_WINDOW = 1.1;
const TICKLE_REVERSALS = 4;
const TICKLE_MIN_SPEED = 40;
const TICKLE_MAX_SPEED = 1100;
/** Under the chin, in head masses from the head's centre. */
const CHIN_ACROSS = 0.8;
const CHIN_TOP = 0.7;
const CHIN_BOTTOM = 1.75;
const GIGGLE_AFTER = 0.2;
const GIGGLE_NEIGHBOUR = 1.3;
const GIGGLE_CATCH_MIN = 0.45;
const GIGGLE_CATCH_MAX = 1.1;
const GIGGLE_CAUGHT_FOR = 1.7;
const GIGGLE_SPREAD_COOLDOWN = 9;
const HICCUP_AFTER_GIGGLE = 2;
const HICCUP_CHANCE = 0.65;
const HICCUP_GAP_MIN = 1.1;
const HICCUP_GAP_MAX = 1.7;
const HICCUP_GIVE_UP = 10;
/** The nose sits a little below the head's centre. */
const NOSE_DROP = 0.1;
const NOSE_REACH = 0.45;
const SNEEZE_AFTER = 0.45;
const SNEEZE_COOLDOWN = 9;
/**
 * A pointer that comes to rest beside a head is sometimes winked at. Winks
 * are rationed across the whole sheet, so they stay a small surprise.
 */
const WINK_AFTER = 0.9;
const WINK_CHANCE = 0.5;
const WINK_COOLDOWN = 60;
const WINK_SHEET_COOLDOWN = 25;
const IDEA_AFTER = 0.45;
const IDEA_COOLDOWN = 12;
const POKE_IN = 0.95;
const POKE_OUT = 1.2;
const POKES = 4;
const POKE_WINDOW = 3.6;
const RASPBERRY_COOLDOWN = 8;
/** A head left flustered (shy) is relieved when the pointer darts away. */
const PHEW_SHY = 0.5;
const PHEW_SPEED = 1300;
const PHEW_COOLDOWN = 8;
/** Once a head is fully in love, its nearest free neighbour turns jealous. */
const JEALOUS_OF = 0.85;
const JEALOUS_NEIGHBOUR = 1.3;
const JEALOUS_MAX = 1;
const JEALOUS_COOLDOWN = 18;

const seedSide = (seed) => (seed % 2 ? 1 : -1);
const sideOf = (dx, fallback) => (Math.abs(dx) > 1e-3 ? Math.sign(dx) : fallback);
const between = (low, high) => low + Math.random() * (high - low);

/** Typical distance between neighbouring heads: the median nearest-neighbour gap. */
function cellSpacing(cells) {
  const gaps = cells
    .map(({ placement: a }) =>
      cells.reduce((nearest, { placement: b }) => {
        const gap = Math.hypot(a.cx - b.cx, a.cy - b.cy);
        return gap > 0 && gap < nearest ? gap : nearest;
      }, Infinity),
    )
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
  return gaps.length ? gaps[Math.floor(gaps.length / 2)] : 0;
}

function createEntry() {
  return {
    id: null,
    amount: 0,
    heldUntil: 0,
    dwell: 0,
    nearSlow: 0,
    dizzyFor: 0,
    startleReadyAt: 0,
    yawnStart: -Infinity,
    yawnReadyAt: 0,
    /** Which side (-1 or 1) the current mood plays to, e.g. towards the pointer. */
    look: null,
    playing: null,
    startedAt: -Infinity,
    tickle: 0,
    nose: 0,
    giggledFor: 0,
    caughtUntil: 0,
    caughtLook: null,
    spreadReadyAt: 0,
    hiccups: 0,
    nextHiccupAt: 0,
    hiccupsGiveUpAt: 0,
    sneezeReadyAt: 0,
    winkReadyAt: 0,
    ideaReadyAt: 0,
    pokes: [],
    poked: false,
    raspberryReadyAt: 0,
    lastHover: -Infinity,
    phewReadyAt: 0,
    jealousOf: null,
    glance: null,
    jealousReadyAt: 0,
  };
}

/** Tracks gentle back-and-forth wiggles of the pointer: tickling. */
function createTickleMeter() {
  let reversals = [];
  let lastX = 0;
  let lastY = 0;
  return {
    feed(velocityX, velocityY, speed, time) {
      reversals = reversals.filter((at) => time - at < TICKLE_WINDOW);
      if (speed < TICKLE_MIN_SPEED || speed > TICKLE_MAX_SPEED) return;
      const x = Math.abs(velocityX) > speed * 0.3 ? Math.sign(velocityX) : 0;
      const y = Math.abs(velocityY) > speed * 0.3 ? Math.sign(velocityY) : 0;
      if ((x && lastX && x !== lastX) || (y && lastY && y !== lastY)) reversals.push(time);
      if (x) lastX = x;
      if (y) lastY = y;
    },
    get tickling() {
      return reversals.length >= TICKLE_REVERSALS;
    },
  };
}

/** Tracks how often the pointer has reversed direction recently: a shake. */
function createShakeMeter() {
  let reversals = [];
  let lastDirection = 0;
  return {
    feed(velocityX, speed, time) {
      reversals = reversals.filter((at) => time - at < SHAKE_WINDOW);
      if (speed < SHAKE_MIN_SPEED) return;
      const direction = Math.sign(velocityX);
      if (direction && lastDirection && direction !== lastDirection) reversals.push(time);
      if (direction) lastDirection = direction;
    },
    get shaking() {
      return reversals.length >= SHAKE_REVERSALS;
    },
  };
}

export function createMoodBoard() {
  const entries = new Map();
  const shake = createShakeMeter();
  const tickle = createTickleMeter();
  let lastPointer = null;
  let pendingGiggles = [];
  let wasAsleep = false;
  let now = 0;
  let pendingYawns = [];
  let idleYawned = false;
  let nextSpontaneousYawn = between(YAWN_SPONTANEOUS_MIN, YAWN_SPONTANEOUS_MAX);
  let sheetWinkReadyAt = 0;
  /** The pointer's latest rest, once it has had its one chance of a wink. */
  let winkRolledFor = -Infinity;

  const entryFor = (seed) => {
    let entry = entries.get(seed);
    if (!entry) entries.set(seed, (entry = createEntry()));
    return entry;
  };

  function trigger(entry, id, time, look) {
    const mood = MOODS[id];
    const current = entry.id ? MOODS[entry.id] : null;
    const currentActive = current && (entry.amount > 0.08 || time < entry.heldUntil);
    if (currentActive && entry.id !== id && current.rank > mood.rank) return false;
    if (entry.id !== id) {
      entry.amount = Math.min(entry.amount, 0.25);
      entry.look = null;
    }
    if (look !== undefined) entry.look = look;
    entry.id = id;
    entry.heldUntil = time + mood.hold;
    return true;
  }

  /** Start a one-shot mood; it keeps playing until its length has run out. */
  function play(entry, id, time, look) {
    if (!trigger(entry, id, time, look)) return false;
    entry.playing = id;
    entry.startedAt = time;
    return true;
  }

  function stillPlaying(entry, time) {
    const id = entry.playing;
    if (!id) return false;
    if (time >= entry.startedAt + MOOD_LENGTHS[id] || !trigger(entry, id, time)) {
      entry.playing = null;
      return false;
    }
    return true;
  }

  function settle(entry, dt, time) {
    if (!entry.id) return;
    const mood = MOODS[entry.id];
    const rising = time < entry.heldUntil;
    const rate = rising ? mood.rise : mood.fall;
    const target = rising ? 1 : 0;
    entry.amount += (target - entry.amount) * (1 - Math.exp(-dt * rate));
    if (!rising && entry.amount < 0.01) {
      entry.id = null;
      entry.amount = 0;
    }
  }

  function readPointer(pointer, dt, time) {
    if (!pointer.da || !lastPointer || dt <= 0) {
      lastPointer = pointer.da ? { x: pointer.x, y: pointer.y } : null;
      return { speed: 0, velocityX: 0 };
    }
    const velocityX = (pointer.x - lastPointer.x) / dt;
    const velocityY = (pointer.y - lastPointer.y) / dt;
    lastPointer = { x: pointer.x, y: pointer.y };
    const speed = Math.hypot(velocityX, velocityY);
    shake.feed(velocityX, speed, time);
    tickle.feed(velocityX, velocityY, speed, time);
    return { speed, velocityX };
  }

  function busy(entry, time) {
    return entry.id && entry.id !== "yawn" && (entry.amount > 0.08 || time < entry.heldUntil);
  }

  function startYawn(cells, cell, hop, time) {
    const entry = entryFor(cell.seed);
    if (busy(entry, time) || time < entry.yawnReadyAt) return false;
    entry.yawnStart = time;
    entry.yawnReadyAt = time + YAWN_COOLDOWN;
    trigger(entry, "yawn", time);
    if (hop >= YAWN_HOPS) return true;
    const reach = cellSpacing(cells) * YAWN_NEIGHBOUR;
    for (const other of cells) {
      if (other.seed === cell.seed) continue;
      const gap = Math.hypot(other.placement.cx - cell.placement.cx, other.placement.cy - cell.placement.cy);
      if (gap > reach) continue;
      const at = time + YAWN_LENGTH * 0.5 + between(YAWN_CATCH_MIN, YAWN_CATCH_MAX);
      pendingYawns.push({ seed: other.seed, at, hop: hop + 1 });
    }
    return true;
  }

  function startYawnSomewhere(cells, time) {
    const order = [...cells].sort(() => Math.random() - 0.5);
    return order.some((cell) => startYawn(cells, cell, 0, time));
  }

  function spreadYawns(cells, time, idleFor) {
    if (idleFor < YAWN_IDLE) idleYawned = false;
    else if (!idleYawned && cells.length) idleYawned = startYawnSomewhere(cells, time);
    if (time > nextSpontaneousYawn) {
      nextSpontaneousYawn = time + between(YAWN_SPONTANEOUS_MIN, YAWN_SPONTANEOUS_MAX);
      if (idleFor < YAWN_IDLE) startYawnSomewhere(cells, time);
    }
    const due = pendingYawns.filter((yawn) => yawn.at <= time);
    if (!due.length) return;
    pendingYawns = pendingYawns.filter((yawn) => yawn.at > time);
    for (const { seed, hop } of due) {
      const cell = cells.find((candidate) => candidate.seed === seed);
      if (cell) startYawn(cells, cell, hop, time);
    }
  }

  /** Neighbours of `cell` within `reach` typical gaps, nearest first. */
  function neighbours(cells, cell, reach, spacing) {
    return cells
      .filter((other) => other.seed !== cell.seed)
      .map((other) => ({
        other,
        gap: Math.hypot(other.placement.cx - cell.placement.cx, other.placement.cy - cell.placement.cy),
      }))
      .filter(({ gap }) => gap <= spacing * reach)
      .sort((a, b) => a.gap - b.gap)
      .map(({ other }) => other);
  }

  /** A fresh giggle is catching: one or two neighbours join in a moment later. */
  function spreadGiggle(cells, cell, entry, time, spacing) {
    if (time < entry.spreadReadyAt) return;
    entry.spreadReadyAt = time + GIGGLE_SPREAD_COOLDOWN;
    const catching = neighbours(cells, cell, GIGGLE_NEIGHBOUR, spacing).slice(0, Math.random() < 0.5 ? 1 : 2);
    for (const other of catching) {
      pendingGiggles.push({
        seed: other.seed,
        at: time + between(GIGGLE_CATCH_MIN, GIGGLE_CATCH_MAX),
        look: sideOf(cell.placement.cx - other.placement.cx, seedSide(other.seed)),
      });
    }
  }

  function catchGiggles(time) {
    const due = pendingGiggles.filter((giggle) => giggle.at <= time);
    if (!due.length) return;
    pendingGiggles = pendingGiggles.filter((giggle) => giggle.at > time);
    for (const { seed, look } of due) {
      const entry = entryFor(seed);
      if (busy(entry, time) && entry.id !== "giggle") continue;
      entry.caughtUntil = time + GIGGLE_CAUGHT_FOR;
      entry.caughtLook = look;
    }
  }

  /** Heads next to one in love look over, jealous, for as long as it lasts. */
  function spreadJealousy(cells, time, spacing) {
    for (const cell of cells) {
      const lover = entries.get(cell.seed);
      if (lover?.id !== "love" || lover.amount < JEALOUS_OF) continue;
      let jealous = 0;
      for (const other of neighbours(cells, cell, JEALOUS_NEIGHBOUR, spacing)) {
        if (jealous >= JEALOUS_MAX) break;
        const entry = entryFor(other.seed);
        const already = entry.id === "jealous" && entry.jealousOf === cell.seed;
        if (!already && (time < entry.jealousReadyAt || busy(entry, time))) continue;
        const dx = cell.placement.cx - other.placement.cx;
        const dy = cell.placement.cy - other.placement.cy;
        const gap = Math.hypot(dx, dy) || 1;
        if (!trigger(entry, "jealous", time, sideOf(dx, seedSide(other.seed)))) continue;
        if (!already) entry.jealousReadyAt = time + JEALOUS_COOLDOWN;
        entry.jealousOf = cell.seed;
        entry.glance = { x: dx / gap, y: dy / gap };
        jealous++;
      }
    }
  }

  /** Keep the running tallies a head uses to tell what the pointer is doing to it. */
  function measure(entry, offset, reach, speed, dt, time, idleFor) {
    const hovering = reach < HOVER_REACH;
    entry.dwell = hovering ? entry.dwell + dt : Math.max(0, entry.dwell - dt * 3);
    const lingering = reach < CURIOUS_REACH && !hovering && speed < CURIOUS_SPEED;
    const still = idleFor > STILL_AFTER;
    if (!lingering) entry.nearSlow = 0;
    else if (!still) entry.nearSlow += dt;

    if (hovering) entry.lastHover = time;

    entry.pokes = entry.pokes.filter((at) => time - at < POKE_WINDOW);
    if (!entry.poked && reach < POKE_IN) {
      entry.poked = true;
      entry.pokes.push(time);
    } else if (entry.poked && reach > POKE_OUT) entry.poked = false;

    const onNose = Math.hypot(offset.x, offset.y - NOSE_DROP) < NOSE_REACH;
    const underChin = Math.abs(offset.x) < CHIN_ACROSS && offset.y > CHIN_TOP && offset.y < CHIN_BOTTOM;
    const tickled = tickle.tickling && !still;
    entry.nose = tickled && onNose ? Math.min(SNEEZE_AFTER + dt, entry.nose + dt) : Math.max(0, entry.nose - dt * 2);
    entry.tickle = tickled && underChin ? Math.min(GIGGLE_AFTER + 0.3, entry.tickle + dt) : Math.max(0, entry.tickle - dt);
    return hovering;
  }

  /** A long fit of giggles can leave a head with the hiccups. */
  function afterGiggling(entry, time) {
    if (entry.giggledFor > HICCUP_AFTER_GIGGLE && Math.random() < HICCUP_CHANCE) {
      entry.hiccups = 3 + Math.floor(Math.random() * 2);
      entry.nextHiccupAt = time + 0.3;
      entry.hiccupsGiveUpAt = time + HICCUP_GIVE_UP;
    }
    entry.giggledFor = 0;
  }

  /** The next hiccup, once it is due and the head isn't busy with something bigger. */
  function hiccup(entry, time) {
    if (!entry.hiccups || time < entry.nextHiccupAt) return false;
    if (time > entry.hiccupsGiveUpAt) {
      entry.hiccups = 0;
      return false;
    }
    if (!play(entry, "hiccup", time)) return false;
    entry.hiccups--;
    entry.nextHiccupAt = time + between(HICCUP_GAP_MIN, HICCUP_GAP_MAX);
    return true;
  }

  function react(cells, cell, entry, offset, reach, nearest, speed, dt, time, idleFor, spacing) {
    const { seed, wakeful } = cell;
    const hovering = measure(entry, offset, reach, speed, dt, time, idleFor);
    const towardPointer = sideOf(offset.x, seedSide(seed));
    const playing = stillPlaying(entry, time);

    if (shake.shaking && reach < SHAKE_REACH) {
      entry.dizzyFor += dt;
      trigger(entry, entry.dizzyFor > ANNOYED_AFTER_DIZZY ? "annoyed" : "dizzy", time);
      return;
    }
    entry.dizzyFor = Math.max(0, entry.dizzyFor - dt);

    if (entry.pokes.length >= POKES && time > entry.raspberryReadyAt) {
      entry.pokes = [];
      entry.raspberryReadyAt = time + RASPBERRY_COOLDOWN;
      trigger(entry, "raspberry", time, towardPointer);
      return;
    }
    if (entry.id === "raspberry" && time < entry.heldUntil) return;

    const darting = !hovering && time - entry.lastHover < 0.2 && speed > PHEW_SPEED;
    const flustered = entry.id === "shy" && entry.amount > PHEW_SHY;
    if (darting && flustered && time > entry.phewReadyAt) {
      entry.phewReadyAt = time + PHEW_COOLDOWN;
      entry.startleReadyAt = time + STARTLE_COOLDOWN;
      trigger(entry, "phew", time, towardPointer);
      return;
    }

    if (speed > STARTLE_SPEED && reach < STARTLE_REACH && time > entry.startleReadyAt) {
      entry.startleReadyAt = time + STARTLE_COOLDOWN;
      trigger(entry, "startled", time);
      return;
    }
    if (entry.nose > SNEEZE_AFTER && time > entry.sneezeReadyAt) {
      entry.nose = 0;
      if (play(entry, "sneeze", time, towardPointer)) entry.sneezeReadyAt = time + SNEEZE_COOLDOWN;
      return;
    }
    if (playing) return;

    if (entry.tickle > GIGGLE_AFTER) {
      const fresh = entry.id !== "giggle";
      if (trigger(entry, "giggle", time, towardPointer)) {
        entry.giggledFor += dt;
        if (fresh) spreadGiggle(cells, cell, entry, time, spacing);
      }
      return;
    }
    if (time < entry.caughtUntil) return trigger(entry, "giggle", time, entry.caughtLook);
    const giggleOver = entry.id !== "giggle" || entry.amount < 0.1;
    if (entry.giggledFor > 0 && giggleOver) afterGiggling(entry, time);

    if (entry.dwell > LOVE_AFTER) return trigger(entry, "love", time);
    if (entry.dwell > SHY_AFTER) return trigger(entry, "shy", time);

    const resting = idleFor > IDEA_AFTER && reach < CURIOUS_REACH;
    if (entry.id === "curious" && entry.amount > 0.5 && resting && time > entry.ideaReadyAt) {
      entry.nearSlow = 0;
      if (play(entry, "idea", time, towardPointer)) entry.ideaReadyAt = time + IDEA_COOLDOWN;
      return;
    }
    const beside = nearest && reach < HUM_REACH && !hovering;
    if (beside && idleFor > WINK_AFTER && idleFor < HUM_AFTER && time > Math.max(entry.winkReadyAt, sheetWinkReadyAt)) {
      const restedSince = time - idleFor;
      if (Math.abs(restedSince - winkRolledFor) > 0.01) {
        winkRolledFor = restedSince;
        if (Math.random() < WINK_CHANCE && play(entry, "wink", time, towardPointer)) {
          entry.winkReadyAt = time + WINK_COOLDOWN;
          sheetWinkReadyAt = time + WINK_SHEET_COOLDOWN;
          return;
        }
      }
    }
    if (beside && idleFor > HUM_AFTER) return trigger(entry, "hum", time);
    if (entry.nearSlow > CURIOUS_AFTER) return trigger(entry, "curious", time);
    if (hiccup(entry, time)) return;
    if (time < entry.yawnStart + YAWN_LENGTH) return trigger(entry, "yawn", time);
    if (!wakeful && idleFor > SLEEP_AFTER + (seed % 7) * SLEEP_STAGGER) trigger(entry, "sleepy", time);
  }

  return {
    /**
     * Advance every head's mood by one frame.
     * `cells` carry `seed` and screen `placement` ({cx, cy, mass}), and
     * `wakeful` for a head that stays up while the others doze;
     * `pointer` is the sheet's pointer ({x, y, da}); `idleFor` is seconds
     * since the pointer last moved.
     */
    update(cells, pointer, dt, time, idleFor) {
      const { speed } = readPointer(pointer, dt, time);
      const asleep = idleFor > SLEEP_AFTER;
      const wakingUp = wasAsleep && !asleep;
      wasAsleep = asleep;
      now = time;
      spreadYawns(cells, time, idleFor);
      catchGiggles(time);
      const spacing = cellSpacing(cells);
      spreadJealousy(cells, time, spacing);
      const offsets = cells.map(({ placement }) =>
        pointer.da
          ? { x: (pointer.x - placement.cx) / placement.mass, y: (pointer.y - placement.cy) / placement.mass }
          : { x: Infinity, y: Infinity },
      );
      const reaches = offsets.map(({ x, y }) => Math.hypot(x, y));
      const closest = Math.min(...reaches);
      cells.forEach((cell, index) => {
        const entry = entryFor(cell.seed);
        if (wakingUp && entry.id === "sleepy") trigger(entry, "startled", time);
        const nearest = reaches[index] === closest;
        react(cells, cell, entry, offsets[index], reaches[index], nearest, speed, dt, time, idleFor, spacing);
        settle(entry, dt, time);
      });
    },

    /** The head `seed` was picked out for a close-up, and is rather pleased about it. */
    picked(seed, time) {
      play(entryFor(seed), "proud", time);
    },

    /** The heads around `seed` gasp, e.g. when it is picked up for a close-up. */
    gasp(cells, seed, time) {
      const origin = cells.find((cell) => cell.seed === seed);
      if (!origin) return;
      for (const { seed: other, placement } of cells) {
        if (other === seed) continue;
        const reach =
          Math.hypot(placement.cx - origin.placement.cx, placement.cy - origin.placement.cy) /
          Math.max(1, origin.placement.mass * 4);
        if (reach < GASP_REACH) trigger(entryFor(other), "startled", time);
      }
    },

    moodFor(seed) {
      const entry = entries.get(seed);
      if (!entry?.id) return null;
      const mood = { id: entry.id, amount: entry.amount, side: entry.look ?? seedSide(seed) };
      if (entry.id === "yawn")
        return { ...mood, phase: Math.min(1, Math.max(0, (now - entry.yawnStart) / YAWN_LENGTH)) };
      if (entry.id === "jealous" && entry.glance) return { ...mood, glance: entry.glance };
      const length = MOOD_LENGTHS[entry.id];
      if (!length) return mood;
      const since = now - entry.startedAt;
      return { ...mood, phase: Math.min(1, Math.max(0, since / length)), since };
    },

    reset() {
      entries.clear();
      lastPointer = null;
      pendingYawns = [];
      pendingGiggles = [];
      idleYawned = false;
    },
  };
}

const mix = (from, to, amount) => from + (to - from) * amount;

/** How wide a yawn is open: slow to stretch, quicker to close. Without a phase, the amount. */
export function yawnOpenness(mood) {
  if (mood.phase === undefined) return mood.amount;
  return Math.sin(Math.PI * mood.phase ** 1.36) * Math.min(1, mood.amount * 1.4);
}

const clamp01 = (value) => Math.min(1, Math.max(0, value));
const smooth = (value) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};
const SNEEZE_BURST_AT = 0.6;

/**
 * Where a sneeze has got to: `build` is the "a-a-a-" (three little gasps,
 * each tipping the head further back), `burst` the "choo". Without a phase,
 * the burst itself.
 */
export function sneezeStage(mood) {
  if (mood.phase === undefined) return { build: 0, burst: mood.amount };
  const { phase } = mood;
  if (phase < SNEEZE_BURST_AT) {
    const gasps = (phase / SNEEZE_BURST_AT) * 3;
    return { build: (Math.floor(gasps) + smooth((gasps % 1) * 1.8)) / 3, burst: 0 };
  }
  const after = phase - SNEEZE_BURST_AT;
  return { build: clamp01(1 - after / 0.05), burst: after < 0.12 ? 1 : clamp01(1 - (after - 0.12) / 0.26) };
}

/** How far a wink has closed: snaps shut, holds, opens. Without a phase, the amount. */
export function winkClosure(mood) {
  if (mood.phase === undefined) return mood.amount;
  return clamp01(Math.sin(Math.PI * mood.phase) * 1.9) * mood.amount;
}

/** One hiccup: a quick jolt up, then settling back. Without a phase, the amount. */
export function hiccupJolt(mood) {
  if (mood.phase === undefined) return mood.amount;
  const { phase } = mood;
  return phase < 0.18 ? smooth(phase / 0.18) : 1 - smooth((phase - 0.18) / 0.82);
}

/** The existing animation state, bent by a mood. Returns a new state. */
export function applyMood(state, mood) {
  if (!mood) return state;
  const { id, amount: a, side } = mood;
  const time = state.time ?? 0;
  const pose = { ...state.pose };
  const next = { ...state, pose, mood };
  switch (id) {
    case "sleepy":
      next.lids = Math.max(state.lids, 0.6 * a);
      next.awake = state.awake * (1 - a);
      next.mouth = state.mouth * (1 - a);
      pose.pitch += 0.09 * a;
      pose.roll += 0.05 * a * side;
      break;
    case "curious":
      pose.roll += 0.13 * a * side;
      next.awake = Math.max(state.awake, 0.4 * a);
      break;
    case "shy":
      next.gazeX = mix(state.gazeX, -0.85 * side, a);
      next.gazeY = mix(state.gazeY, 0.55, a);
      pose.pitch += 0.07 * a;
      pose.yaw -= 0.06 * a * side;
      break;
    case "love":
      next.awake = Math.max(state.awake, 0.5 * a);
      pose.roll += Math.sin(time * 2.2) * 0.05 * a;
      break;
    case "startled":
      next.awake = Math.max(state.awake, a);
      next.mouth = Math.max(state.mouth, 0.6 * a);
      next.lids = state.lids * (1 - a);
      pose.pitch -= 0.06 * a;
      break;
    case "dizzy":
      pose.roll += Math.sin(time * 6) * 0.13 * a;
      pose.yaw += Math.cos(time * 6) * 0.1 * a;
      break;
    case "annoyed":
      pose.pitch += 0.03 * a;
      next.mouth = state.mouth * (1 - a);
      break;
    case "hum":
      next.lids = Math.max(state.lids * (1 - a), 0.5 * a);
      next.awake = state.awake * (1 - 0.6 * a);
      next.mouth = 0;
      next.gazeY = mix(state.gazeY, -0.3, a);
      pose.roll += Math.sin(time * 2.4) * 0.07 * a;
      pose.pitch -= 0.03 * a;
      break;
    case "yawn": {
      const open = yawnOpenness(mood);
      next.mouth = open;
      next.lids = mix(state.lids, 0.3, open);
      next.awake = state.awake * (1 - open);
      next.gazeY = mix(state.gazeY, -0.3, open);
      pose.pitch -= 0.11 * open;
      pose.roll += 0.05 * open * side;
      break;
    }
    case "giggle": {
      const shake = Math.abs(Math.sin(time * 13));
      next.mouth = a * (0.45 + 0.4 * shake);
      next.awake = state.awake * (1 - a);
      next.lids = state.lids * (1 - a);
      pose.pitch -= (0.04 + 0.04 * shake) * a;
      pose.roll += (0.06 * side + Math.sin(time * 6.5) * 0.05) * a;
      break;
    }
    case "sneeze": {
      const { build, burst } = sneezeStage(mood);
      const flutter = build * (0.5 + 0.5 * Math.sin(time * 31));
      next.lids = Math.max(state.lids * (1 - build), 0.4 * build + 0.2 * flutter);
      next.awake = state.awake * (1 - Math.max(build, burst));
      next.mouth = 0.22 * build + 0.55 * burst;
      next.gazeY = mix(state.gazeY, -0.6, build);
      pose.pitch += (0.16 * burst - 0.15 * build) * a;
      pose.yaw += 0.1 * burst * side * a;
      pose.roll -= 0.05 * build * side * a;
      break;
    }
    case "wink": {
      const closed = winkClosure(mood);
      next.wink = side * closed;
      next.gazeX = mix(state.gazeX, 0.5 * side, closed);
      pose.roll += 0.08 * closed * side;
      break;
    }
    case "idea":
      next.awake = Math.max(state.awake, a);
      next.lids = state.lids * (1 - a);
      next.gazeX = mix(state.gazeX, 0.35 * side, a);
      next.gazeY = mix(state.gazeY, -0.75, a);
      next.mouth = 0;
      pose.pitch -= 0.07 * a;
      break;
    case "proud":
      next.lids = Math.max(state.lids, 0.8 * a);
      next.awake = state.awake * (1 - a);
      next.mouth = 0;
      pose.pitch -= 0.13 * a;
      pose.roll -= 0.07 * a * side;
      break;
    case "raspberry":
      next.wink = side * a;
      next.mouth = 0;
      pose.yaw += 0.08 * side * a;
      pose.roll += (0.08 * side + Math.sin(time * 47) * 0.012) * a;
      break;
    case "jealous": {
      const glance = mood.glance ?? { x: side, y: 0 };
      next.gazeX = mix(state.gazeX, glance.x, a);
      next.gazeY = mix(state.gazeY, glance.y * 0.6 + 0.1, a);
      next.lids = Math.max(state.lids, 0.42 * a);
      next.awake = state.awake * (1 - a);
      next.mouth = 0;
      pose.yaw -= 0.08 * glance.x * a;
      pose.pitch += 0.05 * a;
      break;
    }
    case "hiccup": {
      const jolt = hiccupJolt(mood);
      next.awake = Math.max(state.awake, jolt);
      next.lids = state.lids * (1 - jolt);
      next.mouth = 0;
      pose.pitch -= 0.1 * jolt;
      pose.roll += 0.03 * jolt * side;
      break;
    }
    case "phew":
      next.lids = Math.max(state.lids, 0.8 * a);
      next.awake = state.awake * (1 - a);
      next.mouth = 0;
      pose.pitch += 0.05 * a;
      pose.roll += 0.04 * a * side;
      break;
  }
  return next;
}

const unlessBrowless = (features, brow) => (features.brow === "none" ? "none" : brow);
/** A lopsided smile, raised on the side the head is playing to. */
const smirkToward = (side) => (side < 0 ? "smirk-left" : "smirk-right");

/** Feature swaps a mood makes once it is strong enough to read. */
export function moodFeatures(mood, features) {
  if (!mood || mood.amount < 0.35) return features;
  switch (mood.id) {
    case "dizzy":
      return { ...features, eye: "spiral", mouth: "wave" };
    case "love":
      return { ...features, eye: "heart", mouth: "smile" };
    case "shy":
      return { ...features, mouth: "small", brow: features.brow === "none" ? "none" : "worried" };
    case "annoyed":
      return { ...features, mouth: "zigzag", brow: "angled" };
    case "curious":
      return { ...features, brow: features.brow === "none" ? "none" : "high" };
    case "sleepy":
      return { ...features, mouth: "small" };
    case "hum":
      return { ...features, mouth: "whistle" };
    case "yawn":
      return yawnOpenness(mood) > 0.4
        ? { ...features, mouth: "yawn", eye: "squeeze" }
        : { ...features, mouth: "yawn" };
    case "giggle":
      return { ...features, eye: "happy", mouth: "laugh" };
    case "sneeze": {
      const { build, burst } = sneezeStage(mood);
      if (burst > 0.3) return { ...features, eye: "squeeze", mouth: "yawn", brow: unlessBrowless(features, "worried") };
      return build > 0.2 ? { ...features, mouth: "yawn", brow: unlessBrowless(features, "high") } : features;
    }
    case "wink":
      return winkClosure(mood) > 0.4 ? { ...features, mouth: smirkToward(mood.side) } : features;
    case "idea":
      return {
        ...features,
        mouth: mood.phase !== undefined && mood.phase < 0.16 ? "whistle" : "grin",
        brow: unlessBrowless(features, "high"),
      };
    case "proud":
      return { ...features, mouth: smirkToward(-mood.side), brow: unlessBrowless(features, "high") };
    case "raspberry":
      return { ...features, mouth: "tongue" };
    case "jealous":
      return { ...features, mouth: "pout", brow: unlessBrowless(features, "angled") };
    case "hiccup":
      return hiccupJolt(mood) > 0.3 ? { ...features, mouth: "whistle" } : { ...features, mouth: "small" };
    case "phew":
      return { ...features, mouth: "whistle" };
    default:
      return features;
  }
}
