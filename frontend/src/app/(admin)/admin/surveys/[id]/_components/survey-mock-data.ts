import { l } from "@/lib/localized";
import type { ContentSurvey } from "../../../_components/mock-data";

const satisfactionSurvey: ContentSurvey = {
  id: "satisfaction",
  name: l("Student Satisfaction Survey", "Опрос удовлетворённости учеников"),
  description: l(
    "Measures student satisfaction with the testing process, platform usability, and perceived value of career guidance.",
    "Измеряет удовлетворённость учеников процессом тестирования, удобством платформы и воспринимаемой ценностью профориентации."
  ),
  format: "included",
  duration: 5,
  status: "published",
  createdAt: "2025-11-10",
  updatedAt: "2026-02-18",
  sections: [
    {
      id: "sec1",
      title: l("Platform Experience", "Опыт использования платформы"),
      description: l("Rate your experience with the platform", "Оцените ваш опыт работы с платформой"),
      questions: [
        {
          id: "q1",
          text: l("How easy was it to navigate the platform?", "Насколько легко было ориентироваться на платформе?"),
          type: "likert",
          choices: [
            { id: "c1", text: l("Very difficult", "Очень сложно"), variables: [] },
            { id: "c2", text: l("Difficult", "Сложно"), variables: [] },
            { id: "c3", text: l("Neutral", "Нейтрально"), variables: [] },
            { id: "c4", text: l("Easy", "Легко"), variables: [] },
            { id: "c5", text: l("Very easy", "Очень легко"), variables: [] },
          ],
        },
        {
          id: "q2",
          text: l("How useful were the test results?", "Насколько полезными были результаты теста?"),
          type: "likert",
          choices: [
            { id: "c6", text: l("Not useful", "Бесполезны"), variables: [] },
            { id: "c7", text: l("Slightly useful", "Немного полезны"), variables: [] },
            { id: "c8", text: l("Neutral", "Нейтрально"), variables: [] },
            { id: "c9", text: l("Useful", "Полезны"), variables: [] },
            { id: "c10", text: l("Very useful", "Очень полезны"), variables: [] },
          ],
        },
      ],
    },
  ],
  orgDashboardWidgets: [],
  regionDashboardWidgets: [],
};

export const surveyMap: Record<string, ContentSurvey> = {
  satisfaction: satisfactionSurvey,
};
