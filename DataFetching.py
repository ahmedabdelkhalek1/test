import requests
import json

url = "http://localhost:8000/schedules"
keys = [
    "sid",
    "name",
    "content",
    "category",
    "level",
    "status",
    "creation_time",
    "start_time",
    "end_time",
    "attachments"
]
try:
    response = requests.get(url)
    response.raise_for_status()  
    
    data = response.json()

    json_data = [dict(zip(keys, item)) for item in data]

    print("Data:")
    print(json.dumps(json_data, indent=4))


except requests.exceptions.RequestException as e:
    print(f"Error fetching data: {e}")