import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { CACHE_TAGS, db } from "@/lib/db";
import { storeConfig } from "@/lib/store-config";
import { DEFAULT_HEADER_ACTIONS, normalizeHeaderActions, type HeaderActionSetting } from "@/lib/header-actions";
export { DEFAULT_HEADER_ACTIONS } from "@/lib/header-actions";
export type { HeaderActionKey, HeaderActionSetting, HeaderIconKey } from "@/lib/header-actions";

export type SiteContentSettings = {
  headerActions: HeaderActionSetting[];
  logoUrl: string;
  footerDescription: string;
  footerCopyright: string;
  supportPhone: string;
  supportEmail: string;
  social: { network: "facebook" | "instagram" | "youtube" | "linkedin"; label: string; url: string }[];
};

const DEFAULTS: SiteContentSettings = {
  headerActions: DEFAULT_HEADER_ACTIONS,
  logoUrl: "/brand/mi-terza-logo.png",
  footerDescription: "En Terza somos la empresa más importante en México y Latinoamérica en la producción y comercialización de superficies, con más de 40 años de respaldo en el mercado.",
  footerCopyright: "Terza. Todos los derechos reservados.",
  supportPhone: storeConfig.supportPhone,
  supportEmail: storeConfig.supportEmail,
  social: [...storeConfig.social],
};

export async function getSiteContentSettings(): Promise<SiteContentSettings> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.content);
  const row = await db.siteSettings.findUnique({ where: { id: "site" }, select: { content: true } });
  const content = (row?.content ?? {}) as Partial<SiteContentSettings>;
  return { ...DEFAULTS, ...content, headerActions: normalizeHeaderActions(content.headerActions) };
}

export const defaultSiteContentSettings = DEFAULTS;
