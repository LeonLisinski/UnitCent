import Link from "next/link";
import { LogoMark, Wordmark } from "../Logo";
import { CalcNavLink } from "../NavIcons";
import { CONTACT_EMAIL } from "../site";
import "../blog/blog.css";
import "./calc.css";

export default function CalcLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="site-header">
        <div className="wrap">
          <Link href="/" className="logo" aria-label="UnitCent, početna">
            <LogoMark size={30} /><Wordmark />
          </Link>
          <div className="header-actions">
            <CalcNavLink />
            <Link className="btn primary sm" href="/#prijava">Javi mi kad izađe</Link>
          </div>
        </div>
      </header>

      {children}

      <footer>
        <div className="wrap">
          <span>© {new Date().getFullYear()} UnitCent</span>
          <nav aria-label="Podnožje">
            <Link href="/blog">Blog</Link>
            <Link href="/kalkulatori">Kalkulatori</Link>
            <Link href="/privatnost">Privatnost</Link>
            <Link href="/uvjeti">Uvjeti</Link>
            <a href={`mailto:${CONTACT_EMAIL}`}>Kontakt</a>
          </nav>
        </div>
      </footer>
    </>
  );
}
