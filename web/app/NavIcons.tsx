import Link from "next/link";
import { Icon } from "./icons";

/** Diskretan ulaz u kalkulatore iz zaglavlja: ikona (s natpisom za čitače zaslona), ne još jedan gumb koji viče. */
export function CalcNavLink() {
  return (
    <Link href="/kalkulatori" className="nav-icon" aria-label="Kalkulatori" title="Kalkulatori">
      <Icon name="calc" size={20} stroke={1.8} />
    </Link>
  );
}
