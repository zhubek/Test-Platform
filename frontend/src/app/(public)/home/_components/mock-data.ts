import type { TestCardProps } from "./test-card";
import type { ResultEntry } from "./results-drawer";
import type { Localized } from "@/lib/localized";
import { l } from "@/lib/localized";

/** A test as it would come from the API — test info + user state + results together */
export interface TestData {
  id: string;
  title: Localized;
  description: Localized;
  status: TestCardProps["status"];
  category: Localized;
  format: TestCardProps["format"];
  duration: Localized;
  questions: Localized;
  extraMeta?: Localized;
  icon: TestCardProps["icon"];
  assigned?: boolean;
  dimmed?: boolean;
  results: ResultEntry[];
}

export type MockMode = "assigned" | "no-license" | "fresh";

interface MockScenario {
  label: string;
  description: string;
  tests: TestData[];
}

export const mockScenarios: Record<MockMode, MockScenario> = {
  /**
   * assigned — Organization license active, some tests assigned.
   * Holland in-progress with 2 past results, Big Five completed with 1 result.
   * Unassigned tests are dimmed.
   */
  assigned: {
    label: "Assigned",
    description: "Organization license active, some tests assigned to user",
    tests: [
      {
        id: "holland",
        title: l("Holland Code (RIASEC)", "Код Голланда (RIASEC)"),
        description: l(
          "Discover your career interests across six personality types — Realistic, Investigative, Artistic, Social, Enterprising, and Conventional.",
          "Узнайте свои карьерные интересы по шести типам личности — Реалистичный, Исследовательский, Артистичный, Социальный, Предприимчивый и Конвенциональный.",
        ),
        status: "in-progress",
        category: l("Interest", "Интерес"),
        format: "test-only",
        duration: l("15 min", "15 мин"),
        questions: l("60 questions", "60 вопросов"),
        extraMeta: l("32 answered", "32 отвечено"),
        icon: "compass",
        assigned: true,
        results: [
          {
            date: "Jan 28, 2026",
            summary: l(
              "Your Holland Code is IAS — Investigative, Artistic, Social. You are drawn to analytical problem-solving, creative expression, and helping others. This combination suggests careers that blend research with creativity and human connection.",
              "Ваш код Голланда — ИАС — Исследовательский, Артистичный, Социальный. Вас привлекает аналитическое решение задач, творческое самовыражение и помощь другим. Эта комбинация предполагает карьеру, сочетающую исследования с творчеством и связью с людьми.",
            ),
            scores: [
              { label: l("Investigative", "Исследовательский"), value: 42, high: true, description: l("Analytical, intellectual, scientific", "Аналитический, интеллектуальный, научный") },
              { label: l("Artistic", "Артистичный"), value: 38, high: true, description: l("Creative, expressive, unstructured", "Творческий, выразительный, свободный") },
              { label: l("Social", "Социальный"), value: 35, high: true, description: l("Helping, teaching, counseling", "Помощь, обучение, консультирование") },
              { label: l("Enterprising", "Предприимчивый"), value: 22, high: false, description: l("Leading, persuading, managing", "Лидерство, убеждение, управление") },
              { label: l("Realistic", "Реалистичный"), value: 18, high: false, description: l("Hands-on, practical, physical", "Практический, прикладной, физический") },
              { label: l("Conventional", "Конвенциональный"), value: 12, high: false, description: l("Organizing, data, detail-oriented", "Организация, данные, внимание к деталям") },
            ],
            professions: [
              l("UX Researcher", "UX-исследователь"),
              l("Data Scientist", "Дата-сайентист"),
              l("Clinical Psychologist", "Клинический психолог"),
              l("Architect", "Архитектор"),
              l("Product Designer", "Продуктовый дизайнер"),
              l("Science Writer", "Научный журналист"),
              l("Art Therapist", "Арт-терапевт"),
              l("Museum Curator", "Музейный куратор"),
            ],
          },
          {
            date: "Nov 12, 2025",
            summary: l(
              "Your Holland Code is IAR — Investigative, Artistic, Realistic. You are drawn to analytical thinking combined with creativity and hands-on work. This combination suggests careers where you can build, design, and solve tangible problems.",
              "Ваш код Голланда — ИАР — Исследовательский, Артистичный, Реалистичный. Вас привлекает аналитическое мышление в сочетании с творчеством и практической работой. Эта комбинация предполагает карьеру, где можно создавать, проектировать и решать конкретные задачи.",
            ),
            scores: [
              { label: l("Investigative", "Исследовательский"), value: 40, high: true, description: l("Analytical, intellectual, scientific", "Аналитический, интеллектуальный, научный") },
              { label: l("Artistic", "Артистичный"), value: 36, high: true, description: l("Creative, expressive, unstructured", "Творческий, выразительный, свободный") },
              { label: l("Realistic", "Реалистичный"), value: 33, high: true, description: l("Hands-on, practical, physical", "Практический, прикладной, физический") },
              { label: l("Social", "Социальный"), value: 24, high: false, description: l("Helping, teaching, counseling", "Помощь, обучение, консультирование") },
              { label: l("Enterprising", "Предприимчивый"), value: 20, high: false, description: l("Leading, persuading, managing", "Лидерство, убеждение, управление") },
              { label: l("Conventional", "Конвенциональный"), value: 14, high: false, description: l("Organizing, data, detail-oriented", "Организация, данные, внимание к деталям") },
            ],
            professions: [
              l("Industrial Designer", "Промышленный дизайнер"),
              l("Software Engineer", "Инженер-программист"),
              l("Biomedical Engineer", "Биомедицинский инженер"),
              l("Landscape Architect", "Ландшафтный архитектор"),
              l("Mechanical Engineer", "Инженер-механик"),
              l("Game Developer", "Разработчик игр"),
            ],
          },
        ],
      },
      {
        id: "big5",
        title: l("Big Five Personality", "Большая пятёрка"),
        description: l(
          "Measure five core dimensions of personality — Openness, Conscientiousness, Extraversion, Agreeableness, and Neuroticism.",
          "Измерьте пять основных измерений личности — Открытость, Добросовестность, Экстраверсия, Доброжелательность и Нейротизм.",
        ),
        status: "completed",
        category: l("Personality", "Личность"),
        format: "test-only",
        duration: l("10 min", "10 мин"),
        questions: l("50 questions", "50 вопросов"),
        extraMeta: l("Completed Feb 3", "Завершён 3 фев"),
        icon: "fingerprint",
        assigned: true,
        results: [
          {
            date: "Feb 3, 2026",
            summary: l(
              "You scored high on Openness and Conscientiousness, indicating a curious and disciplined personality. Moderate Extraversion suggests comfort in both social and solitary settings. Low Neuroticism reflects emotional stability and resilience under stress.",
              "Вы набрали высокие баллы по Открытости и Добросовестности, что указывает на любознательную и дисциплинированную личность. Умеренная Экстраверсия говорит о комфорте как в социальных, так и в уединённых условиях. Низкий Нейротизм отражает эмоциональную стабильность и устойчивость к стрессу.",
            ),
            scores: [
              { label: l("Openness", "Открытость"), value: 88, high: true, description: l("Curiosity, creativity, willingness to try new things", "Любознательность, креативность, готовность к новому") },
              { label: l("Conscientiousness", "Добросовестность"), value: 82, high: true, description: l("Organization, dependability, self-discipline", "Организованность, надёжность, самодисциплина") },
              { label: l("Agreeableness", "Доброжелательность"), value: 70, high: false, description: l("Cooperation, trust, empathy", "Сотрудничество, доверие, эмпатия") },
              { label: l("Extraversion", "Экстраверсия"), value: 61, high: false, description: l("Sociability, assertiveness, positive emotions", "Общительность, настойчивость, позитивные эмоции") },
              { label: l("Neuroticism", "Нейротизм"), value: 28, high: false, description: l("Emotional instability, anxiety, moodiness", "Эмоциональная нестабильность, тревожность, перепады настроения") },
            ],
            professions: [
              l("Research Scientist", "Научный исследователь"),
              l("Project Manager", "Руководитель проектов"),
              l("Software Architect", "Архитектор ПО"),
              l("Strategy Consultant", "Стратегический консультант"),
              l("Technical Writer", "Технический писатель"),
            ],
          },
        ],
      },
      {
        id: "mbti",
        title: l("MBTI Personality", "Тип личности MBTI"),
        description: l(
          "Discover your Myers-Briggs personality type across four dimensions — energy, information, decisions, and lifestyle preferences.",
          "Узнайте свой тип личности по Майерс-Бриггс по четырём измерениям — энергия, информация, решения и предпочтения образа жизни.",
        ),
        status: "available",
        category: l("Personality", "Личность"),
        format: "test-only",
        duration: l("20 min", "20 мин"),
        questions: l("70 questions", "70 вопросов"),
        icon: "puzzle",
        dimmed: true,
        results: [],
      },
      {
        id: "eq",
        title: l("Emotional Intelligence", "Эмоциональный интеллект"),
        description: l(
          "Assess your emotional intelligence across self-awareness, self-regulation, motivation, empathy, and social skills.",
          "Оцените свой эмоциональный интеллект по самоосознанию, саморегуляции, мотивации, эмпатии и социальным навыкам.",
        ),
        status: "available",
        category: l("Personality", "Личность"),
        format: "with-consulting",
        duration: l("25 min", "25 мин"),
        questions: l("80 questions", "80 вопросов"),
        icon: "heart",
        dimmed: true,
        results: [],
      },
      {
        id: "career",
        title: l("Career Aptitude", "Карьерные способности"),
        description: l(
          "Evaluate your natural aptitudes — verbal reasoning, numerical ability, spatial awareness, and abstract thinking.",
          "Оцените свои природные способности — вербальное мышление, числовые способности, пространственное восприятие и абстрактное мышление.",
        ),
        status: "available",
        category: l("Interest", "Интерес"),
        format: "test-only",
        duration: l("18 min", "18 мин"),
        questions: l("65 questions", "65 вопросов"),
        icon: "briefcase",
        dimmed: true,
        results: [],
      },
      {
        id: "skills",
        title: l("Skills Assessment", "Оценка навыков"),
        description: l(
          "Evaluate your skill set across communication, analytical thinking, technical abilities, and leadership.",
          "Оцените свои навыки в общении, аналитическом мышлении, технических способностях и лидерстве.",
        ),
        status: "available",
        category: l("Skills", "Навыки"),
        format: "test-only",
        duration: l("12 min", "12 мин"),
        questions: l("45 questions", "45 вопросов"),
        icon: "wrench",
        dimmed: true,
        results: [],
      },
      {
        id: "values",
        title: l("Values Inventory", "Инвентаризация ценностей"),
        description: l(
          "Clarify what matters most to you in a career — autonomy, financial security, creativity, social impact, or work-life balance.",
          "Определите, что для вас важнее всего в карьере — автономия, финансовая стабильность, творчество, социальный вклад или баланс работы и жизни.",
        ),
        status: "available",
        category: l("Values", "Ценности"),
        format: "test-only",
        duration: l("8 min", "8 мин"),
        questions: l("30 questions", "30 вопросов"),
        icon: "scale",
        dimmed: true,
        results: [],
      },
      {
        id: "learning",
        title: l("Learning Styles", "Стили обучения"),
        description: l(
          "Identify how you learn best — visual, auditory, reading/writing, or kinesthetic. Study more effectively.",
          "Определите, как вы учитесь лучше всего — визуально, аудиально, через чтение/письмо или кинестетически. Учитесь эффективнее.",
        ),
        status: "available",
        category: l("Interest", "Интерес"),
        format: "test-only",
        duration: l("10 min", "10 мин"),
        questions: l("40 questions", "40 вопросов"),
        icon: "book-open",
        dimmed: true,
        results: [],
      },
    ],
  },

  /**
   * no-license — User belongs to an org but hasn't entered their license key yet.
   * Shows license input banner, no tests visible.
   */
  "no-license": {
    label: "No License",
    description: "Organization member without an active license key",
    tests: [],
  },

  /**
   * fresh — Organization license active, tests assigned, but nothing started.
   * No results for any test.
   */
  fresh: {
    label: "Fresh User",
    description: "Organization license active, assigned tests, nothing started",
    tests: [
      {
        id: "holland",
        title: l("Holland Code (RIASEC)", "Код Голланда (RIASEC)"),
        description: l(
          "Discover your career interests across six personality types — Realistic, Investigative, Artistic, Social, Enterprising, and Conventional.",
          "Узнайте свои карьерные интересы по шести типам личности — Реалистичный, Исследовательский, Артистичный, Социальный, Предприимчивый и Конвенциональный.",
        ),
        status: "available",
        category: l("Interest", "Интерес"),
        format: "test-only",
        duration: l("15 min", "15 мин"),
        questions: l("60 questions", "60 вопросов"),
        icon: "compass",
        assigned: true,
        results: [],
      },
      {
        id: "big5",
        title: l("Big Five Personality", "Большая пятёрка"),
        description: l(
          "Measure five core dimensions of personality — Openness, Conscientiousness, Extraversion, Agreeableness, and Neuroticism.",
          "Измерьте пять основных измерений личности — Открытость, Добросовестность, Экстраверсия, Доброжелательность и Нейротизм.",
        ),
        status: "available",
        category: l("Personality", "Личность"),
        format: "test-only",
        duration: l("10 min", "10 мин"),
        questions: l("50 questions", "50 вопросов"),
        icon: "fingerprint",
        assigned: true,
        results: [],
      },
      {
        id: "mbti",
        title: l("MBTI Personality", "Тип личности MBTI"),
        description: l(
          "Discover your Myers-Briggs personality type across four dimensions — energy, information, decisions, and lifestyle preferences.",
          "Узнайте свой тип личности по Майерс-Бриггс по четырём измерениям — энергия, информация, решения и предпочтения образа жизни.",
        ),
        status: "available",
        category: l("Personality", "Личность"),
        format: "test-only",
        duration: l("20 min", "20 мин"),
        questions: l("70 questions", "70 вопросов"),
        icon: "puzzle",
        dimmed: true,
        results: [],
      },
      {
        id: "eq",
        title: l("Emotional Intelligence", "Эмоциональный интеллект"),
        description: l(
          "Assess your emotional intelligence across self-awareness, self-regulation, motivation, empathy, and social skills.",
          "Оцените свой эмоциональный интеллект по самоосознанию, саморегуляции, мотивации, эмпатии и социальным навыкам.",
        ),
        status: "available",
        category: l("Personality", "Личность"),
        format: "with-consulting",
        duration: l("25 min", "25 мин"),
        questions: l("80 questions", "80 вопросов"),
        icon: "heart",
        dimmed: true,
        results: [],
      },
      {
        id: "career",
        title: l("Career Aptitude", "Карьерные способности"),
        description: l(
          "Evaluate your natural aptitudes — verbal reasoning, numerical ability, spatial awareness, and abstract thinking.",
          "Оцените свои природные способности — вербальное мышление, числовые способности, пространственное восприятие и абстрактное мышление.",
        ),
        status: "available",
        category: l("Interest", "Интерес"),
        format: "test-only",
        duration: l("18 min", "18 мин"),
        questions: l("65 questions", "65 вопросов"),
        icon: "briefcase",
        dimmed: true,
        results: [],
      },
      {
        id: "skills",
        title: l("Skills Assessment", "Оценка навыков"),
        description: l(
          "Evaluate your skill set across communication, analytical thinking, technical abilities, and leadership.",
          "Оцените свои навыки в общении, аналитическом мышлении, технических способностях и лидерстве.",
        ),
        status: "available",
        category: l("Skills", "Навыки"),
        format: "test-only",
        duration: l("12 min", "12 мин"),
        questions: l("45 questions", "45 вопросов"),
        icon: "wrench",
        dimmed: true,
        results: [],
      },
      {
        id: "values",
        title: l("Values Inventory", "Инвентаризация ценностей"),
        description: l(
          "Clarify what matters most to you in a career — autonomy, financial security, creativity, social impact, or work-life balance.",
          "Определите, что для вас важнее всего в карьере — автономия, финансовая стабильность, творчество, социальный вклад или баланс работы и жизни.",
        ),
        status: "available",
        category: l("Values", "Ценности"),
        format: "test-only",
        duration: l("8 min", "8 мин"),
        questions: l("30 questions", "30 вопросов"),
        icon: "scale",
        dimmed: true,
        results: [],
      },
      {
        id: "learning",
        title: l("Learning Styles", "Стили обучения"),
        description: l(
          "Identify how you learn best — visual, auditory, reading/writing, or kinesthetic. Study more effectively.",
          "Определите, как вы учитесь лучше всего — визуально, аудиально, через чтение/письмо или кинестетически. Учитесь эффективнее.",
        ),
        status: "available",
        category: l("Interest", "Интерес"),
        format: "test-only",
        duration: l("10 min", "10 мин"),
        questions: l("40 questions", "40 вопросов"),
        icon: "book-open",
        dimmed: true,
        results: [],
      },
    ],
  },
};
