export const languages = ["en", "zh"] as const;
export type Lang = (typeof languages)[number];

export const defaultLang: Lang = "en";

export function isLang(value: string | undefined): value is Lang {
  return value === "en" || value === "zh";
}

export function route(lang: Lang, path = "/") {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `/${lang}${cleanPath}`;
}

export function entrySlug(entry: { id: string; data: { routeSlug?: string } }) {
  return entry.data.routeSlug ?? entry.id.split("/").pop() ?? entry.id;
}

export function formatDate(date: Date, lang: Lang) {
  return date.toLocaleDateString(lang === "zh" ? "zh-CN" : "en", {
    dateStyle: "medium",
  });
}

export function switchLangPath(pathname: string, lang: Lang) {
  if (/^\/(en|zh)(\/|$)/.test(pathname)) {
    return pathname.replace(/^\/(en|zh)(?=\/|$)/, `/${lang}`);
  }
  return route(lang, "/");
}

export const ui = {
  en: {
    htmlLang: "en",
    brand: "Yihan Li",
    fullName: "Yihan Li",
    nativeName: "李溢涵",
    siteTitle: "Yihan Li",
    subtitle: "Robotics & Embodied Intelligence",
    role: "Full-Stack Engineer",
    description:
      "Academic portfolio for robotics, embodied intelligence, engineering notes, projects, and CV materials.",
    nav: {
      home: "Home",
      cv: "CV",
      publications: "Publications",
      projects: "Projects",
      blog: "Blog",
      search: "Search",
    },
    hero: {
      eyebrow: "Academic website",
      title: "Yihan Li",
      lede:
        "I work across robotics, embodied intelligence, software systems, and research tooling.",
      primary: "View CV",
      secondary: "View projects",
      focusTitle: "Focus",
      focusBody:
        "Robotics, embodied intelligence, ROS/PX4 systems, simulation, and practical full-stack engineering.",
    },
    skills: ["ROS / PX4", "Python / C++ / C", "Isaac Sim / MuJoCo"],
    sections: {
      featuredPublications: "Featured Publications",
      featuredProjects: "Featured Projects",
      writing: "Writing",
      projects: "Projects",
      publications: "Publications",
      search: "Search",
      tag: "Tag",
    },
    cv: {
      eyebrow: "Curriculum vitae",
      title: "CV",
      lede:
        "Education, engineering background, research interests, and contact information migrated from the previous liyihan.xyz site.",
      educationTitle: "Education",
      education:
        "Sun Yat-sen University, Information Engineering, School of Systems Science and Engineering, 2023-2027 expected. Minor in Computer Science and Technology.",
      profileTitle: "Profile",
      profile:
        "Yihan Li is building a research and engineering profile around robotics, embodied intelligence, simulation, and full-stack systems.",
      contactTitle: "Contact",
    },
    footer: "Built with Astro, MDX, Docker, and GitHub Actions.",
    language: "Language",
    oldSite: "Previous site",
  },
  zh: {
    htmlLang: "zh-CN",
    brand: "李溢涵",
    fullName: "李溢涵",
    nativeName: "Yihan Li",
    siteTitle: "李溢涵",
    subtitle: "机器人与具身智能",
    role: "全栈工程师",
    description: "李溢涵的个人学术与工程网站，记录机器人、具身智能、项目、笔记与 CV。",
    nav: {
      home: "首页",
      cv: "简历",
      publications: "论文",
      projects: "项目",
      blog: "文章",
      search: "搜索",
    },
    hero: {
      eyebrow: "个人学术网站",
      title: "李溢涵",
      lede: "关注机器人、具身智能、软件系统与研究工具，沉淀项目、文章和简历材料。",
      primary: "查看简历",
      secondary: "查看项目",
      focusTitle: "研究与工程方向",
      focusBody:
        "机器人、具身智能、ROS/PX4、仿真平台，以及面向实际应用的全栈工程。",
    },
    skills: ["ROS / PX4", "Python / C++ / C", "Isaac Sim / MuJoCo"],
    sections: {
      featuredPublications: "代表性论文",
      featuredProjects: "代表性项目",
      writing: "文章",
      projects: "项目",
      publications: "论文",
      search: "搜索",
      tag: "标签",
    },
    cv: {
      eyebrow: "个人简历",
      title: "简历",
      lede: "从旧站 liyihan.xyz 迁移的教育背景、工程方向、研究兴趣和联系方式。",
      educationTitle: "教育背景",
      education:
        "中山大学，系统科学与工程学院，信息工程专业，2023 年 9 月至 2027 年 6 月预计毕业；辅修计算机科学与技术。",
      profileTitle: "个人简介",
      profile:
        "李溢涵关注机器人、具身智能、仿真与全栈系统，将个人网站作为长期维护的项目、文章和简历入口。",
      contactTitle: "联系方式",
    },
    footer: "使用 Astro、MDX、Docker 和 GitHub Actions 构建。",
    language: "语言",
    oldSite: "旧站",
  },
} as const satisfies Record<Lang, Record<string, unknown>>;
