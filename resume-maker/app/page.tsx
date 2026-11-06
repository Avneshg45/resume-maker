"use client";
import { useEffect, useState } from "react";
import { FIELDS, LAYOUTS, SAMPLE, TABS, emptyData, emptyEdu, emptyWork, lines, type AiResult, type Data, type Edu, type FieldKey, type LayoutKey, type Work } from "./lib/data";
import { validate } from "./lib/validate";
import { analyze } from "./lib/ats";
import { Field, Group, inputCls } from "./components/field";
import Resume from "./components/resume";

type Ai = AiResult & { titles: string[] };
const KEY = "resume-studio-v2";

function tabOf(k: string): number {
  if (k.startsWith("edu.")) return 1;
  if (k.startsWith("work.")) return 3;
  if (k === "skills" || k === "tools" || k === "languages") return 2;
  if (k === "certs" || k === "achievements" || k === "job") return 4;
  return 0;
}

export default function Home() {
  const [d, setD] = useState<Data>(emptyData);
  const [edu, setEdu] = useState<Edu[]>([{ ...emptyEdu }]);
  const [work, setWork] = useState<Work[]>([{ ...emptyWork }]);
  const [ai, setAi] = useState<Ai | null>(null);
  const [layout, setLayout] = useState<LayoutKey>("classic");
  const [tab, setTab] = useState(0);
  const [view, setView] = useState<"edit" | "preview">("edit");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [copied, setCopied] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s?.d && s.d.field in FIELDS) setD({ ...emptyData, ...s.d });
        if (Array.isArray(s?.edu) && s.edu.length) setEdu(s.edu);
        if (Array.isArray(s?.work) && s.work.length) setWork(s.work);
        if (s?.layout in LAYOUTS) setLayout(s.layout);
        if (s?.ai && Array.isArray(s.ai.titles)) setAi(s.ai);
      }
    } catch { /* ignore broken saved data */ }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(KEY, JSON.stringify({ d, edu, work, layout, ai })); } catch { /* storage full or blocked */ }
  }, [d, edu, work, layout, ai, loaded]);

  const P = FIELDS[d.field];
  const errors = validate(d, edu, work);
  const errKeys = Object.keys(errors);
  const set = (k: keyof Data) => (v: string) => setD((p) => ({ ...p, [k]: v }));
  const upEdu = (i: number, k: keyof Edu, v: string) => setEdu((a) => a.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  const upWork = (i: number, k: keyof Work, v: string) => setWork((a) => a.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  const fe = (k: string) => (showAll || touched[k] ? errors[k] : undefined);
  const tb = (k: string) => () => setTouched((t) => ({ ...t, [k]: true }));

  const bullets = (i: number): string[] =>
    ai && ai.titles[i] === work[i]?.title && ai.work[i]?.length ? ai.work[i] : lines(work[i]?.points ?? "");
  const summary = ai?.summary ?? "";
  const a = analyze({ d, edu, work, summary, bullets });

  function blocked(): boolean {
    setShowAll(true);
    if (errKeys.length) {
      setTab(tabOf(errKeys[0]));
      setView("edit");
      setMsg(`Fix ${errKeys.length} highlighted ${errKeys.length === 1 ? "field" : "fields"} first.`);
      return true;
    }
    setMsg("");
    return false;
  }

  async function generate() {
    if (loading || blocked()) return;
    setLoading(true);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 65000);
    try {
      const res = await fetch("/api/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ d, edu, work }), signal: ctrl.signal,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data || data.error) throw new Error(data?.error || "Something went wrong. Please try again.");
      setAi({ ...data, titles: work.map((w) => w.title) });
      setView("preview");
    } catch (e) {
      const name = e instanceof Error ? e.name : "";
      setMsg(name === "AbortError" ? "The AI took too long. Please try again."
        : typeof navigator !== "undefined" && !navigator.onLine ? "You appear to be offline. Check your internet."
        : e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      clearTimeout(timer);
      setLoading(false);
    }
  }

  function download() {
    if (blocked()) return;
    const old = document.title;
    document.title = d.name.trim().replace(/\s+/g, "_") + "_Resume";
    window.addEventListener("afterprint", () => { document.title = old; }, { once: true });
    window.print();
  }

  async function copy(text: string, id: string) {
    try { await navigator.clipboard.writeText(text); setCopied(id); setTimeout(() => setCopied(""), 1500); }
    catch { setMsg("Copy failed. Select the text and copy it manually."); }
  }

  function reset() {
    if (!window.confirm("Clear everything and start over?")) return;
    setD(emptyData); setEdu([{ ...emptyEdu }]); setWork([{ ...emptyWork }]);
    setAi(null); setTouched({}); setShowAll(false); setMsg(""); setTab(0);
  }

  function sample() {
    setD(SAMPLE.d); setEdu(SAMPLE.edu); setWork(SAMPLE.work); setAi(null); setTouched({}); setShowAll(false); setMsg("");
  }

  const addBtn = "w-full rounded-lg border border-dashed border-[#94A3B8] px-4 py-2.5 text-sm font-semibold text-[#2459E0] hover:bg-[#EEF3FF]";
  const color = a.total >= 80 ? "#1D6B3A" : a.total >= 60 ? "#B54708" : "#B42318";
  const bars: [string, number | null][] = [["Parsing", a.parse], ["Content quality", a.quality], ["Job match", a.match]];

  return (
    <main className="min-h-screen bg-[#F1F5F9] text-[#0F172A]" style={{ fontFamily: "system-ui, -apple-system, 'Segoe UI', Arial, sans-serif" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @media (prefers-reduced-motion: reduce) { .spin { animation: none !important } }
        @page { margin: 12mm; }
        @media print {
          body * { visibility: hidden; }
          .leftcol { display: none !important; }
          .rightcol { display: block !important; position: static !important; max-height: none !important; overflow: visible !important; }
          #paper, #paper * { visibility: visible; }
          #paper { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; border: none !important; padding: 0 !important; min-height: 0 !important; }
        }
      `}</style>

      <header className="sticky top-0 z-20 border-b border-[#E2E8F0] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2459E0] text-sm font-extrabold text-white">R</div>
            <span className="text-[17px] font-extrabold tracking-tight">Resume Studio</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={sample} className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-[#475569] hover:bg-[#F1F5F9] sm:block">Load sample</button>
            <button onClick={reset} className="rounded-lg px-3 py-2 text-sm font-semibold text-[#475569] hover:bg-[#F1F5F9]">Reset</button>
            <button onClick={download} className="rounded-lg bg-[#2459E0] px-4 py-2 text-sm font-bold text-white hover:bg-[#1B47BD]">Download PDF</button>
          </div>
        </div>
        <div className="flex border-t border-[#E2E8F0] lg:hidden">
          {(["edit", "preview"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} className={`flex-1 py-2.5 text-sm font-semibold ${view === v ? "border-b-2 border-[#2459E0] text-[#2459E0]" : "text-[#64748B]"}`}>
              {v === "edit" ? "Edit" : "Preview"}
            </button>
          ))}
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,480px)_minmax(0,1fr)]">
        <section className={`leftcol self-start rounded-2xl border border-[#E2E8F0] bg-white shadow-sm ${view === "edit" ? "block" : "hidden"} lg:block`}>
          <div className="flex overflow-x-auto border-b border-[#E2E8F0] px-2">
            {TABS.map((t, i) => (
              <button key={t} onClick={() => setTab(i)} className={`relative whitespace-nowrap border-b-2 px-3.5 py-3.5 text-sm font-semibold ${tab === i ? "border-[#2459E0] text-[#2459E0]" : "border-transparent text-[#64748B] hover:text-[#0F172A]"}`}>
                {t}
                {showAll && errKeys.some((k) => tabOf(k) === i) && <span className="absolute right-1 top-2.5 h-2 w-2 rounded-full bg-[#B42318]" />}
              </button>
            ))}
          </div>

          <div className="space-y-4 p-5">
            {tab === 0 && (
              <>
                <div>
                  <label className="mb-1.5 block text-[13px] font-semibold text-[#334155]">Your field</label>
                  <select className={inputCls()} value={d.field} onChange={(e) => setD({ ...d, field: e.target.value as FieldKey })}>
                    {Object.keys(FIELDS).map((k) => <option key={k}>{k}</option>)}
                  </select>
                </div>
                <Field label="Target role" value={d.target} onChange={set("target")} ph={P.target} error={fe("target")} onBlur={tb("target")} max={60} />
                <div className="grid gap-x-4 sm:grid-cols-2">
                  <Field label="Full name" required value={d.name} onChange={set("name")} ph="Rahul Sharma" error={fe("name")} onBlur={tb("name")} max={60} />
                  <Field label="Phone" required value={d.phone} onChange={set("phone")} ph="98765 43210" error={fe("phone")} onBlur={tb("phone")} max={20} />
                  <Field label="Email" required value={d.email} onChange={set("email")} ph="rahul.sharma@gmail.com" error={fe("email")} onBlur={tb("email")} max={80} />
                  <Field label="City" value={d.city} onChange={set("city")} ph="Lucknow, UP" error={fe("city")} onBlur={tb("city")} max={60} />
                </div>
                <Field label="LinkedIn or portfolio link" value={d.link} onChange={set("link")} ph="linkedin.com/in/rahul-sharma" error={fe("link")} onBlur={tb("link")} max={120} />
              </>
            )}

            {tab === 1 && (
              <>
                <p className="text-sm text-[#64748B]">Most recent first. Add CGPA only if it is 7.5+ or 75%+.</p>
                {edu.map((e, i) => (
                  <Group key={i} title={`Education ${i + 1}`} onRemove={edu.length > 1 ? () => setEdu(edu.filter((_, j) => j !== i)) : undefined}>
                    <Field label="Degree or course" required value={e.degree} onChange={(v) => upEdu(i, "degree", v)} ph="B.Com, BBA, B.Tech, 12th" error={fe(`edu.${i}.degree`)} onBlur={tb(`edu.${i}.degree`)} max={100} />
                    <Field label="College or school" required value={e.inst} onChange={(v) => upEdu(i, "inst", v)} ph="Lucknow University" error={fe(`edu.${i}.inst`)} onBlur={tb(`edu.${i}.inst`)} max={120} />
                    <div className="grid gap-x-3 sm:grid-cols-2">
                      <Field label="Years" required value={e.year} onChange={(v) => upEdu(i, "year", v)} ph="2023 - 2026" error={fe(`edu.${i}.year`)} onBlur={tb(`edu.${i}.year`)} max={30} />
                      <Field label="CGPA or percentage" value={e.score} onChange={(v) => upEdu(i, "score", v)} ph="8.1 CGPA or 78%" error={fe(`edu.${i}.score`)} onBlur={tb(`edu.${i}.score`)} max={30} />
                    </div>
                  </Group>
                ))}
                {edu.length < 5 && <button onClick={() => setEdu([...edu, { ...emptyEdu }])} className={addBtn}>+ Add education</button>}
              </>
            )}

            {tab === 2 && (
              <>
                <p className="text-sm text-[#64748B]">List only skills you truly have. Separate them with commas.</p>
                <Field label="Key skills" required value={d.skills} onChange={set("skills")} ph={P.skills} rows={2} error={fe("skills")} onBlur={tb("skills")} max={400} />
                <Field label="Tools, software and technical skills" value={d.tools} onChange={set("tools")} ph={P.tools} rows={2} error={fe("tools")} onBlur={tb("tools")} max={400} />
                <Field label="Languages" value={d.languages} onChange={set("languages")} ph="Hindi, English" error={fe("languages")} onBlur={tb("languages")} max={100} />
              </>
            )}

            {tab === 3 && (
              <>
                <p className="text-sm text-[#64748B]">Internships, projects or jobs. One point per line. This section is optional.</p>
                {work.map((w, i) => (
                  <Group key={i} title={`Item ${i + 1}`} onRemove={work.length > 1 ? () => setWork(work.filter((_, j) => j !== i)) : undefined}>
                    <Field label="Role or project name" value={w.title} onChange={(v) => upWork(i, "title", v)} ph={P.work} error={fe(`work.${i}.title`)} onBlur={tb(`work.${i}.title`)} max={100} />
                    <Field label="Company, college or organization" value={w.org} onChange={(v) => upWork(i, "org", v)} ph={P.org} max={120} />
                    <Field label="Dates" value={w.dates} onChange={(v) => upWork(i, "dates", v)} ph="Jun 2025 - Aug 2025" error={fe(`work.${i}.dates`)} onBlur={tb(`work.${i}.dates`)} max={40} />
                    <Field label="What you did (one point per line)" rows={4} value={w.points} onChange={(v) => upWork(i, "points", v)} ph={P.pts} error={fe(`work.${i}.points`)} onBlur={tb(`work.${i}.points`)} max={800} />
                  </Group>
                ))}
                {work.length < 8 && <button onClick={() => setWork([...work, { ...emptyWork }])} className={addBtn}>+ Add item</button>}
              </>
            )}

            {tab === 4 && (
              <>
                <Field label="Certifications (one per line)" rows={3} value={d.certs} onChange={set("certs")} ph={"Google Digital Marketing, Google\nTally Certified, ABC Institute"} error={fe("certs")} onBlur={tb("certs")} max={800} />
                <Field label="Achievements (one per line)" rows={3} value={d.achievements} onChange={set("achievements")} ph={"College topper 2024\nFirst place in inter-college debate"} error={fe("achievements")} onBlur={tb("achievements")} max={800} />
                <Field label="Job description (optional, for keyword match and cover letter)" rows={6} value={d.job} onChange={set("job")} ph="Paste the job post here" error={fe("job")} onBlur={tb("job")} max={5000} />
              </>
            )}
          </div>

          <div className="flex justify-between border-t border-[#E2E8F0] px-5 py-3.5">
            <button onClick={() => setTab(Math.max(0, tab - 1))} className={`rounded-lg border border-[#D5DCE6] px-4 py-2 text-sm font-semibold ${tab === 0 ? "invisible" : ""}`}>Back</button>
            {tab < TABS.length - 1
              ? <button onClick={() => setTab(tab + 1)} className="rounded-lg bg-[#0F172A] px-5 py-2 text-sm font-semibold text-white">Next</button>
              : <button onClick={generate} disabled={loading} className="rounded-lg bg-[#2459E0] px-5 py-2 text-sm font-bold text-white disabled:opacity-60">Write with AI</button>}
          </div>
        </section>

        <section className={`rightcol min-w-0 space-y-4 lg:sticky lg:top-[72px] lg:max-h-[calc(100vh-88px)] lg:self-start lg:overflow-y-auto lg:pr-1 ${view === "preview" ? "block" : "hidden"} lg:block`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex rounded-lg border border-[#D5DCE6] bg-white p-1">
              {(Object.keys(LAYOUTS) as LayoutKey[]).map((k) => (
                <button key={k} onClick={() => setLayout(k)} className={`rounded-md px-3.5 py-1.5 text-sm font-semibold ${layout === k ? "bg-[#2459E0] text-white" : "text-[#475569]"}`}>{LAYOUTS[k].name}</button>
              ))}
            </div>
            <button onClick={generate} disabled={loading} className="flex items-center gap-2 rounded-lg border border-[#2459E0] bg-white px-4 py-2 text-sm font-bold text-[#2459E0] hover:bg-[#EEF3FF] disabled:opacity-60">
              {loading && <span className="spin h-3.5 w-3.5 rounded-full border-2 border-[#2459E0]/30 border-t-[#2459E0]" style={{ animation: "spin 0.8s linear infinite" }} />}
              {loading ? "AI is writing (up to 60 sec)" : ai ? "Rewrite with AI" : "Write with AI"}
            </button>
          </div>

          {msg && <p role="alert" className="rounded-lg border border-[#F5C2BE] bg-[#FEF3F2] px-3.5 py-2.5 text-sm text-[#B42318]">{msg}</p>}

          <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 text-sm">
            <div className="flex items-end justify-between">
              <p className="font-bold">ATS readiness</p>
              <p className="text-2xl font-extrabold" style={{ color }}>{a.total}<span className="text-sm font-semibold text-[#94A3B8]">/100</span></p>
            </div>
            <div className="mt-3 space-y-2">
              {bars.map(([n, v]) => (
                <div key={n}>
                  <div className="flex justify-between text-xs font-semibold text-[#475569]"><span>{n}</span><span>{v === null ? "Add a job description" : `${v}%`}</span></div>
                  <div className="mt-1 h-1.5 rounded-full bg-[#E2E8F0]"><div className="h-1.5 rounded-full bg-[#2459E0]" style={{ width: `${v ?? 0}%` }} /></div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {a.checks.map(([n, ok]) => <span key={n} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ok ? "bg-[#E7F6EC] text-[#1D6B3A]" : "bg-[#F1F5F9] text-[#64748B]"}`}>{ok ? "✓ " : ""}{n}</span>)}
            </div>
            {a.tips.length > 0 && <ul className="mt-3 list-disc space-y-1 pl-5 text-[#475569]">{a.tips.slice(0, 4).map((t) => <li key={t}>{t}</li>)}</ul>}
            {a.missing.length > 0 && <p className="mt-3 text-[#475569]">Job keywords not found (add only the ones you truly have): {a.missing.join(", ")}</p>}
            <p className="mt-3 text-xs text-[#94A3B8]">This is an estimate, not the score of any real ATS software.</p>
          </div>

          <Resume d={d} edu={edu} work={work} summary={summary} bullets={bullets} layout={layout} />

          <p className="text-center text-xs text-[#64748B]">In the print window choose Save as PDF and turn off Headers and footers.</p>

          {ai?.coverLetter && (
            <div className="space-y-3 rounded-xl border border-[#E2E8F0] bg-white p-5">
              <h3 className="text-base font-extrabold">Cover letter</h3>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#334155]">{ai.coverLetter}</p>
              <button onClick={() => copy(ai.coverLetter, "cl")} className="rounded-lg border border-[#2459E0] px-4 py-2 text-sm font-bold text-[#2459E0]">{copied === "cl" ? "Copied" : "Copy cover letter"}</button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}