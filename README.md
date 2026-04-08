Here's the link to access the application - https://tripplem.tech
This is my demo video link - https://www.loom.com/share/b8628decf8364ca8a3b9e45110c7de23

======================================
GBV SUPPORT FINDER (Kenya)
======================================

This project is a GBV Support Finder system that uses a Flask-based REST API to serve support center data stored in a JSON file. The frontend interacts with the API using JavaScript fetch requests and also uses the browser Geolocation API to help users find nearby support services.

This application helps users locate gbv support services including:
- Medical Centers.
- Legal aid services.
- Shelters.
- Counselling centers.
The users can search by location or county to find nearby support services.

REST API was built by Flask and I also used Geolocation support. The users can service type by Medical, Legal Aid, Counselling, Shelter.

## API used
I used a custom-built REST API for this project.

## Files present
1. centers.json - It has all the data custom built by REST API.
2. server.py - This uses python and supports the backend part of the application.
3. index.html - This is part of the frontend that basically structures the contents of the webpage.
4. styles.css - This styles the webpage appearance making it interactive.
5. script.js - This uses Javascript to make sure the whole front end is functional and also connects the frontend and backend parts of the application.

To make sure the app is running smoothly, you first run the backend part of it "python3 server.py" then you run "https://tripplem.tech" on your browser and you can proceed using the application smoothly. I'll leave it running on port 5000 for easier usage.

