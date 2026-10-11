/**
 * Renders admin-edited plain text safely (no HTML): blank lines separate
 * paragraphs and lines starting with "## " become headings.
 */
export function PlainText({ text }: { text: string }) {
  const blocks = text.replace(/\r\n/g, "\n").split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className="max-w-[66ch] text-[18px] leading-[1.75] text-ink-950">
      {blocks.map((block, i) => {
        if (block.startsWith("## ")) {
          const [heading, ...rest] = block.split("\n");
          return (
            <div key={i}>
              <h2 className="mb-3 mt-12 text-2xl font-semibold tracking-[-0.025em] text-ink-950">{heading.slice(3)}</h2>
              {rest.length > 0 && <p className="text-ink-700">{rest.join(" ")}</p>}
            </div>
          );
        }
        return (
          <p key={i} className="mt-5 text-ink-700 first:mt-0">
            {block.split("\n").map((line, j, arr) => (
              <span key={j}>
                {line}
                {j < arr.length - 1 && <br />}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}
