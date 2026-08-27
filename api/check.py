from flask import Flask, request, jsonify
import lyricsgenius
import re
import hashlib

app = Flask(__name__)

GENIUS_TOKEN = "5fMiLqzrNMCnLai6U8JX5YtP1xg7oaJsdSn8S52TEF6JpLCedifYnSoNpOzaflqE"
genius = lyricsgenius.Genius(GENIUS_TOKEN)
genius.verbose = False

BAD_WORDS = {
    "бля", "блять", "сука", "суки", "нахер", "нахуй", "хуй", "хуя", "хуе", "хую",
    "пизда", "пиздец", "пизды", "ебать", "ебал", "ебаный", "заебал", "ублюдок",
    "гондон", "гандон", "мразь", "пидор", "пидорас", "дебил", "идиот", "даун",
    "жопа", "говно", "залупа",
    "puta", "puto", "mierda", "cabron", "joder", "coño", "pendejo", "verga", "pinche",
    "caralho", "porra", "merda", "foder", "foda", "buceta", "viado", "bicha"
}

def analyze_lyrics(lyrics):
    if not lyrics:
        return {"status": "no_lyrics", "verdict": "Текст не найден", "is_clean": None, "bad_words": []}
    words = re.findall(r'\b\w+\b', lyrics.lower())
    bad = list(set(w for w in words if w in BAD_WORDS))
    if not bad:
        return {"status": "clean", "verdict": "Чисто", "is_clean": True, "bad_words": []}
    return {"status": "dirty", "verdict": "Грязь", "is_clean": False, "bad_words": bad}

@app.route('/api/check', methods=['POST'])
def check_track():
    data = request.json
    track_name = data.get('track_name', '').strip()
    artist = data.get('artist', '').strip()
    
    if not track_name:
        return jsonify({"success": False, "message": "Введите название!"})
    
    try:
        song = genius.search_song(track_name, artist if artist else None)
        if not song:
            return jsonify({"success": False, "message": "Песня не найдена"})
        
        analysis = analyze_lyrics(song.lyrics)
        score = 10 if analysis['is_clean'] else 6 if len(analysis['bad_words']) <= 2 else 2
        
        return jsonify({
            "success": True,
            "title": song.title,
            "artists": [song.artist],
            "lyrics": song.lyrics,
            "cover_url": song.song_art_image_url or "",
            "lyrics_analysis": analysis,
            "beat_analysis": {"score": 7, "description": "Скоро", "bpm": 120, "style": ""},
            "overall": {"score": round((score + 7) / 2, 1), "verdict": "Проверено", "mood": "🎵"}
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

# Для Vercel
def handler(request, context):
    with app.test_request_context(path=request.path, method=request.method, data=request.body, headers=request.headers):
        return app.full_dispatch_request()
