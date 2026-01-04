from flask import Flask, render_template, request, jsonify
import sqlite3
import uuid
from datetime import datetime

app = Flask(__name__)

def get_db():
    return sqlite3.connect("database.db", check_same_thread=False)

def init_db():
    db = get_db()
    db.execute("CREATE TABLE IF NOT EXISTS tourists (id TEXT, name TEXT, phone TEXT)")
    db.execute("CREATE TABLE IF NOT EXISTS locations (id TEXT, lat REAL, lng REAL, time TEXT)")
    db.execute("CREATE TABLE IF NOT EXISTS alerts (id TEXT, type TEXT, time TEXT)")
    db.commit()

init_db()

@app.route("/")
def home():
    return render_template("register.html")

@app.route("/register", methods=["POST"])
def register():
    name = request.form["name"]
    phone = request.form["phone"]
    tourist_id = str(uuid.uuid4())

    db = get_db()
    db.execute("INSERT INTO tourists VALUES (?, ?, ?)", (tourist_id, name, phone))
    db.commit()

    return render_template("tourist.html", tourist_id=tourist_id)

@app.route("/location", methods=["POST"])
def location():
    data = request.json
    db = get_db()
    db.execute(
        "INSERT INTO locations VALUES (?, ?, ?, ?)",
        (data["tourist_id"], data["lat"], data["lng"], datetime.now())
    )
    db.commit()
    return jsonify({"status": "location updated"})

@app.route("/panic", methods=["POST"])
def panic():
    data = request.json
    db = get_db()
    db.execute(
        "INSERT INTO alerts VALUES (?, ?, ?)",
        (data["tourist_id"], "SOS", datetime.now())
    )
    db.commit()
    return jsonify({"status": "SOS sent"})

@app.route("/dashboard")
def dashboard():
    return render_template("dashboard.html")

@app.route("/api/data")
def api_data():
    db = get_db()

    locations = db.execute("""
        SELECT id, lat, lng, time
        FROM locations
        ORDER BY time DESC
        LIMIT 1
    """).fetchall()

    alerts = db.execute("SELECT * FROM alerts").fetchall()

    return jsonify({
        "locations": locations,
        "alerts": alerts
    })

if __name__ == "__main__":
    app.run(debug=True)
