export type Trait = 'Brave' | 'Kind' | 'Ambitious' | 'Jealous' | 'Frail';

export interface Character {
  id: string;
  name: string;
  age: number;
  health: number;
  happiness: number;
  trait: Trait;
  parents: string[];
  children: string[];
  alive: boolean;
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
  descendantsCreated: number;
  petitions: Petition[];
  history: string[];
  gameOver: boolean;
}
