import type { Localized } from "@/lib/localized";
import { l } from "@/lib/localized";

// ── Types ────────────────────────────────────────────────────────

export type ProfessionGroup =
  | "Technology"
  | "Healthcare"
  | "Education"
  | "Business"
  | "Creative Arts"
  | "Science";

export type ComplexityLevel = "low" | "medium" | "high";

// Preparation level: how much preparation is needed to enter the profession.
// 1 = minimal, 5 = extensive.
export type PrepLevel = 1 | 2 | 3 | 4 | 5;

export const PREP_LEVELS: PrepLevel[] = [1, 2, 3, 4, 5];

export const prepLevelLabels: Record<PrepLevel, Localized> = {
  1: l("Minimal preparation", "Минимальная подготовка", "Ең аз дайындық"),
  2: l("Light preparation", "Лёгкая подготовка", "Жеңіл дайындық"),
  3: l("Moderate preparation", "Средняя подготовка", "Орташа дайындық"),
  4: l("Advanced preparation", "Продвинутая подготовка", "Жоғары дайындық"),
  5: l("Extensive preparation", "Обширная подготовка", "Кең дайындық"),
};

export interface ProfessionData {
  id: number;
  title: Localized;
  code: string;
  desc: Localized;
  group: ProfessionGroup;
  popular: boolean;
  liked: boolean;
  icon: string;
  complexity: ComplexityLevel;
  prepLevel: PrepLevel;
  fit: Partial<Record<"interest" | "personality" | "skills" | "values", number>>;
}

export interface ProfessionsPageData {
  professions: ProfessionData[];
  hasFitData: boolean;
}

// ── Detail types ─────────────────────────────────────────────────

export interface DescriptionData {
  title: Localized;
  intro: Localized;
  responsibilities: Localized[];
  typicalDay: { period: Localized; text: Localized }[];
  requiredSkills: { label: Localized; color: string }[];
  workEnvironment: Localized[];
  specializations: { path: Localized; tools: Localized }[];
}

export interface CharacteristicFitItem {
  name: Localized;
  level: number;
  desc: Localized;
}

export interface CharacteristicsData {
  interests: CharacteristicFitItem[];
  personality: CharacteristicFitItem[];
  skills: CharacteristicFitItem[];
  values: CharacteristicFitItem[];
}

export interface UniversityData {
  id: string;
  name: string;
  city: string;
  type: "public" | "private";
  grant: boolean;
  address?: string;
  email?: string;
  phone?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  youtube?: string;
  photo?: string;
}

export interface SpecializationData {
  id: string;
  title: Localized;
  code: string;
  subjects: Localized;
  points?: Record<string, number[]>;
  universities: UniversityData[];
}

export interface CollegeData {
  id: string;
  name: string;
  city: string;
  duration: Localized;
  address?: string;
  email?: string;
  phone?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  youtube?: string;
  photo?: string;
}

export interface CollegeSpecData {
  id: string;
  title: Localized;
  code: string;
  colleges: CollegeData[];
}

export interface CourseData {
  name: Localized;
  platform: string;
  instructor: string;
  price: Localized;
  url: string;
  lang: Localized;
  duration: Localized;
  level: Localized;
  skills: string[];
}

export interface EducationData {
  specializations: SpecializationData[];
  collegeSpecs: CollegeSpecData[];
  courses: CourseData[];
}

export interface VideoData {
  id: string;
  title: Localized;
  description: Localized;
  image: string;
  youtubeUrl: string;
}

export interface ContentData {
  videos: VideoData[];
}

export interface SalaryCard {
  level: Localized;
  main: string;
  mainNum: number;
  range: string;
  rangeMin: number;
  rangeMax: number;
  experience: Localized;
  highlight?: boolean;
}

export interface LaborMarketData {
  overview: {
    demand: { label: Localized; value: Localized; badge: Localized; badgeColor: string; demandLevel?: number };
    growth: { label: Localized; value: string; desc: Localized; badge: Localized; badgeColor: string };
    openings: { label: Localized; value: string; desc: Localized; updated: Localized };
  };
  salary: {
    cards: SalaryCard[];
    note: Localized;
  };
  industries: Localized[];
  geoCenters: { name: string; availability: Localized }[];
  strategy: {
    application: Localized[];
    careerDev: Localized[];
  };
  insights: { text: Localized; accent: string }[];
}

export interface ProfessionDetail {
  description: DescriptionData;
  characteristics: CharacteristicsData;
  education: EducationData;
  laborMarket: LaborMarketData;
  content?: ContentData;
}

// ── Scenarios ───────────────────────────────────────────────────

export type MockMode = "full" | "partial" | "none";

interface MockScenario {
  label: string;
  description: string;
  data: ProfessionsPageData;
}

export const allProfessions: ProfessionData[] = [
  { id: 1, title: l("Data Scientist", "Дата-сайентист"), code: "DS-401", desc: l("Analyze complex data to drive business decisions", "Анализ сложных данных для принятия бизнес-решений"), group: "Technology", popular: true, liked: true, icon: "\u{1F4CA}", complexity: "high", prepLevel: 5, fit: { interest: 85, personality: 90, skills: 78, values: 82 } },
  { id: 2, title: l("Registered Nurse", "Медсестра/медбрат"), code: "HC-201", desc: l("Provide patient care and coordinate treatments", "Уход за пациентами и координация лечения"), group: "Healthcare", popular: true, liked: false, icon: "\u{1FA7A}", complexity: "medium", prepLevel: 4, fit: { interest: 70, personality: 88, skills: 75, values: 90 } },
  { id: 3, title: l("High School Teacher", "Учитель старших классов"), code: "ED-105", desc: l("Educate and inspire students in subject areas", "Обучение и вдохновение учеников по предметам"), group: "Education", popular: false, liked: false, icon: "\u{1F4DA}", complexity: "medium", prepLevel: 3, fit: { interest: 65, personality: 80, skills: 72, values: 88 } },
  { id: 4, title: l("Marketing Manager", "Менеджер по маркетингу"), code: "BU-302", desc: l("Plan and execute marketing strategies for growth", "Планирование и реализация маркетинговых стратегий роста"), group: "Business", popular: true, liked: true, icon: "\u{1F4C8}", complexity: "medium", prepLevel: 3, fit: { interest: 60, personality: 75, skills: 80, values: 65 } },
  { id: 5, title: l("Graphic Designer", "Графический дизайнер"), code: "CA-110", desc: l("Create visual content for brands and media", "Создание визуального контента для брендов и медиа"), group: "Creative Arts", popular: false, liked: false, icon: "\u{1F3A8}", complexity: "low", prepLevel: 2, fit: { interest: 92, personality: 70, skills: 85, values: 78 } },
  { id: 6, title: l("Biomedical Researcher", "Биомедицинский исследователь"), code: "SC-501", desc: l("Conduct research to advance medical knowledge", "Проведение исследований для развития медицинских знаний"), group: "Science", popular: false, liked: true, icon: "\u{1F52C}", complexity: "high", prepLevel: 5, fit: { interest: 88, personality: 82, skills: 70, values: 92 } },
  { id: 7, title: l("Software Engineer", "Инженер-программист"), code: "DS-402", desc: l("Design and build software applications and systems", "Проектирование и создание программных приложений и систем"), group: "Technology", popular: true, liked: false, icon: "\u{1F4BB}", complexity: "high", prepLevel: 4, fit: { interest: 80, personality: 72, skills: 90, values: 70 } },
  { id: 8, title: l("Clinical Psychologist", "Клинический психолог"), code: "HC-305", desc: l("Assess and treat mental health conditions", "Диагностика и лечение психических расстройств"), group: "Healthcare", popular: false, liked: false, icon: "\u{1F9E0}", complexity: "high", prepLevel: 5, fit: { interest: 78, personality: 92, skills: 68, values: 85 } },
  { id: 9, title: l("Financial Analyst", "Финансовый аналитик"), code: "BU-210", desc: l("Evaluate investments and guide financial decisions", "Оценка инвестиций и консультирование по финансовым решениям"), group: "Business", popular: true, liked: false, icon: "\u{1F4B9}", complexity: "medium", prepLevel: 3, fit: { interest: 55, personality: 68, skills: 82, values: 60 } },
  { id: 10, title: l("UX Designer", "UX-дизайнер"), code: "CA-112", desc: l("Design intuitive user experiences for digital products", "Проектирование интуитивного пользовательского опыта для цифровых продуктов"), group: "Creative Arts", popular: true, liked: false, icon: "\u{270F}\uFE0F", complexity: "medium", prepLevel: 2, fit: { interest: 90, personality: 75, skills: 88, values: 80 } },
  { id: 11, title: l("Environmental Scientist", "Эколог"), code: "SC-310", desc: l("Study and protect the natural environment", "Изучение и защита окружающей среды"), group: "Science", popular: false, liked: false, icon: "\u{1F33F}", complexity: "medium", prepLevel: 4, fit: { interest: 82, personality: 78, skills: 65, values: 95 } },
  { id: 12, title: l("Curriculum Developer", "Разработчик учебных программ"), code: "ED-208", desc: l("Design educational programs and learning materials", "Разработка образовательных программ и учебных материалов"), group: "Education", popular: false, liked: false, icon: "\u{1F4DD}", complexity: "low", prepLevel: 2, fit: { interest: 72, personality: 76, skills: 74, values: 80 } },
];

export const mockScenarios: Record<MockMode, MockScenario> = {
  full: {
    label: "All Tests",
    description: "All tests passed, full fit data",
    data: {
      hasFitData: true,
      professions: allProfessions,
    },
  },
  partial: {
    label: "Partial",
    description: "Some tests passed, partial fit data",
    data: {
      hasFitData: true,
      professions: allProfessions.map((p) => {
        // Keep only partial fit data for the partial scenario
        const partialFits: Record<number, Partial<Record<"interest" | "personality" | "skills" | "values", number>>> = {
          1: { interest: 85, personality: 90 },
          2: { personality: 88, values: 90 },
          3: { interest: 65, values: 88 },
          4: { interest: 60, skills: 80, values: 65 },
          5: { interest: 92, skills: 85 },
          6: { interest: 88, personality: 82, values: 92 },
          7: { skills: 90, values: 70 },
          8: { personality: 92, values: 85 },
          9: { interest: 55, skills: 82 },
          10: { interest: 90, personality: 75, skills: 88 },
          11: { values: 95 },
          12: { interest: 72, personality: 76 },
        };
        return { ...p, fit: partialFits[p.id] ?? {} };
      }),
    },
  },
  none: {
    label: "No Tests",
    description: "No tests passed, no fit data",
    data: {
      hasFitData: false,
      professions: allProfessions.map((p) => ({ ...p, fit: {} })),
    },
  },
};

// ── Detail data (only Data Scientist fully populated) ────────────

export const professionDetails: Record<number, ProfessionDetail> = {
  1: {
    description: {
      title: l("Data Scientist", "Дата-сайентист"),
      intro: l(
        "Data Scientists combine statistical analysis, machine learning, and domain expertise to extract actionable insights from large and complex datasets. They work across industries — from tech and finance to healthcare and retail — helping organizations make data-driven decisions. This profession is consistently ranked among the top careers for job satisfaction, growth potential, and compensation.",
        "Дата-сайентисты сочетают статистический анализ, машинное обучение и отраслевые знания для извлечения полезных выводов из больших и сложных наборов данных. Они работают в различных отраслях — от технологий и финансов до здравоохранения и розничной торговли — помогая организациям принимать решения на основе данных. Эта профессия стабильно входит в число лучших по уровню удовлетворённости, потенциалу роста и компенсации.",
      ),
      responsibilities: [
        l("Collect, clean, and preprocess structured and unstructured data", "Сбор, очистка и предобработка структурированных и неструктурированных данных"),
        l("Build predictive models and machine learning pipelines", "Построение прогнозных моделей и пайплайнов машинного обучения"),
        l("Design and run A/B tests and experiments", "Проектирование и проведение A/B-тестов и экспериментов"),
        l("Create dashboards and visualizations to communicate findings", "Создание дашбордов и визуализаций для представления результатов"),
        l("Collaborate with product, engineering, and business teams", "Сотрудничество с продуктовыми, инженерными и бизнес-командами"),
        l("Present insights and recommendations to stakeholders", "Представление выводов и рекомендаций заинтересованным сторонам"),
      ],
      typicalDay: [
        { period: l("Morning", "Утро"), text: l("Review data pipeline outputs, check model performance metrics, respond to Slack messages from product team", "Проверка выходных данных пайплайнов, оценка метрик моделей, ответы на сообщения продуктовой команды в Slack") },
        { period: l("Midday", "День"), text: l("Deep work — feature engineering, model training, or exploratory data analysis in Jupyter notebooks", "Углублённая работа — разработка признаков, обучение моделей или разведочный анализ данных в Jupyter notebooks") },
        { period: l("Afternoon", "Вечер"), text: l("Cross-functional meeting to present findings, pair-programming with ML engineers, documentation", "Кросс-функциональное совещание для представления результатов, парное программирование с ML-инженерами, документация") },
      ],
      requiredSkills: [
        { label: l("Python"), color: "bg-blue-100 text-blue-800" },
        { label: l("R"), color: "bg-blue-100 text-blue-800" },
        { label: l("SQL"), color: "bg-blue-100 text-blue-800" },
        { label: l("Statistics", "Статистика"), color: "bg-violet-100 text-violet-800" },
        { label: l("Machine Learning", "Машинное обучение"), color: "bg-violet-100 text-violet-800" },
        { label: l("Communication", "Коммуникация"), color: "bg-emerald-100 text-emerald-800" },
        { label: l("Domain Knowledge", "Знание предметной области"), color: "bg-amber-100 text-amber-800" },
      ],
      workEnvironment: [
        l("Most data scientists work in office or remote settings with flexible hours. The role is primarily individual but involves regular cross-functional collaboration.", "Большинство дата-сайентистов работают в офисе или удалённо с гибким графиком. Роль в основном индивидуальная, но предполагает регулярное кросс-функциональное взаимодействие."),
        l("Work-life balance is generally good, though deadlines and product launches can create peak periods.", "Баланс работы и жизни в целом хороший, хотя дедлайны и запуски продуктов могут создавать периоды повышенной нагрузки."),
      ],
      specializations: [
        { path: l("ML Engineer", "ML-инженер"), tools: l("TensorFlow, PyTorch") },
        { path: l("Analytics Engineer", "Инженер аналитики"), tools: l("dbt, Looker, BigQuery") },
        { path: l("NLP Scientist", "NLP-учёный"), tools: l("Hugging Face, spaCy") },
        { path: l("Computer Vision", "Компьютерное зрение"), tools: l("OpenCV, YOLO") },
        { path: l("Data Analyst", "Аналитик данных"), tools: l("Tableau, Excel, SQL") },
      ],
    },
    characteristics: {
      interests: [
        { name: l("Investigative", "Исследовательский"), level: 90, desc: l("Strong match with analytical research work", "Сильное совпадение с аналитической исследовательской работой") },
        { name: l("Conventional", "Конвенциональный"), level: 65, desc: l("Working with structured data and systems", "Работа со структурированными данными и системами") },
        { name: l("Realistic", "Реалистичный"), level: 55, desc: l("Hands-on technical implementation", "Практическая техническая реализация") },
        { name: l("Artistic", "Артистичный"), level: 30, desc: l("Some creative visualization work", "Некоторая творческая работа с визуализацией") },
        { name: l("Social", "Социальный"), level: 25, desc: l("Limited direct social interaction", "Ограниченное прямое социальное взаимодействие") },
        { name: l("Enterprising", "Предприимчивый"), level: 20, desc: l("Not primarily leadership-focused", "Лидерство не является основным фокусом") },
      ],
      personality: [
        { name: l("Openness", "Открытость"), level: 88, desc: l("Curiosity drives exploration of data", "Любознательность стимулирует исследование данных") },
        { name: l("Conscientiousness", "Добросовестность"), level: 85, desc: l("Attention to detail is essential", "Внимание к деталям жизненно важно") },
        { name: l("Extraversion", "Экстраверсия"), level: 50, desc: l("Collaborative but also independent", "Командная работа, но и самостоятельность") },
        { name: l("Agreeableness", "Доброжелательность"), level: 55, desc: l("Team-oriented communication", "Командно-ориентированное общение") },
        { name: l("Neuroticism", "Нейротизм"), level: 25, desc: l("Calm under pressure with deadlines", "Спокойствие под давлением и дедлайнами") },
      ],
      skills: [
        { name: l("Analytical", "Аналитическое мышление"), level: 92, desc: l("Core skill for data interpretation", "Ключевой навык для интерпретации данных") },
        { name: l("Technical", "Технические навыки"), level: 85, desc: l("Programming and tool proficiency", "Владение программированием и инструментами") },
        { name: l("Communication", "Коммуникация"), level: 60, desc: l("Presenting findings to stakeholders", "Представление результатов заинтересованным сторонам") },
        { name: l("Leadership", "Лидерство"), level: 30, desc: l("Not a primary requirement", "Не является основным требованием") },
      ],
      values: [
        { name: l("Autonomy", "Автономия"), level: 85, desc: l("Independent problem-solving", "Самостоятельное решение задач") },
        { name: l("Creativity", "Творчество"), level: 82, desc: l("Novel approaches to data problems", "Новаторские подходы к задачам с данными") },
        { name: l("Financial Security", "Финансовая стабильность"), level: 80, desc: l("Competitive compensation", "Конкурентная компенсация") },
        { name: l("Work-Life Balance", "Баланс работы и жизни"), level: 60, desc: l("Generally flexible, some crunch", "В целом гибко, иногда напряжённо") },
        { name: l("Social Impact", "Социальный вклад"), level: 50, desc: l("Depends on industry and project", "Зависит от отрасли и проекта") },
      ],
    },
    education: {
      specializations: [
        {
          id: "cs",
          title: l("Computer Science", "Информатика"),
          code: "6B06101",
          subjects: l("Math, Physics", "Математика, Физика"),
          points: {
            general: [95, 100, 103, 108, 110],
            aul: [75, 78, 82, 85, 88],
            serpin: [80, 83, 86, 90, 93],
            gos: [70, 72, 75, 78, 80],
          },
          universities: [
            { id: "u-kaznu", name: "Al-Farabi KazNU", city: "Almaty", type: "public", grant: true },
            { id: "u-enu", name: "L.N. Gumilyov ENU", city: "Astana", type: "public", grant: true },
            { id: "u-satbayev", name: "Satbayev University", city: "Almaty", type: "public", grant: true },
            { id: "u-kbtu", name: "KBTU", city: "Almaty", type: "private", grant: true },
            { id: "u-sdu", name: "SDU", city: "Almaty", type: "private", grant: false },
            { id: "u-nu", name: "Nazarbayev University", city: "Astana", type: "public", grant: true },
          ],
        },
        {
          id: "ds",
          title: l("Data Science"),
          code: "6B06102",
          subjects: l("Math, IT", "Математика, Информатика"),
          points: {
            general: [90, 94, 98, 102, 106],
            aul: [70, 73, 76, 80, 83],
            serpin: [75, 78, 81, 85, 88],
            gos: [65, 68, 71, 74, 77],
          },
          universities: [
            { id: "u-nu", name: "Nazarbayev University", city: "Astana", type: "public", grant: true },
            { id: "u-kbtu", name: "KBTU", city: "Almaty", type: "private", grant: true },
            { id: "u-aitu", name: "Astana IT University", city: "Astana", type: "public", grant: true },
            { id: "u-iitu", name: "IITU", city: "Almaty", type: "public", grant: true },
            { id: "u-sdu", name: "SDU", city: "Almaty", type: "private", grant: false },
          ],
        },
        {
          id: "math",
          title: l("Mathematical and Computer Modelling", "Математическое и компьютерное моделирование"),
          code: "6B05401",
          subjects: l("Math, Physics", "Математика, Физика"),
          points: {
            general: [85, 88, 92, 96, 100],
            aul: [65, 68, 72, 75, 78],
            serpin: [70, 73, 76, 80, 83],
            gos: [60, 63, 66, 70, 73],
          },
          universities: [
            { id: "u-kaznu", name: "Al-Farabi KazNU", city: "Almaty", type: "public", grant: true },
            { id: "u-enu", name: "L.N. Gumilyov ENU", city: "Astana", type: "public", grant: true },
            { id: "u-buketov", name: "Karaganda Buketov University", city: "Karaganda", type: "public", grant: true },
            { id: "u-kaznpu", name: "Abai KazNPU", city: "Almaty", type: "public", grant: false },
          ],
        },
      ],
      collegeSpecs: [
        {
          id: "col-it",
          title: l("Information Systems (by industry)", "Информационные системы (по отраслям)"),
          code: "1304000",
          colleges: [
            { id: "c-almaty-it", name: "Almaty College of IT", city: "Almaty", duration: l("2 years 10 months", "2 года 10 месяцев") },
            { id: "c-astana-poly", name: "Astana Polytechnic College", city: "Astana", duration: l("3 years 10 months", "3 года 10 месяцев") },
            { id: "c-digital-tech", name: "College of Digital Technologies", city: "Shymkent", duration: l("2 years 10 months", "2 года 10 месяцев") },
            { id: "c-krg-it", name: "Karaganda College of IT & Business", city: "Karaganda", duration: l("2 years 10 months", "2 года 10 месяцев") },
          ],
        },
        {
          id: "col-prog",
          title: l("Software Engineering", "Программная инженерия"),
          code: "1305000",
          colleges: [
            { id: "c-astana-it", name: "Astana IT College", city: "Astana", duration: l("3 years 10 months", "3 года 10 месяцев") },
            { id: "c-almaty-econ", name: "Almaty College of Economics & IT", city: "Almaty", duration: l("2 years 10 months", "2 года 10 месяцев") },
            { id: "c-aktobe-tech", name: "Aktobe College of Technology", city: "Aktobe", duration: l("3 years 10 months", "3 года 10 месяцев") },
          ],
        },
        {
          id: "col-net",
          title: l("Computer Networks and Telecommunications", "Компьютерные сети и телекоммуникации"),
          code: "1306000",
          colleges: [
            { id: "c-telecom", name: "College of Telecommunications", city: "Almaty", duration: l("2 years 10 months", "2 года 10 месяцев") },
            { id: "c-astana-poly", name: "Astana Polytechnic College", city: "Astana", duration: l("3 years 10 months", "3 года 10 месяцев") },
          ],
        },
      ],
      courses: [
        { name: l("Machine Learning Specialization", "Специализация по машинному обучению"), platform: "Coursera", instructor: "Andrew Ng (Stanford)", price: l("Free (Certificate $49/mo)", "Бесплатно (Сертификат $49/мес)"), url: "https://www.coursera.org/specializations/machine-learning-introduction", lang: l("English", "Английский"), duration: l("3 months", "3 месяца"), level: l("Beginner", "Начальный"), skills: ["Python", "Machine Learning", "Statistics"] },
        { name: l("Data Science Professional Certificate", "Профессиональный сертификат по Data Science"), platform: "Coursera", instructor: "IBM", price: l("Free (Certificate $49/mo)", "Бесплатно (Сертификат $49/мес)"), url: "https://www.coursera.org/professional-certificates/ibm-data-science", lang: l("English", "Английский"), duration: l("5 months", "5 месяцев"), level: l("Beginner", "Начальный"), skills: ["Python", "SQL", "Machine Learning", "Statistics"] },
        { name: l("Python for Data Science and AI", "Python для Data Science и ИИ"), platform: "Coursera", instructor: "IBM", price: l("Free", "Бесплатно"), url: "https://www.coursera.org/learn/python-for-applied-data-science-ai", lang: l("English", "Английский"), duration: l("5 weeks", "5 недель"), level: l("Beginner", "Начальный"), skills: ["Python"] },
        { name: l("Data Analysis with Python", "Анализ данных с Python"), platform: "freeCodeCamp", instructor: "freeCodeCamp", price: l("Free", "Бесплатно"), url: "https://www.freecodecamp.org/learn/data-analysis-with-python/", lang: l("English", "Английский"), duration: l("Self-paced", "Свободный темп"), level: l("Intermediate", "Средний"), skills: ["Python", "Statistics"] },
        { name: l("100 Days of Code: Python"), platform: "Udemy", instructor: "Dr. Angela Yu", price: l("\u20B85,900"), url: "https://www.udemy.com/course/100-days-of-code/", lang: l("English", "Английский"), duration: l("60 hours", "60 часов"), level: l("Beginner", "Начальный"), skills: ["Python"] },
        { name: l("Deep Learning Specialization", "Специализация по глубокому обучению"), platform: "Coursera", instructor: "Andrew Ng (DeepLearning.AI)", price: l("Free (Certificate $49/mo)", "Бесплатно (Сертификат $49/мес)"), url: "https://www.coursera.org/specializations/deep-learning", lang: l("English", "Английский"), duration: l("5 months", "5 месяцев"), level: l("Intermediate", "Средний"), skills: ["Python", "Machine Learning"] },
        { name: l("Statistics and Probability", "Статистика и вероятность"), platform: "Khan Academy", instructor: "Khan Academy", price: l("Free", "Бесплатно"), url: "https://www.khanacademy.org/math/statistics-probability", lang: l("English", "Английский"), duration: l("Self-paced", "Свободный темп"), level: l("Beginner", "Начальный"), skills: ["Statistics"] },
        { name: l("SQL for Data Science", "SQL для Data Science"), platform: "Coursera", instructor: "UC Davis", price: l("Free (Certificate $49/mo)", "Бесплатно (Сертификат $49/мес)"), url: "https://www.coursera.org/learn/sql-for-data-science", lang: l("English", "Английский"), duration: l("4 weeks", "4 недели"), level: l("Beginner", "Начальный"), skills: ["SQL"] },
      ],
    },
    laborMarket: {
      overview: {
        demand: { label: l("Market Demand", "Спрос на рынке"), value: l("Moderate", "Умеренный"), badge: l("Moderate demand", "Умеренный спрос"), badgeColor: "blue", demandLevel: 3 },
        growth: { label: l("Job Growth", "Рост вакансий"), value: "9%+", desc: l("Much faster than average", "Намного быстрее среднего"), badge: l("Next 5 years", "Следующие 5 лет"), badgeColor: "green" },
        openings: { label: l("Annual Openings", "Годовые вакансии"), value: "5,360", desc: l("openings per year", "вакансий в год"), updated: l("Updated: 19.10.2025", "Обновлено: 19.10.2025") },
      },
      salary: {
        cards: [
          { level: l("Entry Level", "Начальный уровень"), main: "\u20B8300,000", mainNum: 300000, range: "\u20B8225,000 \u2013 \u20B8375,000", rangeMin: 225000, rangeMax: 375000, experience: l("0\u20132 years experience", "0\u20132 года опыта") },
          { level: l("Mid Level", "Средний уровень"), main: "\u20B8487,500", mainNum: 487500, range: "\u20B8375,000 \u2013 \u20B8600,000", rangeMin: 375000, rangeMax: 600000, experience: l("3\u20137 years experience", "3\u20137 лет опыта") },
          { level: l("Senior Level", "Старший уровень"), main: "\u20B8825,000", mainNum: 825000, range: "\u20B8600,000 \u2013 \u20B81,050,000", rangeMin: 600000, rangeMax: 1050000, experience: l("8+ years experience", "8+ лет опыта"), highlight: true },
        ],
        note: l("Salaries vary depending on experience, location, company size, and specific skills. These ranges represent typical compensation on the current market.", "Зарплаты варьируются в зависимости от опыта, местоположения, размера компании и конкретных навыков. Эти диапазоны отражают типичную компенсацию на текущем рынке."),
      },
      industries: [l("Business & Finance", "Бизнес и финансы"), l("Administration", "Администрирование")],
      geoCenters: [
        { name: "Almaty", availability: l("High availability", "Высокая доступность") },
        { name: "Astana", availability: l("High availability", "Высокая доступность") },
        { name: "Shymkent", availability: l("Moderate availability", "Средняя доступность") },
      ],
      strategy: {
        application: [
          l("Build a portfolio with 3-5 end-to-end data science projects on GitHub", "Создайте портфолио из 3-5 полных проектов по Data Science на GitHub"),
          l("Earn certifications (Google Data Analytics, IBM Data Science)", "Получите сертификаты (Google Data Analytics, IBM Data Science)"),
          l("Network through data science meetups and LinkedIn", "Нетворкинг через митапы по Data Science и LinkedIn"),
          l("Contribute to open-source ML projects", "Вносите вклад в open-source ML-проекты"),
          l("Prepare for technical interviews with SQL, Python, and statistics", "Готовьтесь к техническим собеседованиям по SQL, Python и статистике"),
        ],
        careerDev: [
          l("Start as a Data Analyst to build domain expertise", "Начните как аналитик данных для накопления отраслевого опыта"),
          l("Specialize in a high-demand area (NLP, Computer Vision, MLOps)", "Специализируйтесь в востребованной области (NLP, Computer Vision, MLOps)"),
          l("Pursue a Master\u2019s degree for senior/research roles", "Получите степень магистра для старших/исследовательских позиций"),
          l("Build communication skills for stakeholder management", "Развивайте коммуникативные навыки для работы с заинтересованными сторонами"),
          l("Stay current with latest tools and techniques", "Следите за новейшими инструментами и техниками"),
        ],
      },
      insights: [
        { text: l("The demand for data scientists in Kazakhstan has grown 35% year-over-year, driven by digital transformation across banking, telecom, and government sectors.", "Спрос на дата-сайентистов в Казахстане вырос на 35% за год благодаря цифровой трансформации в банковском деле, телекоме и государственном секторе."), accent: "green" },
        { text: l("Python and SQL remain the most requested skills, appearing in 90%+ of job listings. Machine learning frameworks (TensorFlow, PyTorch) are required for senior positions.", "Python и SQL остаются самыми востребованными навыками, встречаясь в 90%+ вакансий. Фреймворки машинного обучения (TensorFlow, PyTorch) требуются для старших позиций."), accent: "blue" },
        { text: l("Remote work opportunities have expanded significantly, with 40% of data science roles now offering fully remote or hybrid arrangements.", "Возможности удалённой работы значительно расширились: 40% вакансий в Data Science теперь предлагают полностью удалённый или гибридный формат."), accent: "amber" },
        { text: l("The gap between entry-level and senior salaries is substantial, making continuous skill development and specialization highly rewarding financially.", "Разрыв между начальными и старшими зарплатами значителен, что делает постоянное развитие навыков и специализацию финансово очень выгодными."), accent: "purple" },
      ],
    },
  },
};

// Helper to get group bg color for icons
export const groupBgColors: Record<ProfessionGroup, string> = {
  Technology: "bg-blue-100",
  Healthcare: "bg-emerald-100",
  Education: "bg-amber-100",
  Business: "bg-violet-100",
  "Creative Arts": "bg-pink-100",
  Science: "bg-sky-100",
};

export const groupBadgeColors: Record<ProfessionGroup, string> = {
  Technology: "bg-blue-100 text-blue-800",
  Healthcare: "bg-emerald-100 text-emerald-800",
  Education: "bg-amber-100 text-amber-800",
  Business: "bg-violet-100 text-violet-800",
  "Creative Arts": "bg-pink-100 text-pink-800",
  Science: "bg-sky-100 text-sky-800",
};

// ── Institution detail data ──────────────────────────────────────

export interface InstitutionDetail {
  photo: string;
  city: string;
  address: string;
  email?: string;
  phone?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  youtube?: string;
}

export const institutionDetails: Record<string, InstitutionDetail> = {
  "Al-Farabi KazNU": { photo: "\u{1F3DB}\uFE0F", city: "Almaty", address: "71 Al-Farabi Ave, Almaty 050040", email: "info@kaznu.kz", phone: "+7 (727) 377-33-33", website: "https://www.kaznu.kz", instagram: "kaznu_official", facebook: "KazNationalUniversity", youtube: "KazNU" },
  "L.N. Gumilyov ENU": { photo: "\u{1F3DB}\uFE0F", city: "Astana", address: "2 Satbayev St, Astana 010008", email: "info@enu.kz", phone: "+7 (7172) 70-95-00", website: "https://www.enu.kz", instagram: "enu_official", facebook: "enu.kz" },
  "Satbayev University": { photo: "\u{1F3DB}\uFE0F", city: "Almaty", address: "22a Satbayev St, Almaty 050013", email: "info@satbayev.university", phone: "+7 (727) 292-63-00", website: "https://satbayev.university", instagram: "satbayev_university", youtube: "SatbayevUniversity" },
  "KBTU": { photo: "\u{1F3EB}", city: "Almaty", address: "59 Tole Bi St, Almaty 050000", email: "admission@kbtu.kz", phone: "+7 (727) 356-87-00", website: "https://www.kbtu.kz", instagram: "kbtu_official", facebook: "kbtu.university" },
  "SDU": { photo: "\u{1F3EB}", city: "Almaty", address: "1/1 Abylai Khan St, Almaty 040900", email: "info@sdu.edu.kz", phone: "+7 (727) 307-95-65", website: "https://www.sdu.edu.kz", instagram: "sdu_university", facebook: "sdu.edu.kz" },
  "Nazarbayev University": { photo: "\u{1F3DB}\uFE0F", city: "Astana", address: "53 Kabanbay Batyr Ave, Astana 010000", email: "admissions@nu.edu.kz", phone: "+7 (7172) 70-66-88", website: "https://nu.edu.kz", instagram: "nu_edu", facebook: "NazarbayevUniversity", youtube: "NazarbayevUni" },
  "Astana IT University": { photo: "\u{1F3EB}", city: "Astana", address: "55/11 Mangilik El Ave, Astana 010000", email: "info@astanait.edu.kz", phone: "+7 (7172) 64-57-10", website: "https://astanait.edu.kz", instagram: "astanait_university" },
  "IITU": { photo: "\u{1F3EB}", city: "Almaty", address: "34/1 Manas St, Almaty 050040", email: "info@iitu.edu.kz", phone: "+7 (727) 244-27-03", website: "https://iitu.edu.kz", instagram: "iitu_official" },
  "Karaganda Buketov University": { photo: "\u{1F3DB}\uFE0F", city: "Karaganda", address: "28 University St, Karaganda 100028", email: "info@buketov.edu.kz", phone: "+7 (7212) 77-04-22", website: "https://buketov.edu.kz", instagram: "buketov_university" },
  "Abai KazNPU": { photo: "\u{1F3DB}\uFE0F", city: "Almaty", address: "13 Dostyk Ave, Almaty 050010", email: "info@kaznpu.kz", phone: "+7 (727) 291-89-28", website: "https://kaznpu.kz", instagram: "kaznpu_official" },
  "Almaty College of IT": { photo: "\u{1F393}", city: "Almaty", address: "15 Abay Ave, Almaty 050009", email: "info@almaty-itc.kz", phone: "+7 (727) 250-12-34", website: "https://almaty-itc.kz", instagram: "almaty_it_college" },
  "Astana Polytechnic College": { photo: "\u{1F393}", city: "Astana", address: "42 Kenesary St, Astana 010000", email: "info@apc.edu.kz", phone: "+7 (7172) 33-45-67", website: "https://apc.edu.kz", instagram: "astana_polytechnic" },
  "College of Digital Technologies": { photo: "\u{1F393}", city: "Shymkent", address: "8 Turkestan St, Shymkent 160012", email: "info@cdt-shymkent.kz", phone: "+7 (7252) 21-33-44", website: "https://cdt-shymkent.kz" },
  "Karaganda College of IT & Business": { photo: "\u{1F393}", city: "Karaganda", address: "10 Erubaev St, Karaganda 100008", email: "info@kit-krg.kz", phone: "+7 (7212) 41-22-33", website: "https://kit-krg.kz", instagram: "kit_karaganda" },
  "Astana IT College": { photo: "\u{1F393}", city: "Astana", address: "20 Syganak St, Astana 010000", email: "info@aitc.edu.kz", phone: "+7 (7172) 55-66-77", website: "https://aitc.edu.kz", instagram: "astana_it_college" },
  "Almaty College of Economics & IT": { photo: "\u{1F393}", city: "Almaty", address: "25 Zhandosov St, Almaty 050035", email: "info@aceit.kz", phone: "+7 (727) 394-55-66", website: "https://aceit.kz" },
  "Aktobe College of Technology": { photo: "\u{1F393}", city: "Aktobe", address: "5 Abilkayir Khan Ave, Aktobe 030000", email: "info@act-aktobe.kz", phone: "+7 (7132) 56-78-90", website: "https://act-aktobe.kz" },
  "College of Telecommunications": { photo: "\u{1F393}", city: "Almaty", address: "100 Raiymbek Ave, Almaty 050012", email: "info@telecom-college.kz", phone: "+7 (727) 279-44-55", website: "https://telecom-college.kz", instagram: "telecom_college_almaty" },
};

// ── Characteristics database ────────────────────────────────────

export type CharacteristicTypeKey = keyof CharacteristicsData;

export interface CharacteristicTemplate {
  name: Localized;
  desc: Localized;
}

export const characteristicTemplates: Record<CharacteristicTypeKey, CharacteristicTemplate[]> = {
  interests: [
    { name: l("Realistic", "Реалистичный"), desc: l("Hands-on work with tools, machines, or physical activities", "Практическая работа с инструментами, механизмами или физическая деятельность") },
    { name: l("Investigative", "Исследовательский"), desc: l("Analytical and intellectual problem-solving", "Аналитическое и интеллектуальное решение задач") },
    { name: l("Artistic", "Артистичный"), desc: l("Creative expression through art, design, writing, or music", "Творческое самовыражение через искусство, дизайн, письмо или музыку") },
    { name: l("Social", "Социальный"), desc: l("Helping, teaching, and working closely with others", "Помощь, обучение и тесная работа с другими") },
    { name: l("Enterprising", "Предприимчивый"), desc: l("Leading, persuading, and managing projects or people", "Лидерство, убеждение и управление проектами или людьми") },
    { name: l("Conventional", "Конвенциональный"), desc: l("Organizing data, following procedures, and working with systems", "Организация данных, следование процедурам и работа с системами") },
  ],
  personality: [
    { name: l("Openness", "Открытость"), desc: l("Curiosity and willingness to try new things", "Любознательность и готовность пробовать новое") },
    { name: l("Conscientiousness", "Добросовестность"), desc: l("Organization, dependability, and self-discipline", "Организованность, надёжность и самодисциплина") },
    { name: l("Extraversion", "Экстраверсия"), desc: l("Sociability, assertiveness, and positive energy", "Общительность, настойчивость и позитивная энергия") },
    { name: l("Agreeableness", "Доброжелательность"), desc: l("Cooperation, trust, and empathy toward others", "Сотрудничество, доверие и эмпатия к другим") },
    { name: l("Neuroticism", "Нейротизм"), desc: l("Emotional sensitivity and stress reactivity", "Эмоциональная чувствительность и реакция на стресс") },
  ],
  skills: [
    { name: l("Communication", "Коммуникация"), desc: l("Ability to express ideas clearly and listen actively", "Способность ясно выражать идеи и активно слушать") },
    { name: l("Analytical", "Аналитическое мышление"), desc: l("Breaking down problems and drawing logical conclusions", "Разбор проблем и логические выводы") },
    { name: l("Technical", "Технические навыки"), desc: l("Proficiency with digital tools and technology", "Владение цифровыми инструментами и технологиями") },
    { name: l("Leadership", "Лидерство"), desc: l("Guiding teams and taking responsibility for outcomes", "Руководство командами и ответственность за результаты") },
  ],
  values: [
    { name: l("Autonomy", "Автономия"), desc: l("Independence and freedom to make own decisions", "Независимость и свобода принимать собственные решения") },
    { name: l("Financial Security", "Финансовая стабильность"), desc: l("Stable income and long-term financial well-being", "Стабильный доход и долгосрочное финансовое благополучие") },
    { name: l("Creativity", "Творчество"), desc: l("Work that allows innovation and self-expression", "Работа, позволяющая инновации и самовыражение") },
    { name: l("Social Impact", "Социальный вклад"), desc: l("Contributing positively to society", "Позитивный вклад в общество") },
    { name: l("Work-Life Balance", "Баланс работы и жизни"), desc: l("Flexible schedules and personal time", "Гибкий график и личное время") },
  ],
};

// ── Standalone program databases ────────────────────────────────

export const allUniverPrograms: SpecializationData[] = [
  ...professionDetails[1].education.specializations,
  {
    id: "ai",
    title: l("Artificial Intelligence", "Искусственный интеллект"),
    code: "6B06103",
    subjects: l("Math, IT", "Математика, Информатика"),
    points: {
      general: [98, 102, 106, 110, 115],
      aul: [78, 82, 85, 88, 92],
    },
    universities: [
      { id: "u-nu", name: "Nazarbayev University", city: "Astana", type: "public", grant: true },
      { id: "u-kbtu", name: "KBTU", city: "Almaty", type: "private", grant: true },
      { id: "u-aitu", name: "Astana IT University", city: "Astana", type: "public", grant: true },
    ],
  },
  {
    id: "infosys",
    title: l("Information Systems", "Информационные системы"),
    code: "6B06104",
    subjects: l("Math, IT", "Математика, Информатика"),
    points: {
      general: [82, 86, 90, 94, 98],
      aul: [62, 65, 68, 72, 75],
    },
    universities: [
      { id: "u-kaznu", name: "Al-Farabi KazNU", city: "Almaty", type: "public", grant: true },
      { id: "u-enu", name: "L.N. Gumilyov ENU", city: "Astana", type: "public", grant: true },
      { id: "u-iitu", name: "IITU", city: "Almaty", type: "public", grant: true },
      { id: "u-sdu", name: "SDU", city: "Almaty", type: "private", grant: false },
    ],
  },
  {
    id: "cybersec",
    title: l("Cybersecurity", "Кибербезопасность"),
    code: "6B06201",
    subjects: l("Math, Physics", "Математика, Физика"),
    points: {
      general: [88, 92, 96, 100, 104],
      aul: [68, 72, 75, 78, 82],
    },
    universities: [
      { id: "u-satbayev", name: "Satbayev University", city: "Almaty", type: "public", grant: true },
      { id: "u-enu", name: "L.N. Gumilyov ENU", city: "Astana", type: "public", grant: true },
      { id: "u-kbtu", name: "KBTU", city: "Almaty", type: "private", grant: true },
    ],
  },
  {
    id: "softeng",
    title: l("Software Engineering", "Программная инженерия"),
    code: "6B06110",
    subjects: l("Math, IT", "Математика, Информатика"),
    points: {
      general: [92, 96, 100, 104, 108],
      aul: [72, 75, 78, 82, 85],
    },
    universities: [
      { id: "u-kaznu", name: "Al-Farabi KazNU", city: "Almaty", type: "public", grant: true },
      { id: "u-aitu", name: "Astana IT University", city: "Astana", type: "public", grant: true },
      { id: "u-sdu", name: "SDU", city: "Almaty", type: "private", grant: false },
      { id: "u-nu", name: "Nazarbayev University", city: "Astana", type: "public", grant: true },
    ],
  },
  {
    id: "bigdata",
    title: l("Big Data Analytics", "Аналитика больших данных"),
    code: "6B06105",
    subjects: l("Math, IT", "Математика, Информатика"),
    points: {
      general: [90, 94, 98, 102, 106],
    },
    universities: [
      { id: "u-kbtu", name: "KBTU", city: "Almaty", type: "private", grant: true },
      { id: "u-iitu", name: "IITU", city: "Almaty", type: "public", grant: true },
    ],
  },
];

export const allCollegePrograms: CollegeSpecData[] = [
  ...professionDetails[1].education.collegeSpecs,
  {
    id: "col-web",
    title: l("Web Development", "Веб-разработка"),
    code: "1304100",
    colleges: [
      { id: "c-almaty-it", name: "Almaty College of IT", city: "Almaty", duration: l("2 years 10 months", "2 года 10 месяцев") },
      { id: "c-astana-it", name: "Astana IT College", city: "Astana", duration: l("2 years 10 months", "2 года 10 месяцев") },
    ],
  },
  {
    id: "col-db",
    title: l("Database Administration", "Администрирование баз данных"),
    code: "1304200",
    colleges: [
      { id: "c-digital-tech", name: "College of Digital Technologies", city: "Shymkent", duration: l("2 years 10 months", "2 года 10 месяцев") },
      { id: "c-krg-it", name: "Karaganda College of IT & Business", city: "Karaganda", duration: l("3 years 10 months", "3 года 10 месяцев") },
    ],
  },
  {
    id: "col-auto",
    title: l("Industrial Automation", "Автоматизация производства"),
    code: "1307000",
    colleges: [
      { id: "c-astana-poly", name: "Astana Polytechnic College", city: "Astana", duration: l("3 years 10 months", "3 года 10 месяцев") },
      { id: "c-aktobe-tech", name: "Aktobe College of Technology", city: "Aktobe", duration: l("3 years 10 months", "3 года 10 месяцев") },
    ],
  },
];

// ── Standalone institution databases ────────────────────────────

function dedupeByName<T extends { name: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.name)) return false;
    seen.add(item.name);
    return true;
  });
}

export const allUniversities: UniversityData[] = dedupeByName(
  Object.values(professionDetails).flatMap((d) =>
    d.education.specializations.flatMap((s) => s.universities)
  )
).map((u) => {
  const detail = institutionDetails[u.name];
  if (!detail) return u;
  return {
    ...u,
    address: u.address ?? detail.address,
    email: u.email ?? detail.email,
    phone: u.phone ?? detail.phone,
    website: u.website ?? detail.website,
    instagram: u.instagram ?? detail.instagram,
    facebook: u.facebook ?? detail.facebook,
    youtube: u.youtube ?? detail.youtube,
    photo: u.photo ?? detail.photo,
  };
});

export const allColleges: CollegeData[] = dedupeByName(
  Object.values(professionDetails).flatMap((d) =>
    d.education.collegeSpecs.flatMap((s) => s.colleges)
  )
).map((c) => {
  const detail = institutionDetails[c.name];
  if (!detail) return c;
  return {
    ...c,
    address: c.address ?? detail.address,
    email: c.email ?? detail.email,
    phone: c.phone ?? detail.phone,
    website: c.website ?? detail.website,
    instagram: c.instagram ?? detail.instagram,
    facebook: c.facebook ?? detail.facebook,
    youtube: c.youtube ?? detail.youtube,
    photo: c.photo ?? detail.photo,
  };
});
