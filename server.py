"""
SafeReach — GBV Support Finder
Flask API server with caching, rate limit handling, and security headers.
"""

import os
import time
import logging
from flask import Flask, jsonify, request
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── Config ──────────────────────────────────
API_KEY  = os.environ.get("RAPIDAPI_KEY", "68ba2a96e3msh69a4973216ca155p1562f4jsnf04bcad350f9")
API_HOST = "africa-health-facilities-api1.p.rapidapi.com"
BASE_URL = f"https://{API_HOST}/api/v1"

HEADERS = {
    "x-rapidapi-key":  API_KEY,
    "x-rapidapi-host": API_HOST,
}

# ── Simple In-Memory Cache ───────────────────
_cache: dict = {}
CACHE_TTL = 300  # 5 minutes

def cache_get(key):
    entry = _cache.get(key)
    if entry and (time.time() - entry["ts"]) < CACHE_TTL:
        return entry["data"]
    return None

def cache_set(key, data):
    _cache[key] = {"data": data, "ts": time.time()}

# ── Security Headers ─────────────────────────
@app.after_request
def set_headers(response):
    response.headers["X-Content-Type-Options"]    = "nosniff"
    response.headers["X-Frame-Options"]           = "DENY"
    response.headers["X-XSS-Protection"]          = "1; mode=block"
    response.headers["Referrer-Policy"]           = "strict-origin-when-cross-origin"
    return response

# ── Health check ─────────────────────────────
@app.route("/health")
def health():
    return jsonify({"status": "ok", "service": "SafeReach API"}), 200

# ── Get all facilities ────────────────────────
@app.route("/api/centers")
def get_centers():
    country = request.args.get("country", "Kenya")
    limit   = min(int(request.args.get("limit", 50)), 100)
    page    = request.args.get("page", 1)

    cache_key = f"centers:{country}:{limit}:{page}"
    cached = cache_get(cache_key)
    if cached:
        logger.info("Cache HIT: %s", cache_key)
        return jsonify(cached)

    try:
        url = f"{BASE_URL}/search"
        params = {"country": country, "limit": limit, "page": page}
        resp = requests.get(url, headers=HEADERS, params=params, timeout=10)
        resp.raise_for_status()

        data = resp.json()
        cache_set(cache_key, data)
        logger.info("Fetched %d facilities", len(data.get("data", data) if isinstance(data, dict) else data))
        return jsonify(data)

    except requests.exceptions.Timeout:
        logger.error("API timeout")
        return jsonify({"error": "External API timed out. Please try again."}), 504

    except requests.exceptions.HTTPError as e:
        logger.error("HTTP error: %s", e)
        return jsonify({"error": f"API returned {e.response.status_code}"}), 502

    except Exception as e:
        logger.error("Unexpected error: %s", e)
        return jsonify({"error": "Failed to fetch facilities"}), 500

# ── Get single facility ───────────────────────
@app.route("/api/facility/<facility_id>")
def get_facility(facility_id):
    # Basic input sanitization
    if not facility_id.replace("-", "").replace("_", "").isalnum():
        return jsonify({"error": "Invalid facility ID"}), 400

    cache_key = f"facility:{facility_id}"
    cached = cache_get(cache_key)
    if cached:
        logger.info("Cache HIT: %s", cache_key)
        return jsonify(cached)

    try:
        url  = f"{BASE_URL}/facility/{facility_id}"
        resp = requests.get(url, headers=HEADERS, timeout=10)
        resp.raise_for_status()

        data = resp.json()
        cache_set(cache_key, data)
        return jsonify(data)

    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 404:
            return jsonify({"error": "Facility not found"}), 404
        return jsonify({"error": f"API error {e.response.status_code}"}), 502

    except Exception as e:
        logger.error("Facility fetch error: %s", e)
        return jsonify({"error": "Failed to fetch facility"}), 500

# ── Search facilities ─────────────────────────
@app.route("/api/search")
def search_facilities():
    query   = request.args.get("q", "").strip()
    country = request.args.get("country", "Kenya")
    limit   = min(int(request.args.get("limit", 20)), 50)

    if not query:
        return jsonify({"error": "Query parameter 'q' is required"}), 400

    try:
        url  = f"{BASE_URL}/search"
        params = {"search": query, "country": country, "limit": limit}
        resp = requests.get(url, headers=HEADERS, params=params, timeout=10)
        resp.raise_for_status()
        return jsonify(resp.json())

    except Exception as e:
        logger.error("Search error: %s", e)
        return jsonify({"error": "Search failed"}), 500

# ── Entry Point ──────────────────────────────
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3000))
    debug = os.environ.get("FLASK_ENV", "production") == "development"
    logger.info("Starting SafeReach API on port %d", port)
    app.run(host="0.0.0.0", port=port, debug=debug)
