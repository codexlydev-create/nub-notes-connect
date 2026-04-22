import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Send, Github, Twitter, Linkedin } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  message: z.string().trim().min(10).max(1000),
});

export default function Contact() {
  const [f, setF] = useState({ name: "", email: "", message: "" });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = schema.safeParse(f);
    if (!r.success) { toast.error("Please fill all fields (message ≥ 10 chars)"); return; }
    toast.success("Thanks! We'll get back to you soon.");
    setF({ name: "", email: "", message: "" });
  };

  return (
    <div className="grid md:grid-cols-2 gap-10 max-w-4xl mx-auto">
      <div>
        <div className="text-xs uppercase tracking-widest text-primary font-semibold mb-2">Contact</div>
        <h1 className="text-4xl font-bold mb-3">Say hello.</h1>
        <p className="text-muted-foreground leading-relaxed mb-6">
          Questions, feedback, or want to contribute? Drop us a message and we'll reply as soon as possible.
        </p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Mail className="w-4 h-4 text-primary" /> hello@noteshare.nub
        </div>
        <div className="flex gap-2">
          {[Github, Twitter, Linkedin].map((Icon, i) => (
            <a key={i} href="#" className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors">
              <Icon className="w-4 h-4" />
            </a>
          ))}
        </div>
      </div>

      <motion.form onSubmit={submit} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-card border border-border shadow-elegant p-6 space-y-3">
        <Field label="Name"><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="inp" /></Field>
        <Field label="Email"><input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className="inp" /></Field>
        <Field label="Message"><textarea value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} className="inp min-h-[140px]" /></Field>
        <button className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-primary text-primary-foreground font-semibold shadow-soft hover:opacity-90">
          Send message <Send className="w-4 h-4" />
        </button>
        <style>{`.inp { width:100%; padding:0.6rem 0.9rem; border-radius: 0.75rem; border:1px solid hsl(var(--border)); background: hsl(var(--background)); font-size: 0.875rem; outline: none; transition: border-color .15s, box-shadow .15s; } .inp:focus { border-color: hsl(var(--primary)); box-shadow: 0 0 0 3px hsl(var(--primary) / 0.15); }`}</style>
      </motion.form>
    </div>
  );
}

function Field({ label, children }: any) {
  return (
    <div>
      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}