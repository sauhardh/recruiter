import Link from "next/link";

export default function Navbar() {
  return (
    <header>
      <div className="mx-auto flex min-h-20 max-w-[1160px] flex-wrap items-center justify-between gap-4 px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-[19px] font-semibold tracking-[-0.03em]"
        >
          <span className="h-3 w-3 rounded-full bg-[#2F4BFF]" />
          recruiter
        </Link>
        <nav className="flex flex-wrap items-center gap-1">
          <Link
            href="/track"
            className="flex min-h-11 items-center px-4 text-[15px] text-[#5C5C57] transition-colors hover:text-[#101010]"
          >
            Track application
          </Link>
          <Link
            href="/login"
            className="flex min-h-11 items-center rounded-full bg-[#101010] px-5 text-[15px] font-medium text-[#F6F6F3] transition-opacity hover:opacity-85"
          >
            Sign in
          </Link>
        </nav>
      </div>
    </header>
  );
}
