# Requirements Document

## Introduction

The AI Debate Arena ("LLMargument") is a lean LLM debate benchmarking and alignment-research workbench. Its public-facing surfaces — the landing page (`app/page.tsx`), the showcase hub (`app/showcase/page.tsx`), and the showcase demo pages (`live-debate`, `eval-report`, `regression-gate`, `steelman`, `synthetic-data`) — are being elevated into a cohesive, professional, pitch-deck-style presentation layer used to demo, sell, and fund the venture (including its non-profit arm).

A prior aesthetic pass on the landing page produced a result the owner judged tacky and poorly laid out. This feature redesigns the public showcase surfaces into a restrained, elegant, credible presentation that incorporates a subtle neon 3D aesthetic (derived from the existing brand logo and infographic) without becoming garish. It establishes a single design system (color/glow tokens, typography scale, spacing scale, motion rules), improves layout and visual hierarchy, ensures responsiveness and accessibility, and ties the existing showcase subpages together into one consistent experience.

This feature covers presentation only. It MUST keep the honest research-tool framing and link to real research workflows. It MUST NOT introduce gamification, prediction-market, betting, social-sharing, or virality features, per the project roadmap and non-goals.

## Glossary

- **Showcase_Experience**: The combined public-facing presentation layer consisting of the Landing_Page, the Showcase_Hub, and all Showcase_Demo_Pages, treated as one cohesive surface.
- **Landing_Page**: The home route rendered by `app/page.tsx`.
- **Showcase_Hub**: The index route rendered by `app/showcase/page.tsx`.
- **Showcase_Demo_Page**: Any of the demo subpages under `app/showcase/` (`live-debate`, `eval-report`, `regression-gate`, `steelman`, `synthetic-data`).
- **Design_System**: The centralized, single source of truth for visual tokens (color, glow, typography, spacing, radius, elevation, motion) and reusable styling primitives applied across the Showcase_Experience.
- **Neon_3D_Aesthetic**: The restrained visual style derived from the brand logo and infographic, characterized by soft glows, layered depth, muted gradient backdrops, and subtle reflections.
- **Navigation_Shell**: The persistent top navigation component (`components/layout/Navigation.tsx`) shown across routes.
- **Theme_Mode**: The active visual theme (light or dark) selectable via the existing theme toggle.
- **Visitor**: A person viewing the Showcase_Experience, such as a prospective customer, funder, collaborator, or researcher.
- **Research_Workflow_Entry**: An interactive link or call-to-action that navigates to a real product workflow (for example `/debate/new`, a debate transcript, or a dataset export route).
- **Reduced_Motion_Preference**: The browser/OS `prefers-reduced-motion: reduce` setting.
- **Decorative_Animation**: Any non-essential animated visual element (glow pulse, float, shimmer, particle motion, looping simulator) that conveys style rather than required information.
- **Contrast_Ratio**: The WCAG 2.1 luminance contrast ratio between foreground text and its background.

## Requirements

### Requirement 1: Centralized design system

**User Story:** As the product owner, I want a single design system driving all public surfaces, so that the showcase looks cohesive and professional instead of fragmented and ad hoc.

#### Acceptance Criteria

1. THE Design_System SHALL define named tokens within a single source-of-truth module for all seven token categories — color, glow, typography scale, spacing scale, corner radius, elevation, and motion — where each category resolves to at least one named token and no category is defined in more than one location.
2. WHEN the Landing_Page is styled, THE Landing_Page SHALL apply visual styling exclusively through Design_System named tokens and reusable primitives, with zero literal color values, raw spacing values, or raw motion-duration values declared outside the Design_System.
3. WHEN the Showcase_Hub is styled, THE Showcase_Hub SHALL apply visual styling exclusively through Design_System named tokens and reusable primitives, with zero literal color values, raw spacing values, or raw motion-duration values declared outside the Design_System.
4. WHEN a Showcase_Demo_Page is styled, THE Showcase_Demo_Page SHALL apply visual styling exclusively through Design_System named tokens and reusable primitives, with zero literal color values, raw spacing values, or raw motion-duration values declared outside the Design_System.
5. THE Design_System SHALL define at most one primary accent color token and at most three supporting accent color tokens.
6. IF an accent color is applied within the Showcase_Experience, THEN THE applied accent SHALL be one of the defined Design_System accent tokens and SHALL NOT be any other color value.
7. WHERE the utility primitives `glass-panel`, `glow-blob`, and `shimmer-text` are reused, THE Design_System SHALL define each primitive exactly once, and every surface that reuses a primitive SHALL reference that single definition rather than redefining it per page.

### Requirement 2: Subtle neon 3D aesthetic

**User Story:** As the product owner, I want the brand's subtle neon 3D look incorporated tastefully, so that the site has a polished wow factor without looking flashy or tacky.

#### Acceptance Criteria

1. WHEN any showcase viewport is displayed, THE Showcase_Experience SHALL apply the Neon_3D_Aesthetic using gradient backdrops, glow effects, and layered depth derived from the brand logo and infographic, where glow and gradient elements occupy at most 40% of the visible viewport area.
2. WHEN any showcase viewport is displayed, THE Showcase_Experience SHALL render the brand logo as a persistently visible visual anchor.
3. WHEN the primary showcase viewport is displayed, THE Showcase_Experience SHALL render the infographic asset as a visible visual anchor.
4. WHILE any single viewport is displayed, THE Showcase_Experience SHALL limit concurrently running Decorative_Animation elements to at most three.
5. THE Showcase_Experience SHALL restrict glow and neon styling to accent and emphasis roles and SHALL NOT apply glow or neon styling to body text.
6. IF a styling choice would reduce text Contrast_Ratio below 4.5:1, THEN THE Showcase_Experience SHALL apply an alternative styling whose text Contrast_Ratio is greater than or equal to 4.5:1.
7. WHERE the viewer's system requests reduced motion, THE Showcase_Experience SHALL suppress all Decorative_Animation elements while keeping the brand logo and infographic anchors visible.

### Requirement 3: Pitch-deck landing presentation and hierarchy

**User Story:** As a Visitor evaluating the platform, I want the landing page to communicate value with clear structure, so that I quickly understand what the platform does and trust its credibility.

#### Acceptance Criteria

1. WHEN the Landing_Page is rendered at a viewport of 1280 by 720 pixels, THE Landing_Page SHALL present a hero section whose value-proposition headline, supporting description, and primary call-to-action are all visible without scrolling.
2. THE Landing_Page SHALL organize content into at least four distinct sections in a fixed order, each section containing exactly one section heading.
3. THE Landing_Page SHALL define exactly one primary call-to-action.
4. THE Landing_Page SHALL render every secondary call-to-action such that no secondary call-to-action reuses the primary call-to-action's fill, size, or weight emphasis style.
5. THE Landing_Page SHALL apply only spacing values defined in the Design_System spacing scale between every adjacent pair of sections.
6. THE Landing_Page SHALL describe the platform as an LLM debate benchmarking and alignment-research workbench and SHALL NOT use prediction-market, betting, points, badge, or social-sharing language.

### Requirement 4: Cohesive showcase navigation and shell

**User Story:** As a Visitor, I want the showcase pages to feel like one connected experience, so that I can move between demos without disorientation.

#### Acceptance Criteria

1. WHEN the Showcase_Hub loads, THE Showcase_Hub SHALL present every available Showcase_Demo_Page as a navigable entry, each displaying a title of 1 to 80 characters and a description of 1 to 200 characters.
2. WHILE a Showcase_Demo_Page is displayed, THE Showcase_Demo_Page SHALL display a visible return link that targets the Showcase_Hub.
3. THE Showcase_Hub and every Showcase_Demo_Page SHALL render through the same shared page shell, applying identical Design_System background, spacing, and heading-treatment tokens across all pages.
4. THE Showcase_Demo_Page SHALL NOT define a page background that overrides or conflicts with the shared Design_System background.
5. WHEN a Visitor selects a Showcase_Demo_Page entry from the Showcase_Hub, THE Showcase_Experience SHALL navigate to the corresponding Showcase_Demo_Page within 1 second.
6. WHEN a Visitor selects the return link on a Showcase_Demo_Page, THE Showcase_Experience SHALL navigate to the Showcase_Hub within 1 second.
7. IF navigation to the selected Showcase_Demo_Page fails, THEN THE Showcase_Experience SHALL remain on the Showcase_Hub and display an error indication that the selected demo could not be opened.

### Requirement 5: Functional links to real research workflows

**User Story:** As a Visitor, I want the showcase calls-to-action to lead to the real product, so that the demo is functional rather than a static mockup.

#### Acceptance Criteria

1. WHEN a Visitor activates the Landing_Page primary call-to-action, THE Showcase_Experience SHALL navigate to a functional Research_Workflow_Entry that renders its destination content without a not-found or placeholder state within 3 seconds.
2. WHEN a Visitor activates any navigational call-to-action within the Showcase_Experience, THE Showcase_Experience SHALL navigate to an existing route that renders its destination content without a not-found or placeholder state within 3 seconds.
3. THE Showcase_Experience SHALL route every interactive call-to-action to a destination that resolves to an existing application route, with no target that is an anchor-only ("#") link, a disabled link, or a non-routable placeholder.
4. WHERE a section presents illustrative sample data, THE Showcase_Experience SHALL display, within that same section, a visible textual label identifying the data as sample or demo data.
5. IF a Visitor activates a call-to-action whose destination route cannot be resolved or fails to load, THEN THE Showcase_Experience SHALL display a visible error indication and SHALL keep the Visitor on the current page rather than rendering a blank or broken view.

### Requirement 6: Honest framing and non-goal exclusion

**User Story:** As the product owner, I want the showcase to stay honest about what the platform is, so that it remains credible and aligned with the research mission.

#### Acceptance Criteria

1. WHEN any view presents judge output (scores, winner, or reasoning), THE Showcase_Experience SHALL display, adjacent to that output, a visible label identifying it as a model-based signal and not ground truth.
2. THE Showcase_Experience SHALL exclude prediction-market, betting, DebatePoints, superforecaster-badge, and personal-wagering content from all rendered views, such that none of these features is reachable through any navigation control, link, or route exposed by the Showcase_Experience.
3. THE Showcase_Experience SHALL exclude public social-sharing and virality mechanics from all rendered views, such that no share-to-social, follow, or engagement-amplification control is reachable through any navigation control, link, or route exposed by the Showcase_Experience.
4. THE Navigation_Shell SHALL expose only the following destinations: create benchmark run, inspect debate transcript, review fact-checks and judge output, compare models within a benchmark run, export datasets, and system health.
5. IF a user requests a route corresponding to excluded content defined in criteria 2 and 3, THEN THE Showcase_Experience SHALL NOT render that content and SHALL return the user to an exposed destination listed in criterion 4.

### Requirement 7: Responsive layout

**User Story:** As a Visitor on any device, I want the showcase to render cleanly at my screen size, so that the presentation looks professional on mobile, tablet, and desktop.

#### Acceptance Criteria

1. WHILE displayed at a viewport width of 375 pixels, THE Showcase_Experience SHALL render all content with no horizontal scrollbar and with no element extending beyond the 375-pixel viewport width.
2. WHILE displayed at a viewport width of 768 pixels, THE Showcase_Experience SHALL render all content with no horizontal scrollbar and with no element extending beyond the 768-pixel viewport width.
3. WHILE displayed at a viewport width of 1440 pixels, THE Showcase_Experience SHALL render all content with no horizontal scrollbar and with no element extending beyond the 1440-pixel viewport width.
4. WHILE displayed at a viewport width of 375 pixels, THE Showcase_Experience SHALL present primary calls-to-action either spanning the full available content width or arranged as a single vertical column, with no two primary calls-to-action sharing the same horizontal row.
5. WHILE displayed at any viewport width from 375 to 1440 pixels, THE Showcase_Experience SHALL render all text and interactive elements without visual overlap and without clipping of their content.
6. THE Showcase_Experience SHALL maintain a minimum interactive target size of 44 by 44 CSS pixels for all primary calls-to-action and navigation controls at every viewport width from 375 to 1440 pixels.
7. IF a content element (such as an image, table, or code block) has an intrinsic width greater than the available content width, THEN THE Showcase_Experience SHALL constrain that element to the content width and confine any overflow to scrolling within the element's own container rather than expanding the page width.

### Requirement 8: Accessibility

**User Story:** As a Visitor using assistive technology or a keyboard, I want the showcase to be accessible, so that the platform reads as professionally built and inclusive.

#### Acceptance Criteria

1. THE Showcase_Experience SHALL provide a text alternative of 1 to 250 characters for every informational image, including the infographic.
2. WHERE an image is decorative, THE Showcase_Experience SHALL expose an empty text alternative for that image.
3. THE Showcase_Experience SHALL maintain a Contrast_Ratio of at least 4.5:1 for body text and at least 3:1 for large text — defined as text of at least 18 points or at least 14 points bold — measured against the text's immediate background.
4. THE Showcase_Experience SHALL expose every interactive control to keyboard-only activation without a pointing device, presenting a visible focus indicator with a Contrast_Ratio of at least 3:1 against its background.
5. THE Showcase_Experience SHALL structure each page with exactly one top-level heading and SHALL order subheadings hierarchically without skipping heading levels.
6. WHEN a Visitor navigates interactive controls using the keyboard, THE Showcase_Experience SHALL move focus in document reading order.
7. IF keyboard focus reaches any interactive control, THEN THE Showcase_Experience SHALL allow focus to be moved away from that control using the keyboard alone, with no keyboard focus trap.

### Requirement 9: Motion discipline and reduced-motion support

**User Story:** As a Visitor sensitive to motion, I want animations to be restrained and respectful of my preferences, so that the experience feels elegant rather than distracting.

#### Acceptance Criteria

1. WHILE the Reduced_Motion_Preference is set to reduce, THE Showcase_Experience SHALL disable positional, scaling, and rotational motion and SHALL permit only opacity transitions of at most 200 milliseconds.
2. THE Showcase_Experience SHALL keep primary text and interactive controls readable and operable regardless of the state of any Decorative_Animation.
3. WHERE an auto-advancing simulated sequence is presented, THE Showcase_Experience SHALL display a persistently visible control to pause the sequence.
4. WHEN a Visitor activates the pause control, THE Showcase_Experience SHALL stop the auto-advancing sequence within 100 milliseconds and display a visible paused-state indication.
5. WHEN a Visitor activates the resume control after pausing, THE Showcase_Experience SHALL resume the auto-advancing sequence.
6. THE Showcase_Experience SHALL constrain entrance animation duration for any element to at most 600 milliseconds.
7. WHILE the Reduced_Motion_Preference is set to reduce, THE Showcase_Experience SHALL stop any auto-advancing sequence and SHALL require explicit user action to advance it.

### Requirement 10: Theme consistency

**User Story:** As a Visitor, I want the showcase to render legibly in the active theme, so that the presentation never appears broken when the theme changes.

#### Acceptance Criteria

1. WHERE a Theme_Mode is active, THE Showcase_Experience SHALL render normal body text at a Contrast_Ratio of at least 4.5:1 and large text and meaningful non-text user-interface elements at a Contrast_Ratio of at least 3:1 against their background.
2. WHERE a Theme_Mode is active, THE Showcase_Experience SHALL derive surface, text, and accent colors from Design_System tokens scoped to that Theme_Mode, with no hard-coded color values outside those scoped tokens.
3. WHEN the Theme_Mode changes, THE Showcase_Experience SHALL update the surface, text, and accent colors of all Showcase_Experience surfaces to the selected Theme_Mode within 300 milliseconds, leaving no surface styled for the previous Theme_Mode.
4. IF a Design_System token cannot be resolved for the active Theme_Mode, THEN THE Showcase_Experience SHALL apply the default Theme_Mode token value so that no surface is left unstyled or transparent, while preserving all other content.

### Requirement 11: Presentation performance

**User Story:** As a Visitor, I want the showcase to load quickly and stay responsive, so that the polished look does not come at the cost of a sluggish first impression.

#### Acceptance Criteria

1. WHEN the Landing_Page is navigated to on a desktop viewport of at least 1280 pixels wide under a standard broadband network profile, THE Landing_Page SHALL render its hero content within 2.5 seconds of navigation start.
2. THE Showcase_Experience SHALL serve the infographic and brand imagery in an optimized image format scaled to within a 1.0 to 1.5 ratio of each image's rendered display dimensions.
3. WHILE Decorative_Animation is running, THE Showcase_Experience SHALL keep the cumulative layout shift of surrounding content at 0, producing no positional displacement of adjacent elements.
4. IF hero or showcase content has not finished loading within 1 second of navigation start, THEN THE Showcase_Experience SHALL display placeholder content for the pending sections and progressively replace each placeholder as its content becomes available.
5. IF an image fetch fails, THEN THE Showcase_Experience SHALL display a text alternative in place of the image and SHALL NOT render a broken-image state.
