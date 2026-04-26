import { Character } from '../game/types';

interface PersonProfileProps {
  character: Character;
  people: Character[];
  currentYear: number;
  onClose: () => void;
}

export const getApproxAge = (age: number): string => {
  const rounded = Math.max(0, Math.round(age / 5) * 5);
  return `about ${rounded}`;
};

export const getHealthLabel = (health: number): string => {
  if (health >= 75) return 'Strong';
  if (health >= 50) return 'Fair';
  if (health >= 25) return 'Worrying';
  return 'Frail';
};

export const getHappinessLabel = (happiness: number): string => {
  if (happiness >= 75) return 'Content';
  if (happiness >= 50) return 'Restless';
  if (happiness >= 25) return 'Troubled';
  return 'Unhappy';
};

export const getRelationshipSummary = (character: Character, people: Character[]): string => {
  const parentNames = character.parents
    .map((parentId) => people.find((person) => person.id === parentId)?.name)
    .filter(Boolean);
  const childNames = character.children
    .map((childId) => people.find((person) => person.id === childId)?.name)
    .filter(Boolean);

  const parentText = parentNames.length > 0 ? `Parents: ${parentNames.join(', ')}` : 'Parents: Unknown';
  const childText = childNames.length > 0 ? `Children: ${childNames.join(', ')}` : 'Children: None known';

  return `${parentText}. ${childText}.`;
};

const getBasicRelationship = (character: Character): string => {
  if (character.parents.length > 0 && character.children.length > 0) return 'A link between generations';
  if (character.parents.length > 0) return 'A younger branch of the family';
  if (character.children.length > 0) return 'An elder branch of the family';
  return 'A distant root of the household';
};

const getCurrentNotes = (character: Character): string[] => {
  const notes: string[] = [];
  if (character.health < 30) notes.push('At serious health risk this year.');
  if (character.happiness < 30) notes.push('Deeply unhappy and may struggle.');
  if (character.trait === 'Ambitious') notes.push('Likely to chase bold ambitions.');
  if (character.trait === 'Jealous') notes.push('May stir rivalry in the household.');
  if (character.trait === 'Brave') notes.push('Often drawn toward risky choices.');

  return notes.length > 0 ? notes : ['No urgent risks are known right now.'];
};

function PersonProfile({ character, people, currentYear, onClose }: PersonProfileProps) {
  const familiarity = character.familiarity ?? 1;
  const isUnknown = familiarity === 0;
  const showCore = familiarity >= 1;
  const showWatched = familiarity >= 2;
  const showFavoured = familiarity >= 3;

  const introText = isUnknown
    ? 'You know little of this person. Their life has continued beyond your close attention.'
    : familiarity === 2
      ? 'You have watched parts of their life and know the shape of their struggles.'
      : familiarity === 3
        ? 'This person is favoured by the immortal. Their hopes, wounds and history are clear to you.'
        : 'You know this family member well enough to follow their story.';

  const recentHistory = (character.history ?? []).slice(0, 3);
  const fullHistory = character.history ?? [];

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-950/70 p-3 sm:items-center">
      <section className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-4 text-sm text-slate-200 sm:p-5">
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-sky-200">{isUnknown ? 'Unknown Relative' : character.name}</h3>
            <p className="mt-1 text-slate-300">{introText}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-semibold text-slate-100"
          >
            Close
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-slate-800 p-2">Age: {showCore ? character.age : getApproxAge(character.age)}</div>
          <div className="rounded-lg bg-slate-800 p-2">Status: {character.alive ? 'Alive' : 'Deceased'}</div>
          <div className="rounded-lg bg-slate-800 p-2">Trait: {showCore ? character.trait : 'Hidden from your view'}</div>
          <div className="rounded-lg bg-slate-800 p-2">
            Last seen: {character.lastSeenYear ? `${currentYear - character.lastSeenYear} years ago` : 'Not well known'}
          </div>
        </div>

        <div className="mt-3 rounded-lg bg-slate-800 p-3">
          <p>
            {showCore
              ? getRelationshipSummary(character, people)
              : `Relationship: ${getBasicRelationship(character)}.`}
          </p>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="rounded-lg bg-slate-800 p-2">
            Health: {showFavoured ? character.health : showWatched ? getHealthLabel(character.health) : 'Unknown'}
          </div>
          <div className="rounded-lg bg-slate-800 p-2">
            Happiness:{' '}
            {showFavoured ? character.happiness : showWatched ? getHappinessLabel(character.happiness) : 'Not well known'}
          </div>
        </div>

        <div className="mt-3 rounded-lg bg-slate-800 p-3">
          <p className="font-semibold text-slate-100">Life Chronicle</p>
          {!showWatched ? (
            <p className="mt-1 text-slate-300">Hidden from your view.</p>
          ) : showFavoured ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-300">
              {fullHistory.length > 0 ? fullHistory.map((entry, index) => <li key={`${entry}-${index}`}>{entry}</li>) : <li>No stories recorded yet.</li>}
            </ul>
          ) : (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-300">
              {recentHistory.length > 0 ? recentHistory.map((entry, index) => <li key={`${entry}-${index}`}>{entry}</li>) : <li>No recent tales yet.</li>}
            </ul>
          )}
        </div>

        {showFavoured ? (
          <div className="mt-3 rounded-lg bg-slate-800 p-3">
            <p className="font-semibold text-slate-100">Current Notes</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-300">
              {getCurrentNotes(character).map((note, index) => (
                <li key={`${note}-${index}`}>{note}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
    </div>
  );
}

export default PersonProfile;
