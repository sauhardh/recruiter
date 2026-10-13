"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getCurrentUser, logoutUser, type User } from "../../lib/auth";

type IconName = "grid" | "briefcase" | "users";

const NAV: { href: string; label: string; icon: IconName }[] = [
  { href: "/recruiter/dashboard", label: "Dashboard", icon: "grid" },
  { href: "/recruiter/positions", label: "Positions", icon: "briefcase" },
  { href: "/recruiter/candidates", label: "Candidates", icon: "users" },
];

function NavLinks() {
  const pathname = usePathname();
  return (
    <>
      {NAV.map((item) => (
        <NavLink
          key={item.href}
          {...item}
          active={pathname.startsWith(item.href)}
        />
      ))}
    </>
  );
}

export default function RecruiterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser()
      .then(({ user }) => {
        setUser(user);
        setLoading(false);
      })
      .catch(() => {
        router.replace("/login");
      });
  }, [router]);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {
      // ignore
    }
    router.replace("/login");
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F6F6F3] font-sans text-[#101010] selection:bg-[#2F4BFF] selection:text-white">
      {/* Top navigation */}
      <header className="sticky top-0 z-50 border-b border-[#E3E3DD] bg-[#F6F6F3]/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2.5 text-[19px] font-semibold tracking-[-0.03em]"
            >
              <span className="h-3 w-3 rounded-full bg-[#2F4BFF]" />
              recruiter
            </Link>
            <span className="hidden font-mono text-[13px] text-[#8A8A84] sm:block">
              / Portal
            </span>
          </div>

          <div className="flex items-center gap-3">
            {loading ? (
              <div className="h-8 w-28 animate-pulse rounded-full bg-[#E3E3DD]" />
            ) : user ? (
              <>
                <div className="flex items-center gap-2.5 text-sm">
                  {user.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="h-8 w-8 rounded-full border border-[#E3E3DD]"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#101010] text-xs font-semibold text-[#F6F6F3]">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="hidden max-w-36 truncate text-[#5C5C57] sm:block">
                    {user.name}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="min-h-9 cursor-pointer rounded-full border border-[#CFCFC8] px-4 text-[13px] font-medium transition-colors hover:border-[#101010]"
                >
                  Sign out
                </button>
              </>
            ) : null}
          </div>
        </div>

        {/* Mobile nav */}
        <nav className="flex gap-1 overflow-x-auto border-t border-[#EDEDE8] px-4 py-2 md:hidden">
          <Suspense fallback={null}>
            <NavLinks />
          </Suspense>
        </nav>
      </header>

      {/* Sidebar + content */}
      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-12 px-6 py-10">
        <aside className="hidden w-52 shrink-0 flex-col gap-1 md:flex">
          <Suspense fallback={null}>
            <NavLinks />
          </Suspense>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

const ICONS: Record<IconName, string> = {
  grid: "M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zm0 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4zm-10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4z",
  briefcase:
    "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  users:
    "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197",
};

function NavLink({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon: IconName;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex min-h-10 shrink-0 items-center gap-2.5 rounded-full px-4 text-[15px] transition-colors ${
        active
          ? "bg-[#101010] font-medium text-[#F6F6F3]"
          : "text-[#5C5C57] hover:bg-[#EDEDE8] hover:text-[#101010]"
      }`}
    >
      <svg
        className="h-4 w-4 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d={ICONS[icon]} />
      </svg>
      {label}
    </Link>
  );
}
