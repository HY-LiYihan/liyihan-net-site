import fs from "node:fs";
import path from "node:path";
import { type Lang, ui } from "./i18n";

type LocaleConfig = {
  siteTitle?: string;
  brand?: string;
  subtitle?: string;
  description?: string;
  fullName?: string;
  nativeName?: string;
  footer?: string;
  heroEyebrow?: string;
  heroTitle?: string;
  heroLede?: string;
  heroFocusTitle?: string;
  heroFocusBody?: string;
  heroPrimary?: string;
  heroSecondary?: string;
};

type SiteConfig = {
  locales?: Partial<Record<Lang, LocaleConfig>>;
  images?: {
    logo?: string;
    avatar?: string;
    hero?: string;
    heroAlt?: string;
  };
  theme?: {
    variables?: Record<string, string>;
  };
};

const contentRoot = process.env.LIYIHAN_CONTENT_DIR
  ? path.resolve(process.env.LIYIHAN_CONTENT_DIR)
  : path.resolve("./src/content");

function readConfig(): SiteConfig {
  const configPath = path.join(contentRoot, "site.config.json");
  if (!fs.existsSync(configPath)) {
    return {};
  }

  try {
    return JSON.parse(fs.readFileSync(configPath, "utf8")) as SiteConfig;
  } catch (error) {
    throw new Error(`Failed to parse ${configPath}: ${(error as Error).message}`);
  }
}

export const siteConfig = readConfig();

export function getSiteLocale(lang: Lang) {
  const t = ui[lang];
  const locale = siteConfig.locales?.[lang] ?? {};

  return {
    siteTitle: locale.siteTitle ?? t.siteTitle,
    brand: locale.brand ?? t.brand,
    subtitle: locale.subtitle ?? t.subtitle,
    description: locale.description ?? t.description,
    fullName: locale.fullName ?? t.fullName,
    nativeName: locale.nativeName ?? t.nativeName,
    footer: locale.footer ?? t.footer,
    heroEyebrow: locale.heroEyebrow ?? t.hero.eyebrow,
    heroTitle: locale.heroTitle ?? t.hero.title,
    heroLede: locale.heroLede ?? t.hero.lede,
    heroFocusTitle: locale.heroFocusTitle ?? t.hero.focusTitle,
    heroFocusBody: locale.heroFocusBody ?? t.hero.focusBody,
    heroPrimary: locale.heroPrimary ?? t.hero.primary,
    heroSecondary: locale.heroSecondary ?? t.hero.secondary,
  };
}

export function getSiteImages() {
  return {
    logo: siteConfig.images?.logo ?? "",
    avatar: siteConfig.images?.avatar ?? "/images/old-site/profile.png",
    hero: siteConfig.images?.hero ?? "/images/research-workspace.svg",
    heroAlt:
      siteConfig.images?.heroAlt ??
      "Abstract research workspace with corpus nodes, charts, and interface panels",
  };
}

export function getThemeStyle() {
  const variables = siteConfig.theme?.variables ?? {};
  return Object.entries(variables)
    .filter(([key, value]) => key.startsWith("--") && typeof value === "string")
    .map(([key, value]) => `${key}: ${value.replaceAll(";", "")}`)
    .join("; ");
}
