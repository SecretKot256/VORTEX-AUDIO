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

GENIUS_TOKEN = os.environ.get("GENIUS_TOKEN", "")

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

def try_lyricsfind(track_name, artist_name=""):
    try:
        url = f"https://api.lyricsfind.com/v1/search?q={track_name}+{artist_name}"
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data and data.get("lyrics"):
                return track_name, artist_name, data["lyrics"], ""
        return None, None, None, None
    except Exception as e:
        print(f"LyricsFind не сработал: {e}")
        return None, None, None, None

# ПОИСК: LYRICS.OVH 
def try_lyrics_ovh(track_name, artist_name=""):
    try:
        url = f"https://api.lyrics.ovh/v1/{artist_name}/{track_name}"
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            data = response.json()
            lyrics = data.get("lyrics", "")
            if lyrics:
                return track_name, artist_name, lyrics, ""
        return None, None, None, None
    except Exception as e:
        print(f"Lyrics.ovh не сработал: {e}")
        return None, None, None, None

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
        for song in data[:10]:  # берём максимум 10 вариантов ну блин, давай деплойся!!!
            results.append({
                "id": song.get("id"),
                "title": song.get("trackName", track_name),
                "artist": song.get("artistName", artist_name),
                "album": song.get("albumName", ""),
                "duration": song.get("duration", 0),
                "instrumental": song.get("instrumental", False),
                "source": "LRCLIB",
                "cover": get_cover_from_itunes(song.get("trackName", track_name), song.get("artistName", artist_name)),
                "preview": get_preview_from_itunes(song.get("trackName", track_name), song.get("artistName", artist_name))
            })
        return results
    except Exception as e:
        print(f"LRCLIB search error: {e}")
        return []

# ===== ПОЛУЧЕНИЕ ТЕКСТА ПО ID ======
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


def get_preview_from_itunes(track_name, artist_name=""):
    try:
        query = f"{track_name} {artist_name}".strip()
        url = "https://itunes.apple.com/search"
        params = {"term": query, "media": "music", "limit": 1}
        response = requests.get(url, params=params, timeout=10)
        if response.status_code == 200:
            results = response.json().get("results", [])
            if results:
                return results[0].get("previewUrl", "")
        return ""
    except Exception:
        return ""

# ===== ПОЛУЧЕНИЕ ОБЛОЖКИ ИЗ ITUNES =====
def get_cover_from_itunes(track_name, artist_name=""):
    try:
        # Формируем поисковый запрос
        query = f"{track_name} {artist_name}".strip()
        url = "https://itunes.apple.com/search"
        params = {
        "term": query,
        "media": "music",
        "limit": 1
        }
                                                                                        
        response = requests.get(url, params=params, timeout=10)
        if response.status_code != 200:
            return ""

        data = response.json()
        results = data.get("results", [])

        if not results:
            return ""
                                                                                                                                                                                        
        # iTunes отдает обложку 100x100, мы меняем на 600x600 (HD)
        artwork = results[0].get("artworkUrl100", "")
        preview_url = results[0].get("previewUrl", "")
        if artwork:
            artwork = artwork.replace("100x100", "600x600")
                                                                                                                                                                                                                                     
        return artwork
    except Exception as e:
        print(f"Ошибка iTunes (обложка): {e}")
        return ""

# ===== СТАРЫЙ GENIUS (оставляем на случай, если Cloudflare отпустит) ======
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
        print("LRCLIB не смог, пробуем Lyrics.ovh...")
        title, artist, lyrics, cover = try_lyrics_ovh(data.get('track_name', ''), data.get('artist', ''))
    if lyrics:
        song = {"title": title, "artist": artist, "lyrics": lyrics}

    if not song:
        print("Lyrics.ovh не смог, пробуем LyricsFind...")
        title, artist, lyrics, cover = try_lyricsfind(data.get('track_name', ''), data.get('artist', ''))
    if lyrics:
        song = {"title": title, "artist": artist, "lyrics": lyrics}

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
        "cover_url": get_cover_from_itunes(song['title'], song['artist']),
        "source": "lrclib",
        "lyrics_analysis": analysis,
        "beat_analysis": {"score": 7, "description": "Бит будет позже", "bpm": 120, "style": ""},
        "overall": {"score": overall, "verdict": overall_verdict, "mood": "🎵"}
    })

# ===== ВХОД ЧЕРЕЗ ЯНДЕКС =====
@app.route('/api/yandex-login', methods=['POST'])
def yandex_login():
    data = request.json
    code = data.get('code')
    
    if not code:
        return jsonify({"success": False, "message": "Нет кода авторизации"}), 400

    # ВСТАВЬ СВОИ КЛЮЧИ СЮДА (потом мы их спрячем в переменные окружения, как с Genius)
    YANDEX_CLIENT_ID = "f1f23a650f6844d49d0dec2dba6ac508"
    YANDEX_CLIENT_SECRET = "923cc8669216492f8ad9843621fbc32b"
    REDIRECT_URI = "https://secretkot256.github.io/VORTEX-AUDIO/auth.html"

    # Меняем код на токен
    token_url = "https://oauth.yandex.ru/token"
    token_data = {
        "grant_type": "authorization_code",
        "code": code,
        "client_id": YANDEX_CLIENT_ID,
        "client_secret": YANDEX_CLIENT_SECRET,
        "redirect_uri": REDIRECT_URI
    }
    
    try:
        response = requests.post(token_url, data=token_data, timeout=10)
        token_json = response.json()
        
        if "access_token" not in token_json:
            return jsonify({"success": False, "message": "Ошибка Яндекса", "details": token_json}), 400
            
        access_token = token_json["access_token"]
        
        # Получаем данные пользователя
        user_info_url = "https://login.yandex.ru/info"
        headers = {"Authorization": f"OAuth {access_token}"}
        user_response = requests.get(user_info_url, headers=headers, timeout=10)
        user_data = user_response.json()
        
        # Создаем или логиним пользователя в нашей базе
        username = user_data.get("login", "yandex_user")
        email = user_data.get("default_email", "")
        avatar = f"https://avatars.yandex.net/get-yapic/{user_data.get('default_avatar_id')}/islands-200" if user_data.get('default_avatar_id') else "default-avatar.png"
        
        users = load_users()
        if username not in users:
            users[username] = {
                "password": "yandex_auth", # Заглушка, так как вход по Яндексу
                "email": email,
                "avatar": avatar,
                "phone": None,
                "notes_balance": 0,
                "free_checks": 1,
                "songs_checked": 0,
                "subscription": "none",
                "created_at": datetime.now().isoformat()
            }
            save_users(users)
        
        return jsonify({
            "success": True,
            "user": {
                "username": username,
                "email": email,
                "avatar": avatar,
                "notes_balance": users[username].get('notes_balance', 0),
                "free_checks": users[username].get('free_checks', 1)
            }
        })
        
    except Exception as e:
        print(f"Ошибка Яндекса: {e}")
        return jsonify({"success": False, "message": "Сервер не смог связаться с Яндексом"}), 500

# ===== API НОВОСТЕЙ (только чтение) =====
@app.route('/api/news', methods=['GET'])
def get_news():
    data = load_news()
    news = sorted(data['news'], key=lambda x: x.get('id', 0), reverse=True)
    return jsonify({"success": True, "news": news})

    # ===== ИИ АНАЛИЗ =====
HF_TOKEN = os.environ.get("HF_TOKEN", "")

def analyze_with_ai(lyrics):
    if not HF_TOKEN or not lyrics:
        return "Для ИИ-анализа нужен токен или текст."
    
    API_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2"
    headers = {"Authorization": f"Bearer {HF_TOKEN}"}
    short_lyrics = lyrics[:1500]
    prompt = f"Проанализируй текст песни. Напиши в 2-3 предложениях, о чём она (тема) и какие эмоции вызывает. Вот текст:\n\n{short_lyrics}"
    payload = {"inputs": prompt, "parameters": {"max_new_tokens": 150}}
    
    try:
        response = requests.post(API_URL, headers=headers, json=payload, timeout=20)
        if response.status_code == 200:
            result = response.json()
            return result[0].get("generated_text", "").replace(prompt, "").strip()
        else:
            print(f"HF error: {response.status_code} - {response.text}")
            return "ИИ сейчас перегружен, попробуй позже."
    except Exception as e:
        print(f"Ошибка ИИ: {e}")
        return "Не удалось получить анализ."

@app.route('/api/ai-analyze', methods=['POST'])
def ai_analyze():
    data = request.json
    lyrics = data.get('lyrics', '')
    
    if not lyrics:
        return jsonify({"success": False, "message": "Нет текста"})
        
    analysis = analyze_with_ai(lyrics)
    return jsonify({"success": True, "ai_analysis": analysis})

# ===== ЗАПУСК =====
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
