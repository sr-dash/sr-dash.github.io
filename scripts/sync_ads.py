#!/usr/bin/env python3
"""Refresh the bibliography from NASA ADS.

Replaces the manual loop of: export BibTeX from the ADS web UI, paste it over
assets/data/soumya_publications.bib, hand-edit the citation_count fields, and
remember to bump the citations_updated date.

    export ADS_TOKEN=...              # https://ui.adsabs.harvard.edu/user/settings/token
    python3 scripts/sync_ads.py

This merges into the bibliography; it never removes anything. That matters:
an ORCID search returns only the records where the ORCID is actually attached,
which for this profile is 12 of 22 entries. Conference abstracts (AGU, AAS,
SPD, SHINE, ASI) and papers where you are a middle author frequently have no
ORCID claim in ADS, so treating that search as authoritative would silently
delete real publications. The .bib is the curated record and wins.

What it does:
  1. reads the bibcodes already in the .bib and asks ADS for their current
     citation counts by bibcode, which works whether or not ORCID is attached,
  2. runs an ORCID search to discover papers not yet in the file, and pulls
     canonical BibTeX from ADS's own exporter for just those,
  3. updates counts in place, appends anything new, removes nothing,
  4. stamps the file with today's date,
  5. regenerates _data/publications.yml via scripts/bib_to_data.py.

Entries ADS could not price are reported, so you can claim them on ADS if you
want their counts tracked.

Records listed in scripts/ads_exclude.txt are skipped, which is how you drop a
duplicate, an erratum, or a same-name mismatch without hand-editing the .bib.

Google Scholar is deliberately not used: it has no public API, its terms
prohibit scraping, and it blocks automated access in practice. ADS is also the
better source for this field — it indexes conference abstracts and has more
reliable citation counts for astronomy than Scholar or Crossref.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import pathlib
import re
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request

ORCID = "0000-0003-0103-6569"
BIB = pathlib.Path("assets/data/soumya_publications.bib")
EXCLUDE = pathlib.Path("scripts/ads_exclude.txt")

API = "https://api.adsabs.harvard.edu/v1"
SEARCH_FIELDS = "bibcode,title,year,citation_count,doctype,doi"
# ADS doctypes that belong in the bibliography. Everything else (errata,
# catalogues, software records, press releases) is left out.
KEEP_DOCTYPES = {"article", "inproceedings", "abstract", "inbook", "book", "eprint"}


def api_get(path: str, params: dict, token: str) -> dict:
    url = f"{API}{path}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def api_post(path: str, payload: dict, token: str) -> dict:
    req = urllib.request.Request(
        f"{API}{path}",
        data=json.dumps(payload).encode(),
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.load(r)


def fetch_bibtex(bibcodes: list[str], token: str) -> str:
    """ADS's own BibTeX export, so appended entries match the file's format."""
    return api_post("/export/bibtex", {"bibcode": bibcodes}, token)["export"]


def inject_citation_counts(bibtex: str, counts: dict[str, int]) -> str:
    """Set `citation_count` on entries ADS priced; leave the others untouched."""
    out, updated = [], 0
    for block in re.split(r"(?=@[A-Za-z]+\{)", bibtex):
        if not block.strip().startswith("@"):
            out.append(block)
            continue
        key = re.match(r"@[A-Za-z]+\{([^,]+),", block)
        # Not priced by ADS: keep whatever count the curated file already had.
        if not key or key[1] not in counts:
            out.append(block)
            continue
        block = re.sub(r",?\n\s*citation_count\s*=\s*\{[^}]*\}", "", block)
        idx = block.rstrip().rfind("}")
        block = (
            block[:idx].rstrip().rstrip(",")
            + f",\n      citation_count = {{{counts[key[1]]}}}\n"
            + block[idx:]
        )
        updated += 1
        out.append(block)
    print(f"  refreshed counts on {updated} entries")
    return "".join(out)


def existing_bibcodes(text: str) -> list[str]:
    return re.findall(r"@[A-Za-z]+\{([^,]+),", text)


def counts_for(bibcodes: list[str], token: str) -> dict[str, int]:
    """Current citation counts, looked up by bibcode.

    Uses the bigquery endpoint, which takes an explicit list, so counts come
    back for every entry in the file regardless of whether its ORCID is
    claimed on ADS.
    """
    if not bibcodes:
        return {}
    payload = "bibcode\n" + "\n".join(bibcodes)
    url = f"{API}/search/bigquery?" + urllib.parse.urlencode(
        {"q": "*:*", "fl": "bibcode,citation_count", "rows": len(bibcodes)}
    )
    req = urllib.request.Request(
        url,
        data=payload.encode(),
        headers={"Authorization": f"Bearer {token}", "Content-Type": "big-query/csv"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=90) as r:
        docs = json.load(r)["response"]["docs"]
    return {d["bibcode"]: int(d.get("citation_count", 0) or 0) for d in docs}


def discover(token: str) -> list[dict]:
    """Records ADS associates with this ORCID, used only to find new papers."""
    records, start, rows = [], 0, 200
    while True:
        data = api_get(
            "/search/query",
            {"q": f"orcid:{ORCID}", "fl": SEARCH_FIELDS, "rows": rows,
             "start": start, "sort": "date desc"},
            token,
        )["response"]
        records.extend(data["docs"])
        start += rows
        if start >= data["numFound"]:
            return records


def header(today: str, n: int, total: int) -> str:
    return (
        "% Bibliography for Soumyaranjan Dash.\n"
        "%\n"
        f"% citations_updated: {today}\n"
        "%   Citation counts refreshed from NASA ADS by scripts/sync_ads.py.\n"
        "%   The script merges: it updates counts and appends new papers, and\n"
        "%   never removes an entry. Curated entries that ADS does not associate\n"
        "%   with the ORCID stay put.\n"
        f"%   {n} records, {total} citations at the time of writing.\n"
        f"%   https://ui.adsabs.harvard.edu/search/q=orcid%3A{ORCID}\n"
        "\n"
    )


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true",
                    help="report what would change without writing files")
    args = ap.parse_args()

    token = os.environ.get("ADS_TOKEN", "").strip()
    if not token:
        print(
            "ADS_TOKEN is not set.\n"
            "  Get a free token at https://ui.adsabs.harvard.edu/user/settings/token\n"
            "  Locally:  export ADS_TOKEN=...\n"
            "  In CI:    add it as the repository secret ADS_TOKEN",
            file=sys.stderr,
        )
        return 2

    excluded = set()
    if EXCLUDE.exists():
        excluded = {
            line.split("#")[0].strip()
            for line in EXCLUDE.read_text().splitlines()
            if line.split("#")[0].strip()
        }

    old = BIB.read_text() if BIB.exists() else ""
    have = existing_bibcodes(old)
    print(f"  bibliography holds {len(have)} entries")

    try:
        counts = counts_for(have, token)
        found = discover(token)
    except urllib.error.HTTPError as e:
        detail = e.read().decode(errors="replace")[:300]
        print(f"ADS request failed: {e.code} {e.reason}\n{detail}", file=sys.stderr)
        return 1

    missing = [b for b in have if b not in counts]
    print(f"  ADS priced {len(counts)} of them" +
          (f"; no record for {len(missing)}" if missing else ""))
    for b in missing:
        print(f"      ? {b}  (kept, count left as-is)")

    new_records = [
        r for r in found
        if r["bibcode"] not in have
        and r["bibcode"] not in excluded
        and r.get("doctype", "article") in KEEP_DOCTYPES
    ]
    print(f"  ORCID search found {len(found)} records, {len(new_records)} not already in the file")

    body = old[old.index("@"):] if "@" in old else ""

    # Refresh counts for what is already there, leaving unpriced entries alone.
    body = inject_citation_counts(body, counts)

    # Append anything genuinely new.
    if new_records:
        appended = fetch_bibtex([r["bibcode"] for r in new_records], token)
        appended = inject_citation_counts(
            appended, {r["bibcode"]: int(r.get("citation_count", 0) or 0) for r in new_records}
        )
        for r in new_records:
            print(f"      + {r['bibcode']}  {(r.get('title') or [''])[0][:60]}")
        body = body.rstrip() + "\n\n" + appended.strip() + "\n"

    total = sum(counts.values()) + sum(
        int(r.get("citation_count", 0) or 0) for r in new_records
    )
    today = dt.date.today().isoformat()
    new = header(today, len(existing_bibcodes(body)), total) + body.strip() + "\n"

    # Guard: this script must never shrink the bibliography.
    if len(existing_bibcodes(new)) < len(have):
        print("REFUSING: the result has fewer entries than the input.", file=sys.stderr)
        return 1

    strip_date = lambda t: re.sub(r"% citations_updated: \d{4}-\d{2}-\d{2}", "", t)
    if strip_date(old) == strip_date(new):
        print("  nothing changed")
        return 0

    if args.dry_run:
        print("  (dry run: nothing written)")
        return 0

    BIB.write_text(new)
    print(f"  wrote {BIB}: {len(existing_bibcodes(new))} entries, {total} citations")
    return subprocess.run([sys.executable, "scripts/bib_to_data.py"], check=False).returncode


if __name__ == "__main__":
    sys.exit(main())
