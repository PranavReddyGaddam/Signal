"""
Map layer data router — live geo-features for each map layer.

Verified live sources (tested, no API key required):
  - Conflict:   GDELT DOC API — articles from last 6h, geolocated by sourcecountry
  - Climate:    USGS M4.5+ earthquakes (past 7 days) + NASA FIRMS active fires (24h)
  - Cyber:      GDELT DOC API — cyber/ransomware/breach articles, last 12h
  - Sanctions:  GDELT DOC API — sanctions/embargo articles, last 24h + authoritative static

Infrastructure (inherently stable, updated when routes change):
  - Pipelines, Cables, Minerals, Economic Centers, Data Centers
"""

import asyncio
import csv
import io
import logging
import math
from datetime import datetime, timezone, timedelta

import httpx
from fastapi import APIRouter, Query

router = APIRouter()
log = logging.getLogger(__name__)

_TIMEOUT = 20

# ─── Country name → centroid coords ──────────────────────────────────────────
# Used to geolocate GDELT articles by sourcecountry field
COUNTRY_COORDS: dict[str, tuple[float, float]] = {
    "Afghanistan": (33.9, 67.7), "Albania": (41.2, 20.2), "Algeria": (28.0, 2.6),
    "Angola": (-11.2, 17.9), "Argentina": (-38.4, -63.6), "Armenia": (40.1, 45.0),
    "Australia": (-25.3, 133.8), "Austria": (47.5, 14.6), "Azerbaijan": (40.1, 47.6),
    "Bahrain": (26.0, 50.6), "Bangladesh": (23.7, 90.4), "Belarus": (53.7, 28.0),
    "Belgium": (50.5, 4.5), "Bolivia": (-16.3, -63.6), "Brazil": (-14.2, -51.9),
    "Bulgaria": (42.7, 25.5), "Burma": (21.9, 95.9), "Myanmar": (21.9, 95.9),
    "Cameroon": (7.4, 12.4), "Canada": (56.1, -106.3), "Central African Republic": (6.6, 20.9),
    "Chad": (15.5, 18.7), "Chile": (-35.7, -71.5), "China": (35.9, 104.2),
    "Colombia": (4.6, -74.3), "Congo": (-4.0, 21.8), "Croatia": (45.1, 15.2),
    "Cuba": (21.5, -79.5), "Czech Republic": (49.8, 15.5), "Denmark": (56.3, 9.5),
    "Djibouti": (11.8, 42.6), "Dominican Republic": (18.7, -70.2),
    "Egypt": (26.8, 30.8), "Eritrea": (15.2, 39.8), "Ethiopia": (9.1, 40.5),
    "Finland": (61.9, 25.7), "France": (46.2, 2.2), "Gabon": (-0.8, 11.6),
    "Georgia": (42.3, 43.4), "Germany": (51.2, 10.4), "Ghana": (7.9, -1.0),
    "Greece": (39.1, 21.8), "Guatemala": (15.8, -90.2), "Guinea": (11.0, -10.9),
    "Haiti": (18.9, -72.3), "Honduras": (15.2, -86.2), "Hungary": (47.2, 19.5),
    "India": (20.6, 78.9), "Indonesia": (-0.8, 113.9), "Iran": (32.4, 53.7),
    "Iraq": (33.2, 43.7), "Ireland": (53.4, -8.2), "Israel": (31.5, 34.8),
    "Italy": (41.9, 12.6), "Japan": (36.2, 138.3), "Jordan": (30.6, 36.2),
    "Kazakhstan": (48.0, 66.9), "Kenya": (-0.0, 37.9), "Kosovo": (42.6, 20.9),
    "Kuwait": (29.3, 47.5), "Kyrgyzstan": (41.2, 74.8), "Laos": (19.9, 102.5),
    "Latvia": (56.9, 24.6), "Lebanon": (33.9, 35.5), "Liberia": (6.4, -9.4),
    "Libya": (26.3, 17.2), "Lithuania": (55.2, 23.9), "Luxembourg": (49.8, 6.1),
    "Madagascar": (-18.8, 46.9), "Malawi": (-13.3, 34.3), "Malaysia": (4.2, 108.0),
    "Mali": (17.6, -1.7), "Mauritania": (21.0, -10.9), "Mexico": (23.6, -102.6),
    "Moldova": (47.4, 28.4), "Montenegro": (42.7, 19.4), "Morocco": (31.8, -7.1),
    "Mozambique": (-18.7, 35.5), "Namibia": (-22.0, 17.1), "Nepal": (28.4, 84.1),
    "Netherlands": (52.1, 5.3), "New Zealand": (-40.9, 174.9), "Nicaragua": (12.9, -85.2),
    "Niger": (17.6, 8.1), "Nigeria": (9.1, 8.7), "North Korea": (40.3, 127.5),
    "Norway": (60.5, 8.5), "Oman": (21.5, 55.9), "Pakistan": (30.4, 69.3),
    "Palestine": (31.9, 35.2), "Panama": (8.5, -80.8), "Peru": (-9.2, -75.0),
    "Philippines": (12.9, 121.8), "Poland": (51.9, 19.1), "Portugal": (39.4, -8.2),
    "Qatar": (25.4, 51.2), "Romania": (45.9, 24.9), "Russia": (61.5, 105.3),
    "Rwanda": (-1.9, 29.9), "Saudi Arabia": (23.9, 45.1), "Senegal": (14.5, -14.5),
    "Serbia": (44.0, 21.0), "Sierra Leone": (8.5, -11.8), "Somalia": (5.2, 46.2),
    "South Africa": (-30.6, 22.9), "South Korea": (35.9, 127.8),
    "South Sudan": (7.9, 29.7), "Spain": (40.5, -3.7), "Sri Lanka": (7.9, 80.8),
    "Sudan": (12.9, 30.2), "Sweden": (60.1, 18.6), "Switzerland": (46.8, 8.2),
    "Syria": (34.8, 38.9), "Taiwan": (23.7, 120.9), "Tajikistan": (38.9, 71.3),
    "Tanzania": (-6.4, 34.9), "Thailand": (15.9, 100.9), "Turkey": (38.9, 35.2),
    "Turkmenistan": (38.97, 59.6), "Uganda": (1.4, 32.3), "Ukraine": (49.0, 32.0),
    "United Arab Emirates": (23.4, 53.8), "United Kingdom": (55.4, -3.4),
    "United States": (37.1, -95.7), "Uruguay": (-32.5, -55.8),
    "Uzbekistan": (41.4, 63.9), "Venezuela": (6.4, -66.6), "Vietnam": (14.1, 108.3),
    "Yemen": (15.6, 48.5), "Zambia": (-13.1, 27.8), "Zimbabwe": (-20.0, 30.0),
    # Region overrides for common GDELT values
    "Gaza": (31.4, 34.3), "Gaza Strip": (31.4, 34.3),
    "West Bank": (31.9, 35.2), "Kosovo": (42.6, 20.9),
    "Crimea": (45.3, 34.0), "Donbas": (48.4, 38.0),
}

# ─── HTTP helper ──────────────────────────────────────────────────────────────

async def _get(url: str, params: dict | None = None, text: bool = False):
    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT, follow_redirects=True) as c:
            r = await c.get(url, params=params)
            r.raise_for_status()
            return r.text if text else r.json()
    except Exception as e:
        log.warning(f"[map_layers] {url} → {e}")
        return None


# ─── GDELT article fetcher ────────────────────────────────────────────────────

async def _gdelt_articles(query: str, timespan: str = "6h", maxrecords: int = 50) -> list[dict]:
    data = await _get("https://api.gdeltproject.org/api/v2/doc/doc", params={
        "query": f"{query} sourcelang:english",
        "mode": "artlist",
        "maxrecords": maxrecords,
        "format": "json",
        "timespan": timespan,
    })
    if not data or not isinstance(data, dict):
        return []
    return data.get("articles") or []


def _article_to_point(article: dict, severity: str = "elevated") -> dict | None:
    country = article.get("sourcecountry", "")
    coords = COUNTRY_COORDS.get(country)
    if not coords:
        return None
    title = article.get("title", "")[:100]
    seen = article.get("seendate", "")
    # Parse seendate: "20260423T224500Z" → "Apr 23 22:45"
    try:
        dt = datetime.strptime(seen, "%Y%m%dT%H%M%SZ").replace(tzinfo=timezone.utc)
        age_min = int((datetime.now(timezone.utc) - dt).total_seconds() / 60)
        time_str = f"{age_min}m ago" if age_min < 60 else f"{age_min // 60}h ago"
    except Exception:
        time_str = seen[:8] if seen else ""

    return {
        "lat": coords[0] + (hash(title) % 100) / 500,  # tiny jitter so stacked points separate
        "lng": coords[1] + (hash(title[:20]) % 100) / 500,
        "name": title,
        "detail": f"{country} · {time_str}",
        "severity": severity,
        "source": article.get("domain", "GDELT"),
        "url": article.get("url", ""),
        "seendate": seen,
    }


# ─── Conflict layer ───────────────────────────────────────────────────────────

@router.get("/map/conflict")
async def get_conflict_layer():
    """
    GDELT DOC API — conflict/battle/airstrike articles from the last 6 hours.
    Updates every 15 minutes. No API key required.
    """
    articles = await _gdelt_articles(
        query=(
            'airstrike OR "missile strike" OR "artillery" OR "troops killed" '
            'OR "soldiers killed" OR "airstrikes" OR "military offensive" '
            'OR "suicide bombing" OR "IED" OR "shelling"'
        ),
        timespan="6h",
        maxrecords=60,
    )

    features = []
    seen_countries: dict[str, int] = {}

    for art in articles:
        country = art.get("sourcecountry", "")
        if not country or country not in COUNTRY_COORDS:
            continue
        seen_countries[country] = seen_countries.get(country, 0) + 1
        if seen_countries[country] > 4:
            continue  # cap per-country to avoid one conflict drowning the map

        pt = _article_to_point(art, severity="elevated")
        if pt:
            # Upgrade severity for the hottest zones
            if country in ("Ukraine", "Israel", "Gaza", "Gaza Strip", "Yemen", "Russia", "Sudan", "Myanmar"):
                pt["severity"] = "critical"
            features.append(pt)

    return features if features else _conflict_fallback()


def _conflict_fallback():
    return [
        {"lat": 48.4, "lng": 35.0, "name": "Ukraine — Active front line",          "detail": "Ukraine · ongoing", "severity": "critical", "source": "static"},
        {"lat": 31.4, "lng": 34.3, "name": "Gaza — IDF operations",               "detail": "Gaza Strip · ongoing", "severity": "critical", "source": "static"},
        {"lat": 15.6, "lng": 48.5, "name": "Yemen — Houthi strikes",              "detail": "Yemen · ongoing", "severity": "critical", "source": "static"},
        {"lat": 15.6, "lng": 32.5, "name": "Sudan — RSF vs SAF",                  "detail": "Sudan · ongoing", "severity": "critical", "source": "static"},
        {"lat": 21.9, "lng": 95.9, "name": "Myanmar — junta airstrikes",          "detail": "Myanmar · ongoing", "severity": "elevated", "source": "static"},
        {"lat": 5.2,  "lng": 46.2, "name": "Somalia — Al-Shabaab attacks",        "detail": "Somalia · ongoing", "severity": "elevated", "source": "static"},
        {"lat": 17.6, "lng": -1.7, "name": "Mali/Sahel — JNIM insurgency",        "detail": "Mali · ongoing", "severity": "elevated", "source": "static"},
        {"lat": 33.9, "lng": 67.7, "name": "Afghanistan — ISIS-K activity",       "detail": "Afghanistan · ongoing", "severity": "elevated", "source": "static"},
    ]


# ─── Climate layer — USGS earthquakes + NASA FIRMS fires ─────────────────────

@router.get("/map/climate")
async def get_climate_layer():
    """
    USGS M4.5+ earthquakes (past 7 days) + NASA FIRMS active fires (24h, sampled).
    Both are true real-time feeds updated continuously.
    """
    quakes_task = _fetch_usgs_quakes()
    fires_task  = _fetch_nasa_fires()
    quakes, fires = await asyncio.gather(quakes_task, fires_task)
    features = quakes + fires
    return features if features else _climate_fallback()


async def _fetch_usgs_quakes() -> list:
    data = await _get("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson")
    if not data:
        return []
    features = []
    for f in (data.get("features") or []):
        try:
            props = f.get("properties") or {}
            coords = f.get("geometry", {}).get("coordinates") or [0, 0, 0]
            lng, lat = float(coords[0]), float(coords[1])
            mag = float(props.get("mag") or 0)
            place = props.get("place") or "Unknown"
            ts = props.get("time") or 0
            dt = datetime.fromtimestamp(ts / 1000, tz=timezone.utc)
            age_h = (datetime.now(timezone.utc) - dt).total_seconds() / 3600
            time_str = f"{int(age_h)}h ago" if age_h >= 1 else f"{int(age_h*60)}m ago"
            severity = "critical" if mag >= 7.0 else "elevated" if mag >= 5.5 else "normal"
            features.append({
                "lat": lat, "lng": lng,
                "name": f"M{mag:.1f} Earthquake",
                "detail": f"{place} · {time_str}",
                "severity": severity,
                "type": "EQ",
                "source": "USGS",
            })
        except Exception:
            continue
    return features


async def _fetch_nasa_fires() -> list:
    """
    NASA FIRMS VIIRS 24h active fire CSV — clusters nearby detections
    into single map points to keep the layer readable.
    """
    text = await _get(
        "https://firms.modaps.eosdis.nasa.gov/data/active_fire/noaa-20-viirs-c2/csv/J1_VIIRS_C2_Global_24h.csv",
        text=True,
    )
    if not text:
        return []

    try:
        reader = csv.DictReader(io.StringIO(text))
        rows = list(reader)
    except Exception:
        return []

    # Keep only high-confidence detections, cluster by rounding to 2° grid cells
    cells: dict[tuple, list] = {}
    for row in rows:
        if row.get("confidence", "").lower() not in ("high", "n"):
            continue
        try:
            lat = round(float(row["latitude"]) / 2) * 2
            lng = round(float(row["longitude"]) / 2) * 2
            frp = float(row.get("frp") or 0)
            cells.setdefault((lat, lng), []).append(frp)
        except Exception:
            continue

    features = []
    for (lat, lng), frps in cells.items():
        total_frp = sum(frps)
        count = len(frps)
        severity = "critical" if total_frp > 500 else "elevated" if total_frp > 100 else "normal"
        features.append({
            "lat": float(lat),
            "lng": float(lng),
            "name": f"Active Fire Zone ({count} detections)",
            "detail": f"Fire radiative power: {total_frp:.0f} MW · NASA FIRMS 24h",
            "severity": severity,
            "type": "WF",
            "source": "NASA FIRMS",
        })

    # Sort by FRP desc, cap at 80 points to not flood the map
    features.sort(key=lambda x: float(x["detail"].split(":")[1].split("MW")[0]), reverse=True)
    return features[:80]


def _climate_fallback():
    return [
        {"lat": 25.0,  "lng": 67.0,  "name": "Pakistan — Flood risk",        "detail": "Seasonal flood zone · static", "severity": "critical", "type": "FL", "source": "static"},
        {"lat": 13.0,  "lng": 42.0,  "name": "Horn of Africa — Drought",     "detail": "Multi-year drought · static",  "severity": "critical", "type": "DR", "source": "static"},
        {"lat": 37.0,  "lng": 23.0,  "name": "Mediterranean — Fire risk",    "detail": "Seasonal wildfire zone · static","severity": "elevated","type": "WF", "source": "static"},
        {"lat": -30.0, "lng": 150.0, "name": "Eastern Australia — Drought",  "detail": "El Niño drought · static",     "severity": "elevated", "type": "DR", "source": "static"},
    ]


# ─── Cyber layer ──────────────────────────────────────────────────────────────

@router.get("/map/cyber")
async def get_cyber_layer():
    """
    GDELT DOC API — cyber/ransomware/breach articles from the last 12 hours.
    """
    articles = await _gdelt_articles(
        query=(
            'cyberattack OR ransomware OR "data breach" OR "hacked" '
            'OR "malware" OR "cyber espionage" OR "DDoS" OR "phishing" '
            'OR "critical infrastructure attack" OR "CISA"'
        ),
        timespan="12h",
        maxrecords=40,
    )

    features = []
    seen_countries: dict[str, int] = {}

    for art in articles:
        country = art.get("sourcecountry", "")
        if not country or country not in COUNTRY_COORDS:
            continue
        seen_countries[country] = seen_countries.get(country, 0) + 1
        if seen_countries[country] > 3:
            continue
        pt = _article_to_point(art, severity="elevated")
        if pt:
            features.append(pt)

    return features if features else _cyber_fallback()


def _cyber_fallback():
    return [
        {"lat": 55.8, "lng": 37.6,  "name": "Russia — APT28/Cozy Bear",    "detail": "State-sponsored espionage · static", "severity": "critical", "source": "static"},
        {"lat": 39.9, "lng": 116.4, "name": "China — APT41",               "detail": "IP theft, infra targeting · static", "severity": "critical", "source": "static"},
        {"lat": 40.3, "lng": 127.5, "name": "North Korea — Lazarus Group", "detail": "Crypto heists, SWIFT attacks · static","severity": "critical","source": "static"},
        {"lat": 32.4, "lng": 53.7,  "name": "Iran — APT33/34",             "detail": "OT/SCADA energy attacks · static",   "severity": "elevated", "source": "static"},
        {"lat": 37.1, "lng": -95.7, "name": "USA — CISA alert",            "detail": "Critical infra targeting · static",  "severity": "elevated", "source": "static"},
    ]


# ─── Sanctions layer ──────────────────────────────────────────────────────────

@router.get("/map/sanctions")
async def get_sanctions_layer():
    """
    GDELT DOC API — sanctions/embargo/OFAC articles from the last 24 hours,
    merged with an authoritative static baseline of active regimes.
    """
    articles = await _gdelt_articles(
        query=(
            'sanctions OR "sanctioned" OR embargo OR "OFAC" '
            'OR "asset freeze" OR "export controls" OR "trade restrictions" '
            'OR "blacklisted" OR "designated terrorist"'
        ),
        timespan="24h",
        maxrecords=40,
    )

    live_features = []
    seen_countries: dict[str, int] = {}

    for art in articles:
        country = art.get("sourcecountry", "")
        if not country or country not in COUNTRY_COORDS:
            continue
        seen_countries[country] = seen_countries.get(country, 0) + 1
        if seen_countries[country] > 2:
            continue
        pt = _article_to_point(art, severity="elevated")
        if pt:
            pt["source"] = "GDELT/live"
            live_features.append(pt)

    # Static authoritative regimes always shown
    return _sanctions_static() + live_features


def _sanctions_static():
    return [
        {"lat": 32.4, "lng": 53.7,  "name": "Iran",              "detail": "OFAC / EU energy & nuclear sanctions",     "severity": "critical", "source": "OFAC"},
        {"lat": 61.5, "lng": 105.3, "name": "Russia",            "detail": "G7 financial & energy sanctions 2022+",    "severity": "critical", "source": "G7"},
        {"lat": 40.3, "lng": 127.5, "name": "North Korea",       "detail": "UN arms & luxury goods embargo",           "severity": "critical", "source": "UN"},
        {"lat": 12.9, "lng": 30.2,  "name": "Sudan",             "detail": "Arms embargo, targeted sanctions",         "severity": "elevated", "source": "UN"},
        {"lat": 17.6, "lng": 8.1,   "name": "Niger",             "detail": "ECOWAS / US sanctions post-coup",          "severity": "elevated", "source": "ECOWAS"},
        {"lat": 15.6, "lng": 48.5,  "name": "Yemen (Houthis)",   "detail": "US Houthi designation, shipping ban",      "severity": "elevated", "source": "OFAC"},
        {"lat": 21.5, "lng": -79.5, "name": "Cuba",              "detail": "US embargo since 1962",                    "severity": "elevated", "source": "OFAC"},
        {"lat": 33.9, "lng": 35.5,  "name": "Lebanon/Hezbollah", "detail": "US Hezbollah designation, asset freeze",   "severity": "elevated", "source": "OFAC"},
        {"lat": 21.9, "lng": 95.9,  "name": "Myanmar (junta)",   "detail": "US/EU sanctions on military junta",        "severity": "elevated", "source": "OFAC"},
        {"lat": 6.4,  "lng": -66.6, "name": "Venezuela",         "detail": "OFAC oil sector sanctions",                "severity": "elevated", "source": "OFAC"},
    ]


# ─── Infrastructure layers (stable, backend-owned) ───────────────────────────

@router.get("/map/pipelines")
async def get_pipelines_layer():
    return [
        {"name": "Nord Stream (sabotaged)",       "detail": "Russia → Germany — destroyed Sep 2022",        "color": "#ff4400",
         "coords": [[59.5,28.0],[57.0,19.0],[54.8,13.8]]},
        {"name": "TurkStream",                    "detail": "Russia → Turkey → SE Europe (active)",         "color": "#ff6d00",
         "coords": [[45.0,37.5],[41.5,36.0],[41.0,29.0],[42.7,23.3]]},
        {"name": "BTC Pipeline",                  "detail": "Baku → Tbilisi → Ceyhan — 1.2 mb/d",          "color": "#ff9100",
         "coords": [[40.4,49.8],[41.7,44.8],[37.0,36.1]]},
        {"name": "Druzhba Pipeline",              "detail": "Russia → Central Europe — partially cut off",  "color": "#ff4400",
         "coords": [[55.8,37.6],[52.2,21.0],[50.1,14.4],[48.2,16.4]]},
        {"name": "Trans-Saharan Gas Pipeline",    "detail": "Nigeria → Algeria → Europe (proposed)",        "color": "#ff9100",
         "coords": [[6.5,3.4],[13.5,8.0],[24.0,5.0],[28.0,2.5],[36.7,3.0]]},
        {"name": "East Africa Crude (EACOP)",     "detail": "Uganda → Tanzania — under construction",       "color": "#ff9100",
         "coords": [[-0.3,32.6],[-4.0,33.5],[-6.2,39.2]]},
        {"name": "TAPI Pipeline",                 "detail": "Turkmenistan → Afghanistan → India",           "color": "#ff9100",
         "coords": [[38.0,58.4],[35.6,62.2],[31.5,65.5],[25.0,67.0],[28.6,77.2]]},
        {"name": "Southern Gas Corridor",         "detail": "Caspian → Turkey → Italy (Shah Deniz 2)",      "color": "#ff9100",
         "coords": [[40.4,49.8],[41.0,43.0],[41.0,29.0],[38.0,20.0],[41.9,12.5]]},
        {"name": "Power of Siberia",              "detail": "Russia → China — 38 bcm/year",                 "color": "#ff6d00",
         "coords": [[52.3,113.5],[49.0,117.0],[45.0,122.0],[39.9,116.4]]},
        {"name": "Trans-Arabian Pipeline",        "detail": "Saudi Arabia → Mediterranean (historical)",    "color": "#ff6d00",
         "coords": [[26.3,50.1],[28.0,37.0],[31.8,35.9],[33.9,35.5]]},
    ]


@router.get("/map/cables")
async def get_cables_layer():
    return [
        {"name": "SEA-ME-WE 6",    "detail": "Singapore → France — live 2025, 100 Tbps",
         "color": "#2979ff",
         "coords": [[1.3,103.8],[6.9,79.8],[11.6,43.1],[30.1,32.5],[37.0,10.2],[43.3,-8.7],[48.9,2.3]]},
        {"name": "MAREA",          "detail": "Virginia Beach → Bilbao — 160 Tbps (Microsoft/Meta)",
         "color": "#448aff",
         "coords": [[36.9,-76.0],[40.7,-50.0],[43.4,-8.7]]},
        {"name": "2Africa",        "detail": "Circles Africa — Meta consortium, 180 Tbps",
         "color": "#2979ff",
         "coords": [[51.5,-0.1],[28.0,-15.4],[14.7,-17.5],[5.3,-4.0],[-4.3,15.3],
                    [-25.9,32.6],[-33.9,25.6],[1.3,36.8],[11.6,43.1],[23.6,38.0],[30.1,32.5],[36.9,10.2]]},
        {"name": "JUPITER",        "detail": "California → Japan — 60 Tbps (Amazon/SoftBank)",
         "color": "#3d5afe",
         "coords": [[37.8,-122.4],[24.0,145.0],[35.7,139.7]]},
        {"name": "Trans-Pacific (FASTER)", "detail": "Oregon → Japan/Philippines — Google consortium",
         "color": "#5c6bc0",
         "coords": [[45.5,-123.9],[35.7,139.7]]},
        {"name": "PEACE Cable",    "detail": "Pakistan → Kenya → France — South Asia & Africa link",
         "color": "#1565c0",
         "coords": [[24.9,67.1],[11.6,43.1],[1.3,36.8],[-4.0,39.7],[43.3,-8.7],[48.9,2.3]]},
        {"name": "Echo / Bifrost", "detail": "Google/Meta: US → Singapore via Indonesia (2024)",
         "color": "#448aff",
         "coords": [[37.8,-122.4],[21.3,-157.8],[-8.0,115.0],[1.3,103.8]]},
        {"name": "Polar Express",  "detail": "Arctic route — Norway → Japan (proposed)",
         "color": "#7986cb",
         "coords": [[59.9,10.7],[71.0,25.0],[75.0,90.0],[70.0,140.0],[35.7,139.7]]},
    ]


@router.get("/map/minerals")
async def get_minerals_layer():
    return [
        {"lat": -11.2, "lng": 27.5,  "name": "DRC — Cobalt",            "detail": "70% global cobalt — EV batteries, conflict minerals risk", "severity": "critical"},
        {"lat": -29.0, "lng": 26.0,  "name": "South Africa — PGMs",     "detail": "Platinum group metals — catalytic converters, fuel cells", "severity": "elevated"},
        {"lat": 64.0,  "lng": 26.0,  "name": "Finland — Lithium",       "detail": "Largest EU lithium deposit — EV supply chain",            "severity": "normal"},
        {"lat": -23.0, "lng": 134.0, "name": "Australia — Rare Earths", "detail": "Mt Weld — US/EU diversification from China",             "severity": "normal"},
        {"lat": 35.9,  "lng": 104.2, "name": "China — RE Dominance",    "detail": "85% rare earth refining — export restriction risk",       "severity": "critical"},
        {"lat": -14.2, "lng": -51.9, "name": "Brazil — Niobium",        "detail": "92% global niobium — aerospace, steel hardening",        "severity": "normal"},
        {"lat": 38.9,  "lng": 35.2,  "name": "Turkey — Boron",          "detail": "73% global boron reserves — semiconductors",             "severity": "normal"},
        {"lat": 61.5,  "lng": 88.4,  "name": "Russia — Nickel/Palladium","detail": "Norilsk — 11% world nickel, 40% palladium, sanctioned",  "severity": "elevated"},
        {"lat": 17.6,  "lng": 8.1,   "name": "Niger — Uranium",         "detail": "Top-5 uranium producer — post-coup supply risk",         "severity": "critical"},
        {"lat": 17.6,  "lng": -1.7,  "name": "Mali — Gold",             "detail": "3rd African gold producer — junta-held, Wagner presence","severity": "elevated"},
        {"lat": -20.0, "lng": 30.0,  "name": "Zimbabwe — Lithium",      "detail": "Fastest-growing producer — Chinese-owned mines",         "severity": "elevated"},
        {"lat": 1.4,   "lng": 32.3,  "name": "Uganda — Oil",            "detail": "EACOP controversy — Tilenga field development",          "severity": "elevated"},
    ]


@router.get("/map/economic")
async def get_economic_layer():
    return [
        {"lat": 40.7,  "lng": -74.0, "name": "New York",       "detail": "NYSE/NASDAQ — $25T market cap, global reserve hub",        "tier": 1},
        {"lat": 51.5,  "lng": -0.1,  "name": "London",         "detail": "LSE — 43% of global FX trading, Lloyds insurance hub",    "tier": 1},
        {"lat": 35.7,  "lng": 139.7, "name": "Tokyo",          "detail": "JPX — BoJ YCC policy, ¥800T economy",                    "tier": 1},
        {"lat": 22.3,  "lng": 114.2, "name": "Hong Kong",      "detail": "HKEX — RMB offshore hub, national security law impact",   "tier": 1},
        {"lat": 1.3,   "lng": 103.8, "name": "Singapore",      "detail": "SGX — commodity trading, 30% of SE Asian FDI",           "tier": 1},
        {"lat": 50.1,  "lng": 8.7,   "name": "Frankfurt",      "detail": "ECB HQ, Deutsche Börse — EU monetary policy center",     "tier": 1},
        {"lat": 48.9,  "lng": 2.3,   "name": "Paris",          "detail": "Euronext — CAC40, EU financial regulation hub",          "tier": 2},
        {"lat": 37.6,  "lng": -122.4,"name": "San Francisco",  "detail": "Tech IPO/VC hub — $300B+ VC deployed annually",          "tier": 2},
        {"lat": 25.2,  "lng": 55.3,  "name": "Dubai (DIFC)",   "detail": "MENA financial gateway — $6T AUM, crypto hub",           "tier": 2},
        {"lat": -33.9, "lng": 151.2, "name": "Sydney",         "detail": "ASX — AUD reserve currency, Asia-Pacific gateway",       "tier": 2},
        {"lat": 37.6,  "lng": 126.9, "name": "Seoul",          "detail": "KRX — semiconductor supply chain financial hub",         "tier": 2},
        {"lat": 19.1,  "lng": 72.9,  "name": "Mumbai",         "detail": "BSE/NSE — $3.5T market cap, fastest-growing EM",        "tier": 2},
    ]


@router.get("/map/datacenters")
async def get_datacenters_layer():
    return [
        {"lat": 45.5,  "lng": -122.7, "name": "Hillsboro, OR",     "detail": "AWS mega-campus — largest US west coast cluster",         "operator": "AWS"},
        {"lat": 38.9,  "lng": -77.0,  "name": "Ashburn, VA",       "detail": "Data Center Alley — 70% of US internet traffic routes",  "operator": "Multiple"},
        {"lat": 53.4,  "lng": -6.3,   "name": "Dublin",            "detail": "EU hyperscaler hub — Google, Meta, Microsoft, Amazon",   "operator": "FAANG"},
        {"lat": 59.9,  "lng": 10.7,   "name": "Oslo / Nordics",    "detail": "Green-power AI clusters — sub-ambient cooling",          "operator": "Green Mountain"},
        {"lat": 1.3,   "lng": 103.8,  "name": "Singapore",         "detail": "SEA AI hub — moratorium lifted 2024, 1 GW approved",    "operator": "Multiple"},
        {"lat": 22.5,  "lng": 114.1,  "name": "Shenzhen",          "detail": "Huawei/Tencent AI infra — DeepSeek training cluster",    "operator": "Huawei"},
        {"lat": 24.5,  "lng": 54.4,   "name": "Abu Dhabi",         "detail": "G42 / Microsoft $1.5 B AI campus — MENA AI hub",        "operator": "G42/Microsoft"},
        {"lat": -33.9, "lng": 151.2,  "name": "Sydney",            "detail": "AWS / Google APAC expansion — $7 B investment 2024",    "operator": "AWS/Google"},
        {"lat": 50.1,  "lng": 8.7,    "name": "Frankfurt",         "detail": "DE-CIX — EU data sovereignty, GDPR-compliant zone",     "operator": "DE-CIX"},
        {"lat": 35.7,  "lng": 139.7,  "name": "Tokyo",             "detail": "SoftBank/NEC AI infra — ¥10 T Japan AI plan",           "operator": "SoftBank"},
        {"lat": 37.8,  "lng": -122.4, "name": "Santa Clara, CA",   "detail": "NVIDIA GPU cluster — AI research campus",               "operator": "NVIDIA"},
        {"lat": 30.0,  "lng": 31.2,   "name": "Cairo",             "detail": "Africa internet exchange — subsea cable landing hub",   "operator": "RAXIO"},
    ]
