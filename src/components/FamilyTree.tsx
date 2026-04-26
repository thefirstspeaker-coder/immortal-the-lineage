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

  return (
    <section className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4">
      <h2 className="text-lg font-semibold text-slate-100">Family Tree</h2>
      <p className="mb-4 text-sm text-slate-300">Parents and children are connected with simple lines.</p>

      <div className="overflow-x-auto">
        <svg width={Math.max(600, people.length * 110)} height={300} className="rounded-xl bg-slate-950/60">
          {people.map((person, index) => {
            const x = 70 + index * 100;
            const y = person.parents.length === 0 ? 70 : 190;

            return (
              <g key={person.id}>
                {person.parents.map((parentId) => {
                  const parentIndex = people.findIndex((candidate) => candidate.id === parentId);
                  if (parentIndex < 0) return null;
                  const parentX = 70 + parentIndex * 100;
                  const parentY = 70;

                  return (
                    <line
                      key={`${parentId}-${person.id}`}
                      x1={parentX}
                      y1={parentY + 18}
                      x2={x}
                      y2={y - 18}
                      stroke="#64748b"
                      strokeWidth="2"
                    />
                  );
                })}

                <rect
                  x={x - 38}
                  y={y - 22}
                  width="76"
                  height="44"
                  rx="10"
                  fill={person.alive ? '#1e293b' : '#3f3f46'}
                  stroke={person.alive ? '#7dd3fc' : '#a1a1aa'}
                  className="cursor-pointer"
                  onClick={() => setSelectedPersonId(person.id)}
                />
                <text x={x} y={y - 4} textAnchor="middle" fill="#f8fafc" fontSize="11">
                  {person.name}
                </text>
                <text x={x} y={y + 11} textAnchor="middle" fill="#cbd5e1" fontSize="10">
                  {person.alive ? `Age ${person.age}` : 'Deceased'}
                </text>
              </g>
            );
          })}
        </svg>
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
