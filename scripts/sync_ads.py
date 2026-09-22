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
     citation counts and abstracts by bibcode, which works whether or not
     ORCID is attached,
  2. runs an ORCID search to discover papers not yet in the file, and pulls
     canonical BibTeX from ADS's own exporter for just those,
  3. searches the surname broadly and keeps records that share an author with
     the bibliography, which is how the un-claimed entries surface,
  4. updates counts and abstracts in place, appends anything new, removes
     nothing,
  5. stamps the file with today's date,
  6. regenerates _data/publications.yml via scripts/bib_to_data.py.

Two discovery strategies, because they carry different weight. An ORCID match
is the author asserting the paper is theirs, so those are appended. A
name-plus-co-author match is an inference: "Dash, S" is several researchers,
and what distinguishes this one is company — a paper of theirs nearly always
carries a name already in the bibliography. Those are reported for review by
default (--coauthors report) and appended only on request
(--coauthors append), with --min-overlap to demand more than one shared name.

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
import unicodedata
import urllib.error
import urllib.parse
import urllib.request

# Same directory. Reused rather than reimplemented so the co-author search
# matches names through exactly the LaTeX decoding the bibliography went
# through, and cannot drift from it.
import bib_to_data

ORCID = "0000-0003-0103-6569"
# Surname and first initial, which is how ADS indexes an author and as much as
# a name search can safely assume. "Dash, S" also matches every other S. Dash
# in the literature, which is exactly why the co-author filter below exists.
AUTHOR = "Dash, S"
BIB = pathlib.Path("assets/data/soumya_publications.bib")
EXCLUDE = pathlib.Path("scripts/ads_exclude.txt")

API = "https://api.adsabs.harvard.edu/v1"
SEARCH_FIELDS = "bibcode,title,year,citation_count,doctype,doi"
# The co-author search needs the author list back to filter on.
NAME_FIELDS = SEARCH_FIELDS + ",author,bibstem"
# ADS doctypes that belong in the bibliography. Everything else (errata,
# catalogues, software records, press releases) is left out.
KEEP_DOCTYPES = {"article", "inproceedings", "abstract", "inbook", "book", "eprint"}
# Above this, a paper is a large-collaboration product rather than something a
# named author wrote, and co-author overlap stops meaning anything. The longest
# author list in this bibliography is 16, a DKIST instrument paper.
MAX_AUTHORS = 30


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


def balance_braces(value: str) -> str:
    """Drop unmatched braces so a field cannot terminate early.

    Braces are kept where they pair up, because bib_to_data.py's LaTeX decoder
    needs them: \\ensuremath{\\sim} only resolves while its braces survive.
    """
    depth, keep = 0, []
    for ch in value:
        if ch == "{":
            depth += 1
        elif ch == "}":
            if depth == 0:
                continue
            depth -= 1
        keep.append(ch)
    out = "".join(keep)
    # Close whatever is still open, at the end, where it changes nothing.
    return out + "}" * depth


def strip_field(block: str, name: str) -> str:
    """Remove `name = {...}` from a BibTeX block, counting nested braces."""
    m = re.search(rf"(,?\s*\n\s*){name}\s*=\s*\{{", block)
    if not m:
        return block
    depth, i = 1, m.end()
    while i < len(block) and depth:
        depth += (block[i] == "{") - (block[i] == "}")
        i += 1
    return block[:m.start()] + block[i:]


def inject_field(bibtex: str, name: str, values: dict[str, str], label: str) -> str:
    """Set `name` on the entries ADS returned a value for; leave others untouched.

    Values are written on a single line, because scripts/bib_to_data.py splits
    fields on comma-newline and an abstract wrapped across lines would parse as
    several fields.
    """
    out, updated = [], 0
    for block in re.split(r"(?=@[A-Za-z]+\{)", bibtex):
        if not block.strip().startswith("@"):
            out.append(block)
            continue
        key = re.match(r"@[A-Za-z]+\{([^,]+),", block)
        # No value from ADS: keep whatever the curated file already had.
        if not key or key[1] not in values:
            out.append(block)
            continue
        block = strip_field(block, name)
        idx = block.rstrip().rfind("}")
        value = balance_braces(re.sub(r"\s+", " ", str(values[key[1]])).strip())
        block = (
            block[:idx].rstrip().rstrip(",")
            + f",\n      {name} = {{{value}}}\n"
            + block[idx:]
        )
        updated += 1
        out.append(block)
    print(f"  {label} on {updated} entries")
    return "".join(out)


def inject_citation_counts(bibtex: str, counts: dict[str, int]) -> str:
    return inject_field(bibtex, "citation_count", counts, "refreshed counts")


def existing_bibcodes(text: str) -> list[str]:
    return re.findall(r"@[A-Za-z]+\{([^,]+),", text)


def metadata_for(bibcodes: list[str], token: str) -> tuple[dict[str, int], dict[str, str]]:
    """Current citation counts and abstracts, looked up by bibcode.

    Uses the bigquery endpoint, which takes an explicit list, so records come
    back for every entry in the file regardless of whether its ORCID is
    claimed on ADS. The abstract is what feeds the "Abs" toggle on the
    publications page; conference records frequently have none, and those
    entries simply render without the toggle.
    """
    if not bibcodes:
        return {}, {}
    payload = "bibcode\n" + "\n".join(bibcodes)
    url = f"{API}/search/bigquery?" + urllib.parse.urlencode(
        {"q": "*:*", "fl": "bibcode,citation_count,abstract", "rows": len(bibcodes)}
    )
    req = urllib.request.Request(
        url,
        data=payload.encode(),
        headers={"Authorization": f"Bearer {token}", "Content-Type": "big-query/csv"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=90) as r:
        docs = json.load(r)["response"]["docs"]
    counts = {d["bibcode"]: int(d.get("citation_count", 0) or 0) for d in docs}
    abstracts = {d["bibcode"]: d["abstract"] for d in docs if d.get("abstract")}
    return counts, abstracts


def search_all(query: str, fields: str, token: str) -> list[dict]:
    """Every record matching a query, following ADS's pagination."""
    records, start, rows = [], 0, 200
    while True:
        data = api_get(
            "/search/query",
            {"q": query, "fl": fields, "rows": rows,
             "start": start, "sort": "date desc"},
            token,
        )["response"]
        records.extend(data["docs"])
        start += rows
        if start >= data["numFound"] or not data["docs"]:
            return records


def discover(token: str) -> list[dict]:
    """Records ADS associates with this ORCID, used only to find new papers."""
    return search_all(f"orcid:{ORCID}", SEARCH_FIELDS, token)


def name_key(name: str) -> str:
    """Surname and first initial, lowercased and stripped of diacritics.

    ADS writes the same person as "Mu{\\~n}oz-Jaramillo, Andr{\\'e}s",
    "Munoz-Jaramillo, A." and "Muñoz-Jaramillo, Andrés" depending on the
    record, so matching has to happen on something coarser than the string.
    """
    flat = unicodedata.normalize("NFKD", name)
    flat = "".join(c for c in flat if not unicodedata.combining(c)).lower()
    flat = re.sub(r"[{}\\'\"`^~=.]", "", flat)
    # ADS carries both the accented spelling and its transliteration —
    # W{\"o}ger and Woeger are the same DKIST instrument scientist. Accent
    # stripping turns the first into "woger", so collapse the digraph too.
    # A match here only nominates a paper for review, so erring loose is
    # cheaper than erring strict.
    flat = re.sub(r"(?<=[aou])e(?=[^aeiou]|$)", "", flat)
    if "," in flat:
        surname, _, given = flat.partition(",")
    else:
        parts = flat.split()
        surname, given = (parts[-1], " ".join(parts[:-1])) if parts else ("", "")
    initial = next((c for c in given if c.isalpha()), "")
    return f"{surname.strip()}, {initial}"


def known_collaborators(entries: list[dict]) -> set[str]:
    """Everyone already co-credited in the bibliography, minus the author."""
    names = {name_key(a) for e in entries for a in e.get("authors", [])}
    return names - {name_key(AUTHOR)}


def discover_by_coauthors(token: str, known: set[str], floor_year: int
                          ) -> list[tuple[dict, list[str]]]:
    """Papers under this surname that share an author with the bibliography.

    ORCID discovery misses most of the record: a claim only exists where the
    publisher supplied one or someone attached it in ADS, which for this
    profile covers 12 of 22 entries. Conference abstracts and middle-author
    papers rarely carry one at all.

    A bare author search cannot replace it, because "Dash, S" is several
    different researchers. What separates them is company: a paper of this
    author's almost always carries at least one name already in the
    bibliography. So search the surname broadly and keep the records whose
    author list overlaps the known collaborators, reporting which names
    matched so a human can judge the thin ones.

    Two filters do the heavy lifting, and without them the search is useless.
    Restricting to the astronomy database drops the particle-physics
    literature, where an unrelated S. Dash publishes. Capping the author count
    drops the thousand-author collaboration papers, which otherwise match on
    three shared surnames by sheer statistics — ALICE alone contributed several
    hundred false positives, since a list that long contains someone named
    Mahajan, Pal and Tripathy regardless of who wrote it.
    """
    query = (f'author:"{AUTHOR}" year:{floor_year}- '
             f'database:astronomy author_count:[1 TO {MAX_AUTHORS}]')
    records = search_all(query, NAME_FIELDS, token)
    print(f"  author search for {AUTHOR!r} since {floor_year} "
          f"(astronomy, ≤{MAX_AUTHORS} authors): {len(records)} records")

    hits = []
    for r in records:
        matched = sorted({
            name_key(a) for a in r.get("author", [])
        } & known)
        if matched:
            hits.append((r, matched))
    return hits


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
    ap.add_argument("--coauthors", choices=("report", "append", "off"),
                    default="report",
                    help="what to do with papers found by co-author overlap "
                         "rather than ORCID: list them for review (default), "
                         "add them to the bibliography, or skip the search")
    ap.add_argument("--min-overlap", type=int, default=1, metavar="N",
                    help="how many known collaborators a co-author match must "
                         "share before it counts (default 1)")
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

    entries = bib_to_data.parse_bib(old)
    known = known_collaborators(entries)
    years = [int(e["year"]) for e in entries if (e.get("year") or "").isdigit()]
    floor_year = (min(years) - 1) if years else 2000

    try:
        counts, abstracts = metadata_for(have, token)
        found = discover(token)
        coauthor_hits = ([] if args.coauthors == "off"
                         else discover_by_coauthors(token, known, floor_year))
    except urllib.error.HTTPError as e:
        detail = e.read().decode(errors="replace")[:300]
        print(f"ADS request failed: {e.code} {e.reason}\n{detail}", file=sys.stderr)
        return 1

    missing = [b for b in have if b not in counts]
    print(f"  ADS priced {len(counts)} of them" +
          (f"; no record for {len(missing)}" if missing else ""))
    for b in missing:
        print(f"      ? {b}  (kept, count left as-is)")

    def is_new(r):
        return (r["bibcode"] not in have
                and r["bibcode"] not in excluded
                and r.get("doctype", "article") in KEEP_DOCTYPES)

    new_records = [r for r in found if is_new(r)]
    print(f"  ORCID search found {len(found)} records, {len(new_records)} not already in the file")

    # Co-author discovery. Reported separately from the ORCID finds because it
    # is a weaker claim: an ORCID match is the author saying "this is mine",
    # while a name-plus-company match is an inference that a person should
    # confirm once before it starts appending on a schedule.
    seen = {r["bibcode"] for r in new_records}
    coauthor_new = []
    for r, matched in coauthor_hits:
        if len(matched) >= args.min_overlap and is_new(r) and r["bibcode"] not in seen:
            seen.add(r["bibcode"])
            coauthor_new.append((r, matched))

    print(f"  co-author overlap matched {len(coauthor_hits)} records, "
          f"{len(coauthor_new)} not already in the file")
    if coauthor_new:
        print(f"  {'adding' if args.coauthors == 'append' else 'candidates for review'}:")
        for r, matched in sorted(coauthor_new,
                                 key=lambda x: (-len(x[1]), x[0].get("year", ""))):
            title = (r.get("title") or [""])[0]
            print(f"      {r['bibcode']}  {r.get('doctype', '?'):14s} "
                  f"overlap {len(matched)}  {title[:64]}")
            print(f"        shares: {', '.join(matched)}")
        if args.coauthors != "append":
            print("  none of the above were added. Re-run with --coauthors append")
            print("  to take them, or list unwanted bibcodes in scripts/ads_exclude.txt")

    if args.coauthors == "append":
        new_records += [r for r, _ in coauthor_new]

    body = old[old.index("@"):] if "@" in old else ""

    # Refresh counts and abstracts for what is already there, leaving entries
    # ADS has no record of alone.
    body = inject_citation_counts(body, counts)
    body = inject_field(body, "abstract", abstracts, "stored abstracts")

    # Append anything genuinely new.
    if new_records:
        new_codes = [r["bibcode"] for r in new_records]
        appended = fetch_bibtex(new_codes, token)
        appended = inject_citation_counts(
            appended, {r["bibcode"]: int(r.get("citation_count", 0) or 0) for r in new_records}
        )
        _, new_abstracts = metadata_for(new_codes, token)
        appended = inject_field(appended, "abstract", new_abstracts, "stored abstracts")
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
