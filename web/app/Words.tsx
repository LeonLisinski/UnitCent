/** Razdvaja naslov na riječi da se mogu otkriti jedna po jedna (CSS: `[data-reveal] .w`). Tekst ostaje običan za čitače. */
export function Words({ text }: { text: string }) {
  return (
    <>
      {text.split(" ").map((w, i, a) => (
        <span key={`${w}-${i}`}>
          <span className="w" style={{ ["--i" as string]: i }}>{w}</span>
          {i < a.length - 1 ? " " : ""}
        </span>
      ))}
    </>
  );
}
