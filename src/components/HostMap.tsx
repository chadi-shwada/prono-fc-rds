"use client";

import { useEffect, useMemo, useState } from "react";
import { geoAlbers, geoPath, type GeoProjection } from "d3-geo";
import { feature } from "topojson-client";
import { AnimatePresence, motion } from "motion/react";
import Flag from "@/components/Flag";
import { HOST_CITIES, type HostCity } from "@/lib/hostCities";

const VB_W = 900;
const VB_H = 520;

/* eslint-disable @typescript-eslint/no-explicit-any */
type GeoData = {
  states: any[];
  usNation: any;
  canada: any;
  mexico: any;
} | null;

export default function HostMap() {
  const [geo, setGeo] = useState<GeoData>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/maps/states-10m.json").then((r) => r.json()),
      fetch("/maps/countries-110m.json").then((r) => r.json()),
    ])
      .then(([us, world]) => {
        if (cancelled) return;
        const states = (feature(us, us.objects.states) as any).features;
        const nationFC = feature(us, us.objects.nation) as any;
        const usNation = nationFC.features ? nationFC.features[0] : nationFC;
        const countries = (feature(world, world.objects.countries) as any)
          .features;
        const byName = (n: string) =>
          countries.find((f: any) => f.properties?.name === n);
        setGeo({
          states,
          usNation,
          canada: byName("Canada"),
          mexico: byName("Mexico"),
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const { path, projection } = useMemo(() => {
    if (!geo) return { path: null, projection: null as GeoProjection | null };
    const proj = geoAlbers().rotate([96, 0]).parallels([29.5, 45.5]);
    // Cadrage serré sur la zone des villes hôtes (le reste du continent est rogné).
    const cityPoints = {
      type: "FeatureCollection",
      features: HOST_CITIES.map((c) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: c.coord },
        properties: {},
      })),
    };
    // Padding asymétrique : marge à droite pour les libellés des villes de l'Est.
    proj.fitExtent(
      [
        [60, 55],
        [VB_W - 120, VB_H - 45],
      ],
      cityPoints as any,
    );
    return { path: geoPath(proj), projection: proj };
  }, [geo]);

  const active = HOST_CITIES.find((c) => c.id === activeId) ?? null;

  return (
    <div
      className="relative w-full overflow-hidden rounded-3xl border border-white/10"
      style={{
        aspectRatio: `${VB_W} / ${VB_H}`,
        background:
          "radial-gradient(120% 95% at 12% 8%, #0b3b34 0%, #0c2740 36%, #0a1426 66%, #060a13 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute -bottom-1/3 -left-1/4 h-3/4 w-3/4 rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, #2dd4bf, transparent 70%)" }}
      />

      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="absolute inset-0 h-full w-full">
        {path && geo && (
          <g
            style={{ vectorEffect: "non-scaling-stroke" }}
            fill="#070b16"
            fillOpacity={0.92}
          >
            {geo.canada && (
              <path
                d={path(geo.canada) ?? undefined}
                stroke="rgba(45,212,191,0.3)"
                strokeWidth={0.75}
                style={{ vectorEffect: "non-scaling-stroke" }}
              />
            )}
            {geo.mexico && (
              <path
                d={path(geo.mexico) ?? undefined}
                stroke="rgba(45,212,191,0.3)"
                strokeWidth={0.75}
                style={{ vectorEffect: "non-scaling-stroke" }}
              />
            )}
            {geo.states.map((s, i) => (
              <path
                key={i}
                d={path(s) ?? undefined}
                stroke="rgba(94,234,212,0.35)"
                strokeWidth={0.75}
                style={{ vectorEffect: "non-scaling-stroke" }}
              />
            ))}
          </g>
        )}
      </svg>

      {!geo && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-white/60">
          Chargement de la carte…
        </div>
      )}

      {projection &&
        HOST_CITIES.map((c) => {
          const p = projection(c.coord);
          if (!p) return null;
          return (
            <Marker
              key={c.id}
              city={c}
              left={(p[0] / VB_W) * 100}
              top={(p[1] / VB_H) * 100}
              active={c.id === activeId}
              onEnter={() => setActiveId(c.id)}
              onLeave={() => setActiveId((id) => (id === c.id ? null : id))}
              onSelect={() => {
                setActiveId(c.id);
                document
                  .getElementById(`city-${c.id}`)
                  ?.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
            />
          );
        })}

      <AnimatePresence>
        {active &&
          projection &&
          (() => {
            const p = projection(active.coord);
            if (!p) return null;
            return (
              <InfoCard
                city={active}
                left={(p[0] / VB_W) * 100}
                top={(p[1] / VB_H) * 100}
              />
            );
          })()}
      </AnimatePresence>
    </div>
  );
}

function Marker({
  city,
  left,
  top,
  active,
  onEnter,
  onLeave,
  onSelect,
}: {
  city: HostCity;
  left: number;
  top: number;
  active: boolean;
  onEnter: () => void;
  onLeave: () => void;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onFocus={onEnter}
      onBlur={onLeave}
      onClick={onSelect}
      className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 outline-none"
      style={{ left: `${left}%`, top: `${top}%`, zIndex: active ? 30 : 10 }}
      aria-label={`${city.city} — ${city.matches} matchs`}
    >
      <motion.span
        animate={{ scale: active ? 1.25 : 1 }}
        className={`flex h-5 min-w-5 items-center justify-center rounded-md px-1 font-display text-[11px] font-extrabold shadow-md transition-colors ${
          active ? "bg-emerald-400 text-emerald-950" : "bg-white text-slate-900"
        }`}
      >
        {city.matches}
      </motion.span>
      <span
        className={`whitespace-nowrap rounded-md px-1.5 py-0.5 text-[10px] font-semibold transition-colors ${
          active ? "bg-white text-slate-900" : "bg-black/55 text-white"
        }`}
      >
        {city.city}
      </span>
    </button>
  );
}

function InfoCard({
  city,
  left,
  top,
}: {
  city: HostCity;
  left: number;
  top: number;
}) {
  const below = top < 42;
  return (
    <motion.div
      initial={{ opacity: 0, y: below ? -8 : 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.15 }}
      className="pointer-events-none absolute z-40 w-60"
      style={{
        left: `${Math.min(Math.max(left, 24), 76)}%`,
        top: `${top}%`,
        transform: `translate(-50%, ${below ? "26px" : "calc(-100% - 26px)"})`,
      }}
    >
      <div className="glass rounded-xl p-3 shadow-2xl shadow-black/50">
        <div className="flex items-center gap-2">
          <Flag code={city.countryCode} size={26} />
          <div>
            <div className="font-display text-sm font-bold leading-tight text-white">
              {city.city}
            </div>
            <div className="text-[11px] text-slate-400">{city.country}</div>
          </div>
          <span className="ml-auto rounded-md bg-emerald-400/20 px-2 py-0.5 font-display text-sm font-extrabold text-emerald-300">
            {city.matches}
          </span>
        </div>
        <div className="mt-2 space-y-0.5 text-[11px] text-slate-300">
          <div>🏟️ {city.stadium}</div>
          <div>👥 {city.capacity.toLocaleString("fr-FR")} places</div>
        </div>
        {city.note && (
          <div className="mt-2 rounded-md bg-amber-400/10 px-2 py-1 text-[11px] font-medium text-amber-200">
            {city.note}
          </div>
        )}
      </div>
    </motion.div>
  );
}
