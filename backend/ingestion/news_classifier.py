"""
News Classifier — pure Python, zero LLM calls.

Replicates the structured event classification that ACLED provides for political
violence, but applied to any news article. Each article is classified into:

  - category     : primary event type (military / conflict / protest / sanctions /
                   cyber / economic / energy / diplomatic / humanitarian / other)
  - sub_category : finer-grained type within the category
  - severity     : critical / high / medium / low
  - importance   : 0-100 composite score
  - tags         : list of matched signal keywords
  - actors       : state/org actors detected in the text
  - locations    : country/region names detected
  - sectors      : affected financial sectors (maps to portfolio analysis)

Importance formula (matches WorldMonitor pattern):
    importance = severity_score * 0.55
               + source_tier_score * 0.20
               + corroboration_score * 0.15
               + recency_score * 0.10

Design principles:
  - No external calls. No imports beyond stdlib.
  - All keyword sets are exhaustive but weighted by specificity.
  - Multi-label: an article can match multiple categories; primary = highest score.
  - Deterministic: same input always produces same output.
"""

from __future__ import annotations

import re
import math
from datetime import datetime, timezone
from typing import TypedDict


# ─── Output schema ────────────────────────────────────────────────────────────

class ClassifiedArticle(TypedDict):
    title: str
    source: str
    url: str
    published_at: str           # ISO8601
    category: str
    sub_category: str
    severity: str               # critical / high / medium / low
    importance: float           # 0-100
    severity_score: float       # raw severity component 0-100
    source_tier: int            # 1-4 (1=top tier)
    tags: list[str]             # matched signal keywords
    actors: list[str]           # detected state/org actors
    locations: list[str]        # detected country/region names
    sectors: list[str]          # affected financial sectors
    category_scores: dict       # {category: raw_match_count} for all categories


# ─── Keyword taxonomy ─────────────────────────────────────────────────────────
# Structure: { sub_category: (severity, [keywords]) }
# Keywords are checked as substrings in lowercased title+description.
# More specific phrases listed first — order matters for sub_category assignment.

TAXONOMY: dict[str, dict[str, tuple[str, list[str]]]] = {

    "military": {
        "nuclear":          ("critical", ["nuclear weapon", "nuclear strike", "nuclear warhead", "dirty bomb", "radioactive weapon", "wmd"]),
        "ballistic_missile":("critical", ["ballistic missile", "icbm", "hypersonic missile", "cruise missile", "scud"]),
        "airstrike":        ("critical", ["airstrike", "air strike", "aerial bombardment", "bombing raid", "drone strike", "drone attack", "uav strike"]),
        "naval":            ("high",     ["naval blockade", "warship", "aircraft carrier", "destroyer", "submarine", "naval vessel", "fleet deployed"]),
        "ground_offensive": ("high",     ["ground offensive", "military offensive", "troop advance", "infantry assault", "armored assault", "tank column"]),
        "shelling":         ("high",     ["shelling", "artillery fire", "mortar attack", "rocket barrage", "missile barrage"]),
        "troops":           ("medium",   ["troops deployed", "military deployment", "boots on ground", "special forces", "military buildup", "troop movement"]),
        "military_general": ("medium",   ["military", "armed forces", "defense ministry", "pentagon", "nato", "military operation"]),
    },

    "conflict": {
        "mass_casualty":    ("critical", ["mass casualty", "hundreds killed", "massacre", "genocide", "ethnic cleansing", "civilian mass killing"]),
        "explosion":        ("critical", ["explosion", "suicide bomb", "car bomb", "ied", "improvised explosive", "blast kills"]),
        "assassination":    ("critical", ["assassinated", "assassination", "targeted killing", "killed in attack", "leader killed"]),
        "terrorist_attack": ("high",     ["terrorist attack", "terror attack", "isis attack", "al-qaeda", "al-shabaab attack", "boko haram attack", "houthi attack"]),
        "battle":           ("high",     ["battle", "combat", "fighting", "clashes", "armed clashes", "skirmish", "firefight"]),
        "hostage":          ("high",     ["hostage", "kidnapped", "abducted", "held captive", "prisoner exchange"]),
        "casualties":       ("medium",   ["killed", "dead", "fatalities", "wounded", "casualties", "deaths reported"]),
        "attack":           ("medium",   ["attack", "assault", "ambush", "raid", "targeted"]),
    },

    "protest": {
        "coup":             ("critical", ["coup", "military takeover", "government overthrown", "junta", "seized power", "president arrested"]),
        "uprising":         ("high",     ["uprising", "insurrection", "revolution", "civil war", "armed uprising", "rebel offensive"]),
        "riot":             ("high",     ["riot", "violent protest", "clashes with police", "tear gas", "live fire protest", "protesters killed"]),
        "mass_protest":     ("medium",   ["mass protest", "hundreds of thousands", "general strike", "nationwide protest", "widespread demonstrations"]),
        "protest":          ("low",      ["protest", "demonstration", "rally", "marched", "demonstrators", "opposition rally"]),
        "crackdown":        ("high",     ["crackdown", "arrested protesters", "dissidents detained", "political prisoner", "opposition arrested"]),
    },

    "sanctions": {
        "primary_sanctions":("high",     ["sanctions imposed", "sanctioned by", "ofac designation", "asset freeze", "assets frozen", "blacklisted", "designated terrorist"]),
        "secondary_sanctions":("high",   ["secondary sanctions", "sanctions on banks", "dollar payment ban", "cut off from swift", "swift exclusion"]),
        "export_controls":  ("high",     ["export controls", "export ban", "technology embargo", "chip ban", "semiconductor restriction", "arms embargo"]),
        "trade_war":        ("medium",   ["tariff", "trade war", "import duty", "trade restriction", "trade ban", "countermeasure tariff"]),
        "embargo":          ("high",     ["embargo", "blockade", "trade embargo", "oil embargo", "energy sanctions"]),
        "sanctions_general":("medium",   ["sanctions", "sanctioned", "economic pressure", "economic coercion"]),
    },

    "cyber": {
        "critical_infra":   ("critical", ["power grid attack", "water supply hack", "nuclear facility hack", "critical infrastructure attack", "scada attack", "ics attack"]),
        "state_espionage":  ("critical", ["state-sponsored hack", "apt attack", "apt28", "apt41", "cozy bear", "lazarus group", "volt typhoon", "nation-state cyber"]),
        "ransomware":       ("high",     ["ransomware", "ransomware attack", "ransomware gang", "lockbit", "blackcat", "cl0p"]),
        "data_breach":      ("high",     ["data breach", "data leak", "stolen data", "millions of records", "personal data exposed", "classified documents leaked"]),
        "ddos":             ("medium",   ["ddos", "distributed denial", "cyberattack", "cyber attack", "website taken down", "systems disrupted"]),
        "malware":          ("medium",   ["malware", "spyware", "trojan", "zero-day", "vulnerability exploited", "phishing campaign"]),
        "cyber_general":    ("low",      ["cyber", "hacked", "cybersecurity", "intrusion", "breach"]),
    },

    "economic": {
        "sovereign_default":("critical", ["sovereign default", "debt default", "missed debt payment", "imf emergency", "currency collapse", "hyperinflation"]),
        "banking_crisis":   ("critical", ["bank run", "banking crisis", "bank collapse", "financial contagion", "credit freeze", "liquidity crisis"]),
        "recession":        ("high",     ["recession", "gdp contraction", "economic collapse", "depression", "financial crisis"]),
        "inflation":        ("high",     ["inflation surge", "cpi beats", "core inflation", "price spike", "cost of living crisis", "food prices surge"]),
        "currency":         ("high",     ["currency devaluation", "currency crisis", "exchange rate collapse", "capital controls", "forex reserves depleted"]),
        "imf":              ("high",     ["imf bailout", "imf loan", "imf program", "world bank emergency", "debt restructuring", "debt relief"]),
        "rate_decision":    ("medium",   ["rate hike", "rate cut", "interest rate decision", "federal reserve", "fed raises", "fed cuts", "ecb decision", "central bank"]),
        "market":           ("medium",   ["stock market crash", "market selloff", "market plunge", "circuit breaker", "market panic"]),
        "economic_general": ("low",      ["gdp", "economic growth", "trade deficit", "budget deficit", "fiscal policy", "monetary policy"]),
    },

    "energy": {
        "supply_disruption":("critical", ["pipeline attacked", "oil facility attacked", "refinery bombed", "lng terminal attack", "energy infrastructure attack"]),
        "chokepoint":       ("critical", ["hormuz", "strait of hormuz", "suez canal closed", "bab el-mandeb", "taiwan strait closed", "malacca strait"]),
        "opec":             ("high",     ["opec cut", "opec+ cut", "production cut", "oil output cut", "opec meeting", "opec decision"]),
        "oil_price":        ("high",     ["oil price spike", "crude surges", "oil soars", "brent crude", "wti crude", "energy price"]),
        "pipeline":         ("medium",   ["pipeline", "nord stream", "gas pipeline", "oil pipeline", "lng shipment", "gas supply"]),
        "energy_general":   ("low",      ["energy", "oil", "gas", "petroleum", "fossil fuel", "renewable energy"]),
    },

    "diplomatic": {
        "war_declaration":  ("critical", ["declared war", "war declared", "state of war", "declaration of war"]),
        "ceasefire":        ("high",     ["ceasefire", "peace deal", "peace agreement", "peace talks breakthrough", "armistice"]),
        "expulsion":        ("high",     ["expels ambassador", "diplomatic expulsion", "severed diplomatic", "broke diplomatic", "persona non grata"]),
        "summit":           ("medium",   ["summit", "bilateral talks", "diplomatic talks", "negotiations", "peace negotiations"]),
        "alliance":         ("medium",   ["military alliance", "defense pact", "security agreement", "nato expansion", "military cooperation"]),
        "un":               ("low",      ["united nations", "un security council", "un resolution", "un vote", "un sanctions"]),
    },

    "humanitarian": {
        "famine":           ("critical", ["famine", "starvation", "mass starvation", "food crisis", "hunger crisis"]),
        "displacement":     ("high",     ["refugee crisis", "mass displacement", "internally displaced", "fled their homes", "exodus"]),
        "epidemic":         ("high",     ["epidemic", "outbreak", "disease outbreak", "pandemic", "cholera", "ebola"]),
        "aid_blocked":      ("high",     ["aid blocked", "humanitarian corridor", "aid convoy attacked", "aid workers killed"]),
        "casualty_toll":    ("medium",   ["civilian deaths", "civilian casualties", "death toll", "toll rises"]),
    },
}

# Flat lookup: keyword → (category, sub_category, severity)
# Built once at module load for O(1) per-keyword lookup.
_KW_INDEX: dict[str, tuple[str, str, str]] = {}

for _cat, _subcats in TAXONOMY.items():
    for _sub, (_sev, _kws) in _subcats.items():
        for _kw in _kws:
            if _kw not in _KW_INDEX:
                _KW_INDEX[_kw] = (_cat, _sub, _sev)


# ─── Severity → numeric score ─────────────────────────────────────────────────

SEVERITY_SCORE: dict[str, float] = {
    "critical": 100.0,
    "high":      75.0,
    "medium":    40.0,
    "low":       15.0,
}


# ─── Source tier lookup ───────────────────────────────────────────────────────
# Tier 1 = top-tier wire/financial press (most credible, highest weight)
# Tier 4 = unknown/blog (lowest weight)

_TIER1_DOMAINS = {
    "reuters.com", "apnews.com", "bloomberg.com", "wsj.com",
    "ft.com", "economist.com", "afp.com", "dpa.com",
}
_TIER2_DOMAINS = {
    "bbc.com", "bbc.co.uk", "nytimes.com", "theguardian.com",
    "washingtonpost.com", "aljazeera.com", "france24.com",
    "dw.com", "rfi.fr", "nbcnews.com", "abcnews.go.com",
    "cbsnews.com", "cnn.com", "politico.com", "axios.com",
    "foreignpolicy.com", "theatlantic.com", "semafor.com",
}
_TIER3_DOMAINS = {
    "foxnews.com", "dailymail.co.uk", "nypost.com", "thehill.com",
    "nationalreview.com", "thedailybeast.com", "vice.com",
    "middleeasteye.net", "haaretz.com", "timesofisrael.com",
    "arabnews.com", "dawn.com", "thenews.com.pk", "thehindu.com",
    "hindustantimes.com", "scmp.com", "kyivpost.com",
    "defenseone.com", "breakingdefense.com", "janes.com",
    "rferl.org", "euronews.com", "euractiv.com",
}

def _source_tier(domain: str) -> int:
    d = domain.lower().strip()
    # Strip www.
    if d.startswith("www."):
        d = d[4:]
    if d in _TIER1_DOMAINS: return 1
    if d in _TIER2_DOMAINS: return 2
    if d in _TIER3_DOMAINS: return 3
    return 4

def _tier_score(tier: int) -> float:
    return {1: 100.0, 2: 75.0, 3: 45.0, 4: 20.0}[tier]


# ─── Actor detection ──────────────────────────────────────────────────────────
# State actors, armed groups, international organizations — detected by name match.

_STATE_ACTORS = {
    "United States", "Russia", "China", "Iran", "Israel", "Ukraine",
    "North Korea", "Saudi Arabia", "Turkey", "Pakistan", "India",
    "France", "UK", "Germany", "Japan", "South Korea", "Taiwan",
    "Syria", "Iraq", "Yemen", "Sudan", "Ethiopia", "Libya", "Myanmar",
    "Venezuela", "Nigeria", "Afghanistan", "Somalia", "Mali",
}

_ORG_ACTORS = {
    # Military/paramilitary
    "NATO", "IDF", "IRGC", "Wagner Group", "Houthi", "Hamas", "Hezbollah",
    "Al-Qaeda", "ISIS", "ISIL", "Islamic State", "Al-Shabaab", "Boko Haram",
    "JNIM", "RSF", "SAF", "PMF", "PKK", "Taliban", "TPLF",
    # International orgs
    "UN", "United Nations", "IMF", "World Bank", "OPEC", "NATO",
    "EU", "European Union", "IAEA", "INTERPOL",
    # Financial/sanctions bodies
    "OFAC", "Treasury", "Federal Reserve", "ECB", "BIS",
}

def _detect_actors(text: str) -> list[str]:
    found = []
    for actor in _STATE_ACTORS | _ORG_ACTORS:
        if actor.lower() in text.lower():
            found.append(actor)
    return sorted(set(found))


# ─── Location detection ───────────────────────────────────────────────────────

_LOCATIONS = {
    # Countries
    "Afghanistan", "Algeria", "Angola", "Argentina", "Armenia", "Azerbaijan",
    "Bangladesh", "Belarus", "Bolivia", "Brazil", "Burma", "Myanmar",
    "Cameroon", "Chad", "China", "Colombia", "Congo", "Cuba",
    "Egypt", "Ethiopia", "France", "Georgia", "Germany",
    "Ghana", "Haiti", "India", "Indonesia", "Iran", "Iraq",
    "Israel", "Japan", "Jordan", "Kazakhstan", "Kenya",
    "Lebanon", "Libya", "Mali", "Mexico", "Moldova", "Morocco",
    "Myanmar", "Nigeria", "North Korea", "Pakistan", "Palestine",
    "Philippines", "Russia", "Rwanda", "Saudi Arabia", "Somalia",
    "South Sudan", "Sudan", "Syria", "Taiwan", "Turkey",
    "Uganda", "Ukraine", "Venezuela", "Yemen", "Zimbabwe",
    # Regions / strategic locations
    "Gaza", "West Bank", "Hormuz", "Suez", "Bab el-Mandeb",
    "Taiwan Strait", "South China Sea", "Donbas", "Crimea",
    "Sahel", "Horn of Africa", "Middle East", "Persian Gulf",
}

def _detect_locations(text: str) -> list[str]:
    found = []
    for loc in _LOCATIONS:
        pattern = r'\b' + re.escape(loc) + r'\b'
        if re.search(pattern, text, re.IGNORECASE):
            found.append(loc)
    return sorted(set(found))


# ─── Sector mapping ───────────────────────────────────────────────────────────
# Maps event category+sub_category → affected financial sectors

_SECTOR_MAP: dict[str, list[str]] = {
    # Military / Conflict
    "military":           ["defense", "aerospace", "geopolitical"],
    "conflict":           ["geopolitical", "commodities", "defense"],
    # Protest
    "protest":            ["geopolitical", "emerging_markets"],
    # Sanctions
    "sanctions":          ["financials", "energy", "technology", "geopolitical"],
    # Cyber
    "cyber":              ["technology", "financials", "industrials"],
    # Economic
    "sovereign_default":  ["financials", "emerging_markets", "macro"],
    "banking_crisis":     ["financials", "macro"],
    "inflation":          ["macro", "consumer_staples", "financials"],
    "rate_decision":      ["macro", "financials", "real_estate"],
    "currency":           ["financials", "emerging_markets", "macro"],
    "economic_general":   ["macro"],
    # Energy
    "supply_disruption":  ["energy", "commodities", "industrials"],
    "chokepoint":         ["energy", "commodities", "shipping", "geopolitical"],
    "opec":               ["energy", "commodities"],
    "oil_price":          ["energy", "commodities", "consumer_staples"],
    "pipeline":           ["energy", "industrials"],
    # Diplomatic
    "ceasefire":          ["geopolitical", "defense"],
    "war_declaration":    ["defense", "commodities", "geopolitical"],
    "alliance":           ["defense", "geopolitical"],
    # Humanitarian
    "famine":             ["consumer_staples", "commodities", "emerging_markets"],
    "displacement":       ["geopolitical", "emerging_markets"],
}

def _map_sectors(category: str, sub_category: str) -> list[str]:
    sectors = set()
    if sub_category in _SECTOR_MAP:
        sectors.update(_SECTOR_MAP[sub_category])
    if category in _SECTOR_MAP:
        sectors.update(_SECTOR_MAP[category])
    return sorted(sectors) or ["geopolitical"]


# ─── Recency score ────────────────────────────────────────────────────────────

def _recency_score(published_at: str) -> float:
    """Linear decay from 100 (now) to 0 (24h ago). Older than 48h → 0."""
    try:
        pub = datetime.fromisoformat(published_at.replace("Z", "+00:00"))
        now = datetime.now(timezone.utc)
        age_h = (now - pub).total_seconds() / 3600
        if age_h >= 48:
            return 0.0
        if age_h <= 0:
            return 100.0
        return max(0.0, 100.0 - (age_h / 48.0) * 100.0)
    except Exception:
        return 50.0  # unknown age → neutral


# ─── Core classifier ──────────────────────────────────────────────────────────

def classify(
    title: str,
    description: str = "",
    source_domain: str = "",
    published_at: str = "",
    url: str = "",
    corroboration_count: int = 1,
) -> ClassifiedArticle:
    """
    Classify a single news article. All parameters except title are optional.

    corroboration_count: number of distinct sources reporting the same story.
    Used to boost importance score (capped at 5 for max effect).
    """
    text = f"{title} {description}".lower()

    # ── 1. Keyword matching ──────────────────────────────────────────────────
    category_scores: dict[str, float] = {}
    matched_kws: list[str] = []
    matched_subs: dict[str, tuple[str, str]] = {}  # kw → (sub_category, severity)

    for kw, (cat, sub, sev) in _KW_INDEX.items():
        if kw in text:
            matched_kws.append(kw)
            sev_score = SEVERITY_SCORE[sev]
            # Longer, more specific phrases get a specificity bonus
            specificity = min(2.0, len(kw.split()) * 0.5)
            category_scores[cat] = category_scores.get(cat, 0.0) + sev_score * specificity
            matched_subs[kw] = (sub, sev)

    # ── 2. Determine primary category ────────────────────────────────────────
    if category_scores:
        primary_category = max(category_scores, key=lambda k: category_scores[k])
    else:
        primary_category = "other"

    # ── 3. Determine sub_category and severity ───────────────────────────────
    # Pick the highest-severity keyword match within the primary category
    primary_subs = [
        (kw, sub, sev) for kw, (sub, sev) in matched_subs.items()
        if _KW_INDEX.get(kw, ("",))[0] == primary_category
    ]

    if primary_subs:
        # Sort by severity score descending, then specificity (longer phrase wins)
        primary_subs.sort(key=lambda x: (SEVERITY_SCORE[x[2]], len(x[0])), reverse=True)
        _, sub_category, severity = primary_subs[0]
    else:
        sub_category = "general"
        severity = "low"

    severity_score = SEVERITY_SCORE.get(severity, 15.0)

    # ── 4. Source tier ───────────────────────────────────────────────────────
    tier = _source_tier(source_domain) if source_domain else 4
    tier_sc = _tier_score(tier)

    # ── 5. Corroboration score ───────────────────────────────────────────────
    # Each additional source adds 20 points, capped at 5 sources (100 pts max)
    corr_score = min(100.0, (corroboration_count - 1) * 20.0)

    # ── 6. Recency score ─────────────────────────────────────────────────────
    rec_score = _recency_score(published_at) if published_at else 50.0

    # ── 7. Composite importance score ────────────────────────────────────────
    importance = (
        severity_score * 0.55
        + tier_sc      * 0.20
        + corr_score   * 0.15
        + rec_score    * 0.10
    )
    importance = round(min(100.0, max(0.0, importance)), 1)

    # ── 8. Entity detection ──────────────────────────────────────────────────
    full_text = f"{title} {description}"
    actors    = _detect_actors(full_text)
    locations = _detect_locations(full_text)
    sectors   = _map_sectors(primary_category, sub_category)

    return ClassifiedArticle(
        title=title,
        source=source_domain,
        url=url,
        published_at=published_at,
        category=primary_category,
        sub_category=sub_category,
        severity=severity,
        importance=importance,
        severity_score=severity_score,
        source_tier=tier,
        tags=sorted(set(matched_kws)),
        actors=actors,
        locations=locations,
        sectors=sectors,
        category_scores={k: round(v, 1) for k, v in category_scores.items()},
    )


# ─── Batch classifier ─────────────────────────────────────────────────────────

def classify_batch(articles: list[dict]) -> list[ClassifiedArticle]:
    """
    Classify a list of article dicts. Handles corroboration detection:
    articles reporting the same event (matching title keywords) get a
    corroboration boost.

    Input dict keys: title, description, source_domain, published_at, url
    """
    results = []

    # First pass: classify each article individually
    for art in articles:
        result = classify(
            title=art.get("title", ""),
            description=art.get("description", ""),
            source_domain=art.get("source_domain", art.get("source", "")),
            published_at=art.get("published_at", art.get("publishedAt", "")),
            url=art.get("url", ""),
        )
        results.append(result)

    # Second pass: corroboration boost
    # Two articles corroborate if they share 3+ title words (stopwords excluded)
    _STOPWORDS = {"the","a","an","in","on","at","to","of","and","or","for",
                  "with","by","as","is","are","was","were","be","been","has",
                  "have","had","its","it","this","that","from","up","about"}

    def _sig_words(title: str) -> frozenset:
        return frozenset(
            w for w in re.findall(r'[a-z]+', title.lower())
            if w not in _STOPWORDS and len(w) > 3
        )

    sigs = [_sig_words(r["title"]) for r in results]

    for i, result in enumerate(results):
        corr = sum(
            1 for j, other_sig in enumerate(sigs)
            if i != j and len(sigs[i] & other_sig) >= 3
        )
        if corr > 0:
            corr_score = min(100.0, corr * 20.0)
            old_importance = result["importance"]
            result["importance"] = round(min(100.0, (
                result["severity_score"] * 0.55
                + _tier_score(result["source_tier"]) * 0.20
                + corr_score * 0.15
                + (result["importance"] - result["severity_score"] * 0.55
                   - _tier_score(result["source_tier"]) * 0.20) / 0.25 * 0.10
            )), 1)

    # Sort by importance descending
    results.sort(key=lambda x: x["importance"], reverse=True)
    return results


# ─── Filter helpers ───────────────────────────────────────────────────────────

def filter_by_severity(articles: list[ClassifiedArticle], min_severity: str) -> list[ClassifiedArticle]:
    order = {"critical": 4, "high": 3, "medium": 2, "low": 1}
    threshold = order.get(min_severity, 1)
    return [a for a in articles if order.get(a["severity"], 0) >= threshold]


def filter_by_category(articles: list[ClassifiedArticle], categories: list[str]) -> list[ClassifiedArticle]:
    cat_set = set(categories)
    return [a for a in articles if a["category"] in cat_set]


def filter_by_location(articles: list[ClassifiedArticle], locations: list[str]) -> list[ClassifiedArticle]:
    loc_set = set(loc.lower() for loc in locations)
    return [a for a in articles if any(l.lower() in loc_set for l in a["locations"])]


def filter_by_sector(articles: list[ClassifiedArticle], sectors: list[str]) -> list[ClassifiedArticle]:
    sec_set = set(sectors)
    return [a for a in articles if any(s in sec_set for s in a["sectors"])]


def top_n(articles: list[ClassifiedArticle], n: int) -> list[ClassifiedArticle]:
    return sorted(articles, key=lambda x: x["importance"], reverse=True)[:n]


# ─── Agent context builder ────────────────────────────────────────────────────

def build_agent_context(
    articles: list[ClassifiedArticle],
    categories: list[str] | None = None,
    locations: list[str] | None = None,
    sectors: list[str] | None = None,
    max_articles: int = 8,
    min_importance: float = 30.0,
) -> list[dict]:
    """
    Build the compact article list passed to an LLM agent.
    Filters, ranks, and strips to only what the agent needs.
    Returns a minimal dict per article — not the full ClassifiedArticle.
    """
    filtered = [a for a in articles if a["importance"] >= min_importance]

    if categories:
        filtered = filter_by_category(filtered, categories)
    if locations:
        filtered = filter_by_location(filtered, locations)
    if sectors:
        filtered = filter_by_sector(filtered, sectors)

    ranked = top_n(filtered, max_articles)

    return [
        {
            "title":       a["title"],
            "category":    a["category"],
            "sub_category":a["sub_category"],
            "severity":    a["severity"],
            "importance":  a["importance"],
            "actors":      a["actors"][:4],
            "locations":   a["locations"][:4],
            "sectors":     a["sectors"],
            "source":      a["source"],
        }
        for a in ranked
    ]


# ─── Quick smoke test ─────────────────────────────────────────────────────────

if __name__ == "__main__":
    test_articles = [
        {
            "title": "Iran fires ballistic missiles at US Navy vessels in Strait of Hormuz",
            "description": "IRGC launched multiple ballistic missiles targeting US destroyer in Persian Gulf",
            "source_domain": "reuters.com",
            "published_at": datetime.now(timezone.utc).isoformat(),
            "url": "https://reuters.com/test1",
        },
        {
            "title": "Iran fires ballistic missiles toward US fleet near Hormuz",
            "description": "Second salvo of missiles launched as tensions escalate",
            "source_domain": "apnews.com",
            "published_at": datetime.now(timezone.utc).isoformat(),
            "url": "https://apnews.com/test2",
        },
        {
            "title": "OFAC imposes new sanctions on Iranian oil exports, freezes assets",
            "description": "Treasury Department designates 12 Iranian entities under energy sanctions",
            "source_domain": "wsj.com",
            "published_at": datetime.now(timezone.utc).isoformat(),
            "url": "https://wsj.com/test3",
        },
        {
            "title": "Russia Wagner Group advances in eastern Ukraine, shelling reported",
            "description": "Artillery fire reported in Donbas region as Russian troops advance",
            "source_domain": "bbc.com",
            "published_at": datetime.now(timezone.utc).isoformat(),
            "url": "https://bbc.com/test4",
        },
        {
            "title": "LockBit ransomware attacks US hospital network, patient data stolen",
            "description": "Ransomware gang claims responsibility for breach affecting 2 million records",
            "source_domain": "theguardian.com",
            "published_at": datetime.now(timezone.utc).isoformat(),
            "url": "https://theguardian.com/test5",
        },
        {
            "title": "IMF warns of sovereign default risk as currency collapses in Venezuela",
            "description": "Hyperinflation reaches 400% as capital controls tighten",
            "source_domain": "ft.com",
            "published_at": datetime.now(timezone.utc).isoformat(),
            "url": "https://ft.com/test6",
        },
    ]

    results = classify_batch(test_articles)

    print("=" * 70)
    print("CLASSIFIED ARTICLES (ranked by importance)")
    print("=" * 70)
    for r in results:
        print(f"\n[{r['importance']:5.1f}] {r['severity'].upper():8s} | {r['category']:12s} / {r['sub_category']}")
        print(f"  Title    : {r['title'][:75]}")
        print(f"  Source   : {r['source']} (tier {r['source_tier']})")
        print(f"  Actors   : {', '.join(r['actors'][:4]) or 'none'}")
        print(f"  Locations: {', '.join(r['locations'][:4]) or 'none'}")
        print(f"  Sectors  : {', '.join(r['sectors'])}")
        print(f"  Tags     : {', '.join(r['tags'][:6])}")

    print("\n" + "=" * 70)
    print("AGENT CONTEXT (macro agent — economic + energy categories)")
    print("=" * 70)
    ctx = build_agent_context(results, categories=["economic", "energy", "sanctions"], max_articles=5)
    for item in ctx:
        print(f"  [{item['importance']:5.1f}] {item['severity'].upper():8s} {item['title'][:60]}")
