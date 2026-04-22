import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Upload, Search, Bookmark, Users, Sparkles, BookOpen, TrendingUp } from "lucide-react";
import { useState } from "react";

export default function Home() {
  return (
    <div className="space-y-24">
      {/* HERO */}
      <section className="relative -mx-4 md:-mx-8 px-4 md:px-8 pt-8 pb-20 bg-gradient-hero rounded-b-[3rem] overflow-hidden">
        <div className="absolute top-20 right-10 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-10 left-10 w-72 h-72 bg-primary-glow/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />

        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-card border border-border shadow-soft text-xs font-medium text-muted-foreground mb-6"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Built for students of Northern University Bangladesh
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-6"
          >
            Share Notes. <br />
            <span className="text-gradient">Learn Better.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            Discover, upload, and exchange academic notes and slides with classmates — organized by department and course.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Link to="/find" className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-primary text-primary-foreground font-semibold shadow-elegant hover:opacity-90 transition">
              Browse Notes <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/dashboard" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-card border border-border font-semibold hover:bg-muted transition shadow-soft">
              <Upload className="w-4 h-4" /> Upload Notes
            </Link>
          </motion.div>

          <div className="grid grid-cols-3 gap-4 md:gap-8 max-w-xl mx-auto mt-16">
            {[
              { n: "2.4k+", l: "Notes shared" },
              { n: "850+", l: "Students" },
              { n: "14", l: "Departments" },
            ].map((s) => (
              <div key={s.l} className="rounded-2xl bg-card/70 backdrop-blur border border-border p-4 shadow-soft">
                <div className="text-2xl font-bold text-gradient">{s.n}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="grid md:grid-cols-2 gap-10 items-center">
        <div>
          <div className="text-xs uppercase tracking-widest text-primary font-semibold mb-3">How it works</div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">A note library, written by students, for students.</h2>
          <p className="text-muted-foreground leading-relaxed">
            Note Share lets every student contribute their best slides, hand-written notes and study guides — all
            searchable by department and course code. No paywalls, no gatekeeping. Just cleaner exam prep.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: Upload, t: "Upload Notes", d: "PDF slides or hand-notes in seconds" },
            { icon: Search, t: "Search by Course", d: "Filter by dept, course, type" },
            { icon: Bookmark, t: "Save & Like", d: "Build a personal study library" },
            { icon: Users, t: "Community", d: "Backed by contributors you trust" },
          ].map((f) => (
            <motion.div
              key={f.t}
              whileHover={{ y: -4 }}
              className="rounded-2xl bg-card border border-border p-5 shadow-card"
            >
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-accent-foreground mb-3">
                <f.icon className="w-5 h-5" />
              </div>
              <div className="font-semibold mb-1">{f.t}</div>
              <div className="text-xs text-muted-foreground">{f.d}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section>
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Everything you need for exam season</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">Powerful, student-friendly tools to study smarter.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { icon: BookOpen, t: "Organized by course", d: "Every note tagged with department, course and code." },
            { icon: TrendingUp, t: "Most-loved first", d: "Like, save and surface the notes that actually helped." },
            { icon: Sparkles, t: "Clean reading", d: "Built-in PDF viewer with zoom and fit-to-width." },
          ].map((f) => (
            <motion.div
              key={f.t}
              whileHover={{ y: -6 }}
              className="rounded-2xl p-6 bg-card border border-border shadow-card"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center text-primary-foreground shadow-elegant mb-4">
                <f.icon className="w-6 h-6" />
              </div>
              <div className="font-semibold text-lg mb-1">{f.t}</div>
              <div className="text-sm text-muted-foreground">{f.d}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <FAQ />
    </div>
  );
}

function FAQ() {
  const items = [
    { q: "What is Note Share?", a: "A community platform where NUB students upload and share academic notes and slides, organized by department and course." },
    { q: "Is it free?", a: "Yes — completely free. You only need a student account to upload, like or save notes." },
    { q: "Who can upload notes?", a: "Any registered student can upload PDFs through the dashboard." },
    { q: "Are notes verified?", a: "Notes are community-curated. Likes, saves and contributor rankings help surface the highest-quality material." },
    { q: "Can I download notes without login?", a: "Yes. Viewing and downloading PDFs is open to the public. Login is only required to upload, like or save." },
  ];
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section>
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-bold">Frequently asked</h2>
      </div>
      <div className="max-w-2xl mx-auto space-y-3">
        {items.map((it, i) => (
          <motion.div key={i} layout className="rounded-2xl bg-card border border-border shadow-card overflow-hidden">
            <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between p-5 text-left">
              <span className="font-medium">{it.q}</span>
              <motion.span animate={{ rotate: open === i ? 45 : 0 }} className="text-primary text-xl leading-none">+</motion.span>
            </button>
            <motion.div
              initial={false}
              animate={{ height: open === i ? "auto" : 0, opacity: open === i ? 1 : 0 }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5 text-sm text-muted-foreground">{it.a}</div>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}