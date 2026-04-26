import { Link } from "react-router-dom";
import { HiOutlineUserCircle } from "react-icons/hi2";

function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-900 font-sans">
      {/* Header */}
      <header className="absolute inset-x-0 top-0 z-50 flex items-center justify-between p-6 md:px-12">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 text-white font-bold text-lg">
            S
          </div>
          <span className="text-lg font-bold tracking-tight text-white">Smart Campus Hub</span>
        </div>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/20"
        >
          <HiOutlineUserCircle className="h-5 w-5" />
          Login
        </Link>
      </header>

      {/* Main Content (Hero Section) */}
      <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 text-center">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/campus-login-bg.png"
            alt="Campus"
            className="h-full w-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-slate-900/40"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-3xl space-y-8 fade-up">
          <div className="inline-flex items-center rounded-full border border-slate-500/50 bg-slate-800/50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-indigo-300 backdrop-blur-md">
            Welcome to the future
          </div>
          
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl md:text-7xl">
            Unified Campus Operations.
          </h1>
          
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg md:text-xl">
            A single, intelligent platform to manage bookings, track maintenance tickets, and streamline your entire campus experience.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row pt-4">
            <Link
              to="/login"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-indigo-600 px-8 text-sm font-semibold text-white shadow-lg transition hover:bg-indigo-500"
            >
              Get Started
            </Link>
            <a
              href="#features"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-slate-600 bg-slate-800/50 px-8 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-slate-700/50"
            >
              Learn More
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800 bg-slate-950/80 px-6 py-6 text-center backdrop-blur-md md:px-12">
        <p className="text-sm text-slate-500">
          &copy; {new Date().getFullYear()} Smart Campus Hub. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

export default LandingPage;
