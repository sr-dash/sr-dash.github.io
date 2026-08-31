#!/usr/bin/env python3
"""Merge a Google Scholar BibTeX export into the bibliography.

Scholar indexes things ADS does not — preprints, theses, book chapters, and
work published outside the astronomy journals ADS covers — so it often lists
more records. There is no API for it: Scholar has no public interface, its
terms prohibit scraping, and it blocks automated clients. What it does support
is exporting your own profile by hand, which is what this script consumes.

To use it:

  1. open your profile at https://scholar.google.com/citations?user=...
  2. tick the box in the table header to select all articles
     (do this per page if you have more than one)
  3. Export -> BibTeX, and save the file
  4. python3 scripts/import_scholar.py ~/Downloads/citations.bib

Entries already present are skipped. Matching is by DOI first, then by
normalised title, because Scholar's citation keys bear no relation to ADS
bibcodes. Anything genuinely new is appended with a marker recording that it
came from Scholar, so a later ADS sync can tell the two apart.

Nothing is ever removed. Review the diff before committing: Scholar's metadata
is looser than ADS's, and it sometimes lists duplicates of the same paper under
slightly different titles.
"""

from __future__ import annotations

import argparse
import pathlib
import re
import subprocess
import sys

BIB = pathlib.Path("assets/data/soumya_publications.bib")


def split_entries(text: str) -> list[str]:
    """Split a BibTeX file into whole entries."""
    parts = re.split(r"(?=@[A-Za-z]+\s*\{)", text)
    return [p for p in parts if p.strip().startswith("@")]


def field(entry: str, name: str) -> str:
    m = re.search(rf"\b{name}\s*=\s*[{{\"](.+?)[}}\"]\s*,?\s*\n", entry, re.S | re.I)
    return re.sub(r"\s+", " ", m.group(1)).strip() if m else ""


def norm_title(t: str) -> str:
    """Titles compared with punctuation, case and LaTeX braces stripped."""
    t = re.sub(r"\\[a-zA-Z]+", " ", t)
    t = re.sub(r"[^a-z0-9 ]", " ", t.lower())
    return re.sub(r"\s+", " ", t).strip()


def norm_doi(d: str) -> str:
    return re.sub(r"^https?://(dx\.)?doi\.org/", "", d.strip().lower())


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("export", type=pathlib.Path,
                    help="BibTeX file exported from your Scholar profile")
    ap.add_argument("--dry-run", action="store_true",
                    help="list what would be added without writing")
    args = ap.parse_args()

    if not args.export.exists():
        print(f"No such file: {args.export}", file=sys.stderr)
        return 2

    current = BIB.read_text()
    mine = split_entries(current)
    known_dois = {norm_doi(field(e, "doi")) for e in mine if field(e, "doi")}
    known_titles = {norm_title(field(e, "title")) for e in mine}

    incoming = split_entries(args.export.read_text())
    print(f"  bibliography: {len(mine)} entries")
    print(f"  Scholar export: {len(incoming)} entries")

    new, skipped = [], 0
    for e in incoming:
        doi, title = norm_doi(field(e, "doi")), norm_title(field(e, "title"))
        if (doi and doi in known_dois) or (title and title in known_titles):
            skipped += 1
            continue
        if not title:
            skipped += 1
            continue
        new.append(e)
        known_titles.add(title)
        if doi:
            known_dois.add(doi)

    print(f"  already present: {skipped}")
    print(f"  new: {len(new)}")
    for e in new:
        year = field(e, "year") or "????"
        print(f"      + {year}  {field(e, 'title')[:66]}")

    if not new:
        print("  nothing to add")
        return 0

    if args.dry_run:
        print("  (dry run: nothing written)")
        return 0

    block = (
        "\n\n% ---------------------------------------------------------------\n"
        "% Imported from a Google Scholar profile export.\n"
        "% These are not in the ADS ORCID search; scripts/sync_ads.py leaves\n"
        "% them alone rather than removing them.\n"
        "% ---------------------------------------------------------------\n\n"
        + "\n\n".join(e.strip() for e in new)
        + "\n"
    )
    BIB.write_text(current.rstrip() + block)
    print(f"  appended {len(new)} entries to {BIB}")
    return subprocess.run([sys.executable, "scripts/bib_to_data.py"], check=False).returncode


if __name__ == "__main__":
    sys.exit(main())
