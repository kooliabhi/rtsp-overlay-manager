RTSP Livestream Overlay Management System
A full-stack application developed as a technical assignment for GoNote. This system allows users to play an RTSP livestream, manage real-time draggable/resizable overlays (text and images), and persist settings using MongoDB. 

🚀 Getting Started
1. Prerequisites
Python 3.8+
Node.js & npm
MongoDB Community Server (Running locally on port 27017)

2. Backend Setup
Navigate to the backend folder: cd backend
Create a virtual environment: python -m venv venv
Activate the environment:
Windows: .\venv\Scripts\activate
Mac/Linux: source venv/bin/activate
Install dependencies: pip install flask flask-cors pymongo opencv-python
Run the server: python app.py
The server will run on http://127.0.0.1:5000

3. Frontend Setup
Navigate to the frontend folder: cd frontend
Install dependencies: npm install
Start the application: npm start
The UI will open at http://localhost:3000


📡 API Documentation
The backend provides the following CRUD endpoints for overlay management:
Endpoint,Method,Description
/overlays,GET,Retrieve all saved overlays from MongoDB
/overlays,POST,"Create a new overlay (Type, Content, X, Y, Width, Height)"
/overlays/<id>,PUT,Update position/size after drag or resize
/overlays/<id>,DELETE,Remove an overlay from the database
/video_feed,GET,Streams the converted MJPEG video from the RTSP source


