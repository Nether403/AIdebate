# Requirements Document

## Introduction

This document specifies the requirements for the **App Redesign** of the AI Debate Arena
research workbench. The requirements are derived from the approved design document
(`design.md`), whose canonical visual ground truth is the reviewed reference screen
(`design-reference-final.png` / `design-reference-fullpage.png`) — a "Benchmark run
scorecard" eval report.

The redesign rolls one proven design language across the whole app shell and its real
research screens: a shadcn/ui + Tailwind v4 foundation (New York style, Neutral base)
themed to a cool near-black surface with a single cyan→violet signature accent, presented
through a persistent left sidebar plus sticky top bar.

This is a **presentation-only** redesign. It changes layout, theming, component structure,
and the navigation shell. It does not change debate execution, persistence, judging,
fact-checking, export logic, or the database schema (per AGENTS.md non-goals). The redesign
preserves the honest research-workbench framing: the product is a benchmarking and
alignment-research workbench, **not** a consumer, gamified, social, prediction-market, or
betting product, and it must expose no such features.

## Glossary

- **Design_System**: The shadcn/ui + Tailwind v4 component layer and CSS-variable token contract that defines the redesign's visual language.
- **App_Shell**: The persistent layout wrapper that provides the sidebar, top bar, ambient glow, and main content column for every route.
- **App_Sidebar**: The persistent left navigation surface that renders the brand logo and the approved research destinations.
- **App_TopBar**: The sticky top bar that renders the breadcrumb, context pill, primary action slot, and theme toggle.
- **Ambient_Glow**: The single static decorative glow layer that replaces the prior animated background.
- **Theme_Provider**: The existing theme controller that toggles and persists the dark and light themes.
- **Navigation_Manifest**: The typed content registry (`lib/design-system/manifest.ts`) holding the navigation allow-list, CTA targets, showcase entries, brand images, the real-route allow-list, and the non-goal exclusion patterns.
- **Route_Guard**: The middleware that enforces non-goal reachability by redirecting excluded routes.
- **Showcase_Hub**: The showcase index surface that lists the demo entries.
- **Eval_Report_Screen**: The canonical scorecard surface that ports the approved reference screen.
- **Application**: Any in-scope route page rendered inside the App_Shell.
- **EXISTING_ROUTES**: The Navigation_Manifest allow-list of real, resolvable application routes.
- **EXCLUDED_PATTERNS**: The Navigation_Manifest pattern set for non-goal content (prediction markets, betting/wager, DebatePoints, superforecaster badges, social/share, follow, leaderboard, virality).

## Requirements

### Requirement 1: Unified visual design language

**User Story:** As the product owner, I want every screen to share one approved design language, so that the app reads as a single credible research workbench rather than a collection of mismatched pages.

#### Acceptance Criteria

1. FOR ALL in-scope application screens, THE Design_System SHALL render the page base surface as the cool near-black background defined by the `--background` token (`#070b11` in the dark theme).
2. THE Design_System SHALL render body text in the slate scale defined by the foreground and muted-foreground tokens.
3. WHERE a node renders emphasis text (heading, active navigation label, or highlighted metric value), THE Design_System SHALL render that text in the lighter slate/white emphasis tokens.
4. THE Design_System SHALL expose exactly one signature accent identity — a single cyan→violet gradient token (`--accent-gradient`) plus the cyan primary token (`--primary`) — and SHALL NOT define any additional accent or primary brand token.
5. THE Design_System SHALL apply gradient and glow styling only to the interactive and emphasis roles primary button, active navigation item, highlighted KPI, low-severity bar, and legend, and to no other roles.
6. WHERE a node renders body text, THE Design_System SHALL render that text without a gradient text-fill or text-shadow.
7. THE Design_System SHALL reserve the amber and rose tokens for status and severity indication and SHALL NOT use the amber or rose tokens as a brand accent.
8. THE Design_System SHALL apply the Geist font to sans-serif text and the Geist Mono font to code and tabular-numeral content.
9. WHERE a surface presents a simple comparative bar, THE Design_System SHALL render it as a CSS gradient bar with no default-styled chart fill.
10. WHERE a surface renders a multi-series chart, THE Design_System SHALL style it against the token palette with no default chart fills, no default strokes, and no default grid.
11. FOR ALL in-scope application screens, THE Design_System SHALL apply the same palette tokens and typography tokens with no per-screen color or font overrides.

### Requirement 2: Persistent app shell and brand identity

**User Story:** As a researcher, I want a consistent shell with persistent navigation and clear branding on every screen, so that I always know where I am and how to move between research destinations.

#### Acceptance Criteria

1. WHEN any in-scope route is rendered, THE App_Shell SHALL wrap the route content exactly once, rendering exactly one App_Sidebar, exactly one App_TopBar, exactly one Ambient_Glow, and exactly one main content column.
2. THE App_Sidebar SHALL render the brand logo (`/logo.jpg`) with a cyan halo, SHALL link the logo to the home route resolving to a member of EXISTING_ROUTES, and SHALL provide informational alternative text of 1 to 250 characters describing the logo image.
3. WHERE the redesign retains a supporting brand or explanatory image, THE Application SHALL provide informational alternative text of 1 to 250 characters describing that image.
4. THE App_TopBar SHALL render the breadcrumb and the theme toggle, SHALL render the context pill only when a context value is provided, and SHALL render the primary-action slot only when a primary action is provided.
5. WHILE an in-scope route is scrolled, THE App_TopBar SHALL remain fixed to the top of the viewport.
6. THE Application SHALL render only its own page content and SHALL NOT render its own navigation, App_Sidebar, App_TopBar, or background decoration.

### Requirement 3: Theme support

**User Story:** As a researcher who works in dark environments, I want a dark-first theme with a preserved light option, so that I can read dense research data comfortably while keeping an accessible alternative.

#### Acceptance Criteria

1. WHEN the Application loads and no stored theme preference exists, THE Theme_Provider SHALL apply the dark theme as the default of the two supported themes (dark and light).
2. IF the Application loads and the stored theme preference is not one of the two supported themes (dark or light), THEN THE Theme_Provider SHALL apply the dark theme and overwrite the stored preference with the dark theme.
3. WHEN a user selects either supported theme through the theme toggle, THE Theme_Provider SHALL apply the selected theme to the active document without requiring a page reload.
4. WHEN a user selects either supported theme through the theme toggle, THE Theme_Provider SHALL store the selected theme as the stored theme preference so that the same theme is reapplied on subsequent loads of the Application.
5. WHEN the active theme changes, THE Design_System SHALL re-resolve all themed surface, text, and accent colors from the CSS-variable token set of the newly active theme.

### Requirement 4: Showcase hub catalog

**User Story:** As a researcher, I want a showcase hub that lists the available demo screens with clear titles and descriptions, so that I can navigate to each research demonstration.

#### Acceptance Criteria

1. THE Showcase_Hub SHALL render one card per Navigation_Manifest showcase entry, in the order the entries are declared in the Navigation_Manifest, where each entry has a title of 1 to 80 characters, a description of 1 to 200 characters, and a link that resolves to a member of EXISTING_ROUTES.
2. THE Showcase_Hub SHALL render each card in the Design_System card style displaying the entry title, the entry description, and a single activatable link to the corresponding screen.
3. WHEN a user activates a card link, THE Showcase_Hub SHALL navigate to the EXISTING_ROUTES route declared for that showcase entry.
4. IF the Navigation_Manifest contains zero showcase entries, THEN THE Showcase_Hub SHALL render an empty-state message indicating that no demonstrations are available and SHALL render no cards.
5. IF a showcase entry has a link that does not resolve to a member of EXISTING_ROUTES, THEN THE Showcase_Hub SHALL omit that entry's card and SHALL render the remaining valid entries.

### Requirement 5: Navigation and call-to-action link integrity

**User Story:** As a researcher, I want every navigation and call-to-action link to lead to a real, working screen, so that I never reach a broken or placeholder destination.

#### Acceptance Criteria

1. THE App_Sidebar, App_TopBar, and Landing surfaces SHALL source every navigation and call-to-action link exclusively from the Navigation_Manifest, and each rendered link href SHALL equal a member of EXISTING_ROUTES.
2. IF a navigation or call-to-action href supplied to the Navigation_Manifest is empty, equal to `#`, or an anchor-only placeholder beginning with `#`, THEN THE Navigation_Manifest SHALL fail validation for that href, surface an error identifying the offending href, and not render the link.
3. THE Landing surface SHALL present exactly one primary call-to-action and exactly one secondary call-to-action, where the secondary call-to-action resolves to a different member of EXISTING_ROUTES than the primary call-to-action.
4. IF a navigation or call-to-action target supplied to the Navigation_Manifest does not equal a member of EXISTING_ROUTES, THEN THE Navigation_Manifest SHALL fail validation for that target, surface an error identifying the offending target, and not render the link.

### Requirement 6: Non-goal reachability guardrails

**User Story:** As the product owner, I want the redesigned shell to expose only the approved research destinations and no gamification or consumer-product features, so that the workbench stays aligned with the revival direction.

#### Acceptance Criteria

1. THE Application SHALL expose zero reachable navigation paths to non-goal features, such that no rendered App_Sidebar entry, App_TopBar link, or call-to-action across any in-scope route has a target value matching a member of EXCLUDED_PATTERNS (prediction markets, betting/wager, DebatePoints, superforecaster badges, social/share, follow, leaderboard, virality).
2. IF a navigation or call-to-action target value supplied to the Navigation_Manifest matches a member of EXCLUDED_PATTERNS, THEN THE Navigation_Manifest SHALL reject that target by excluding it from the rendered navigation output and surfacing a validation error identifying the rejected target, without rendering the excluded entry.
3. IF an incoming request targets a route matching a member of EXCLUDED_PATTERNS, THEN THE Route_Guard SHALL redirect the request to a single designated default allowed surface that is a member of EXISTING_ROUTES, such that the responded surface contains no excluded content.
4. THE App_Sidebar SHALL render exactly one entry per approved research destination, totaling exactly six entries, where each entry corresponds to a distinct member of the Navigation_Manifest allow-list and each entry href resolves to a member of EXISTING_ROUTES, with no duplicate and no additional entries.

### Requirement 7: Honest-framing labels and presentation-only scope

**User Story:** As a researcher evaluating models, I want illustrative data and model-derived judgments to be clearly labeled, so that I do not mistake demo data or judge output for ground truth.

#### Acceptance Criteria

1. WHILE a surface displaying illustrative or demo data is visible, THE Application SHALL display a "sample / demo data" badge on that surface that remains visible without requiring user interaction (no hover, click, scroll, or expansion).
2. WHILE a surface displaying judge output is visible, THE Application SHALL display a "model-based signal · not ground truth" badge on that surface that remains visible without requiring user interaction (no hover, click, scroll, or expansion).
3. WHILE a single surface displays both illustrative or demo data and judge output, THE Application SHALL display both the "sample / demo data" badge and the "model-based signal · not ground truth" badge on that surface.
4. THE Application SHALL implement the redesign as presentation-only, producing no observable change in behavior or output of debate execution, agent logic, LLM provider logic, debate API routes, export logic, or the database schema.

### Requirement 8: Image accessibility

**User Story:** As a researcher using assistive technology, I want images to be correctly described or hidden, so that screen readers convey meaningful content and skip decoration.

#### Acceptance Criteria

1. WHERE an image conveys information that is not already provided by adjacent text, THE Application SHALL render it with alternative text of 1 to 250 characters that describes the image's content or, where the image is a link or control, its destination or action.
2. WHERE an image is decorative or its information is already conveyed by adjacent text, THE Application SHALL render it with empty alternative text and SHALL exclude it from the accessibility tree.
3. THE Application SHALL render every image with an explicit alternative-text attribute and SHALL classify each image as either informational or decorative.
4. IF an informational image's alternative-text source is unavailable at render time, THEN THE Application SHALL render fallback alternative text of 1 to 250 characters identifying the image's purpose and SHALL NOT render the image with empty alternative text.

### Requirement 9: Accessibility of contrast, structure, and interaction

**User Story:** As a researcher using assistive technology or a keyboard, I want the interface to meet accessibility standards in both themes, so that I can perceive and operate every screen.

#### Acceptance Criteria

1. FOR ALL documented foreground, background, and role token pairs in both the dark and light themes, THE Design_System SHALL provide a contrast ratio of at least 4.5:1 for normal text and at least 3:1 for large text (text of at least 24 pixels, or at least 18.66 pixels when bold).
2. THE Application SHALL render exactly one `h1` element per in-scope route and SHALL order heading levels without skipping a level.
3. THE Application SHALL make every navigation link, the sidebar mobile-disclosure control, the theme toggle, and the primary action reachable via Tab and activatable via Enter or Space, with a visible cyan focus ring and a minimum target size of 44 by 44 pixels.
4. WHERE a surface conveys severity, THE Application SHALL convey it through a status dot and a numeric value and a text label, and SHALL NOT convey severity through color alone.
5. FOR ALL focus rings and status dots, THE Design_System SHALL provide a non-text contrast ratio of at least 3:1 against adjacent colors.
6. WHEN a user navigates with the keyboard, THE Application SHALL move focus in reading order and SHALL NOT trap focus within any component.

### Requirement 10: Responsive layout

**User Story:** As a researcher on varied screen sizes, I want the layout to adapt cleanly, so that I can use the workbench on small and large viewports without horizontal scrolling.

#### Acceptance Criteria

1. WHILE the viewport width is below 1024 pixels, THE App_Shell SHALL hide the App_Sidebar off-canvas, render a sidebar-disclosure toggle in the App_TopBar, and render the main column at full width.
2. WHILE the viewport width is at or above 1024 pixels, THE App_Shell SHALL render the App_Sidebar as a persistent column and SHALL NOT render the sidebar-disclosure toggle.
3. FOR ALL viewport widths of 375, 768, and 1440 pixels, THE Application SHALL render without horizontal page scrolling.
4. WHILE the viewport width is below 1024 pixels, WHERE a data table's content width exceeds the main content column width, THE Application SHALL render that table inside a horizontally scrollable wrapper such that only the table scrolls and the page does not.
5. WHEN a user activates the sidebar-disclosure toggle while the App_Sidebar is hidden, THE App_Shell SHALL open the App_Sidebar drawer and move focus into the drawer.
6. WHEN a user dismisses the open App_Sidebar drawer, THE App_Shell SHALL close the drawer and return focus to the sidebar-disclosure toggle.

### Requirement 11: Performance and layout stability

**User Story:** As a researcher, I want screens to load quickly and stay stable, so that data appears fast without content jumping around.

#### Acceptance Criteria

1. WHEN an in-scope route loads, THE Application SHALL render its above-the-fold content from server-rendered HTML and SHALL render the largest contentful element within 2.5 seconds without gating it behind an animated reveal.
2. THE Ambient_Glow SHALL render as a fixed, out-of-flow, pointer-events-none layer that contributes a cumulative layout shift of 0.
3. WHEN an in-scope route loads, THE Application SHALL produce a page-level cumulative layout shift of at most 0.1 over the load window.
4. THE Application SHALL render the brand logo through an optimized image element with explicit width and height that reserve its layout box before the image loads.
5. WHERE a surface defers content behind a loading placeholder, THE Application SHALL reserve the placeholder's layout box so that the resolved content causes no layout shift.
6. THE Application SHALL render the global background decoration as a static layer with no per-frame animation loop and no per-frame repaint after initial paint.

### Requirement 12: Reduced-motion safety

**User Story:** As a researcher sensitive to motion, I want animations disabled when I request reduced motion, so that I can use the workbench comfortably without losing content.

#### Acceptance Criteria

1. WHILE the user agent reports `prefers-reduced-motion: reduce`, THE Design_System SHALL suppress element transitions and animations such that no position, scale, or opacity change is perceptible to the viewer.
2. WHILE the user agent reports `prefers-reduced-motion: reduce`, THE Design_System SHALL render every content element that would otherwise animate into view directly in its final visible and interactive state, with no content hidden or deferred pending an animation.
3. WHILE the user agent reports `prefers-reduced-motion: reduce`, THE Design_System SHALL stop all continuously looping and auto-playing decorative animations.

### Requirement 13: Canonical eval-report screen and data-presentation primitives

**User Story:** As a researcher comparing models, I want the eval-report screen to present the approved benchmark scorecard layout, so that win rates, factuality, and charismatic-liar signals are legible and consistent with the reference.

#### Acceptance Criteria

1. THE Eval_Report_Screen SHALL render the benchmark scorecard composed of a KPI stat row, a model-comparison scorecard table that renders its numeric cells in the Geist Mono tabular-numeral font, CSS comparison bars, and a code/API card.
2. WHERE the Eval_Report_Screen renders a charismatic-liar count, THE Design_System SHALL map a count of 0 to the low severity style (cyan→violet gradient), a count of 1 to 2 to the elevated severity style (amber), and a count of 3 or more to the high severity style (rose).
3. WHERE the Eval_Report_Screen renders a CSS comparison bar, THE Design_System SHALL render its fill width between 0 and 100 percent, proportional to the bar's value relative to the maximum value in its row.
4. THE Eval_Report_Screen SHALL render a "sample / demo data" badge on the KPI stat row and the scorecard table.
