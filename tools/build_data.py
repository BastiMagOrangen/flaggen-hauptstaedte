"""Builds data/countries.json (German names) and public/flags/*.png.
Sources: mledoze/countries (ODbL), Wikidata (capital labels), flagcdn.com (flags).
Usage: python tools/build_data.py  (run from project root)"""
import json, os, urllib.parse, urllib.request

UA = {"User-Agent": "flag-learn-app/0.1 (personal project)"}
SPARQL = """SELECT ?cca2 ?capLabel WHERE {
  ?c wdt:P297 ?cca2 . ?c wdt:P36 ?cap .
  SERVICE wikibase:label { bd:serviceParam wikibase:language "de,en". } }"""

def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60).read()

src = json.loads(get("https://raw.githubusercontent.com/mledoze/countries/master/countries.json"))
q = urllib.parse.urlencode({"query": SPARQL, "format": "json"})
rows = json.loads(get("https://query.wikidata.org/sparql?" + q))["results"]["bindings"]
caps = {}
for r in rows:
    names = caps.setdefault(r["cca2"]["value"], [])
    if r["capLabel"]["value"] not in names:
        names.append(r["capLabel"]["value"])

os.makedirs("data", exist_ok=True)
os.makedirs("public/flags", exist_ok=True)
out = []
for c in src:
    code = c["cca2"]
    # shortcut: several capitals (e.g. ZA) become one answer string, upgrade to accept each separately.
    capital = " / ".join(caps[code]) if code in caps else None
    out.append({"code": code, "name": c["translations"]["deu"]["common"], "capital": capital,
                "region": c["region"], "independent": bool(c.get("independent"))})
    path = f"public/flags/{code.lower()}.png"
    if not os.path.exists(path):
        open(path, "wb").write(get(f"https://flagcdn.com/w320/{code.lower()}.png"))
out.sort(key=lambda x: x["name"])
json.dump(out, open("data/countries.json", "w", encoding="utf8"), ensure_ascii=False, indent=1)

json.dump([o["code"].lower() for o in out], open("public/flags/list.json", "w"))  # precache list for sw.js
assert len(out) == 250 and all(o["name"] for o in out)
print("countries:", len(out), "| without capital:", [o["code"] for o in out if not o["capital"]])
