# Guardia Systems Oracle ERP landing page

This package contains a bilingual English/Arabic lead-generation page built around Guardia Systems' verified live brand colors and current Oracle ERP positioning. It includes an editable financial-value calculator, documented savings levers, and clearly attributed success stories.

## Files

- `elementor-html-widget.html` — production handoff artifact; paste into exactly one Elementor HTML widget.
- `index.html` — standalone local preview with `noindex,nofollow`.
- `page.html` — editable bilingual markup source.
- `styles.css` — editable scoped styles and Elementor full-bleed override.
- `script.js` — language switch, ROI calculator, two-step form, validation, CF7/reCAPTCHA integration, and analytics events.
- `seo-brief.md` — keyword strategy, metadata, headings, FAQ, schema, links, overlap risk, and tracking plan.
- `build.mjs` — rebuilds both deliverable HTML files from the three source files.

## Build and preview

```bash
node build.mjs
python3 -m http.server 4173
```

Then open `http://127.0.0.1:4173/`.

The local preview is intentionally in demo mode. It validates the full form but never sends a lead. On `guardiasystems.com`, the form is configured to call the site's current Contact Form 7 REST endpoint for form `1062` and uses the site's public reCAPTCHA v3 key. The payload maps the landing-page fields to the existing CF7 fields `your-name`, `email`, `telephone`, `subject`, and `message`. The prospect's calculator baselines, assumptions, currency, and potential annual gross value are included in the message for follow-up context.

The calculator is a planning aid, not a quote or guarantee. The on-page disclaimer explains excluded costs and the difference between returned capacity and cash savings. Regional Guardia projects and Oracle-published global customer outcomes are intentionally separated so their attribution and technology scope cannot be confused.

## WordPress / Elementor handoff

1. Create or review one WordPress page only; do not bulk-publish.
2. Keep it as a draft until content, legal, analytics, and form routing are approved.
3. Use the Elementor Canvas or equivalent blank landing-page template if the theme header/footer should not appear.
4. Add exactly one Elementor **HTML** widget and paste all of `elementor-html-widget.html` into it.
5. Do not use an Elementor Text Editor widget for any part of this design.
6. Apply the SEO title, meta description, focus keyword, and proposed slug from `seo-brief.md` in the active SEO plugin.
7. Confirm the final URL before changing the JSON-LD `@id` values.
8. Test one approved non-production lead and confirm the recipient, email template, spam handling, and CRM routing before launch.

## Safe republish checklist

Before replacing or republishing any existing page:

- Explain overlap with the current Oracle blog content and confirm the landing page is a distinct commercial intent.
- Back up live `post_content` and `_elementor_data`.
- Confirm one H1, unique copy, correct language direction, FAQ/schema, and all internal-link targets.
- Revalidate every success-story URL and quantitative claim; keep the Guardia and Oracle evidence groups separate.
- Have commercial and legal reviewers approve the calculator assumptions and disclaimer.
- Read back Elementor data after save and confirm one HTML widget and zero Text Editor widgets.
- Verify the form on the real staging/live domain because reCAPTCHA will not run on localhost.
- Clear only this page's rendered cache, then verify desktop and mobile public URLs.
- Never change canonicals, robots, redirects, or an existing URL without an SEO impact review.

## Verified brand/integration reference

Verified from the live site on 2026-07-13:

- Guardia blue: `#243D96`
- Guardia aqua: `#6FC9C4`
- Guardia orange: `#F68D39`
- Near-black: `#15161C`
- Live logo asset: `guardia-logo-mg-light.png`
- Existing enquiry form: Contact Form 7 ID `1062`, version observed `6.1.6`
- Existing form and public URLs returned HTTP 200 at verification time

Revalidate the CF7 version, ID, recipient, public reCAPTCHA key, and final URL immediately before publishing because those values can change.

## v2 changes (Oct 2026)

- Header/logo given breathing room so the "An MGHOLDING Company" line no longer touches the hero.
- Copy aligned to the client-approved page (guardiasystems.com/oracle-erp/): hero, Why Oracle ERP (8 points), modules, deployment models, partner claim, phone numbers. Long descriptions trimmed; Arabic is a new translation and needs native review.
- Client's own Oracle ERP images are hot-linked from guardiasystems.com/wp-content/uploads (copies in `assets/`).
- Testimonial: the Central Bank of Iraq quote is taken verbatim from Guardia's published case study. Add more real, approved quotes in the same `.g-testi` pattern; no quotes are invented.
- Exit-intent savings popup: set the percentage in `data-savings-percent` on `#guardia-oracle-erp` (default 20, based on Oracle's published Sandhar result). Confirm the claim with the client. Test with `?exitpopup=1`.
- Sticky mobile CTA bar, module tabs, shortened FAQ (schema kept in sync).
- `_backup-v1/` holds the previous version.
