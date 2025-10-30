import json

# Load JSON
with open("static/data/weeks.json", "r", encoding="utf-8") as f:
    data = json.load(f)

# Update audio paths
for week, vocab_list in data["weeks"].items():
    for item in vocab_list:
        if "audio" in item:
            filename = item["audio"]  # e.g. "audio/nongmiji.mp3"
            item["audio"] = f"/static/{filename}"
        if "sentences" in item:
            for things in item["sentences"]:
                if "audio" in things:
                    filename = things["audio"]  # e.g. "audio/nongmiji.mp3"
                    things["audio"] = f"/static/{filename}"

            

# Save JSON back
with open("static/data/data_updated.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
