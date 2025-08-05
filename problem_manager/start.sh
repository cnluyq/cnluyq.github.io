#!/bin/bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
echo "-----------------------------------"
echo "Service at http://0.0.0.0:8000"
echo "Press Ctrl+C to stop"
echo "-----------------------------------"
python manage.py runserver 0.0.0.0:8000