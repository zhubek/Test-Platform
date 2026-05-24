// Parameter-based visibility rule for a test (Level 2: one level of groups).
//
// A rule decides whether a student — based on their license-redemption
// answers — can see a given test. It's a top-level All/Any combination of
// items, where each item is either a single condition or a group (which has
// its own All/Any over its conditions). Groups do not nest further.

export type Combinator = "all" | "any"; // AND | OR

export type ConditionOperator =
  | "is" // single-choice equals
  | "isNot" // single-choice not equals
  | "includesAny" // multi-choice: student picked at least one of values
  | "includesAll"; // multi-choice: student picked all of values

export interface RuleCondition {
  id: string;
  kind: "condition";
  parameterId: string;
  operator: ConditionOperator;
  values: string[]; // selected option ids
}

export interface RuleGroup {
  id: string;
  kind: "group";
  combinator: Combinator;
  conditions: RuleCondition[];
}

export type RuleItem = RuleCondition | RuleGroup;

export interface VisibilityRule {
  combinator: Combinator; // top-level All/Any
  items: RuleItem[];
}

export const emptyRule = (): VisibilityRule => ({ combinator: "all", items: [] });

// ── Evaluation ────────────────────────────────────────────────────────────
// answers: parameterId -> selected option id(s) the student gave at redemption.

type Answers = Record<string, string | string[]>;

function answerSet(answers: Answers, parameterId: string): string[] {
  const a = answers[parameterId];
  if (a == null) return [];
  return Array.isArray(a) ? a : [a];
}

function evalCondition(c: RuleCondition, answers: Answers): boolean {
  const picked = answerSet(answers, c.parameterId);
  switch (c.operator) {
    case "is":
      return picked.length > 0 && c.values.includes(picked[0]);
    case "isNot":
      return picked.length === 0 || !c.values.includes(picked[0]);
    case "includesAny":
      return c.values.some((v) => picked.includes(v));
    case "includesAll":
      return c.values.every((v) => picked.includes(v));
  }
}

function combine(combinator: Combinator, results: boolean[]): boolean {
  if (results.length === 0) return true; // empty = no constraint
  return combinator === "all" ? results.every(Boolean) : results.some(Boolean);
}

export function evaluateRule(rule: VisibilityRule, answers: Answers): boolean {
  if (rule.items.length === 0) return true; // no rule = visible to everyone
  const itemResults = rule.items.map((item) =>
    item.kind === "condition"
      ? evalCondition(item, answers)
      : combine(item.combinator, item.conditions.map((c) => evalCondition(c, answers))),
  );
  return combine(rule.combinator, itemResults);
}
