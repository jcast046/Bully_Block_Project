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

REQUIRED_KEYS = {"contentType", "content", "author"}
VALID_CONTENT_TYPES = {"post", "message", "comment"}

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

def validate_author(author_id: str) -> str:
    """Check if the given author ID exists in the database; fallback to logged-in user ID if invalid."""
    headers = {"Authorization": f"Bearer {AUTH_TOKEN}"}
    
    # If the author_id is not a valid ObjectId, assume it's a user reference and try to resolve it
    if not is_valid_object_id(author_id):  # Custom check for ObjectId
        # Resolve the user reference (e.g., "u20001") to the actual MongoDB _id
        print(f"Resolving author reference ID: {author_id}")
        
        # Assuming the backend has an endpoint to get the user by this reference ID (e.g., "u20001")
        response = requests.get(f"{API_BASE_URL}/users/reference/{author_id}", headers=headers)
        
        if response.status_code == 200:
            user_data = response.json()
            return user_data["_id"]  # Assuming the response includes the MongoDB user _id
        else:
            print(f"\n⚠️ Author reference ID {author_id} not found. Assigning content to the logged-in user ({USER_ID}).")
            return USER_ID  # Fallback to the logged-in user ID
    
    # If the author_id is a valid ObjectId, check if the user exists
    response = requests.get(f"{API_BASE_URL}/users/{author_id}", headers=headers)
    if response.status_code == 200:
        return author_id  # Author exists, return the same ID

    print(f"\n⚠️ Invalid author ID {author_id}. Assigning content to the logged-in user ({USER_ID}).")
    return USER_ID  # Fallback to the logged-in user ID

def is_valid_object_id(id: str) -> bool:
    """Helper function to check if the given ID is a valid MongoDB ObjectId."""
    try:
        ObjectId(id)
        return True
    except Exception:
        return False

def validate_data(data: List[Dict[str, str]]) -> List[Dict[str, str]]:
    """Filter, clean, and validate data before uploading."""
    valid_data = []

    for item in data:
        # Map the fields correctly
        filtered_item = {
            "contentType": item.get("contentType", "").strip(),
            "content": item.get("content", "").strip(),
            "author": validate_author(item.get("author_id", "").strip()),  # Fixed to use author_id
            "post": item.get("post_id", "").strip()  # Fixed to use post_id
        }


        # Ensure required fields are present
        if not all(filtered_item.values()):
            print(f"\n❌ Missing required fields in: {item}")
            continue

        # Ensure contentType is valid
        if filtered_item["contentType"] not in VALID_CONTENT_TYPES:
            print(f"\n❌ Invalid contentType '{filtered_item['contentType']}' in: {item}")
            continue

        valid_data.append(filtered_item)

    return valid_data

def check_duplicates(new_data: List[Dict[str, str]]) -> bool:
    """Check for duplicate content before uploading."""
    headers = {
        "Authorization": f"Bearer {AUTH_TOKEN}",
        "Content-Type": "application/json"
    }
    response = requests.get(f"{API_BASE_URL}/content", headers=headers)
    if response.status_code == 200:
        existing_content = response.json()
        existing_texts = {item["content"] for item in existing_content}
        for item in new_data:
            if item["content"] in existing_texts:
                print("\n⚠️ Duplicate content found! Upload aborted.")
                return True
    return False

def upload_json(filename: str) -> None:
    """Upload JSON file contents to the database after checking for duplicates."""
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

    data = validate_data(data)
    if not data:
        print("\n❌ No valid data to upload.")
        return

    if check_duplicates(data):
        return

    headers = {
        "Authorization": f"Bearer {AUTH_TOKEN}",
        "Content-Type": "application/json"
    }

    # 🔄 Send each item to its respective content type collection
    for item in data:
        print("\n🚀 Uploading item:")
        print(json.dumps(item, indent=4))

        content_type = item["contentType"].lower()
        if content_type == "post":
            response = requests.post(f"{API_BASE_URL}/posts", headers=headers, json=item)
        elif content_type == "message":
            response = requests.post(f"{API_BASE_URL}/messages", headers=headers, json=item)
        elif content_type == "comment":
            response = requests.post(f"{API_BASE_URL}/comments", headers=headers, json=item)
        else:
            print("\n❌ Invalid content type, skipping upload for:", item)
            continue

        try:
            response_data = response.json()
            if response.status_code == 201:
                print("\n✅ Item uploaded successfully!")
            else:
                print(f"\n❌ Upload failed: {response_data}")
        except ValueError:
            print(f"\n❌ Error: Unable to decode response. Raw response: {response.text}")

def upload_csv(filename: str) -> None:
    """Convert CSV file to JSON and upload it row by row after checking for duplicates."""
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

    data = validate_data(data)
    if not data:
        print("\n❌ No valid data to upload.")
        return

    headers = {
        "Authorization": f"Bearer {AUTH_TOKEN}",
        "Content-Type": "application/json"
    }

    # 🔄 Send each row individually to its respective collection
    for item in data:
        print("\n🚀 Uploading item:")
        print(json.dumps(item, indent=4))

        content_type = item["contentType"].lower()
        if content_type == "post":
            response = requests.post(f"{API_BASE_URL}/posts", headers=headers, json=item)
        elif content_type == "message":
            response = requests.post(f"{API_BASE_URL}/messages", headers=headers, json=item)
        elif content_type == "comment":
            response = requests.post(f"{API_BASE_URL}/comments", headers=headers, json=item)
        else:
            print("\n❌ Invalid content type, skipping upload for:", item)
            continue

        if response.status_code == 201:
            print("\n✅ Item uploaded successfully!")
        else:
            print("\n❌ Upload failed:", response.json())

def save_content_as_json(content: List[Dict[str, str]], filename: str) -> None:
    """Save fetched content to a JSON file."""
    try:
        with open(filename, "w") as json_file:
            json.dump(content, json_file, indent=4)
        print(f"\n✅ Content successfully saved to {filename}")
    except Exception as e:
        print(f"\n❌ Error saving content as JSON: {e}")

def save_content_as_csv(content: List[Dict[str, str]], filename: str) -> None:
    """Save fetched content to a CSV file."""
    try:
        # Check if there is any content to write
        if content:
            keys = content[0].keys()  # Use the keys of the first item as headers
            with open(filename, "w", newline="") as csv_file:
                writer = csv.DictWriter(csv_file, fieldnames=keys)
                writer.writeheader()
                writer.writerows(content)
            print(f"\n✅ Content successfully saved to {filename}")
        else:
            print("\n❌ No content to save.")
    except Exception as e:
        print(f"\n❌ Error saving content as CSV: {e}")

def fetch_content(content_type: str = "all") -> None:
    """Fetch all content by type: posts, messages, comments, or a combination.
    
    Prints available search criteria and an example query when fetching content.
    """
    if not AUTH_TOKEN:
        print("\n⚠️ You must be logged in to fetch content.")
        return

    print("\n🔍 Available search criteria:")
    print("   - contentType: Filter by type (post, message, comment)")
    print("   - author: Filter by author ID")
    print("   - dateRange: Specify a start and end date (YYYY-MM-DD)")
    print("   - keywords: Search for specific words in content")
    print("   - mentions: Find content mentioning a specific user")
    
    print("\n📌 Example Search Query:")
    print('   {"contentType": "post", "author": "60f7a2b9d6d4d5289472d2b3", "keywords": ["AI", "ethics"], "dateRange": {"start": "2024-01-01", "end": "2024-12-31"}}')

    headers = {
        "Authorization": f"Bearer {AUTH_TOKEN}",
        "Content-Type": "application/json"
    }

    # Determine the endpoint based on content_type
    if content_type == "all":
        response = requests.get(f"{API_BASE_URL}/content", headers=headers)
    elif content_type in VALID_CONTENT_TYPES:
        response = requests.get(f"{API_BASE_URL}/{content_type}s", headers=headers)
    else:
        print("\n❌ Invalid content type!")
        return

    if response.status_code == 200:
        content = response.json()

        save_choice = input("\nWould you like to save this content? (y/n): ").strip().lower()
        if save_choice == "y":
            file_format = input("\nEnter file format (json/csv): ").strip().lower()
            filename = input("\nEnter filename to save content (e.g., content): ").strip()
            if file_format == "json":
                if not filename.endswith(".json"):
                    filename += ".json"
                save_content_as_json(content, filename)
            elif file_format == "csv":
                if not filename.endswith(".csv"):
                    filename += ".csv"
                save_content_as_csv(content, filename)
            else:
                print("\n❌ Invalid file format.")
        else:
            print("\n❌ Content not saved.")
    else:
        print("\n❌ Failed to fetch content:", response.json())


if __name__ == "__main__":
    print("\n🔑 Login Required")
    login()

    while True:
        print("\n👌 Options:")
        print("1. Upload JSON file")
        print("2. Upload CSV file")
        print("3. Fetch content")
        print("4. Search content")
        print("5. Exit")

        choice = input("\nPlease select an option: ")

        if choice == "1":
            filename = input("\nEnter JSON filename: ")
            upload_json(filename)
        elif choice == "2":
            filename = input("\nEnter CSV filename: ")
            upload_csv(filename)
        elif choice == "3":
            content_type = input("\nEnter content type to fetch (post, message, comment, or all): ")
            fetch_content(content_type)
        elif choice == "4":
            search_term = input("\nEnter search term: ")
            content_type = input("\nEnter content type to search (post, message, comment, or all): ")
            search_content(search_term, content_type)
        elif choice == "5":
            print("\n🚪 Exiting...")
            break
        else:
            print("\n❌ Invalid option.")
