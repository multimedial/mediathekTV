from flask import Flask, render_template, request, jsonify
import requests

app = Flask(__name__)

MEDIATHEK_API_URL = "https://mediathekviewweb.de/api/query"

@app.route('/', methods=['GET', 'POST'])
def index():
    search_query = ""
    if request.method == 'POST':
        search_query = request.form.get('keyword', '').strip()
    elif request.method == 'GET':
        search_query = request.args.get('keyword', 'Doku').strip()

    return render_template('index.html', search_query=search_query)


@app.route('/api/playlist', methods=['GET'])
def get_playlist():
    search_query = request.args.get('q', '').strip()

    if not search_query:
        return jsonify([])

    # API-Anfrage im exakten MediathekViewWeb-Format
    payload = {
        "queries": [
            {
                "fields": ["title", "topic"],
                "query": search_query
            }
        ],
        "sortBy": "timestamp",
        "sortOrder": "desc",
        "future": False,
        "offset": 0,
        "size": 30
    }

    # Wichtig: Browser-User-Agent mitsenden, damit die API die Anfrage nicht ablehnt
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(MEDIATHEK_API_URL, json=payload, headers=headers, timeout=10)

        # Terminal-Ausgabe zur Fehlersuche
        print(f"API Status Code: {response.status_code}")

        if response.status_code != 200:
            print(f"API Fehler-Antwort: {response.text}")
            return jsonify([])

        data = response.json()
        results = data.get('result', {}).get('results', [])
        print(f"Gefundene Roh-Ergebnisse: {len(results)}")

        playlist = []

        for item in results:
            title = item.get('title', 'Ohne Titel')
            topic = item.get('topic', '')
            channel = item.get('channel', 'Mediathek')

            # Die API liefert die Video-URL oft in 'url_video' oder 'url'
            video_url = item.get('url_video') or item.get('url') or item.get('url_video_low')

            if video_url:
                playlist.append({
                    "title": title,
                    "topic": topic,
                    "channel": channel,
                    "video_url": video_url
                })

        print(f"Gefilterte Playlist-Einträge: {len(playlist)}")
        return jsonify(playlist)

    except Exception as e:
        print(f"Ausnahme/Fehler bei API-Abfrage: {e}")
        return jsonify([])


if __name__ == '__main__':
    app.run(debug=True, port=5000)