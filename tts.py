import json
import os
from dotenv import load_dotenv
from elevenlabs import ElevenLabs
load_dotenv()

client = ElevenLabs(
  api_key=os.getenv("ELEVENLABS_API_KEY"),
)
#client = ElevenLabs(api_key="9e35ea5bf500a502bbd5aee80f0d5184e5314d63463410b3ae6bbd73da6d4bdd")


os.makedirs("audio", exist_ok=True)

with open("static/data/test.json", "r", encoding="utf8") as f:
    data = json.load(f)

for item in data:
    # Streaming generator
    audio_stream = client.text_to_speech.convert(
        voice_id="WkcRFJo38X9XEP8kGExm",  # Mandarin voice
        text=item["text"],
        model_id="eleven_multilingual_v2"  # recommended
    )

    out_path = f"static/audio/{item['filename']}"
    with open(out_path, "wb") as f:
        for chunk in audio_stream:
            f.write(chunk)  # write chunk-by-chunk

    print("Generated:", out_path)
