// Les 16 villes hôtes de la Coupe du Monde 2026 (États-Unis, Canada, Mexique).
// coord = [longitude, latitude] réelles (projetées sur la carte). matches = nb de rencontres.

export type HostCity = {
  id: string;
  city: string;
  country: "États-Unis" | "Canada" | "Mexique";
  countryCode: string; // code FIFA pour le drapeau
  stadium: string;
  capacity: number;
  matches: number;
  coord: [number, number];
  note?: string;
};

export const HOST_CITIES: HostCity[] = [
  { id: "van", city: "Vancouver", country: "Canada", countryCode: "CAN", stadium: "BC Place", capacity: 54500, matches: 7, coord: [-123.11, 49.28] },
  { id: "sea", city: "Seattle", country: "États-Unis", countryCode: "USA", stadium: "Lumen Field", capacity: 69000, matches: 6, coord: [-122.33, 47.6] },
  { id: "sfo", city: "San Francisco Bay Area", country: "États-Unis", countryCode: "USA", stadium: "Levi's Stadium", capacity: 68500, matches: 6, coord: [-121.97, 37.4] },
  { id: "lax", city: "Los Angeles", country: "États-Unis", countryCode: "USA", stadium: "SoFi Stadium", capacity: 70000, matches: 8, coord: [-118.34, 33.95] },
  { id: "tor", city: "Toronto", country: "Canada", countryCode: "CAN", stadium: "BMO Field", capacity: 45000, matches: 6, coord: [-79.42, 43.63] },
  { id: "bos", city: "Boston", country: "États-Unis", countryCode: "USA", stadium: "Gillette Stadium", capacity: 65000, matches: 7, coord: [-71.26, 42.09] },
  { id: "nyc", city: "New York / New Jersey", country: "États-Unis", countryCode: "USA", stadium: "MetLife Stadium", capacity: 82500, matches: 8, coord: [-74.07, 40.81], note: "🏆 Finale — 19 juillet 2026" },
  { id: "phi", city: "Philadelphie", country: "États-Unis", countryCode: "USA", stadium: "Lincoln Financial Field", capacity: 69000, matches: 6, coord: [-75.17, 39.9] },
  { id: "kan", city: "Kansas City", country: "États-Unis", countryCode: "USA", stadium: "Arrowhead Stadium", capacity: 76400, matches: 6, coord: [-94.48, 39.05] },
  { id: "atl", city: "Atlanta", country: "États-Unis", countryCode: "USA", stadium: "Mercedes-Benz Stadium", capacity: 71000, matches: 8, coord: [-84.4, 33.75] },
  { id: "dal", city: "Dallas", country: "États-Unis", countryCode: "USA", stadium: "AT&T Stadium", capacity: 80000, matches: 9, coord: [-97.09, 32.75], note: "⚽ Ville qui accueille le plus de matchs (9)" },
  { id: "hou", city: "Houston", country: "États-Unis", countryCode: "USA", stadium: "NRG Stadium", capacity: 72000, matches: 7, coord: [-95.41, 29.68] },
  { id: "mia", city: "Miami", country: "États-Unis", countryCode: "USA", stadium: "Hard Rock Stadium", capacity: 65000, matches: 7, coord: [-80.24, 25.96] },
  { id: "mon", city: "Monterrey", country: "Mexique", countryCode: "MEX", stadium: "Estadio BBVA", capacity: 53500, matches: 4, coord: [-100.24, 25.67] },
  { id: "gua", city: "Guadalajara", country: "Mexique", countryCode: "MEX", stadium: "Estadio Akron", capacity: 48000, matches: 4, coord: [-103.46, 20.68] },
  { id: "mex", city: "Mexico", country: "Mexique", countryCode: "MEX", stadium: "Estadio Azteca", capacity: 87000, matches: 5, coord: [-99.15, 19.4], note: "🎉 Match d'ouverture — 11 juin 2026" },
];
