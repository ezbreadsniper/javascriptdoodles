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
  hum: { rank: 1.5, rise: 2, fall: 1.8, hold: 1.1 },
  shy: { rank: 2, rise: 3, fall: 2.2, hold: 0.9 },
  love: { rank: 3, rise: 2.5, fall: 1.6, hold: 1.4 },
  startled: { rank: 4, rise: 14, fall: 2.5, hold: 0.7 },
  dizzy: { rank: 5, rise: 5, fall: 1.4, hold: 1.2 },
  annoyed: { rank: 6, rise: 4, fall: 1.2, hold: 2 },
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
const YAWN_LENGTH = 1.4;
const YAWN_IDLE = 8;
const YAWN_NEIGHBOUR = 1.2;
const YAWN_HOPS = 2;
const YAWN_CATCH_MIN = 0.4;
const YAWN_CATCH_MAX = 1.2;
const YAWN_COOLDOWN = 16;
const YAWN_SPONTANEOUS_MIN = 40;
const YAWN_SPONTANEOUS_MAX = 90;

const seedSide = (seed) => (seed % 2 ? 1 : -1);
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
  let lastPointer = null;
  let wasAsleep = false;
  let now = 0;
  let pendingYawns = [];
  let idleYawned = false;
  let nextSpontaneousYawn = between(YAWN_SPONTANEOUS_MIN, YAWN_SPONTANEOUS_MAX);

  const entryFor = (seed) => {
    let entry = entries.get(seed);
    if (!entry) entries.set(seed, (entry = createEntry()));
    return entry;
  };

  function trigger(entry, id, time) {
    const mood = MOODS[id];
    const current = entry.id ? MOODS[entry.id] : null;
    const currentActive = current && (entry.amount > 0.08 || time < entry.heldUntil);
    if (currentActive && entry.id !== id && current.rank > mood.rank) return;
    if (entry.id !== id) entry.amount = Math.min(entry.amount, 0.25);
    entry.id = id;
    entry.heldUntil = time + mood.hold;
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

  function react(entry, seed, reach, nearest, speed, dt, time, idleFor, wakeful) {
    const hovering = reach < HOVER_REACH;
    entry.dwell = hovering ? entry.dwell + dt : Math.max(0, entry.dwell - dt * 3);
    const lingering = reach < CURIOUS_REACH && !hovering && speed < CURIOUS_SPEED;
    const still = idleFor > STILL_AFTER;
    if (!lingering) entry.nearSlow = 0;
    else if (!still) entry.nearSlow += dt;

    if (shake.shaking && reach < SHAKE_REACH) {
      entry.dizzyFor += dt;
      trigger(entry, entry.dizzyFor > ANNOYED_AFTER_DIZZY ? "annoyed" : "dizzy", time);
      return;
    }
    entry.dizzyFor = Math.max(0, entry.dizzyFor - dt);

    if (speed > STARTLE_SPEED && reach < STARTLE_REACH && time > entry.startleReadyAt) {
      entry.startleReadyAt = time + STARTLE_COOLDOWN;
      trigger(entry, "startled", time);
      return;
    }
    if (entry.dwell > LOVE_AFTER) return trigger(entry, "love", time);
    if (entry.dwell > SHY_AFTER) return trigger(entry, "shy", time);
    if (nearest && reach < HUM_REACH && !hovering && idleFor > HUM_AFTER) return trigger(entry, "hum", time);
    if (entry.nearSlow > CURIOUS_AFTER) return trigger(entry, "curious", time);
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
      const reaches = cells.map(({ placement }) =>
        pointer.da ? Math.hypot(pointer.x - placement.cx, pointer.y - placement.cy) / placement.mass : Infinity,
      );
      const closest = Math.min(...reaches);
      cells.forEach(({ seed, wakeful }, index) => {
        const entry = entryFor(seed);
        if (wakingUp && entry.id === "sleepy") trigger(entry, "startled", time);
        react(entry, seed, reaches[index], reaches[index] === closest, speed, dt, time, idleFor, wakeful);
        settle(entry, dt, time);
      });
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
      const mood = { id: entry.id, amount: entry.amount, side: seedSide(seed) };
      return entry.id === "yawn"
        ? { ...mood, phase: Math.min(1, Math.max(0, (now - entry.yawnStart) / YAWN_LENGTH)) }
        : mood;
    },

    reset() {
      entries.clear();
      lastPointer = null;
      pendingYawns = [];
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
  }
  return next;
}

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
    default:
      return features;
  }
}
