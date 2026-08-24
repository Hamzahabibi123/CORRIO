export interface AddressSuggestion {
  id: string;
  label: string;
}

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

// Suggerimenti di indirizzo mentre l'utente digita — usa Nominatim
// (OpenStreetMap), gratuito e senza bisogno di una chiave API (a differenza di
// Google Places/Mapbox). Ricerca testuale con bias sull'Italia dato che
// l'app/i dati di esempio sono italiani. Qualità dei risultati migliora
// scrivendo anche il nome della città (es. "via Fratelli Rosselli, Milano").
export async function searchAddressSuggestions(query: string): Promise<AddressSuggestion[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  const params = new URLSearchParams({
    q,
    format: 'jsonv2',
    addressdetails: '0',
    limit: '6',
    countrycodes: 'it',
    'accept-language': 'it',
  });
  try {
    const resp = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
      headers: {
        'Accept-Language': 'it',
        // Nominatim richiede un User-Agent identificativo (policy d'uso) —
        // RN/iOS non permette sempre di sovrascrivere l'header di default,
        // ma lo impostiamo comunque per rispettare la policy dove possibile.
        'User-Agent': 'CorrioApp/1.0 (autocompletamento indirizzo consegna)',
      },
    });
    if (!resp.ok) return [];
    const data = await resp.json();
    if (!Array.isArray(data)) return [];
    const seen = new Set<string>();
    const results: AddressSuggestion[] = [];
    for (const item of data) {
      const label = typeof item?.display_name === 'string' ? item.display_name : null;
      if (!label || seen.has(label)) continue;
      seen.add(label);
      results.push({ id: String(item.place_id ?? label), label });
    }
    return results;
  } catch {
    return [];
  }
}
