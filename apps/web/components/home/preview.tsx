export default function Preview() {
  const rows = [
    {
      name: "Candidate A",
      stage: "Imported",
      quiz: "—",
      github: "—",
      interview: "—",
    },
    {
      name: "Candidate B",
      stage: "Quiz",
      quiz: "90",
      github: "—",
      interview: "—",
    },
    {
      name: "Candidate C",
      stage: "GitHub review",
      quiz: "80",
      github: "Submitted",
      interview: "—",
    },
    {
      name: "Candidate D",
      stage: "Interview",
      quiz: "89",
      github: "Submitted",
      interview: "[Date, Meet link]",
      active: true,
    },
  ];
  const cols = "grid grid-cols-[2fr_1.4fr_1fr_1fr_1.2fr] gap-4";

  return (
    <section className="mx-auto max-w-[1160px] px-6 pb-28">
      <div className="overflow-hidden rounded-[20px] border border-[#E3E3DD] bg-white">
        <div className="flex items-center gap-2 border-b border-[#EDEDE8] px-5 py-4">
          <span className="h-2.5 w-2.5 rounded-full bg-[#E3E3DD]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#E3E3DD]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#E3E3DD]" />
          <span className="ml-3 font-mono text-xs text-[#8A8A84]">
            Candidates
          </span>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[720px] px-5 pb-3 pt-2">
            <div
              className={`${cols} border-b border-[#EDEDE8] py-3 font-mono text-xs text-[#8A8A84]`}
            >
              <span>Candidate</span>
              <span>Stage</span>
              <span>Quiz</span>
              <span>GitHub</span>
              <span>Interview</span>
            </div>
            {rows.map((r, i) => (
              <div
                key={r.name}
                className={`${cols} items-center py-4 text-[15px] ${
                  i < rows.length - 1 ? "border-b border-[#F3F3EF]" : ""
                }`}
              >
                <span className="font-medium">{r.name}</span>
                <span>
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-[13px] ${
                      r.active ? "bg-[#2F4BFF] text-white" : "bg-[#F1F1EC]"
                    }`}
                  >
                    {r.stage}
                  </span>
                </span>
                {[r.quiz, r.github, r.interview].map((v, j) => (
                  <span
                    key={j}
                    className={v === "—" ? "text-[#B0B0A8]" : undefined}
                  >
                    {v}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
