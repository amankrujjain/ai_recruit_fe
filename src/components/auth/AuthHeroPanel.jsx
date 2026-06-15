export function AuthHeroPanel() {
  return (
    <div className="relative hidden overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-accent-500 p-10 text-white lg:flex lg:flex-col lg:justify-between">
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-accent-500/30 blur-2xl" />
      <div className="relative z-10">
        <p className="text-sm font-medium uppercase tracking-widest text-brand-100">AI Recruitment</p>
        <h1 className="mt-4 text-4xl font-bold leading-tight">
          Hire smarter with AI-powered screening calls
        </h1>
        <p className="mt-4 max-w-md text-brand-100">
          Rank thousands of candidates, automate outreach, and get recruiter-ready scorecards in minutes.
        </p>
      </div>
      <div className="relative z-10 grid grid-cols-3 gap-4 text-center">
        {['10x', '87%', '30s'].map((stat, i) => (
          <div key={stat} className="rounded-xl bg-white/10 p-4 backdrop-blur">
            <p className="text-2xl font-bold">{stat}</p>
            <p className="text-xs text-brand-100">{['Faster screening', 'Match accuracy', 'Scorecard read'][i]}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
