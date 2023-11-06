import { readFileSync } from "node:fs";
import { join } from "node:path";

import { type Locale, locales } from "./config.js";
import type { ImprintConfig } from "./imprint-config.js";

function read(locale: Locale, name: string) {
	const filePath = join(process.cwd(), "content", locale, [name, "md"].join("."));

	return readFileSync(filePath, { encoding: "utf-8" });
}

export interface Template {
	template: string;
	partials: Record<Exclude<keyof ImprintConfig, "hasMatomo">, string>;
}

const templatesByLocale = new Map<Locale, Template>(
	locales.map((locale) => {
		return [
			locale,
			{
				template: read(locale, "template"),
				partials: {
					copyrightNotice: read(locale, "copyright-notice"),
					matomoNotice: read(locale, "matomo-notice"),
					projectNature: read(locale, "project-nature"),
					responsiblePersons: read(locale, "responsible-persons"),
					websiteAim: read(locale, "website-aim"),
				},
			},
		];
	}),
);

export function getTemplate(locale: Locale, { hasMatomo, ...config }: ImprintConfig): Template {
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const templates = templatesByLocale.get(locale)!;

	const partials = {
		copyrightNotice: config.copyrightNotice?.[locale] ?? templates.partials.copyrightNotice,
		matomoNotice: !hasMatomo
			? ""
			: config.matomoNotice?.[locale] ?? templates.partials.matomoNotice,
		projectNature: config.projectNature?.[locale] ?? templates.partials.projectNature,
		responsiblePersons:
			config.responsiblePersons?.[locale] ?? templates.partials.responsiblePersons,
		websiteAim: config.websiteAim?.[locale] ?? templates.partials.websiteAim,
	};

	return { template: templates.template, partials };
}
