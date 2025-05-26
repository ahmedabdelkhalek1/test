# calendar_extraction.py

from headers_and_imports import *

def extract_calendar_data():
    try:
        response = requests.get(url)
        response.raise_for_status()  
        data = response.json()

        json_data = [dict(zip(keys, item)) for item in data]
        today = datetime.now().date()

        today_meetings_list = []
        for meeting in json_data:
            try:
                start_dt = datetime.strptime(meeting["start_time"], "%Y-%m-%d %H:%M:%S")
                end_dt = datetime.strptime(meeting["end_time"], "%Y-%m-%d %H:%M:%S")

                if start_dt.date() == today:
                    start_str = start_dt.strftime("%Y-%m-%d %H:%M")
                    end_str = end_dt.strftime("%H:%M")
                    name = meeting["name"]
                    location = "Location: "
                    content_lower = meeting["content"].lower()

                    if "zoom" in content_lower:
                        location += f"Online - {meeting['attachments']}"
                    elif "room" in content_lower:
                        room_start = meeting["content"].lower().find("room")
                        room_line = meeting["content"][room_start:].split("\n")[0].strip()
                        location += room_line.capitalize()
                    else:
                        location += "TBD"

                    if "Agenda:" in meeting["content"]:
                        agenda = meeting["content"].split("Agenda:", 1)[1].strip()
                    else:
                        agenda = meeting["content"].strip()

                    agenda = " ".join(agenda.split())

                    formatted = f"{start_str} - {end_str} | {name} | {location} | Agenda: {agenda}"
                    today_meetings_list.append(formatted)

            except Exception as e:
                print(f"Error processing meeting '{meeting.get('name')}' -> {e}")

    except requests.exceptions.RequestException as e:
        print(f"Error fetching data: {e}")

    return today_meetings_list
