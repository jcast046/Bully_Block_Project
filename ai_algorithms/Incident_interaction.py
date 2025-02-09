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
            "contentId": item.get("contentId", "").strip(),
            "contentType": item.get("contentType", "").strip(),
            "userId": item.get("userId", "").strip(),
            "severityLevel": item.get("severityLevel", "").strip().lower(),
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

        if not is_valid_object_id(filtered_item["contentId"]) or not is_valid_object_id(filtered_item["userId"]):
            print(f"\n❌ Invalid ObjectId format in: {item}")
            continue

        valid_data.append(filtered_item)
    
    return valid_data

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
        print("5. Exit")

        choice = input("\nPlease select an option: ")

        if choice == "1":
            filename = input("\nEnter JSON filename: ")
            upload_json(filename)
        elif choice == "2":
            filename = input("\nEnter CSV filename: ")
            upload_csv(filename)
        elif choice == "5":
            print("\n🚪 Exiting...")
            break
        else: 
            print("\n❌ Invalid option.")
