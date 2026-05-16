export type SkillbookStatus = 'integriert' | 'bereit' | 'wird-geprueft' | 'geplant' | 'gesperrt';

export type SkillbookKategorie =
  | 'Systemkern'
  | 'Agentensteuerung'
  | 'Lernen & Verbesserung'
  | 'Sicherheit'
  | 'Automatisierung / n8n'
  | 'Notion & Wissen'
  | 'Recherche & Nachrichten'
  | 'YouTube & Content'
  | 'Leadgen & Sales'
  | 'Trading-Forschung'
  | 'UI & Produkt'
  | 'Lokale Modelle'
  | 'Kostenoptimierung';

export type SkillbookAuswirkungen = {
  geschwindigkeit: number;
  qualitaet: number;
  kostenersparnis: number;
  autonomie: number;
  sicherheit: number;
  risiko: number;
  wartungsaufwand: number;
};

export type SkillbookPerk = {
  id: string;
  name: string;
  kategorie: SkillbookKategorie;
  kapitel: string;
  status: SkillbookStatus;
  stufe: number;
  prioritaet: 'Niedrig' | 'Mittel' | 'Hoch';
  schwierigkeit: 'Leicht' | 'Mittel' | 'Hoch';
  voraussetzungen: string[];
  kurzbeschreibung: string;
  warumWichtig: string;
  freischaltBedingungen: string[];
  nachFreischaltung: string[];
  nutzen: string[];
  risiken: string[];
  naechsteForschung: string[];
  quelle: string;
  auswirkungen: SkillbookAuswirkungen;
  position: { x: number; y: number };
};
