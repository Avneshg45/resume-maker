import { LAYOUTS, lines, type Data, type Edu, type LayoutKey, type Work } from "../lib/data";

type Props = { d: Data; edu: Edu[]; work: Work[]; summary: string; bullets: (i: number) => string[]; layout: LayoutKey };

function H({ size, children }: { size: number; children: string }) {
  return <h3 className="mb-1.5 mt-5 border-b border-[#0F172A]/50 pb-0.5 font-bold" style={{ fontSize: size + 1 }}>{children}</h3>;
}

function Bullets({ items }: { items: string[] }) {
  if (!items.length) return null;
  return <ul className="ml-5 mt-1 list-disc">{items.map((x, k) => <li key={k}>{x}</li>)}</ul>;
}

export default function Resume({ d, edu, work, summary, bullets, layout }: Props) {
  const L = LAYOUTS[layout];
  const contact = [d.phone, d.email, d.city, d.link].filter(Boolean);
  const eduItems = edu.filter((e) => e.degree.trim() || e.inst.trim());
  const workItems = work.map((w, i) => ({ w, i })).filter((x) => x.w.title.trim());
  const empty = !d.name && !d.skills && !d.tools;

  return (
    <div
      id="paper"
      className="min-h-[720px] w-full rounded-md border border-[#E2E8F0] bg-white px-7 py-9 text-[#1B2437] shadow-md sm:px-12 sm:py-12"
      style={{ fontFamily: L.font, fontSize: L.size, lineHeight: L.lh }}
    >
      <h2 className="font-bold leading-tight" style={{ fontSize: L.size * 2, color: d.name ? "#0F172A" : "#B6C0CE" }}>
        {d.name || "Your Name"}
      </h2>
      {d.target && <p className="font-semibold text-[#2459E0]">{d.target}</p>}
      {contact.length > 0 && <p className="mt-1 break-words text-[#475569]">{contact.join("  |  ")}</p>}

      {summary && (<><H size={L.size}>Professional Summary</H><p>{summary}</p></>)}

      {eduItems.length > 0 && (
        <>
          <H size={L.size}>Education</H>
          {eduItems.map((e, i) => (
            <div key={i} className="mb-1.5">
              <div className="flex justify-between gap-4">
                <p><b>{e.degree}</b>{e.inst && `, ${e.inst}`}</p>
                <p className="shrink-0">{e.year}</p>
              </div>
              {e.score && <p>{e.score}</p>}
            </div>
          ))}
        </>
      )}

      {workItems.length > 0 && (
        <>
          <H size={L.size}>Experience</H>
          {workItems.map(({ w, i }) => (
            <div key={i} className="mb-2">
              <div className="flex justify-between gap-4">
                <p><b>{w.title}</b>{w.org && `, ${w.org}`}</p>
                <p className="shrink-0">{w.dates}</p>
              </div>
              <Bullets items={bullets(i)} />
            </div>
          ))}
        </>
      )}

      {(d.skills.trim() || d.tools.trim() || d.languages.trim()) && (
        <>
          <H size={L.size}>Skills</H>
          {d.skills.trim() && <p><b>Key Skills:</b> {d.skills}</p>}
          {d.tools.trim() && <p><b>Tools and Software:</b> {d.tools}</p>}
          {d.languages.trim() && <p><b>Languages:</b> {d.languages}</p>}
        </>
      )}

      {d.certs.trim() && (<><H size={L.size}>Certifications</H><Bullets items={lines(d.certs)} /></>)}
      {d.achievements.trim() && (<><H size={L.size}>Achievements</H><Bullets items={lines(d.achievements)} /></>)}

      {empty && <p className="mt-10 text-sm text-[#94A3B8]">Fill in your details on the left. Your resume will appear here.</p>}
    </div>
  );
}