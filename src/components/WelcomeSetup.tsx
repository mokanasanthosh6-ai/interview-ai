import { useState, type FormEvent } from 'react';
import { ArrowRight, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import type { ExperienceLevel, StudentProfile } from '../types/interview';

const PRESET_ROLES = [
  'Python Developer',
  'Java Developer',
  'Web Developer',
  'Data Analyst',
  'AI Engineer',
  'Full-Stack Developer',
  'Cloud / DevOps Engineer',
  'Custom Role',
] as const;

interface WelcomeSetupProps {
  initialProfile: StudentProfile;
  isLoading: boolean;
  apiError: string | null;
  onStartInterview: (profile: StudentProfile) => void;
}

export function WelcomeSetup({
  initialProfile,
  isLoading,
  apiError,
  onStartInterview,
}: WelcomeSetupProps) {
  const isPreset = PRESET_ROLES.includes(
    initialProfile.jobRole as (typeof PRESET_ROLES)[number],
  );

  const [studentName, setStudentName] = useState(initialProfile.studentName);
  const [selectedRoleOption, setSelectedRoleOption] = useState<string>(
    initialProfile.jobRole && !isPreset ? 'Custom Role' : initialProfile.jobRole || 'Python Developer',
  );
  const [customRole, setCustomRole] = useState(
    initialProfile.jobRole && !isPreset ? initialProfile.jobRole : '',
  );
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(
    initialProfile.experienceLevel || 'Fresher',
  );

  const [validationErrors, setValidationErrors] = useState<{
    studentName?: string;
    jobRole?: string;
  }>({});

  const effectiveJobRole =
    selectedRoleOption === 'Custom Role' ? customRole.trim() : selectedRoleOption;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors: { studentName?: string; jobRole?: string } = {};

    const trimmedName = studentName.trim();
    if (trimmedName.length < 2) {
      errors.studentName = 'Please enter your full name (at least 2 characters).';
    } else if (trimmedName.length > 80) {
      errors.studentName = 'Student name must be 80 characters or fewer.';
    }

    if (!effectiveJobRole || effectiveJobRole.length < 2) {
      errors.jobRole = 'Please select a job role or enter a custom role title.';
    } else if (effectiveJobRole.length > 80) {
      errors.jobRole = 'Job role must be 80 characters or fewer.';
    }

    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    onStartInterview({
      studentName: trimmedName,
      jobRole: effectiveJobRole,
      experienceLevel,
    });
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-14">
      <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12 lg:gap-12">
        {/* Left Editorial Introduction */}
        <section className="lg:col-span-6 lg:pt-4">
          <p className="text-sm font-medium tracking-wide text-cyan-400">
            Personal AI Interview Coach
          </p>
          <h1 className="mt-3 max-w-xl text-3xl font-bold tracking-tight text-white [text-wrap:balance] sm:text-4xl lg:text-5xl lg:leading-[1.12]">
            Practice realistic technical and HR interviews with instant rubric feedback.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-300">
            InterviewMate AI generates five role-specific questions calibrated to your experience
            level, evaluates every response for accuracy and clarity, and builds a personalized
            readiness report to guide your next interview.
          </p>

          <div className="mt-10 border-t border-white/10 pt-8">
            <h2 className="text-sm font-semibold text-slate-200">
              How your 5-question session works
            </h2>
            <ol className="mt-5 space-y-5">
              <li className="flex items-start gap-4">
                <span className="font-mono text-sm font-semibold text-cyan-400 tabular-nums">
                  01
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">
                    Tailored Technical &amp; HR Question Set
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-400">
                    Gemini generates three technical and two HR questions matched to your selected
                    role and experience tier.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <span className="font-mono text-sm font-semibold text-blue-400 tabular-nums">
                  02
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">
                    Per-Answer Scoring &amp; Model Response
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-400">
                    Receive a score out of 10 with explicit reasoning, strengths, missing points,
                    actionable tips, and a realistic improved answer after every question.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <span className="font-mono text-sm font-semibold text-violet-400 tabular-nums">
                  03
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">
                    Final Performance Report
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-400">
                    Review your total score out of 50, average rating, competency breakdown, and a
                    custom study roadmap for future interviews.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </section>

        {/* Right Setup Form Card */}
        <section className="lg:col-span-6">
          <div className="rounded-2xl border border-white/12 bg-[#0B1328]/85 p-6 shadow-2xl shadow-blue-950/30 backdrop-blur-md sm:p-8">
            <div className="border-b border-white/10 pb-5">
              <h2 className="text-xl font-semibold text-white">Configure Your Mock Interview</h2>
              <p className="mt-1 text-sm text-slate-400">
                Complete your candidate details to generate a customized 5-question session.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-6">
              {/* Student Name */}
              <div>
                <label
                  htmlFor="student-name"
                  className="block text-sm font-medium text-slate-200"
                >
                  Student Name <span className="text-cyan-400">*</span>
                </label>
                <input
                  id="student-name"
                  type="text"
                  value={studentName}
                  onChange={(e) => {
                    setStudentName(e.target.value);
                    if (validationErrors.studentName) {
                      setValidationErrors((prev) => ({ ...prev, studentName: undefined }));
                    }
                  }}
                  placeholder="e.g., Aarav Sharma"
                  disabled={isLoading}
                  aria-invalid={Boolean(validationErrors.studentName)}
                  className="mt-2 w-full rounded-xl border border-white/12 bg-[#060B18]/90 px-4 py-3 text-sm text-white placeholder-slate-500 transition-colors focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 disabled:opacity-60"
                />
                {validationErrors.studentName && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-rose-400" role="alert">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{validationErrors.studentName}</span>
                  </p>
                )}
              </div>

              {/* Job Role */}
              <div>
                <label
                  htmlFor="job-role"
                  className="block text-sm font-medium text-slate-200"
                >
                  Target Job Role <span className="text-cyan-400">*</span>
                </label>
                <select
                  id="job-role"
                  value={selectedRoleOption}
                  onChange={(e) => {
                    setSelectedRoleOption(e.target.value);
                    if (validationErrors.jobRole) {
                      setValidationErrors((prev) => ({ ...prev, jobRole: undefined }));
                    }
                  }}
                  disabled={isLoading}
                  className="mt-2 w-full rounded-xl border border-white/12 bg-[#060B18]/90 px-4 py-3 text-sm text-white transition-colors focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 disabled:opacity-60"
                >
                  {PRESET_ROLES.map((role) => (
                    <option key={role} value={role} className="bg-[#0B1328] text-white">
                      {role}
                    </option>
                  ))}
                </select>

                {selectedRoleOption === 'Custom Role' && (
                  <input
                    id="custom-job-role"
                    type="text"
                    value={customRole}
                    onChange={(e) => {
                      setCustomRole(e.target.value);
                      if (validationErrors.jobRole) {
                        setValidationErrors((prev) => ({ ...prev, jobRole: undefined }));
                      }
                    }}
                    placeholder="Enter target role (e.g., Backend Engineer, Machine Learning Intern)"
                    disabled={isLoading}
                    aria-label="Custom Job Role"
                    className="mt-3 w-full rounded-xl border border-white/12 bg-[#060B18]/90 px-4 py-3 text-sm text-white placeholder-slate-500 transition-colors focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 disabled:opacity-60"
                  />
                )}

                {validationErrors.jobRole && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-rose-400" role="alert">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{validationErrors.jobRole}</span>
                  </p>
                )}
              </div>

              {/* Experience Level */}
              <div>
                <span className="block text-sm font-medium text-slate-200">
                  Experience Level <span className="text-cyan-400">*</span>
                </span>
                <div
                  role="radiogroup"
                  aria-label="Experience Level"
                  className="mt-2 grid grid-cols-2 gap-3"
                >
                  {(['Fresher', 'Experienced'] as const).map((level) => {
                    const isSelected = experienceLevel === level;
                    return (
                      <button
                        key={level}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        disabled={isLoading}
                        onClick={() => setExperienceLevel(level)}
                        className={`flex min-h-[44px] flex-col items-start rounded-xl border px-4 py-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                          isSelected
                            ? 'border-cyan-400/70 bg-blue-600/20 text-white shadow-sm shadow-cyan-500/10'
                            : 'border-white/10 bg-[#060B18]/70 text-slate-300 hover:border-white/25 hover:text-white'
                        } disabled:opacity-60`}
                      >
                        <span className="flex w-full items-center justify-between text-sm font-semibold">
                          <span>{level}</span>
                          {isSelected && (
                            <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0" />
                          )}
                        </span>
                        <span className="mt-1 text-xs text-slate-400">
                          {level === 'Fresher'
                            ? 'Core fundamentals & campus projects'
                            : 'System design, trade-offs & ownership'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* API Error Banner */}
              {apiError && (
                <div
                  role="alert"
                  className="flex items-start gap-3 rounded-xl border border-rose-500/40 bg-rose-950/40 p-4 text-sm text-rose-200"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                  <div>
                    <p className="font-semibold text-rose-100">Could not start interview</p>
                    <p className="mt-1 text-xs leading-relaxed text-rose-200/90">{apiError}</p>
                  </div>
                </div>
              )}

              {/* Start Interview Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="flex min-h-[48px] w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:cursor-not-allowed disabled:opacity-70 whitespace-nowrap"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Generating 5 tailored questions...</span>
                  </>
                ) : (
                  <>
                    <span>Start Interview</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
