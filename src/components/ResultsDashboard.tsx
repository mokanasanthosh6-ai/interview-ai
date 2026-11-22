import { useState } from 'react';
import {
  Award,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Compass,
  Copy,
  RotateCcw,
  Target,
} from 'lucide-react';
import type {
  FinalInterviewReport,
  QuestionSubmission,
  StudentProfile,
} from '../types/interview';

interface ResultsDashboardProps {
  profile: StudentProfile;
  submissions: QuestionSubmission[];
  report: FinalInterviewReport;
  onRestartInterview: () => void;
}

export function ResultsDashboard({
  profile,
  submissions,
  report,
  onRestartInterview,
}: ResultsDashboardProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const [copied, setCopied] = useState(false);

  const totalPercent = Math.round((report.totalScore / 50) * 100);

  const technicalSubs = submissions.filter((s) => s.question.category === 'Technical');
  const hrSubs = submissions.filter((s) => s.question.category === 'HR');

  const techAvg =
    technicalSubs.length > 0
      ? (
          technicalSubs.reduce((acc, s) => acc + s.evaluation.score, 0) /
          technicalSubs.length
        ).toFixed(1)
      : '—';
  const hrAvg =
    hrSubs.length > 0
      ? (
          hrSubs.reduce((acc, s) => acc + s.evaluation.score, 0) / hrSubs.length
        ).toFixed(1)
      : '—';

  const handleCopySummary = async () => {
    const summaryText = [
      `InterviewMate AI – Performance Report`,
      `Candidate: ${profile.studentName}`,
      `Role: ${profile.jobRole} (${profile.experienceLevel})`,
      `Total Score: ${report.totalScore} / 50`,
      `Average Score: ${report.averageScore} / 10`,
      `Readiness: ${report.readinessLevel}`,
      ``,
      `Summary: ${report.overallSummary}`,
      ``,
      `Question Scores:`,
      ...submissions.map(
        (s) =>
          `Q${s.question.id} (${s.question.category}): ${s.evaluation.score}/10 - ${s.question.topic}`,
      ),
      ``,
      `Strengths:`,
      ...report.overallStrengths.map((item) => `- ${item}`),
      ``,
      `Areas for Improvement:`,
      ...report.areasForImprovement.map((item) => `- ${item}`),
      ``,
      `Future Recommendations:`,
      ...report.futureRecommendations.map((item, i) => `${i + 1}. ${item}`),
    ].join('\n');

    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard unavailable in restricted context; ignore gracefully
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      {/* Top Report Header */}
      <header className="flex flex-col gap-6 border-b border-white/10 pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-cyan-400">
            <span>Final Interview Performance Report</span>
            <span className="text-slate-600" aria-hidden="true">
              ·
            </span>
            <span className="text-slate-300">{report.readinessLevel}</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
            {profile.studentName}
          </h1>
          <p className="mt-1.5 text-sm text-slate-300">
            {profile.jobRole} · {profile.experienceLevel} Track
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleCopySummary}
            className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-white/12 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 whitespace-nowrap"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-400" />
                <span>Copied Report</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Copy Summary</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onRestartInterview}
            className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 whitespace-nowrap"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Restart Interview</span>
          </button>
        </div>
      </header>

      {/* Primary KPI Score Cards */}
      <section aria-label="Score Overview" className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
        {/* Total Score */}
        <div className="rounded-2xl border border-white/12 bg-[#0B1328]/85 p-6 backdrop-blur-md">
          <p className="text-xs font-medium text-slate-400">Total Interview Score</p>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="font-mono text-4xl font-bold text-white tabular-nums">
              {report.totalScore}
              <span className="text-lg font-normal text-slate-400"> / 50</span>
            </span>
            <span className="font-mono text-sm font-semibold text-cyan-400 tabular-nums">
              {totalPercent}%
            </span>
          </div>
          <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-violet-500 transition-all duration-500"
              style={{ width: `${totalPercent}%` }}
            />
          </div>
        </div>

        {/* Average Score */}
        <div className="rounded-2xl border border-white/12 bg-[#0B1328]/85 p-6 backdrop-blur-md">
          <p className="text-xs font-medium text-slate-400">Average Question Score</p>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="font-mono text-4xl font-bold text-white tabular-nums">
              {report.averageScore}
              <span className="text-lg font-normal text-slate-400"> / 10</span>
            </span>
            <span className="text-xs font-medium text-slate-300">Across 5 questions</span>
          </div>
          <div className="mt-4 flex items-center gap-4 text-xs text-slate-300">
            <span>
              Technical Avg:{' '}
              <strong className="font-mono text-cyan-300 tabular-nums">{techAvg}/10</strong>
            </span>
            <span className="text-slate-600" aria-hidden="true">
              ·
            </span>
            <span>
              HR Avg:{' '}
              <strong className="font-mono text-violet-300 tabular-nums">{hrAvg}/10</strong>
            </span>
          </div>
        </div>

        {/* Readiness Classification & Summary */}
        <div className="rounded-2xl border border-white/12 bg-[#0B1328]/85 p-6 backdrop-blur-md">
          <p className="text-xs font-medium text-slate-400">Readiness Assessment</p>
          <p className="mt-3 flex items-center gap-2 text-xl font-bold text-white">
            <Award className="h-5 w-5 shrink-0 text-cyan-400" />
            <span>{report.readinessLevel}</span>
          </p>
          <p className="mt-2.5 text-xs leading-relaxed text-slate-300">
            {report.overallSummary}
          </p>
        </div>
      </section>

      {/* Individual Question Score Strip */}
      <section
        aria-label="Question Scores Summary"
        className="mt-8 rounded-2xl border border-white/12 bg-[#0B1328]/85 p-6 backdrop-blur-md"
      >
        <h2 className="text-base font-semibold text-white">Score Distribution by Question</h2>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-5">
          {submissions.map((sub) => {
            const pct = sub.evaluation.score * 10;
            return (
              <div
                key={sub.question.id}
                className="flex flex-col justify-between rounded-xl border border-white/8 bg-[#060B18]/75 p-4"
              >
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-semibold text-slate-300 tabular-nums">
                      Q{sub.question.id}
                    </span>
                    <span
                      className={
                        sub.question.category === 'Technical'
                          ? 'text-blue-300'
                          : 'text-violet-300'
                      }
                    >
                      {sub.question.category}
                    </span>
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-xs text-slate-400">
                    {sub.question.topic}
                  </p>
                </div>

                <div className="mt-4">
                  <div className="flex items-baseline justify-between">
                    <span className="font-mono text-xl font-bold text-white tabular-nums">
                      {sub.evaluation.score}
                      <span className="text-xs font-normal text-slate-500">/10</span>
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={`h-full rounded-full ${
                        sub.evaluation.score >= 7
                          ? 'bg-emerald-400'
                          : sub.evaluation.score >= 5
                            ? 'bg-cyan-400'
                            : 'bg-amber-400'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Coaching Insights Grid */}
      <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Overall Strengths */}
        <div className="rounded-2xl border border-white/12 bg-[#0B1328]/85 p-6 backdrop-blur-md">
          <h2 className="flex items-center gap-2 text-base font-semibold text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>Overall Strengths</span>
          </h2>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-slate-300">
            {report.overallStrengths.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Areas for Improvement */}
        <div className="rounded-2xl border border-white/12 bg-[#0B1328]/85 p-6 backdrop-blur-md">
          <h2 className="flex items-center gap-2 text-base font-semibold text-amber-300">
            <Target className="h-4 w-4 shrink-0 text-amber-400" />
            <span>Areas Needing Improvement</span>
          </h2>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-slate-300">
            {report.areasForImprovement.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Personalized Recommendations */}
        <div className="rounded-2xl border border-white/12 bg-[#0B1328]/85 p-6 backdrop-blur-md">
          <h2 className="flex items-center gap-2 text-base font-semibold text-cyan-300">
            <Compass className="h-4 w-4 shrink-0 text-cyan-400" />
            <span>Future Recommendations</span>
          </h2>
          <ol className="mt-4 space-y-3 text-sm leading-relaxed text-slate-300">
            {report.futureRecommendations.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="font-mono text-xs font-semibold text-cyan-400 tabular-nums mt-0.5">
                  {idx + 1}.
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Detailed Per-Question Feedback Accordion */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-white">Question-by-Question Review</h2>
        <p className="mt-1 text-sm text-slate-400">
          Expand any question below to revisit your submitted answer, scoring rationale, and model
          response.
        </p>

        <div className="mt-4 space-y-3">
          {submissions.map((sub, idx) => {
            const isOpen = expandedIndex === idx;
            return (
              <article
                key={sub.question.id}
                className="overflow-hidden rounded-2xl border border-white/12 bg-[#0B1328]/85 backdrop-blur-md"
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setExpandedIndex(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition-colors hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-400"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <span className="font-mono font-semibold text-cyan-400 tabular-nums">
                        Question {sub.question.id}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{sub.question.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{sub.question.topic}</span>
                    </div>
                    <p className="mt-1 truncate text-sm font-semibold text-white sm:text-base">
                      {sub.question.question}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-4">
                    <span className="font-mono text-sm font-bold text-white tabular-nums">
                      {sub.evaluation.score} / 10
                    </span>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {isOpen && (
                  <div className="space-y-5 border-t border-white/10 px-6 py-5 text-sm">
                    <div>
                      <p className="text-xs font-semibold text-slate-400">Full Question</p>
                      <p className="mt-1.5 text-slate-100">{sub.question.question}</p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-slate-400">Your Submitted Answer</p>
                      <p className="mt-1.5 rounded-xl border border-white/8 bg-[#060B18]/80 p-3.5 text-slate-200 whitespace-pre-line">
                        {sub.answer}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-slate-400">Scoring Rationale</p>
                      <p className="mt-1.5 text-slate-300">{sub.evaluation.scoreReasoning}</p>
                    </div>

                    <div className="grid grid-cols-1 gap-5 border-t border-white/8 pt-4 md:grid-cols-2">
                      <div>
                        <p className="text-xs font-semibold text-emerald-300">What Went Well</p>
                        <ul className="mt-2 space-y-1.5 text-slate-300">
                          {sub.evaluation.didWell.map((item, i) => (
                            <li key={i}>• {item}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-amber-300">
                          Missing Points &amp; Improvements
                        </p>
                        <ul className="mt-2 space-y-1.5 text-slate-300">
                          {sub.evaluation.missingPoints.map((item, i) => (
                            <li key={i}>• {item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="border-t border-white/8 pt-4">
                      <p className="text-xs font-semibold text-violet-300">
                        Sample Improved Answer
                      </p>
                      <p className="mt-1.5 rounded-xl border border-white/8 bg-[#060B18]/80 p-3.5 text-slate-200 whitespace-pre-line">
                        {sub.evaluation.sampleImprovedAnswer}
                      </p>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
