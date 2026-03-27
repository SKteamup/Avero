/* =============================================
   DUMMYDATA — Investorplattform v1
   ============================================= */

const OBJEKTER = [
  {
    id: "obj-001",
    tittel: "Ekebergveien 14",
    adresse: "Ekebergveien 14, 0192 Oslo",
    by: "Oslo",
    fylke: "Oslo",
    type: "Leilighet",
    strategi: "utleie",
    rom: 3,
    areal: 72,
    etasje: "3. etasje",
    byggeaar: 1987,
    prisantydning: 4200000,
    fellesgjeld: 420000,
    totalPris: 4620000,
    felleskostnader: 2800,
    leieinntektEstimat: 14500,
    yieldEstimat: 5.2,
    nettoYield: 3.0,
    kontantstroemEstimat: 2340,
    eierform: "Andel",
    tilstand: "God stand",
    utleiepotensial: "Høyt",
    investorScore: 74,
    status: "Publisert",
    premium: false,
    bilder: [
      "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800&q=80",
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80",
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80"
    ],
    meglerNavn: "Morten Hagen",
    meglerFirma: "DNB Eiendom Oslo",
    meglerId: "megler-001",
    originalAnnonse: "#",
    lagt_til: "2024-11-15",
    beskrivelse: "Pen og gjennomgående 3-roms leilighet beliggende i 3. etasje i et godt vedlikeholdt borettslag på Ekeberg. Solfylt balkong med utsikt over fjorden. Kort vei til T-bane og buss.",
    fasiliteter: ["Balkong", "Heis", "Sykkelbod", "Felles vaskeri", "P-plass"],
    nabolag: { kollektiv: "8 min til Ekebergbanen", butikk: "250m til nærmeste dagligvare", skole: "Ekeberg skole 600m", snittprisOmrade: 67500 }
  },
  {
    id: "obj-002",
    tittel: "Holmenveien 3",
    adresse: "Holmenveien 3, 0374 Oslo",
    by: "Oslo",
    fylke: "Oslo",
    type: "Tomannsbolig",
    strategi: "flipp",
    rom: 5,
    areal: 148,
    etasje: "2-etasjes",
    byggeaar: 1962,
    prisantydning: 6800000,
    fellesgjeld: 0,
    totalPris: 6800000,
    felleskostnader: 0,
    leieinntektEstimat: 0,
    yieldEstimat: null,
    nettoYield: null,
    kontantstroemEstimat: null,
    rehabKostnad: 850000,
    estimertSalgsverdi: 8900000,
    bruttoFortjeneste: 1250000,
    flipROI: 16.3,
    eierform: "Selveier",
    tilstand: "Oppussing nødvendig",
    utleiepotensial: "Middels",
    investorScore: 68,
    status: "Publisert",
    premium: false,
    bilder: [
      "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80"
    ],
    meglerNavn: "Silje Andreassen",
    meglerFirma: "Krogsveen Majorstuen",
    meglerId: "megler-002",
    originalAnnonse: "#",
    lagt_til: "2024-11-18",
    beskrivelse: "Solid tomannsbolig på Holmen med stort potensial. Behov for oppussing, men strukturelt i god stand. Tomten er 480m² med garasje. Estimert rehab-kostnad kr 850 000 for full renovering.",
    fasiliteter: ["Garasje", "Stor tomt", "Kjeller", "Terrasse", "Rolig gate"],
    nabolag: { kollektiv: "12 min til T-bane Stortinget", butikk: "350m til Meny", skole: "Røa skole 800m", snittprisOmrade: 62000 }
  },
  {
    id: "obj-003",
    tittel: "Nydalsveien 18B",
    adresse: "Nydalsveien 18B, 0484 Oslo",
    by: "Oslo",
    fylke: "Oslo",
    type: "Leilighet",
    strategi: "utleie",
    rom: 2,
    areal: 48,
    etasje: "5. etasje",
    byggeaar: 2018,
    prisantydning: 3450000,
    fellesgjeld: 280000,
    totalPris: 3730000,
    felleskostnader: 3200,
    leieinntektEstimat: 13000,
    yieldEstimat: 4.8,
    nettoYield: 3.2,
    kontantstroemEstimat: 1240,
    eierform: "Andel",
    tilstand: "Nyoppusset",
    utleiepotensial: "Svært høyt",
    investorScore: 71,
    status: "Publisert",
    premium: false,
    bilder: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
      "https://images.unsplash.com/photo-1556020685-ae41abfc9365?w=800&q=80",
      "https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?w=800&q=80"
    ],
    meglerNavn: "Anders Bakke",
    meglerFirma: "Eie Eiendom Nydalen",
    meglerId: "megler-003",
    originalAnnonse: "#",
    lagt_til: "2024-11-20",
    beskrivelse: "Moderne 2-roms i Nydalen, et av Oslos mest populære utleiemarkeder. Høy etterspørsel fra studenter og unge yrkesaktive grunnet nærhet til BI og Nydalen næringspark.",
    fasiliteter: ["Takstudio", "Heis", "Sykkelparkering", "Felles takterrasse"],
    nabolag: { kollektiv: "5 min til T-bane Nydalen", butikk: "180m til Kiwi", skole: "BI Nydalen 300m", snittprisOmrade: 71000 }
  },
  {
    id: "obj-004",
    tittel: "Storgata 22",
    adresse: "Storgata 22, 5015 Bergen",
    by: "Bergen",
    fylke: "Vestland",
    type: "Leilighet",
    strategi: "utleie",
    rom: 2,
    areal: 55,
    etasje: "2. etasje",
    byggeaar: 1975,
    prisantydning: 2800000,
    fellesgjeld: 185000,
    totalPris: 2985000,
    felleskostnader: 2100,
    leieinntektEstimat: 12500,
    yieldEstimat: 5.7,
    nettoYield: 4.2,
    kontantstroemEstimat: 2850,
    eierform: "Andel",
    tilstand: "God stand",
    utleiepotensial: "Høyt",
    investorScore: 79,
    status: "Publisert",
    premium: false,
    bilder: [
      "https://images.unsplash.com/photo-1555636222-cae831e670b3?w=800&q=80",
      "https://images.unsplash.com/photo-1560440021-33f9b867899d?w=800&q=80",
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80"
    ],
    meglerNavn: "Kristian Lie",
    meglerFirma: "Aktiv Bergen Sentrum",
    meglerId: "megler-004",
    originalAnnonse: "#",
    lagt_til: "2024-11-22",
    beskrivelse: "Sentralt beliggende 2-roms i Bergen sentrum. Stabil utleieetterspørsel fra studenter ved UiB og Handelshøyskolen. Oppdatert kjøkken og bad.",
    fasiliteter: ["Balkong", "Bod", "Felles vaskeri"],
    nabolag: { kollektiv: "6 min til Bryggen", butikk: "100m til Rema 1000", skole: "UiB 800m", snittprisOmrade: 52000 }
  },
  {
    id: "obj-005",
    tittel: "Nedre Elvehavn 7",
    adresse: "Nedre Elvehavn 7, 7042 Trondheim",
    by: "Trondheim",
    fylke: "Trøndelag",
    type: "Leilighet",
    strategi: "utleie",
    rom: 3,
    areal: 68,
    etasje: "4. etasje",
    byggeaar: 2015,
    prisantydning: 3900000,
    fellesgjeld: 320000,
    totalPris: 4220000,
    felleskostnader: 3600,
    leieinntektEstimat: 15500,
    yieldEstimat: 5.4,
    nettoYield: 3.4,
    kontantstroemEstimat: 2710,
    eierform: "Selveier",
    tilstand: "Nyoppusset",
    utleiepotensial: "Svært høyt",
    investorScore: 82,
    status: "Publisert",
    premium: true,
    bilder: [
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80",
      "https://images.unsplash.com/photo-1613545325278-f24b0cae1224?w=800&q=80",
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80"
    ],
    meglerNavn: "Hanne Mikkelsen",
    meglerFirma: "EiendomsMegler 1 Trondheim",
    meglerId: "megler-005",
    originalAnnonse: "#",
    lagt_til: "2024-11-25",
    beskrivelse: "Premium 3-roms ved Nedre Elvehavn. Moderne leilighet med høy standard, parkettgulv og store vinduer. Nær NTNU og Høgskolen.",
    fasiliteter: ["Terrasse", "Fjordutsikt", "Heis", "Garasjeplass", "Concierge"],
    nabolag: { kollektiv: "3 min til buss Nedre Elvehavn", butikk: "200m til dagligvare", skole: "NTNU 1.5km", snittprisOmrade: 58000 }
  },
  {
    id: "obj-006",
    tittel: "Kongens gate 5",
    adresse: "Kongens gate 5, 4006 Stavanger",
    by: "Stavanger",
    fylke: "Rogaland",
    type: "Næringseiendom",
    strategi: "utleie",
    rom: 0,
    areal: 210,
    etasje: "1. etasje",
    byggeaar: 1998,
    prisantydning: 8500000,
    fellesgjeld: 0,
    totalPris: 8500000,
    felleskostnader: 0,
    leieinntektEstimat: 42000,
    yieldEstimat: 5.9,
    nettoYield: 5.9,
    kontantstroemEstimat: 18400,
    eierform: "Selveier",
    tilstand: "God stand",
    utleiepotensial: "Høyt",
    investorScore: 87,
    status: "Publisert",
    premium: true,
    bilder: [
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800&q=80",
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&q=80"
    ],
    meglerNavn: "Jan Petter Sørensen",
    meglerFirma: "Næringsmegling Vest AS",
    meglerId: "megler-006",
    originalAnnonse: "#",
    lagt_til: "2024-11-28",
    beskrivelse: "Sentrumsnær næringseiendom i Stavanger med leietaker på plass. Leiekontrakt løper til 2027 med opsjon. Stabil yield uten aktiv forvaltning.",
    fasiliteter: ["Lager", "Parkeringskjeller", "Varemottak", "Sentralvarme"],
    nabolag: { kollektiv: "5 min til Stavanger stasjon", butikk: "Sentrum", skole: "N/A", snittprisOmrade: 40000 }
  },
  {
    id: "obj-007",
    tittel: "Sandakerveien 41",
    adresse: "Sandakerveien 41, 0477 Oslo",
    by: "Oslo",
    fylke: "Oslo",
    type: "Enebolig",
    strategi: "flipp",
    rom: 6,
    areal: 192,
    etasje: "2-etasjes",
    byggeaar: 1958,
    prisantydning: 7200000,
    fellesgjeld: 0,
    totalPris: 7200000,
    felleskostnader: 0,
    leieinntektEstimat: 0,
    yieldEstimat: null,
    nettoYield: null,
    kontantstroemEstimat: null,
    rehabKostnad: 1200000,
    estimertSalgsverdi: 10200000,
    bruttoFortjeneste: 1800000,
    flipROI: 21.4,
    eierform: "Selveier",
    tilstand: "Oppussing nødvendig",
    utleiepotensial: "Lavt",
    investorScore: 76,
    status: "Publisert",
    premium: false,
    bilder: [
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80",
      "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&q=80",
      "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&q=80"
    ],
    meglerNavn: "Marianne Dahl",
    meglerFirma: "PrivatMegleren Oslo Nord",
    meglerId: "megler-007",
    originalAnnonse: "#",
    lagt_til: "2024-12-01",
    beskrivelse: "Stor enebolig på Sandaker med stort oppgraderingspotensial. Tomt 620m² med garasje. Nærliggende boliger solgt for over 10M etter renovering.",
    fasiliteter: ["Stor tomt", "Dobbel garasje", "Utebod", "Terrasse", "Kjeller"],
    nabolag: { kollektiv: "10 min til T-bane", butikk: "400m til Coop Extra", skole: "Grefsen skole 700m", snittprisOmrade: 68000 }
  },
  {
    id: "obj-008",
    tittel: "Brugata 8",
    adresse: "Brugata 8, 0186 Oslo",
    by: "Oslo",
    fylke: "Oslo",
    type: "Leilighet",
    strategi: "utleie",
    rom: 1,
    areal: 32,
    etasje: "1. etasje",
    byggeaar: 1925,
    prisantydning: 2100000,
    fellesgjeld: 98000,
    totalPris: 2198000,
    felleskostnader: 1800,
    leieinntektEstimat: 9500,
    yieldEstimat: 5.5,
    nettoYield: 4.2,
    kontantstroemEstimat: 980,
    eierform: "Aksje",
    tilstand: "Noe slitasje",
    utleiepotensial: "Høyt",
    investorScore: 66,
    status: "Publisert",
    premium: false,
    bilder: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
      "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800&q=80",
      "https://images.unsplash.com/photo-1617104551722-3b2d51366e82?w=800&q=80"
    ],
    meglerNavn: "Espen Vold",
    meglerFirma: "Nordvik Grünerløkka",
    meglerId: "megler-008",
    originalAnnonse: "#",
    lagt_til: "2024-12-03",
    beskrivelse: "Koselig 1-roms i populære Grünerløkka. Pusset opp kjøkken og bad. Høy utleieetterspørsel. Lavt inngangsbeløp og attraktivt første investeringsobjekt.",
    fasiliteter: ["Bod", "Sykkelparkering"],
    nabolag: { kollektiv: "7 min til T-bane Grønland", butikk: "150m til Kiwi", skole: "UiO 1.2km", snittprisOmrade: 69000 }
  }
];

const LAGREDE_SOK = [
  { id: "search-001", navn: "Oslo — Utleie 4M+", dato: "2024-11-20", filter: { by: "Oslo", strategi: "utleie", maxPris: 4000000, minYield: 5 }, antallTreff: 14, filterTekst: "Oslo · Utleie · Under 4M · Yield 5%+" },
  { id: "search-002", navn: "Bergen flipp-objekter", dato: "2024-11-28", filter: { by: "Bergen", strategi: "flipp" }, antallTreff: 6, filterTekst: "Bergen · Flipp" },
  { id: "search-003", navn: "Trondheim alle typer", dato: "2024-12-01", filter: { by: "Trondheim" }, antallTreff: 21, filterTekst: "Trondheim · Alle strategier" }
];

const FAVORITTER = ["obj-001", "obj-003", "obj-005"];

const BRUKERE = [
  { id: "usr-001", navn: "Kari Nordmann", epost: "kari@example.com", plan: "Pro", dato: "2024-10-15", status: "Aktiv" },
  { id: "usr-002", navn: "Ole Hansen", epost: "ole@example.com", plan: "Investor", dato: "2024-10-22", status: "Aktiv" },
  { id: "usr-003", navn: "Maja Holm", epost: "maja@example.com", plan: "Gratis", dato: "2024-11-05", status: "Aktiv" },
  { id: "usr-004", navn: "Torben Larsen", epost: "torben@example.com", plan: "Pro", dato: "2024-11-12", status: "Aktiv" },
  { id: "usr-005", navn: "Ingrid Bakke", epost: "ingrid@example.com", plan: "Gratis", dato: "2024-11-18", status: "Inaktiv" },
  { id: "usr-006", navn: "Sindre Moe", epost: "sindre@example.com", plan: "Investor", dato: "2024-11-25", status: "Aktiv" },
  { id: "usr-007", navn: "Ragnhild Dahl", epost: "ragnhild@example.com", plan: "Pro", dato: "2024-12-01", status: "Aktiv" }
];

// ── Hjelpefunksjoner ──────────────────────────────────────────────

function formaterPris(tall) {
  if (!tall && tall !== 0) return "—";
  if (tall >= 1000000) return (tall / 1000000).toFixed(1).replace('.', ',') + ' M';
  return tall.toLocaleString('no-NO') + ' kr';
}

function formaterKr(tall) {
  if (!tall && tall !== 0) return "—";
  const prefix = tall > 0 ? '+' : '';
  return prefix + tall.toLocaleString('no-NO') + ' kr';
}

function formaterYield(prosent) {
  if (!prosent && prosent !== 0) return "—";
  return prosent.toFixed(1).replace('.', ',') + '%';
}

function yieldKlasse(prosent) {
  if (!prosent) return '';
  if (prosent >= 5) return 'val-good';
  if (prosent >= 4) return 'val-ok';
  return 'val-low';
}

function scoreKlasse(score) {
  if (!score) return '';
  if (score >= 80) return 'score-high';
  if (score >= 65) return 'score-mid';
  return 'score-low';
}

function kontantstroemKlasse(cf) {
  if (!cf && cf !== 0) return '';
  if (cf > 0) return 'val-good';
  if (cf === 0) return 'val-ok';
  return 'val-low';
}

function hentObjektById(id) {
  return OBJEKTER.find(o => o.id === id) || null;
}

function erFavoritt(id) { return FAVORITTER.includes(id); }

function toggleFavoritt(id) {
  const idx = FAVORITTER.indexOf(id);
  if (idx === -1) { FAVORITTER.push(id); return true; }
  FAVORITTER.splice(idx, 1); return false;
}

function strategiBadge(strategi) {
  if (strategi === 'utleie') return '<span class="badge badge-navy">Utleie</span>';
  if (strategi === 'flipp') return '<span class="badge badge-gold">Flipp</span>';
  return '<span class="badge badge-gray">—</span>';
}

function premiumBadgeHTML() {
  return `<span class="badge badge-gold"><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style="margin-right:2px"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>Pro</span>`;
}