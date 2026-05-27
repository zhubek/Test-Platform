// In-memory mock of the Methodic backend API.
// Mirrors the shape of profwise2's HTTP api.ts (same exported types and
// fetch/create/update/delete function signatures) but backed by module-level
// arrays instead of fetch(). State persists for the lifetime of the page load.

import { professionDetails } from "@/app/professions/_components/mock-data";

export interface Localized {
  en: string;
  ru: string;
  kz: string;
}

const now = () => new Date().toISOString();
let SEQ = 1000;
const nextId = () => ++SEQ;
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
const delay = <T>(v: T): Promise<T> => Promise.resolve(clone(v));

// ───────────────────────── City ─────────────────────────
export interface CityRow {
  id: number;
  name: Localized;
  createdAt: string;
  updatedAt: string;
  _count?: { universities: number; colleges: number };
}
export interface CityInput {
  name: Localized;
}

// ─────────────────────── University ──────────────────────
export interface UniversityParams {
  address?: Localized;
  email?: string;
  phone?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  youtube?: string;
  photo?: string;
  grant?: boolean;
}
export interface UniversityRow {
  id: number;
  name: Localized;
  cityId: number | null;
  city: CityRow | null;
  type: string | null;
  params: UniversityParams | null;
  createdAt: string;
  updatedAt: string;
}
export interface UniversityInput {
  name: Localized;
  cityId?: number;
  type?: string;
  params?: UniversityParams;
}

// ───────────────────────── College ───────────────────────
export interface CollegeParams {
  address?: Localized;
  email?: string;
  phone?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  youtube?: string;
  photo?: string;
}
export interface CollegeRow {
  id: number;
  name: Localized;
  cityId: number | null;
  city: CityRow | null;
  type: string | null;
  params: CollegeParams | null;
  createdAt: string;
  updatedAt: string;
}
export interface CollegeInput {
  name: Localized;
  cityId?: number;
  type?: string;
  params?: CollegeParams;
}

// ─────────────────── University Program ───────────────────
export interface UniverProgramUniversity {
  id: number;
  grant: boolean;
}
export interface UniverProgramParams {
  subjects?: Localized;
  points?: Record<string, number[]>;
  universities?: UniverProgramUniversity[];
}
export interface UniverProgramRow {
  id: number;
  name: Localized;
  code: string | null;
  subjects: Localized | null;
  params: UniverProgramParams | null;
  createdAt: string;
  updatedAt: string;
}
export interface UniverProgramInput {
  name: Localized;
  code?: string;
  subjects?: Localized;
  params?: UniverProgramParams;
}

// ──────────────────── College Program ─────────────────────
export interface CollegeProgramCollege {
  id: number;
  duration: Localized;
}
export interface CollegeProgramParams {
  colleges?: CollegeProgramCollege[];
}
export interface CollegeProgramRow {
  id: number;
  name: Localized;
  code: string | null;
  params: CollegeProgramParams | null;
  createdAt: string;
  updatedAt: string;
}
export interface CollegeProgramInput {
  name: Localized;
  code?: string;
  params?: CollegeProgramParams;
}

// ─────────────────── Characteristic Type ──────────────────
export interface CharacteristicRow {
  id: number;
  name: Localized;
  desc: Localized | null;
  characteristicTypeId: number;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface CharacteristicTypeRow {
  id: number;
  name: Localized;
  desc: Localized | null;
  color: string | null;
  archived: boolean;
  params: any;
  characteristics: CharacteristicRow[];
  createdAt: string;
  updatedAt: string;
}
export interface CharacteristicTypeInput {
  name: Localized;
  desc?: Localized;
  color?: string;
  params?: any;
}
export interface CharacteristicInput {
  name: Localized;
  desc?: Localized;
  characteristicTypeId: number;
}

// ─────────────────── Profession Group ─────────────────────
export interface ProfessionGroupRow {
  id: number;
  name: Localized;
  desc: Localized | null;
  _count?: { professions: number };
  createdAt: string;
  updatedAt: string;
}
export interface ProfessionGroupInput {
  name: Localized;
  desc?: Localized;
}

// ───────────────────────── Profession ─────────────────────
export interface ProfessionParams {
  description?: any;
  education?: any;
  labor_market?: any;
  content?: any;
  [key: string]: any;
}
export interface ProfessionRow {
  id: number;
  name: Localized;
  desc: Localized | null;
  popular: boolean;
  complexityLevel: string | null;
  code: string | null;
  profGroupId: number | null;
  profGroup: ProfessionGroupRow | null;
  params: ProfessionParams | null;
  createdAt: string;
  updatedAt: string;
}
export interface ProfessionInput {
  name: Localized;
  desc?: Localized;
  popular?: boolean;
  complexityLevel?: string;
  code?: string;
  profGroupId?: number | null;
  params?: ProfessionParams;
}

// ─────────────── Profession Characteristic ────────────────
export interface ProfessionCharacteristicRow {
  id: number;
  professionId: number;
  characteristicTypeId: number;
  characteristicId: number;
  level: number;
  characteristic: CharacteristicRow;
  characteristicType: CharacteristicTypeRow;
  createdAt: string;
  updatedAt: string;
}

// ═══════════════════════ Seed data ════════════════════════
const ts = { createdAt: now(), updatedAt: now() };
const L = (en: string, ru = "", kz = ""): Localized => ({ en, ru, kz });

const cities: CityRow[] = [
  { id: 1, name: L("Almaty", "Алматы", "Алматы"), ...ts },
  { id: 2, name: L("Astana", "Астана", "Астана"), ...ts },
  { id: 3, name: L("Shymkent", "Шымкент", "Шымкент"), ...ts },
  { id: 4, name: L("Karaganda", "Караганда", "Қарағанды"), ...ts },
];

const universities: UniversityRow[] = [
  { id: 1, name: L("Nazarbayev University", "Назарбаев Университет", "Назарбаев Университеті"), cityId: 2, city: cities[1], type: "public", params: { website: "https://nu.edu.kz", email: "info@nu.edu.kz", phone: "+7 7172 70 66 88", grant: true }, ...ts },
  { id: 2, name: L("al-Farabi KazNU", "КазНУ им. аль-Фараби", "әл-Фараби ат. ҚазҰУ"), cityId: 1, city: cities[0], type: "public", params: { website: "https://kaznu.kz" }, ...ts },
  { id: 3, name: L("KBTU", "КБТУ", "ҚБТУ"), cityId: 1, city: cities[0], type: "private", params: { website: "https://kbtu.kz" }, ...ts },
  { id: 4, name: L("KIMEP University", "Университет КИМЭП", "КИМЭП Университеті"), cityId: 1, city: cities[0], type: "private", params: {}, ...ts },
];

const colleges: CollegeRow[] = [
  { id: 1, name: L("Almaty IT College", "Алматинский IT-колледж", "Алматы IT колледжі"), cityId: 1, city: cities[0], type: "public", params: { website: "https://aitc.kz" }, ...ts },
  { id: 2, name: L("Astana Medical College", "Астанинский медколледж", "Астана медколледжі"), cityId: 2, city: cities[1], type: "public", params: {}, ...ts },
];

const univerPrograms: UniverProgramRow[] = [
  { id: 1, name: L("Computer Science", "Информатика", "Информатика"), code: "6B06103", subjects: L("Math, Physics", "Математика, Физика", "Математика, Физика"), params: { subjects: L("Math, Physics", "Математика, Физика"), points: { "2024": [120, 130, 140] }, universities: [{ id: 1, grant: true }, { id: 3, grant: false }] }, ...ts },
  { id: 2, name: L("General Medicine", "Общая медицина", "Жалпы медицина"), code: "6B10101", subjects: L("Biology, Chemistry", "Биология, Химия", "Биология, Химия"), params: { subjects: L("Biology, Chemistry", "Биология, Химия"), universities: [{ id: 2, grant: true }] }, ...ts },
  { id: 3, name: L("Economics", "Экономика", "Экономика"), code: "6B04101", subjects: L("Math, Geography", "Математика, География", "Математика, География"), params: { universities: [] }, ...ts },
];

const collegePrograms: CollegeProgramRow[] = [
  { id: 1, name: L("Software Development", "Разработка ПО", "БҚ әзірлеу"), code: "06120100", params: { colleges: [{ id: 1, duration: L("2 years 10 months", "2 года 10 месяцев", "2 жыл 10 ай") }] }, ...ts },
  { id: 2, name: L("Nursing", "Сестринское дело", "Мейіргер ісі"), code: "09110100", params: { colleges: [{ id: 2, duration: L("3 years 10 months", "3 года 10 месяцев", "3 жыл 10 ай") }] }, ...ts },
];

function mkCharacteristic(id: number, typeId: number, en: string, ru: string, kz: string): CharacteristicRow {
  return { id, characteristicTypeId: typeId, name: L(en, ru, kz), desc: null, archived: false, ...ts };
}
const characteristicTypes: CharacteristicTypeRow[] = [
  {
    id: 1, name: L("Interests (RIASEC)", "Интересы (RIASEC)", "Қызығушылықтар (RIASEC)"), color: "#0d9488",
    desc: L("Holland vocational interest dimensions.", "Профессиональные интересы по Холланду."), archived: false, params: null,
    characteristics: [
      mkCharacteristic(11, 1, "Realistic", "Реалистичный", "Реалистік"),
      mkCharacteristic(12, 1, "Investigative", "Исследовательский", "Зерттеушілік"),
      mkCharacteristic(13, 1, "Artistic", "Артистичный", "Көркемдік"),
      mkCharacteristic(14, 1, "Social", "Социальный", "Әлеуметтік"),
      mkCharacteristic(15, 1, "Enterprising", "Предприимчивый", "Кәсіпкерлік"),
      mkCharacteristic(16, 1, "Conventional", "Традиционный", "Дәстүрлі"),
    ], ...ts,
  },
  {
    id: 2, name: L("Skills", "Навыки", "Дағдылар"), color: "#6366f1", desc: null, archived: false, params: null,
    characteristics: [
      mkCharacteristic(21, 2, "Communication", "Коммуникация", "Қарым-қатынас"),
      mkCharacteristic(22, 2, "Analytical", "Аналитика", "Аналитика"),
      mkCharacteristic(23, 2, "Technical", "Технические", "Техникалық"),
      mkCharacteristic(24, 2, "Leadership", "Лидерство", "Көшбасшылық"),
      mkCharacteristic(25, 2, "Creativity", "Креативность", "Креативтілік"),
    ], ...ts,
  },
  {
    id: 3, name: L("Big Five", "Большая пятёрка", "Үлкен бестік"), color: "#ea580c",
    desc: L("OCEAN personality traits.", "Черты личности OCEAN."), archived: false, params: null,
    characteristics: [
      mkCharacteristic(31, 3, "Openness", "Открытость", "Ашықтық"),
      mkCharacteristic(32, 3, "Conscientiousness", "Сознательность", "Жауапкершілік"),
      mkCharacteristic(33, 3, "Extraversion", "Экстраверсия", "Экстраверсия"),
      mkCharacteristic(34, 3, "Agreeableness", "Доброжелательность", "Мейірімділік"),
      mkCharacteristic(35, 3, "Neuroticism", "Нейротизм", "Нейротизм"),
    ], ...ts,
  },
];

const professionGroups: ProfessionGroupRow[] = [
  { id: 1, name: L("Technology", "Технологии", "Технологиялар"), desc: null, ...ts },
  { id: 2, name: L("Healthcare", "Здравоохранение", "Денсаулық сақтау"), desc: null, ...ts },
  { id: 3, name: L("Education", "Образование", "Білім беру"), desc: null, ...ts },
  { id: 4, name: L("Business", "Бизнес", "Бизнес"), desc: null, ...ts },
  { id: 5, name: L("Creative Arts", "Творчество", "Шығармашылық"), desc: null, ...ts },
  { id: 6, name: L("Science", "Наука", "Ғылым"), desc: null, ...ts },
];
const grp = (id: number) => professionGroups.find((g) => g.id === id) ?? null;

// Seed profession #1 with the fully-populated Data Scientist detail so the
// editor previews render real charts/lists.
const dsDetail = professionDetails[1];
const professions: ProfessionRow[] = [
  { id: 1, name: L("Data Scientist", "Дата-сайентист"), desc: L("Analyze complex data to drive business decisions", "Анализ сложных данных для принятия бизнес-решений"), popular: true, complexityLevel: "high", code: "DS-401", profGroupId: 1, profGroup: grp(1), params: { description: dsDetail?.description, education: dsDetail?.education, labor_market: dsDetail?.laborMarket, content: dsDetail?.content }, ...ts },
  { id: 2, name: L("Registered Nurse", "Медсестра/медбрат"), desc: L("Provide patient care and coordinate treatments", "Уход за пациентами и координация лечения"), popular: true, complexityLevel: "medium", code: "HC-201", profGroupId: 2, profGroup: grp(2), params: {}, ...ts },
  { id: 3, name: L("High School Teacher", "Учитель старших классов"), desc: null, popular: false, complexityLevel: "medium", code: "ED-105", profGroupId: 3, profGroup: grp(3), params: {}, ...ts },
  { id: 4, name: L("Marketing Manager", "Менеджер по маркетингу"), desc: null, popular: true, complexityLevel: "medium", code: "BU-302", profGroupId: 4, profGroup: grp(4), params: {}, ...ts },
  { id: 5, name: L("Graphic Designer", "Графический дизайнер"), desc: null, popular: false, complexityLevel: "low", code: "CA-110", profGroupId: 5, profGroup: grp(5), params: {}, ...ts },
  { id: 6, name: L("Biomedical Researcher", "Биомедицинский исследователь"), desc: null, popular: false, complexityLevel: "high", code: "SC-501", profGroupId: 6, profGroup: grp(6), params: {}, ...ts },
  { id: 7, name: L("Software Engineer", "Инженер-программист"), desc: null, popular: true, complexityLevel: "high", code: "DS-402", profGroupId: 1, profGroup: grp(1), params: {}, ...ts },
];

const professionCharacteristics: ProfessionCharacteristicRow[] = [];

// ═══════════════════ Generic helpers ══════════════════════
function findOr404<T extends { id: number }>(arr: T[], id: number, label: string): T {
  const row = arr.find((r) => r.id === id);
  if (!row) throw new Error(`${label} ${id} not found`);
  return row;
}

// ═══════════════════════ City CRUD ════════════════════════
export const fetchCities = () => delay(cities);
export const fetchCity = (id: number) => delay(findOr404(cities, id, "City"));
export function createCity(data: CityInput): Promise<CityRow> {
  const row: CityRow = { id: nextId(), name: data.name, createdAt: now(), updatedAt: now() };
  cities.push(row);
  return delay(row);
}
export function updateCity(id: number, data: Partial<CityInput>): Promise<CityRow> {
  const row = findOr404(cities, id, "City");
  Object.assign(row, data, { updatedAt: now() });
  return delay(row);
}
export function deleteCity(id: number): Promise<void> {
  const i = cities.findIndex((c) => c.id === id);
  if (i >= 0) cities.splice(i, 1);
  return Promise.resolve();
}

// ════════════════════ University CRUD ═════════════════════
export const fetchUniversities = () => delay(universities);
export const fetchUniversity = (id: number) => delay(findOr404(universities, id, "University"));
export function createUniversity(data: UniversityInput): Promise<UniversityRow> {
  const city = data.cityId ? cities.find((c) => c.id === data.cityId) ?? null : null;
  const row: UniversityRow = { id: nextId(), name: data.name, cityId: data.cityId ?? null, city, type: data.type ?? null, params: data.params ?? null, createdAt: now(), updatedAt: now() };
  universities.push(row);
  return delay(row);
}
export function updateUniversity(id: number, data: Partial<UniversityInput>): Promise<UniversityRow> {
  const row = findOr404(universities, id, "University");
  Object.assign(row, data, { updatedAt: now() });
  if (data.cityId !== undefined) row.city = cities.find((c) => c.id === data.cityId) ?? null;
  return delay(row);
}
export function deleteUniversity(id: number): Promise<void> {
  const i = universities.findIndex((u) => u.id === id);
  if (i >= 0) universities.splice(i, 1);
  return Promise.resolve();
}

// ════════════════════════ College CRUD ════════════════════
export const fetchColleges = () => delay(colleges);
export const fetchCollege = (id: number) => delay(findOr404(colleges, id, "College"));
export function createCollege(data: CollegeInput): Promise<CollegeRow> {
  const city = data.cityId ? cities.find((c) => c.id === data.cityId) ?? null : null;
  const row: CollegeRow = { id: nextId(), name: data.name, cityId: data.cityId ?? null, city, type: data.type ?? null, params: data.params ?? null, createdAt: now(), updatedAt: now() };
  colleges.push(row);
  return delay(row);
}
export function updateCollege(id: number, data: Partial<CollegeInput>): Promise<CollegeRow> {
  const row = findOr404(colleges, id, "College");
  Object.assign(row, data, { updatedAt: now() });
  if (data.cityId !== undefined) row.city = cities.find((c) => c.id === data.cityId) ?? null;
  return delay(row);
}
export function deleteCollege(id: number): Promise<void> {
  const i = colleges.findIndex((c) => c.id === id);
  if (i >= 0) colleges.splice(i, 1);
  return Promise.resolve();
}

// ═══════════════════ University Program CRUD ══════════════
export const fetchUniverPrograms = () => delay(univerPrograms);
export const fetchUniverProgram = (id: number) => delay(findOr404(univerPrograms, id, "UniverProgram"));
export function createUniverProgram(data: UniverProgramInput): Promise<UniverProgramRow> {
  const row: UniverProgramRow = { id: nextId(), name: data.name, code: data.code ?? null, subjects: data.subjects ?? null, params: data.params ?? null, createdAt: now(), updatedAt: now() };
  univerPrograms.push(row);
  return delay(row);
}
export function updateUniverProgram(id: number, data: Partial<UniverProgramInput>): Promise<UniverProgramRow> {
  const row = findOr404(univerPrograms, id, "UniverProgram");
  Object.assign(row, data, { updatedAt: now() });
  return delay(row);
}
export function deleteUniverProgram(id: number): Promise<void> {
  const i = univerPrograms.findIndex((p) => p.id === id);
  if (i >= 0) univerPrograms.splice(i, 1);
  return Promise.resolve();
}

// ═══════════════════ College Program CRUD ═════════════════
export const fetchCollegePrograms = () => delay(collegePrograms);
export const fetchCollegeProgram = (id: number) => delay(findOr404(collegePrograms, id, "CollegeProgram"));
export function createCollegeProgram(data: CollegeProgramInput): Promise<CollegeProgramRow> {
  const row: CollegeProgramRow = { id: nextId(), name: data.name, code: data.code ?? null, params: data.params ?? null, createdAt: now(), updatedAt: now() };
  collegePrograms.push(row);
  return delay(row);
}
export function updateCollegeProgram(id: number, data: Partial<CollegeProgramInput>): Promise<CollegeProgramRow> {
  const row = findOr404(collegePrograms, id, "CollegeProgram");
  Object.assign(row, data, { updatedAt: now() });
  return delay(row);
}
export function deleteCollegeProgram(id: number): Promise<void> {
  const i = collegePrograms.findIndex((p) => p.id === id);
  if (i >= 0) collegePrograms.splice(i, 1);
  return Promise.resolve();
}

// ═══════════════════ Characteristic Type CRUD ═════════════
export const fetchCharacteristicTypes = () => delay(characteristicTypes);
export const fetchCharacteristicType = (id: number) => delay(findOr404(characteristicTypes, id, "CharacteristicType"));
export function createCharacteristicType(data: CharacteristicTypeInput): Promise<CharacteristicTypeRow> {
  const row: CharacteristicTypeRow = { id: nextId(), name: data.name, desc: data.desc ?? null, color: data.color ?? null, archived: false, params: data.params ?? null, characteristics: [], createdAt: now(), updatedAt: now() };
  characteristicTypes.push(row);
  return delay(row);
}
export function updateCharacteristicType(id: number, data: Partial<CharacteristicTypeInput & { archived: boolean }>): Promise<CharacteristicTypeRow> {
  const row = findOr404(characteristicTypes, id, "CharacteristicType");
  Object.assign(row, data, { updatedAt: now() });
  return delay(row);
}

// ════════════════════ Characteristic CRUD ═════════════════
export function createCharacteristic(data: CharacteristicInput): Promise<CharacteristicRow> {
  const row: CharacteristicRow = { id: nextId(), name: data.name, desc: data.desc ?? null, characteristicTypeId: data.characteristicTypeId, archived: false, createdAt: now(), updatedAt: now() };
  const type = characteristicTypes.find((t) => t.id === data.characteristicTypeId);
  if (type) type.characteristics.push(row);
  return delay(row);
}
export function updateCharacteristic(id: number, data: Partial<CharacteristicInput & { archived: boolean }>): Promise<CharacteristicRow> {
  for (const type of characteristicTypes) {
    const row = type.characteristics.find((c) => c.id === id);
    if (row) {
      Object.assign(row, data, { updatedAt: now() });
      return delay(row);
    }
  }
  throw new Error(`Characteristic ${id} not found`);
}

// ═══════════════════ Profession Group CRUD ════════════════
export const fetchProfessionGroups = () => delay(professionGroups);
export function createProfessionGroup(data: ProfessionGroupInput): Promise<ProfessionGroupRow> {
  const row: ProfessionGroupRow = { id: nextId(), name: data.name, desc: data.desc ?? null, createdAt: now(), updatedAt: now() };
  professionGroups.push(row);
  return delay(row);
}
export function updateProfessionGroup(id: number, data: Partial<ProfessionGroupInput>): Promise<ProfessionGroupRow> {
  const row = findOr404(professionGroups, id, "ProfessionGroup");
  Object.assign(row, data, { updatedAt: now() });
  return delay(row);
}
export function deleteProfessionGroup(id: number): Promise<void> {
  const i = professionGroups.findIndex((g) => g.id === id);
  if (i >= 0) professionGroups.splice(i, 1);
  return Promise.resolve();
}

// ════════════════════════ Profession CRUD ═════════════════
export const fetchProfessions = () => delay(professions);
export const fetchProfession = (id: number) => delay(findOr404(professions, id, "Profession"));
export function createProfession(data: ProfessionInput): Promise<ProfessionRow> {
  const row: ProfessionRow = {
    id: nextId(),
    name: data.name,
    desc: data.desc ?? null,
    popular: data.popular ?? false,
    complexityLevel: data.complexityLevel ?? null,
    code: data.code ?? null,
    profGroupId: data.profGroupId ?? null,
    profGroup: data.profGroupId ? grp(data.profGroupId) : null,
    params: data.params ?? {},
    createdAt: now(),
    updatedAt: now(),
  };
  professions.push(row);
  return delay(row);
}
export function updateProfession(id: number, data: Partial<ProfessionInput>): Promise<ProfessionRow> {
  const row = findOr404(professions, id, "Profession");
  Object.assign(row, data, { updatedAt: now() });
  if (data.profGroupId !== undefined) row.profGroup = data.profGroupId ? grp(data.profGroupId) : null;
  return delay(row);
}
export function deleteProfession(id: number): Promise<void> {
  const i = professions.findIndex((p) => p.id === id);
  if (i >= 0) professions.splice(i, 1);
  return Promise.resolve();
}

// ═══════════════ Profession Characteristic CRUD ═══════════
export function fetchProfessionCharacteristics(professionId: number): Promise<ProfessionCharacteristicRow[]> {
  return delay(professionCharacteristics.filter((pc) => pc.professionId === professionId));
}
export function createProfessionCharacteristic(data: {
  professionId: number;
  characteristicTypeId: number;
  characteristicId: number;
  level?: number;
}): Promise<ProfessionCharacteristicRow> {
  const type = findOr404(characteristicTypes, data.characteristicTypeId, "CharacteristicType");
  const characteristic = type.characteristics.find((c) => c.id === data.characteristicId);
  if (!characteristic) throw new Error(`Characteristic ${data.characteristicId} not found`);
  const row: ProfessionCharacteristicRow = {
    id: nextId(),
    professionId: data.professionId,
    characteristicTypeId: data.characteristicTypeId,
    characteristicId: data.characteristicId,
    level: data.level ?? 0,
    characteristic,
    characteristicType: type,
    createdAt: now(),
    updatedAt: now(),
  };
  professionCharacteristics.push(row);
  return delay(row);
}
export function updateProfessionCharacteristic(id: number, data: { level?: number }): Promise<ProfessionCharacteristicRow> {
  const row = findOr404(professionCharacteristics, id, "ProfessionCharacteristic");
  Object.assign(row, data, { updatedAt: now() });
  return delay(row);
}
export function deleteProfessionCharacteristic(id: number): Promise<void> {
  const i = professionCharacteristics.findIndex((pc) => pc.id === id);
  if (i >= 0) professionCharacteristics.splice(i, 1);
  return Promise.resolve();
}
