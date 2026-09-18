from flask import Flask, request, jsonify
from flask_cors import CORS
import lyricsgenius
import re
import hashlib
import json
import os
from datetime import datetime

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,OPTIONS,DELETE')
    return response

GENIUS_TOKEN = "5fMiLqzrNMCnLai6U8JX5YtP1xg7oaJsdSn8S52TEF6JpLCedifYnSoNpOzaflqE"
genius = lyricsgenius.Genius(GENIUS_TOKEN)
genius.verbose = False
genius.remove_section_headers = True
genius.skip_non_songs = True

BAD_WORDS = {
    "бля", "блять", "сука", "суки", "нахер", "нахуй", "хуй", "хуя", "хуе", "хую",
    "пизда", "пиздец", "пизды", "ебать", "ебал", "ебаный", "заебал", "ублюдок",
    "гондон", "гандон", "мразь", "пидор", "пидорас", "дебил", "идиот", "даун",
    "жопа", "говно", "залупа",
    "puta", "puto", "mierda", "cabron", "joder", "coño", "pendejo", "verga", "pinche",
    "caralho", "porra", "merda", "foder", "foda", "buceta", "viado", "bicha"
}

# ===== АДМИН =====


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

# ===== ФУНКЦИИ =====
def search_genius(track_name, artist_name=""):
    try:
        song = genius.search_song(track_name, artist_name if artist_name else None)
        if song:
            lyrics = song.lyrics
            lines = lyrics.split('\n')
            if lines and 'lyrics' in lines[0].lower():
                lines = lines[1:]
            lyrics = '\n'.join(lines).strip()
            return song.title, song.artist, lyrics, song.song_art_image_url
        return None, None, None, None
    except:
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
        "is_admin": username == ADMIN_USERNAME,
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
            "subscription": u.get('subscription', 'none'),
            "is_admin": u.get('is_admin', username == ADMIN_USERNAME)
        }})
    return jsonify({"success": False, "message": "Неверный логин или пароль!"})

# ===== API ПРОВЕРКИ =====
@app.route('/api/check', methods=['POST'])
def check_track():
    data = request.json
    track_name = data.get('track_name', '').strip()
    artist = data.get('artist', '').strip()
    username = data.get('username', '').strip()
    
    if not track_name:
        return jsonify({"success": False, "message": "Введите название трека!"}), 400
    
    title, artist_name, lyrics, cover_url = search_genius(track_name, artist)
    if not title:
        return jsonify({"success": False, "message": f"'{track_name}' не найдена"})
    
    analysis = analyze_lyrics(lyrics)
    
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
    
    # Обновляем статистику юзера
    if username:
        users = load_users()
        if username in users:
            users[username]['songs_checked'] = users[username].get('songs_checked', 0) + 1
            save_users(users)
    
    return jsonify({
        "success": True,
        "title": title,
        "artists": [artist_name or artist or "Unknown"],
        "lyrics": lyrics or "",
        "cover_url": cover_url or "",
        "source": "genius",
        "lyrics_analysis": analysis,
        "beat_analysis": {"score": 7, "description": "Бит будет позже", "bpm": 120, "style": ""},
        "overall": {"score": overall, "verdict": overall_verdict, "mood": "🎵"}
    })

# ===== API НОВОСТЕЙ (публичное) =====
@app.route('/api/news', methods=['GET'])
def get_news():
    data = load_news()
    # Сортируем: новые сверху
    news = sorted(data['news'], key=lambda x: x.get('id', 0), reverse=True)
    return jsonify({"success": True, "news": news})

# ===== API АДМИНКИ =====
def check_admin(username):
    return username == ADMIN_USERNAME

@app.route('/api/admin/news', methods=['POST'])
def create_news():
    data = request.json
    username = data.get('username', '').strip()
    
    if not check_admin(username):
        return jsonify({"success": False, "message": "Нет доступа"}), 403
    
    title = data.get('title', '').strip()
    content = data.get('content', '').strip()
    tag = data.get('tag', 'Новое').strip()
    
    if not title or not content:
        return jsonify({"success": False, "message": "Заполните все поля!"})
    
    news_data = load_news()
    new_news = {
        "id": news_data['next_id'],
        "title": title,
        "content": content,
        "tag": tag,
        "date": datetime.now().strftime("%d.%m.%Y"),
        "created_at": datetime.now().isoformat()
    }
    news_data['news'].append(new_news)
    news_data['next_id'] += 1
    save_news(news_data)
    
    return jsonify({"success": True, "news": new_news})

@app.route('/api/admin/news/<int:news_id>', methods=['DELETE'])
def delete_news(news_id):
    data = request.json or {}
    username = data.get('username', '').strip()
    
    if not check_admin(username):
        return jsonify({"success": False, "message": "Нет доступа"}), 403
    
    news_data = load_news()
    news_data['news'] = [n for n in news_data['news'] if n['id'] != news_id]
    save_news(news_data)
    
    return jsonify({"success": True})

@app.route('/api/admin/users', methods=['GET'])
def admin_get_users():
    username = request.args.get('username', '').strip()
    
    if not check_admin(username):
        return jsonify({"success": False, "message": "Нет доступа"}), 403
    
    users = load_users()
    user_list = []
    for name, data in users.items():
        user_list.append({
            "username": name,
            "email": data.get('email', ''),
            "notes_balance": data.get('notes_balance', 0),
            "free_checks": data.get('free_checks', 0),
            "songs_checked": data.get('songs_checked', 0),
            "subscription": data.get('subscription', 'none'),
            "created_at": data.get('created_at', '')
        })
    
    return jsonify({"success": True, "users": user_list})

@app.route('/api/admin/stats', methods=['GET'])
def admin_get_stats():
    username = request.args.get('username', '').strip()
    
    if not check_admin(username):
        return jsonify({"success": False, "message": "Нет доступа"}), 403
    
    users = load_users()
    news_data = load_news()
    
    total_checks = sum(u.get('songs_checked', 0) for u in users.values())
    total_users = len(users)
    
    return jsonify({
        "success": True,
        "stats": {
            "total_users": total_users,
            "total_checks": total_checks,
            "total_news": len(news_data['news'])
        }
    })

# ===== АВТОСОЗДАНИЕ АДМИНА =====
def ensure_admin_exists():
    users = load_users()
    changed = False
    if 'Secret' not in users:
        hashed = hashlib.sha256(ADMIN_PASSWORD.encode()).hexdigest()
        users['Secret'] = {
            "password": hashed,
            "email": "admin@vortexaudio.com",
            "avatar": "default-avatar.png",
            "phone": None,
            "notes_balance": 9999,
            "free_checks": 999,
            "songs_checked": 0,
            "subscription": "diamond",
            "is_admin": True,
            "created_at": datetime.now().isoformat()
        }
        changed = True
        print("✅ Админ Secret создан")
    else:
        if not users['Secret'].get('is_admin'):
            users['Secret']['is_admin'] = True
            changed = True
            print("✅ Права админа обновлены")
    if changed:
        save_users(users)

ensure_admin_exists()

import os

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
