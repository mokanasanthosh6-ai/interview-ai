export function BrandLogo() {
  return (
    <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
      <svg
        width="34"
        height="34"
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        <defs>
          <linearGradient id="im-grad" x1="2" y1="2" x2="34" y2="34" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="55%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="32" height="32" rx="9" fill="#0B132B" stroke="url(#im-grad)" strokeWidth="1.75" />
        <path
          d="M11.5 14.5C11.5 12.8431 12.8431 11.5 14.5 11.5H21.5C23.1569 11.5 24.5 12.8431 24.5 14.5V19.5C24.5 21.1569 23.1569 22.5 21.5 22.5H17L13 25.5V22.2C12.0942 21.7445 11.5 20.7995 11.5 19.7V14.5Z"
          stroke="url(#im-grad)"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path d="M15.5 17H20.5" stroke="#22D3EE" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      <span className="font-display text-lg font-bold tracking-tight text-white">
        InterviewMate <span className="text-cyan-400">AI</span>
      </span>
    </div>
  );
}
