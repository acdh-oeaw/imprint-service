# imprint service

service to retrieve acdh-ch imprint text as html or markdown.

## how to use

request the imprint by providing a redmine service id to
`https://imprint.acdh.oeaw.ac.at/:service-id`.

example:

```bash
curl "https://imprint.acdh.oeaw.ac.at/21966"
```

by default, the service returns the imprint text as html in english.

### options

the following options can be set via url query string:

- `format: "html" | "markdown"`: request the imprint text as either "html" or "markdown". default:
  "html". example: `https://imprint.acdh.oeaw.ac.at/21966/?format=markdown`
- `locale: "de" | "en"`: request the imprint text in either german ("de") or english ("en").
  default: "en". example: `https://imprint.acdh.oeaw.ac.at/21966/?locale=de`

## custom text

custom text for "copyright notice", "matomo notice", "project nature", "responsible persons", and
"website-aim" can be provided via the "ImprintParams" custom yaml field in the redmine service
issue.

## how to run locally

prerequisites:

- [node.js v18](https://nodejs.org/en/download)
- [pnpm 8.x](https://pnpm.io/installation)

set required environment variables in `.env`:

```bash
cp .env.example .env
```

run a development server at [http://localhost:3000](http://localhost:3000):

```bash
pnpm run dev
```
