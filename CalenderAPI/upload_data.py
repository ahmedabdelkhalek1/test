import requests
import json

# Base URL for the API server
BASE_URL = "http://127.0.0.1:8000"
# The endpoint for schedules (which represent calendar events)
EVENTS_ENDPOINT = f"{BASE_URL}/schedules"

def add_event(event_data):
    """
    Add an event to the calendar API.
    
    event_data should be a dictionary with keys:
    sid, name, content, category, level, status, creation_time, start_time, end_time, attachments
    """
    headers = {"Content-Type": "application/json"}
    response = requests.post(EVENTS_ENDPOINT, data=json.dumps(event_data), headers=headers)
    
    if response.ok:
        print(f"Event SID {event_data['sid']} added successfully:")
        print(response.json())
    else:
        print(f"Failed to add event SID {event_data['sid']}:")
        print(response.text)

def get_events():
    """
    Retrieve all events from the calendar API.
    """
    response = requests.get(EVENTS_ENDPOINT)
    if response.ok:
        events = response.json()
        print("Current events:")
        for event in events:
            print(event)
    else:
        print("Failed to retrieve events:")
        print(response.text)

def load_and_add_events_from_file(json_file_path):
    """
    Load events from a JSON file and add each to the API.
    """
    try:
        with open(json_file_path, 'r') as file:
            events = json.load(file)
            for event in events:
                # Convert sid to string if needed (depends on API expectations)
                event['sid'] = str(event['sid'])
                # if 'attachments' not in event:
                #     event['attachments'] = "default_attachment.txt"

                add_event(event)
                
    except Exception as e:
        print(f"Error loading or posting events: {e}")

if __name__ == "__main__":
    # Path to your JSON file
    json_file_path = "DummyData.json"
    
    # Load events from file and post to API
    load_and_add_events_from_file(json_file_path)
    
    # Retrieve all events to confirm
    get_events()
