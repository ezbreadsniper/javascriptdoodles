import {
  h as DRE_HEAD_SHAPE_PRESETS,
  m as featureCategories,
  d as generateCharacter,
} from "./core.js";

const HEAD_DISTANCE_SCALES = Object.freeze({
  rx: 0.3,
  ry: 0.3,
  rz: 0.2,
  cone: 0.5,
  partingHigh: 0.2,
  bump: 0.7,
  boxy: 1,
});

export const HEAD_SHAPE_IDS = Object.freeze(
  Object.keys(DRE_HEAD_SHAPE_PRESETS),
);

export const HEAD_SHAPE_LABELS = Object.freeze({
  egg: "Egg",
  round: "Round",
  long: "Long",
  pear: "Pear",
  block: "Block",
  knobbly: "Knobbly",
});

const hairCategory = featureCategories.find(({ id }) => id === "hair");

export const DRE_FEATURE_CHOICES = Object.freeze(
  Object.fromEntries(
    featureCategories
      .filter(({ id }) => id !== "head")
      .map(({ id, entries }) => [
        id,
        Object.freeze(entries.map(({ id: choiceId }) => choiceId)),
      ]),
  ),
);

export const HAIR_IDS = Object.freeze(
  hairCategory.entries.map(({ id }) => id),
);

export const HAIR_LABELS = Object.freeze({
  none: "Bare",
  fuzz: "Fuzz",
  bowl: "Cap",
  fringe: "Fringe",
  curls: "Curls",
  spikes: "Spikes",
  antenna: "Antenna",
  sidepart: "Side part",
  curlcloud: "Curl cloud",
  crop: "Crop",
  pigtails: "Braids",
  bun: "Bun",
  afro: "Afro",
  mohawk: "Mohawk",
  straightbacks: "Straight-backs",
  ghanabraids: "Ghana braids",
  sweptbob: "Swept bob",
});

export function headShapeIdForCharacter(character) {
  let closestId = HEAD_SHAPE_IDS[0];
  let closestScore = Infinity;

  for (const [id, preset] of Object.entries(DRE_HEAD_SHAPE_PRESETS)) {
    let score = 0;
    for (const [field, scale] of Object.entries(HEAD_DISTANCE_SCALES)) {
      score += ((character.head[field] - preset[field]) / scale) ** 2;
    }
    if (score < closestScore) {
      closestId = id;
      closestScore = score;
    }
  }
  return closestId;
}

export function headShapeIdForSeed(seed) {
  return headShapeIdForCharacter(generateCharacter(seed));
}

export function identityProfileForCharacter(character) {
  if (character.lifepathIdentity) return character.lifepathIdentity;

  const headShapeId = headShapeIdForCharacter(character);
  const hairId = character.features.hair;
  const featureIds = Object.freeze({
    ...Object.fromEntries(
      Object.keys(DRE_FEATURE_CHOICES).map((id) => [id, character.features[id]]),
    ),
  });
  return {
    headShapeId,
    headShapeLabel: HEAD_SHAPE_LABELS[headShapeId],
    hairId,
    hairLabel: HAIR_LABELS[hairId],
    featureIds,
  };
}

export function applyIdentityProfile(character) {
  if (character.lifepathIdentity) return character;

  const profile = identityProfileForCharacter(character);

  return {
    ...character,
    lifepathIdentity: Object.freeze({
      ...profile,
      featureIds: Object.freeze({ ...profile.featureIds }),
    }),
  };
}

export function createLifepathIdentity(seed) {
  return applyIdentityProfile(generateCharacter(seed));
}

export function identityProfileForSeed(seed) {
  return identityProfileForCharacter(createLifepathIdentity(seed));
}
