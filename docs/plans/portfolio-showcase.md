# Portfolio Showcase — Plan

## Status: In Progress (primary focus)

## Vision

A personal portfolio showcasing Ricardo's work as a software engineer. The site lives at the root of the `exponencial` app and is the public face of the project.

## Goals

- Present professional background, skills, and projects
- Demonstrate technical depth (architecture decisions, code quality standards)
- Be visually compelling and performant
- Serve as a living document that grows with the career

## Sections to Build

### 1. Hero / Landing
- Name, title, short personal pitch
- CTA: View Work / Contact

### 2. About
- Bio and values as an engineer
- Tech stack / areas of expertise

### 3. Projects
- Cards with project name, description, tech stack, links (GitHub, live demo)
- Highlight domain-driven design, test quality, architectural thinking

### 4. Experience / Timeline
- Work history in reverse-chronological order

### 5. Contact
- Email link or contact form
- Social links (GitHub, LinkedIn, etc.)

## Technical Notes

- Route: `/` (root index page)
- Internationalization: English initially; i18n infrastructure already in place
- SEO: use TanStack Start head meta per route
- Styling: Tailwind v4 + shadcn components
- Deployment: Cloudflare Workers (already configured)

## Open Questions

- [ ] Domain name / custom URL
- [ ] Whether to include a blog section
- [ ] Dark/light mode toggle preference
