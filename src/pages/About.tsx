import { motion } from "framer-motion";
import { Target, Heart, Rocket, Users } from "lucide-react";

export default function About() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-xs uppercase tracking-widest text-primary font-semibold mb-2">About Note Share</div>
      <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Built by students, for students.</h1>
      <p className="text-lg text-muted-foreground leading-relaxed mb-10">
        Note Share started as a side project at Northern University Bangladesh — a simple answer to a common problem:
        good notes exist, they're just scattered across chat groups and drives. We're making them searchable,
        shareable, and permanent.
      </p>

      <div className="grid md:grid-cols-2 gap-4 mb-12">
        {[
          { icon: Target, t: "Our mission", d: "Make high-quality course notes accessible to every student, regardless of section or batch." },
          { icon: Heart, t: "What we value", d: "Community over gatekeeping. Clean design over clutter. Always free for students." },
          { icon: Rocket, t: "Future goals", d: "AI-powered summaries, peer-reviewed notes, collaborative editing, and mobile apps." },
          { icon: Users, t: "Community", d: "Contributors across every department keeping the library fresh and reliable." },
        ].map((b, i) => (
          <motion.div key={b.t} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-2xl bg-card border border-border p-5 shadow-card">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary text-primary-foreground flex items-center justify-center mb-3"><b.icon className="w-5 h-5" /></div>
            <div className="font-semibold mb-1">{b.t}</div>
            <div className="text-sm text-muted-foreground">{b.d}</div>
          </motion.div>
        ))}
      </div>

      <div className="rounded-3xl bg-gradient-hero p-8 border border-border text-center">
        <div className="text-2xl font-bold mb-2">Want to help shape it?</div>
        <div className="text-muted-foreground mb-4">Upload your best notes, flag issues, or just spread the word.</div>
      </div>
    </div>
  );
}