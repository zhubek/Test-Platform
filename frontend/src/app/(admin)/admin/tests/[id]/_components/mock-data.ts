import { l } from "@/lib/localized";
import type { ContentTest } from "../../../_components/mock-data";

export const hollandTest: ContentTest = {
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
  visibilityTags: [],
  visibilityRule: { combinator: "all", items: [] },
  duration: 15,
  status: "published",
  createdAt: "2025-09-15",
  updatedAt: "2026-01-20",
  mappings: [],
  variables: [
    { id: "v_realistic", name: "realistic", label: l("Realistic"), kind: "characteristic", scope: "both" },
    { id: "v_investigative", name: "investigative", label: l("Investigative"), kind: "characteristic", scope: "both" },
    { id: "v_artistic", name: "artistic", label: l("Artistic"), kind: "characteristic", scope: "both" },
    { id: "v_social", name: "social", label: l("Social"), kind: "characteristic", scope: "both" },
    { id: "v_enterprising", name: "enterprising", label: l("Enterprising"), kind: "characteristic", scope: "both" },
    { id: "v_conventional", name: "conventional", label: l("Conventional"), kind: "characteristic", scope: "both" },
  ],
  sections: [
    {
      id: "sec1",
      title: l("Activities", "Виды деятельности"),
      description: l("Rate how much you enjoy each activity.", "Оцените, насколько вам нравится каждый вид деятельности."),
      questions: [
        {
          id: "q1",
          text: l("I enjoy fixing or building things with my hands.", "Мне нравится чинить или строить что-то своими руками."),
          type: "likert",
          choices: [
            { id: "q1a1", text: l("Strongly Disagree", "Совершенно не согласен"), variables: [{ variableId: "v_realistic", value: 1 }] },
            { id: "q1a2", text: l("Disagree", "Не согласен"), variables: [{ variableId: "v_realistic", value: 2 }] },
            { id: "q1a3", text: l("Neutral", "Нейтрально"), variables: [{ variableId: "v_realistic", value: 3 }] },
            { id: "q1a4", text: l("Agree", "Согласен"), variables: [{ variableId: "v_realistic", value: 4 }] },
            { id: "q1a5", text: l("Strongly Agree", "Совершенно согласен"), variables: [{ variableId: "v_realistic", value: 5 }] },
          ],
        },
        {
          id: "q2",
          text: l("I like to analyze data and solve complex problems.", "Мне нравится анализировать данные и решать сложные задачи."),
          type: "likert",
          choices: [
            { id: "q2a1", text: l("Strongly Disagree", "Совершенно не согласен"), variables: [{ variableId: "v_investigative", value: 1 }] },
            { id: "q2a2", text: l("Disagree", "Не согласен"), variables: [{ variableId: "v_investigative", value: 2 }] },
            { id: "q2a3", text: l("Neutral", "Нейтрально"), variables: [{ variableId: "v_investigative", value: 3 }] },
            { id: "q2a4", text: l("Agree", "Согласен"), variables: [{ variableId: "v_investigative", value: 4 }] },
            { id: "q2a5", text: l("Strongly Agree", "Совершенно согласен"), variables: [{ variableId: "v_investigative", value: 5 }] },
          ],
        },
        {
          id: "q3",
          text: l("I enjoy creative activities like drawing, writing, or music.", "Мне нравятся творческие занятия: рисование, письмо или музыка."),
          type: "likert",
          choices: [
            { id: "q3a1", text: l("Strongly Disagree", "Совершенно не согласен"), variables: [{ variableId: "v_artistic", value: 1 }] },
            { id: "q3a2", text: l("Disagree", "Не согласен"), variables: [{ variableId: "v_artistic", value: 2 }] },
            { id: "q3a3", text: l("Neutral", "Нейтрально"), variables: [{ variableId: "v_artistic", value: 3 }] },
            { id: "q3a4", text: l("Agree", "Согласен"), variables: [{ variableId: "v_artistic", value: 4 }] },
            { id: "q3a5", text: l("Strongly Agree", "Совершенно согласен"), variables: [{ variableId: "v_artistic", value: 5 }] },
          ],
        },
      ],
    },
    {
      id: "sec2",
      title: l("Work Preferences", "Предпочтения в работе"),
      description: l("Choose what best describes your work style.", "Выберите то, что лучше всего описывает ваш стиль работы."),
      questions: [
        {
          id: "q4",
          text: l("I prefer working with people rather than things.", "Я предпочитаю работать с людьми, а не с вещами."),
          type: "likert",
          choices: [
            { id: "q4a1", text: l("Strongly Disagree", "Совершенно не согласен"), variables: [{ variableId: "v_social", value: 1 }] },
            { id: "q4a2", text: l("Disagree", "Не согласен"), variables: [{ variableId: "v_social", value: 2 }] },
            { id: "q4a3", text: l("Neutral", "Нейтрально"), variables: [{ variableId: "v_social", value: 3 }] },
            { id: "q4a4", text: l("Agree", "Согласен"), variables: [{ variableId: "v_social", value: 4 }] },
            { id: "q4a5", text: l("Strongly Agree", "Совершенно согласен"), variables: [{ variableId: "v_social", value: 5 }] },
          ],
        },
        {
          id: "q5",
          text: l("I enjoy leading a team and making decisions.", "Мне нравится руководить командой и принимать решения."),
          type: "likert",
          choices: [
            { id: "q5a1", text: l("Strongly Disagree", "Совершенно не согласен"), variables: [{ variableId: "v_enterprising", value: 1 }] },
            { id: "q5a2", text: l("Disagree", "Не согласен"), variables: [{ variableId: "v_enterprising", value: 2 }] },
            { id: "q5a3", text: l("Neutral", "Нейтрально"), variables: [{ variableId: "v_enterprising", value: 3 }] },
            { id: "q5a4", text: l("Agree", "Согласен"), variables: [{ variableId: "v_enterprising", value: 4 }] },
            { id: "q5a5", text: l("Strongly Agree", "Совершенно согласен"), variables: [{ variableId: "v_enterprising", value: 5 }] },
          ],
        },
        {
          id: "q6",
          text: l("I like following clear procedures and organizing information.", "Мне нравится следовать чётким процедурам и организовывать информацию."),
          type: "likert",
          choices: [
            { id: "q6a1", text: l("Strongly Disagree", "Совершенно не согласен"), variables: [{ variableId: "v_conventional", value: 1 }] },
            { id: "q6a2", text: l("Disagree", "Не согласен"), variables: [{ variableId: "v_conventional", value: 2 }] },
            { id: "q6a3", text: l("Neutral", "Нейтрально"), variables: [{ variableId: "v_conventional", value: 3 }] },
            { id: "q6a4", text: l("Agree", "Согласен"), variables: [{ variableId: "v_conventional", value: 4 }] },
            { id: "q6a5", text: l("Strongly Agree", "Совершенно согласен"), variables: [{ variableId: "v_conventional", value: 5 }] },
          ],
        },
      ],
    },
  ],
  characteristicSections: [
    {
      groupId: "interests",
      mappings: [
        { characteristicId: "chr_realistic", formula: "realistic" },
        { characteristicId: "chr_investigative", formula: "investigative" },
        { characteristicId: "chr_artistic", formula: "artistic" },
        { characteristicId: "chr_social", formula: "social" },
        { characteristicId: "chr_enterprising", formula: "enterprising" },
        { characteristicId: "chr_conventional", formula: "conventional" },
      ],
    },
  ],
  resultWidgets: [
    {
      id: "rw1",
      componentType: "radar_chart",
      title: l("RIASEC Profile", "Профиль RIASEC"),
      sql: "SELECT name, score FROM characteristic_scores WHERE attempt_id = :attempt_id AND group_id = 'interests' ORDER BY name",
      params: [],
    },
    {
      id: "rw2",
      componentType: "bar_chart",
      title: l("Scores by Type", "Баллы по типам"),
      sql: "SELECT name, score FROM characteristic_scores WHERE attempt_id = :attempt_id AND group_id = 'interests' ORDER BY score DESC",
      params: [],
    },
    {
      id: "rw3",
      componentType: "summary_text",
      title: l("Results Summary", "Сводка результатов"),
      sql: "SELECT name, score FROM characteristic_scores WHERE attempt_id = :attempt_id AND group_id = 'interests' ORDER BY score DESC LIMIT 3",
      params: [],
    },
  ],
  orgDashboardWidgets: [
    {
      id: "odw1",
      componentType: "bar_chart",
      title: l("Average Scores by Type", "Средние баллы по типам"),
      sql: "SELECT name, AVG(score) AS score FROM characteristic_scores WHERE group_id = 'interests' GROUP BY name ORDER BY name",
      params: [],
    },
    {
      id: "odw2",
      componentType: "score_table",
      title: l("Group Statistics", "Статистика по группам"),
      sql: "SELECT name, AVG(score) AS score FROM characteristic_scores WHERE group_id = 'interests' GROUP BY name ORDER BY score DESC",
      params: [],
    },
  ],
  regionDashboardWidgets: [
    {
      id: "rdw1",
      componentType: "bar_chart",
      title: l("Regional Average Scores", "Средние баллы по региону"),
      sql: "SELECT name, AVG(score) AS score FROM characteristic_scores WHERE region_id = :region_id AND group_id = 'interests' GROUP BY name ORDER BY name",
      params: [],
    },
    {
      id: "rdw2",
      componentType: "pie_chart",
      title: l("Top Type Distribution", "Распределение ведущих типов"),
      sql: "SELECT name, COUNT(*) AS score FROM characteristic_scores WHERE region_id = :region_id AND group_id = 'interests' GROUP BY name",
      params: [],
    },
    {
      id: "rdw3",
      componentType: "stat_card",
      title: l("Completion Rate", "Процент завершения"),
      sql: "SELECT ROUND(COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*)) AS pct FROM test_attempts WHERE region_id = :region_id",
      params: [],
    },
  ],
};

// Map for looking up test data by ID
export const contentTestMap: Record<string, ContentTest> = {
  holland: hollandTest,
};
