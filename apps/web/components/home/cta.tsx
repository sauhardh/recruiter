import Link from "next/link";

export default function CTA() {
  return (
    <section className="mx-auto max-w-[1160px] px-6 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-8 rounded-[28px] bg-[#101010] px-8 py-14 text-[#F6F6F3] sm:px-12 sm:py-[72px]">
        <h2 className="max-w-[560px] text-4xl font-semibold leading-[1.04] tracking-[-0.04em] sm:text-5xl">
          Run your next hiring round on Recruiter.
        </h2>
        <Link
          href="/login"
          className="flex min-h-[52px] items-center gap-2.5 rounded-full bg-[#F6F6F3] px-7 text-base font-medium text-[#101010] transition-opacity hover:opacity-90"
        >
          Sign in as recruiter
          {/* <Arrow /> */}
        </Link>
      </div>
    </section>
  );
}
