import { lines, type Data, type Edu, type Work } from "./data";

export type Errors = Record<string, string>;

const MONTH = "(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\\.?";
const DATE = "(?:" + MONTH + "\\s+)?(?:19|20)\\d{2}";
const RANGE = new RegExp("^(?:expected\\s+)?" + DATE + "(?:\\s*(?:-|–|—|to)\\s*(?:" + DATE + "|present))?$", "i");

export const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim());

export function isPhone(s: string): boolean {
  let p = s.replace(/[\s\-()]/g, "");
  if (/^(\+91|0091)\d{10}$/.test(p)) p = p.replace(/^(\+91|0091)/, "");
  else if (/^91\d{10}$/.test(p)) p = p.slice(2);
  else if (/^0\d{10}$/.test(p)) p = p.slice(1);
  return /^[6-9]\d{9}$/.test(p);
}

export const isUrl = (s: string) => /^(https?:\/\/)?(www\.)?[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}(\/\S*)?$/i.test(s.trim());

export function dateError(s: string): string {
  const t = s.trim();
  if (!t) return "";
  if (!RANGE.test(t)) return "Use a format like Jun 2025 - Aug 2025 or 2023 - 2026.";
  const ys = (t.match(/(?:19|20)\d{2}/g) || []).map(Number);
  const max = new Date().getFullYear() + 6;
  if (ys.some((y) => y < 1990 || y > max)) return "Check the year, it looks out of range.";
  if (ys.length === 2 && ys[1] < ys[0]) return "The end date is before the start date.";
  return "";
}

export function scoreError(s: string): string {
  const t = s.trim();
  if (!t) return "";
  if (!/^\d+(?:\.\d+)?\s*(?:cgpa|gpa|%|percent|percentage|\/\s*10|\/\s*100)?$/i.test(t)) return "Use a format like 8.1 CGPA or 78%.";
  const n = parseFloat(t);
  const outOfTen = /cgpa|gpa|\/\s*10$/i.test(t);
  if (!(n > 0) || n > 100 || (outOfTen && n > 10)) return "Enter a valid CGPA (up to 10) or percentage (up to 100).";
  return "";
}

export function validate(d: Data, edu: Edu[], work: Work[]): Errors {
  const e: Errors = {};
  const name = d.name.trim();
  if (!name) e.name = "Enter your full name.";
  else if (!/^[\p{L}][\p{L} .'-]{1,59}$/u.test(name)) e.name = "Use letters only (2 to 60 characters), for example Rahul Sharma.";

  if (!d.email.trim()) e.email = "Enter your email address.";
  else if (!isEmail(d.email)) e.email = "Enter a valid email, like name@gmail.com.";

  if (!d.phone.trim()) e.phone = "Enter your phone number.";
  else if (!isPhone(d.phone)) e.phone = "Enter a valid 10-digit mobile number, like 98765 43210.";

  if (d.city.trim() && !/^[\p{L}][\p{L} .,'-]{1,59}$/u.test(d.city.trim())) e.city = "Use letters only, for example Lucknow, UP.";
  if (d.link.trim() && !isUrl(d.link)) e.link = "Enter a valid link, like linkedin.com/in/your-name.";
  if (d.target.length > 60) e.target = "Keep the role under 60 characters.";

  if (!d.skills.trim() && !d.tools.trim()) e.skills = "Add at least one skill.";
  if (d.skills.length > 400) e.skills = "Keep this under 400 characters.";
  if (d.tools.length > 400) e.tools = "Keep this under 400 characters.";
  if (d.languages.length > 100) e.languages = "Keep this under 100 characters.";
  if (d.certs.length > 800) e.certs = "Keep this under 800 characters.";
  if (d.achievements.length > 800) e.achievements = "Keep this under 800 characters.";
  if (d.job.length > 5000) e.job = "The job description is too long (max 5000 characters).";

  edu.forEach((x, i) => {
    const filled = [x.degree, x.inst, x.year, x.score].some((v) => v.trim());
    if (!filled && i > 0) return;
    if (!x.degree.trim()) e[`edu.${i}.degree`] = "Add your degree or course.";
    if (!x.inst.trim()) e[`edu.${i}.inst`] = "Add your college or school.";
    if (!x.year.trim()) e[`edu.${i}.year`] = "Add the year, like 2023 - 2026.";
    else {
      const m = dateError(x.year);
      if (m) e[`edu.${i}.year`] = m;
    }
    const s = scoreError(x.score);
    if (s) e[`edu.${i}.score`] = s;
  });

  work.forEach((x, i) => {
    const filled = [x.title, x.org, x.dates, x.points].some((v) => v.trim());
    if (!filled) return;
    if (!x.title.trim()) e[`work.${i}.title`] = "Add the role or project name.";
    const m = dateError(x.dates);
    if (m) e[`work.${i}.dates`] = m;
    if (!x.points.trim()) e[`work.${i}.points`] = "Add at least one point (one per line).";
    else if (x.points.length > 800) e[`work.${i}.points`] = "Keep this under 800 characters.";
    else if (lines(x.points).some((l) => l.length > 220)) e[`work.${i}.points`] = "Keep each point under 220 characters.";
  });

  return e;
}