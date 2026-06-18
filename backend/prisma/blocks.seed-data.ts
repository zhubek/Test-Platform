// Prepared blocks seeded into the library. One per chart widget, plus a few that
// showcase the template logic (operations, conditionals, sorting, randomizing).
// Shared by seed.ts (fresh installs) and seed-blocks-extra.ts (live top-up).

export type SeedBlock = {
  type: 'TEST' | 'RESULT' | 'DASHBOARD' | 'CATALOG';
  name: string;
  description: string;
  html: string;
  props: { name: string; type: string; value: unknown }[];
};

const RIASEC = [
  { name: 'Realistic', subject: 'R', value: 72 },
  { name: 'Investigative', subject: 'I', value: 65 },
  { name: 'Artistic', subject: 'A', value: 48 },
  { name: 'Social', subject: 'S', value: 81 },
  { name: 'Enterprising', subject: 'E', value: 57 },
  { name: 'Conventional', subject: 'C', value: 40 },
];

const WEEK = [
  { name: 'Mon', value: 120 }, { name: 'Tue', value: 180 }, { name: 'Wed', value: 150 },
  { name: 'Thu', value: 220 }, { name: 'Fri', value: 300 }, { name: 'Sat', value: 90 }, { name: 'Sun', value: 60 },
];

const PROFESSIONS = [
  { name: 'Software Developer', group: 'Engineering', demand: 92, salary: 650000, popular: true },
  { name: 'Data Analyst', group: 'Engineering', demand: 78, salary: 520000, popular: false },
  { name: 'Nurse', group: 'Healthcare', demand: 85, salary: 380000, popular: true },
  { name: 'Civil Engineer', group: 'Engineering', demand: 64, salary: 480000, popular: false },
  { name: 'Teacher', group: 'Education', demand: 70, salary: 320000, popular: false },
  { name: 'Accountant', group: 'Business', demand: 58, salary: 410000, popular: false },
  { name: 'UX Designer', group: 'Design', demand: 74, salary: 540000, popular: true },
];

export const STARTER_BLOCKS: SeedBlock[] = [
  // ── Test question blocks — one per question type ─────────────────────────
  // Every test block carries an answer VARIABLE (field) and, where applicable,
  // OPTIONS that each have a scoring VALUE.
  {
    type: 'TEST',
    name: 'Single-choice question',
    description: 'Pick one option. Each option carries a scoring value.',
    html: `<div class="rounded-2xl border bg-white p-6 shadow-sm">
  <h3 class="text-lg font-semibold text-gray-900">{{prompt}}</h3>
  <div class="mt-4">
    <widget name="single-choice" data-field="{{field}}" data-source="options"></widget>
  </div>
</div>`,
    props: [
      { name: 'prompt', type: 'text', value: 'Which activity sounds most appealing?' },
      { name: 'field', type: 'text', value: 'interest' },
      { name: 'options', type: 'json', value: [
        { text: 'Build or repair something', value: 1 },
        { text: 'Help or teach someone', value: 2 },
        { text: 'Analyze data or research', value: 3 },
        { text: 'Create art or design', value: 4 },
      ] },
    ],
  },
  {
    type: 'TEST',
    name: 'Multiple-choice question',
    description: 'Select all that apply. Each option carries a scoring value.',
    html: `<div class="rounded-2xl border bg-white p-6 shadow-sm">
  <h3 class="text-lg font-semibold text-gray-900">{{prompt}}</h3>
  <div class="mt-4">
    <widget name="multi-choice" data-field="{{field}}" data-source="options"></widget>
  </div>
</div>`,
    props: [
      { name: 'prompt', type: 'text', value: 'Which subjects do you enjoy?' },
      { name: 'field', type: 'text', value: 'subjects' },
      { name: 'options', type: 'json', value: [
        { text: 'Mathematics', value: 1 },
        { text: 'Biology', value: 1 },
        { text: 'Literature', value: 1 },
        { text: 'Computer Science', value: 1 },
      ] },
    ],
  },
  {
    type: 'TEST',
    name: 'Likert scale',
    description: 'An agree/disagree scale. The chosen point (1..n) is the value.',
    html: `<div class="rounded-2xl border bg-white p-6 shadow-sm">
  <h3 class="text-lg font-semibold text-gray-900">{{prompt}}</h3>
  <div class="mt-5">
    <widget name="likert" data-field="{{field}}" data-scale="{{scale}}" data-min-label="{{minLabel}}" data-max-label="{{maxLabel}}"></widget>
  </div>
</div>`,
    props: [
      { name: 'prompt', type: 'text', value: 'I enjoy solving complex problems.' },
      { name: 'field', type: 'text', value: 'investigative' },
      { name: 'scale', type: 'number', value: 5 },
      { name: 'minLabel', type: 'text', value: 'Strongly disagree' },
      { name: 'maxLabel', type: 'text', value: 'Strongly agree' },
    ],
  },
  {
    type: 'TEST',
    name: 'Rating (stars)',
    description: 'A star rating. The selected count is the value.',
    html: `<div class="rounded-2xl border bg-white p-6 shadow-sm">
  <h3 class="text-lg font-semibold text-gray-900">{{prompt}}</h3>
  <div class="mt-4">
    <widget name="rating" data-field="{{field}}" data-max="{{max}}"></widget>
  </div>
</div>`,
    props: [
      { name: 'prompt', type: 'text', value: 'How interested are you in healthcare careers?' },
      { name: 'field', type: 'text', value: 'social' },
      { name: 'max', type: 'number', value: 5 },
    ],
  },
  {
    type: 'TEST',
    name: 'Slider (scale)',
    description: 'A numeric slider between min and max. The position is the value.',
    html: `<div class="rounded-2xl border bg-white p-6 shadow-sm">
  <h3 class="text-lg font-semibold text-gray-900">{{prompt}}</h3>
  <div class="mt-5">
    <widget name="slider" data-field="{{field}}" data-min="{{min}}" data-max="{{max}}" data-step="{{step}}"></widget>
  </div>
</div>`,
    props: [
      { name: 'prompt', type: 'text', value: 'How many hours a week can you study?' },
      { name: 'field', type: 'text', value: 'hours' },
      { name: 'min', type: 'number', value: 0 },
      { name: 'max', type: 'number', value: 40 },
      { name: 'step', type: 'number', value: 1 },
    ],
  },
  {
    type: 'TEST',
    name: 'Dropdown question',
    description: 'A compact select. Each option carries a scoring value.',
    html: `<div class="rounded-2xl border bg-white p-6 shadow-sm">
  <h3 class="text-lg font-semibold text-gray-900">{{prompt}}</h3>
  <div class="mt-4">
    <widget name="dropdown" data-field="{{field}}" data-source="options" data-placeholder="{{placeholder}}"></widget>
  </div>
</div>`,
    props: [
      { name: 'prompt', type: 'text', value: 'What is your current grade?' },
      { name: 'field', type: 'text', value: 'grade' },
      { name: 'placeholder', type: 'text', value: 'Choose a grade…' },
      { name: 'options', type: 'json', value: [
        { text: 'Grade 9', value: 9 },
        { text: 'Grade 10', value: 10 },
        { text: 'Grade 11', value: 11 },
      ] },
    ],
  },
  {
    type: 'TEST',
    name: 'Short text answer',
    description: 'A single-line free-text answer bound to a variable.',
    html: `<div class="rounded-2xl border bg-white p-6 shadow-sm">
  <h3 class="text-lg font-semibold text-gray-900">{{prompt}}</h3>
  <div class="mt-4">
    <widget name="short-text" data-field="{{field}}" data-placeholder="{{placeholder}}"></widget>
  </div>
</div>`,
    props: [
      { name: 'prompt', type: 'text', value: 'Which profession are you most curious about?' },
      { name: 'field', type: 'text', value: 'dream_job' },
      { name: 'placeholder', type: 'text', value: 'Type a profession…' },
    ],
  },
  {
    type: 'TEST',
    name: 'Long text answer',
    description: 'A multi-line free-text answer bound to a variable.',
    html: `<div class="rounded-2xl border bg-white p-6 shadow-sm">
  <h3 class="text-lg font-semibold text-gray-900">{{prompt}}</h3>
  <div class="mt-4">
    <widget name="long-text" data-field="{{field}}" data-placeholder="{{placeholder}}"></widget>
  </div>
</div>`,
    props: [
      { name: 'prompt', type: 'text', value: 'Describe a project you are proud of.' },
      { name: 'field', type: 'text', value: 'project_note' },
      { name: 'placeholder', type: 'text', value: 'A few sentences…' },
    ],
  },
  {
    type: 'TEST',
    name: 'Yes / No question',
    description: 'A two-option toggle bound to a variable.',
    html: `<div class="rounded-2xl border bg-white p-6 shadow-sm">
  <h3 class="text-lg font-semibold text-gray-900">{{prompt}}</h3>
  <div class="mt-4">
    <widget name="yes-no" data-field="{{field}}" data-yes-label="{{yesLabel}}" data-no-label="{{noLabel}}"></widget>
  </div>
</div>`,
    props: [
      { name: 'prompt', type: 'text', value: 'Do you prefer working in a team?' },
      { name: 'field', type: 'text', value: 'team_pref' },
      { name: 'yesLabel', type: 'text', value: 'Yes' },
      { name: 'noLabel', type: 'text', value: 'No' },
    ],
  },
  {
    type: 'TEST',
    name: 'Ranking question',
    description: 'Reorder options by preference (drag via the arrows). Position is the value.',
    html: `<div class="rounded-2xl border bg-white p-6 shadow-sm">
  <h3 class="text-lg font-semibold text-gray-900">{{prompt}}</h3>
  <div class="mt-4">
    <widget name="rank" data-field="{{field}}" data-source="options"></widget>
  </div>
</div>`,
    props: [
      { name: 'prompt', type: 'text', value: 'Rank these work environments by preference.' },
      { name: 'field', type: 'text', value: 'env_rank' },
      { name: 'options', type: 'json', value: [
        { text: 'Office', value: 1 },
        { text: 'Outdoors', value: 2 },
        { text: 'Laboratory', value: 3 },
        { text: 'Remote / home', value: 4 },
      ] },
    ],
  },

  // ── One block per chart widget ──────────────────────────────────────────
  {
    type: 'DASHBOARD',
    name: 'Bar chart — scores by category',
    description: 'Vertical bars from a data array. Bind data-source, x, y, color.',
    html: `<div class="rounded-2xl border bg-white p-5 shadow-sm">
  <h3 class="mb-2 text-sm font-semibold text-gray-700">{{title}}</h3>
  <widget name="bar-chart" data-source="scores" data-x="name" data-y="value" data-color="{{accent}}" class="h-64"></widget>
</div>`,
    props: [
      { name: 'title', type: 'text', value: 'Scores by category' },
      { name: 'accent', type: 'color', value: '#0d9488' },
      { name: 'scores', type: 'json', value: RIASEC.map((r) => ({ name: r.name, value: r.value })) },
    ],
  },
  {
    type: 'DASHBOARD',
    name: 'Line chart — completions over time',
    description: 'A trend line over a series.',
    html: `<div class="rounded-2xl border bg-white p-5 shadow-sm">
  <h3 class="mb-2 text-sm font-semibold text-gray-700">{{title}}</h3>
  <widget name="line-chart" data-source="series" data-x="name" data-y="value" data-color="blue" class="h-64"></widget>
</div>`,
    props: [
      { name: 'title', type: 'text', value: 'Completions this week' },
      { name: 'series', type: 'json', value: WEEK },
    ],
  },
  {
    type: 'DASHBOARD',
    name: 'Area chart — cumulative sign-ups',
    description: 'A filled area trend.',
    html: `<div class="rounded-2xl border bg-white p-5 shadow-sm">
  <h3 class="mb-2 text-sm font-semibold text-gray-700">{{title}}</h3>
  <widget name="area-chart" data-source="series" data-x="name" data-y="value" data-color="violet" class="h-64"></widget>
</div>`,
    props: [
      { name: 'title', type: 'text', value: 'Cumulative sign-ups' },
      { name: 'series', type: 'json', value: WEEK.map((w, i) => ({ name: w.name, value: WEEK.slice(0, i + 1).reduce((s, x) => s + x.value, 0) })) },
    ],
  },
  {
    type: 'DASHBOARD',
    name: 'Pie chart — region split',
    description: 'Proportions across categories.',
    html: `<div class="rounded-2xl border bg-white p-5 shadow-sm">
  <h3 class="mb-2 text-sm font-semibold text-gray-700">{{title}}</h3>
  <widget name="pie-chart" data-source="slices" data-name-key="name" data-value-key="value" class="h-64"></widget>
</div>`,
    props: [
      { name: 'title', type: 'text', value: 'Test-takers by region' },
      { name: 'slices', type: 'json', value: [{ name: 'Almaty', value: 420 }, { name: 'Astana', value: 310 }, { name: 'Shymkent', value: 180 }, { name: 'Other', value: 90 }] },
    ],
  },
  {
    type: 'DASHBOARD',
    name: 'Donut chart — license usage',
    description: 'A pie with a hole; good for usage breakdowns.',
    html: `<div class="rounded-2xl border bg-white p-5 shadow-sm">
  <h3 class="mb-2 text-sm font-semibold text-gray-700">{{title}}</h3>
  <widget name="donut-chart" data-source="slices" class="h-64"></widget>
</div>`,
    props: [
      { name: 'title', type: 'text', value: 'License usage' },
      { name: 'slices', type: 'json', value: [{ name: 'Redeemed', value: 680 }, { name: 'Issued', value: 240 }, { name: 'Expired', value: 80 }] },
    ],
  },
  {
    type: 'CATALOG',
    name: 'Radar chart — RIASEC profile',
    description: 'A radar over labelled axes. Same component used on profession pages.',
    html: `<div class="rounded-2xl border bg-white p-5 shadow-sm">
  <h3 class="mb-2 text-sm font-semibold text-gray-700">{{title}}</h3>
  <widget name="radar-chart" data-source="riasec" data-subject-key="subject" data-value-key="value" data-color="teal" class="h-72"></widget>
</div>`,
    props: [
      { name: 'title', type: 'text', value: 'Interest profile' },
      { name: 'riasec', type: 'json', value: RIASEC.map((r) => ({ subject: r.subject, value: r.value })) },
    ],
  },
  {
    type: 'DASHBOARD',
    name: 'Radial gauge — completion rate',
    description: 'A single-value gauge. Uses pct() to compute the percentage.',
    html: `<div class="rounded-2xl border bg-white p-5 text-center shadow-sm">
  <h3 class="text-sm font-semibold text-gray-700">{{title}}</h3>
  <widget name="radial-gauge" data-value="{{completed}}" data-max="{{total}}" data-color="teal" class="h-56"></widget>
  <p class="text-xs text-gray-500">{{completed}} of {{total}} completed ({{ pct(completed, total) }}%)</p>
</div>`,
    props: [
      { name: 'title', type: 'text', value: 'Completion rate' },
      { name: 'completed', type: 'number', value: 842 },
      { name: 'total', type: 'number', value: 1000 },
    ],
  },
  {
    type: 'DASHBOARD',
    name: 'Scatter chart — score vs minutes',
    description: 'Points on an x/y plane.',
    html: `<div class="rounded-2xl border bg-white p-5 shadow-sm">
  <h3 class="mb-2 text-sm font-semibold text-gray-700">{{title}}</h3>
  <widget name="scatter-chart" data-source="points" data-x="minutes" data-y="score" data-color="rose" class="h-64"></widget>
</div>`,
    props: [
      { name: 'title', type: 'text', value: 'Score vs time spent' },
      { name: 'points', type: 'json', value: [{ minutes: 8, score: 55 }, { minutes: 12, score: 62 }, { minutes: 15, score: 70 }, { minutes: 18, score: 68 }, { minutes: 22, score: 81 }, { minutes: 30, score: 88 }] },
    ],
  },

  // ── Logic showcases ─────────────────────────────────────────────────────
  {
    type: 'DASHBOARD',
    name: 'KPI row — operations & conditionals',
    description: 'Computed metrics with pct()/arithmetic and data-if status badges.',
    html: `<div class="grid grid-cols-3 gap-3">
  <div class="rounded-2xl border bg-white p-4 shadow-sm">
    <div class="text-xs uppercase tracking-wide text-gray-400">Completion</div>
    <div class="mt-1 text-2xl font-bold text-gray-900">{{ pct(completed, total) }}%</div>
    <div class="text-xs text-gray-500">{{completed}} / {{total}}</div>
  </div>
  <div class="rounded-2xl border bg-white p-4 shadow-sm">
    <div class="text-xs uppercase tracking-wide text-gray-400">Remaining</div>
    <div class="mt-1 text-2xl font-bold text-gray-900">{{ total - completed }}</div>
    <div class="text-xs text-gray-500">still pending</div>
  </div>
  <div class="rounded-2xl border bg-white p-4 shadow-sm">
    <div class="text-xs uppercase tracking-wide text-gray-400">vs target</div>
    <div class="mt-1 text-2xl font-bold text-teal-600" data-if="completed >= target">On track</div>
    <div class="mt-1 text-2xl font-bold text-amber-600" data-if="completed < target">Behind</div>
    <div class="text-xs text-gray-500">target {{target}}</div>
  </div>
</div>`,
    props: [
      { name: 'completed', type: 'number', value: 842 },
      { name: 'total', type: 'number', value: 1000 },
      { name: 'target', type: 'number', value: 800 },
    ],
  },
  {
    type: 'CATALOG',
    name: 'Top professions — sorted table',
    description: 'data-sort="demand desc" + data-pick="5" ranks a list. {{ index + 1 }} numbers it.',
    html: `<div class="rounded-2xl border bg-white p-5 shadow-sm">
  <h3 class="mb-3 text-sm font-semibold text-gray-700">{{title}}</h3>
  <table class="w-full text-sm">
    <thead>
      <tr class="text-left text-xs uppercase tracking-wide text-gray-400">
        <th class="pb-2">#</th><th class="pb-2">Profession</th><th class="pb-2">Group</th><th class="pb-2 text-right">Demand</th>
      </tr>
    </thead>
    <tbody>
      <tr data-each="rows" data-sort="demand desc" data-pick="5" class="border-t border-gray-100">
        <td class="py-1.5 text-gray-400">{{ index + 1 }}</td>
        <td class="py-1.5 font-medium text-gray-900">{{item.name}}</td>
        <td class="py-1.5 text-gray-500">{{item.group}}</td>
        <td class="py-1.5 text-right font-semibold text-teal-600">{{item.demand}}</td>
      </tr>
    </tbody>
  </table>
</div>`,
    props: [
      { name: 'title', type: 'text', value: 'Most in-demand professions' },
      { name: 'rows', type: 'json', value: PROFESSIONS },
    ],
  },
  {
    type: 'CATALOG',
    name: 'Featured professions — randomized',
    description: 'data-shuffle + data-pick="3" surface a random subset each render (seeded).',
    html: `<div class="grid grid-cols-3 gap-3" data-each="pool" data-shuffle data-pick="3">
  <div class="rounded-2xl border bg-white p-4 shadow-sm">
    <div class="text-[0.7rem] font-semibold uppercase tracking-wider text-teal-600">{{item.group}}</div>
    <h4 class="mt-1 font-bold text-gray-900">{{item.name}}</h4>
    <div class="mt-2 text-xs text-gray-500">Demand {{item.demand}}</div>
  </div>
</div>`,
    props: [{ name: 'pool', type: 'json', value: PROFESSIONS }],
  },
  {
    type: 'CATALOG',
    name: 'Profession card — conditional badges',
    description: 'data-if drives a Popular star and a salary-tier label from operations.',
    html: `<div class="rounded-2xl border bg-white p-5 shadow-sm">
  <div class="flex items-center justify-between">
    <h3 class="text-lg font-bold text-gray-900">{{title}}</h3>
    <span class="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700" data-if="popular">★ Popular</span>
  </div>
  <p class="mt-1 text-sm text-gray-500">{{summary}}</p>
  <div class="mt-3 text-sm text-gray-600">
    Salary fit:
    <span class="font-semibold text-teal-600" data-if="salary >= 500000">High ({{ round(salary / 1000) }}k)</span>
    <span class="font-semibold text-gray-500" data-if="salary < 500000">Moderate ({{ round(salary / 1000) }}k)</span>
  </div>
</div>`,
    props: [
      { name: 'title', type: 'text', value: 'Software Developer' },
      { name: 'summary', type: 'text', value: 'Designs and builds software systems.' },
      { name: 'popular', type: 'boolean', value: true },
      { name: 'salary', type: 'number', value: 650000 },
    ],
  },
];
