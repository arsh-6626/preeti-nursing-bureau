/**
 * Renders admin-edited plain text safely (no HTML): blank lines separate
 * paragraphs and lines starting with "## " become headings.
 */
export function PlainText({ text }: { text: string }) {
  const blocks = text.replace(/\r\n/g, "\n").split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className="max-w-[66ch] text-[18px] leading-[1.75] text-text">
      {blocks.map((block, i) => {
        if (block.startsWith("## ")) {
          const [heading, ...rest] = block.split("\n");
          return (
            <div key={i}>
              <h2 className="mb-3 mt-12 text-2xl font-display font-bold tracking-[-0.015em] text-text">{heading.slice(3)}</h2>
              {rest.length > 0 && <p className="text-text-2">{rest.join(" ")}</p>}
            </div>
          );
        }
        return (
          <p key={i} className="mt-5 text-text-2 first:mt-0">
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
