import { Character, GameState, Petition, PetitionChoice, Trait, Gender } from './types';

const STORAGE_KEY = 'immortal-lineage-save-v2';
const START_YEAR = 1200;
const TICK_YEARS = 0.25;

const maleFirstNames = [
  'Alden', 'Rowan', 'Milo', 'Darian', 'Lucan', 'Kieran', 'Bram', 'Finn', 'Tomas', 'Silas',
  'Elias', 'Oren', 'Cassian', 'Niall', 'Ravi', 'Ivo', 'Leon', 'Aric', 'Jasper', 'Theo',
];

const femaleFirstNames = [
  'Mira', 'Selene', 'Liora', 'Nora', 'Ayla', 'Iris', 'Vera', 'Rhea', 'Talia', 'Elara',
  'Kara', 'Nyra', 'Anika', 'Zara', 'Maeve', 'Sera', 'Leona', 'Ines', 'Celine', 'Daphne',
];

const surnames = [
  'Ashford', 'Vale', 'Thorne', 'Rivers', 'Dawn', 'Hollow', 'Winter', 'Marrow', 'Stone', 'Wren',
  'Crowe', 'Bright', 'Ever', 'Redfern', 'Locke', 'Pine', 'Morrow', 'Lark', 'Frost', 'Hale',
];

const traits: Trait[] = ['Brave', 'Kind', 'Ambitious', 'Jealous', 'Frail'];

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const randomId = () => crypto.randomUUID();
const randomOf = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];
const pushDebug = (logs: string[], line: string) => logs.push(line);

const pushCharacterHistory = (person: Character, entry: string): Character => ({
  ...person,
  history: [entry, ...(person.history ?? [])].slice(0, 12),
});

const lifeStage = (person: Character): string => {
  if (!person.alive) return 'dead';
  if (person.age < 3) return 'baby';
  if (person.age < 13) return 'child';
  if (person.age < 18) return 'teen';
  if (person.age < 55) return 'adult';
  return 'elder';
};

const makeName = (gender: Gender, surname: string, avoid: Set<string>): string => {
  const pool = gender === 'male' ? maleFirstNames : femaleFirstNames;
  let first = randomOf(pool);
  let attempts = 0;
  while (avoid.has(first) && attempts < 6) {
    first = randomOf(pool);
    attempts += 1;
  }
  return `${first} ${surname}`;
};

const withCharacterEvent = (state: GameState, characterId: string, entry: string): GameState => ({
  ...state,
  people: state.people.map((p) => (p.id === characterId ? pushCharacterHistory(p, entry) : p)),
});

const findById = (state: GameState, id: string) => state.people.find((p) => p.id === id);

const makePerson = (opts: {
  gender?: Gender;
  surname?: string;
  age: number;
  parents?: string[];
  generation?: number;
  nameAvoid?: Set<string>;
}): Character => {
  const gender = opts.gender ?? (Math.random() < 0.5 ? 'male' : 'female');
  const surname = opts.surname ?? randomOf(surnames);
  return {
    id: randomId(),
    name: makeName(gender, surname, opts.nameAvoid ?? new Set()),
    age: opts.age,
    health: clamp(70 + Math.random() * 25),
    happiness: clamp(55 + Math.random() * 35),
    fertility: clamp(55 + Math.random() * 35),
    trait: randomOf(traits),
    gender,
    surname,
    spouseId: null,
    parents: opts.parents ?? [],
    children: [],
    alive: true,
    generation: opts.generation ?? 0,
    familiarity: opts.parents && opts.parents.length > 0 ? 1 : 2,
    lastSeenYear: START_YEAR,
    history: ['Their story began.'],
  };
};

const getLiving = (people: Character[]) => people.filter((p) => p.alive);

export const createInitialState = (): GameState => {
  const founderA = makePerson({ age: 24, surname: randomOf(surnames), generation: 0 });
  const founderB = makePerson({ age: 22, surname: founderA.surname, generation: 0 });
  founderA.spouseId = founderB.id;
  founderB.spouseId = founderA.id;
  founderA.history = ['You welcomed this founder into the bloodline.'];
  founderB.history = ['A spouse joined to begin the first household.'];

  return {
    year: START_YEAR,
    people: [founderA, founderB],
    influence: 5,
    wealth: 55,
    reputation: 50,
    descendantsCreated: 0,
    petitions: [],
    history: ['You awaken as immortal patron. Time now flows continuously.'],
    gameOver: false,
  };
};

const ageAndHealthTick = (state: GameState, debugLogs: string[]): GameState => ({
  ...state,
  people: state.people.map((person) => {
    if (!person.alive) return person;
    const age = person.age + TICK_YEARS;
    const stage = lifeStage({ ...person, age });
    const baselineDecline = stage === 'elder' ? 1.4 : stage === 'adult' ? 0.8 : 0.35;
    const traitDecline = person.trait === 'Frail' ? 0.6 : 0;
    const totalHealthDecline = baselineDecline + traitDecline;
    const fertilityDecline = stage === 'adult' ? 0.35 : 0.08;
    pushDebug(
      debugLogs,
      `[aging] ${person.name}: stage=${stage}, age +${TICK_YEARS}, health -${totalHealthDecline.toFixed(2)} (base=${baselineDecline.toFixed(2)}, trait=${traitDecline.toFixed(2)}), fertility -${fertilityDecline.toFixed(2)}, happiness -0.20`,
    );
    return {
      ...person,
      age,
      health: clamp(person.health - totalHealthDecline),
      happiness: clamp(person.happiness - 0.2),
      fertility: clamp(person.fertility - fertilityDecline),
    };
  }),
});

const resolveDeaths = (state: GameState, debugLogs: string[]): GameState => {
  const messages: string[] = [];
  const people = state.people.map((person) => {
    if (!person.alive) return person;
    const ageRisk = person.age > 80 ? 0.2 : person.age > 65 ? 0.08 : person.age > 50 ? 0.03 : 0.006;
    const healthRisk = (100 - person.health) / 1100;
    const traitRisk = person.trait === 'Frail' ? 0.01 : 0;
    const totalRisk = ageRisk + healthRisk + traitRisk;
    const roll = Math.random();
    pushDebug(
      debugLogs,
      `[death-check] ${person.name}: roll=${roll.toFixed(3)} vs risk=${totalRisk.toFixed(3)} (age=${ageRisk.toFixed(3)}, health=${healthRisk.toFixed(3)}, trait=${traitRisk.toFixed(3)})`,
    );
    if (roll > totalRisk) return person;
    messages.push(`${person.name} died.`);
    pushDebug(debugLogs, `[death] ${person.name} died because roll was within risk threshold.`);
    return pushCharacterHistory({ ...person, alive: false, health: 0, spouseId: person.spouseId }, `Year ${Math.floor(state.year)}: They passed away.`);
  });

  return { ...state, people, history: [...messages, ...state.history].slice(0, 10) };
};

// Marriage simulation: eligible adults can marry automatically or via petition.
const resolveMarriages = (state: GameState, debugLogs: string[]): GameState => {
  let next = state;
  for (const person of state.people) {
    if (!person.alive || person.spouseId || person.age < 18 || person.age > 50) continue;

    const familyLoad = person.children.length;
    const ageFit = 1 - Math.abs(person.age - 28) / 22;
    const healthFit = person.health / 100;
    const chance = clamp((ageFit * 0.5 + healthFit * 0.4 + (familyLoad === 0 ? 0.2 : 0.05)) * 100, 0, 95) / 100;
    const finalChance = chance * 0.09;
    const roll = Math.random();
    pushDebug(
      debugLogs,
      `[marriage-check] ${person.name}: roll=${roll.toFixed(3)} vs chance=${finalChance.toFixed(3)} (ageFit=${ageFit.toFixed(2)}, healthFit=${healthFit.toFixed(2)}, familyLoad=${familyLoad})`,
    );
    if (roll > finalChance) continue;

    const needsApproval = Math.random() < 0.45;
    if (needsApproval) {
      const petition = createMarriagePetition(person.id, state);
      pushDebug(debugLogs, `[marriage] ${person.name} triggered a marriage petition (needs approval).`);
      next = { ...next, petitions: [...next.petitions, petition] };
      continue;
    }

    pushDebug(debugLogs, `[marriage] ${person.name} married automatically.`);
    next = createMarriage(next, person.id);
  }
  return next;
};

const createMarriage = (state: GameState, personId: string): GameState => {
  const person = findById(state, personId);
  if (!person || !person.alive || person.spouseId) return state;

  const spouseGender: Gender = person.gender === 'male' ? 'female' : 'male';
  const avoid = new Set<string>([
    ...person.children.map((cid) => (findById(state, cid)?.name.split(' ')[0] ?? '')),
    person.name.split(' ')[0],
  ]);

  const spouse = makePerson({
    age: clamp(person.age + (Math.random() * 8 - 4), 18, 48),
    gender: spouseGender,
    surname: person.surname,
    generation: person.generation,
    nameAvoid: avoid,
  });
  spouse.spouseId = person.id;
  spouse.history = [`Year ${Math.floor(state.year)}: Married into the ${person.surname} household.`];

  const people = state.people.map((p) =>
    p.id === person.id ? pushCharacterHistory({ ...p, spouseId: spouse.id }, `Year ${Math.floor(state.year)}: Married ${spouse.name}.`) : p,
  );

  return {
    ...state,
    people: [...people, spouse],
    reputation: clamp(state.reputation + 2),
    history: [`${person.name} married ${spouse.name}.`, ...state.history].slice(0, 10),
  };
};

// Birth simulation: married couples can have children; chance declines as family grows.
const resolveBirths = (state: GameState, debugLogs: string[]): GameState => {
  let next = state;
  const seenCouples = new Set<string>();

  for (const parentA of state.people) {
    if (!parentA.alive || !parentA.spouseId || parentA.age < 18 || parentA.age > 47) continue;
    const parentB = findById(next, parentA.spouseId);
    if (!parentB || !parentB.alive || parentB.spouseId !== parentA.id) continue;

    const key = [parentA.id, parentB.id].sort().join('-');
    if (seenCouples.has(key)) continue;
    seenCouples.add(key);

    const sharedChildren = parentA.children.filter((id) => parentB.children.includes(id));
    if (sharedChildren.length >= 10) continue;

    const ageFactor = clamp((46 - Math.max(parentA.age, parentB.age)) / 24, 0, 1);
    const healthFactor = (parentA.health + parentB.health) / 200;
    const fertilityFactor = (parentA.fertility + parentB.fertility) / 200;
    const familySizePenalty = Math.pow(0.72, sharedChildren.length);
    const birthChance = 0.14 * ageFactor * healthFactor * fertilityFactor * familySizePenalty;

    const roll = Math.random();
    pushDebug(
      debugLogs,
      `[birth-check] ${parentA.name} + ${parentB.name}: roll=${roll.toFixed(3)} vs chance=${birthChance.toFixed(3)} (ageFactor=${ageFactor.toFixed(2)}, healthFactor=${healthFactor.toFixed(2)}, fertilityFactor=${fertilityFactor.toFixed(2)}, children=${sharedChildren.length}, penalty=${familySizePenalty.toFixed(2)})`,
    );
    if (roll > birthChance) continue;

    const avoid = new Set<string>([
      ...sharedChildren.map((id) => (findById(next, id)?.name.split(' ')[0] ?? '')),
      parentA.name.split(' ')[0],
      parentB.name.split(' ')[0],
    ]);

    const child = makePerson({
      age: 0,
      surname: parentA.surname,
      parents: [parentA.id, parentB.id],
      generation: Math.max(parentA.generation, parentB.generation) + 1,
      nameAvoid: avoid,
    });
    child.health = clamp(78 + Math.random() * 18);
    child.happiness = clamp(65 + Math.random() * 20);
    child.history = [`Year ${Math.floor(next.year)}: Born to ${parentA.name} and ${parentB.name}.`];

    next = {
      ...next,
      descendantsCreated: next.descendantsCreated + 1,
      people: next.people.map((p) => {
        if (p.id === parentA.id || p.id === parentB.id) {
          return pushCharacterHistory({ ...p, children: [...p.children, child.id] }, `Year ${Math.floor(next.year)}: Welcomed ${child.name}.`);
        }
        return p;
      }),
      history: [`${child.name} was born.`, ...next.history].slice(0, 10),
    };

    next.people.push(child);
    pushDebug(debugLogs, `[birth] ${child.name} born to ${parentA.name} and ${parentB.name}.`);
  }

  return next;
};

const makeSimplePetition = (
  characterId: string,
  title: string,
  description: string,
  choices: PetitionChoice[],
): Petition => ({ id: randomId(), characterId, title, description, choices });

const createMarriagePetition = (characterId: string, state: GameState): Petition => {
  const person = findById(state, characterId);
  const name = person?.name ?? 'A relative';
  return makeSimplePetition(characterId, 'Marriage Proposal', `${name} asks permission to marry into another branch.`, [
    {
      id: 'approve-marriage',
      label: 'Approve the match',
      influenceCost: 1,
      effect: (s, id) => createMarriage({ ...s, reputation: clamp(s.reputation + 4) }, id),
    },
    {
      id: 'decline-marriage',
      label: 'Decline for now',
      influenceCost: 0,
      supportsCharacter: false,
      effect: (s, id) => withCharacterEvent({ ...s, reputation: clamp(s.reputation - 3) }, id, 'Their marriage plea was refused.'),
    },
  ]);
};

const generatePetitions = (state: GameState, debugLogs: string[]): Petition[] => {
  if (state.petitions.length > 0) return state.petitions;
  const adults = getLiving(state.people).filter((p) => p.age >= 16);
  const roll = Math.random();
  pushDebug(debugLogs, `[petition-check] adults=${adults.length}, roll=${roll.toFixed(3)} vs threshold=0.080`);
  if (adults.length === 0 || roll > 0.08) return [];

  const c = randomOf(adults);
  const baseChoices = {
    aid: {
      id: 'aid', label: 'Provide aid', influenceCost: 1,
      effect: (s: GameState, id: string) => withCharacterEvent({ ...s, wealth: clamp(s.wealth - 6), reputation: clamp(s.reputation + 3) }, id, 'Received help from the immortal patron.'),
    },
    refuse: {
      id: 'refuse', label: 'Refuse', influenceCost: 0, supportsCharacter: false,
      effect: (s: GameState, id: string) => withCharacterEvent({ ...s, reputation: clamp(s.reputation - 2) }, id, 'Was denied support.'),
    },
  };

  const type = randomOf(['sickness', 'family', 'money', 'child']);
  pushDebug(debugLogs, `[petition] ${c.name} generated petition type="${type}".`);
  if (type === 'sickness') {
    return [makeSimplePetition(c.id, 'Sickness in the Household', 'A healer is needed immediately.', [
      {
        id: 'send-healer', label: 'Send healer and medicine', influenceCost: 2,
        effect: (s, id) => withCharacterEvent({ ...s, wealth: clamp(s.wealth - 8) }, id, 'Recovered after treatment.'),
      },
      baseChoices.refuse,
    ])];
  }
  if (type === 'family') {
    return [makeSimplePetition(c.id, 'Family Dispute', 'Two siblings are tearing the home apart.', [
      {
        id: 'mediate', label: 'Mediate the dispute', influenceCost: 1,
        effect: (s) => ({ ...s, reputation: clamp(s.reputation + 2), history: ['You restored peace in the family.', ...s.history].slice(0, 10) }),
      },
      baseChoices.refuse,
    ])];
  }
  if (type === 'money') {
    return [makeSimplePetition(c.id, 'Money Trouble', 'Harvest failed. The branch asks for coin.', [baseChoices.aid, baseChoices.refuse])];
  }

  return [makeSimplePetition(c.id, 'Child Event', 'A child needs tutoring and extra care.', [
    {
      id: 'fund-child', label: 'Fund child support', influenceCost: 1,
      effect: (s, id) => withCharacterEvent({ ...s, wealth: clamp(s.wealth - 4), reputation: clamp(s.reputation + 2) }, id, 'Their child received support.'),
    },
    baseChoices.refuse,
  ])];
};

export const applyPetitionChoice = (state: GameState, petitionId: string, choiceId: string): GameState => {
  const petition = state.petitions.find((p) => p.id === petitionId);
  if (!petition) return state;
  const choice = petition.choices.find((c) => c.id === choiceId);
  if (!choice || state.influence < choice.influenceCost) return state;

  let next: GameState = {
    ...state,
    influence: state.influence - choice.influenceCost,
    petitions: state.petitions.filter((p) => p.id !== petitionId),
  };
  next = choice.effect(next, petition.characterId);
  console.log('[sim][petition-decision]', {
    year: Math.floor(state.year),
    petition: petition.title,
    choice: choice.label,
    influenceCost: choice.influenceCost,
    remainingInfluence: next.influence,
  });

  return {
    ...next,
    history: [`Decision made: ${petition.title}.`, ...next.history].slice(0, 10),
  };
};

// Main real-time simulation tick.
export const advanceSimulationTick = (state: GameState, debugMode = false): GameState => {
  if (state.gameOver || state.petitions.length > 0) return state;
  const debugLogs: string[] = [];

  let next: GameState = {
    ...state,
    year: state.year + TICK_YEARS,
    influence: Math.min(10, state.influence + 0.2),
    wealth: clamp(state.wealth + 0.35),
  };
  pushDebug(debugLogs, `[tick] year ${state.year.toFixed(2)} -> ${next.year.toFixed(2)} | influence ${state.influence.toFixed(2)} -> ${next.influence.toFixed(2)} | wealth ${state.wealth.toFixed(2)} -> ${next.wealth.toFixed(2)}`);

  next = ageAndHealthTick(next, debugLogs);
  next = resolveMarriages(next, debugLogs);
  next = resolveBirths(next, debugLogs);
  next = resolveDeaths(next, debugLogs);

  next.petitions = generatePetitions(next, debugLogs);
  if (next.petitions.length > 0) {
    next.history = ['A petition arrived. Time pauses until you decide.', ...next.history].slice(0, 10);
    pushDebug(debugLogs, `[tick-end] simulation paused due to ${next.petitions.length} petition(s).`);
  }

  next.gameOver = getLiving(next.people).length === 0;
  pushDebug(debugLogs, `[tick-end] living=${getLiving(next.people).length}, gameOver=${next.gameOver}`);

  if (debugMode) {
    console.groupCollapsed(`[sim] Tick @ year ${next.year.toFixed(2)}`);
    debugLogs.forEach((line) => console.log(line));
    console.log('[sim] snapshot', {
      living: getLiving(next.people).length,
      people: next.people.length,
      descendants: next.descendantsCreated,
      petitions: next.petitions.length,
      influence: Number(next.influence.toFixed(2)),
      wealth: Number(next.wealth.toFixed(2)),
      reputation: Number(next.reputation.toFixed(2)),
    });
    console.groupEnd();
  }

  return next;
};

export const saveGame = (state: GameState): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const loadGame = (): GameState | null => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as GameState;
    return {
      ...parsed,
      wealth: parsed.wealth ?? 50,
      reputation: parsed.reputation ?? 50,
      people: parsed.people.map((p) => ({
        ...p,
        spouseId: p.spouseId ?? null,
        surname: p.surname ?? p.name.split(' ').slice(-1)[0],
        gender: p.gender ?? 'male',
        generation: p.generation ?? 0,
        fertility: p.fertility ?? 60,
        familiarity: p.familiarity ?? 1,
      })),
    };
  } catch {
    return null;
  }
};

export const resetGame = (): GameState => {
  const fresh = createInitialState();
  saveGame(fresh);
  return fresh;
};
