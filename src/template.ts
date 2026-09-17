import { type Locale, locales } from "./config";
import type { ImprintConfig } from "./imprint-config";

function read(locale: Locale, name: string): Promise<string> {
	return Bun.file(`content/${locale}/${name}.md`).text();
}

export interface Template {
	template: string;
	partials: Record<Exclude<keyof ImprintConfig, "hasMatomo">, string>;
}

const templatesByLocale = new Map<Locale, Template>(
	await Promise.all(
		locales.map(async (locale): Promise<[Locale, Template]> => {
			return [
				locale,
				{
					template: await read(locale, "template"),
					partials: {
						copyrightNotice: await read(locale, "copyright-notice"),
						matomoNotice: await read(locale, "matomo-notice"),
						projectNature: await read(locale, "project-nature"),
						responsiblePersons: await read(locale, "responsible-persons"),
						websiteAim: await read(locale, "website-aim"),
					},
				},
			];
		}),
	),
);

export function getTemplate(locale: Locale, { hasMatomo, ...config }: ImprintConfig): Template {
	const templates = templatesByLocale.get(locale)!;

	const partials = {
		copyrightNotice: config.copyrightNotice?.[locale] ?? templates.partials.copyrightNotice,
		matomoNotice: !hasMatomo
			? ""
			: (config.matomoNotice?.[locale] ?? templates.partials.matomoNotice),
		projectNature: config.projectNature?.[locale] ?? templates.partials.projectNature,
		responsiblePersons:
			config.responsiblePersons?.[locale] ?? templates.partials.responsiblePersons,
		websiteAim: config.websiteAim?.[locale] ?? templates.partials.websiteAim,
	};

	return { template: templates.template, partials };
}
