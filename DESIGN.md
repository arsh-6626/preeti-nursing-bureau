---
name: Preeti Nursing Bureau
description: Calm, trust-first home-care arranging for families in Delhi NCR, run by people who call you back.
colors:
  paper: "#ffffff"
  mist: "#f3f7f7"
  mist-2: "#e8f0ef"
  line: "#d9e3e2"
  line-strong: "#b9cbca"
  navy-950: "#0f2237"
  navy-900: "#142b44"
  navy-800: "#1e3a57"
  ink: "#24384c"
  muted: "#52657a"
  teal-50: "#eaf4f2"
  teal-100: "#d3e8e4"
  teal-600: "#2c6e6a"
  teal-700: "#235a57"
  teal-800: "#1b4744"
  leaf-50: "#e9f4ec"
  leaf-600: "#3c7a4c"
  leaf-700: "#2f6340"
  amber-50: "#fbf3e2"
  amber-700: "#855600"
  rose-50: "#fbeceb"
  rose-700: "#a3271f"
typography:
  display:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.6rem"
    fontWeight: 700
    lineHeight: 1.12
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.556
  body-lead:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.625
  body:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.43
    letterSpacing: "normal"
  numeral:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "3rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.025em"
    fontFeature: "tnum"
rounded:
  control: "10px"
  panel: "14px"
  full: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "20px"
  lg: "24px"
  xl: "40px"
  section: "64px"
  section-lg: "80px"
components:
  button-primary:
    backgroundColor: "{colors.teal-600}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.teal-700}"
  button-primary-lg:
    backgroundColor: "{colors.teal-600}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "0 24px"
    height: "52px"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.navy-900}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "44px"
  button-secondary-hover:
    textColor: "{colors.teal-700}"
  button-ghost:
    textColor: "{colors.teal-700}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "44px"
  button-ghost-hover:
    backgroundColor: "{colors.teal-50}"
  button-danger:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.rose-700}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "36px"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.navy-950}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "44px"
  panel:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.panel}"
    padding: "16px 20px"
  shift-face:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.navy-900}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
  shift-face-selected:
    backgroundColor: "{colors.teal-50}"
  badge:
    backgroundColor: "{colors.mist}"
    textColor: "{colors.muted}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  badge-confirmed:
    backgroundColor: "{colors.leaf-50}"
    textColor: "{colors.leaf-700}"
    rounded: "{rounded.full}"
    padding: "2px 10px"
  nav-item-admin-active:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.navy-900}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
---

# Design System: Preeti Nursing Bureau

## Overview

**Creative North Star: "The Calm Front Desk"**

This is the category standard for home care, executed with more care than the category usually gets. A worried family should meet a quiet, well-ordered front desk: white ground, cool neutral fields, navy words, and one muted teal that marks everything you can act on. Nothing performs. There are no stock nurse photographs, no icon-tile card rows, and no invented trust numbers. Trust comes from plain language, a working request form in the first viewport, and visible honesty about what is and is not promised.

Density is generous on the public site and compact on the admin. Both share the same tokens. The public site is a Persuade surface built from wide bands (white, then mist, then white) inside a 72rem column. The admin is an Operate surface: a mist sidebar, white panels, tabular figures, and status badges. Depth is almost entirely hairlines and tonal fields. Shadow appears only where something is lifted to be acted on: the request starter, the request wizard, a dialog.

The world is light only, pinned by the brief (white and neutral grounds, `color-scheme: light`). Figtree is the single family. Hierarchy comes from weight, size, and navy against ink, never from a second face.

**Key Characteristics:**
- White and cool mist grounds, navy headings, ink body, muted teal for action, selection, and progress
- Subtle green reserved for confirmed or positive state
- One sans family (Figtree) with tabular numerals for references, dates, rupees, and shift lengths
- Hairline borders, 14px panels, 10px controls, and pill-shaped badges and chips
- Soft navy-tinted shadow only on lifted, actionable surfaces
- 12 and 24 hours presented as identical, side-by-side equals wherever shift appears

## Colors

The palette is cool and quiet: navy and slate inks on white and blue-green mist, with one muted teal doing the work of action.

### Primary
- **Bureau Teal** (teal-600): every primary button fill, the selected radio dot, checkbox accents, the caret, the focus outline, wizard progress, step numerals, and the brand monogram tile.
- **Deep Teal** (teal-700): primary hover, ghost and link text, nav hover and current-page text, the large 12 and 24 shift numerals, and the closing call-to-action band.
- **Darkest Teal** (teal-800): text on teal tints (info notices, teal badges) and the label on the white button inside the teal band.
- **Teal Tint** (teal-50) and **Teal Wash** (teal-100): selected shift faces and checkbox tiles, ghost hover, info notices, text selection, and chart tooltip cursor.

### Secondary
- **Harbour Navy** (navy-900): every heading, field label, panel title, and the single dark feature panel (nursing services). **Night Navy** (navy-950) is the value color inside inputs and the dialog backdrop at 40%. **Slate Navy** (navy-800) is the second chart series and the input hover border at 40%.

### Tertiary
- **Leaf** (leaf-600, leaf-700, leaf-50): confirmed or positive state only. Used for success notices, confirmed/verified/available badges, and the filled check in "what we tell you about every caregiver".

### Neutral
- **Paper** (paper): page ground, panels, inputs, secondary buttons.
- **Mist** (mist): alternating section bands, page intros, footer, admin sidebar, table headers, empty states. **Mist 2** (mist-2) marks unreached wizard steps.
- **Hairline** (line): panel borders, dividers, and the 1px gaps inside the services grid. **Hairline Strong** (line-strong): input and secondary-button borders, pill chips, step connectors, scrollbars.
- **Ink** (ink): body copy. **Muted Slate** (muted): secondary copy, hints, table headers, inactive icons.
- **Amber** (amber-50, amber-700) and **Rose** (rose-50, rose-700): warning and error/cancelled states, required-field asterisks, danger buttons. They are status colors, not decoration.

### Named Rules
**The Teal Means Act Rule.** Teal marks what can be acted on, what is selected, and where you are in a sequence, plus the small wayfinding marks that travel with them (step and shift numerals, the area pin, the monogram tile, info tints). The only large teal field is the closing call-to-action band.

**The Earned Green Rule.** Leaf green appears only for confirmed or positive state: a verified caregiver, a confirmed assignment, a saved form, a completed check. Never use it for decoration or as a second accent.

**The Light Only Rule.** The system is light theme only (`color-scheme: light`, theme-color white). No dark-mode variants are designed or implied.

## Typography

**Display Font:** Figtree (with ui-sans-serif, system-ui, sans-serif)
**Body Font:** Figtree
**Label/Mono Font:** Figtree with tabular numerals (`font-variant-numeric: tabular-nums`) for figures

**Character:** One rounded, open humanist-geometric sans that reads warm at large bold sizes and plain at 14 to 18px. Weight carries the hierarchy: bold headings, semibold labels and titles, regular body.

### Hierarchy
- **Display** (700, 2rem on phones and 2.6rem from sm, line-height 1.12, tight tracking): the hero headline only, in navy-900. The headline is owner-editable copy. It sets on two lines at 1280 and 1440 desktop widths and on three lines at 390px phones by design. Do not shorten copy to force two lines on mobile.
- **Headline** (700, 1.875rem, tight tracking): public section headings. Page intros step to 2.25rem from sm. Admin page titles use 600 at 1.5rem.
- **Title** (600, 1.125rem): sub-section headings, step titles, request panel title. Panel headers in the admin use 600 at 15px.
- **Body lead** (400, 1.125rem, line-height 1.625): section introductions and the hero sentence, capped at 46 to 62ch.
- **Body** (400, 1rem, line-height 1.625): running copy in ink, secondary copy in muted. Long-form legal and about text uses line-height 1.7.
- **Label** (600, 0.875rem, normal tracking, sentence case): field labels, legends, badge text (0.75rem). Hints and errors are 0.75rem.
- **Numeral** (700, tabular, tight tracking): shift lengths (3rem on the shift cards, 1.5rem on the choice faces) and the request reference (1.875 to 2.25rem, the one place tracking widens, to `0.05em`, so a reference can be read aloud over the phone).

### Named Rules
**The One Family Rule.** Figtree is the only typeface. Make contrast through weight and navy against ink, never through a second family.

**The Tabular Figures Rule.** References, dates, rupee amounts, counts, and shift lengths always set in tabular numerals.

**The Sentence Case Rule.** Labels, headings, and buttons are sentence case at normal tracking. There are no uppercase labels and no eyebrow lines above headings.

## Layout

The page is a single 72rem (1152px) column centered with 16px gutters on phones and 24px from sm. Public pages stack full-bleed bands that alternate paper and mist, separated by hairlines, with 64px vertical padding (80px from md). The hero is a two-column grid from lg (1.35fr text, 1fr request panel, 48px gap). Below lg, the request panel follows the text. The hero band carries a gentle vertical wash from mist to paper.

Breakpoints are Tailwind's defaults: sm 640px, md 768px, lg 1024px. Spacing runs on a 4px base. In practice, 8 to 12px separates tight items, 20 to 24px is panel padding, 32 to 40px sits between a heading block and its content, and 64 to 80px separates sections.

On phones (below sm), the header hides its call and "Find a Caregiver" buttons. A fixed bottom action bar carries the primary action instead: a full-width "Find a Caregiver" primary button (52px), plus a square call button when a phone number is configured. It sits on paper at 95% with backdrop blur and a top hairline, and it is suppressed on the request pages themselves. The footer reserves 80px of bottom padding below sm so the bar never covers content. The sticky header is 64px (72px from sm), and `scroll-padding-top` is 88px.

The admin is a 240px sticky mist sidebar beside a fluid content area from lg. Below lg, the sidebar collapses to a top bar with a disclosure menu. Stat groups are joined cells inside one bordered panel (4 across), and charts sit in a two-column panel grid.

**The Request In Reach Rule.** On every public viewport, the real request action is visible without scrolling: the request panel in the desktop hero, the bottom action bar on phones.

## Elevation & Depth

The system is flat and tonal by default. Depth comes from paper on mist and hairline borders. Two soft shadows, tinted with navy (rgb 20 43 68) rather than black, mark surfaces that are lifted to be acted on:

### Shadow Vocabulary
- **Raise** (`box-shadow: 0 1px 2px rgb(20 43 68 / 0.06), 0 8px 24px -8px rgb(20 43 68 / 0.14)`): the request wizard panel, the request status card, the admin sign-in card, and the active admin nav item.
- **Float** (`box-shadow: 0 2px 4px rgb(20 43 68 / 0.05), 0 24px 48px -16px rgb(20 43 68 / 0.22)`): the hero request starter panel and confirmation dialogs.

The direction contract scoped shadow to the request panel only. The build extends the same two tokens to the other lifted, actionable surfaces listed above, and that is the recorded system.

### Named Rules
**The Lifted Means Actionable Rule.** Shadow is never decoration. A surface gets Raise or Float only if it is a form, a dialog, or the current location. Content panels, cards, and tables stay flat with a hairline.

## Shapes

Corners are gently rounded at two sizes: 10px for controls (buttons, inputs, shift faces, checkbox tiles, notices, nav items, and the brand monogram) and 14px for panels (cards, tables, the request panel, the FAQ list, dialogs, the dark nursing panel, the closing band). The contract specified 12px panels. The build ships 14px, and the build is canonical.

Pills (fully rounded) are reserved for small status and set membership: badges, city chips, step-number circles, the nav count, and the progress track. Borders are 1px hairlines everywhere. Grouped items (the services grid, stat cells) share hairlines inside one rounded container instead of floating as separate cards.

## Components

### Buttons
Sure and unshowy: semibold, sentence case, and never more than one teal fill in a group.
- **Shape:** gently rounded (10px). Sizes are 36px (sm, 14px text), 44px (md, 15px text), and 52px (lg, 16px text).
- **Primary:** teal-600 fill, white text, with a 1px navy lip beneath (`0 1px 0 rgb(15 34 55 / 0.08)`). Hover deepens to teal-700. Press nudges down 1px. Transitions run 150ms ease-out.
- **Secondary:** paper with a line-strong border and navy text. Hover shifts the border to teal-600 and the text to teal-700. Call and WhatsApp actions are always secondary, with a 20px Phosphor icon.
- **Ghost / Quiet:** ghost is teal-700 text with a teal-50 hover. Quiet is muted text with a mist hover (used for the header call link).
- **Danger:** paper with a rose border at 30% and rose-700 text. Hover is rose-50. Destructive actions confirm in a dialog.
- **Focus:** a 2px teal-600 outline at a 2px offset, everywhere. Disabled is 55% opacity.
- **On teal:** inside the teal-700 band, the primary action inverts to a white button with teal-800 text.

### Chips
- **Style:** city chips are pills with a line-strong border, navy-900 semibold text, and 10px by 20px padding. They are informational, not interactive.
- **Badges:** pills with a 1px inset ring and tone pairs from the palette (neutral mist/muted, teal, leaf, amber, rose, solid navy for "new"). Text is 12px semibold.

### Cards / Containers
- **Corner Style:** 14px.
- **Background:** paper on paper bands, or mist inside paper bands. One dark navy-900 panel distinguishes nursing (a different qualification) from everyday care.
- **Shadow Strategy:** flat. See The Lifted Means Actionable Rule.
- **Border:** 1px line.
- **Internal Padding:** 20 to 24px. Admin panels use a 16px by 20px header with a hairline under it, then 16px by 20px content.

### Inputs / Fields
- **Style:** paper fill, line-strong 1px border, 10px corners, 44px height, 15px navy-950 text, and a teal caret. Labels sit above in 14px semibold navy. Optional fields say "(optional)" in muted, and required fields carry a rose asterisk.
- **Focus:** the border turns teal-600 with a 2px teal-600 outline at 30%. Hover darkens the border toward navy.
- **Error / Disabled:** a rose-700 border with a 12px rose message below. Disabled fills with mist.

### Navigation
- **Public header:** sticky, paper at 95% with blur and a bottom hairline. A wordmark with a 36px teal monogram tile sits on the left. Links are 15px medium ink, turning teal-700 on hover and for the current page. A quiet call button and a primary "Find a Caregiver" button sit on the right. Below lg, links move into a disclosure panel with full-width large buttons. Below sm, the header CTAs give way to the bottom action bar (see Layout).
- **Admin sidebar:** a mist rail with 14px medium items and 19px Phosphor icons. The active item lifts onto paper with Raise, uses a fill-weight icon in teal-700, and shows a teal count pill when there is pending work.

### Shift Choice (signature)
The two permitted shift lengths appear as identical side-by-side radio faces in a two-column grid, at every width. Each face shows a large tabular numeral in navy with "hours" in muted, a one-line description, and a top-right radio dot. Selected faces get a teal-600 border, a teal-50 fill, and a 5px teal ring dot. These are native radios, so the control works without JavaScript. The same equal pairing repeats as the two shift cards on the homepage (teal-700 3rem numerals).

### Request Progress
A wizard shows "Step n of N" with the step title and a segmented pill track. Completed and current segments are teal-600, and later segments are mist-2. Width changes animate over 300ms.

## Do's and Don'ts

### Do:
- **Do** use teal-600 for the single primary action in any group, and secondary (bordered paper) for call and WhatsApp.
- **Do** show 12 and 24 hours as equal, side-by-side faces whenever shift is chosen or explained.
- **Do** set every reference, date, rupee amount, and count in tabular numerals.
- **Do** keep panels at 14px and controls at 10px, with 1px hairline borders.
- **Do** keep the request action in reach: the hero request panel on desktop, the fixed bottom action bar on phones.
- **Do** let the owner-editable hero headline wrap naturally (two lines at desktop, three at 390px) rather than shortening copy.
- **Do** use Phosphor icons (regular weight, fill weight for active or confirmed) at 16 to 24px, always `aria-hidden` beside a text label.
- **Do** make review captures in Chromium with `--font-render-hinting=none`. Linux hinting produces false letter-gap artifacts in Figtree.

### Don't:
- **Don't** use stock photographs of people presented as bureau staff, icon-tile card rows, or invented ratings, counts, or testimonials.
- **Don't** use leaf green for anything except confirmed or positive state.
- **Don't** add a second typeface, uppercase labels, or eyebrow lines above headings.
- **Don't** put Raise or Float shadows on content cards. Shadow is for forms, dialogs, and current location only.
- **Don't** use heavy gradients. The only gradient is the hero's gentle mist-to-paper wash.
- **Don't** design a dark theme. The system is light only.
