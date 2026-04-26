import { useEffect, useMemo, useState } from 'react';
import {
  advanceYear,
  applyPetitionChoice,
  createInitialState,
  loadGame,
  resetGame,
  saveGame,
} from '../game/logic';
import { GameState } from '../game/types';
import FamilyTree from './FamilyTree';
import PetitionCard from './PetitionCard';

function Game() {
  const [state, setState] = useState<GameState>(() => {
    const loadedState = loadGame();
    if (loadedState) {
      console.log('[game] Loaded saved game', {
        year: loadedState.year,
        people: loadedState.people.length,
        petitions: loadedState.petitions.length,
      });
      return loadedState;
    }

    const initialState = createInitialState();
    console.log('[game] Created initial game state', {
      year: initialState.year,
      people: initialState.people.length,
      petitions: initialState.petitions.length,
    });
    return initialState;
  });

  useEffect(() => {
    console.log('[game] Component mounted');
    return () => {
      console.log('[game] Component unmounted');
    };
  }, []);

  useEffect(() => {
    saveGame(state);
    console.log('[game] Saved state', {
      year: state.year,
      influence: state.influence,
      livingPeople: state.people.filter((person) => person.alive).length,
      petitions: state.petitions.length,
      gameOver: state.gameOver,
    });
  }, [state]);

  const livingCount = useMemo(() => state.people.filter((person) => person.alive).length, [state.people]);

  const handleNextYear = () => {
    console.log('[game] Next Year clicked', { currentYear: state.year });
    setState((current) => advanceYear(current));
  };

  const handleChoice = (petitionId: string, choiceId: string) => {
    console.log('[game] Petition choice selected', {
      petitionId,
      choiceId,
      currentYear: state.year,
    });
    setState((current) => applyPetitionChoice(current, petitionId, choiceId));
  };

  const handleRestart = () => {
    console.log('[game] Restart requested');
    setState(resetGame());
  };

  if (state.gameOver) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-6 px-4 py-8 text-center">
        <h1 className="text-4xl font-bold text-rose-300">Game Over</h1>
        <p className="text-slate-200">The lineage has ended in year {state.year}.</p>
        <p className="text-slate-300">Years survived: {state.year - 1200}</p>
        <p className="text-slate-300">Total descendants created: {state.descendantsCreated}</p>
        <button
          type="button"
          onClick={handleRestart}
          className="min-h-12 rounded-xl bg-sky-500 px-6 py-3 font-semibold text-slate-950"
        >
          Start New Lineage
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-4 px-3 py-4 sm:px-6 sm:py-6">
      <header className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
        <h1 className="text-2xl font-bold text-sky-300">Immortal: The Lineage</h1>
        <p className="mt-1 text-sm text-slate-300">Guide your family for as many generations as you can.</p>

        <div className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          <div className="rounded-lg bg-slate-800 p-2">Year: {state.year}</div>
          <div className="rounded-lg bg-slate-800 p-2">Influence: {state.influence}/10</div>
          <div className="rounded-lg bg-slate-800 p-2">Living: {livingCount}</div>
          <div className="rounded-lg bg-slate-800 p-2">Descendants: {state.descendantsCreated}</div>
        </div>

        <button
          type="button"
          onClick={handleNextYear}
          className="mt-4 min-h-12 w-full rounded-xl bg-sky-500 px-4 py-3 text-base font-bold text-slate-950"
        >
          Next Year
        </button>
      </header>

      <section className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
        <h2 className="text-lg font-semibold text-slate-100">Petitions</h2>
        {state.petitions.length === 0 ? (
          <p className="mt-2 text-sm text-slate-300">No one asked for aid this year. Tap “Next Year” to continue.</p>
        ) : (
          <div className="mt-3 grid gap-3">
            {state.petitions.map((petition) => {
              const person = state.people.find((candidate) => candidate.id === petition.characterId);
              return (
                <PetitionCard
                  key={petition.id}
                  petition={petition}
                  characterName={person?.name ?? 'Unknown'}
                  currentInfluence={state.influence}
                  onChoose={handleChoice}
                />
              );
            })}
          </div>
        )}
      </section>

      <FamilyTree people={state.people} currentYear={state.year} />

      <section className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4">
        <h2 className="text-lg font-semibold text-slate-100">Recent Chronicle</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
          {state.history.map((entry, index) => (
            <li key={`${entry}-${index}`}>{entry}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}

export default Game;
