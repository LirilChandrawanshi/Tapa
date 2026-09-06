/**
 * "Corrects: …" strip — sits at the foot of a card or section and names
 * the bhranti the content corrects.
 */
export function MythStrip({
  myth,
  className = "",
}: {
  myth: string;
  className?: string;
}) {
  return (
    <div
      className={`border-t border-bhranti-bd bg-bhranti-bg px-[17px] py-[10px] text-[11.5px] leading-relaxed text-bhranti-fg ${className}`}
    >
      <b className="font-bold">Corrects:</b> {myth}
    </div>
  );
}
