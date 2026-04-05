function LoginPage() {
  const handleLogin = () => {
    window.location.href = "http://localhost:8080/oauth2/authorization/google";
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-5xl gap-8 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-xl backdrop-blur md:grid-cols-2 md:p-10">
        <section className="space-y-5">
          <p className="chip">University Operations Platform</p>
          <h1 className="text-3xl font-extrabold leading-tight text-slate-900 md:text-4xl">
            Smart Campus Operations Hub
          </h1>
          <p className="text-sm text-slate-600 md:text-base">
            Manage resource bookings, maintenance tickets, and notifications in one workflow-driven system.
          </p>
          <div className="grid gap-3 text-sm text-slate-700">
            <p className="panel">Facilities catalogue with fast filters</p>
            <p className="panel">Booking workflow with conflict prevention</p>
            <p className="panel">Incident ticketing with role-based operations</p>
          </div>
        </section>

        <section className="panel flex flex-col justify-center gap-4">
          <h2 className="text-2xl font-bold text-slate-900">Sign in</h2>
          <p className="text-sm text-slate-600">
            Continue with Google to access your personalized dashboard.
          </p>
          <button className="btn-primary w-full" onClick={handleLogin}>
            Continue with Google
          </button>
        </section>
      </div>
    </div>
  );
}

export default LoginPage;