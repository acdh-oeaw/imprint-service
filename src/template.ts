import { type Locale, locales } from "./config";
import type { ImprintConfig } from "./imprint-config";

type PartialName = Exclude<keyof ImprintConfig, "hasMatomo">;

interface Template {
	template: string;
	partials: Record<PartialName, string>;
}

function read(locale: Locale, name: string): Promise<string> {
	return Bun.file(`content/${locale}/${name}.md`).text();
}

const templatesByLocale = Object.fromEntries(
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
) as Record<Locale, Template>;

const placeholder = /{{\s*(\w+)\s*}}/g;

function isPartialName(name: string, partials: Record<PartialName, string>): name is PartialName {
	return Object.hasOwn(partials, name);
}

/** Fail at startup when a template references an unknown partial. */
for (const [locale, { template, partials }] of Object.entries(templatesByLocale)) {
	for (const [, name] of template.matchAll(placeholder)) {
		if (!isPartialName(name!, partials)) {
			throw new Error(`Unknown placeholder "${name!}" in "${locale}" template`);
		}
	}
}

export function renderTemplate(locale: Locale, { hasMatomo, ...config }: ImprintConfig): string {
	const { template, partials } = templatesByLocale[locale];

	const values: Record<PartialName, string> = {
		copyrightNotice: config.copyrightNotice?.[locale] ?? partials.copyrightNotice,
		matomoNotice: !hasMatomo ? "" : (config.matomoNotice?.[locale] ?? partials.matomoNotice),
		projectNature: config.projectNature?.[locale] ?? partials.projectNature,
		responsiblePersons: config.responsiblePersons?.[locale] ?? partials.responsiblePersons,
		websiteAim: config.websiteAim?.[locale] ?? partials.websiteAim,
	};

	return template.replace(placeholder, (_, name: PartialName) => values[name]);
}
