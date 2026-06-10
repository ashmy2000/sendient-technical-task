"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const navItems = [
  { href: "/students", label: "Students" },
  { href: "/topics", label: "Topics" },
  { href: "/progress/new", label: "Record progress" },
  { href: "/insights", label: "Cohort insights" },
] as const;

function isActiveRoute(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navigation() {
  const pathname = usePathname();
  const homeIsActive = pathname === "/";

  return (
    <nav className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3 text-sm">
      <Link
        href="/"
        aria-current={homeIsActive ? "page" : undefined}
        className={cn(
          "border-b-2 py-1 font-semibold",
          homeIsActive ? "border-primary" : "border-transparent",
        )}
      >
        Progress Tracker
      </Link>
      {navItems.map((item) => {
        const isActive = isActiveRoute(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "border-b-2 py-1 hover:text-foreground",
              isActive
                ? "border-primary font-medium text-foreground"
                : "border-transparent text-muted-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
