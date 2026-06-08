import Flag from "@/components/Flag";

/** Bandeau de drapeaux qui défile en boucle (décor). */
export default function FlagsMarquee({
  codes,
  zigzag = false,
}: {
  codes: string[];
  zigzag?: boolean;
}) {
  const doubled = [...codes, ...codes];
  return (
    <div className="marquee w-full">
      <div
        className={`marquee-track flex w-max gap-3 ${
          zigzag ? "flags-zigzag items-center py-4" : ""
        }`}
      >
        {doubled.map((c, i) => (
          <Flag key={i} code={c} size={30} className="shrink-0 opacity-80" />
        ))}
      </div>
    </div>
  );
}
