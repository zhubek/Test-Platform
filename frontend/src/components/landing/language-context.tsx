"use client";
import React, { createContext, useState, useContext, ReactNode } from 'react';

type Language = 'en' | 'ru' | 'kk';

interface LanguageContextType {
    lang: Language;
    setLang: (lang: Language) => void;
    t: (key: string) => string;
}

const dictionary: Record<string, Record<Language, string>> = {
    // Navbar
    "nav.features": { en: "Features", ru: "Функции", kk: "Мүмкіндіктер" },
    "nav.useCases": { en: "Use Cases", ru: "Применение", kk: "Қолдану" },
    "nav.customers": { en: "Customers", ru: "Клиенты", kk: "Клиенттер" },
    "nav.login": { en: "Log in", ru: "Войти", kk: "Кіру" },
    "nav.start": { en: "Start building free", ru: "Начать бесплатно", kk: "Тегін бастау" },
    
    // Hero
    "hero.badge": { en: "Powered by AI", ru: "На базе ИИ", kk: "ЖИ негізінде" },
    "hero.title1": { en: "Build assessments at the", ru: "Создавайте тесты со", kk: "Тесттерді ой" },
    "hero.title2": { en: "speed of thought.", ru: "скоростью мысли.", kk: "жылдамдығымен жасаңыз." },
    "hero.subtitle": { en: "Test-Platform is where teams design tests, structure data catalogs, and ship live dashboards — and now, describe what you want and let AI build it for you.", ru: "Test-Platform — это платформа, где команды создают тесты, структурируют каталоги данных и запускают живые дашборды. Теперь просто опишите, что вам нужно, и ИИ создаст это для вас.", kk: "Test-Platform — бұл командалар тесттерді жобалайтын, деректер каталогтарын құрылымдайтын және тікелей дашбордтарды іске қосатын орын. Енді не қалайтыныңызды сипаттаңыз, ал ЖИ оны сіз үшін жасайды." },
    "hero.cta1": { en: "Start building free", ru: "Начать бесплатно", kk: "Тегін бастау" },
    "hero.cta2": { en: "See it in action", ru: "Посмотреть в действии", kk: "Іс жүзінде көру" },
    "hero.trust": { en: "Trusted at scale — powering career orientation across Kazakhstan for", ru: "Доверяют на масштабном уровне — обеспечивает профориентацию по всему Казахстану для", kk: "Ауқымды деңгейде сенімге ие — Қазақстан бойынша кәсіби бағдар беруді қамтамасыз етеді, пайдаланушылар саны:" },
    "hero.trustUsers": { en: "50,000+ users", ru: "50 000+ пользователей", kk: "50 000+" },
    
    // Social Proof
    "sp.stat1": { en: "People assessed", ru: "Человек прошли оценку", kk: "Адам бағаланды" },
    "sp.stat2": { en: "Building blocks: tests, catalogs, dashboards", ru: "Блока: тесты, каталоги, дашборды", kk: "Құрылыс блоктары: тесттер, каталогтар, дашбордтар" },
    "sp.stat3": { en: "Prompt to build any of them", ru: "Промпт для создания любого из них", kk: "Кез келгенін жасауға арналған сұрау" },
    
    // Feature AI
    "ai.eyebrow": { en: "The unfair advantage", ru: "Нечестное преимущество", kk: "Әділетсіз артықшылық" },
    "ai.title1": { en: "Don't build it.", ru: "Не создавайте.", kk: "Жасамаңыз." },
    "ai.title2": { en: "Describe it.", ru: "Опишите это.", kk: "Сипаттаңыз." },
    "ai.desc": { en: "Most platforms hand you an empty editor and wish you luck. Test-Platform hands you an AI that already knows how tests, catalogs, and dashboards work.", ru: "Большинство платформ дают вам пустой редактор и желают удачи. Test-Platform дает вам ИИ, который уже знает, как работают тесты, каталоги и дашборды.", kk: "Көптеген платформалар сізге бос редактор беріп, сәттілік тілейді. Test-Platform сізге тесттер, каталогтар және дашбордтар қалай жұмыс істейтінін білетін ЖИ береді." },
    "ai.step1.title": { en: "1. Create with AI", ru: "1. Создавайте с ИИ", kk: "1. ЖИ көмегімен жасау" },
    "ai.step1.desc": { en: "Describe your test in plain language. AI builds the schema, questions, and scoring instantly.", ru: "Опишите ваш тест простым языком. ИИ мгновенно создаст схему, вопросы и систему оценки.", kk: "Тестіңізді қарапайым тілмен сипаттаңыз. ЖИ схеманы, сұрақтарды және бағалауды лезде жасайды." },
    "ai.step2.title": { en: "2. Send & Track", ru: "2. Отправляйте и отслеживайте", kk: "2. Жіберу және бақылау" },
    "ai.step2.desc": { en: "Deploy in one click. Watch live as respondents start, progress, and complete your assessments.", ru: "Запускайте в один клик. Наблюдайте в реальном времени, как респонденты начинают, проходят и завершают ваши тесты.", kk: "Бір рет басу арқылы іске қосыңыз. Респонденттердің тестті бастауын, өтуін және аяқтауын тікелей эфирде бақылаңыз." },
    "ai.step3.title": { en: "3. Instant Dashboards", ru: "3. Мгновенные дашборды", kk: "3. Лезде дашбордтар" },
    "ai.step3.desc": { en: "Ask AI to build charts and compare cohorts. Turn raw responses into beautiful, live insights.", ru: "Попросите ИИ построить графики и сравнить когорты. Превратите сырые ответы в красивые, живые инсайты.", kk: "ЖИ-ден графиктер құруды және когорталарды салыстыруды сұраңыз. Шикі жауаптарды әдемі, тікелей инсайттарға айналдырыңыз." },
    
    // Mockups
    "ai.m1.user": { en: "User: Build a 5-factor personality test for new hires. Include 10 questions per factor.", ru: "Пользователь: Создай 5-факторный личностный тест для новичков. По 10 вопросов на фактор.", kk: "Пайдаланушы: Жаңа қызметкерлерге арналған 5 факторлы тұлғалық тест жаса. Әр факторға 10 сұрақтан." },
    "ai.m1.gen": { en: "Generating schema & questions...", ru: "Генерация схемы и вопросов...", kk: "Схема мен сұрақтарды құру..." },
    "ai.m1.ready": { en: "Assessment Ready", ru: "Тест готов", kk: "Тест дайын" },
    "ai.m1.q": { en: "50 Questions", ru: "50 вопросов", kk: "50 сұрақ" },
    "ai.m1.l1": { en: "Logic: Branching", ru: "Логика: Ветвление", kk: "Логика: Тармақталу" },
    "ai.m1.l2": { en: "Scoring: Weighted", ru: "Оценка: Взвешенная", kk: "Бағалау: Өлшенген" },
    "ai.m2.link": { en: "Copy Link", ru: "Копировать", kk: "Көшіру" },
    "ai.m2.live": { en: "Live Activity", ru: "Активность", kk: "Белсенділік" },
    "ai.m2.s1": { en: "completed", ru: "завершил(а)", kk: "аяқтады" },
    "ai.m2.s1t": { en: "2 mins ago", ru: "2 мин назад", kk: "2 мин бұрын" },
    "ai.m2.s2": { en: "started", ru: "начал(а)", kk: "бастады" },
    "ai.m2.s2t": { en: "Just now", ru: "Только что", kk: "Жаңа ғана" },
    "ai.m2.s2s": { en: "In progress", ru: "В процессе", kk: "Орындалуда" },
    "ai.m3.user": { en: "User: Show me completion rates and average scores by department.", ru: "Пользователь: Покажи процент завершения и средние баллы по отделам.", kk: "Пайдаланушы: Бөлімдер бойынша аяқтау көрсеткіштері мен орташа балдарды көрсет." },
    "ai.m3.avg": { en: "Avg Score", ru: "Средний балл", kk: "Орташа балл" },
    "ai.m3.tc": { en: "Total Completions", ru: "Всего завершений", kk: "Барлық аяқтаулар" },
    "ai.m3.tcu": { en: "↑ 12% this week", ru: "↑ 12% за неделю", kk: "↑ 12% осы аптада" },
    "ai.m3.at": { en: "Avg Time", ru: "Среднее время", kk: "Орташа уақыт" },

    // Pillars
    "pillars.title": { en: "One platform. Three superpowers.", ru: "Одна платформа. Три суперсилы.", kk: "Бір платформа. Үш суперкүш." },
    "pillars.desc": { en: "Everything you need to assess, structure, and analyze, built into a single cohesive engine.", ru: "Всё необходимое для оценки, структурирования и анализа, встроенное в единый механизм.", kk: "Бағалау, құрылымдау және талдау үшін қажеттінің бәрі бір біртұтас механизмге біріктірілген." },
    "pillars.1.title": { en: "Tests that think.", ru: "Тесты, которые думают.", kk: "Ойланатын тесттер." },
    "pillars.1.desc": { en: "Design assessments with branching logic, weighted scoring, and live calculated results. From a quick pulse check to a full psychometric battery — built in minutes.", ru: "Создавайте тесты с ветвлением, взвешенной оценкой и живыми результатами. От быстрого опроса до полной психометрической батареи — за минуты.", kk: "Тармақталған логикасы, өлшенген бағалауы және тікелей есептелген нәтижелері бар бағалауларды жобалаңыз. Жылдам сауалнамадан толық психометриялық батареяға дейін — минуттар ішінде жасалады." },
    "pillars.1.f1": { en: "Drag-and-drop question builder", ru: "Drag-and-drop конструктор вопросов", kk: "Сұрақтарды сүйреп апару конструкторы" },
    "pillars.1.f2": { en: "Conditional logic & dynamic scoring", ru: "Условная логика и динамическая оценка", kk: "Шартты логика және динамикалық бағалау" },
    "pillars.1.f3": { en: "Multilingual out of the box", ru: "Мультиязычность из коробки", kk: "Басынан бастап көптілділік" },
    "pillars.1.f4": { en: "Instant respondent preview", ru: "Мгновенный предпросмотр", kk: "Лезде алдын ала қарау" },
    "pillars.2.title": { en: "Structure that scales.", ru: "Структура, которая масштабируется.", kk: "Масштабталатын құрылым." },
    "pillars.2.desc": { en: "Turn messy reference data into clean, queryable catalogs — professions, departments, competencies. Connect results to meaning and give every score a context.", ru: "Превратите разрозненные данные в чистые каталоги — профессии, отделы, компетенции. Придайте каждому баллу контекст.", kk: "Ретсіз анықтамалық деректерді таза, сұрауға болатын каталогтарға — кәсіптерге, бөлімдерге, құзыреттерге айналдырыңыз. Әрбір баллға мән беріңіз." },
    "pillars.2.f1": { en: "Reusable, structured records", ru: "Переиспользуемые, структурированные записи", kk: "Қайта пайдалануға болатын, құрылымдалған жазбалар" },
    "pillars.2.f2": { en: "Rich relationships between entries", ru: "Богатые связи между записями", kk: "Жазбалар арасындағы бай байланыстар" },
    "pillars.2.f3": { en: "Powers recommendations & matching", ru: "Обеспечивает рекомендации и мэтчинг", kk: "Ұсыныстар мен сәйкестендіруді қамтамасыз етеді" },
    "pillars.2.f4": { en: "Edit by hand or generate with AI", ru: "Редактируйте вручную или генерируйте с ИИ", kk: "Қолмен өңдеңіз немесе ЖИ көмегімен жасаңыз" },
    "pillars.3.title": { en: "Answers, not spreadsheets.", ru: "Ответы, а не таблицы.", kk: "Кестелер емес, жауаптар." },
    "pillars.3.desc": { en: "Build live dashboards that turn thousands of responses into decisions. Track participation, compare cohorts, spot trends — all updating in real time.", ru: "Создавайте живые дашборды, превращающие тысячи ответов в решения. Отслеживайте участие, сравнивайте когорты, находите тренды — в реальном времени.", kk: "Мыңдаған жауаптарды шешімдерге айналдыратын тікелей дашбордтар жасаңыз. Қатысуды бақылаңыз, когорталарды салыстырыңыз, трендтерді анықтаңыз — барлығы нақты уақытта жаңартылады." },
    "pillars.3.f1": { en: "Drag-to-arrange widget grid", ru: "Сетка виджетов с drag-and-drop", kk: "Виджеттер торын сүйреп орналастыру" },
    "pillars.3.f2": { en: "Charts, tables, and KPIs", ru: "Графики, таблицы и KPI", kk: "Графиктер, кестелер және KPI" },
    "pillars.3.f3": { en: "Filter by cohort, department, period", ru: "Фильтры по когорте, отделу, периоду", kk: "Когорта, бөлім, кезең бойынша сүзгілеу" },
    "pillars.3.f4": { en: "Share or embed anywhere", ru: "Делитесь или встраивайте куда угодно", kk: "Бөлісіңіз немесе кез келген жерге енгізіңіз" },

    // Steps
    "steps.title": { en: "From idea to insight in three steps.", ru: "От идеи до инсайта за три шага.", kk: "Идеядан инсайтқа дейін үш қадам." },
    "steps.1.title": { en: "Describe or design.", ru: "Опишите или спроектируйте.", kk: "Сипаттаңыз немесе жобалаңыз." },
    "steps.1.desc": { en: "Tell the AI what you want, or build it yourself in the visual editor.", ru: "Скажите ИИ, что вы хотите, или создайте сами в визуальном редакторе.", kk: "ЖИ-ге не қалайтыныңызды айтыңыз немесе визуалды редакторда өзіңіз жасаңыз." },
    "steps.2.title": { en: "Deploy in a click.", ru: "Запустите в один клик.", kk: "Бір рет басу арқылы іске қосыңыз." },
    "steps.2.desc": { en: "Publish your test, share a link or code — respondents are in, no friction.", ru: "Опубликуйте тест, поделитесь ссылкой или кодом — респонденты уже здесь, без препятствий.", kk: "Тестіңізді жариялаңыз, сілтеме немесе кодпен бөлісіңіз — респонденттер кедергісіз кіреді." },
    "steps.3.title": { en: "Watch it land.", ru: "Наблюдайте за результатами.", kk: "Нәтижелерді бақылаңыз." },
    "steps.3.desc": { en: "Results flow into live dashboards. Scores connect to your catalogs. Decisions get easier.", ru: "Результаты поступают в живые дашборды. Баллы связываются с каталогами. Принимать решения становится проще.", kk: "Нәтижелер тікелей дашбордтарға түседі. Балдар каталогтарыңызбен байланысады. Шешім қабылдау оңайлайды." },

    // Features List
    "fl.title1": { en: "Built for the way real teams work.", ru: "Создано для реальной работы команд.", kk: "Нақты командалардың жұмысы үшін жасалған." },
    "fl.title2": { en: "What will you build first?", ru: "Что вы создадите первым?", kk: "Бірінші не жасайсыз?" },
    "fl.f1.title": { en: "AI-native, not AI-bolted-on.", ru: "ИИ в основе, а не сбоку.", kk: "ЖИ негізінде, қосымша емес." },
    "fl.f1.desc": { en: "The AI builder isn't a gimmick tab — it's wired into every part of the product.", ru: "ИИ-конструктор — это не просто вкладка для галочки, он встроен в каждую часть продукта.", kk: "ЖИ-конструктор — бұл жай ғана қосымша емес, ол өнімнің әрбір бөлігіне енгізілген." },
    "fl.f2.title": { en: "Proven at scale.", ru: "Проверено на масштабе.", kk: "Ауқымды деңгейде тексерілген." },
    "fl.f2.desc": { en: "The same engine guiding 50,000+ people through career orientation in Kazakhstan now works for your department.", ru: "Тот же движок, который помогает 50 000+ людям в профориентации в Казахстане, теперь работает на ваш отдел.", kk: "Қазақстанда 50 000+ адамға кәсіби бағдар беруге көмектесетін қозғалтқыш енді сіздің бөліміңіз үшін жұмыс істейді." },
    "fl.f3.title": { en: "No-code, full-control.", ru: "Без кода, полный контроль.", kk: "Кодсыз, толық бақылау." },
    "fl.f3.desc": { en: "Non-technical teams build confidently; power users go deep when they need to.", ru: "Нетехнические команды создают уверенно; продвинутые пользователи углубляются, когда это нужно.", kk: "Техникалық емес командалар сенімді түрде жасайды; тәжірибелі пайдаланушылар қажет болғанда тереңірек енеді." },
    "fl.f4.title": { en: "Tests + data + dashboards in one place.", ru: "Тесты + данные + дашборды в одном месте.", kk: "Тесттер + деректер + дашбордтар бір жерде." },
    "fl.f4.desc": { en: "Stop stitching three tools together. It's all here, and it all connects.", ru: "Хватит сшивать три инструмента вместе. Всё здесь, и всё взаимосвязано.", kk: "Үш құралды біріктіруді доғарыңыз. Барлығы осында және барлығы байланысты." },
    "fl.u1.title": { en: "Talent & HR", ru: "Таланты и HR", kk: "Таланттар және HR" },
    "fl.u1.desc": { en: "Screen candidates, map competencies, track development over time.", ru: "Отбирайте кандидатов, картируйте компетенции, отслеживайте развитие со временем.", kk: "Кандидаттарды іріктеңіз, құзыреттерді картаға түсіріңіз, уақыт өте келе дамуды бақылаңыз." },
    "fl.u2.title": { en: "L&D teams", ru: "Команды обучения", kk: "Оқыту командалары" },
    "fl.u2.desc": { en: "Run knowledge checks, measure training impact, dashboard the results.", ru: "Проводите проверки знаний, измеряйте влияние обучения, выводите результаты на дашборд.", kk: "Білімді тексеріңіз, оқытудың әсерін өлшеңіз, нәтижелерді дашбордқа шығарыңыз." },
    "fl.u3.title": { en: "Career & guidance", ru: "Карьера и профориентация", kk: "Карьера және бағдарлау" },
    "fl.u3.desc": { en: "Orient people toward the right path with validated assessments.", ru: "Направляйте людей на правильный путь с помощью валидированных тестов.", kk: "Тексерілген бағалаулар арқылы адамдарды дұрыс жолға бағыттаңыз." },
    "fl.u4.title": { en: "Operations & research", ru: "Операции и исследования", kk: "Операциялар және зерттеулер" },
    "fl.u4.desc": { en: "Survey, score, and analyze — without exporting a single spreadsheet.", ru: "Опрашивайте, оценивайте и анализируйте — без экспорта единой таблицы.", kk: "Сауалнама жүргізіңіз, бағалаңыз және талдаңыз — бірде-бір кестені экспорттамай." },

    // Credibility (Customers)
    "cred.title": { en: "Trusted where it counts.", ru: "Доверяют там, где это важно.", kk: "Маңызды жерде сенімге ие." },
    "cred.desc": { en: "Test-Platform already powers career orientation across Kazakhstan — guiding more than 50,000 people toward their future. That's not a pilot. That's production, at national scale.", ru: "Test-Platform уже обеспечивает профориентацию по всему Казахстану, направляя более 50 000 человек в их будущее. Это не пилот. Это продакшен национального масштаба.", kk: "Test-Platform Қазақстан бойынша кәсіби бағдар беруді қамтамасыз етіп, 50 000-нан астам адамды болашағына бағыттап отыр. Бұл пилоттық жоба емес. Бұл ұлттық ауқымдағы өндіріс." },
    
    "cred.c1.title": { en: "Bolashaq Schools", ru: "Школы Болашак", kk: "Болашақ мектептері" },
    "cred.c1.stat": { en: "50,000+ Users", ru: "50 000+ пользователей", kk: "50 000+ пайдаланушы" },
    "cred.c1.desc": { en: "Helped identify the direction of schools (linguistics, technical, humanitarian) based on extensive student assessments.", ru: "Помогли определить направления школ (лингвистическое, техническое, гуманитарное) на основе масштабной оценки учеников.", kk: "Оқушыларды ауқымды бағалау негізінде мектеп бағыттарын (лингвистикалық, техникалық, гуманитарлық) анықтауға көмектесті." },
    
    "cred.d1.title": { en: "School Specialization Distribution", ru: "Распределение специализаций по школам", kk: "Мектеп мамандандыруларының үлестірімі" },
    "cred.d1.s1": { en: "School #1 (Astana)", ru: "Школа №1 (Астана)", kk: "№1 мектеп (Астана)" },
    "cred.d1.s2": { en: "School #4 (Almaty)", ru: "Школа №4 (Алматы)", kk: "№4 мектеп (Алматы)" },
    "cred.d1.s3": { en: "School #12 (Shymkent)", ru: "Школа №12 (Шымкент)", kk: "№12 мектеп (Шымкент)" },
    "cred.d1.tech": { en: "Technical", ru: "Техническое", kk: "Техникалық" },
    "cred.d1.hum": { en: "Humanitarian", ru: "Гуманитарное", kk: "Гуманитарлық" },
    "cred.d1.ling": { en: "Linguistics", ru: "Лингвистическое", kk: "Лингвистикалық" },

    "cred.c2.title": { en: "Regional Education Depts", ru: "Региональные управления", kk: "Өңірлік білім басқармалары" },
    "cred.c2.subtitle": { en: "Turkestan, Aktobe, Ural, Semey", ru: "Туркестан, Актобе, Уральск, Семей", kk: "Түркістан, Ақтөбе, Орал, Семей" },
    "cred.c2.stat": { en: "50,000+ Users", ru: "50 000+ пользователей", kk: "50 000+ пайдаланушы" },
    "cred.c2.desc": { en: "Provided extensive college guidance and career orientation across four major regions, tracking placement success.", ru: "Провели масштабную профориентацию и помощь в выборе колледжей в четырех крупных регионах, отслеживая успешность поступления.", kk: "Төрт ірі өңірде ауқымды кәсіби бағдар беру және колледж таңдауға көмек көрсетіп, түсу табыстылығын бақылады." },
    
    "cred.d2.title": { en: "Top Fitting Professions", ru: "Наиболее подходящие профессии", kk: "Ең қолайлы кәсіптер" },
    "cred.d2.p1": { en: "Software Engineer", ru: "Инженер-программист", kk: "Бағдарламалық жасақтама инженері" },
    "cred.d2.p2": { en: "Medical Worker", ru: "Медицинский работник", kk: "Медицина қызметкері" },
    "cred.d2.p3": { en: "Industrial Technician", ru: "Промышленный техник", kk: "Өнеркәсіптік техник" },
    "cred.d2.p4": { en: "Educator / Teacher", ru: "Преподаватель / Учитель", kk: "Оқытушы / Мұғалім" },
    "cred.d2.match": { en: "Match Rate", ru: "Совпадение", kk: "Сәйкестік" },
    "cred.d2.l1": { en: "Turkestan", ru: "Туркестан", kk: "Түркістан" },
    "cred.d2.l2": { en: "Aktobe", ru: "Актобе", kk: "Ақтөбе" },
    "cred.d2.l3": { en: "Ural", ru: "Уральск", kk: "Орал" },
    "cred.d2.l4": { en: "Semey", ru: "Семей", kk: "Семей" },

    // Final CTA
    "cta.title1": { en: "Your next assessment is", ru: "Ваш следующий тест", kk: "Сіздің келесі тестіңіз" },
    "cta.title2": { en: "one sentence away.", ru: "в одном предложении от вас.", kk: "бір сөйлем қашықтықта." },
    "cta.desc": { en: "Describe it. Build it. Ship it. Let AI do the rest.", ru: "Опишите. Создайте. Запустите. Пусть ИИ сделает остальное.", kk: "Сипаттаңыз. Жасаңыз. Іске қосыңыз. Қалғанын ЖИ жасасын." },
    "cta.btn1": { en: "Start building free", ru: "Начать бесплатно", kk: "Тегін бастау" },
    "cta.btn2": { en: "Book a demo", ru: "Заказать демо", kk: "Демоға тапсырыс беру" },

    // Footer
    "footer.desc": { en: "Build tests, catalogs, and dashboards with AI.", ru: "Создавайте тесты, каталоги и дашборды с ИИ.", kk: "ЖИ көмегімен тесттер, каталогтар және дашбордтар жасаңыз." },
    "footer.l1": { en: "Privacy", ru: "Конфиденциальность", kk: "Құпиялылық" },
    "footer.l2": { en: "Terms", ru: "Условия", kk: "Ережелер" },
    "footer.l3": { en: "Contact", ru: "Контакты", kk: "Байланыс" }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const [lang, setLang] = useState<Language>('en');

    const t = (key: string): string => {
        if (dictionary[key] && dictionary[key][lang]) {
            return dictionary[key][lang];
        }
        return key; // Fallback to key if translation is missing
    };

    return (
        <LanguageContext.Provider value={{ lang, setLang, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
