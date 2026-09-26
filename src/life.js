import { j as randomFor } from "./core.js";
import { blink } from "./gaze.js";

/**
 * Ambient life: what the heads on the sheet do while nobody is playing with
 * them, so the sheet feels like a room full of characters rather than a grid
 * of screensavers.
 *
 * Every head keeps its own little timeline of cues. A cue says, for a stretch
 * of time, where the head looks, how far it turns towards that, and how its
 * face and pose are bent: brows up, lids soft, a nod, a lean, a whisper. Small
 * scenes are just cues written into two or three timelines at once: a glance
 * that is returned with a nod, a whisper that ends in a laugh, a head turning
 * to see what the laughing is about.
 *
 * Between cues a head simply looks somewhere and holds it, the way people do,
 * instead of drifting. Life only *suggests*: `look` feeds the gaze spring,
 * `apply` bends the animation state before moods are applied, and everything
 * is scaled by the head's presence, which drops to nothing the moment the
 * pointer moves and comes back, head by head, once it rests.
 */

/** Seconds the pointer must rest before the room goes back to its own business. */
const RESUME_AFTER = 3.5;
/** The most attentive heads keep watching the resting pointer up to this much longer. */
const RESUME_STAGGER = 3;
/** How quickly life lets go of a head when the pointer moves, and how gently it takes it back. */
const YIELD_RATE = 9;
const RETURN_RATE = 1.4;
/** Moods the pointer causes; a head wearing one belongs to the pointer, not to life. */
const POINTER_MOODS = new Set(["curious", "hum", "shy", "love", "startled", "dizzy", "annoyed"]);
/** Short moods worth turning round for. */
const EYE_CATCHING = new Set(["yawn", "startled", "dizzy", "annoyed"]);
/** Heads turn round for a neighbour's mood at most this often, so a yawn going round isn't a stampede. */
const MOOD_WATCH_GAP = 4;

/** Neighbours are heads within this many cell spacings. */
const NEIGHBOUR_REACH = 1.5;
/** At most this many scenes play at once, and they are spaced out, so the room stays calm. */
const MAX_SCENES = 2;
const TALK_GAP = 7;
const GLANCE_GAP = 2.5;

/** Mirrors the mood board's bedtime: after this much stillness heads start to doze. */
const BEDTIME = 13;
/** Roughly this share of the room stays up while the rest doze, taking turns. */
const NIGHT_OWLS = 0.4;
const TURN_TAKING = [15, 26];

const PASSING_EVERY = [38, 75];
const PASSING_SPEED = 1.15;

/** A laugh: eyes squeezed shut, mouth going, head thrown back a little. */
const LAUGH = { lids: 0.86, mouth: "laugh", pitch: -0.035, shake: 1 };

const clamp = (value, low = 0, high = 1) => Math.min(high, Math.max(low, value));
const between = (low, high) => low + Math.random() * (high - low);
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const bump = (t) => Math.sin(Math.PI * clamp(t));
const smooth = (t) => {
  const x = clamp(t);
  return x * x * (3 - 2 * x);
};
const distance = (a, b) => Math.hypot(a.placement.cx - b.placement.cx, a.placement.cy - b.placement.cy);

function createActor(seed, placement, now) {
  const random = randomFor(seed, "life");
  return {
    seed,
    placement,
    neighbours: [],
    social: random.range(0.35, 1),
    patience: random.range(0.75, 1.5),
    returnLag: random.range(0, RESUME_STAGGER),
    owlRank: random.n(),
    nightOwl: false,
    breathPhase: random.range(0, Math.PI * 2),
    tiltHome: random.range(-0.02, 0.02),
    tiltTarget: 0,
    presence: 1,
    cues: [],
    fixation: null,
    fixationUntil: 0,
    looking: null,
    nextIdeaAt: now + between(1.5, 7),
    nextTiltAt: now + between(2, 9),
    nextSighAt: now + between(25, 70),
    pitch: { x: 0, v: 0 },
    roll: { x: 0, v: 0 },
    awake: 0,
    lids: 0,
    doze: { since: -1, cycleStart: 0, cycleLength: 7, catches: false, depth: 0.1 },
    lastMood: null,
  };
}

/** Typical distance between neighbouring heads: the median nearest-neighbour gap. */
function cellSpacing(actors) {
  const gaps = actors
    .map((actor) => Math.min(...actors.filter((other) => other !== actor).map((other) => distance(actor, other))))
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
  return gaps.length ? gaps[Math.floor(gaps.length / 2)] : 200;
}

/**
 * Picks who stays up once the room gets sleepy: pairs of neighbours, so the
 * ones awake have someone to talk to, spread out so it isn't one row awake.
 */
function chooseNightOwls(actors) {
  const quota = Math.max(2, Math.round(actors.length * NIGHT_OWLS));
  const order = [...actors].sort((a, b) => a.owlRank - b.owlRank);
  const owls = new Set();
  const lonely = (actor) => !owls.has(actor) && !actor.neighbours.some((other) => owls.has(other));
  for (const actor of order) {
    if (owls.size >= quota || !lonely(actor)) continue;
    owls.add(actor);
    const partner = actor.neighbours.find((other) => other.neighbours.every((near) => near === actor || !owls.has(near)));
    if (partner && owls.size < quota) owls.add(partner);
  }
  for (const actor of order) if (owls.size < quota) owls.add(actor);
  for (const actor of actors) actor.nightOwl = owls.has(actor);
}

/** A soft, slightly underdamped spring: pose changes land with a little weight. */
function spring(state, target, dt, stiffness = 38, ratio = 0.55) {
  const steps = Math.ceil(dt * 90);
  const h = dt / Math.max(1, steps);
  for (let step = 0; step < steps; step++) {
    state.v += (stiffness * (target - state.x) - 2 * ratio * Math.sqrt(stiffness) * state.v) * h;
    state.x += state.v * h;
  }
}

/** Syllables: irregular open-close pulses, a little under three a second. */
const syllables = (time, rate) => Math.max(0, Math.sin(time * rate + 1.8 * Math.sin(time * 4.3)));

/** Mouth openness for the ways a head can use its mouth in a scene. */
function mouthFor(kind, time, cue) {
  const p = (time - cue.from) / (cue.to - cue.from);
  const envelope = Math.min(1, p * 6, (1 - p) * 6);
  switch (kind) {
    case "talk":
      return (0.1 + 0.42 * syllables(time, 17)) * envelope;
    case "whisper":
      // Barely parted lips: only the peaks open past a closed line.
      return (0.08 + 0.18 * syllables(time, 19)) * envelope;
    case "laugh":
      return (0.26 + 0.42 * Math.abs(Math.sin(time * 7.5))) * Math.sqrt(1 - clamp(p)) * Math.min(1, p * 8);
    case "oh":
      return 0.36 * Math.min(1, p * 6) * Math.min(1, (1 - p) * 4);
    default:
      return 0;
  }
}

export function createLife() {
  let actors = new Map();
  let spacing = 0;
  let bounds = { left: 0, right: 0, top: 0 };
  let lastTime = null;
  let releasedAt = 0;
  let engagedBefore = false;
  let lastTalk = -Infinity;
  let lastGlance = -Infinity;
  let lastMoodWatch = -Infinity;
  let nextTurnAt = 0;
  let nextPassingAt = between(...PASSING_EVERY) * 0.6;
  let gazes = null;

  /* ---------- who is available ---------- */

  function asleep(actor, moodFor) {
    const mood = moodFor(actor.seed);
    return mood?.id === "sleepy" && mood.amount > 0.3;
  }

  /** Wearing a mood the pointer caused: the head belongs to the pointer for now. */
  function pointerOwns(actor, moodFor) {
    const mood = moodFor(actor.seed);
    return !!mood && mood.amount > 0.05 && POINTER_MOODS.has(mood.id);
  }

  /** In the middle of any mood but a doze, e.g. a yawn. */
  function moodBusy(actor, moodFor) {
    const mood = moodFor(actor.seed);
    return !!mood && mood.amount > 0.05 && mood.id !== "sleepy";
  }

  function free(actor, time, moodFor) {
    return (
      actor.presence > 0.95 &&
      !actor.cues.some((cue) => cue.to > time) &&
      !asleep(actor, moodFor) &&
      !moodBusy(actor, moodFor)
    );
  }

  /** Scenes still playing: each has one cue marked as its lead. */
  function scenesRunning(time) {
    let count = 0;
    for (const actor of actors.values()) if (actor.cues.some((cue) => cue.lead && cue.to > time)) count++;
    return count;
  }

  /* ---------- cues ---------- */

  function cue(actor, fields) {
    actor.cues.push({ head: 1, ...fields });
  }

  /** `actor` looks at `other` from `from` to `to`, turning `head` of the way; `extra` adds to the cue. */
  function watch(actor, other, from, to, head, extra = {}) {
    cue(actor, { from, to, look: { seed: other.seed }, head, ...extra });
  }

  function doBlink(actor, time, kind) {
    const gaze = gazes?.get(actor.seed);
    if (gaze) blink(gaze, time, kind);
  }

  /** Where a cue's look points at `time`. */
  function lookPoint(look, time) {
    if (look.seed !== undefined) {
      const other = actors.get(look.seed);
      return other ? { x: other.placement.cx, y: other.placement.cy } : null;
    }
    if (look.path) return look.path(time - look.lag);
    return look;
  }

  /* ---------- free looking: fixations instead of drifting ---------- */

  function pickFixation(actor, time) {
    const { cx, cy, mass } = actor.placement;
    const roll = Math.random();
    let fixation;
    if (roll < 0.52) {
      // Somewhere in the middle distance, roughly ahead.
      fixation = { x: cx + between(-1.6, 1.6) * mass, y: cy + between(-0.7, 1.1) * mass, head: 1 };
    } else if (roll < 0.71) {
      // Down and to one side, thinking.
      fixation = { x: cx + between(-2.4, 2.4) * mass, y: cy + between(2.2, 3.4) * mass, head: 0.8 };
    } else if (roll < 0.86) {
      // Up, wondering.
      fixation = { x: cx + between(-2.5, 2.5) * mass, y: cy - between(2.6, 4) * mass, head: 0.7 };
    } else {
      // Eyes only: a quick look aside without turning, then back.
      const side = Math.random() < 0.5 ? -1 : 1;
      fixation = { x: cx + side * between(3, 5) * mass, y: cy + between(-1, 1) * mass, head: 0.15 };
      fixation.back = actor.fixation;
    }
    const from = actor.fixation ?? { x: cx, y: cy };
    const moved = Math.hypot(fixation.x - from.x, fixation.y - from.y) / mass;
    // A big change of view often comes with a blink, and the head's weight lags the turn a touch.
    if (moved > 2.6 && Math.random() < 0.45) doBlink(actor, time, "single");
    if (moved > 0.5) actor.roll.v -= Math.sign(fixation.x - from.x) * 0.05;
    actor.fixation = fixation;
    actor.fixationUntil = time + (fixation.back ? between(0.6, 1.2) : between(2.2, 5.2) * actor.patience);
  }

  function updateFixation(actor, time) {
    if (time < actor.fixationUntil && actor.fixation) return;
    if (actor.fixation?.back) {
      actor.fixation = actor.fixation.back;
      actor.fixationUntil = time + between(1.2, 3) * actor.patience;
      return;
    }
    pickFixation(actor, time);
  }

  /* ---------- scenes ---------- */

  /** A looks at B. B may look back; then a nod, a shy look away, or nothing much. */
  function glance(a, b, time, moodFor) {
    lastGlance = time;
    if (asleep(b, moodFor)) {
      // A fond look at someone napping, with a slow blink.
      const end = time + between(2.2, 3.4);
      watch(a, b, time, end, 0.7, { lead: true });
      cue(a, { from: time + 0.9, to: end, lids: 0.22, awake: 0.15 });
      cue(a, { from: time + 1.3, to: time + 1.4, blink: "slow" });
      return;
    }
    if (!free(b, time, moodFor) || Math.random() > 0.3 + 0.5 * b.social) {
      watch(a, b, time, time + between(1.2, 2.2), 0.6, { lead: true });
      return;
    }
    const noticed = time + between(0.45, 0.9);
    const meet = noticed + 0.3;
    const outcome = Math.random();
    if (outcome < 0.55) {
      // Hello: brows up, a small nod each, staggered.
      const endA = meet + between(1.6, 2.3);
      const endB = meet + between(1.8, 2.6);
      watch(a, b, time, endA, 0.7, { lead: true });
      watch(b, a, noticed, endB, 0.6);
      cue(a, { from: meet + 0.1, to: endA, awake: 0.45, lids: 0.12 });
      cue(b, { from: meet + 0.2, to: endB, awake: 0.45, lids: 0.12 });
      cue(a, { from: meet + 0.35, to: meet + 0.85, nod: 0.075 });
      cue(b, { from: meet + 0.55, to: meet + 1.05, nod: 0.07 });
    } else if (outcome < 0.85) {
      // The shyer one looks away, down and to the far side; the other is amused.
      const [bold, shy] = a.social >= b.social ? [a, b] : [b, a];
      const away = Math.sign(shy.placement.cx - bold.placement.cx) || 1;
      const lookAway = meet + between(0.5, 0.8);
      const { cx, cy, mass } = shy.placement;
      watch(a, b, time, a === shy ? lookAway : meet + between(1.5, 2), 0.7, { lead: true });
      watch(b, a, noticed, b === shy ? lookAway : meet + between(1.5, 2), 0.55);
      cue(shy, {
        from: lookAway,
        to: lookAway + between(1.8, 2.6),
        look: { x: cx + away * 2.6 * mass, y: cy + 3 * mass },
        head: 0.5,
        pitch: 0.05,
        roll: away * 0.04,
        lids: 0.3,
      });
      cue(bold, { from: lookAway + 0.15, to: lookAway + 1.2, awake: 0.3 });
    } else {
      watch(a, b, time, meet + between(0.6, 1), 0.7, { lead: true });
      watch(b, a, noticed, meet + between(1, 1.5), 0.5);
    }
  }

  /** A leans over and whispers to B, who listens and then reacts. */
  function whisper(a, b, time, moodFor) {
    lastTalk = time;
    const toward = Math.sign(b.placement.cx - a.placement.cx) || 1;
    const talk = time + 0.75;
    const told = talk + between(1.4, 2.2);
    const react = told + 0.3;
    // The talker: eyes first, then the head turns and leans in.
    watch(a, b, time, time + 0.35, 0.3, { lead: true });
    watch(a, b, time + 0.35, told + 0.1, 1.15, { roll: toward * 0.07, pitch: 0.025 });
    cue(a, { from: talk, to: told, mouth: "whisper" });
    // The listener: eyes slide over, head barely turns but leans in.
    watch(b, a, time + 0.5, react, 0.3, { roll: -toward * 0.055 });
    const outcome = Math.random();
    if (outcome < 0.5) {
      const end = react + between(1.3, 1.7);
      watch(b, a, react, end, 0.5, { ...LAUGH, reaction: true });
      watch(a, b, told, end + 0.4, 0.8, { awake: 0.35, lids: 0.2 });
      cue(a, { from: react + 0.4, to: react + 0.9, nod: 0.05 });
    } else if (outcome < 0.8) {
      gossip(a, b, told, react, moodFor);
    } else {
      // A slow, knowing nod.
      const end = react + 1.6;
      watch(b, a, react, end, 0.45, { awake: 0.25, lids: 0.18 });
      cue(b, { from: react + 0.1, to: react + 0.7, nod: 0.06 });
      cue(b, { from: react + 0.75, to: react + 1.35, nod: 0.05 });
      watch(a, b, told, end, 0.8, { awake: 0.3 });
    }
  }

  /**
   * The whisper was about someone: B can't believe it, then both look over.
   * Sometimes that someone looks back, and the two of them look away, caught.
   */
  function gossip(a, b, told, react, moodFor) {
    const subject = [...b.neighbours, ...a.neighbours].find((other) => other !== a && other !== b);
    const turn = react + 0.9;
    watch(b, a, react, turn, 0.5, { awake: 1, mouth: "oh", pitch: -0.05, reaction: true });
    watch(a, b, told, turn + 0.2, 0.8, { awake: 0.4 });
    if (!subject) return;
    const caught = free(subject, turn, moodFor) && Math.random() < 0.55;
    const noticed = turn + between(0.55, 0.8);
    const end = caught ? noticed + 0.35 : turn + between(1.3, 1.8);
    watch(b, subject, turn, end, 0.85, { awake: 0.5 });
    watch(a, subject, turn + 0.25, end + 0.15, 0.8, { awake: 0.3 });
    if (!caught) return;
    // Who, me? Brows up at them; they find something else to look at.
    watch(subject, b, noticed, noticed + between(1.4, 1.8), 0.6, { awake: 0.5 });
    for (const [gossiper, delay] of [
      [b, 0],
      [a, 0.15],
    ]) {
      const { cx, cy, mass } = gossiper.placement;
      const away = Math.sign(cx - subject.placement.cx) || 1;
      cue(gossiper, {
        from: end + delay,
        to: end + delay + between(1.2, 1.6),
        look: { x: cx + away * 2.5 * mass, y: cy + 2.8 * mass },
        head: 0.6,
        lids: 0.25,
        pitch: 0.03,
      });
    }
  }

  /** A says something to B and B answers; now and then they end up laughing together. */
  function chat(a, b, time) {
    lastTalk = time;
    const said = time + 0.45;
    const done = said + between(1, 1.6);
    const reply = done + between(0.2, 0.45);
    const replied = reply + between(0.7, 1.2);
    watch(a, b, time, replied + 0.5, 0.9, { lead: true });
    watch(b, a, time + between(0.25, 0.55), replied + between(0.7, 1.1), 0.75);
    cue(a, { from: said, to: done, mouth: "talk", awake: 0.3 });
    cue(b, { from: done - 0.5, to: done, nod: 0.035 });
    cue(b, { from: reply, to: replied, mouth: "talk", awake: 0.3 });
    if (Math.random() < 0.3) {
      // The answer was funny: B laughs first, A joins in a beat later.
      const laugh = replied + 0.1;
      cue(b, { from: laugh, to: laugh + between(1.1, 1.4), ...LAUGH, reaction: true });
      cue(a, { from: laugh + 0.25, to: laugh + between(1, 1.3), ...LAUGH });
      return;
    }
    cue(a, { from: replied - 0.15, to: replied + 0.35, nod: 0.05 });
  }

  /** Nearby heads turn to see what someone is reacting to, each in their own time. */
  function drawEyes(reactor, until, time, moodFor) {
    for (const other of reactor.neighbours) {
      if (!free(other, time, moodFor) || Math.random() > 0.35 + 0.4 * other.social) continue;
      const from = time + between(0.2, 0.6) * (distance(other, reactor) / spacing) + between(0, 0.3);
      watch(other, reactor, from, until + between(0.4, 1.3), 0.8, { awake: 0.25 });
    }
  }

  /** A deep breath in, and out: chin lifts, then lids drop a little as it settles. */
  function sigh(actor, time) {
    const { cx, cy, mass } = actor.placement;
    const exhale = time + 1.1;
    cue(actor, { from: time, to: exhale, pitch: -0.045, awake: 0.12, look: { x: cx, y: cy - 2 * mass }, head: 0.6 });
    cue(actor, { from: exhale, to: exhale + 1.5, pitch: 0.03, lids: 0.38, look: { x: cx, y: cy + 2.5 * mass }, head: 0.6 });
  }

  /** Something unseen passes above the sheet; heads follow it as it goes by, a few at a time. */
  function somethingPasses(time, moodFor) {
    const leftToRight = Math.random() < 0.5;
    const margin = spacing * 0.6;
    const from = leftToRight ? bounds.left - margin : bounds.right + margin;
    const to = leftToRight ? bounds.right + margin : bounds.left - margin;
    const duration = Math.abs(to - from) / (spacing * PASSING_SPEED);
    const speed = (to - from) / duration;
    const height = bounds.top - spacing * 0.35;
    const wobble = between(0, 6);
    const path = (at) => ({
      x: from + (to - from) * clamp((at - time) / duration),
      y: height + Math.sin(at * 2.3 + wobble) * spacing * 0.08,
    });
    for (const actor of actors.values()) {
      if (!free(actor, time, moodFor) || Math.random() > 0.75) continue;
      // Each head notices it as it comes near and loses interest once it has gone by.
      const lag = between(0.15, 0.55);
      const reach = spacing * between(1.8, 2.6);
      const enter = time + (actor.placement.cx - reach - from) / speed;
      const leave = time + (actor.placement.cx + reach - from) / speed;
      const [start, end] = speed > 0 ? [enter, leave] : [leave, enter];
      cue(actor, { from: Math.max(time, start) + lag, to: end + lag + 0.4, look: { path, lag }, head: 0.75, awake: 0.3 });
    }
  }

  /** Waking up from a doze: a slow blink, a small stretch, a look round. */
  function stir(actor, time) {
    const { cx, cy, mass } = actor.placement;
    const side = Math.random() < 0.5 ? -1 : 1;
    cue(actor, { from: time + 1.2, to: time + 1.3, blink: "slow" });
    cue(actor, { from: time + 1.4, to: time + 2.6, pitch: -0.05, awake: 0.35, look: { x: cx, y: cy - 3 * mass }, head: 0.5 });
    cue(actor, { from: time + 2.6, to: time + 3.6, look: { x: cx + side * 4 * mass, y: cy }, head: 0.35 });
    cue(actor, { from: time + 3.6, to: time + 4.6, look: { x: cx - side * 4 * mass, y: cy }, head: 0.35 });
  }

  /** Something new for a free head to do, now and then. */
  function haveAnIdea(actor, time, moodFor) {
    actor.nextIdeaAt = time + between(3, 8) / actor.social;
    if (time > actor.nextSighAt) {
      actor.nextSighAt = time + between(40, 90);
      return sigh(actor, time);
    }
    if (scenesRunning(time) >= MAX_SCENES) return;
    // Someone nearby is getting all the pointer's attention: have a look.
    const fussedOver = actor.neighbours.find((other) => pointerOwns(other, moodFor));
    if (fussedOver && time - lastGlance > GLANCE_GAP && Math.random() < 0.6) {
      lastGlance = time;
      return watch(actor, fussedOver, time, time + between(1.6, 2.6), 0.8, { awake: 0.3, lead: true });
    }
    const partners = actor.neighbours.filter((other) => other.presence > 0.95);
    const listeners = partners.filter((other) => free(other, time, moodFor));
    if (listeners.length && time - lastTalk > TALK_GAP && Math.random() < 0.45 * actor.social) {
      const sameRow = listeners.filter((other) => Math.abs(other.placement.cy - actor.placement.cy) < spacing * 0.35);
      if (sameRow.length && Math.random() < 0.4) return whisper(actor, pick(sameRow), time, moodFor);
      return chat(actor, pick(listeners), time);
    }
    if (partners.length && time - lastGlance > GLANCE_GAP && Math.random() < 0.75 * actor.social) {
      glance(actor, pick(partners), time, moodFor);
    }
  }

  /* ---------- sleep: some doze, some stay up, and they take turns ---------- */

  function takeTurns(time, moodFor) {
    if (time < nextTurnAt) return;
    nextTurnAt = time + between(...TURN_TAKING);
    const all = [...actors.values()];
    const sleepers = all.filter((actor) => !actor.nightOwl && asleep(actor, moodFor));
    const owls = all.filter((actor) => actor.nightOwl && free(actor, time, moodFor));
    if (!sleepers.length || !owls.length) return;
    // Wake someone with company nearby, and let a different owl nod off.
    const tiring = pick(owls);
    const company = sleepers.filter((actor) => actor.neighbours.some((other) => other.nightOwl && other !== tiring));
    const waking = pick(company.length ? company : sleepers);
    waking.nightOwl = true;
    tiring.nightOwl = false;
    stir(waking, time);
  }

  /** Dozing heads sink slowly forward; some catch themselves with a start, some drift back up. */
  function dozePitch(actor, time) {
    const doze = actor.doze;
    if (doze.since < 0) {
      doze.since = time;
      doze.cycleStart = time;
    }
    let p = (time - doze.cycleStart) / doze.cycleLength;
    if (p >= 1) {
      doze.cycleStart = time;
      doze.cycleLength = between(5, 11);
      doze.catches = Math.random() < 0.55;
      doze.depth = between(0.07, 0.14);
      p = 0;
    }
    const breath = Math.sin(time * 0.9 + actor.breathPhase) * 0.014;
    if (!doze.catches) return bump(p) * doze.depth * 0.7 + breath;
    // Sink, then snap back up in the last tenth of the cycle; the spring adds the jolt.
    return (p < 0.9 ? smooth(p / 0.9) * doze.depth : -0.02) + breath;
  }

  /* ---------- per frame ---------- */

  function updatePresence(actor, engaged, time, dt, moodFor) {
    const returning = time > releasedAt + actor.returnLag;
    const target = engaged || pointerOwns(actor, moodFor) ? 0 : returning ? 1 : actor.presence;
    const rate = target < actor.presence ? YIELD_RATE : RETURN_RATE;
    actor.presence += (target - actor.presence) * (1 - Math.exp(-dt * rate));
    if (target === 0 && actor.presence < 0.02) actor.presence = 0;
    if (actor.presence < 0.5) actor.cues = [];
  }

  function watchMoods(actor, time, moodFor) {
    const mood = moodFor(actor.seed);
    const id = mood && mood.amount > 0.2 ? mood.id : null;
    if (id && id !== actor.lastMood && EYE_CATCHING.has(id) && time - lastMoodWatch > MOOD_WATCH_GAP) {
      lastMoodWatch = time;
      drawEyes(actor, time + 1.4, time, moodFor);
    }
    actor.lastMood = id;
  }

  function updateActor(actor, time, dt, moodFor) {
    actor.cues = actor.cues.filter((c) => c.to > time);
    const active = actor.cues.filter((c) => c.from <= time);
    let look = null;
    let head = 1;
    let latest = -Infinity;
    let pitch = 0;
    let roll = actor.tiltHome + actor.tiltTarget;
    let awake = 0;
    let lids = 0;
    let shake = 0;
    for (const c of active) {
      if (!c.started) {
        c.started = true;
        if (c.blink) doBlink(actor, time, c.blink);
        if (c.reaction) drawEyes(actor, c.to, time, moodFor);
      }
      // The most recently started look wins; everything else adds up.
      const point = c.look && c.from > latest ? lookPoint(c.look, time) : null;
      if (point) [look, head, latest] = [point, c.head, c.from];
      pitch += (c.pitch ?? 0) + (c.nod ? c.nod * bump((time - c.from) / (c.to - c.from)) : 0);
      roll += c.roll ?? 0;
      awake = Math.max(awake, c.awake ?? 0);
      lids = Math.max(lids, c.lids ?? 0);
      shake = Math.max(shake, c.shake ?? 0);
    }
    actor.mouthCue = active.find((c) => c.mouth) ?? null;
    actor.shake = shake;

    if (asleep(actor, moodFor)) {
      const { cx, cy, mass } = actor.placement;
      [look, head] = [{ x: cx, y: cy + 2 * mass }, 0.4];
      pitch += dozePitch(actor, time);
    } else {
      actor.doze.since = -1;
      if (!active.length && time > actor.nextTiltAt) {
        actor.nextTiltAt = time + between(6, 15);
        actor.tiltTarget = between(-0.035, 0.035);
      }
    }
    if (!look) {
      updateFixation(actor, time);
      [look, head] = [actor.fixation, actor.fixation.head];
    }
    actor.looking = { x: look.x, y: look.y, head };
    spring(actor.pitch, pitch, dt);
    spring(actor.roll, roll, dt, 26, 0.5);
    actor.awake += (awake - actor.awake) * (1 - Math.exp(-dt * 7));
    actor.lids += (lids - actor.lids) * (1 - Math.exp(-dt * 9));
  }

  return {
    /** Lay the actors out on the sheet's cells: [{seed, placement: {cx, cy, mass}}]. */
    setCells(cells) {
      const now = lastTime ?? 0;
      const next = new Map();
      let newcomers = false;
      for (const { seed, placement } of cells) {
        const actor = actors.get(seed) ?? ((newcomers = true), createActor(seed, placement, now));
        actor.placement = placement;
        // Start (or restart after a resize) looking ahead, each head moving on in its own time.
        actor.fixation = { x: placement.cx, y: placement.cy + placement.mass * 0.4, head: 1 };
        actor.fixationUntil = now + between(0.4, 3.5);
        next.set(seed, actor);
      }
      actors = next;
      const list = [...actors.values()];
      spacing = cellSpacing(list);
      for (const actor of list) {
        actor.neighbours = list
          .filter((other) => other !== actor && distance(actor, other) < spacing * NEIGHBOUR_REACH)
          .sort((a, b) => distance(actor, a) - distance(actor, b));
      }
      if (newcomers) chooseNightOwls(list);
      bounds = {
        left: Math.min(...list.map((actor) => actor.placement.cx)),
        right: Math.max(...list.map((actor) => actor.placement.cx)),
        top: Math.min(...list.map((actor) => actor.placement.cy - actor.placement.mass * 2)),
      };
    },

    /** Forget everyone, e.g. for a new sheet. */
    reset() {
      actors = new Map();
    },

    /**
     * Advance the room by one frame. `pointer` is the sheet's pointer
     * ({x, y, da}), `idleFor` the seconds since it last moved, `closeUp`
     * whether a head is being looked at up close, `moodFor(seed)` the mood
     * board's verdict and `gazes` the per-head gaze states (for blinks).
     */
    update(time, { pointer, idleFor, closeUp, moodFor, gazes: gazeStates }) {
      gazes = gazeStates;
      const dt = lastTime === null ? 0 : clamp(time - lastTime, 0, 0.1);
      lastTime = time;
      const engaged = closeUp || (pointer.da && idleFor < RESUME_AFTER);
      if (engagedBefore && !engaged) releasedAt = time;
      engagedBefore = engaged;
      for (const actor of actors.values()) updatePresence(actor, engaged, time, dt, moodFor);
      if (!engaged) {
        if (idleFor > BEDTIME) takeTurns(time, moodFor);
        else nextTurnAt = time + between(...TURN_TAKING) * 0.5;
        for (const actor of actors.values()) {
          watchMoods(actor, time, moodFor);
          if (time > actor.nextIdeaAt && free(actor, time, moodFor)) haveAnIdea(actor, time, moodFor);
        }
        if (time > nextPassingAt) {
          nextPassingAt = time + between(...PASSING_EVERY);
          somethingPasses(time, moodFor);
        }
      }
      for (const actor of actors.values()) updateActor(actor, time, dt, moodFor);
    },

    /** Where life would like this head to look, for the gaze spring. */
    look(seed) {
      const actor = actors.get(seed);
      if (!actor?.looking || actor.presence <= 0) return undefined;
      return { ...actor.looking, weight: actor.presence };
    },

    /** Whether this head is one of the ones staying up while others doze. */
    wakeful(seed) {
      return !!actors.get(seed)?.nightOwl;
    },

    /** The animation state, bent by what this head is up to. Returns a new state. */
    apply(seed, state) {
      const actor = actors.get(seed);
      const w = actor?.presence ?? 0;
      if (w <= 0.001) return state;
      const time = state.time ?? 0;
      const shake = actor.shake ? Math.sin(time * 15) * 0.012 * actor.shake : 0;
      const mouth = actor.mouthCue ? mouthFor(actor.mouthCue.mouth, time, actor.mouthCue) : 0;
      return {
        ...state,
        pose: {
          ...state.pose,
          pitch: state.pose.pitch + (actor.pitch.x + shake) * w,
          roll: state.pose.roll + actor.roll.x * w,
        },
        lids: Math.max(state.lids, actor.lids * w),
        awake: Math.min(1, state.awake + actor.awake * w),
        mouth: state.mouth + (mouth - state.mouth) * w,
      };
    },
  };
}
