import cv2
from flask import Flask, Response, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId

app = Flask(__name__)
# Enable CORS for all routes and origins to prevent Network Errors
CORS(app, resources={r"/*": {"origins": "*"}})

# MongoDB Setup
client = MongoClient("mongodb://localhost:27017")
db = client.rtsp_app
overlays_col = db.overlays

def gen_frames(source_url):
    # Fallback to a stable sample video if the URL is empty
    if not source_url:
        source_url = "https://raw.githubusercontent.com/intel-iot-devkit/sample-videos/master/person-bicycle-car-detection.mp4"
    
    cap = cv2.VideoCapture(source_url)
    
    if not cap.isOpened():
        print(f"Error: Unable to open source {source_url}")
        return

    while True:
        success, frame = cap.read()
        if not success:
            # For static video files, loop back to the first frame
            if "rtsp" not in source_url.lower():
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                continue
            else:
                break
        
        # Encode the frame as a JPEG image
        ret, buffer = cv2.imencode('.jpg', frame)
        if not ret: continue
        
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
    
    cap.release()

@app.route('/video_feed')
def video_feed():
    # Dynamically grab the URL from the request parameters
    url = request.args.get('url', '')
    return Response(gen_frames(url), mimetype='multipart/x-mixed-replace; boundary=frame')

# CRUD APIs for Overlays
@app.route('/overlays', methods=['GET', 'POST', 'OPTIONS'])
def handle_overlays():
    if request.method == 'OPTIONS': return jsonify({"status":"ok"}), 200
    if request.method == 'POST':
        data = request.json
        res = overlays_col.insert_one(data)
        return jsonify({"_id": str(res.inserted_id)}), 201
    
    overlays = list(overlays_col.find())
    for o in overlays: o['_id'] = str(o['_id'])
    return jsonify(overlays)

@app.route('/overlays/<id>', methods=['PUT', 'DELETE', 'OPTIONS'])
def update_delete_overlay(id):
    if request.method == 'OPTIONS': return jsonify({"status":"ok"}), 200
    if request.method == 'DELETE':
        overlays_col.delete_one({"_id": ObjectId(id)})
        return '', 204
    
    data = request.json
    if '_id' in data: del data['_id']
    overlays_col.update_one({"_id": ObjectId(id)}, {"$set": data})
    return jsonify({"status": "updated"})

if __name__ == "__main__":
    app.run(debug=True, port=5000, use_reloader=False)