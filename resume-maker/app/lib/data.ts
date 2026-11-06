export const FIELDS = {
  "Engineering / IT": { target: "Software Developer", skills: "Problem solving, Teamwork, Debugging", tools: "Python, Java, React, SQL, Git", work: "Resume Maker Web App", org: "Personal Project", pts: "Built a web app that generates resumes\nAdded PDF download\nDeployed it on Vercel" },
  "Commerce / BBA / MBA": { target: "Accounts Executive", skills: "Financial analysis, Communication, Negotiation", tools: "Tally, MS Excel, GST, Power BI", work: "Accounts Intern", org: "ABC Traders", pts: "Prepared daily entries in Tally\nAssisted with GST return filing\nReconciled 200+ invoices" },
  "Arts / Humanities": { target: "Content Writer", skills: "Writing, Research, Public speaking", tools: "MS Word, Canva, Google Docs", work: "Content Writing Intern", org: "XYZ Media", pts: "Wrote 20+ articles\nCreated social media captions\nPrepared research reports" },
  "Science (BSc / MSc)": { target: "Research Assistant", skills: "Data analysis, Lab safety, Report writing", tools: "MS Excel, SPSS, MATLAB", work: "Final Year Research Project", org: "College Laboratory", pts: "Analysed 50 samples\nRecorded data in Excel and made graphs\nWrote the project report" },
  "Medical / Nursing / Pharma": { target: "Staff Nurse", skills: "Patient care, Clinical documentation, Teamwork", tools: "BLS certified, Hospital EMR software", work: "Clinical Internship", org: "City Hospital", pts: "Assisted in the care of 20+ patients daily\nMaintained vitals and patient records" },
  "Law": { target: "Legal Intern", skills: "Legal research, Drafting, Argumentation", tools: "Manupatra, SCC Online, MS Word", work: "Legal Internship", org: "Advocate / Law Firm", pts: "Researched case laws\nDrafted legal notices\nAssisted in court hearings" },
  "Design / Media": { target: "Graphic Designer", skills: "Creativity, Visual storytelling, Time management", tools: "Photoshop, Figma, Canva, Premiere Pro", work: "Design Intern", org: "Creative Studio", pts: "Designed 15+ social media posters\nRedesigned a brand logo" },
  Other: { target: "Your target role", skills: "Communication, Teamwork, Time management", tools: "MS Office, Google Workspace", work: "Internship or project name", org: "Company, college or organization", pts: "What you did\nWhat result you got" },
};
export type FieldKey = keyof typeof FIELDS;

export type Data = {
  field: FieldKey; name: string; phone: string; email: string; city: string; link: string;
  target: string; skills: string; tools: string; languages: string; certs: string; achievements: string; job: string;
};
export type Edu = { degree: string; inst: string; year: string; score: string };
export type Work = { title: string; org: string; dates: string; points: string };
export type AiResult = { summary: string; work: string[][]; coverLetter: string };

export const emptyData: Data = { field: "Engineering / IT", name: "", phone: "", email: "", city: "", link: "", target: "", skills: "", tools: "", languages: "", certs: "", achievements: "", job: "" };
export const emptyEdu: Edu = { degree: "", inst: "", year: "", score: "" };
export const emptyWork: Work = { title: "", org: "", dates: "", points: "" };

export const LAYOUTS = {
  classic: { name: "Classic", font: "Georgia, 'Times New Roman', serif", size: 15, lh: 1.5 },
  modern: { name: "Modern", font: "Arial, Helvetica, sans-serif", size: 14, lh: 1.5 },
  compact: { name: "Compact", font: "Arial, Helvetica, sans-serif", size: 12.5, lh: 1.4 },
};
export type LayoutKey = keyof typeof LAYOUTS;

export const TABS = ["Basics", "Education", "Skills", "Experience", "Extras"];

export const lines = (s: string): string[] =>
  s.split("\n").map((x) => x.replace(/^[-•*]\s*/, "").trim()).filter(Boolean);

export const SAMPLE: { d: Data; edu: Edu[]; work: Work[] } = {
  d: { field: "Commerce / BBA / MBA", name: "Priya Verma", phone: "98765 43210", email: "priya.verma@example.com", city: "Lucknow, UP", link: "linkedin.com/in/priya-verma", target: "Accounts Executive", skills: "Financial analysis, Communication, Attention to detail", tools: "Tally, MS Excel, GST, Power BI", languages: "Hindi, English", certs: "Tally Certified, ABC Institute", achievements: "College topper 2025", job: "" },
  edu: [{ degree: "B.Com", inst: "Lucknow University", year: "2023 - 2026", score: "8.1 CGPA" }],
  work: [{ title: "Accounts Intern", org: "ABC Traders", dates: "Jun 2025 - Aug 2025", points: "Prepared daily entries in Tally\nAssisted with GST return filing\nReconciled 200+ invoices" }],
};