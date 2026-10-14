# Dario Hoyte website refresh

## Files
- `index.html`: redesigned home page with feature cards, skills, credentials and preserved testimonial text.
- `resume.html`: redesigned résumé page, with summary, career history, education and skills extracted from the supplied page.
- `contact.html`: redesigned contact page, including original email, LinkedIn and QR contact card.
- `assets/css/site.css`: shared visual design.
- `assets/js/site.js`: minimal vanilla JavaScript.
- `*.original.html`: unchanged source copies for comparison.

## IMPORTANT: missing original assets
The uploaded files contained only HTML, not the original `assets/images` and `assets/docs` directories. Copy those directories from the existing website into this package. Credential images, QR code, favicon and résumé PDF depend on those files.

## Dependencies
Bootstrap 5.3.3, Font Awesome 6.7.2 and Google Fonts are loaded via CDN. Pin/update to newer audited releases as appropriate. No jQuery, old Popper, or PHP is needed.

## Differences
Home: replaces Bootstrap 4 jumbotron/thumbnail/cards and jQuery carousel with modern responsive cards, native Bootstrap 5 carousel, new hero, and shared design tokens.
Résumé: replaces fixed-size paper widgets with responsive reading layout; retains source section content as text. Check formatting/content carefully against originals before publishing.
Contact: replaces simulated phone UI and Bootstrap 4 modal with responsive contact links and directly displayed QR card.
All: updated navigation and footer, semantic landmarks, responsive typography, keyboard focus, reduced motion, accessible link labels, modern icons.

## Deployment
Upload these HTML/CSS/JS files alongside the original `assets/images` and `assets/docs` directories. Test every page, asset path, external verification link, and the résumé PDF before replacing the live website.


Accessibility-only update: visible keyboard focus, screen-reader labels and status announcements for Brain Bites/copy, and reduced-motion preferences. No Previous button, Save Contact feedback, or mobile redesign.

## Brain Bites: no-repeat shuffle and completion
Every Brain Bite appears once per shuffled round. After the final bite, the next tap displays: "You've officially had your fill of my Brain Bites. For now. 😏" and "Same bites. Fresh order. Still worth another taste." The button becomes "Run it back", reshuffling while preventing the final bite from immediately repeating. No numerical counter is shown. Existing accessibility support, copy button, and category icons are preserved.

Latest refinement: vibrant turquoise (#18B8AD) Another bite / Run it back button; outlined circle-check icon and ALL CAUGHT UP heading on completion screen.

Latest refinement: moved the old footer tagline to a centered, larger “Small bites. Big brain energy.” beneath the unchanged right-aligned Brain Bites heading.

New: Contact phone A LITTLE EXTRA section includes Brain Bites and The Decision Maker. Brain Bites shows a local-date weekday greeting on the first opening each day, then the original no-repeat deck.

Decision Maker preview: six-segment spinning wheel, accessible verdict announcements and reduced-motion support.

Final polish: history digit spacing +5px; New Code button 178px x 40px; focus enters game container instead of Back button so Enter does not highlight Back.

Latest changes: Tic-Tac-Toe fixed square grid and randomized per-match difficulty (40% easy, 40% medium, 20% hard); clean XO launcher and turquoise in-app XO; turquoise Memory Matrix in-app grid with blue launcher preserved. Other apps unchanged.
