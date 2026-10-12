from flask import Flask, request, jsonify
from flask_cors import CORS
import lyricsgenius
import re
import hashlib
import json
import os
from datetime import datetime
import requests

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"}), 200

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,OPTIONS,DELETE')
    return response

GENIUS_TOKEN = ('xOTPqcMbn0IrFZhLrBUVcDQkFAM6Mo_1u7Bb2uztucPKMcKhkcIuPqgHIYUUMTTB')

BAD_WORDS = {
    "бля", "блять", "сука", "суки", "нахер", "нахуй", "хуй", "хуя", "хуе", "хую",
    "пизда", "пиздец", "пизды", "ебать", "ебал", "ебаный", "заебал", "ублюдок",
    "гондон", "гандон", "мразь", "пидор", "пидорас", "дебил", "идиот", "даун",
    "жопа", "говно", "залупа",
    "puta", "puto", "mierda", "cabron", "joder", "coño", "pendejo", "verga", "pinche",
    "caralho", "porra", "merda", "foder", "foda", "buceta", "viado", "bicha"
}

# ===== ФАЙЛЫ =====
DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'users.json')
NEWS_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'news.json')

def load_users():
    if not os.path.exists(DB_FILE):
        return {}
    try:
        with open(DB_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return {}

def save_users(users):
    with open(DB_FILE, 'w', encoding='utf-8') as f:
        json.dump(users, f, ensure_ascii=False, indent=2)

def load_news():
    if not os.path.exists(NEWS_FILE):
        return {"news": [], "next_id": 1}
    try:
        with open(NEWS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return {"news": [], "next_id": 1}

def save_news(data):
    with open(NEWS_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

# ===== ОЧИСТКА ТЕКСТА ОТ ТАЙМКОДОВ =====
def clean_lyrics(lyrics):
    """Убирает таймкоды вида [00:12.15] из текста."""
    if not lyrics:
        return ""
    # Убираем [MM:SS.xx] и [MM:SS]
    cleaned = re.sub(r'\[\d{1,2}:\d{2}(?:\.\d{1,2})?\]', '', lyrics)
    # Убираем пустые строки
    lines = [line.strip() for line in cleaned.split('\n') if line.strip()]
    return '\n'.join(lines)


# ===== ПОИСК: LRCLIB (список песен) =====
def search_lrclib(track_name, artist_name=""):
    """Ищет список песен через LRCLIB. Возвращает список вариантов."""
    try:
        url = "https://lrclib.net/api/search"
        params = {"track_name": track_name}
        if artist_name:
            params["artist_name"] = artist_name
        
        response = requests.get(url, params=params, timeout=10)
        if response.status_code != 200:
            print(f"LRCLIB search: {response.status_code}")
            return []
        
        data = response.json()
        if not isinstance(data, list):
            return []
        
        results = []
        for song in data[:10]:  # берём максимум 10 вариантов
            results.append({
                "id": song.get("id"),
                "title": song.get("trackName", track_name),
                "artist": song.get("artistName", artist_name),
                "album": song.get("albumName", ""),
                "duration": song.get("duration", 0),
                "instrumental": song.get("instrumental", False),
                "source": "LRCLIB"
            })
        
        return results
    except Exception as e:
        print(f"LRCLIB search error: {e}")
        return []


# ===== ПОЛУЧЕНИЕ ТЕКСТА ПО ID =====
def get_lyrics_by_id(song_id):
    """Получает текст песни по ID из LRCLIB."""
    try:
        url = f"https://lrclib.net/api/get/{song_id}"
        response = requests.get(url, timeout=10)
        
        if response.status_code != 200:
            print(f"LRCLIB get: {response.status_code}")
            return None
        
        data = response.json()
        lyrics = data.get("plainLyrics") or data.get("syncedLyrics", "")
        
        if lyrics:
            lyrics = clean_lyrics(lyrics)
        
        return {
            "title": data.get("trackName", ""),
            "artist": data.get("artistName", ""),
            "album": data.get("albumName", ""),
            "lyrics": lyrics or "",
            "instrumental": data.get("instrumental", False)
        }
    except Exception as e:
        print(f"LRCLIB get error: {e}")
        return None


# ===== СТАРЫЙ GENIUS (оставляем на случай, если Cloudflare отпустит) =====
def try_genius(track_name, artist_name=""):
    """Ищет текст через Genius. Возвращает (title, artist, lyrics, cover) или (None, None, None, None)."""
    try:
        genius = lyricsgenius.Genius(GENIUS_TOKEN)
        genius.verbose = False
        genius.remove_section_headers = True
        genius.skip_non_songs = True
        genius.timeout = 10
        
        song = genius.search_song(track_name, artist_name if artist_name else None)
        if song:
            lyrics = song.lyrics
            lines = lyrics.split('\n')
            if lines and 'lyrics' in lines[0].lower():
                lines = lines[1:]
            lyrics = '\n'.join(lines).strip()
            return song.title, song.artist, lyrics, song.song_art_image_url
        return None, None, None, None
    except Exception as e:
        print(f"Genius не сработал: {e}")
        return None, None, None, None

def analyze_lyrics(lyrics):
    if not lyrics:
        return {"status": "no_lyrics", "verdict": "Текст не найден", "is_clean": None, "bad_words": []}
    if lyrics.strip().startswith("[Инструментальный"):
        return {"status": "instrumental", "verdict": "Инструментал", "is_clean": True, "bad_words": []}
    words = re.findall(r'\b\w+\b', lyrics.lower())
    bad = list(set(w for w in words if w in BAD_WORDS))
    if not bad:
        return {"status": "clean", "verdict": "Чисто", "is_clean": True, "bad_words": []}
    return {"status": "dirty", "verdict": "Грязь", "is_clean": False, "bad_words": bad}

# ===== API АУТЕНТИФИКАЦИИ =====
@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()
    email = data.get('email', '').strip()
    
    if not username or not password:
        return jsonify({"success": False, "message": "Заполните все поля!"})
    
    users = load_users()
    
    if username in users:
        return jsonify({"success": False, "message": "Пользователь уже существует!"})
    
    hashed = hashlib.sha256(password.encode()).hexdigest()
    users[username] = {
        "password": hashed,
        "email": email,
        "avatar": "default-avatar.png",
        "phone": None,
        "notes_balance": 0,
        "free_checks": 1,
        "songs_checked": 0,
        "subscription": "none",
        "created_at": datetime.now().isoformat()
    }
    save_users(users)
    
    return jsonify({"success": True, "message": "Регистрация успешна!"})

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()
    
    hashed = hashlib.sha256(password.encode()).hexdigest()
    users = load_users()
    
    if username in users and users[username]['password'] == hashed:
        u = users[username]
        return jsonify({"success": True, "user": {
            "username": username,
            "email": u.get('email', ''),
            "avatar": u.get('avatar', 'default-avatar.png'),
            "notes_balance": u.get('notes_balance', 0),
            "free_checks": u.get('free_checks', 1),
            "songs_checked": u.get('songs_checked', 0),
            "subscription": u.get('subscription', 'none')
        }})
    return jsonify({"success": False, "message": "Неверный логин или пароль!"})

# ===== API ПОИСКА СПИСКА ПЕСЕН =====
@app.route('/api/search', methods=['POST'])
def search_songs():
    data = request.json
    track_name = data.get('track_name', '').strip()
    artist = data.get('artist', '').strip()
    
    if not track_name:
        return jsonify({"success": False, "message": "Введите название трека!"}), 400
    
    results = search_lrclib(track_name, artist)
    
    if not results:
        return jsonify({"success": False, "message": "Ничего не найдено", "results": []})
    
    return jsonify({"success": True, "results": results})


# ===== API ПОЛУЧЕНИЯ ТЕКСТА ПО ID =====
@app.route('/api/check-by-id', methods=['POST'])
def check_by_id():
    data = request.json
    song_id = data.get('song_id')
    username = data.get('username', '').strip()
    
    if not song_id:
        return jsonify({"success": False, "message": "Не указан ID песни"}), 400
    
    song = get_lyrics_by_id(song_id)
    
    if not song:
        return jsonify({"success": False, "message": "Не удалось получить текст"})
    
    # Анализируем текст
    analysis = analyze_lyrics(song['lyrics'])
    
    # Оценки
    if analysis['status'] == 'instrumental':
        lscore = 10
    elif analysis['is_clean']:
        lscore = 10
    elif len(analysis['bad_words']) <= 2:
        lscore = 6
    else:
        lscore = 2
    
    overall = round((lscore + 7) / 2, 1)
    overall_verdict = f"🌟 Отлично! ({overall}/10)" if overall >= 8 else f"👍 Хорошо ({overall}/10)" if overall >= 5 else f"🚫 Плохо ({overall}/10)"
    
    # Обновляем счётчик пользователя
    if username:
        users = load_users()
        if username in users:
            users[username]['songs_checked'] = users[username].get('songs_checked', 0) + 1
            save_users(users)
    
    return jsonify({
        "success": True,
        "title": song['title'],
        "artists": [song['artist']],
        "lyrics": song['lyrics'],
        "cover_url": "",
        "source": "lrclib",
        "lyrics_analysis": analysis,
        "beat_analysis": {"score": 7, "description": "Бит будет позже", "bpm": 120, "style": ""},
        "overall": {"score": overall, "verdict": overall_verdict, "mood": "🎵"}
    })

# ===== API НОВОСТЕЙ (только чтение) =====
@app.route('/api/news', methods=['GET'])
def get_news():
    data = load_news()
    news = sorted(data['news'], key=lambda x: x.get('id', 0), reverse=True)
    return jsonify({"success": True, "news": news})

# ===== ЗАПУСК =====
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
