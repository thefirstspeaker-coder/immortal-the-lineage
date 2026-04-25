import { Character, GameState, Petition, PetitionChoice, Trait } from './types';

const STORAGE_KEY = 'immortal-lineage-save-v1';

const firstNames = [
  'Ari',
  'Mina',
  'Jules',
  'Sora',
  'Nico',
  'Lina',
  'Ravi',
  'Thea',
  'Kian',
  'Nora',
  'Iris',
  'Leo',
];

const traits: Trait[] = ['Brave', 'Kind', 'Ambitious', 'Jealous', 'Frail'];

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));

const randomId = () => crypto.randomUUID();
const randomOf = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];

const updateCharacter = (
  state: GameState,
  characterId: string,
  updater: (character: Character) => Character,
): GameState => ({
  ...state,
  people: state.people.map((person) => (person.id === characterId ? updater(person) : person)),
});

const shiftAllLiving = (
  state: GameState,
  healthDelta: number,
  happinessDelta: number,
  message: string,
): GameState => ({
  ...state,
  people: state.people.map((person) =>
    person.alive
      ? {
          ...person,
          health: clamp(person.health + healthDelta),
          happiness: clamp(person.happiness + happinessDelta),
        }
      : person,
  ),
  history: [message, ...state.history].slice(0, 8),
});

interface PetitionTemplate {
  title: string;
  description: string;
  choices: PetitionChoice[];
}

const petitionTemplates: PetitionTemplate[] = [
  {
    title: 'Start a Trade Business',
    description: '"I want to open a tiny trade stall in town."',
    choices: [
      {
        id: 'support-business',
        label: 'Support the business dream',
        influenceCost: 2,
        effect: (state, id) =>
          updateCharacter(
            {
              ...state,
              history: ['You funded a business attempt.', ...state.history].slice(0, 8),
            },
            id,
            (c) => ({ ...c, happiness: clamp(c.happiness + 20), health: clamp(c.health + 3) }),
          ),
      },
      {
        id: 'refuse-business',
        label: 'Refuse and urge caution',
        influenceCost: 0,
        effect: (state, id) => updateCharacter(state, id, (c) => ({ ...c, happiness: clamp(c.happiness - 12) })),
      },
    ],
  },
  {
    title: 'Marriage Blessing',
    description: '"May I marry someone from another village?"',
    choices: [
      {
        id: 'bless-marriage',
        label: 'Bless the marriage',
        influenceCost: 1,
        effect: (state, id) => updateCharacter(state, id, (c) => ({ ...c, happiness: clamp(c.happiness + 15) })),
      },
      {
        id: 'delay-marriage',
        label: 'Ask them to wait',
        influenceCost: 0,
        effect: (state, id) => updateCharacter(state, id, (c) => ({ ...c, happiness: clamp(c.happiness - 8) })),
      },
    ],
  },
  {
    title: 'Family Conflict',
    description: '"I am feuding with my sibling. Please help."',
    choices: [
      {
        id: 'mediate-conflict',
        label: 'Mediate kindly',
        influenceCost: 1,
        effect: (state, id) =>
          shiftAllLiving(updateCharacter(state, id, (c) => ({ ...c, happiness: clamp(c.happiness + 10) })), 0, 3, 'Peace returned to the home.'),
      },
      {
        id: 'ignore-conflict',
        label: 'Ignore the argument',
        influenceCost: 0,
        effect: (state) => shiftAllLiving(state, 0, -5, 'The argument lingers through the year.'),
      },
    ],
  },
  {
    title: 'Health Scare',
    description: '"I feel unwell and fear the winter."',
    choices: [
      {
        id: 'pay-healer',
        label: 'Send medicine and healer',
        influenceCost: 2,
        effect: (state, id) => updateCharacter(state, id, (c) => ({ ...c, health: clamp(c.health + 25), happiness: clamp(c.happiness + 5) })),
      },
      {
        id: 'home-rest',
        label: 'Suggest rest at home',
        influenceCost: 0,
        effect: (state, id) => updateCharacter(state, id, (c) => ({ ...c, health: clamp(c.health - 8) })),
      },
    ],
  },
  {
    title: 'Move Away Request',
    description: '"I want to move to the city for new opportunities."',
    choices: [
      {
        id: 'allow-move',
        label: 'Allow the move',
        influenceCost: 1,
        effect: (state, id) => updateCharacter(state, id, (c) => ({ ...c, happiness: clamp(c.happiness + 12) })),
      },
      {
        id: 'deny-move',
        label: 'Ask them to stay close',
        influenceCost: 0,
        effect: (state, id) => updateCharacter(state, id, (c) => ({ ...c, happiness: clamp(c.happiness - 10), health: clamp(c.health + 2) })),
      },
    ],
  },
  {
    title: 'Study Ambition',
    description: '"Can I spend years studying the old books?"',
    choices: [
      {
        id: 'fund-study',
        label: 'Fund their study',
        influenceCost: 2,
        effect: (state, id) => updateCharacter(state, id, (c) => ({ ...c, happiness: clamp(c.happiness + 18) })),
      },
      {
        id: 'decline-study',
        label: 'Decline for now',
        influenceCost: 0,
        effect: (state, id) => updateCharacter(state, id, (c) => ({ ...c, happiness: clamp(c.happiness - 9) })),
      },
    ],
  },
  {
    title: 'Risky Expedition',
    description: '"I want to join an expedition beyond the hills."',
    choices: [
      {
        id: 'approve-expedition',
        label: 'Approve bravely',
        influenceCost: 1,
        effect: (state, id) => updateCharacter(state, id, (c) => ({ ...c, health: clamp(c.health - 8), happiness: clamp(c.happiness + 16) })),
      },
      {
        id: 'forbid-expedition',
        label: 'Forbid the journey',
        influenceCost: 0,
        effect: (state, id) => updateCharacter(state, id, (c) => ({ ...c, happiness: clamp(c.happiness - 10), health: clamp(c.health + 4) })),
      },
    ],
  },
  {
    title: 'Festival Donation',
    description: '"May we host a festival for the whole town?"',
    choices: [
      {
        id: 'sponsor-festival',
        label: 'Sponsor celebration',
        influenceCost: 1,
        effect: (state) => shiftAllLiving(state, 0, 8, 'A joyful festival lifted spirits.'),
      },
      {
        id: 'save-supplies',
        label: 'Save supplies this year',
        influenceCost: 0,
        effect: (state) => shiftAllLiving(state, 0, -3, 'The town remained quiet and tense.'),
      },
    ],
  },
  {
    title: 'Care for Elder',
    description: '"Grandmother needs help at home."',
    choices: [
      {
        id: 'hire-care',
        label: 'Provide household help',
        influenceCost: 1,
        effect: (state) => shiftAllLiving(state, 5, 4, 'Extra care improved the family health.'),
      },
      {
        id: 'family-manages',
        label: 'Let family handle it',
        influenceCost: 0,
        effect: (state) => shiftAllLiving(state, -4, -2, 'The burden made everyone a bit tired.'),
      },
    ],
  },
  {
    title: 'Sibling Apprenticeship',
    description: '"I wish to apprentice under a strict master."',
    choices: [
      {
        id: 'encourage-apprentice',
        label: 'Encourage discipline',
        influenceCost: 1,
        effect: (state, id) => updateCharacter(state, id, (c) => ({ ...c, happiness: clamp(c.happiness + 6), health: clamp(c.health + 6) })),
      },
      {
        id: 'keep-near-home',
        label: 'Keep them near home',
        influenceCost: 0,
        effect: (state, id) => updateCharacter(state, id, (c) => ({ ...c, happiness: clamp(c.happiness - 6) })),
      },
      {
        id: 'compromise-apprentice',
        label: 'Try a short trial first',
        influenceCost: 1,
        effect: (state, id) => updateCharacter(state, id, (c) => ({ ...c, happiness: clamp(c.happiness + 2), health: clamp(c.health + 2) })),
      },
    ],
  },
];

const getLiving = (people: Character[]) => people.filter((person) => person.alive);

const makeFounder = (): Character => ({
  id: randomId(),
  name: randomOf(firstNames),
  age: 22,
  health: 85,
  happiness: 75,
  trait: randomOf(traits),
  parents: [],
  children: [],
  alive: true,
});

export const createInitialState = (): GameState => {
  const founderA = makeFounder();
  const founderB = makeFounder();

  return {
    year: 1200,
    people: [founderA, { ...founderB, age: 20 }],
    influence: 5,
    descendantsCreated: 0,
    petitions: [],
    history: ['You awaken as the immortal patron of a hopeful household.'],
    gameOver: false,
  };
};

export const agePeople = (state: GameState): GameState => ({
  ...state,
  people: state.people.map((person) =>
    person.alive
      ? {
          ...person,
          age: person.age + 1,
          health: clamp(
            person.health - (person.age > 50 ? 4 : person.age > 35 ? 2 : 1) - (person.trait === 'Frail' ? 2 : 0),
          ),
          happiness: clamp(person.happiness - 1),
        }
      : person,
  ),
});

export const resolveDeaths = (state: GameState): GameState => ({
  ...state,
  people: state.people.map((person) => {
    if (!person.alive) return person;
    const ageRisk = person.age > 75 ? 0.35 : person.age > 60 ? 0.2 : person.age > 45 ? 0.1 : 0.03;
    const healthRisk = (100 - person.health) / 300;
    const traitRisk = person.trait === 'Frail' ? 0.08 : 0;
    const totalRisk = ageRisk + healthRisk + traitRisk;

    if (Math.random() < totalRisk) {
      return { ...person, alive: false, health: 0 };
    }

    return person;
  }),
});

export const resolveBirths = (state: GameState): GameState => {
  const adults = state.people.filter((person) => person.alive && person.age >= 18 && person.age <= 40);
  if (adults.length < 2) return state;

  let nextState = state;
  const birthRoll = Math.random();

  if (birthRoll > 0.45) {
    const parentA = randomOf(adults);
    const parentB = randomOf(adults.filter((adult) => adult.id !== parentA.id));
    if (!parentB) return state;

    const child: Character = {
      id: randomId(),
      name: randomOf(firstNames),
      age: 0,
      health: 90,
      happiness: 65,
      trait: Math.random() < 0.5 ? parentA.trait : parentB.trait,
      parents: [parentA.id, parentB.id],
      children: [],
      alive: true,
    };

    nextState = {
      ...nextState,
      descendantsCreated: nextState.descendantsCreated + 1,
      people: nextState.people.map((person) => {
        if (person.id === parentA.id || person.id === parentB.id) {
          return { ...person, children: [...person.children, child.id] };
        }
        return person;
      }),
    };

    nextState = { ...nextState, people: [...nextState.people, child] };
    nextState.history = [`${child.name} was born this year.`, ...nextState.history].slice(0, 8);
  }

  return nextState;
};

export const generatePetitions = (state: GameState): Petition[] => {
  const livingAdults = getLiving(state.people).filter((person) => person.age >= 14);
  if (livingAdults.length === 0) return [];

  const petitionCount = Math.min(livingAdults.length, 1 + Math.floor(Math.random() * 3));
  const petitionSet: Petition[] = [];
  const usedCharacterIds = new Set<string>();

  while (petitionSet.length < petitionCount) {
    const candidate = randomOf(livingAdults);
    if (usedCharacterIds.has(candidate.id)) continue;

    const template = randomOf(petitionTemplates);
    petitionSet.push({
      id: randomId(),
      characterId: candidate.id,
      title: template.title,
      description: template.description,
      choices: template.choices,
    });
    usedCharacterIds.add(candidate.id);
  }

  return petitionSet;
};

export const applyPetitionChoice = (
  state: GameState,
  petitionId: string,
  choiceId: string,
): GameState => {
  const petition = state.petitions.find((item) => item.id === petitionId);
  if (!petition) return state;

  const choice = petition.choices.find((item) => item.id === choiceId);
  if (!choice || state.influence < choice.influenceCost) return state;

  let nextState: GameState = {
    ...state,
    influence: state.influence - choice.influenceCost,
    petitions: state.petitions.filter((item) => item.id !== petitionId),
  };

  nextState = choice.effect(nextState, petition.characterId);
  return nextState;
};

export const advanceYear = (state: GameState): GameState => {
  if (state.gameOver) return state;

  let nextState = { ...state, year: state.year + 1, influence: Math.min(10, state.influence + 1), petitions: [] };
  nextState = agePeople(nextState);
  nextState = resolveBirths(nextState);
  nextState = resolveDeaths(nextState);

  const livingPeople = getLiving(nextState.people);
  nextState.gameOver = livingPeople.length === 0;
  nextState.petitions = nextState.gameOver ? [] : generatePetitions(nextState);

  return nextState;
};

export const saveGame = (state: GameState): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const loadGame = (): GameState | null => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as GameState;
  } catch {
    return null;
  }
};

export const resetGame = (): GameState => {
  const fresh = createInitialState();
  saveGame(fresh);
  return fresh;
};
