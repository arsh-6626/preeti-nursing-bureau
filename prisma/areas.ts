// Localities the bureau takes requests from. The original NCR list keeps its
// pincodes; localities added from the bureau's list (2026-10-17) have none.
const ORIGINAL: Record<string, [string, string | null][]> = {
  Delhi: [
    ["Dwarka", "110075"], ["Rohini", "110085"], ["Janakpuri", "110058"], ["Lajpat Nagar", "110024"],
    ["Saket", "110017"], ["Vasant Kunj", "110070"], ["Mayur Vihar", "110091"], ["Pitampura", "110034"],
    ["Greater Kailash", "110048"], ["Karol Bagh", "110005"],
  ],
  Noida: [["Sector 62", "201309"], ["Sector 18", "201301"], ["Sector 50", "201301"], ["Sector 137", "201305"]],
  "Greater Noida": [["Alpha 1", "201310"], ["Greater Noida West", "201318"]],
  Ghaziabad: [["Indirapuram", "201014"], ["Vaishali", "201010"], ["Raj Nagar Extension", "201017"]],
  Gurugram: [["DLF Phase 1", "122002"], ["Sohna Road", "122018"], ["Sector 56", "122011"], ["Golf Course Road", "122002"]],
  Faridabad: [["Sector 15", "121007"], ["Greater Faridabad", "121002"]],
};

const ADDED: Record<string, string[]> = {
  Delhi: [
    "Kamla Nagar", "Civil Lines", "Ashok Vihar", "Dr Mukherjee Nagar", "Karol Bagh",
    "Tri Nagar", "Pahar Ganj", "Old Rajender Nagar", "West Patel Nagar", "Darya Ganj",
    "Shalimar Bagh", "Connaught Place", "Kirti Nagar", "Yamuna Vihar", "Pitampura",
    "Rashtrapati Bhavan", "Nirman Bhawan", "Paschim Vihar", "Inderpuri", "Punjabi Bagh",
    "Union Public Service Commission", "Naraina", "Mangolpuri", "Rajouri Garden", "Satya Niketan",
    "Laxmi Nagar", "Dilshad Garden", "Mayapuri", "Delhi Cantt", "Rohini",
    "Rohini Sector 16", "Nehru Place", "Lajpat Nagar", "Janakpuri", "Dwarka",
    "NDC Kalkaji",
  ],
  Ghaziabad: ["Vaishali"],
  Gurugram: ["Sohna Road"],
};

export const AREAS: Record<string, [string, string | null][]> = Object.fromEntries(
  Object.entries(ORIGINAL).map(([city, list]) => {
    const known = new Set(list.map(([locality]) => locality));
    const extra = (ADDED[city] ?? []).filter((l) => !known.has(l)).map((l): [string, string | null] => [l, null]);
    return [city, [...list, ...extra]];
  }),
);
