import { fifaToIso } from "@/lib/flags";

type Props = {
  code?: string | null;
  /** Largeur en pixels (le ratio drapeau 4:3 est conservé). */
  size?: number;
  className?: string;
};

/** Drapeau d'une équipe, à partir de son code FIFA. Repli : pastille avec le code. */
export default function Flag({ code, size = 28, className = "" }: Props) {
  const iso = fifaToIso(code);
  const height = Math.round((size * 3) / 4);

  if (!iso) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded bg-white/10 text-[10px] font-bold tracking-wide text-slate-300 ${className}`}
        style={{ width: size, height }}
      >
        {code ?? "?"}
      </span>
    );
  }

  return (
    <span
      className={`inline-block overflow-hidden rounded shadow-sm ring-1 ring-black/20 ${className}`}
      style={{ width: size, height }}
    >
      <span
        className={`fi fi-${iso}`}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
    </span>
  );
}
