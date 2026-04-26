export type Trait = 'Brave' | 'Kind' | 'Ambitious' | 'Jealous' | 'Frail';
export type Gender = 'male' | 'female';

export interface Character {
  id: string;
  name: string;
  age: number;
  health: number;
  happiness: number;
  trait: Trait;
  gender: Gender;
  surname: string;
  spouseId: string | null;
  parents: string[];
  children: string[];
  alive: boolean;
  generation: number;
  fertility: number;
  familiarity: 0 | 1 | 2 | 3;
  lastSeenYear?: number;
  history?: string[];
}

export interface PetitionChoice {
  id: string;
  label: string;
  influenceCost: number;
  supportsCharacter?: boolean;
  effect: (state: GameState, characterId: string) => GameState;
}

export interface Petition {
  id: string;
  characterId: string;
  title: string;
  description: string;
  choices: PetitionChoice[];
}

export interface GameState {
  year: number;
  people: Character[];
  influence: number;
  wealth: number;
  reputation: number;
  descendantsCreated: number;
  petitions: Petition[];
  history: string[];
  gameOver: boolean;
}
