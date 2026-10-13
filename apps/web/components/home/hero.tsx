import Link from "next/link";
import Arrow from "../items/arrow";

export default function Hero() {
  return (
    <section className="mx-auto max-w-[1160px] px-6 pb-[72px] pt-16 sm:pt-24">
      <p className="mb-7 font-mono text-[13px] tracking-[0.04em] text-[#5C5C57]">
        Recruitment workflow, end to end
      </p>
      <h1 className="max-w-[900px] text-5xl  font-semibold leading-[0.98] tracking-[-0.045em] sm:text-7xl lg:text-[84px]">
        <span className="flex">
          Hiring made smooth<p className="italic font-light text-red-900">er</p>
        </span>
      </h1>
      <div className="mt-10 flex flex-wrap items-end justify-between gap-x-16 gap-y-8">
        <p className="max-w-[480px] text-[19px] leading-[1.55] text-[#5C5C57]">
          One clear view of your entire hiring pipeline, from the first
          application to the final interview.{" "}
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/login"
            className="flex min-h-[52px] items-center gap-2.5 rounded-full bg-[#2F4BFF] px-7 text-base font-medium text-white transition-colors hover:bg-[#2340E6]"
          >
            Recruiter dashboard
            <Arrow />
          </Link>
        </div>
      </div>
    </section>
  );
}
