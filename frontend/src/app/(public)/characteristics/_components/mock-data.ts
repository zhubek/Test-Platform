import type { Localized } from "@/lib/localized";
import { l } from "@/lib/localized";

// ── Types ────────────────────────────────────────────────────────

export interface CharacteristicItem {
  label: Localized;
  value: number;
  desc: Localized;
}

export interface CategoryData {
  items: CharacteristicItem[];
  summary: Localized;
}

export type CategoryKey = "interests" | "personality" | "skills" | "values";

export type ProfessionGroup =
  | "Technology"
  | "Healthcare"
  | "Education"
  | "Business"
  | "Creative Arts"
  | "Science";

export type PrepLevel = 1 | 2 | 3 | 4 | 5;

export interface ProfessionData {
  title: Localized;
  code: string;
  desc: Localized;
  group: ProfessionGroup;
  popular: boolean;
  prepLevel: PrepLevel;
  fit: { interest: number; personality: number; skills: number; values: number };
}

export interface CharacteristicsPageData {
  categories: Partial<Record<CategoryKey, CategoryData>>;
  professions: ProfessionData[];
  isEmpty: boolean;
}

// ── Scenarios ───────────────────────────────────────────────────

export type MockMode = "full" | "partial" | "empty";

interface MockScenario {
  label: string;
  description: string;
  data: CharacteristicsPageData;
}

const interestsData: CategoryData = {
  items: [
    { label: l("Realistic", "Реалистичный"), value: 45, desc: l("Hands-on work with tools, machines, or physical activities. Preference for practical, tangible tasks.", "Практическая работа с инструментами, механизмами или физическая деятельность. Предпочтение практических, осязаемых задач.") },
    { label: l("Investigative", "Исследовательский"), value: 88, desc: l("Analytical and intellectual problem-solving. Drawn to research, science, and exploring ideas.", "Аналитическое и интеллектуальное решение задач. Тяга к исследованиям, науке и изучению идей.") },
    { label: l("Artistic", "Артистичный"), value: 76, desc: l("Creative expression through art, design, writing, or music. Values originality and imagination.", "Творческое самовыражение через искусство, дизайн, письмо или музыку. Ценит оригинальность и воображение.") },
    { label: l("Social", "Социальный"), value: 82, desc: l("Helping, teaching, and working closely with others. Motivated by making a difference in people's lives.", "Помощь, обучение и тесная работа с другими. Мотивация — изменить жизнь людей к лучшему.") },
    { label: l("Enterprising", "Предприимчивый"), value: 55, desc: l("Leading, persuading, and managing projects or people. Enjoys taking initiative and making decisions.", "Лидерство, убеждение и управление проектами или людьми. Любит проявлять инициативу и принимать решения.") },
    { label: l("Conventional", "Конвенциональный"), value: 38, desc: l("Organizing data, following procedures, and working with systems. Values structure and accuracy.", "Организация данных, следование процедурам и работа с системами. Ценит структуру и точность.") },
  ],
  summary: l(
    "Your strongest interests are Investigative and Social, suggesting you thrive in roles that combine analytical thinking with helping others. Careers in research, education, counseling, or healthcare could be a strong fit. Your moderate Artistic score also points to an appreciation for creative problem-solving.",
    "Ваши сильнейшие интересы — Исследовательский и Социальный, что говорит о том, что вы преуспеваете в ролях, сочетающих аналитическое мышление с помощью другим. Карьера в исследованиях, образовании, консультировании или здравоохранении может отлично подойти. Умеренный Артистичный балл также указывает на склонность к творческому решению задач.",
  ),
};

const personalityData: CategoryData = {
  items: [
    { label: l("Openness", "Открытость"), value: 88, desc: l("Curiosity and willingness to try new things. High scorers enjoy variety, creativity, and abstract thinking.", "Любознательность и готовность пробовать новое. Высокие баллы означают тягу к разнообразию, творчеству и абстрактному мышлению.") },
    { label: l("Conscientiousness", "Добросовестность"), value: 82, desc: l("Organization, dependability, and self-discipline. High scorers are goal-oriented and detail-focused.", "Организованность, надёжность и самодисциплина. Высокие баллы означают ориентацию на цели и внимание к деталям.") },
    { label: l("Extraversion", "Экстраверсия"), value: 61, desc: l("Sociability, assertiveness, and positive energy. Moderate scorers balance social engagement with quiet reflection.", "Общительность, настойчивость и позитивная энергия. Умеренные баллы означают баланс между социальной вовлечённостью и тихим размышлением.") },
    { label: l("Agreeableness", "Доброжелательность"), value: 70, desc: l("Cooperation, trust, and empathy toward others. High scorers tend to be supportive and considerate.", "Сотрудничество, доверие и эмпатия к другим. Высокие баллы означают склонность к поддержке и внимательности.") },
    { label: l("Neuroticism", "Нейротизм"), value: 28, desc: l("Emotional sensitivity and stress reactivity. Low scorers tend to be calm, resilient, and emotionally stable.", "Эмоциональная чувствительность и реакция на стресс. Низкие баллы означают спокойствие, устойчивость и эмоциональную стабильность.") },
  ],
  summary: l(
    "You show high Openness and Conscientiousness paired with low Neuroticism, indicating a creative yet disciplined and emotionally stable personality. You are likely reliable under pressure, open to new ideas, and able to work well both independently and in teams.",
    "У вас высокая Открытость и Добросовестность в сочетании с низким Нейротизмом, что указывает на творческую, но дисциплинированную и эмоционально стабильную личность. Вы, вероятно, надёжны под давлением, открыты новым идеям и способны работать как самостоятельно, так и в команде.",
  ),
};

const skillsData: CategoryData = {
  items: [
    { label: l("Communication", "Коммуникация"), value: 75, desc: l("Ability to express ideas clearly in writing and speech, and to listen actively to others.", "Способность ясно выражать идеи в письменной и устной форме и активно слушать других.") },
    { label: l("Analytical", "Аналитическое мышление"), value: 82, desc: l("Skill in breaking down problems, interpreting data, and drawing logical conclusions.", "Умение разбирать проблемы, интерпретировать данные и делать логические выводы.") },
    { label: l("Technical", "Технические навыки"), value: 68, desc: l("Proficiency with digital tools, software, and technology relevant to your field.", "Владение цифровыми инструментами, программным обеспечением и технологиями в вашей области.") },
    { label: l("Leadership", "Лидерство"), value: 60, desc: l("Capacity to guide teams, make decisions, and take responsibility for outcomes.", "Способность руководить командами, принимать решения и нести ответственность за результаты.") },
  ],
  summary: l(
    "Your strongest skill is Analytical thinking, complemented by solid Communication abilities. This combination is well-suited for roles in consulting, data analysis, or project management. Developing your Technical and Leadership skills further could open up senior or cross-functional positions.",
    "Ваш сильнейший навык — Аналитическое мышление, дополненное хорошими коммуникативными способностями. Эта комбинация хорошо подходит для ролей в консалтинге, анализе данных или управлении проектами. Дальнейшее развитие технических и лидерских навыков может открыть путь к руководящим или кросс-функциональным позициям.",
  ),
};

const valuesData: CategoryData = {
  items: [
    { label: l("Autonomy", "Автономия"), value: 85, desc: l("Importance of independence and freedom to make your own decisions at work.", "Важность независимости и свободы принимать собственные решения на работе.") },
    { label: l("Financial Security", "Финансовая стабильность"), value: 60, desc: l("Priority placed on stable income, benefits, and long-term financial well-being.", "Приоритет стабильного дохода, льгот и долгосрочного финансового благополучия.") },
    { label: l("Creativity", "Творчество"), value: 90, desc: l("Desire for work that allows innovation, original thinking, and self-expression.", "Желание работы, позволяющей инновации, оригинальное мышление и самовыражение.") },
    { label: l("Social Impact", "Социальный вклад"), value: 78, desc: l("Drive to contribute positively to society and make a meaningful difference.", "Стремление вносить позитивный вклад в общество и делать значимые изменения.") },
    { label: l("Work-Life Balance", "Баланс работы и жизни"), value: 88, desc: l("Value placed on flexible schedules, personal time, and avoiding burnout.", "Ценность гибкого графика, личного времени и предотвращения выгорания.") },
  ],
  summary: l(
    "You place the highest value on Creativity, Work-Life Balance, and Autonomy. You are most likely to thrive in environments that offer flexible schedules, room for innovation, and independence in how you approach your work. Consider roles in design, research, freelancing, or mission-driven organizations.",
    "Вы ставите наибольшую ценность на Творчество, Баланс работы и жизни и Автономию. Вы, скорее всего, будете процветать в среде с гибким графиком, возможностями для инноваций и свободой в подходе к работе. Рассмотрите роли в дизайне, исследованиях, фрилансе или миссионерских организациях.",
  ),
};

const allProfessions: ProfessionData[] = [
  { title: l("Data Scientist", "Дата-сайентист"), code: "DS-401", desc: l("Analyze complex data to drive business decisions", "Анализ сложных данных для принятия бизнес-решений"), group: "Technology", popular: true, prepLevel: 5, fit: { interest: 85, personality: 90, skills: 78, values: 82 } },
  { title: l("Registered Nurse", "Медсестра/медбрат"), code: "HC-201", desc: l("Provide patient care and coordinate treatments", "Уход за пациентами и координация лечения"), group: "Healthcare", popular: true, prepLevel: 4, fit: { interest: 70, personality: 88, skills: 75, values: 90 } },
  { title: l("High School Teacher", "Учитель старших классов"), code: "ED-105", desc: l("Educate and inspire students in subject areas", "Обучение и вдохновение учеников по предметам"), group: "Education", popular: false, prepLevel: 3, fit: { interest: 65, personality: 80, skills: 72, values: 88 } },
  { title: l("Marketing Manager", "Менеджер по маркетингу"), code: "BU-302", desc: l("Plan and execute marketing strategies for growth", "Планирование и реализация маркетинговых стратегий роста"), group: "Business", popular: true, prepLevel: 3, fit: { interest: 60, personality: 75, skills: 80, values: 65 } },
  { title: l("Graphic Designer", "Графический дизайнер"), code: "CA-110", desc: l("Create visual content for brands and media", "Создание визуального контента для брендов и медиа"), group: "Creative Arts", popular: false, prepLevel: 2, fit: { interest: 92, personality: 70, skills: 85, values: 78 } },
  { title: l("Biomedical Researcher", "Биомедицинский исследователь"), code: "SC-501", desc: l("Conduct research to advance medical knowledge", "Проведение исследований для развития медицинских знаний"), group: "Science", popular: false, prepLevel: 5, fit: { interest: 88, personality: 82, skills: 70, values: 92 } },
  { title: l("Software Engineer", "Инженер-программист"), code: "DS-402", desc: l("Design and build software applications and systems", "Проектирование и создание программных приложений и систем"), group: "Technology", popular: true, prepLevel: 4, fit: { interest: 80, personality: 72, skills: 90, values: 70 } },
  { title: l("Clinical Psychologist", "Клинический психолог"), code: "HC-305", desc: l("Assess and treat mental health conditions", "Диагностика и лечение психических расстройств"), group: "Healthcare", popular: false, prepLevel: 5, fit: { interest: 78, personality: 92, skills: 68, values: 85 } },
  { title: l("Financial Analyst", "Финансовый аналитик"), code: "BU-210", desc: l("Evaluate investments and guide financial decisions", "Оценка инвестиций и консультирование по финансовым решениям"), group: "Business", popular: true, prepLevel: 3, fit: { interest: 55, personality: 68, skills: 82, values: 60 } },
  { title: l("UX Designer", "UX-дизайнер"), code: "CA-112", desc: l("Design intuitive user experiences for digital products", "Проектирование интуитивного пользовательского опыта для цифровых продуктов"), group: "Creative Arts", popular: true, prepLevel: 2, fit: { interest: 90, personality: 75, skills: 88, values: 80 } },
  { title: l("Environmental Scientist", "Эколог"), code: "SC-310", desc: l("Study and protect the natural environment", "Изучение и защита окружающей среды"), group: "Science", popular: false, prepLevel: 4, fit: { interest: 82, personality: 78, skills: 65, values: 95 } },
  { title: l("Curriculum Developer", "Разработчик учебных программ"), code: "ED-208", desc: l("Design educational programs and learning materials", "Разработка образовательных программ и учебных материалов"), group: "Education", popular: false, prepLevel: 2, fit: { interest: 72, personality: 76, skills: 74, values: 80 } },
];

export const mockScenarios: Record<MockMode, MockScenario> = {
  full: {
    label: "Full Results",
    description: "All 4 categories have test results",
    data: {
      isEmpty: false,
      categories: {
        interests: interestsData,
        personality: personalityData,
        skills: skillsData,
        values: valuesData,
      },
      professions: allProfessions,
    },
  },
  partial: {
    label: "Partial Results",
    description: "Only Interests and Personality have results",
    data: {
      isEmpty: false,
      categories: {
        interests: interestsData,
        personality: personalityData,
      },
      professions: allProfessions,
    },
  },
  empty: {
    label: "No Results",
    description: "No tests completed yet",
    data: {
      isEmpty: true,
      categories: {},
      professions: [],
    },
  },
};
