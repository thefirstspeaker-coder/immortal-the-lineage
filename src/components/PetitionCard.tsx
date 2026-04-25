import { Petition } from '../game/types';

interface PetitionCardProps {
  petition: Petition;
  characterName: string;
  currentInfluence: number;
  onChoose: (petitionId: string, choiceId: string) => void;
}

function PetitionCard({ petition, characterName, currentInfluence, onChoose }: PetitionCardProps) {
  return (
    <article className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4 shadow-lg">
      <p className="text-xs uppercase tracking-wide text-sky-300">Petition from {characterName}</p>
      <h3 className="mt-2 text-lg font-semibold text-slate-100">{petition.title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-300">{petition.description}</p>

      <div className="mt-4 grid gap-2">
        {petition.choices.map((choice) => {
          const disabled = currentInfluence < choice.influenceCost;
          return (
            <button
              key={choice.id}
              type="button"
              disabled={disabled}
              onClick={() => onChoose(petition.id, choice.id)}
              className="min-h-12 rounded-xl border border-slate-600 bg-slate-800 px-3 py-2 text-left text-sm font-medium text-slate-100 transition hover:border-sky-400 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {choice.label}
              <span className="ml-2 text-xs text-sky-300">
                {choice.influenceCost > 0 ? `-${choice.influenceCost} influence` : 'No influence cost'}
              </span>
            </button>
          );
        })}
      </div>
    </article>
  );
}

export default PetitionCard;
