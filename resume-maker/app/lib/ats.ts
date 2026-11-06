import { lines, type Data, type Edu, type Work } from "./data";
import { dateError, isEmail, isPhone } from "./validate";

const VERBS = new Set("achieved analysed analyzed assisted automated built collaborated conducted configured coordinated created debugged delivered deployed designed developed documented drafted edited executed filed generated handled identified implemented improved increased initiated integrated launched led maintained managed mentored monitored negotiated operated optimized organized participated performed planned prepared presented processed produced reconciled reduced researched resolved reviewed secured streamlined supervised supported taught tested trained updated validated verified volunteered wrote".split(" "));

const STOP = new Set("a i s the and for with you are our will have has this that from your who able can job work team role year years experience skills skill ability strong good new all any per etc candidate looking required preferred should must also using use such ms well including company position opportunity join seeking responsible duties across within highly plus like need needs degree other related based least minimum knowledge excellent requirements responsibilities qualification".split(" "));

const ALIAS: Record<string, string> = { js: "javascript", ts: "typescript", ml: "machinelearning", "react.js": "react", reactjs: "react", "node.js": "node", nodejs: "node", nextjs: "next", "power-bi": "powerbi" };

const stem = (w: string) => (w.length > 4 ? w.replace(/(ing|ed|es|s)$/, "") : w);

function pairs(text: string): [string, string][] {
  const raw = text.toLowerCase().match(/[a-z][a-z0-9+#.]*[a-z0-9+#]|[a-z]/g) ?? [];
  return raw
    .filter((w) => (w.length > 1 || w === "c" || w === "r") && !STOP.has(w))
    .map((w): [string, string] => [stem(ALIAS[w] ?? w), w]);
}

export type Analysis = {
  parse: number; quality: number; match: number | null; total: number;
  tips: string[]; missing: string[]; checks: [string, boolean][];
};

type Input = { d: Data; edu: Edu[]; work: Work[]; summary: string; bullets: (i: number) => string[] };

export function analyze({ d, edu, work, summary, bullets }: Input): Analysis {
  const items = work.map((w, i) => ({ w, i })).filter((x) => x.w.title.trim());
  const all = items.flatMap((x) => bullets(x.i));
  const datesOk = [...edu.map((e) => e.year), ...work.map((w) => w.dates)].every((s) => !dateError(s));

  const checks: [string, boolean][] = [
    ["Full name", !!d.name.trim()],
    ["Email", isEmail(d.email)],
    ["Phone", isPhone(d.phone)],
    ["Education", edu.some((e) => e.degree.trim() && e.inst.trim())],
    ["Skills", !!d.skills.trim() || !!d.tools.trim()],
    ["Experience or projects", items.length > 0],
    ["Clean dates", datesOk],
  ];
  const parse = Math.round((checks.filter((c) => c[1]).length / checks.length) * 100);

  const text = [d.name, d.target, summary, d.skills, d.tools, d.languages, d.certs, d.achievements,
    ...edu.flatMap((e) => [e.degree, e.inst]), ...items.flatMap((x) => [x.w.title, x.w.org]), ...all].join(" ");
  const words = text.split(/\s+/).filter(Boolean).length;

  const n = all.length;
  const rate = (f: (b: string) => boolean) => (n ? all.filter(f).length / n : 0);
  const verb = rate((b) => VERBS.has(b.split(/\s+/)[0].toLowerCase().replace(/[^a-z]/g, "")));
  const num = rate((b) => /\d/.test(b));
  const len = rate((b) => { const c = b.split(/\s+/).length; return c >= 5 && c <= 25; });
  const sizeOk = words >= 200 && words <= 650 ? 1 : words < 200 ? words / 200 : 0.6;
  const quality = Math.round((verb * 0.3 + Math.min(1, num / 0.4) * 0.25 + len * 0.2 + (summary ? 0.1 : 0) + sizeOk * 0.15) * 100);

  const tips: string[] = [];
  if (n === 0) tips.push("Add 2 to 3 points under Experience or Projects.");
  if (n > 0 && verb < 0.7) tips.push("Start each point with an action verb, like Built, Managed or Prepared.");
  if (n > 0 && num < 0.3) tips.push("Add real numbers where you can (how many, how much, how often).");
  if (n > 0 && len < 0.7) tips.push("Keep each point between 5 and 25 words.");
  if (!summary) tips.push("Generate the AI summary so recruiters get a quick intro.");
  if (!d.link.trim()) tips.push("Add a LinkedIn or portfolio link.");
  if (!datesOk) tips.push("Fix the date format so parsers read it correctly.");
  if (words > 650) tips.push("The resume is long. Aim for one page.");
  if (words < 150) tips.push("The resume looks thin. Add more detail.");

  let match: number | null = null;
  let missing: string[] = [];
  const job = pairs(d.job);
  if (job.length >= 5) {
    const freq = new Map<string, { c: number; raw: string }>();
    job.forEach(([s, raw]) => freq.set(s, { c: (freq.get(s)?.c ?? 0) + 1, raw }));
    const have = new Set(pairs(text).map((p) => p[0]));
    let tot = 0, got = 0;
    const miss: [string, number][] = [];
    freq.forEach((v, s) => {
      const w = Math.min(3, v.c);
      tot += w;
      if (have.has(s)) got += w; else miss.push([v.raw, w]);
    });
    match = Math.round((got / tot) * 100);
    missing = miss.sort((a, b) => b[1] - a[1]).slice(0, 12).map((x) => x[0]);
    if (match < 60) tips.push("Your resume matches few job keywords. Add the ones you truly have.");
  }

  const total = match === null ? Math.round(parse * 0.5 + quality * 0.5) : Math.round(parse * 0.3 + quality * 0.3 + match * 0.4);
  return { parse, quality, match, total, tips, missing, checks };
}

export { lines };