from flask import Flask, request, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

# ===== БАЗА ДАННЫХ ПЕСЕН =====
vortex_database = {
    "funk mi camino": {
        "title": "FUNK MI CAMINO",
        "artists": ["Sayfalse", "Junior RCE"],
        "lyrics": "Dale dale mueve el cuerpo\nFunk mi camino funk mi camino\nLa noche es nuestra no hay freno\nBaila conmigo baila conmigo",
        "bpm": 130,
        "style": "Brazilian Funk / Phonk",
        "genre_mood": "energetic"
    },
    "montagem tomada": {
        "title": "MONTAGEM TOMADA",
        "artists": ["MXZI"],
        "lyrics": "Montagem tomada o baile vai começar\nO grave bate forte não dá pra parar\nMontagem tomada a noite é nossa\nSente o fluxo deixa o som te levar",
        "bpm": 120,
        "style": "Slowed + Reverb Phonk",
        "genre_mood": "atmospheric"
    },
    "matadora": {
        "title": "MATADORA",
        "artists": ["DJ Asul"],
        "lyrics": "[Инструментальный трек]",
        "bpm": 130,
        "style": "Aggressive Phonk / Classic",
        "genre_mood": "aggressive"
    }
}

# ===== БИБЛИОТЕКА ПЛОХИХ СЛОВ =====
bad_words = {
    "блять", "сука", "нахер", "хуй", "пизда", "ебать", "ублюдок", "гандон", "мразь",
    "fuck", "shit", "bitch", "asshole", "damn", "bastard", "dick", "pussy", "whore", "slut",
    "puta", "mierda", "cabron", "joder", "coño", "pendejo",
    "caralho", "porra", "merda", "foder", "buceta",
}

# ===== ФУНКЦИИ =====

def normalize_text(text):
    return text.lower().strip()

def find_song(track_name):
    query = normalize_text(track_name)
    if query in vortex_database:
        return vortex_database[query]
    for key, data in vortex_database.items():
        if query in key or key in query:
            return data
    return None

def count_bad_words(lyrics):
    text_lower = normalize_text(lyrics)
    words = text_lower.split()
    found = [w for w in words if w in bad_words]
    return len(found), found

def analyze_lyrics(lyrics):
    if not lyrics or lyrics.startswith("[Инструментальный"):
        return {"score": 10, "verdict": "Инструментальный трек — текст отсутствует.", "bad_words": [], "is_clean": True}
    
    bad_count, bad_list = count_bad_words(lyrics)
    words = lyrics.split()
    total = len(words)
    
    if bad_count == 0:
        return {"score": 10, "verdict": "Текст полностью чистый. Отличная работа!", "bad_words": [], "is_clean": True}
    elif bad_count <= 2:
        return {"score": 7, "verdict": f"Найдено {bad_count} сомнительных слова. В целом приемлемо.", "bad_words": bad_list, "is_clean": False}
    elif bad_count <= 5:
        return {"score": 4, "verdict": f"Обнаружено {bad_count} нецензурных слов. Текст требует внимания.", "bad_words": bad_list, "is_clean": False}
    else:
        return {"score": 1, "verdict": f"Много нецензурной лексики ({bad_count} слов). Не рекомендуется.", "bad_words": bad_list, "is_clean": False}

def analyze_beat(bpm, style):
    if bpm >= 140:
        return {"score": 3, "description": f"Очень быстрый и агрессивный бит ({bpm} BPM). Может вызывать перевозбуждение.", "bpm": bpm, "style": style}
    elif bpm >= 120:
        return {"score": 5, "description": f"Энергичный ритм ({bpm} BPM). Подходит для активного прослушивания.", "bpm": bpm, "style": style}
    elif bpm >= 100:
        return {"score": 7, "description": f"Умеренный темп ({bpm} BPM). Приятный и сбалансированный ритм.", "bpm": bpm, "style": style}
    else:
        return {"score": 8, "description": f"Спокойный ритм ({bpm} BPM). Расслабляющая атмосфера.", "bpm": bpm, "style": style}

def get_overall(lyrics_score, beat_score, mood):
    overall = round((lyrics_score + beat_score) / 2, 1)
    
    if overall >= 8:
        verdict = f"🌟 Отличная песня! ({overall}/10)\nТрек безопасен для прослушивания. Чистый текст и приятный бит."
    elif overall >= 5:
        verdict = f"👍 Хорошая песня ({overall}/10)\nВ целом приемлемо, но есть замечания."
    else:
        verdict = f"🚫 Опасная песня ({overall}/10)\nТрек не рекомендуется. Содержит нецензурную лексику или агрессивный бит."
    
    mood_map = {"energetic": "🎉 Весёлая и энергичная!", "atmospheric": "🌙 Атмосферная и задумчивая.", "aggressive": "💥 Агрессивная и напористая."}
    
    return {"score": overall, "verdict": verdict, "mood": mood_map.get(mood, "🎵 Нейтральное настроение.")}

# ===== API =====

@app.route('/api/check', methods=['POST'])
def check_track():
    data = request.json
    track_name = data.get('track_name', '').strip()
    artist = data.get('artist', '').strip()
    
    if not track_name:
        return jsonify({"success": False, "message": "Введите название трека!"}), 400
    
    song = find_song(track_name)
    
    if not song:
        return jsonify({"success": False, "message": f"Песня '{track_name}' не найдена в базе VORTEX AUDIO."})
    
    lyrics_analysis = analyze_lyrics(song['lyrics'])
    beat_analysis = analyze_beat(song['bpm'], song['style'])
    overall = get_overall(lyrics_analysis['score'], beat_analysis['score'], song['genre_mood'])
    
    return jsonify({
        "success": True,
        "title": song['title'],
        "artists": song['artists'],
        "lyrics": song['lyrics'],
        "lyrics_analysis": lyrics_analysis,
        "beat_analysis": beat_analysis,
        "overall": overall
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)