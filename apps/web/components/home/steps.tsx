export default function Steps() {
  const steps = [
    {
      n: "01",
      title: "Google Form import",
      body: "Upload response CSVs. Emails are normalized and repeat submissions deduplicated automatically.",
    },
    {
      n: "02",
      title: "Screening and quiz",
      body: "Publish test locations and instructions. Enter marks and control when results go public.",
    },
    {
      n: "03",
      title: "GitHub assessments",
      body: "Candidates submit repos and video demos through their secure tracking link.",
    },
    {
      n: "04",
      title: "Interview and offer",
      body: "Schedule Google Meet slots, update candidate stages, and publish final hiring decisions.",
    },
  ];

  return (
    <section className="mx-auto max-w-[1160px] px-6 pb-28">
      <div className="grid grid-cols-1 border-t border-[#D9D9D2] sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s) => (
          <div key={s.n} className="pb-2 pr-7 pt-7 last:pr-0">
            <span className="font-mono text-[13px] text-[#2F4BFF]">{s.n}</span>
            <h3 className="mt-9 text-[22px] font-semibold tracking-[-0.02em]">
              {s.title}
            </h3>
            <p className="mt-3 text-base leading-relaxed text-[#5C5C57]">
              {s.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
