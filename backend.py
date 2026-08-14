from flask import Flask, request, jsonify
from flask_cors import CORS
import lyricsgenius
import re
import sqlite3
import hashlib

# Flask приложение ДОЛЖНО быть создано первым
app = Flask(__name__)
CORS(app)

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

# База данных
def init_db():
    conn = sqlite3.connect('users.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS users
        (id INTEGER PRIMARY KEY, username TEXT UNIQUE, password TEXT, email TEXT,
         avatar TEXT DEFAULT 'default-avatar.png', phone TEXT, notes_balance INTEGER DEFAULT 0,
         free_checks INTEGER DEFAULT 3, songs_checked INTEGER DEFAULT 0, subscription TEXT DEFAULT 'none')''')
    conn.commit()
    conn.close()

init_db()

# Функции
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

# API
@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()
    email = data.get('email', '').strip()
    
    if not username or not password:
        return jsonify({"success": False, "message": "Заполните все поля!"})
    
    hashed = hashlib.sha256(password.encode()).hexdigest()
    
    try:
        conn = sqlite3.connect('users.db')
        c = conn.cursor()
        c.execute("INSERT INTO users (username, password, email) VALUES (?, ?, ?)", 
                  (username, hashed, email))
        conn.commit()
        conn.close()
        return jsonify({"success": True, "message": "Регистрация успешна!"})
    except sqlite3.IntegrityError:
        return jsonify({"success": False, "message": "Пользователь уже существует!"})

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()
    
    hashed = hashlib.sha256(password.encode()).hexdigest()
    
    conn = sqlite3.connect('users.db')
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE username=? AND password=?", (username, hashed))
    user = c.fetchone()
    conn.close()
    
    if user:
        return jsonify({"success": True, "user": {
            "username": user[1], "email": user[3], "avatar": user[4],
            "notes_balance": user[6], "free_checks": user[7], 
            "songs_checked": user[8], "subscription": user[9]
        }})
    return jsonify({"success": False, "message": "Неверный логин или пароль!"})

@app.route('/api/check', methods=['POST'])
def check_track():
    data = request.json
    track_name = data.get('track_name', '').strip()
    artist = data.get('artist', '').strip()
    if not track_name:
        return jsonify({"success": False, "message": "Введите название трека!"}), 400
    
    title, artist_name, lyrics, cover_url = search_genius(track_name, artist)
    if not title:
        return jsonify({"success": False, "message": f"'{track_name}' не найдена"})
    
    analysis = analyze_lyrics(lyrics)
    
    if analysis['status'] == 'instrumental':
        lscore, lverdict = 10, "Инструментальный трек"
    elif analysis['is_clean']:
        lscore, lverdict = 10, "Текст чистый!"
    elif len(analysis['bad_words']) <= 2:
        lscore, lverdict = 6, f"Найдено {len(analysis['bad_words'])} плохих слова"
    else:
        lscore, lverdict = 2, f"Много мата ({len(analysis['bad_words'])} слов)"
    
    overall = round((lscore + 7) / 2, 1)
    overall_verdict = f"🌟 Отлично! ({overall}/10)" if overall >= 8 else f"👍 Хорошо ({overall}/10)" if overall >= 5 else f"🚫 Плохо ({overall}/10)"
    
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

if __name__ == '__main__':
    app.run(debug=True, port=5000)