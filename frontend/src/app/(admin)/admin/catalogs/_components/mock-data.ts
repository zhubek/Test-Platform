import { type Localized, l } from "@/lib/localized";

// In-memory mock catalogs (ported from the previous app's "Methodic" feature).
// Frontend-only; mirrors the entity shapes the backend will eventually serve.

export type Complexity = "low" | "medium" | "high";

export interface ProfessionGroup {
  id: number;
  name: Localized;
}

export interface Profession {
  id: number;
  name: Localized;
  desc?: Localized;
  code?: string;
  popular: boolean;
  complexityLevel: Complexity;
  groupId: number | null;
}

export interface CharacteristicItem {
  id: number;
  name: Localized;
}
export interface CharacteristicType {
  id: number;
  name: Localized;
  desc?: Localized;
  color: string;
  characteristics: CharacteristicItem[];
}

export interface University {
  id: number;
  name: Localized;
  city?: Localized;
  code?: string;
}
export interface College {
  id: number;
  name: Localized;
  city?: Localized;
  code?: string;
}
export interface EduProgram {
  id: number;
  name: Localized;
  code?: string;
  degree?: Localized;
}
export interface City {
  id: number;
  name: Localized;
  region?: Localized;
}

// ── Seed data ────────────────────────────────────────────────────
export const professionGroups: ProfessionGroup[] = [
  { id: 1, name: l("Technology", "Технологии", "Технологиялар") },
  { id: 2, name: l("Healthcare", "Здравоохранение", "Денсаулық сақтау") },
  { id: 3, name: l("Education", "Образование", "Білім беру") },
  { id: 4, name: l("Business", "Бизнес", "Бизнес") },
  { id: 5, name: l("Creative Arts", "Творчество", "Шығармашылық") },
  { id: 6, name: l("Science", "Наука", "Ғылым") },
];

export const professions: Profession[] = [
  { id: 101, name: l("Software Engineer", "Инженер-программист", "Бағдарламашы инженер"), code: "2512", popular: true, complexityLevel: "high", groupId: 1, desc: l("Designs and builds software systems.", "Проектирует и создаёт программные системы.") },
  { id: 102, name: l("Doctor", "Врач", "Дәрігер"), code: "2211", popular: true, complexityLevel: "high", groupId: 2 },
  { id: 103, name: l("Teacher", "Учитель", "Мұғалім"), code: "2330", popular: true, complexityLevel: "medium", groupId: 3 },
  { id: 104, name: l("Graphic Designer", "Графический дизайнер", "Графикалық дизайнер"), code: "2166", popular: false, complexityLevel: "medium", groupId: 5 },
  { id: 105, name: l("Entrepreneur", "Предприниматель", "Кәсіпкер"), code: "1120", popular: true, complexityLevel: "high", groupId: 4 },
  { id: 106, name: l("Accountant", "Бухгалтер", "Бухгалтер"), code: "2411", popular: false, complexityLevel: "medium", groupId: 4 },
  { id: 107, name: l("Research Scientist", "Научный сотрудник", "Ғылыми қызметкер"), code: "2113", popular: false, complexityLevel: "high", groupId: 6 },
  { id: 108, name: l("Nurse", "Медсестра", "Медбике"), code: "2221", popular: false, complexityLevel: "medium", groupId: 2 },
];

export const characteristicTypes: CharacteristicType[] = [
  {
    id: 1, name: l("Interests (RIASEC)", "Интересы (RIASEC)", "Қызығушылықтар (RIASEC)"), color: "#0d9488",
    desc: l("Holland vocational interest dimensions.", "Профессиональные интересы по Холланду."),
    characteristics: [
      { id: 11, name: l("Realistic", "Реалистичный", "Реалистік") },
      { id: 12, name: l("Investigative", "Исследовательский", "Зерттеушілік") },
      { id: 13, name: l("Artistic", "Артистичный", "Көркемдік") },
      { id: 14, name: l("Social", "Социальный", "Әлеуметтік") },
      { id: 15, name: l("Enterprising", "Предприимчивый", "Кәсіпкерлік") },
      { id: 16, name: l("Conventional", "Традиционный", "Дәстүрлі") },
    ],
  },
  {
    id: 2, name: l("Skills", "Навыки", "Дағдылар"), color: "#6366f1",
    characteristics: [
      { id: 21, name: l("Communication", "Коммуникация", "Қарым-қатынас") },
      { id: 22, name: l("Analytical", "Аналитика", "Аналитика") },
      { id: 23, name: l("Technical", "Технические", "Техникалық") },
      { id: 24, name: l("Leadership", "Лидерство", "Көшбасшылық") },
      { id: 25, name: l("Creativity", "Креативность", "Креативтілік") },
    ],
  },
  {
    id: 3, name: l("Big Five", "Большая пятёрка", "Үлкен бестік"), color: "#ea580c",
    desc: l("OCEAN personality traits.", "Черты личности OCEAN."),
    characteristics: [
      { id: 31, name: l("Openness", "Открытость", "Ашықтық") },
      { id: 32, name: l("Conscientiousness", "Сознательность", "Жауапкершілік") },
      { id: 33, name: l("Extraversion", "Экстраверсия", "Экстраверсия") },
      { id: 34, name: l("Agreeableness", "Доброжелательность", "Мейірімділік") },
      { id: 35, name: l("Neuroticism", "Нейротизм", "Нейротизм") },
    ],
  },
];

export const universities: University[] = [
  { id: 1, name: l("Nazarbayev University", "Назарбаев Университет", "Назарбаев Университеті"), city: l("Astana", "Астана", "Астана"), code: "NU" },
  { id: 2, name: l("KazNU", "КазНУ им. аль-Фараби", "әл-Фараби ат. ҚазҰУ"), city: l("Almaty", "Алматы", "Алматы"), code: "KAZNU" },
  { id: 3, name: l("KBTU", "КБТУ", "ҚБТУ"), city: l("Almaty", "Алматы", "Алматы"), code: "KBTU" },
];

export const colleges: College[] = [
  { id: 1, name: l("Almaty IT College", "Алматинский IT-колледж", "Алматы IT колледжі"), city: l("Almaty", "Алматы", "Алматы"), code: "AITC" },
  { id: 2, name: l("Astana Medical College", "Астанинский медколледж", "Астана медколледжі"), city: l("Astana", "Астана", "Астана"), code: "AMC" },
];

export const univerPrograms: EduProgram[] = [
  { id: 1, name: l("Computer Science", "Информатика", "Информатика"), code: "6B06103", degree: l("Bachelor", "Бакалавр", "Бакалавр") },
  { id: 2, name: l("General Medicine", "Общая медицина", "Жалпы медицина"), code: "6B10101", degree: l("Bachelor", "Бакалавр", "Бакалавр") },
  { id: 3, name: l("Economics", "Экономика", "Экономика"), code: "6B04101", degree: l("Bachelor", "Бакалавр", "Бакалавр") },
];

export const collegePrograms: EduProgram[] = [
  { id: 1, name: l("Software Development", "Разработка ПО", "БҚ әзірлеу"), code: "06120100" },
  { id: 2, name: l("Nursing", "Сестринское дело", "Мейіргер ісі"), code: "09110100" },
];

export const cities: City[] = [
  { id: 1, name: l("Almaty", "Алматы", "Алматы"), region: l("Almaty Region", "Алматинская область", "Алматы облысы") },
  { id: 2, name: l("Astana", "Астана", "Астана"), region: l("Akmola Region", "Акмолинская область", "Ақмола облысы") },
  { id: 3, name: l("Shymkent", "Шымкент", "Шымкент"), region: l("Turkistan Region", "Туркестанская область", "Түркістан облысы") },
];
