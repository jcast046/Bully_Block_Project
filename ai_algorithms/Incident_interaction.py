import requests
import json
import csv
import os
from typing import Optional, List, Dict
from bson import ObjectId

# API Base URL
API_BASE_URL = "http://localhost:3001/api"

# Store the authentication token and user ID
AUTH_TOKEN: Optional[str] = None
USER_ID: Optional[str] = None  # This will store the logged-in user's ID

def login() -> None:
    """Prompt user for login credentials and authenticate with the backend."""
    global AUTH_TOKEN, USER_ID
    email: str = input("Enter your email: ")
    password: str = input("Enter your password: ")

    response = requests.post(f"{API_BASE_URL}/users/login", json={"email": email, "password": password})

    if response.status_code == 200:
        data = response.json()
        AUTH_TOKEN = data.get("token")
        USER_ID = data.get("user", {}).get("_id")  # Store logged-in user ID
        print("\n✅ Login successful!")
    else:
        print("\n❌ Login failed:", response.json().get("error", "Unknown error"))
        exit()

def is_valid_object_id(id: str) -> bool:
    """Helper function to check if the given ID is a valid MongoDB ObjectId."""
    try:
        ObjectId(id)
        return True
    except Exception:
        return False

def validate_incident_data(data: List[Dict[str, str]]) -> List[Dict[str, str]]:
    """Validate incident data before uploading."""
    valid_severity_levels = {"low", "medium", "high"}
    valid_statuses = {"pending review", "resolved"}
    valid_data = []

    for item in data:
        filtered_item = {
            "contentId": item.get("content_id", "").strip(),
            "incidentId": item.get("incident_id", ""),
            "authorId": item.get("author_id", "").strip(),
            "contentType": item.get("content_type", "").strip(),
            "severityLevel": item.get("severity_level", "").strip().lower(),
            "status": item.get("status", "").strip().lower(),
        }

        if not all(filtered_item.values()):
            print(f"\n❌ Missing required fields in: {item}")
            continue

        if filtered_item["severityLevel"] not in valid_severity_levels:
            print(f"\n❌ Invalid severity level '{filtered_item['severityLevel']}' in: {item}")
            continue

        if filtered_item["status"] not in valid_statuses:
            print(f"\n❌ Invalid status '{filtered_item['status']}' in: {item}")
            continue
        

        #if not is_valid_object_id(filtered_item["content_id"]) or not is_valid_object_id(filtered_item["userId"]):
            #print(f"\n❌ Invalid ObjectId format in: {item}")
            #continue


        valid_data.append(filtered_item)
    
    return valid_data

# Prevents uploading duplicate incidents by preventing entries with duplicate contentIds
# I am assuming that there can only be one incident per contentId
def check_duplicates(new_data: List[Dict[str, str]]) -> bool:
    """Check for duplicate content before uploading."""
    headers = {
        "Authorization": f"Bearer {AUTH_TOKEN}",
        "Content-Type": "application/json"
    }
    response = requests.get(f"{API_BASE_URL}/incidents", headers=headers)
    if response.status_code == 200:
        existing_content = response.json()
        existing_texts = {item["contentId"] for item in existing_content} 
        for item in new_data:
            if item["contentId"] in existing_texts: # Checks to see if that specific contentId exists in the incidents collection
                print("\n⚠️ Duplicate content found! Upload aborted.")
                return True
    return False

def search_incidents(search_term):
    try:

        incidents_url = f"{API_BASE_URL}/incidents"
        incidents_response = requests.get(incidents_url)
        incidents_response.raise_for_status()
        incidents = incidents_response.json()

        for incident in incidents:
            content_id = incident.get("contentId")
            content_type = incident.get("contentType")

            content_url = f"{API_BASE_URL}/{content_type}s/{content_id}"
            content_response = requests.get(content_url)
            content_response.raise_for_status()
            content_doc = content_response.json()

            if "content" in content_doc:
                content_text = content_doc["content"]
                if search_term in content_text:
                    print("Incident:", incident)

    except requests.exceptions.RequestException as e:
        print("Error:", e)

def upload_json(filename: str) -> None:
    """Upload JSON file contents to the database."""
    if not AUTH_TOKEN:
        print("\n⚠️ You must be logged in to upload files.")
        return

    try:
        with open(filename, "r") as file:
            data: List[Dict[str, str]] = json.load(file)
    except Exception as e:
        print(f"\n❌ Error reading file: {e}")
        return

    if not isinstance(data, list):
        data = [data]

    data = validate_incident_data(data)
    if not data:
        print("\n❌ No valid data to upload.")
        return
    
    if check_duplicates(data):
        return
    
    headers = {
        "Authorization": f"Bearer {AUTH_TOKEN}",
        "Content-Type": "application/json"
    }

    for item in data:
        print("\n🚀 Uploading incident:")
        print(json.dumps(item, indent=4))
        
        response = requests.post(f"{API_BASE_URL}/incidents", headers=headers, json=item)

        if response.status_code == 201:
            print("\n✅ Incident uploaded successfully!")
        else:
            print("\n❌ Upload failed! Status Code:", response.status_code)
            print("Response Text:", response.text)

def upload_csv(filename: str) -> None:
    """Convert CSV file to JSON and upload it row by row."""
    if not AUTH_TOKEN:
        print("\n⚠️ You must be logged in to upload files.")
        return

    try:
        with open(filename, "r") as file:
            reader = csv.DictReader(file)
            data: List[Dict[str, str]] = list(reader)
    except Exception as e:
        print(f"\n❌ Error reading file: {e}")
        return

    data = validate_incident_data(data)
    if not data:
        print("\n❌ No valid data to upload.")
        return

    headers = {
        "Authorization": f"Bearer {AUTH_TOKEN}",
        "Content-Type": "application/json"
    }

    for item in data:
        print("\n🚀 Uploading incident:")
        print(json.dumps(item, indent=4))
        
        response = requests.post(f"{API_BASE_URL}/incidents", headers=headers, json=item)

        if response.status_code == 201:
            print("\n✅ Incident uploaded successfully!")
        else:
            print("\n❌ Upload failed:", response.json())

if __name__ == "__main__":
    login()

    while True:
        print("\n👌 Options:")
        print("1. Upload JSON file")
        print("2. Upload CSV")
        print("3. Search content in incidents")
        print("5. Exit")

        choice = input("\nPlease select an option: ")

        if choice == "1":
            filename = input("\nEnter JSON filename: ")
            upload_json(filename)
        elif choice == "2":
            filename = input("\nEnter CSV filename: ")
            upload_csv(filename)
        elif choice == "3":
            search_term = input("Enter the search term: ")
            search_incidents(search_term)
        elif choice == "5":
            print("\n🚪 Exiting...")
            break
        else: 
            print("\n❌ Invalid option.")
