import { type Localized, l } from "@/lib/localized";
import type { VisibilityRule } from "@/lib/visibility-rule";

// ── Shared types ─────────────────────────────────────────────────

export type VisualizationType = "bar" | "pie" | "histogram" | "table";
export type QuestionType = "single" | "multiple" | "likert";

// ── Variables ────────────────────────────────────────────────────

export interface VariableAssignment {
  variableId: string;
  value: number;
}

export interface Variable {
  id: string;
  name: string;
  description: string;
  // If imported from a catalog characteristic group, records its source.
  source?: { catalogId: string; groupId: string };
}

// ── Questions ────────────────────────────────────────────────────

export interface AnswerChoice {
  id: string;
  value?: string; // stable key referenced in formulas/logic (e.g. "agree"); defaults to id
  text: Localized;
  variables: VariableAssignment[];
}

export interface QuestionLogic {
  visibleIf?: string;
  enableIf?: string;
  requiredIf?: string;
}

export interface Question {
  id: string;
  name?: string; // stable key referenced in formulas/logic (e.g. "q1"); defaults to id
  text: Localized;
  type: QuestionType;
  choices: AnswerChoice[];
  logic?: QuestionLogic;
}

export interface SurveyLogic {
  triggers?: unknown[];
  calculatedValues?: unknown[];
  completedHtmlOnCondition?: unknown[];
}

export interface Section {
  id: string;
  title: Localized;
  description: Localized;
  questions: Question[];
}

// ── Characteristics ──────────────────────────────────────────────

export interface Characteristic {
  id: string;
  name: Localized;
}

export interface CharacteristicGroup {
  id: string;
  name: Localized;
  description: Localized;
  color: string;
  characteristics: Characteristic[];
}

export interface CharacteristicMapping {
  characteristicId: string;
  formula: string; // math expression using variable names, e.g. "(realistic + investigative) / 2"
}

export interface CharacteristicSection {
  groupId: string;
  mappings: CharacteristicMapping[];
}

// ── Widget Components ────────────────────────────────────────────

export type WidgetComponentType =
  | "bar_chart"
  | "pie_chart"
  | "radar_chart"
  | "score_table"
  | "stat_card"
  | "summary_text"
  | "custom_html";

export interface WidgetParam {
  key: string;
  value: string;
}

export interface Widget {
  id: string;
  componentType: WidgetComponentType;
  title: Localized;
  sql: string;
  params: WidgetParam[];
}

// ── ContentTest ──────────────────────────────────────────────────

export type TestIconKey =
  | "compass"
  | "fingerprint"
  | "puzzle"
  | "heart"
  | "briefcase"
  | "wrench"
  | "scale"
  | "book-open";

export type TestFormat = "test-only" | "with-consulting";

// Existing visibility tags an admin can pick from (controlled vocabulary).
// A test is shown to organizations that share one of these tags.
export const availableVisibilityTags: string[] = [
  "grade-9",
  "grade-10",
  "grade-11",
  "career-track",
  "stem-program",
  "pilot",
  "public",
];

export interface ContentTest {
  id: string;
  name: Localized;
  description: Localized;
  color: string;
  icon: TestIconKey;
  category: Localized;
  format: TestFormat;
  visibilityTags: string[];
  visibilityRule: VisibilityRule;
  duration: number; // minutes
  status: "draft" | "published";
  createdAt: string;
  updatedAt: string;
  sections: Section[];
  variables: Variable[];
  characteristicSections: CharacteristicSection[];
  resultWidgets: Widget[];
  orgDashboardWidgets: Widget[];
  regionDashboardWidgets: Widget[];
}

// ── ContentSurvey ────────────────────────────────────────────────

export type SurveyFormat = "included" | "separate";

export interface ContentSurvey {
  id: string;
  name: Localized;
  description: Localized;
  format: SurveyFormat;
  duration: number; // minutes
  status: "draft" | "published";
  createdAt: string;
  updatedAt: string;
  sections: Section[];
  orgDashboardWidgets: Widget[];
  regionDashboardWidgets: Widget[];
}

// ── Survey list ─────────────────────────────────────────────────

export const contentSurveyList: (Pick<ContentSurvey, "id" | "name" | "description" | "format" | "duration" | "status" | "createdAt" | "updatedAt"> & { questionCount: number })[] = [
  {
    id: "satisfaction",
    name: l("Student Satisfaction Survey", "Опрос удовлетворённости учеников"),
    description: l(
      "Measures student satisfaction with the testing process, platform usability, and perceived value of career guidance.",
      "Измеряет удовлетворённость учеников процессом тестирования, удобством платформы и воспринимаемой ценностью профориентации."
    ),
    format: "included",
    duration: 5,
    questionCount: 12,
    status: "published",
    createdAt: "2025-11-10",
    updatedAt: "2026-02-18",
  },
  {
    id: "feedback",
    name: l("Post-Consultation Feedback", "Отзыв после консультации"),
    description: l(
      "Collects feedback from students after career consultation sessions to improve guidance quality.",
      "Собирает отзывы учеников после сессий карьерного консультирования для улучшения качества профориентации."
    ),
    format: "separate",
    duration: 3,
    questionCount: 8,
    status: "published",
    createdAt: "2025-12-05",
    updatedAt: "2026-01-30",
  },
  {
    id: "wellbeing",
    name: l("Student Well-being Check", "Проверка благополучия ученика"),
    description: l(
      "A brief check-in survey to assess student emotional well-being and engagement levels.",
      "Краткий опрос для оценки эмоционального благополучия и вовлечённости учеников."
    ),
    format: "included",
    duration: 4,
    questionCount: 10,
    status: "draft",
    createdAt: "2026-01-15",
    updatedAt: "2026-02-25",
  },
];

// ── License Groups ───────────────────────────────────────────────

export interface LicenseGroupOrg {
  id: string;
  name: Localized;
  licenseUsed: number;
  licenseTotal: number;
}

export interface LicenseGroup {
  id: string;
  regionId: string;
  name: Localized;
  description: Localized;
  startDate: string;
  expirationDate: string;
  licenseCount: number;
  licensesUsed: number;
  regionAdminLogin: string;
  regionAdminPassword: string;
  testIds: string[];
  surveyIds: string[];
  organizations: LicenseGroupOrg[];
}

export const licenseGroupList: LicenseGroup[] = [
  {
    id: "lg-spring-2026",
    regionId: "reg-almaty",
    name: l("Spring 2026 Campaign", "Кампания Весна 2026"),
    description: l(
      "License group for the spring 2026 testing period covering all partner schools.",
      "Группа лицензий для весеннего периода тестирования 2026, охватывающего все школы-партнёры."
    ),
    startDate: "2026-02-01",
    expirationDate: "2026-05-31",
    licenseCount: 200,
    licensesUsed: 156,
    regionAdminLogin: "region-spring26",
    regionAdminPassword: "Spr1ng2026!Adm",
    testIds: ["holland", "big5", "mi", "learning"],
    surveyIds: ["satisfaction"],
    organizations: [
      { id: "school-42", name: l("School #42", "Школа №42"), licenseUsed: 68, licenseTotal: 80 },
      { id: "gymnasium-7", name: l("Gymnasium #7", "Гимназия №7"), licenseUsed: 55, licenseTotal: 60 },
      { id: "college-3", name: l("College #3", "Колледж №3"), licenseUsed: 33, licenseTotal: 40 },
    ],
  },
  {
    id: "lg-fall-2025",
    regionId: "reg-almaty",
    name: l("Fall 2025 Campaign", "Кампания Осень 2025"),
    description: l(
      "License group for the fall 2025 testing period. Completed and archived.",
      "Группа лицензий для осеннего периода тестирования 2025. Завершена и архивирована."
    ),
    startDate: "2025-09-01",
    expirationDate: "2025-12-31",
    licenseCount: 150,
    licensesUsed: 142,
    regionAdminLogin: "region-fall25",
    regionAdminPassword: "F@ll2025!Adm",
    testIds: ["holland", "big5"],
    surveyIds: ["feedback"],
    organizations: [
      { id: "school-42", name: l("School #42", "Школа №42"), licenseUsed: 72, licenseTotal: 80 },
      { id: "lyceum-15", name: l("Lyceum #15", "Лицей №15"), licenseUsed: 38, licenseTotal: 40 },
    ],
  },
  {
    id: "lg-pilot",
    regionId: "reg-astana",
    name: l("Pilot Program", "Пилотная программа"),
    description: l(
      "Small-scale pilot to test new assessment tools before full rollout.",
      "Пилотный проект малого масштаба для тестирования новых инструментов оценки перед полным запуском."
    ),
    startDate: "2026-03-01",
    expirationDate: "2026-06-30",
    licenseCount: 50,
    licensesUsed: 12,
    regionAdminLogin: "region-pilot",
    regionAdminPassword: "P1lot2026!",
    testIds: ["holland"],
    surveyIds: ["wellbeing"],
    organizations: [
      { id: "lyceum-15", name: l("Lyceum #15", "Лицей №15"), licenseUsed: 12, licenseTotal: 50 },
    ],
  },
];

// ── Users (students) ─────────────────────────────────────────────

export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  licenseCode: string | null;
  licenseStartDate: string | null;
  licenseExpirationDate: string | null;
  organizationName: string | null;
}

export const adminUserList: AdminUser[] = [
  {
    id: "u1",
    firstName: "Anna",
    lastName: "Ivanova",
    email: "a.ivanova@school42.edu.kz",
    licenseCode: "PW-AK7N-3R",
    licenseStartDate: "2026-02-01",
    licenseExpirationDate: "2026-05-31",
    organizationName: "School #42",
  },
  {
    id: "u2",
    firstName: "Dmitry",
    lastName: "Petrov",
    email: "d.petrov@school42.edu.kz",
    licenseCode: "PW-BM4Q-8T",
    licenseStartDate: "2026-02-01",
    licenseExpirationDate: "2026-05-31",
    organizationName: "School #42",
  },
  {
    id: "u3",
    firstName: "Elena",
    lastName: "Sokolova",
    email: "e.sokolova@gym7.edu.kz",
    licenseCode: "PW-CX9D-5J",
    licenseStartDate: "2026-02-01",
    licenseExpirationDate: "2026-05-31",
    organizationName: "Gymnasium #7",
  },
  {
    id: "u4",
    firstName: "Maxim",
    lastName: "Volkov",
    email: "m.volkov@gym7.edu.kz",
    licenseCode: null,
    licenseStartDate: null,
    licenseExpirationDate: null,
    organizationName: null,
  },
  {
    id: "u5",
    firstName: "Sofia",
    lastName: "Kuznetsova",
    email: "s.kuznetsova@college3.edu.kz",
    licenseCode: "PW-FH2W-6P",
    licenseStartDate: "2026-02-01",
    licenseExpirationDate: "2026-05-31",
    organizationName: "College #3",
  },
  {
    id: "u6",
    firstName: "Oleg",
    lastName: "Smirnov",
    email: "o.smirnov@lyceum15.edu.kz",
    licenseCode: "PW-GL5Y-9K",
    licenseStartDate: "2026-03-01",
    licenseExpirationDate: "2026-06-30",
    organizationName: "Lyceum #15",
  },
  {
    id: "u7",
    firstName: "Irina",
    lastName: "Popova",
    email: "i.popova@school42.edu.kz",
    licenseCode: null,
    licenseStartDate: null,
    licenseExpirationDate: null,
    organizationName: null,
  },
  {
    id: "u8",
    firstName: "Nikolay",
    lastName: "Fedorov",
    email: "n.fedorov@college3.edu.kz",
    licenseCode: "PW-JR8E-2M",
    licenseStartDate: "2026-02-01",
    licenseExpirationDate: "2026-05-31",
    organizationName: "College #3",
  },
];

// ── Admin Organizations ──────────────────────────────────────────

export interface AdminOrganization {
  id: string;
  name: Localized;
  regionId: string;
  regionName: Localized;
  status: "active" | "inactive";
  createdAt: string;
  login: string;
  password: string;
  tags: string[];
}

export const adminOrganizationList: AdminOrganization[] = [
  {
    id: "school-42",
    name: l("School #42", "Школа №42"),
    regionId: "reg-almaty",
    regionName: l("Almaty Region", "Алматинская область"),
    status: "active",
    createdAt: "2025-06-15",
    login: "school42-admin",
    password: "Sch00l42!Adm",
    tags: ["partner", "almaty"],
  },
  {
    id: "gymnasium-7",
    name: l("Gymnasium #7", "Гимназия №7"),
    regionId: "reg-almaty",
    regionName: l("Almaty Region", "Алматинская область"),
    status: "active",
    createdAt: "2025-07-01",
    login: "gym7-admin",
    password: "Gym7@2026!",
    tags: ["partner", "almaty"],
  },
  {
    id: "lyceum-15",
    name: l("Lyceum #15", "Лицей №15"),
    regionId: "reg-astana",
    regionName: l("Astana Region", "Астанинская область"),
    status: "active",
    createdAt: "2025-08-10",
    login: "lyceum15-admin",
    password: "Lyc15#Sec!",
    tags: ["pilot", "astana"],
  },
  {
    id: "college-3",
    name: l("College #3", "Колледж №3"),
    regionId: "reg-almaty",
    regionName: l("Almaty Region", "Алматинская область"),
    status: "active",
    createdAt: "2025-09-05",
    login: "college3-admin",
    password: "C0ll3ge3!Pw",
    tags: ["almaty"],
  },
  {
    id: "school-18",
    name: l("School #18", "Школа №18"),
    regionId: "reg-astana",
    regionName: l("Astana Region", "Астанинская область"),
    status: "inactive",
    createdAt: "2025-11-20",
    login: "school18-admin",
    password: "Sch18!Start",
    tags: ["astana"],
  },
  {
    id: "gymnasium-12",
    name: l("Gymnasium #12", "Гимназия №12"),
    regionId: "reg-shymkent",
    regionName: l("Shymkent Region", "Шымкентская область"),
    status: "active",
    createdAt: "2025-10-01",
    login: "gym12-admin",
    password: "Gym12@Shym!",
    tags: ["partner", "shymkent"],
  },
];

// ── Regions ──────────────────────────────────────────────────────

export interface AdminRegion {
  id: string;
  name: Localized;
  adminName: string;
  adminEmail: string;
  organizationCount: number;
  licenseTotal: number;
  licenseUsed: number;
  status: "active" | "inactive";
  createdAt: string;
}

export const adminRegionList: AdminRegion[] = [
  {
    id: "reg-almaty",
    name: l("Almaty Region", "Алматинская область"),
    adminName: "Sergei Kuznetsov",
    adminEmail: "s.kuznetsov@edu.kz",
    organizationCount: 3,
    licenseTotal: 180,
    licenseUsed: 156,
    status: "active",
    createdAt: "2025-06-01",
  },
  {
    id: "reg-astana",
    name: l("Astana Region", "Астанинская область"),
    adminName: "Natalia Smirnova",
    adminEmail: "n.smirnova@edu.kz",
    organizationCount: 2,
    licenseTotal: 70,
    licenseUsed: 38,
    status: "active",
    createdAt: "2025-06-15",
  },
  {
    id: "reg-shymkent",
    name: l("Shymkent Region", "Шымкентская область"),
    adminName: "Kanat Tulegenov",
    adminEmail: "k.tulegenov@edu.kz",
    organizationCount: 1,
    licenseTotal: 35,
    licenseUsed: 22,
    status: "active",
    createdAt: "2025-08-01",
  },
  {
    id: "reg-karaganda",
    name: l("Karaganda Region", "Карагандинская область"),
    adminName: "—",
    adminEmail: "—",
    organizationCount: 0,
    licenseTotal: 0,
    licenseUsed: 0,
    status: "inactive",
    createdAt: "2025-12-01",
  },
];

// ── Standalone Dashboard Widgets (for /admin/dashboards) ─────────

export interface DashboardWidget {
  id: string;
  title: Localized;
  type: VisualizationType;
  sql: string;
}

// ── ContentDashboard ─────────────────────────────────────────────

export interface ContentDashboard {
  id: string;
  name: Localized;
  description: Localized;
  status: "draft" | "published";
  createdAt: string;
  updatedAt: string;
  widgets: DashboardWidget[];
}

// ── Test list (lightweight, for the listing page) ────────────────

export const contentTestList: (Pick<ContentTest, "id" | "name" | "description" | "color" | "icon" | "category" | "format" | "duration" | "status" | "createdAt" | "updatedAt"> & { questionCount: number })[] = [
  {
    id: "holland",
    name: l("Holland Code (RIASEC)", "Код Голланда (RIASEC)"),
    description: l(
      "Measures vocational interests across six personality types: Realistic, Investigative, Artistic, Social, Enterprising, and Conventional.",
      "Измеряет профессиональные интересы по шести типам личности: Реалистичный, Исследовательский, Артистичный, Социальный, Предприимчивый и Конвенциональный."
    ),
    color: "#4f46e5",
    icon: "compass",
    category: l("Interest", "Интерес"),
    format: "test-only",
    duration: 15,
    questionCount: 42,
    status: "published",
    createdAt: "2025-09-15",
    updatedAt: "2026-01-20",
  },
  {
    id: "big5",
    name: l("Big Five Personality", "Большая пятёрка"),
    description: l(
      "Evaluates five broad dimensions of personality: Openness, Conscientiousness, Extraversion, Agreeableness, and Neuroticism.",
      "Оценивает пять основных измерений личности: Открытость, Добросовестность, Экстраверсию, Доброжелательность и Нейротизм."
    ),
    color: "#059669",
    icon: "fingerprint",
    category: l("Personality", "Личность"),
    format: "test-only",
    duration: 10,
    questionCount: 60,
    status: "published",
    createdAt: "2025-10-01",
    updatedAt: "2026-02-10",
  },
  {
    id: "mi",
    name: l("Multiple Intelligences", "Множественный интеллект"),
    description: l(
      "Assesses eight types of intelligence based on Howard Gardner's theory.",
      "Оценивает восемь типов интеллекта по теории Говарда Гарднера."
    ),
    color: "#7c3aed",
    icon: "puzzle",
    category: l("Personality", "Личность"),
    format: "test-only",
    duration: 20,
    questionCount: 48,
    status: "draft",
    createdAt: "2026-01-05",
    updatedAt: "2026-02-25",
  },
  {
    id: "learning",
    name: l("Learning Styles", "Стили обучения"),
    description: l(
      "Identifies preferred learning modalities: Visual, Auditory, Reading/Writing, and Kinesthetic (VARK model).",
      "Определяет предпочтительные модальности обучения: Визуальная, Аудиальная, Чтение/Письмо и Кинестетическая (модель VARK)."
    ),
    color: "#ea580c",
    icon: "book-open",
    category: l("Interest", "Интерес"),
    format: "test-only",
    duration: 10,
    questionCount: 28,
    status: "draft",
    createdAt: "2026-02-10",
    updatedAt: "2026-02-26",
  },
];

// ── Widget component registry ────────────────────────────────────

export interface ComponentParamDef {
  key: string;
  label: Localized;
  placeholder: string;
}

export interface ComponentDef {
  type: WidgetComponentType;
  name: Localized;
  description: Localized;
  params: ComponentParamDef[];
}

export const widgetComponents: ComponentDef[] = [
  {
    type: "bar_chart",
    name: l("Bar Chart", "Столбчатая диаграмма"),
    description: l("Displays values as horizontal or vertical bars", "Отображает значения в виде столбцов"),
    params: [],
  },
  {
    type: "pie_chart",
    name: l("Pie Chart", "Круговая диаграмма"),
    description: l("Shows proportional distribution as pie slices", "Показывает пропорциональное распределение в виде секторов"),
    params: [],
  },
  {
    type: "radar_chart",
    name: l("Radar Chart", "Лепестковая диаграмма"),
    description: l("Spider/radar chart for multi-dimensional profiles", "Лепестковая диаграмма для многомерных профилей"),
    params: [],
  },
  {
    type: "score_table",
    name: l("Score Table", "Таблица баллов"),
    description: l("Table listing characteristic scores with labels", "Таблица с баллами характеристик и подписями"),
    params: [],
  },
  {
    type: "stat_card",
    name: l("Stat Card", "Карточка статистики"),
    description: l("Single metric card showing one value prominently", "Карточка с одним выделенным значением"),
    params: [],
  },
  {
    type: "summary_text",
    name: l("Summary Text", "Сводный текст"),
    description: l("Auto-generated text summary based on results", "Автоматически сгенерированный текстовый отчёт по результатам"),
    params: [],
  },
  {
    type: "custom_html",
    name: l("Custom HTML", "Пользовательский HTML"),
    description: l("Custom HTML/CSS/JS template for rendering SQL results", "Пользовательский HTML/CSS/JS шаблон для отображения результатов SQL"),
    params: [
      { key: "html", label: l("HTML / CSS / JS", "HTML / CSS / JS"), placeholder: '<div id="chart"></div>\n<style>.bar { height: 20px; background: teal; }</style>\n<script>\n  const rows = window.__rows__;\n  // render with rows data...\n</script>' },
    ],
  },
];

// ── Mock data: Characteristics groups ────────────────────────────

export const characteristicGroups: CharacteristicGroup[] = [
  {
    id: "interests",
    name: l("Interests (RIASEC)", "Интересы (RIASEC)"),
    description: l(
      "Holland's six interest types used for career matching.",
      "Шесть типов интересов Холланда для профориентации."
    ),
    color: "#3b82f6",
    characteristics: [
      { id: "chr_realistic", name: l("Realistic", "Реалистичный") },
      { id: "chr_investigative", name: l("Investigative", "Исследовательский") },
      { id: "chr_artistic", name: l("Artistic", "Артистичный") },
      { id: "chr_social", name: l("Social", "Социальный") },
      { id: "chr_enterprising", name: l("Enterprising", "Предприимчивый") },
      { id: "chr_conventional", name: l("Conventional", "Конвенциональный") },
    ],
  },
  {
    id: "personality",
    name: l("Personality (Big Five)", "Личность (Большая пятёрка)"),
    description: l(
      "Five broad personality trait dimensions.",
      "Пять широких измерений личностных черт."
    ),
    color: "#8b5cf6",
    characteristics: [
      { id: "chr_openness", name: l("Openness", "Открытость") },
      { id: "chr_conscientiousness", name: l("Conscientiousness", "Добросовестность") },
      { id: "chr_extraversion", name: l("Extraversion", "Экстраверсия") },
      { id: "chr_agreeableness", name: l("Agreeableness", "Доброжелательность") },
      { id: "chr_neuroticism", name: l("Neuroticism", "Нейротизм") },
    ],
  },
  {
    id: "intelligences",
    name: l("Multiple Intelligences", "Множественный интеллект"),
    description: l(
      "Gardner's theory of multiple intelligences.",
      "Теория множественного интеллекта Гарднера."
    ),
    color: "#f59e0b",
    characteristics: [
      { id: "chr_linguistic", name: l("Linguistic", "Лингвистический") },
      { id: "chr_logical", name: l("Logical-Mathematical", "Логико-математический") },
      { id: "chr_spatial", name: l("Spatial", "Пространственный") },
      { id: "chr_musical", name: l("Musical", "Музыкальный") },
      { id: "chr_bodily", name: l("Bodily-Kinesthetic", "Телесно-кинестетический") },
      { id: "chr_interpersonal", name: l("Interpersonal", "Межличностный") },
      { id: "chr_intrapersonal", name: l("Intrapersonal", "Внутриличностный") },
      { id: "chr_naturalistic", name: l("Naturalistic", "Натуралистический") },
    ],
  },
  {
    id: "learning",
    name: l("Learning Styles (VARK)", "Стили обучения (VARK)"),
    description: l(
      "Visual, Auditory, Reading/Writing, and Kinesthetic learning preferences.",
      "Визуальные, аудиальные, чтение/письмо и кинестетические предпочтения обучения."
    ),
    color: "#10b981",
    characteristics: [
      { id: "chr_visual", name: l("Visual", "Визуальный") },
      { id: "chr_auditory", name: l("Auditory", "Аудиальный") },
      { id: "chr_reading", name: l("Reading/Writing", "Чтение/Письмо") },
      { id: "chr_kinesthetic", name: l("Kinesthetic", "Кинестетический") },
    ],
  },
  {
    id: "skills",
    name: l("Skills", "Навыки"),
    description: l(
      "Core competencies and transferable skills.",
      "Ключевые компетенции и универсальные навыки."
    ),
    color: "#ef4444",
    characteristics: [
      { id: "chr_communication", name: l("Communication", "Коммуникация") },
      { id: "chr_analytical", name: l("Analytical", "Аналитическое мышление") },
      { id: "chr_technical", name: l("Technical", "Технические навыки") },
      { id: "chr_leadership", name: l("Leadership", "Лидерство") },
    ],
  },
  {
    id: "values",
    name: l("Values", "Ценности"),
    description: l(
      "Work values and motivational priorities.",
      "Рабочие ценности и мотивационные приоритеты."
    ),
    color: "#ec4899",
    characteristics: [
      { id: "chr_autonomy", name: l("Autonomy", "Автономия") },
      { id: "chr_financial", name: l("Financial Security", "Финансовая стабильность") },
      { id: "chr_creativity", name: l("Creativity", "Творчество") },
      { id: "chr_social_impact", name: l("Social Impact", "Социальный вклад") },
      { id: "chr_work_life", name: l("Work-Life Balance", "Баланс работы и жизни") },
    ],
  },
];

// ── Mock data: Dashboards ────────────────────────────────────────

export const contentDashboards: ContentDashboard[] = [
  {
    id: "student-overview",
    name: l("Student Overview", "Обзор учеников"),
    description: l(
      "Aggregated view of student progress across all tests and organizations.",
      "Сводная информация о прогрессе учеников по всем тестам и организациям."
    ),
    status: "published",
    createdAt: "2025-11-01",
    updatedAt: "2026-02-15",
    widgets: [
      { id: "w1", title: l("Completion Rate by Organization", "Процент завершения по организациям"), type: "bar", sql: `SELECT o.name AS label,\n  ROUND(COUNT(CASE WHEN r.status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 1) AS value\nFROM assignments a\nJOIN organizations o ON o.id = a.org_id\nLEFT JOIN results r ON r.assignment_id = a.id\nGROUP BY o.name\nORDER BY value DESC` },
      { id: "w2", title: l("Test Participation", "Участие в тестах"), type: "pie", sql: `SELECT t.name AS label,\n  COUNT(DISTINCT a.student_id) AS value\nFROM assignments a\nJOIN tests t ON t.id = a.test_id\nWHERE a.status = 'completed'\nGROUP BY t.name` },
      { id: "w3", title: l("Monthly Completions", "Завершения по месяцам"), type: "histogram", sql: `SELECT DATE_TRUNC('month', completed_at) AS label, COUNT(*) AS value\nFROM results\nWHERE completed_at >= DATE_TRUNC('year', NOW())\nGROUP BY 1 ORDER BY 1` },
      { id: "w4", title: l("Recent Submissions", "Последние сдачи"), type: "table", sql: `SELECT s.name AS student, o.name AS organization, t.name AS test,\n  r.completed_at AS date, r.top_result AS result\nFROM results r\nJOIN students s ON s.id = r.student_id\nJOIN organizations o ON o.id = s.org_id\nJOIN tests t ON t.id = r.test_id\nORDER BY r.completed_at DESC LIMIT 20` },
    ],
  },
  {
    id: "test-results",
    name: l("Test Results Summary", "Сводка результатов тестов"),
    description: l(
      "Detailed analysis of test results, score distributions, and trends.",
      "Подробный анализ результатов тестов, распределение баллов и тренды."
    ),
    status: "published",
    createdAt: "2025-12-10",
    updatedAt: "2026-02-20",
    widgets: [
      { id: "w1", title: l("Average Scores by Test", "Средние баллы по тестам"), type: "bar", sql: `SELECT t.name AS label, ROUND(AVG(r.total_score), 1) AS value\nFROM results r JOIN tests t ON t.id = r.test_id\nGROUP BY t.name` },
      { id: "w2", title: l("Score Distribution", "Распределение баллов"), type: "histogram", sql: `SELECT FLOOR(total_score / 10) * 10 AS label, COUNT(*) AS value\nFROM results WHERE test_id = :selected_test\nGROUP BY 1 ORDER BY 1` },
      { id: "w3", title: l("Top Results Breakdown", "Разбивка лучших результатов"), type: "pie", sql: `SELECT top_result AS label, COUNT(*) AS value\nFROM results WHERE test_id = :selected_test\nGROUP BY top_result ORDER BY value DESC LIMIT 8` },
    ],
  },
  {
    id: "regional-comparison",
    name: l("Regional Comparison", "Сравнение регионов"),
    description: l(
      "Compare performance metrics across organizations in the region.",
      "Сравнение показателей по организациям региона."
    ),
    status: "draft",
    createdAt: "2026-02-01",
    updatedAt: "2026-02-26",
    widgets: [
      { id: "w1", title: l("License Utilization by Organization", "Использование лицензий по организациям"), type: "bar", sql: `SELECT o.name AS label,\n  ROUND(COUNT(CASE WHEN l.assigned THEN 1 END) * 100.0 / COUNT(*), 1) AS value\nFROM licenses l JOIN organizations o ON o.id = l.org_id\nGROUP BY o.name ORDER BY value DESC` },
      { id: "w2", title: l("Organization Statistics", "Статистика организаций"), type: "table", sql: `SELECT o.name AS organization, COUNT(DISTINCT g.id) AS groups,\n  COUNT(DISTINCT s.id) AS students, COUNT(DISTINCT l.id) AS licenses,\n  ROUND(AVG(r.total_score), 1) AS avg_score\nFROM organizations o\nLEFT JOIN groups g ON g.org_id = o.id\nLEFT JOIN students s ON s.org_id = o.id\nLEFT JOIN licenses l ON l.org_id = o.id\nLEFT JOIN results r ON r.student_id = s.id\nGROUP BY o.name` },
    ],
  },
];
