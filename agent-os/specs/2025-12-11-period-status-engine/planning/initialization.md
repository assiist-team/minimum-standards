# Spec Initialization: Period + status engine

## Raw Idea (verbatim)
Implement a shared “period calculator” that computes daily/weekly (Monday-start)/monthly windows and labels in the device timezone and derives status (Met / In Progress / Missed) from period totals, with unit tests for boundary cases (end-of-period, timezone changes).
