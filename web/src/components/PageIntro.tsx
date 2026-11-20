import { ChevronRight } from "lucide-react";
import Link from "next/link";

export function PageIntro({
  title,
  description,
  breadcrumb,
  status = "Interactive demo",
}: {
  title: string;
  description: string;
  breadcrumb: string;
  status?: string;
}) {
  return (
    <header className="page-intro">
      <nav className="page-breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Overview</Link>
        <ChevronRight size={12} aria-hidden="true" />
        <span aria-current="page">{breadcrumb}</span>
      </nav>
      <div className="page-intro-content">
        <div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <span className="page-intro-status">
          <i aria-hidden="true" />
          {status}
        </span>
      </div>
    </header>
  );
}
