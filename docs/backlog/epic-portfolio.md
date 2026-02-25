# Epic: Portfolio Showcase

- **Status**: Backlog
- **Priority**: Medium

## Goal

Replace the demo/scaffold content at `/` with a real personal portfolio for Ricardo. Public-facing, SEO-optimised, and visually compelling. The primary showcase of Ricardo's engineering skills to potential employers and collaborators — and proof that exponencial itself is a serious project.

## Open Questions (resolve before starting)

- [ ] Custom domain / URL — is one purchased or planned?
- [ ] Blog section — include now or leave out?
- [ ] Dark/light mode toggle — opt-in from the start or add later?

## Scope

**In:**
- Hero section (name, title, short pitch, CTA)
- About section (bio, values, tech stack)
- Projects section (cards with description, tech tags, GitHub / live links)
- Experience section (work history, reverse-chronological)
- Contact section (email + social links)
- SEO meta tags per route via TanStack Start head API
- Mobile-first layout

**Out:**
- Blog section (revisit after the rest is done)
- CMS or admin interface — content is hardcoded in TSX / typed config files
- i18n for portfolio content (English only; the i18n infrastructure is in place for later)
- Dark/light mode toggle (nice to have, not required for launch)

## Tasks

### Foundation
- [ ] (S) Remove demo content from `/` route — clear `src/routes/index.tsx` and replace with a portfolio shell component
- [ ] (S) SEO baseline — set default `<title>`, `description`, and Open Graph meta tags in `__root.tsx`; add per-route overrides for the portfolio page

### Sections
- [ ] (S) Hero — name, title, one-line pitch, two CTA buttons (View Work → scrolls to Projects, Contact → scrolls to Contact)
- [ ] (S) About — bio paragraph, engineering values list, tech stack icon/chip row
- [ ] (M) Projects — card grid; project data in a typed config file at `src/portfolio/config/projects.ts`; each card shows name, description, tech tags, and links (GitHub + live)
- [ ] (M) Experience — timeline component; work history in a typed config file at `src/portfolio/config/experience.ts`; reverse-chronological; company, role, date range, bullet points
- [ ] (S) Contact — email mailto link + icon links (GitHub, LinkedIn)

### Polish
- [ ] (S) Smooth scroll — clicking nav CTAs scrolls to the right section using anchor IDs
- [ ] (S) Responsive audit — review every section on mobile (375px) and desktop (1280px); fix layout issues

## Done When

- [ ] `/` shows portfolio content with no demo content visible
- [ ] All five sections are present and populated with real content
- [ ] SEO meta tags are set and correct (verify with `<head>` inspection)
- [ ] Passes Biome, TypeScript, and Knip checks
- [ ] Reviewed on mobile and desktop
