from flask import Flask, jsonify, render_template, send_from_directory, request
from flask_cors import CORS
import os
import search
#python version 3.9.7
app = Flask(__name__, static_folder='frontend/public')
CORS(app)

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')
    
@app.route('/get_trials', methods=['POST'])
def get_trials():
    query = request.json
    results = search.search_clinical_trials(query['data'], query['num'], query['exact'])
    json = results.to_json(orient='records')
    return jsonify(json)

if __name__ == '__main__':
    app.run(debug=True)