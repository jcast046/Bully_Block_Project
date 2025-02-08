import requests
import json

# API Base URL
API_BASE_URL = "http://localhost:3001/api"

# Store the authentication token
AUTH_TOKEN = None

def login():
    """Prompt user for login credentials and authenticate with the backend."""
    global AUTH_TOKEN
    email = input("Enter your email: ")
    password = input("Enter your password: ")

    response = requests.post(f"{API_BASE_URL}/users/login", json={"email": email, "password": password})
    
    if response.status_code == 200:
        data = response.json()
        AUTH_TOKEN = data.get("token")
        print("\n✅ Login successful!")
    else:
        print("\n❌ Login failed:", response.json().get("error", "Unknown error"))
        exit()

def upload_json(filename):
    """Upload JSON file contents to the database after checking for duplicates."""
    if not AUTH_TOKEN:
        print("\n⚠️ You must be logged in to upload files.")
        return

    # Read the JSON file
    try:
        with open(filename, "r") as file:
            data = json.load(file)
    except Exception as e:
        print(f"\n❌ Error reading file: {e}")
        return

    headers = {
        "Authorization": f"Bearer {AUTH_TOKEN}",
        "Content-Type": "application/json"
    }

    # Check for duplicate content
    check_response = requests.get(f"{API_BASE_URL}/content", headers=headers)
    if check_response.status_code == 200:
        existing_content = check_response.json()
        for item in existing_content:
            if item["content"] == data["content"]:  # Check if content already exists
                print("\n⚠️ Duplicate content found! Upload aborted.")
                return
    
    # Upload new content
    response = requests.post(f"{API_BASE_URL}/content", headers=headers, json=data)
    if response.status_code == 201:
        print("\n✅ File uploaded successfully!")
    else:
        print("\n❌ Upload failed:", response.json())

def fetch_content(search_query=None):
    """Retrieve content from the database as JSON. If a query is provided, search for matching content."""
    if not AUTH_TOKEN:
        print("\n⚠️ You must be logged in to fetch content.")
        return

    headers = {
        "Authorization": f"Bearer {AUTH_TOKEN}",
        "Content-Type": "application/json"
    }

    response = requests.get(f"{API_BASE_URL}/content", headers=headers)
    if response.status_code == 200:
        content_data = response.json()
        
        if search_query:
            content_data = [item for item in content_data if search_query.lower() in item["content"].lower()]
        
        # Save to a file
        with open("retrieved_content.json", "w") as file:
            json.dump(content_data, file, indent=4)
        
        print("\n✅ Content retrieved and saved to 'retrieved_content.json'.")
    else:
        print("\n❌ Failed to fetch content:", response.json())

if __name__ == "__main__":
    print("\n🔑 Login Required")
    login()

    while True:
        print("\n📌 Options:")
        print("1. Upload JSON file")
        print("2. Fetch all content")
        print("3. Search for specific content")
        print("4. Exit")
        choice = input("\nEnter your choice: ")

        if choice == "1":
            filename = input("Enter the JSON filename to upload: ")
            upload_json(filename)
        elif choice == "2":
            fetch_content()
        elif choice == "3":
            query = input("Enter search term: ")
            fetch_content(query)
        elif choice == "4":
            print("\n👋 Exiting...")
            break
        else:
            print("\n❌ Invalid choice, try again.")
