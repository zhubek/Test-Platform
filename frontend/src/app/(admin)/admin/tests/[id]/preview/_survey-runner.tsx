"use client";

import { useMemo, useState } from "react";
import { Model } from "survey-core";
import { Survey } from "survey-react-ui";
import "survey-core/survey-core.css";
import type { SurveyJsSchema } from "@/lib/surveyjs";

interface Props {
  schema: SurveyJsSchema;
  locale: "en" | "ru" | "kz";
}

export default function SurveyRunner({ schema, locale }: Props) {
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  const survey = useMemo(() => {
    const m = new Model(schema);
    m.locale = locale === "kz" ? "kk" : locale;
    m.onComplete.add((s) => setResult(s.data));
    return m;
  }, [schema, locale]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-100 shadow-sm bg-white p-4">
        <Survey model={survey} />
      </div>
      {result && (
        <div className="rounded-xl border border-gray-100 shadow-sm bg-white p-4">
          <h3 className="text-[0.88rem] font-semibold text-gray-900 mb-2">
            Submitted answers (raw)
          </h3>
          <pre className="text-[0.72rem] font-mono text-gray-700 bg-gray-50 p-3 rounded-lg overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
          <p className="text-[0.72rem] text-gray-400 mt-2">
            This is what the scoring layer + math.js will consume after submission.
          </p>
        </div>
      )}
    </div>
  );
}
