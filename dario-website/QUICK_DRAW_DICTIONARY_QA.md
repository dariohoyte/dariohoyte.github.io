# Quick Draw dictionary and regression QA

The embedded offline dictionary combines the previous approved vocabulary with cross-checked entries present in TextBlob English lexicon, CMU pronunciation dictionary, and TextBlob spelling corpus (at least two occurrences). A curated everyday-word safety list restores familiar terms missing from frequency-filtered corpora. Explicit exclusions remove known unwanted entries. This is a heuristic familiarity filter, not a definitive lexical authority; borderline entries require editorial review.

Run the automated suite from the website directory using `node tests/quick-draw-regression.cjs`. It verifies known accepted/rejected words, all allowed lengths, adjacency/diagonal/turn/no-reuse rules, and validates the actual source code's Quick Draw dictionary and enumeration function.

Board generation remains stochastic, and this suite does not guarantee every board succeeds. The 20–30 target and all gameplay logic remain unchanged.
