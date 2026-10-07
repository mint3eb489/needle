/**
 * Postleitzahlen-Datenbank mit Echtzeit-Validierung und Autovervollständigung.
 * Fokus: Baden-Württemberg (ca. 100km Einzugsgebiet um Balingen 72336)
 */

export const PLZ_DATA: Record<string, string> = {
  // --- Zollernalbkreis ---
  "72336": "Balingen",
  "72348": "Rosenfeld",
  "72351": "Geislingen",
  "72355": "Schömberg",
  "72358": "Dormettingen",
  "72359": "Dotternhausen",
  "72365": "Ratshausen",
  "72367": "Weilen unter den Rinnen",
  "72369": "Zimmern unter der Burg",
  "72379": "Hechingen",
  "72393": "Burladingen",
  "72399": "Dautmergen",
  "72401": "Haigerloch",
  "72406": "Bisingen",
  "72411": "Bodelshausen",
  "72414": "Rangendingen",
  "72415": "Grosselfingen",
  "72417": "Jungingen",
  "72458": "Albstadt-Ebingen",
  "72459": "Albstadt-Tailfingen",
  "72461": "Albstadt",
  "72469": "Meßstetten",
  "72475": "Bitz",
  "72479": "Straßberg",

  // --- Tübingen ---
  "72070": "Tübingen",
  "72072": "Tübingen",
  "72074": "Tübingen",
  "72076": "Tübingen",
  "72108": "Rottenburg am Neckar",
  "72116": "Mössingen",
  "72119": "Ammerbuch",
  "72124": "Pliezhausen",
  "72127": "Kusterdingen",
  "72131": "Ofterdingen",
  "72141": "Walddorfhäslach",
  "72144": "Dußlingen",
  "72145": "Hirrlingen",
  "72147": "Nehren",
  "72149": "Neustetten",

  // --- Reutlingen ---
  "72760": "Reutlingen",
  "72762": "Reutlingen",
  "72764": "Reutlingen",
  "72766": "Reutlingen",
  "72768": "Reutlingen",
  "72770": "Reutlingen",
  "72525": "Münsingen",
  "72555": "Metzingen",
  "72574": "Bad Urach",
  "72581": "Dettingen an der Erms",
  "72584": "Hülben",
  "72585": "Riederich",
  "72587": "Grabenstetten",
  "72589": "Westerheim",
  "72800": "Eningen unter Achalm",
  "72805": "Lichtenstein",
  "72810": "Gomaringen",
  "72813": "St. Johann",
  "72818": "Trochtelfingen",
  "72820": "Sonnenbühl",
  "72824": "Engstingen",
  "72827": "Wannweil",
  "72829": "Engstingen",

  // --- Rottweil ---
  "78628": "Rottweil",
  "78652": "Deißlingen",
  "78655": "Dunningen",
  "78658": "Zimmern ob Rottweil",
  "78661": "Dietingen",
  "78662": "Bösingen",
  "78664": "Eschbronn",
  "78665": "Frittlingen",
  "78667": "Villingendorf",
  "78669": "Wellendingen",
  "78713": "Schramberg",
  "78727": "Oberndorf am Neckar",
  "78730": "Lauterbach",
  "78733": "Aichhalden",
  "78736": "Epfendorf",
  "78737": "Fluorn-Winzeln",
  "78739": "Hardt",

  // --- Sigmaringen ---
  "72488": "Sigmaringen",
  "72501": "Gammertingen",
  "72513": "Hettingen",
  "72514": "Inzigkofen",
  "72516": "Scheer",
  "72517": "Sigmaringendorf",
  "72519": "Veringenstadt",
  "74405": "Gaildorf",
  "88348": "Bad Saulgau",
  "88356": "Ostrach",
  "88367": "Hohentengen",
  "88512": "Mengen",
  "88518": "Herbertingen",
  "88521": "Ertingen",
  "88605": "Meßkirch",
  "88630": "Pfullendorf",

  // --- Tuttlingen ---
  "78532": "Tuttlingen",
  "78542": "Spaichingen",
  "78554": "Aldingen",
  "78559": "Gosheim",
  "78564": "Wehingen",
  "78567": "Fridingen an der Donau",
  "78570": "Mühlheim an der Donau",
  "78573": "Wurmlingen",
  "78576": "Emmingen-Liptingen",
  "78579": "Neuhausen ob Eck",
  "78582": "Balgheim",
  "78583": "Böttingen",
  "78585": "Bubsheim",
  "78586": "Deilingen",
  "78588": "Denkingen",
  "78589": "Dürbheim",
  "78591": "Durchhausen",
  "78594": "Gunningen",
  "78595": "Hausen ob Verena",
  "78597": "Irndorf",
  "78599": "Mahlstetten",

  // --- Freudenstadt & Horb ---
  "72160": "Horb am Neckar",
  "72172": "Sulz am Neckar",
  "72175": "Dornhan",
  "72178": "Waldachtal",
  "72186": "Empfingen / Starzach",
  "72189": "Vöhringen",
  "72250": "Freudenstadt",
  "72253": "Freudenstadt",
  "72280": "Llossburg",
  "72285": "Pfalzgrafenweiler",
  "72290": "Loßburg",
  "72296": "Schopfloch",

  // --- Böblingen & Sindelfingen ---
  "71032": "Böblingen",
  "71034": "Böblingen",
  "71063": "Sindelfingen",
  "71065": "Sindelfingen",
  "71067": "Sindelfingen",
  "71069": "Sindelfingen",
  "71083": "Herrenberg",
  "71088": "Holzgerlingen",
  "71093": "Weil im Schönbuch",
  "71101": "Schönaich",
  "71106": "Magstadt",
  "71111": "Waldenbuch",
  "71116": "Gärtringen",
  "71120": "Grafenau",
  "71126": "Gäufelden",
  "71131": "Jettingen",
  "71134": "Aidlingen",
  "71139": "Ehningen",
  "71144": "Steinenbronn",
  "71149": "Bondorf",
  "71155": "Altdorf",
  "71157": "Hildrizhausen",
  "71159": "Nufringen",

  // --- Calw & Nordschwarzwald ---
  "75365": "Calw",
  "75378": "Bad Liebenzell",
  "75382": "Althengstett",
  "75387": "Neubulach",
  "75389": "Neuweiler",
  "75391": "Gechingen",
  "75392": "Deckenpfronn",
  "75395": "Ostelsheim",
  "75397": "Simmozheim",
  "75428": "Illingen",

  // --- Stuttgart & Esslingen ---
  "70173": "Stuttgart",
  "70174": "Stuttgart",
  "70176": "Stuttgart",
  "70178": "Stuttgart",
  "70180": "Stuttgart",
  "70182": "Stuttgart",
  "70184": "Stuttgart",
  "70186": "Stuttgart",
  "70188": "Stuttgart",
  "70190": "Stuttgart",
  "70191": "Stuttgart",
  "70192": "Stuttgart",
  "70193": "Stuttgart",
  "70195": "Stuttgart",
  "70197": "Stuttgart",
  "70199": "Stuttgart",
  "70327": "Stuttgart-Wangen",
  "70372": "Stuttgart-Bad Cannstatt",
  "70435": "Stuttgart-Zuffenhausen",
  "70563": "Stuttgart-Vaihingen",
  "70565": "Stuttgart-Möhringen",
  "70567": "Stuttgart-Möhringen",
  "70569": "Stuttgart-Vaihingen",
  "70597": "Stuttgart-Degerloch",
  "70599": "Stuttgart-Plieningen",
  "70734": "Fellbach",
  "70736": "Fellbach",
  "70771": "Leinfelden-Echterdingen",
  "70794": "Filderstadt",
  "71124": "Sindelfingen-Maichingen",
  "72622": "Nürtingen",
  "73728": "Esslingen am Neckar",
  "73730": "Esslingen",
  "73732": "Esslingen",
  "73733": "Esslingen",
  "73734": "Esslingen",
  "73760": "Ostfildern",
  "73765": "Neuhausen auf den Fildern",
  "73770": "Denkendorf",
  "73773": "Aichtal",
  "73776": "Altbach",
  "73779": "Deizisau",

  // --- Villingen-Schwenningen & Schwarzwald-Baar ---
  "78048": "Villingen-Schwenningen",
  "78050": "Villingen-Schwenningen",
  "78052": "Villingen-Schwenningen",
  "78054": "Villingen-Schwenningen",
  "78056": "Villingen-Schwenningen",
  "78073": "Bad Dürrheim",
  "78078": "Niedereschach",
  "78083": "Dauchingen",
  "78086": "Brigachtal",
  "78087": "Mönchweiler",
  "78089": "Unterkirnach",
  "78098": "Triberg im Schwarzwald",
  "78112": "St. Georgen im Schwarzwald",
  "78120": "Furtwangen im Schwarzwald",
  "78141": "Schönwald im Schwarzwald",
  "78166": "Donaueschingen",
  "78176": "Blumberg",
  "78184": "Bräunlingen",
  "78194": "Hüfingen",
  "78199": "Bräunlingen"
};

export interface AutoCompleteResult {
  isValid: boolean;         // Handelt es sich um ein valides PLZ-Format?
  plz?: string;             // Die extrahierte PLZ (z.B. "72336")
  city?: string;            // Die zugehörige Stadt (z.B. "Balingen")
  isWithinRange: boolean;   // Liegt der Ort im 100km Einzugsgebiet?
  normalized: string;       // Schön formatierter Text: "72336 Balingen"
  message?: string;         // Infotext für UI-Feedback
}

/**
 * Kernfunktion zur Eingabeverarbeitung.
 * Unterstützt:
 * - Direkte PLZ (z.B. "72336" -> "72336 Balingen")
 * - PLZ mit bereits getipptem Namen (z.B. "72336 Baling" -> "72336 Balingen")
 * - Nur Stadtname (z.B. "Balingen" -> "72336 Balingen")
 */
export function processCityInput(input: string): AutoCompleteResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { isValid: false, isWithinRange: true, normalized: "" };
  }

  // 1. Regulärer Ausdruck extrahiert jede 5-stellige Zahlenfolge
  const plzMatch = trimmed.match(/\b\d{5}\b/);
  const plz = plzMatch ? plzMatch[0] : undefined;

  // Textteil isolieren (Gegenteil von Zahlen, bereinigt um Sonderzeichen)
  const rawTextPart = trimmed
    .replace(/\b\d{5}\b/g, "")
    .replace(/[^a-zA-ZäöüÄÖÜß\s\-\/]/g, "")
    .trim();

  // A: Wenn eine PLZ vorliegt, prüfen wir unsere Datenbank
  if (plz) {
    const knownCity = PLZ_DATA[plz];
    if (knownCity) {
      return {
        isValid: true,
        plz,
        city: knownCity,
        isWithinRange: true,
        normalized: `${plz} ${knownCity}`,
        message: "✓ Lieferregion erfolgreich zugeordnet (Gebiet Balingen ±100km)"
      };
    } else {
      // Wenn PLZ nicht exakt erfasst, aber geographisch im richtigen Bundesland liegt
      // (Baden-Württemberg PLZs starten typischerweise mit 7..., oder 88..., 89..., 78...)
      const isGeographicBaudenWuerttemberg =
        plz.startsWith("7") ||
        plz.startsWith("88") ||
        plz.startsWith("89") ||
        plz.startsWith("78") ||
        plz.startsWith("79");

      if (isGeographicBaudenWuerttemberg) {
        const assumedCity = rawTextPart || "";
        return {
          isValid: true,
          plz,
          city: assumedCity,
          isWithinRange: true,
          normalized: assumedCity ? `${plz} ${assumedCity}` : plz,
          message: "✓ Gültige PLZ in Baden-Württemberg."
        };
      } else {
        // Außerhalb des baden-württembergischen Kernbereichs (>100km Entfernung)
        const assumedCity = rawTextPart || "";
        return {
          isValid: true,
          plz,
          city: assumedCity,
          isWithinRange: false,
          normalized: assumedCity ? `${plz} ${assumedCity}` : plz,
          message: "⚠ Achtung: Lieferort außerhalb des 100km Einzugsgebiets um Balingen!"
        };
      }
    }
  }

  // B: Wenn nur ein Stadtname eingegeben wurde, durchsuchen wir die Datenbank
  if (rawTextPart.length >= 2) {
    const query = rawTextPart.toLowerCase();
    
    const matches = Object.entries(PLZ_DATA).filter(([_, cityName]) =>
      cityName.toLowerCase().includes(query)
    );

    if (matches.length > 0) {
      // Exakten Treffer priorisieren, sonst den ersten Teiltreffer nehmen
      const perfectMatch = matches.find(([_, cityName]) => cityName.toLowerCase() === query);
      const [matchedPlz, matchedCity] = perfectMatch || matches[0];

      return {
        isValid: true,
        plz: matchedPlz,
        city: matchedCity,
        isWithinRange: true,
        normalized: `${matchedPlz} ${matchedCity}`,
        message: matches.length > 1 ? `Vorschlag: ${matchedPlz} ${matchedCity}` : "✓ Lieferregion ergänzt"
      };
    }
  }

  // Fallback für unfertige Eingaben
  const looksLikeZip = /^\d+$/.test(trimmed);
  if (looksLikeZip && trimmed.length < 5) {
    return {
      isValid: false,
      isWithinRange: true,
      normalized: trimmed,
      message: "Geben Sie eine 5-stellige Postleitzahl ein..."
    };
  }

  return {
    isValid: rawTextPart.length > 0,
    isWithinRange: false,
    normalized: trimmed,
    message: trimmed.length > 5 ? "Geben Sie einen bekannten Lieferort oder PLZ ein." : undefined
  };
}

/**
 * Erzeugt Vorschläge im Format "PLZ Stadt" für Dropdown-Listen oder <datalist>
 */
export function getPlzSuggestions(query: string): string[] {
  const q = query.toLowerCase().trim();
  if (!q) {
    // Standard-Zentren vorschlagen, wenn noch nichts eingetippt wurde:
    return [
      "72336 Balingen",
      "72458 Albstadt-Ebingen",
      "72459 Albstadt-Tailfingen",
      "72379 Hechingen",
      "72406 Bisingen",
      "72348 Rosenfeld",
      "72351 Geislingen",
      "72355 Schömberg",
      "72108 Rottenburg am Neckar",
      "72072 Tübingen",
      "72764 Reutlingen",
      "78628 Rottweil",
      "78532 Tuttlingen",
      "72160 Horb am Neckar",
      "72488 Sigmaringen",
      "71032 Böblingen"
    ];
  }

  const results: string[] = [];
  for (const [plz, city] of Object.entries(PLZ_DATA)) {
    if (plz.includes(q) || city.toLowerCase().includes(q)) {
      results.push(`${plz} ${city}`);
    }
  }

  // Für gute Usability auf maximal 15 Vorschläge limitieren
  return results.slice(0, 15);
}
