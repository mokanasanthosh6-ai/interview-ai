import { CheckCircle2, AlertTriangle, Lightbulb, Sparkles } from 'lucide-react';
import type { AnswerEvaluation } from '../types/interview';

interface EvaluationPanelProps {
  evaluation: AnswerEvaluation;
}

function getScoreDescriptor(score: number): { label: string; colorClass: string; barClass: string } {
  if (score >= 8) {
    return {
      label: 'Strong Response',
      colorClass: 'text-emerald-400',
      barClass: 'bg-gradient-to-r from-emerald-500 to-cyan-400',
    };
  }
  if (score >= 5) {
    return {
      label: 'Solid Foundation',
      colorClass: 'text-cyan-400',
      barClass: 'bg-gradient-to-r from-blue-500 to-cyan-400',
    };
  }
  if (score >= 3) {
    return {
      label: 'Needs More Depth',
      colorClass: 'text-amber-400',
      barClass: 'bg-gradient-to-r from-amber-500 to-orange-400',
    };
  }
  return {
    label: 'Off-Target / Incomplete',
    colorClass: 'text-rose-400',
    barClass: 'bg-gradient-to-r from-rose-500 to-amber-500',
  };
}

export function EvaluationPanel({ evaluation }: EvaluationPanelProps) {
  const descriptor = getScoreDescriptor(evaluation.score);
  const progressPercent = Math.max(0, Math.min(100, evaluation.score * 10));

  return (
    <section
      aria-label="AI Answer Evaluation"
      className="rounded-2xl border border-white/12 bg-[#0B1328]/85 p-6 backdrop-blur-md sm:p-8"
    >
      {/* Score & Reasoning Header */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium tracking-wide text-cyan-400">
            AI Evaluation Feedback
          </p>
          <div className="mt-1 flex items-baseline gap-3">
            <span className="font-mono text-3xl font-bold text-white tabular-nums sm:text-4xl">
              {evaluation.score}
              <span className="text-lg font-normal text-slate-400"> / 10</span>
            </span>
            <span className={`text-sm font-semibold ${descriptor.colorClass}`}>
              {descriptor.label}
            </span>
          </div>
        </div>

        <div className="w-full sm:w-56">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Answer Score</span>
            <span className="font-mono tabular-nums text-slate-200">{progressPercent}%</span>
          </div>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-800/90">
            <div
              className={`h-full rounded-full transition-all duration-500 ${descriptor.barClass}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Why this score was given */}
      <div className="mt-5 border-t border-white/10 pt-5">
        <h3 className="text-xs font-semibold tracking-wide text-slate-400">
          Scoring Rationale
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-200">
          {evaluation.scoreReasoning}
        </p>
      </div>

      {/* Structured Breakdown */}
      <div className="mt-6 grid grid-cols-1 gap-6 border-t border-white/10 pt-6 md:grid-cols-3">
        <div>
          <h4 className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>What You Did Well</span>
          </h4>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-300">
            {evaluation.didWell.map((point, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-emerald-400" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="flex items-center gap-2 text-sm font-semibold text-amber-300">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
            <span>Missing Important Points</span>
          </h4>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-300">
            {evaluation.missingPoints.map((point, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-amber-400" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="flex items-center gap-2 text-sm font-semibold text-cyan-300">
            <Lightbulb className="h-4 w-4 shrink-0 text-cyan-400" />
            <span>Suggestions for Improvement</span>
          </h4>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-300">
            {evaluation.suggestions.map((point, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-cyan-400" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Sample Improved Answer */}
      <div className="mt-6 border-t border-white/10 pt-6">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-violet-300">
          <Sparkles className="h-4 w-4 shrink-0 text-violet-400" />
          <span>Sample Improved Answer</span>
        </h4>
        <div className="mt-3 rounded-xl border border-white/8 bg-[#060B18]/80 p-4 text-sm leading-relaxed text-slate-200 whitespace-pre-line">
          {evaluation.sampleImprovedAnswer}
        </div>
      </div>
    </section>
  );
}
