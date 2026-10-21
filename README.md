# Azubi Rocket Web Components

Framework-independent native Web Components with isolated demos, versioned ESM artifacts, manifests and contract/browser tests. Architecture is defined in SPEC.md and COMPONENT_REGISTER.json. C01 journey navigation v0.1.0 is GITHUB_VERIFIED: 85/85 isolated and 85/85 published-demo Chromium tests passed. C02–C11 and the application shell are planned; mockups are separate references. Legacy material remains outside this public repository. Real app data are injected by the host, public fixtures are synthetic.

All six journey steps must remain visible on every user page, including steps 5 and 6. The host composes components and owns persistence; components do not import each other. No additional license grant is made; repository owner controls reuse/licensing.

- [Live C01 demo](https://programmiererphp.github.io/azubi-rocket-components/components/C01-journey-nav/demo/index.html)
- [C01 v0.1.0 release](https://github.com/programmiererphp/azubi-rocket-components/releases/tag/C01-v0.1.0)
- [Portable component ZIP](releases/C01-v0.1.0.zip)
- [Delivery and evidence](components/C01-journey-nav/DELIVERY.md)

Tested: Chromium at 1440x900, 390x844 and 320x844; de/en/fr/ru, steps 1–6, keyboard, host state, events, disabled/busy, malformed input and repeated mounting/imports. Firefox/Safari and the full application remain untested.

- [C02 guide · geprüfte Demo](https://programmiererphp.github.io/azubi-rocket-components/components/C02-guide/demo/index.html) — 26 isolierte und 26 Live-Tests bestanden.

- [C03 cv-editor · geprüfte Demo](https://programmiererphp.github.io/azubi-rocket-components/components/C03-cv-editor/demo/index.html) — 33 isolierte und 33 Live-Tests bestanden.

- [C04 company-finder · geprüfte Demo](https://programmiererphp.github.io/azubi-rocket-components/components/C04-company-finder/demo/index.html) — 26 isolierte und 26 Live-Tests bestanden.
