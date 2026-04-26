import { useMemo, useState } from 'react';
import { Character } from '../game/types';
import PersonProfile from './PersonProfile';

interface FamilyTreeProps {
  people: Character[];
  currentYear: number;
}

function FamilyTree({ people, currentYear }: FamilyTreeProps) {
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);

  const selectedPerson = useMemo(
    () => people.find((person) => person.id === selectedPersonId) ?? null,
    [people, selectedPersonId],
  );

  const generations = useMemo(() => {
    const map = new Map<number, Character[]>();
    for (const person of people) {
      const list = map.get(person.generation) ?? [];
      list.push(person);
      map.set(person.generation, list);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [people]);

  return (
    <section className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4">
      <h2 className="text-lg font-semibold text-slate-100">Family Tree</h2>
      <p className="mb-4 text-sm text-slate-300">Generations, spouses, and descendants update live.</p>

      <div className="space-y-4">
        {generations.map(([generation, members]) => (
          <div key={generation} className="rounded-xl bg-slate-950/50 p-3">
            <p className="mb-2 text-xs uppercase tracking-wide text-sky-300">Generation {generation}</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {members.map((person) => {
                const spouse = person.spouseId ? people.find((p) => p.id === person.spouseId) : null;
                return (
                  <button
                    key={person.id}
                    type="button"
                    onClick={() => setSelectedPersonId(person.id)}
                    className={`rounded-lg border p-3 text-left ${person.alive ? 'border-sky-700 bg-slate-800' : 'border-slate-600 bg-slate-800/40'}`}
                  >
                    <p className="font-semibold text-slate-100">{person.name}</p>
                    <p className="text-xs text-slate-300">
                      {person.alive ? `Age ${Math.floor(person.age)} • ${person.health.toFixed(0)} health` : 'Deceased'}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">Spouse: {spouse ? spouse.name : 'None'}</p>
                    <p className="text-xs text-slate-400">Children: {person.children.length}</p>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {selectedPerson ? (
        <PersonProfile
          character={selectedPerson}
          people={people}
          currentYear={currentYear}
          onClose={() => setSelectedPersonId(null)}
        />
      ) : null}
    </section>
  );
}

export default FamilyTree;
