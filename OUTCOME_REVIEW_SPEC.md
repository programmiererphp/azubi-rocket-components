# AZR applicant outcome delivery — 2026-10-27

Purpose: a first-time applicant who reads French, English, Russian or German understands dual vocational training and can prepare an individual German employer application. No employment/visa eligibility decision, vacancy guarantee, automatic send or new AI/backend service is added.

## Incremental deliveries

1. **D12a: understandable German-document workflow.** Version C01 compact navigation/showControls; C03 separate documentLanguage; C04 clear application-selection wording; C05 separate documentLanguage, controlled recipient, editor presentation and optional profession suggestions. Defaults remain compatible for other hosts. Public native module builds/manifests/tests before shell updates. Document language de in this portal regardless of UI language. Personal free text is preserved, with an explicit German-writing/review instruction. Never claim automatic translation.
2. **D12b: actual application package.** Independent C12 application-pack Web Component and shared application-files service. Pure props/events and injected services; no component-to-component imports. Host prepares the German CV document model and passes applicant/company/letter state. Certificates combine into one real PDF, final outputs include CV PDF, certificates PDF, German plaintext letter, relevant company CSV, a MIME .eml draft containing exactly the two PDFs and a ZIP package. The letter need not be PDF. Nothing is sent automatically.
3. **D12c: outcome acceptance and AI Studio.** Fresh-context persona test, actual file parsing and screenshots, regression tests, public anonymous component/browser checks, pinned shell integration and updated AI Studio source/preview. Errors and later proposals remain in private GitHub issue1; close only reproduced and verified fixes.

## C12 contract

`<azr-application-pack>` properties: language de/en/fr/ru; request with schemaVersion1, German CV document, readiness/missing fields, applicant name, selected company {id,name,email,emailStatus,website}, letter {subject,body}, relevant companies; services {prepareApplication, loadFiles?, saveFiles?}. Host request contains only serializable values. Validate/copy incoming data. Changes invalidate prior outputs immediately. UI remains localized; application content stays German.

Native file input accepts PDF/JPEG/PNG. Display selected order and remove/up/down controls; certificates are optional only via an explicit 'no certificates available yet' choice, with visible missing-file warning and truthful attachment list. Never create an empty fake certificate PDF. If certificates exist, produce exactly one Nachweise.pdf. Limit10 files,10MiB per file,30MiB total,40MP images,100 PDF pages total. Reject zero-byte/corrupt/encrypted/unsupported files, show localized recoverable errors and do not discard valid existing files after one invalid addition. Inspect signatures rather than trusting file extensions. Normalize images onto readable A4 pages without cropping; preserve PDF page order and orientation. Strip active PDF page actions; flatten forms when required to preserve visible fields or return a clear error.

Services do not send network requests or log private values. File storage is local only; use an injected IndexedDB vault where possible, show actual persistence/fallback status, and include certificates in the privacy reset. If storage is unavailable or after reload without retained files, never show stale 'ready' output. Cached component state retains files across in-app navigation. Store no file contents in debug logs or URL queries.

Events: azr:application-change schemaVersion1 with recipientEmail/addressReviewed/germanReviewed and certificate metadata only; azr:application-status with operation/status/errorCode only. Host owns navigation and draft persistence. Component owns transient output Blobs/object URLs, cancels stale jobs and revokes URLs on invalidation/disconnect. Reconnect must not duplicate listeners or lose accepted files. Disable duplicate prepare jobs; retain errors and allow retry.

## Email and download behavior

Review contains one company/recipient, German subject/body, attachment names/page counts and clear next action. Require the applicant to review the recipient and German text before enabling handoff; historical or inferred email addresses are never described as verified. Do not use bulk To/CC. No send status on preparation, download, mailto open or share completion.

Provide a real RFC MIME draft: To + safe encoded UTF8 subject, X-Unsent:1, multipart/mixed, German UTF8 text/plain body and PDF attachments encoded as base64 with CRLF/line wrapping. Reject header injection. This is a downloadable .eml for compatible mail programs; do not promise every device opens it as an editable draft. Offer native navigator.share({files,text,title}) only when navigator.canShare confirms it and the user clicks; unsupported/cancelled share leaves downloads available. Standard mailto supports recipient/subject/body, not attachments; its fallback clearly instructs attaching the two downloaded PDFs. Long mailto bodies have an explicit copy-text fallback. A ZIP includes all existing documents, email text/draft and company list; company CSV has German column names, safe spreadsheet escaping, website/provenance and no invented current vacancies.

## Host UX

Keep six complete step labels everywhere, mobile2x3. Compact navigation without a duplicate Back/Next pair. Explain 'Ausbildung': company + vocational school, generally paid dual training, usual2–3.5years depending on occupation (official Federal Employment Agency source). State the concrete portal output before asking for personal data. The abroad branch separates employer application from later visa/entry guidance and links the competent German mission (Madagascar official French page where relevant), without copying old monetary thresholds or giving guarantees.

Put secondary information/quiz/city/admin tools and portable draft controls in named disclosures after the main task. Local autosave status remains visible. Keep the current useful action in the first mobile viewport where practical. Route changes reset to a predictable task beginning and preserve state. CV completion requires name, usable email and at least one meaningful education entry; optional experience/profile/photo remain optional and clearly labeled. Surface German level without forcing applicants to search under work experience.

Step4 selection opens the selected employer's German letter and preserves corrected recipient data across navigation/reload. Export the currently relevant company list. Step5 is focused letter editing and a clear next action to certificates/review. Final preparation assembles actual files and previews what will be opened/downloaded. After handoff, show follow-up/interview/visa guidance without falsely marking an application sent.

## Verification

Source/version integrity; existing isolated component tests and new optional-property tests; real public demo tests and anonymous hash checks before shell pin updates. New service tests independently parse PDFs, MIME and ZIP; compare embedded attachment bytes, order, text/Unicode and source pages. Test corrupt/encrypted/oversized documents, mixed images/PDFs, removal/reorder, missing data, stale output after edits, persistence/reset/quota failure and cancelled/unsupported sharing.

Portal tests: French applicant in Madagascar from empty context -> understandable start -> CV -> company -> German letter -> certificates -> review -> actual PDFs/eml/ZIP/CSV/mailto without sending. Repeat critical branches de/en/fr/ru at320/390/1440, keyboard and focus, invalid inputs, locale/navigation/reload, CMS changes and original regressions. Capture and inspect first viewport plus result screens. Record environment-specific missing emoji fonts separately from product defects. Original production remains untouched.

Sources: https://www.arbeitsagentur.de/en/working-in-germany/vocational-training ; https://antananarivo.diplo.de/mg-de/service/05-visaeinreise/2753522-2753522 ; https://www.rfc-editor.org/info/rfc6068/ ; https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share .

## Audit follow-up before code

Fresh integrated mobile QA found the abroad location choice below the initial 390×844 viewport. D12a additionally versions C02 with optional compact orientation cards and showShortcuts (defaults preserve the existing host contract). The portal uses compact cards and a single preparation action. Investigate and prevent selecting certificates while asynchronous local storage is loading; C12 exposes a disabled file input during that phase, rejects stale jobs and retains actual accepted files. New component versions repeat isolated, published and anonymous exact-hash gates before shell pinning.

