/** DTOs mirroring the Spring Boot API (co.thetapa.*). */

export type DpbTag = "DHARMA" | "PRATHA" | "BHRANTI" | "MIXED";

export interface Dpb {
  classification: DpbTag;
  confidenceScore?: number;
  sourceName?: string;
  sourceRef?: string;
  sourceClass?: string;
  confidenceNote?: string;
  prathaScope?: string;
}

export type BlockType =
  | "INTRO"
  | "ORIGIN"
  | "SIGNIFICANCE_QUOTE"
  | "SANKALPA"
  | "SAMAGRI"
  | "VIDHI"
  | "MANTRA"
  | "FASTING"
  | "KATHA"
  | "MYTHS"
  | "QA"
  | "PROSE";

export interface VidhiStep {
  number: number;
  title: string;
  description?: string;
  note?: string;
  dpb?: Dpb;
  mantraChip?: string;
}

export interface SamagriItem {
  name: string;
  note?: string;
  optional: boolean;
}

export interface Myth {
  question: string;
  answer: string;
}

export interface Mantra {
  devanagari: string;
  transliteration: string;
  meaning?: string;
  defaultCount: number;
  presets: number[];
  audioEnMediaId?: string;
  audioHiMediaId?: string;
}

export interface Sankalpa {
  devanagari: string;
  transliteration: string;
  gloss?: string;
}

export interface FastingForm {
  name: string;
  description: string;
  recommended: boolean;
}

export interface Block {
  type: BlockType;
  title?: string;
  text?: string;
  steps?: VidhiStep[];
  samagri?: SamagriItem[];
  myths?: Myth[];
  mantra?: Mantra;
  sankalpa?: Sankalpa;
  fasting?: FastingForm[];
  meta?: Record<string, string>;
}

export interface ArticleContent {
  title: string;
  heroSubtitle?: string;
  deck?: string;
  introHtml?: string;
  blocks: Block[];
  audioGuideMediaId?: string;
}

export interface Article {
  slug: string;
  type: "RITUAL_GUIDE" | "DHARMIC_CONCEPT" | "BEGINNER_GUIDE" | "FESTIVAL_GUIDE";
  status: string;
  category: string;
  subCategory?: string;
  lang: { en: ArticleContent; hi?: ArticleContent };
  dpb?: Dpb;
  heroImageId?: string;
  hueClass?: string;
  readMinutes?: number;
  observanceDate?: string;
  linkedObservanceSlug?: string;
  relatedSlugs?: string[];
  isFeatured?: boolean;
  publishedAt?: string;
}

export interface GlossaryTerm {
  slug: string;
  term: string;
  devanagari?: string;
  transliteration?: string;
  definition: string;
  definitionHi?: string;
  category: "MATERIAL" | "PRACTICE" | "TIME_CALENDAR" | "TEXT_TERM";
  language?: "SANSKRIT" | "HINDI";
  conceptArticleSlug?: string;
}

export interface PanchangWindow {
  name: string;
  endsAt?: string;
}

export interface TimeRange {
  from: string;
  to: string;
}

export interface PanchangDay {
  date: string;
  city: string;
  tithi?: PanchangWindow;
  paksha?: string;
  lunarMonth?: string;
  nakshatra?: PanchangWindow;
  yoga?: string;
  karana?: string;
  sunrise?: string;
  sunset?: string;
  moonrise?: string;
  moonset?: string;
  rahuKaal?: TimeRange;
  abhijitMuhurat?: TimeRange;
  muhurats?: { label: string; from: string; to: string; kind: string }[];
  verified: boolean;
  source?: string;
}

export interface DayPayload {
  day: PanchangDay | null;
  stale: boolean;
  verified: boolean;
}

export type ObservanceType =
  | "VRAT"
  | "FESTIVAL"
  | "SPECIAL_SEASONAL"
  | "PURNIMA_AMAVASYA"
  | "ECLIPSE";

export interface Observance {
  slug: string;
  name: string;
  nameHi?: string;
  type: ObservanceType;
  series?: string;
  seriesPosition?: string;
  date: string;
  endDate?: string;
  tithiLabel?: string;
  deity?: string;
  seasonBlock?: string;
  blurb?: string;
  articleSlug?: string;
  notes?: string[];
  verified: boolean;
}

export interface UpcomingObservance {
  observance: Observance;
  countdownDays: number;
}

export interface Paged<T> {
  items: T[];
  page: number;
  totalPages: number;
  totalItems: number;
}
