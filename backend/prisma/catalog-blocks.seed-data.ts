// Catalog view blocks — library recreations of the hand-coded profession views
// (Description / Education / Labor market tabs on the public profession page).
// Markup + Tailwind classes are copied from the React components so the blocks
// render pixel-close.
//
// Design rule: section titles / labels ("Key Responsibilities", "Public",
// "Contacts", …) are STATIC text inside the template — they belong to the
// block's design. Props are DATA only, and are filled per catalog item.
//
// "Profession · Education" demonstrates block NESTING: it embeds the
// university / college blocks via <block name="…" data-…="…">.
//
// Seeded by seed.ts (fresh installs) and seed-catalog-blocks.ts (live top-up).

import type { SeedBlock } from './blocks.seed-data';

const CARD_SHADOW =
  'shadow-[0_1px_3px_0_rgb(0_0_0/0.04),0_4px_14px_-2px_rgb(0_0_0/0.05)]';
const SMALL_SHADOW =
  'shadow-[0_1px_2px_0_rgb(0_0_0/0.03),0_2px_8px_-2px_rgb(0_0_0/0.04)]';

// ── Blocks ───────────────────────────────────────────────────────────────────

export const CATALOG_VIEW_BLOCKS: SeedBlock[] = [
  {
    type: 'CATALOG',
    name: 'Profession · Description',
    description:
      'The profession Description view: intro, responsibilities, typical day, skills, work environment, specializations.',
    html: `<div class="space-y-5">
  <div class="bg-gradient-to-br from-blue-50/60 to-white border-l-4 border-l-blue-600 border border-black/[0.04] rounded-2xl p-6 ${CARD_SHADOW}">
    <h3 class="text-base font-bold text-gray-900 mb-2">What is a {{title}}?</h3>
    <p class="text-sm text-gray-600 leading-relaxed">{{intro}}</p>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div class="bg-white border border-black/[0.04] rounded-2xl p-6 relative overflow-hidden ${CARD_SHADOW}">
      <div class="w-10 h-1 rounded-full bg-blue-600 mb-3.5"></div>
      <h3 class="text-base font-bold text-gray-900 mb-2">Key Responsibilities</h3>
      <ul class="space-y-1.5 ml-4" data-each="responsibilities">
        <li class="text-sm text-gray-600 leading-relaxed list-disc">{{item}}</li>
      </ul>
    </div>
    <div class="bg-white border border-black/[0.04] rounded-2xl p-6 relative overflow-hidden ${CARD_SHADOW}">
      <div class="w-10 h-1 rounded-full bg-violet-600 mb-3.5"></div>
      <h3 class="text-base font-bold text-gray-900 mb-2">A Typical Day</h3>
      <ul class="space-y-2" data-each="typicalDay">
        <li class="text-sm text-gray-600 leading-relaxed"><strong class="text-gray-700">{{item.period}}:</strong> {{item.text}}</li>
      </ul>
    </div>
  </div>

  <div class="bg-white border border-black/[0.04] rounded-2xl p-6 relative overflow-hidden ${CARD_SHADOW}">
    <div class="w-10 h-1 rounded-full bg-emerald-600 mb-3.5"></div>
    <h3 class="text-base font-bold text-gray-900 mb-2">Required Skills</h3>
    <div class="flex flex-wrap gap-2 mt-1" data-each="skills">
      <span class="text-xs font-semibold px-2.5 py-1 rounded-full {{item.color}}">{{item.label}}</span>
    </div>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div class="bg-white border border-black/[0.04] rounded-2xl p-6 relative overflow-hidden ${CARD_SHADOW}">
      <div class="w-10 h-1 rounded-full bg-pink-600 mb-3.5"></div>
      <h3 class="text-base font-bold text-gray-900 mb-2">Work Environment</h3>
      <div data-each="workEnvironment">
        <p class="text-sm text-gray-600 leading-relaxed mb-2">{{item}}</p>
      </div>
    </div>
    <div class="bg-white border border-black/[0.04] rounded-2xl p-6 relative overflow-hidden ${CARD_SHADOW}">
      <div class="w-10 h-1 rounded-full bg-sky-700 mb-3.5"></div>
      <h3 class="text-base font-bold text-gray-900 mb-2">Specializations</h3>
      <table class="w-full text-left">
        <thead>
          <tr class="border-b border-gray-100">
            <th class="text-sm font-semibold text-gray-600 py-1.5 pr-3 bg-gray-50/50">Path</th>
            <th class="text-sm font-semibold text-gray-600 py-1.5 bg-gray-50/50">Tools</th>
          </tr>
        </thead>
        <tbody data-each="specializations">
          <tr class="border-b border-gray-50">
            <td class="text-sm text-gray-600 py-1.5 pr-3">{{item.path}}</td>
            <td class="text-sm text-gray-500 py-1.5">{{item.tools}}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>`,
    props: [
      { name: 'title', type: 'text', value: 'Data Scientist' },
      { name: 'intro', type: 'text', value: 'Data Scientists combine statistical analysis, machine learning, and domain expertise to extract actionable insights from large and complex datasets. They work across industries — from tech and finance to healthcare and retail — helping organizations make data-driven decisions. This profession is consistently ranked among the top careers for job satisfaction, growth potential, and compensation.' },
      { name: 'responsibilities', type: 'json', value: [
        'Collect, clean, and preprocess structured and unstructured data',
        'Build predictive models and machine learning pipelines',
        'Design and run A/B tests and experiments',
        'Create dashboards and visualizations to communicate findings',
        'Collaborate with product, engineering, and business teams',
        'Present insights and recommendations to stakeholders',
      ] },
      { name: 'typicalDay', type: 'json', value: [
        { period: 'Morning', text: 'Review data pipeline outputs, check model performance metrics, respond to Slack messages from product team' },
        { period: 'Midday', text: 'Deep work — feature engineering, model training, or exploratory data analysis in Jupyter notebooks' },
        { period: 'Afternoon', text: 'Cross-functional meeting to present findings, pair-programming with ML engineers, documentation' },
      ] },
      { name: 'skills', type: 'json', value: [
        { label: 'Python', color: 'bg-blue-100 text-blue-800' },
        { label: 'R', color: 'bg-blue-100 text-blue-800' },
        { label: 'SQL', color: 'bg-blue-100 text-blue-800' },
        { label: 'Statistics', color: 'bg-violet-100 text-violet-800' },
        { label: 'Machine Learning', color: 'bg-violet-100 text-violet-800' },
        { label: 'Communication', color: 'bg-emerald-100 text-emerald-800' },
        { label: 'Domain Knowledge', color: 'bg-amber-100 text-amber-800' },
      ] },
      { name: 'workEnvironment', type: 'json', value: [
        'Most data scientists work in office or remote settings with flexible hours. The role is primarily individual but involves regular cross-functional collaboration.',
        'Work-life balance is generally good, though deadlines and product launches can create peak periods.',
      ] },
      { name: 'specializations', type: 'json', value: [
        { path: 'ML Engineer', tools: 'TensorFlow, PyTorch' },
        { path: 'Analytics Engineer', tools: 'dbt, Looker, BigQuery' },
        { path: 'NLP Scientist', tools: 'Hugging Face, spaCy' },
        { path: 'Computer Vision', tools: 'OpenCV, YOLO' },
        { path: 'Data Analyst', tools: 'Tableau, Excel, SQL' },
      ] },
    ],
  },

  // ── University chain: University programs → University program → card ─────
  {
    type: 'CATALOG',
    name: 'University card',
    description:
      'One university: name, public/private and grant badges, city, and collapsible contacts.',
    html: `<div class="bg-white border border-black/[0.04] rounded-xl p-4 ${SMALL_SHADOW}">
  <div class="flex items-center justify-between mb-1.5 gap-2">
    <span class="text-sm font-semibold text-gray-800">{{university.name}}</span>
    <span class="text-xs font-semibold px-2 py-0.5 rounded-md uppercase {{ if(university.type == 'public', 'bg-blue-100 text-blue-800', 'bg-amber-100 text-amber-800') }}">{{ if(university.type == 'public', 'Public', 'Private') }}</span>
  </div>
  <div class="text-xs text-gray-500 mb-1.5">{{university.city}}</div>
  <span class="text-xs font-bold px-2 py-0.5 rounded-md inline-block {{ if(university.grant, 'bg-emerald-100 text-emerald-800', 'bg-red-100 text-red-800') }}" data-if="university.grant == true || university.grant == false">{{ if(university.grant, 'Grant Available', 'No Grant') }}</span>
  <details class="mt-2" data-if="university.address || university.phone || university.email || university.website">
    <summary class="cursor-pointer text-xs font-semibold text-gray-400 uppercase tracking-wider transition-colors hover:text-gray-600">Contacts</summary>
    <div class="mt-2 space-y-1">
      <div class="text-xs text-gray-500" data-if="university.address">{{university.address}}</div>
      <div class="text-xs text-gray-500" data-if="university.phone">{{university.phone}}</div>
      <div class="text-xs text-gray-500" data-if="university.email">{{university.email}}</div>
      <div class="text-xs" data-if="university.website"><a class="text-blue-600 hover:underline" href="{{university.website}}">{{university.website}}</a></div>
    </div>
  </details>
</div>`,
    props: [
      { name: 'university', type: 'json', value: {
        name: 'Nazarbayev University', city: 'Astana', type: 'public', grant: true,
        address: '53 Kabanbay Batyr Ave, Astana 010000', email: 'admissions@nu.edu.kz',
        phone: '+7 (7172) 70-66-88', website: 'https://nu.edu.kz',
      } },
    ],
  },

  {
    type: 'CATALOG',
    name: 'University cards',
    description: 'A grid of University card blocks, fed by a reference into the Universities catalog.',
    html: `<div class="grid grid-cols-1 sm:grid-cols-2 gap-3" data-each="universities">
  <block name="University card" data-university="item"></block>
</div>`,
    props: [
      { name: 'universities', type: 'ref', value: { $catalog: 'universities', ids: [1, 2, 3] } },
    ],
  },

  {
    type: 'CATALOG',
    name: 'University program',
    description:
      'One university program: code, UNT subjects, points-by-year chart, and its universities rendered as embedded University cards.',
    html: `<details class="bg-white border border-black/[0.04] rounded-2xl overflow-hidden ${CARD_SHADOW}">
  <summary class="flex items-center gap-3.5 px-5 py-4 cursor-pointer transition-colors hover:bg-gray-50/60">
    <span class="text-gray-400">›</span>
    <span class="flex-1 min-w-0">
      <span class="block text-[0.9375rem] font-bold text-gray-800 mb-1">{{program.title}}</span>
      <span class="flex gap-3 flex-wrap items-center">
        <span class="text-xs font-semibold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-md">{{program.code}}</span>
        <span class="text-sm text-gray-500" data-if="program.subjects"><strong class="text-gray-600">UNT Subjects:</strong> {{program.subjects}}</span>
      </span>
    </span>
  </summary>
  <div class="px-5 pb-5">
    <widget name="unt-chart" data-source="program.untPoints" data-if="len(program.untPoints) > 0"></widget>
    <div class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 pb-2 border-b border-gray-100">Universities offering this specialization</div>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3" data-each="universities">
      <block name="University card" data-university="item"></block>
    </div>
  </div>
</details>`,
    props: [
      { name: 'program', type: 'json', value: {
        title: 'Computer Science', code: '6B06103', subjects: 'Math, Physics',
        untPoints: {
          general: [120, 124, 128, 130, 133],
          aul: [108, 112, 115, 118, 120],
          serpin: [100, 103, 106, 108, 110],
        },
      } },
      { name: 'universities', type: 'json', value: [
        { name: 'Nazarbayev University', city: 'Astana', type: 'public', grant: true, address: '53 Kabanbay Batyr Ave, Astana 010000', email: 'admissions@nu.edu.kz', phone: '+7 (7172) 70-66-88', website: 'https://nu.edu.kz' },
        { name: 'KBTU', city: 'Almaty', type: 'private', grant: false, address: '59 Tole Bi St, Almaty 050000', email: 'admission@kbtu.kz', phone: '+7 (727) 356-87-00', website: 'https://kbtu.kz' },
      ] },
    ],
  },

  {
    type: 'CATALOG',
    name: 'University programs',
    description:
      'Accordion of university programs (reference into the University programs catalog); each program renders as an embedded University program block.',
    html: `<div class="space-y-3" data-each="programs">
  <block name="University program" data-program="item" data-universities="item.universities"></block>
</div>`,
    props: [
      { name: 'programs', type: 'ref', value: { $catalog: 'univerPrograms', ids: [1, 2] } },
    ],
  },

  // ── College chain: College programs → College card ────────────────────────
  {
    type: 'CATALOG',
    name: 'College card',
    description:
      'One college: name, type badge, city, optional duration, and collapsible contacts.',
    html: `<div class="bg-white border border-black/[0.04] rounded-xl p-4 ${SMALL_SHADOW}">
  <div class="flex items-center justify-between mb-1.5 gap-2">
    <span class="text-sm font-semibold text-gray-800">{{college.name}}</span>
    <span class="text-xs font-semibold px-2 py-0.5 rounded-md uppercase {{ if(college.type == 'private', 'bg-amber-100 text-amber-800', 'bg-blue-100 text-blue-800') }}" data-if="college.type">{{ if(college.type == 'private', 'Private', 'Public') }}</span>
  </div>
  <div class="flex gap-3 flex-wrap mb-1.5">
    <span class="text-xs text-gray-500" data-if="college.city"><strong class="text-gray-600">City:</strong> {{college.city}}</span>
    <span class="text-xs text-gray-500" data-if="college.duration"><strong class="text-gray-600">Duration:</strong> {{college.duration}}</span>
  </div>
  <details class="mt-1" data-if="college.address || college.phone || college.email || college.website">
    <summary class="cursor-pointer text-xs font-semibold text-gray-400 uppercase tracking-wider transition-colors hover:text-gray-600">Contacts</summary>
    <div class="mt-2 space-y-1">
      <div class="text-xs text-gray-500" data-if="college.address">{{college.address}}</div>
      <div class="text-xs text-gray-500" data-if="college.phone">{{college.phone}}</div>
      <div class="text-xs text-gray-500" data-if="college.email">{{college.email}}</div>
      <div class="text-xs" data-if="college.website"><a class="text-blue-600 hover:underline" href="{{college.website}}">{{college.website}}</a></div>
    </div>
  </details>
</div>`,
    props: [
      { name: 'college', type: 'json', value: {
        name: 'Almaty IT College', city: 'Almaty', type: 'public',
        duration: '2 years 10 months', website: 'https://aitc.kz',
      } },
    ],
  },

  {
    type: 'CATALOG',
    name: 'College cards',
    description: 'A grid of College card blocks, fed by a reference into the Colleges catalog.',
    html: `<div class="grid grid-cols-1 sm:grid-cols-2 gap-3" data-each="colleges">
  <block name="College card" data-college="item"></block>
</div>`,
    props: [
      { name: 'colleges', type: 'ref', value: { $catalog: 'colleges', ids: [1, 2] } },
    ],
  },

  {
    type: 'CATALOG',
    name: 'College programs',
    description:
      'Accordion of college programs (reference into the College programs catalog); each program renders its colleges as embedded College cards.',
    html: `<div class="space-y-3" data-each="programs">
  <details class="bg-white border border-black/[0.04] rounded-2xl overflow-hidden ${CARD_SHADOW}">
    <summary class="flex items-center gap-3.5 px-5 py-4 cursor-pointer transition-colors hover:bg-gray-50/60">
      <span class="text-gray-400">›</span>
      <span class="flex-1 min-w-0">
        <span class="block text-[0.9375rem] font-bold text-gray-800 mb-1">{{item.title}}</span>
        <span class="text-xs font-semibold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-md">{{item.code}}</span>
      </span>
    </summary>
    <div class="px-5 pb-5">
      <div class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 pb-2 border-b border-gray-100">Colleges offering this specialization</div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3" data-each="item.colleges">
        <block name="College card" data-college="item"></block>
      </div>
    </div>
  </details>
</div>`,
    props: [
      { name: 'programs', type: 'ref', value: { $catalog: 'collegePrograms', ids: [1, 2] } },
    ],
  },

  {
    type: 'CATALOG',
    name: 'Profession · Education',
    description:
      'The Education view: Universities and Colleges sections. References programs BY ID — data is pulled from those catalogs at render time.',
    html: `<div class="space-y-4">
  <details open class="bg-white border border-black/[0.04] rounded-2xl overflow-hidden ${CARD_SHADOW}">
    <summary class="flex items-center gap-2 px-5 py-4 cursor-pointer transition-colors hover:bg-gray-50/60">
      <span class="text-[0.9375rem] font-bold text-gray-800">Universities</span>
    </summary>
    <div class="px-5 pb-5">
      <block name="University programs" data-programs="universityPrograms"></block>
    </div>
  </details>
  <details class="bg-white border border-black/[0.04] rounded-2xl overflow-hidden ${CARD_SHADOW}">
    <summary class="flex items-center gap-2 px-5 py-4 cursor-pointer transition-colors hover:bg-gray-50/60">
      <span class="text-[0.9375rem] font-bold text-gray-800">Colleges</span>
    </summary>
    <div class="px-5 pb-5">
      <block name="College programs" data-programs="collegePrograms"></block>
    </div>
  </details>
</div>`,
    props: [
      { name: 'universityPrograms', type: 'ref', value: { $catalog: 'univerPrograms', ids: [1, 3] } },
      { name: 'collegePrograms', type: 'ref', value: { $catalog: 'collegePrograms', ids: [1] } },
    ],
  },

  {
    type: 'CATALOG',
    name: 'Profession · Labor market',
    description:
      'The Labor market view: demand/growth/openings overview, salary ranges, job strategy, and market insights.',
    html: `<div class="space-y-7">
  <div>
    <div class="text-base font-bold text-gray-900 mb-0.5">Market Overview</div>
    <div class="text-[0.8125rem] text-gray-400 mb-4">Current market conditions and outlook for this profession</div>
    <div class="grid grid-cols-1 sm:grid-cols-[1.2fr_1fr] gap-3">
      <div class="bg-white border border-black/[0.04] rounded-2xl p-6 relative overflow-hidden ${CARD_SHADOW} flex flex-col gap-4">
        <div class="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-600 to-blue-400"></div>
        <div>
          <div class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Market Demand</div>
          <div class="text-xl font-extrabold text-gray-900">{{demandValue}}</div>
        </div>
        <div class="flex gap-1.5" data-each="range(1, 5)">
          <div class="w-2.5 h-2.5 rounded-full {{ if(item <= demandLevel, 'bg-blue-500 shadow-[0_0_6px_rgb(59_130_246/0.4)]', 'bg-gray-200') }}"></div>
        </div>
        <div>
          <div class="text-[0.6875rem] font-semibold text-gray-400 uppercase tracking-wider mb-2">Key Industries</div>
          <div class="flex flex-wrap gap-1.5" data-each="industries">
            <span class="bg-blue-50/60 border border-blue-100/60 rounded-lg px-3 py-1.5 text-xs font-semibold text-blue-800">{{item}}</span>
          </div>
        </div>
      </div>
      <div class="flex flex-col gap-3">
        <div class="bg-white border border-black/[0.04] rounded-2xl p-5 relative overflow-hidden ${CARD_SHADOW} flex-1">
          <div class="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-600 to-emerald-400"></div>
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <div class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Job Growth</div>
              <div class="text-xs text-gray-500">{{growthDesc}}</div>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <span class="text-lg font-bold text-emerald-500">↗</span>
              <span class="text-xl font-extrabold text-gray-900">{{growthValue}}</span>
            </div>
          </div>
          <div class="mt-2.5">
            <span class="text-[0.6875rem] font-bold px-2 py-0.5 rounded-md inline-block bg-emerald-100 text-emerald-800">{{growthBadge}}</span>
          </div>
        </div>
        <div class="bg-white border border-black/[0.04] rounded-2xl p-5 relative overflow-hidden ${CARD_SHADOW} flex-1">
          <div class="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-500 to-amber-300"></div>
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <div class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Annual Openings</div>
              <div class="text-xs text-gray-500">{{openingsDesc}}</div>
            </div>
            <div class="text-xl font-extrabold text-gray-900 shrink-0">{{openingsValue}}</div>
          </div>
          <div class="text-[0.6875rem] text-gray-400 mt-2.5">{{openingsUpdated}}</div>
        </div>
      </div>
    </div>
  </div>

  <div>
    <div class="text-base font-bold text-gray-900 mb-0.5">Salary Information</div>
    <div class="text-[0.8125rem] text-gray-400 mb-4">Typical salary ranges by experience level in KZT</div>
    <div class="bg-white border border-black/[0.04] rounded-2xl ${CARD_SHADOW} overflow-hidden">
      <div class="px-6 pt-6 pb-4">
        <div class="space-y-5" data-each="salaryCards">
          <div>
            <div class="flex items-baseline justify-between mb-1.5">
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full shrink-0" style="background: linear-gradient(135deg, {{ item.from ?? if(index == 0, '#3b82f6', if(index == 1, '#8b5cf6', '#10b981')) }}, {{ item.to ?? if(index == 0, '#60a5fa', if(index == 1, '#a78bfa', '#34d399')) }})"></span>
                <span class="text-xs font-bold text-gray-700 uppercase tracking-wider">{{item.level}}</span>
                <span class="text-[0.6875rem] text-gray-400">{{item.experience}}</span>
              </div>
              <span class="text-sm font-extrabold text-gray-900 tabular-nums">{{item.main}}</span>
            </div>
            <div class="relative h-2.5 bg-gray-100 rounded-full">
              <div class="absolute top-0 h-full rounded-full" style="left: {{ pct(item.rangeMin - salaryMin, salaryMax - salaryMin) }}%; width: {{ pct(item.rangeMax - item.rangeMin, salaryMax - salaryMin) }}%; background: linear-gradient(90deg, {{ item.from ?? if(index == 0, '#3b82f6', if(index == 1, '#8b5cf6', '#10b981')) }}, {{ item.to ?? if(index == 0, '#60a5fa', if(index == 1, '#a78bfa', '#34d399')) }})"></div>
              <div class="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white bg-gray-900 z-10" style="left: {{ pct(item.mainNum - salaryMin, salaryMax - salaryMin) }}%; margin-left: -6px"></div>
            </div>
          </div>
        </div>
        <div class="flex items-center justify-between mt-3 pt-2 border-t border-gray-200">
          <span class="text-[0.5625rem] text-gray-400">₸{{ format(salaryMin) }}</span>
          <span class="text-[0.5625rem] text-gray-400">₸{{ format(salaryMax) }}</span>
        </div>
      </div>
      <div class="px-6 py-3.5 bg-gray-50/80 border-t border-gray-100 text-xs text-gray-500 leading-relaxed">{{salaryNote}}</div>
    </div>
  </div>

  <div>
    <div class="text-base font-bold text-gray-900 mb-0.5">Job Strategy</div>
    <div class="text-[0.8125rem] text-gray-400 mb-4">Tips for landing and growing in this role</div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
      <div class="bg-white border border-black/[0.04] rounded-2xl p-5 ${CARD_SHADOW}">
        <div class="text-sm font-bold text-gray-900 mb-3">Application Strategy</div>
        <ul class="space-y-2" data-each="applicationItems">
          <li class="text-[0.8125rem] text-gray-600 leading-relaxed pl-4 relative"><span class="absolute left-0 top-[7px] w-1.5 h-1.5 rounded-full bg-indigo-300"></span>{{item}}</li>
        </ul>
      </div>
      <div class="bg-white border border-black/[0.04] rounded-2xl p-5 ${CARD_SHADOW}">
        <div class="text-sm font-bold text-gray-900 mb-3">Career Development</div>
        <ul class="space-y-2" data-each="careerItems">
          <li class="text-[0.8125rem] text-gray-600 leading-relaxed pl-4 relative"><span class="absolute left-0 top-[7px] w-1.5 h-1.5 rounded-full bg-emerald-300"></span>{{item}}</li>
        </ul>
      </div>
    </div>
  </div>

  <div>
    <div class="text-base font-bold text-gray-900 mb-0.5">Market Analytics</div>
    <div class="text-[0.8125rem] text-gray-400 mb-4">Key insights about this profession's market</div>
    <div class="space-y-2.5" data-each="insights">
      <div class="bg-white border border-black/[0.04] rounded-xl p-4 text-sm text-gray-600 leading-relaxed border-l-[3px] shadow-[0_1px_2px_0_rgb(0_0_0/0.03)] {{item.accentClass}}">{{item.text}}</div>
    </div>
  </div>
</div>`,
    props: [
      { name: 'demandValue', type: 'text', value: 'Moderate' },
      { name: 'demandLevel', type: 'number', value: 3 },
      { name: 'industries', type: 'json', value: ['Business & Finance', 'Administration'] },
      { name: 'growthValue', type: 'text', value: '9%+' },
      { name: 'growthDesc', type: 'text', value: 'Much faster than average' },
      { name: 'growthBadge', type: 'text', value: 'Next 5 years' },
      { name: 'openingsValue', type: 'text', value: '5,360' },
      { name: 'openingsDesc', type: 'text', value: 'openings per year' },
      { name: 'openingsUpdated', type: 'text', value: 'Updated: 19.10.2025' },
      { name: 'salaryCards', type: 'json', value: [
        { level: 'Entry Level', experience: '0–2 years experience', main: '₸300,000', mainNum: 300000, rangeMin: 225000, rangeMax: 375000 },
        { level: 'Mid Level', experience: '3–7 years experience', main: '₸487,500', mainNum: 487500, rangeMin: 375000, rangeMax: 600000 },
        { level: 'Senior Level', experience: '8+ years experience', main: '₸825,000', mainNum: 825000, rangeMin: 600000, rangeMax: 1050000 },
      ] },
      { name: 'salaryMin', type: 'number', value: 225000 },
      { name: 'salaryMax', type: 'number', value: 1050000 },
      { name: 'salaryNote', type: 'text', value: 'Salaries vary depending on experience, location, company size, and specific skills. These ranges represent typical compensation on the current market.' },
      { name: 'applicationItems', type: 'json', value: [
        'Build a portfolio with 3-5 end-to-end data science projects on GitHub',
        'Earn certifications (Google Data Analytics, IBM Data Science)',
        'Network through data science meetups and LinkedIn',
        'Contribute to open-source ML projects',
        'Prepare for technical interviews with SQL, Python, and statistics',
      ] },
      { name: 'careerItems', type: 'json', value: [
        'Start as a Data Analyst to build domain expertise',
        'Specialize in a high-demand area (NLP, Computer Vision, MLOps)',
        'Pursue a Master’s degree for senior/research roles',
        'Build communication skills for stakeholder management',
        'Stay current with latest tools and techniques',
      ] },
      { name: 'insights', type: 'json', value: [
        { text: 'The demand for data scientists in Kazakhstan has grown 35% year-over-year, driven by digital transformation across banking, telecom, and government sectors.', accentClass: 'border-l-emerald-600' },
        { text: 'Python and SQL remain the most requested skills, appearing in 90%+ of job listings. Machine learning frameworks (TensorFlow, PyTorch) are required for senior positions.', accentClass: 'border-l-blue-600' },
        { text: 'Remote work opportunities have expanded significantly, with 40% of data science roles now offering fully remote or hybrid arrangements.', accentClass: 'border-l-amber-500' },
        { text: 'The gap between entry-level and senior salaries is substantial, making continuous skill development and specialization highly rewarding financially.', accentClass: 'border-l-violet-600' },
      ] },
    ],
  },

  {
    type: 'CATALOG',
    name: 'Profession · Characteristics',
    description:
      'The Characteristics view: Interests (RIASEC), Personality, Skills, and Values as fit bars with hover descriptions.',
    html: `<div class="space-y-8">
  <div data-if="len(interests) > 0">
    <div class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Interests</div>
    <div class="space-y-3" data-each="interests">
      <div class="group/bar relative">
        <div class="flex items-center gap-3">
          <div class="w-[120px] md:w-[140px] shrink-0 text-right"><span class="text-[0.82rem] font-medium text-gray-700">{{item.name}}</span></div>
          <div class="flex-1 h-7 rounded-md bg-gray-100 overflow-hidden">
            <div class="h-full rounded-md {{ if(item.level >= 70, 'bg-gradient-to-r from-emerald-500 to-emerald-600', if(item.level >= 40, 'bg-gradient-to-r from-amber-400 to-amber-500', 'bg-gradient-to-r from-red-400 to-red-500')) }}" style="width: {{item.level}}%"></div>
          </div>
          <span class="w-[40px] shrink-0 text-right text-[0.82rem] font-semibold text-gray-700">{{item.level}}%</span>
        </div>
        <div class="pointer-events-none invisible group-hover/bar:visible absolute -top-1 left-[140px] -translate-y-full z-20 w-[240px] rounded-lg bg-gray-900 px-3 py-2 text-[0.75rem] leading-relaxed text-white shadow-lg" data-if="item.desc">{{item.desc}}<span class="absolute top-full left-6 border-4 border-transparent border-t-gray-900"></span></div>
      </div>
    </div>
  </div>
  <div data-if="len(personality) > 0">
    <div class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Personality</div>
    <div class="space-y-3" data-each="personality">
      <div class="group/bar relative">
        <div class="flex items-center gap-3">
          <div class="w-[120px] md:w-[140px] shrink-0 text-right"><span class="text-[0.82rem] font-medium text-gray-700">{{item.name}}</span></div>
          <div class="flex-1 h-7 rounded-md bg-gray-100 overflow-hidden">
            <div class="h-full rounded-md {{ if(item.level >= 70, 'bg-gradient-to-r from-emerald-500 to-emerald-600', if(item.level >= 40, 'bg-gradient-to-r from-amber-400 to-amber-500', 'bg-gradient-to-r from-red-400 to-red-500')) }}" style="width: {{item.level}}%"></div>
          </div>
          <span class="w-[40px] shrink-0 text-right text-[0.82rem] font-semibold text-gray-700">{{item.level}}%</span>
        </div>
        <div class="pointer-events-none invisible group-hover/bar:visible absolute -top-1 left-[140px] -translate-y-full z-20 w-[240px] rounded-lg bg-gray-900 px-3 py-2 text-[0.75rem] leading-relaxed text-white shadow-lg" data-if="item.desc">{{item.desc}}<span class="absolute top-full left-6 border-4 border-transparent border-t-gray-900"></span></div>
      </div>
    </div>
  </div>
  <div data-if="len(skills) > 0">
    <div class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Skills</div>
    <div class="space-y-3" data-each="skills">
      <div class="group/bar relative">
        <div class="flex items-center gap-3">
          <div class="w-[120px] md:w-[140px] shrink-0 text-right"><span class="text-[0.82rem] font-medium text-gray-700">{{item.name}}</span></div>
          <div class="flex-1 h-7 rounded-md bg-gray-100 overflow-hidden">
            <div class="h-full rounded-md {{ if(item.level >= 70, 'bg-gradient-to-r from-emerald-500 to-emerald-600', if(item.level >= 40, 'bg-gradient-to-r from-amber-400 to-amber-500', 'bg-gradient-to-r from-red-400 to-red-500')) }}" style="width: {{item.level}}%"></div>
          </div>
          <span class="w-[40px] shrink-0 text-right text-[0.82rem] font-semibold text-gray-700">{{item.level}}%</span>
        </div>
        <div class="pointer-events-none invisible group-hover/bar:visible absolute -top-1 left-[140px] -translate-y-full z-20 w-[240px] rounded-lg bg-gray-900 px-3 py-2 text-[0.75rem] leading-relaxed text-white shadow-lg" data-if="item.desc">{{item.desc}}<span class="absolute top-full left-6 border-4 border-transparent border-t-gray-900"></span></div>
      </div>
    </div>
  </div>
  <div data-if="len(values) > 0">
    <div class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Values</div>
    <div class="space-y-3" data-each="values">
      <div class="group/bar relative">
        <div class="flex items-center gap-3">
          <div class="w-[120px] md:w-[140px] shrink-0 text-right"><span class="text-[0.82rem] font-medium text-gray-700">{{item.name}}</span></div>
          <div class="flex-1 h-7 rounded-md bg-gray-100 overflow-hidden">
            <div class="h-full rounded-md {{ if(item.level >= 70, 'bg-gradient-to-r from-emerald-500 to-emerald-600', if(item.level >= 40, 'bg-gradient-to-r from-amber-400 to-amber-500', 'bg-gradient-to-r from-red-400 to-red-500')) }}" style="width: {{item.level}}%"></div>
          </div>
          <span class="w-[40px] shrink-0 text-right text-[0.82rem] font-semibold text-gray-700">{{item.level}}%</span>
        </div>
        <div class="pointer-events-none invisible group-hover/bar:visible absolute -top-1 left-[140px] -translate-y-full z-20 w-[240px] rounded-lg bg-gray-900 px-3 py-2 text-[0.75rem] leading-relaxed text-white shadow-lg" data-if="item.desc">{{item.desc}}<span class="absolute top-full left-6 border-4 border-transparent border-t-gray-900"></span></div>
      </div>
    </div>
  </div>
</div>`,
    props: [
      { name: 'interests', type: 'json', value: [
        { name: 'Investigative', level: 90, desc: 'Strong match with analytical research work' },
        { name: 'Conventional', level: 65, desc: 'Working with structured data and systems' },
        { name: 'Realistic', level: 55, desc: 'Hands-on technical implementation' },
        { name: 'Artistic', level: 30, desc: 'Some creative visualization work' },
        { name: 'Social', level: 25, desc: 'Limited direct social interaction' },
        { name: 'Enterprising', level: 20, desc: 'Not primarily leadership-focused' },
      ] },
      { name: 'personality', type: 'json', value: [
        { name: 'Openness', level: 88, desc: 'Curiosity drives exploration of data' },
        { name: 'Conscientiousness', level: 85, desc: 'Attention to detail is essential' },
        { name: 'Extraversion', level: 50, desc: 'Collaborative but also independent' },
        { name: 'Agreeableness', level: 55, desc: 'Team-oriented communication' },
        { name: 'Neuroticism', level: 25, desc: 'Calm under pressure with deadlines' },
      ] },
      { name: 'skills', type: 'json', value: [
        { name: 'Analytical', level: 92, desc: 'Core skill for data interpretation' },
        { name: 'Technical', level: 85, desc: 'Programming and tool proficiency' },
        { name: 'Communication', level: 60, desc: 'Presenting findings to stakeholders' },
        { name: 'Leadership', level: 30, desc: 'Not a primary requirement' },
      ] },
      { name: 'values', type: 'json', value: [
        { name: 'Autonomy', level: 85, desc: 'Independent problem-solving' },
        { name: 'Creativity', level: 82, desc: 'Novel approaches to data problems' },
        { name: 'Financial Security', level: 80, desc: 'Competitive compensation' },
        { name: 'Work-Life Balance', level: 60, desc: 'Generally flexible, some crunch' },
        { name: 'Social Impact', level: 50, desc: 'Depends on industry and project' },
      ] },
    ],
  },

  {
    type: 'CATALOG',
    name: 'Profession · Content',
    description:
      'The Content view: video cards (YouTube thumbnail + link, title, description). ytId = the 11-char YouTube video id.',
    html: `<div class="space-y-5" data-each="videos">
  <div class="rounded-xl border border-black/[0.04] overflow-hidden bg-white">
    <a href="{{item.youtubeUrl}}" data-if="item.ytId">
      <div class="relative w-full aspect-video bg-gray-900">
        <img src="https://img.youtube.com/vi/{{item.ytId}}/hqdefault.jpg" alt="{{item.title}}" class="w-full h-full object-cover" />
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-black/60 text-white text-lg">▶</div>
        </div>
      </div>
    </a>
    <div class="w-full h-[140px] bg-gradient-to-br from-red-50 to-rose-100 flex items-center justify-center" data-if="!item.ytId">
      <span class="text-3xl text-red-300">▶</span>
    </div>
    <div class="p-4">
      <div class="text-[0.9rem] font-semibold text-gray-900 mb-1">{{item.title}}</div>
      <div class="text-xs text-gray-500 leading-relaxed line-clamp-2" data-if="item.description">{{item.description}}</div>
    </div>
  </div>
</div>`,
    props: [
      { name: 'videos', type: 'json', value: [
        { title: 'What is Data Science?', description: 'A practical introduction to what data scientists actually do day to day.', youtubeUrl: 'https://www.youtube.com/watch?v=X3paOmcrTjQ', ytId: 'X3paOmcrTjQ' },
        { title: 'A Day in the Life of a Data Scientist', description: 'Follow a working data scientist through a typical project week.', youtubeUrl: 'https://www.youtube.com/watch?v=xC-c7E5PK0Y', ytId: 'xC-c7E5PK0Y' },
      ] },
    ],
  },

  {
    type: 'CATALOG',
    name: 'Profession · Card',
    description:
      'The profession card exactly as shown on /explore: title + code, group and popularity badges, icon tile, description, difficulty dots.',
    html: `<div class="max-w-sm">
  <div class="relative flex flex-col bg-card border rounded-xl p-5 transition-all duration-200 hover:shadow-lg">
    <span class="absolute right-3 top-3 text-lg text-muted-foreground">♡</span>
    <h3 class="text-[1.02rem] font-bold text-foreground leading-tight pr-9">{{title}}<span class="text-[0.72rem] text-muted-foreground font-normal ml-1.5">{{code}}</span></h3>
    <div class="flex items-center gap-1.5 mt-2.5 mb-2.5 flex-wrap">
      <span class="text-[0.68rem] px-2.5 py-0.5 rounded-full font-semibold whitespace-nowrap {{groupBadgeClass}}">{{group}}</span>
      <span class="text-[0.65rem] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold whitespace-nowrap" data-if="popular">Popular</span>
    </div>
    <div class="mb-3">
      <div class="float-right ml-3 mb-1 flex h-12 w-12 items-center justify-center rounded-2xl text-xl {{groupTileClass}}">{{icon}}</div>
      <p class="text-[0.84rem] text-muted-foreground leading-relaxed">{{desc}}</p>
      <div class="clear-both"></div>
    </div>
    <div class="mt-auto flex items-center gap-2 pt-1.5">
      <span class="text-[0.72rem] font-medium text-muted-foreground">Difficulty:</span>
      <div class="flex items-center gap-1" data-each="range(1, 5)">
        <span class="h-1.5 w-1.5 rounded-full {{ if(item <= prepLevel, 'bg-primary', 'bg-muted') }}"></span>
      </div>
      <a href="{{detailsUrl}}" class="ml-auto rounded-md border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted">Details</a>
    </div>
  </div>
</div>`,
    props: [
      { name: 'title', type: 'text', value: 'Data Scientist' },
      { name: 'code', type: 'text', value: 'DS-401' },
      { name: 'desc', type: 'text', value: 'Analyze complex data to drive business decisions' },
      { name: 'group', type: 'text', value: 'Technology' },
      { name: 'groupBadgeClass', type: 'text', value: 'bg-blue-100 text-blue-800' },
      { name: 'groupTileClass', type: 'text', value: 'bg-blue-50 text-blue-600' },
      { name: 'icon', type: 'text', value: '📊' },
      { name: 'popular', type: 'boolean', value: true },
      { name: 'prepLevel', type: 'number', value: 5 },
      // Where the Details button links. Set per item (e.g. /professions/<id>).
      { name: 'detailsUrl', type: 'text', value: '#' },
    ],
  },
];
