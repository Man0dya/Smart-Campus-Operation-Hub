import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import {
  HiOutlineUserCircle,
  HiOutlineCalendarDays,
  HiOutlineWrenchScrewdriver,
  HiOutlineBellAlert,
  HiOutlineShieldCheck,
  HiOutlineBuildingLibrary,
  HiOutlineChartBarSquare,
  HiOutlineArrowRight,
  HiOutlineCheckCircle,
  HiOutlineUserGroup,
  HiOutlineCpuChip,
  HiOutlineClipboardDocumentList,
} from "react-icons/hi2";

/* ───── Intersection-observer hook for scroll-reveal ───── */
function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); io.unobserve(el); } },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, visible];
}

/* ───── Feature data ───── */
const features = [
  {
    icon: HiOutlineCalendarDays,
    title: "Smart Resource Booking",
    desc: "Reserve lecture halls, labs, seminar rooms, and equipment in seconds. Real-time availability checks prevent double bookings, and admin approval workflows ensure every reservation is accounted for.",
    accent: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-100",
  },
  {
    icon: HiOutlineWrenchScrewdriver,
    title: "Maintenance Ticketing",
    desc: "Report facility issues with photo attachments and priority levels. Tickets are automatically routed to technicians, with full status tracking from open to resolved — keeping everyone in the loop.",
    accent: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
  },
  {
    icon: HiOutlineBellAlert,
    title: "Real-Time Notifications",
    desc: "Stay informed with instant alerts for booking approvals, ticket updates, and system announcements. Mark individual or all notifications as read with a single click.",
    accent: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-100",
  },
  {
    icon: HiOutlineShieldCheck,
    title: "Role-Based Access Control",
    desc: "Secure OAuth2 authentication with Google. Distinct dashboards and permissions for Students, Technicians, and Admins ensure every user sees exactly what they need.",
    accent: "text-violet-700",
    bg: "bg-violet-50",
    border: "border-violet-100",
  },
  {
    icon: HiOutlineBuildingLibrary,
    title: "Resource Catalogue",
    desc: "Browse, search, and filter the complete inventory of campus facilities and equipment. Admins can add, edit, or retire resources through a dedicated management panel.",
    accent: "text-rose-700",
    bg: "bg-rose-50",
    border: "border-rose-100",
  },
  {
    icon: HiOutlineChartBarSquare,
    title: "Admin Analytics Dashboard",
    desc: "A bird's-eye view of campus operations — track booking trends, open ticket counts, user activity, and resource utilization all from one centralized admin console.",
    accent: "text-cyan-700",
    bg: "bg-cyan-50",
    border: "border-cyan-100",
  },
];

/* ───── How-it-works steps ───── */
const steps = [
  {
    num: "01",
    icon: HiOutlineUserCircle,
    title: "Sign In with Google",
    desc: "Authenticate securely via Google OAuth2 — no new passwords to remember.",
  },
  {
    num: "02",
    icon: HiOutlineClipboardDocumentList,
    title: "Browse & Book Resources",
    desc: "Explore available rooms and equipment, then submit a booking request in seconds.",
  },
  {
    num: "03",
    icon: HiOutlineCpuChip,
    title: "Report & Track Issues",
    desc: "Create maintenance tickets with attachments and follow progress in real time.",
  },
  {
    num: "04",
    icon: HiOutlineCheckCircle,
    title: "Stay Notified",
    desc: "Get instant updates on booking decisions, ticket status changes, and more.",
  },
];

/* ───── Stats ───── */
const stats = [
  { value: "24/7", label: "Platform Availability" },
  { value: "3", label: "Distinct User Roles" },
  { value: "100%", label: "Cloud-Ready Architecture" },
  { value: "< 1s", label: "Average Response Time" },
];

/* ═══════════════════════════════════════════════════════════════ */
function LandingPage() {
  const [heroRef, heroVis] = useReveal(0.05);
  const [featRef, featVis] = useReveal(0.08);
  const [howRef, howVis] = useReveal(0.1);
  const [statsRef, statsVis] = useReveal(0.15);
  const [ctaRef, ctaVis] = useReveal(0.15);

  return (
    <div className="flex min-h-screen flex-col font-sans" style={{ color: "var(--ui-text)" }}>

      {/* ─── HEADER ─── */}
      <header className="fixed inset-x-0 top-0 z-50 border-b bg-white/80 backdrop-blur-xl" style={{ borderColor: "var(--ui-line)" }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5 md:px-12">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center text-lg font-bold text-white shadow-sm"
              style={{ borderRadius: "var(--ui-radius)", background: "var(--ui-accent)" }}
            >
              S
            </div>
            <span className="text-lg font-bold tracking-tight" style={{ fontFamily: "'Sora', 'IBM Plex Sans', sans-serif" }}>
              Smart Campus Hub
            </span>
          </div>
          <nav className="hidden items-center gap-8 text-sm font-medium md:flex" style={{ color: "var(--ui-muted)" }}>
            <a href="#features" className="transition hover:text-slate-900">Features</a>
            <a href="#how-it-works" className="transition hover:text-slate-900">How It Works</a>
            <a href="#stats" className="transition hover:text-slate-900">Why Us</a>
          </nav>
          <Link
            to="/login"
            className="btn-primary inline-flex items-center gap-2 text-sm"
          >
            <HiOutlineUserCircle className="h-4.5 w-4.5" />
            Login
          </Link>
        </div>
      </header>

      {/* ─── HERO ─── */}
      <section
        ref={heroRef}
        className="relative flex min-h-[92vh] flex-col items-center justify-center overflow-hidden px-6 pt-20 text-center"
        style={{
          background: "linear-gradient(125deg, #f8fbff 0%, #f1f5f9 55%, #ffffff 100%)",
        }}
      >
        {/* Decorative dots */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "radial-gradient(circle, var(--ui-accent) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Content */}
        <div
          className={`relative z-10 mx-auto max-w-3xl space-y-7 transition-all duration-700 ease-out ${heroVis ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.15em]"
            style={{
              borderRadius: "9999px",
              border: "1px solid var(--ui-line)",
              background: "var(--ui-accent-soft)",
              color: "var(--ui-accent)",
            }}
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: "var(--ui-accent)" }} />
              <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: "var(--ui-accent)" }} />
            </span>
            University Operations Platform
          </div>

          <h1
            className="text-4xl font-extrabold leading-[1.12] tracking-tight sm:text-5xl md:text-6xl"
            style={{ fontFamily: "'Sora', 'IBM Plex Sans', sans-serif" }}
          >
            Unified Campus{" "}
            <span style={{ color: "var(--ui-accent)" }}>Operations.</span>
          </h1>

          <p className="mx-auto max-w-xl text-base leading-relaxed sm:text-lg" style={{ color: "var(--ui-muted)" }}>
            A single, intelligent platform to manage bookings, track
            maintenance tickets, coordinate technicians, and streamline your
            entire campus experience.
          </p>

          <div className="flex flex-col items-center justify-center gap-3 pt-1 sm:flex-row">
            <Link
              to="/login"
              id="hero-cta-login"
              className="btn-primary group inline-flex h-12 items-center gap-2 px-7 text-sm"
            >
              Get Started
              <HiOutlineArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#features"
              id="hero-cta-features"
              className="btn-secondary inline-flex h-12 items-center px-7 text-sm"
            >
              Explore Features
            </a>
          </div>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2">
          <div className="flex h-9 w-5.5 items-start justify-center rounded-full border-2 p-1" style={{ borderColor: "var(--ui-line-strong)" }}>
            <div className="h-2 w-1 animate-bounce rounded-full" style={{ background: "var(--ui-muted)" }} />
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" ref={featRef} className="py-24 md:py-32" style={{ background: "var(--ui-bg)" }}>
        <div className="mx-auto max-w-6xl px-6 md:px-12">
          {/* Section heading */}
          <div
            className={`mx-auto mb-14 max-w-2xl text-center transition-all duration-700 ease-out md:mb-18 ${featVis ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}
          >
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--ui-accent)" }}>
              Platform Capabilities
            </p>
            <h2
              className="text-3xl font-extrabold tracking-tight sm:text-4xl"
              style={{ fontFamily: "'Sora', 'IBM Plex Sans', sans-serif" }}
            >
              Everything You Need, All in One Place
            </h2>
            <p className="mt-4 text-sm leading-relaxed sm:text-base" style={{ color: "var(--ui-muted)" }}>
              From booking a lecture hall to resolving a maintenance request,
              Smart Campus Hub covers every operational workflow across your
              university.
            </p>
          </div>

          {/* Cards */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  id={`feature-card-${i}`}
                  className={`panel card-lift p-6 transition-all duration-700 ease-out ${featVis ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
                  style={{ transitionDelay: `${i * 70}ms` }}
                >
                  <div
                    className={`mb-4 inline-flex items-center justify-center p-2.5 ${f.bg} ${f.border}`}
                    style={{ borderRadius: "var(--ui-radius)", border: "1px solid" }}
                  >
                    <Icon className={`h-5 w-5 ${f.accent}`} />
                  </div>
                  <h3 className="mb-1.5 text-base font-bold text-slate-900">
                    {f.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--ui-muted)" }}>
                    {f.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" ref={howRef} className="border-t py-24 md:py-32" style={{ borderColor: "var(--ui-line)", background: "var(--ui-surface)" }}>
        <div className="mx-auto max-w-6xl px-6 md:px-12">
          <div
            className={`mx-auto mb-14 max-w-2xl text-center transition-all duration-700 ease-out md:mb-18 ${howVis ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}
          >
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--ui-accent)" }}>
              Simple Workflow
            </p>
            <h2
              className="text-3xl font-extrabold tracking-tight sm:text-4xl"
              style={{ fontFamily: "'Sora', 'IBM Plex Sans', sans-serif" }}
            >
              Up and Running in Four Steps
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.num}
                  id={`step-${s.num}`}
                  className={`panel p-6 transition-all duration-700 ease-out ${howVis ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
                  style={{ transitionDelay: `${i * 90}ms` }}
                >
                  <span className="mb-3 block text-2xl font-extrabold" style={{ color: "var(--ui-line)" }}>
                    {s.num}
                  </span>
                  <div
                    className="mb-3 inline-flex items-center justify-center p-2"
                    style={{
                      borderRadius: "var(--ui-radius)",
                      background: "var(--ui-accent-soft)",
                    }}
                  >
                    <Icon className="h-5 w-5" style={{ color: "var(--ui-accent)" }} />
                  </div>
                  <h3 className="mb-1.5 text-sm font-bold text-slate-900">{s.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--ui-muted)" }}>{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section id="stats" ref={statsRef} className="border-t py-16 md:py-24" style={{ borderColor: "var(--ui-line)", background: "var(--ui-bg)" }}>
        <div className="mx-auto max-w-6xl px-6 md:px-12">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s, i) => (
              <div
                key={s.label}
                className={`text-center transition-all duration-700 ease-out ${statsVis ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <p className="text-3xl font-extrabold tracking-tight md:text-4xl" style={{ color: "var(--ui-accent)" }}>
                  {s.value}
                </p>
                <p className="mt-1 text-sm font-medium" style={{ color: "var(--ui-muted)" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ROLE HIGHLIGHTS ─── */}
      <section className="border-t py-24 md:py-32" style={{ borderColor: "var(--ui-line)", background: "var(--ui-surface)" }}>
        <div className="mx-auto max-w-6xl px-6 md:px-12">
          <div className="mx-auto mb-14 max-w-2xl text-center md:mb-18">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: "var(--ui-accent)" }}>
              Built for Everyone
            </p>
            <h2
              className="text-3xl font-extrabold tracking-tight sm:text-4xl"
              style={{ fontFamily: "'Sora', 'IBM Plex Sans', sans-serif" }}
            >
              Tailored Experiences for Every Role
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {/* Students */}
            <div className="panel card-lift p-6">
              <div className="mb-4 inline-flex items-center justify-center rounded-lg border border-blue-100 bg-blue-50 p-3">
                <HiOutlineUserGroup className="h-6 w-6 text-blue-700" />
              </div>
              <h3 className="mb-3 text-lg font-bold text-slate-900">Students & Staff</h3>
              <ul className="space-y-2.5 text-sm" style={{ color: "var(--ui-muted)" }}>
                <li className="flex items-start gap-2">
                  <HiOutlineCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                  Browse and filter campus resources
                </li>
                <li className="flex items-start gap-2">
                  <HiOutlineCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                  Create & track booking requests
                </li>
                <li className="flex items-start gap-2">
                  <HiOutlineCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                  Submit maintenance tickets with attachments
                </li>
                <li className="flex items-start gap-2">
                  <HiOutlineCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                  Receive real-time notifications
                </li>
              </ul>
            </div>

            {/* Technicians */}
            <div className="panel card-lift p-6">
              <div className="mb-4 inline-flex items-center justify-center rounded-lg border border-emerald-100 bg-emerald-50 p-3">
                <HiOutlineWrenchScrewdriver className="h-6 w-6 text-emerald-700" />
              </div>
              <h3 className="mb-3 text-lg font-bold text-slate-900">Technicians</h3>
              <ul className="space-y-2.5 text-sm" style={{ color: "var(--ui-muted)" }}>
                <li className="flex items-start gap-2">
                  <HiOutlineCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  Dedicated technician dashboard
                </li>
                <li className="flex items-start gap-2">
                  <HiOutlineCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  View & manage assigned tickets
                </li>
                <li className="flex items-start gap-2">
                  <HiOutlineCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  Update ticket status & add comments
                </li>
                <li className="flex items-start gap-2">
                  <HiOutlineCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  Skill-based ticket routing
                </li>
              </ul>
            </div>

            {/* Admins */}
            <div className="panel card-lift p-6">
              <div className="mb-4 inline-flex items-center justify-center rounded-lg border border-violet-100 bg-violet-50 p-3">
                <HiOutlineShieldCheck className="h-6 w-6 text-violet-700" />
              </div>
              <h3 className="mb-3 text-lg font-bold text-slate-900">Administrators</h3>
              <ul className="space-y-2.5 text-sm" style={{ color: "var(--ui-muted)" }}>
                <li className="flex items-start gap-2">
                  <HiOutlineCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
                  Full admin analytics dashboard
                </li>
                <li className="flex items-start gap-2">
                  <HiOutlineCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
                  Approve / reject booking requests
                </li>
                <li className="flex items-start gap-2">
                  <HiOutlineCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
                  Manage resources, users, and tickets
                </li>
                <li className="flex items-start gap-2">
                  <HiOutlineCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
                  Assign technicians & oversee operations
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section ref={ctaRef} className="border-t py-24 md:py-32" style={{ borderColor: "var(--ui-line)" }}>
        <div className="dashboard-hero mx-auto max-w-3xl">
          <div
            className={`text-center transition-all duration-700 ease-out ${ctaVis ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}
          >
            <h2
              className="text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl"
              style={{ fontFamily: "'Sora', 'IBM Plex Sans', sans-serif" }}
            >
              Ready to Modernize Your Campus?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed sm:text-base" style={{ color: "var(--ui-muted)" }}>
              Join your university on Smart Campus Hub and experience a smarter,
              faster, and more transparent way to manage campus operations.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/login"
                id="cta-login"
                className="btn-primary group inline-flex h-12 items-center gap-2 px-8 text-sm"
              >
                Get Started Now
                <HiOutlineArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t" style={{ borderColor: "var(--ui-line)", background: "var(--ui-surface)" }}>
        <div className="mx-auto max-w-6xl px-6 py-8 md:px-12">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-7 w-7 items-center justify-center text-xs font-bold text-white"
                style={{ borderRadius: "var(--ui-radius)", background: "var(--ui-accent)" }}
              >
                S
              </div>
              <span className="text-sm font-bold tracking-tight">Smart Campus Hub</span>
            </div>
            <p className="text-xs" style={{ color: "var(--ui-muted)" }}>
              &copy; {new Date().getFullYear()} Smart Campus Hub &mdash; IT3030 PAF 2026. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
