from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import os

app = Flask(__name__)
CORS(app)

# Get correct path to centers.json
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
file_path = os.path.join(BASE_DIR, "centers.json")

# Load data safely
try:
    with open(file_path, "r") as f:
        centers = json.load(f)
except Exception as e:
    print("Error loading centers.json:", e)
    centers = []

@app.route("/api/centers", methods=["GET"])
def get_centers():
    location = request.args.get("location")

    if location:
        filtered = [
            c for c in centers
            if location.lower() in c.get("location", "").lower()
        ]
        return jsonify(filtered)

    return jsonify(centers)

@app.route("/")
def home():
    return jsonify({"message": "SafeReach API is running"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)

