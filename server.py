from flask import Flask, jsonify, request
from flask_cors import CORS
import json

app = Flask(__name__)
CORS(app)

# Load centers data
with open("centers.json", "r") as f:
    centers = json.load(f)

@app.route("/api/centers", methods=["GET"])
def get_centers():
    location = request.args.get("location")

    if location:
        filtered = [
            c for c in centers
            if location.lower() in c["location"].lower()
        ]
        return jsonify(filtered)

    return jsonify(centers)


@app.route("/")
def home():
    return jsonify({"message": "SafeReach API is running"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)

