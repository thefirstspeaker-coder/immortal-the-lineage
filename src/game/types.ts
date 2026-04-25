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
}

export interface PetitionChoice {
  id: string;
  label: string;
  influenceCost: number;
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
