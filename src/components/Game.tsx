import { useEffect, useMemo, useState } from 'react';
import {
  advanceSimulationTick,
  applyPetitionChoice,
  createInitialState,
  loadGame,
  resetGame,
  saveGame,
} from '../game/logic';
import { GameState } from '../game/types';
import FamilyTree from './FamilyTree';
import PetitionCard from './PetitionCard';

const TICK_MS = 1200;
const DEBUG_STORAGE_KEY = 'immortal-lineage-debug-v1';

function Game() {
  const [state, setState] = useState<GameState>(() => loadGame() ?? createInitialState());
  const [userPaused, setUserPaused] = useState(false);
  const [debugMode, setDebugMode] = useState<boolean>(() => localStorage.getItem(DEBUG_STORAGE_KEY) === '1');

  useEffect(() => {
    saveGame(state);
  }, [state]);

  useEffect(() => {
    localStorage.setItem(DEBUG_STORAGE_KEY, debugMode ? '1' : '0');
  }, [debugMode]);

  const livingCount = useMemo(() => state.people.filter((person) => person.alive).length, [state.people]);
  const hasPendingPetitions = state.petitions.length > 0;
  const isRunning = !userPaused && !hasPendingPetitions && !state.gameOver;

  useEffect(() => {
    if (!isRunning) return;
    const timer = window.setInterval(() => {
      setState((current) => advanceSimulationTick(current, debugMode));
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, [debugMode, isRunning]);

  const handleChoice = (petitionId: string, choiceId: string) => {
    setState((current) => applyPetitionChoice(current, petitionId, choiceId));
  };

  const handleRestart = () => {
    setUserPaused(false);
    setState(resetGame());
  };

  if (state.gameOver) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center gap-6 px-4 py-8 text-center">
        <h1 className="text-4xl font-bold text-rose-300">Game Over</h1>
        <p className="text-slate-200">The lineage has ended in year {Math.floor(state.year)}.</p>
        <p className="text-slate-300">Years survived: {Math.floor(state.year) - 1200}</p>
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
        <p className="mt-1 text-sm text-slate-300">A slow real-time simulation of your family across generations.</p>

        <div className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          <div className="rounded-lg bg-slate-800 p-2">Clock: Year {Math.floor(state.year)}</div>
          <div className="rounded-lg bg-slate-800 p-2">Influence: {Math.floor(state.influence)}/10</div>
          <div className="rounded-lg bg-slate-800 p-2">Wealth: {Math.floor(state.wealth)}</div>
          <div className="rounded-lg bg-slate-800 p-2">Reputation: {Math.floor(state.reputation)}</div>
          <div className="rounded-lg bg-slate-800 p-2">Living: {livingCount}</div>
          <div className="rounded-lg bg-slate-800 p-2">Descendants: {state.descendantsCreated}</div>
          <div className="rounded-lg bg-slate-800 p-2">Status: {hasPendingPetitions ? 'Paused for petition' : isRunning ? 'Running' : 'Paused'}</div>
          <div className="rounded-lg bg-slate-800 p-2">Debug: {debugMode ? 'On' : 'Off'}</div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setUserPaused(false)}
            disabled={hasPendingPetitions}
            className="min-h-12 rounded-xl bg-emerald-500 px-4 py-3 text-base font-bold text-slate-950 disabled:opacity-40"
          >
            Play
          </button>
          <button
            type="button"
            onClick={() => setUserPaused(true)}
            className="min-h-12 rounded-xl bg-amber-400 px-4 py-3 text-base font-bold text-slate-950"
          >
            Pause
          </button>
          <button
            type="button"
            onClick={() => setDebugMode((current) => !current)}
            className="min-h-12 rounded-xl bg-indigo-400 px-4 py-3 text-base font-bold text-slate-950"
          >
            {debugMode ? 'Disable Debug' : 'Enable Debug'}
          </button>
        </div>
      </header>

      <section className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
        <h2 className="text-lg font-semibold text-slate-100">Petitions</h2>
        {state.petitions.length === 0 ? (
          <p className="mt-2 text-sm text-slate-300">No pending petitions. Time advances automatically while running.</p>
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

      <FamilyTree people={state.people} currentYear={Math.floor(state.year)} />

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
