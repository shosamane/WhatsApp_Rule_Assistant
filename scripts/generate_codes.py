#!/usr/bin/env python3
"""
Script 1: Generate 100,000 unique completion codes
Each code is 6-character alphanumeric (case-sensitive: a-z, A-Z, 0-9)
"""

import random
import string
from pymongo import MongoClient
from datetime import datetime

# MongoDB connection settings
MONGO_URI = "mongodb://localhost:27017/"  # Update with your MongoDB URI
DB_NAME = "whatsapp_rule_assistant"  # Update with your database name
COLLECTION_NAME = "completion_codes"

def generate_code():
    """Generate a random 6-character alphanumeric code (case-sensitive)"""
    characters = string.ascii_letters + string.digits  # a-z, A-Z, 0-9
    return ''.join(random.choices(characters, k=6))

def generate_unique_codes(n=100000):
    """Generate n unique codes"""
    codes = set()
    while len(codes) < n:
        code = generate_code()
        codes.add(code)
        if len(codes) % 10000 == 0:
            print(f"Generated {len(codes)} unique codes...")
    return codes

def insert_codes_to_db(codes):
    """Insert generated codes into MongoDB"""
    # Connect to MongoDB
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    collection = db[COLLECTION_NAME]

    # Create index on code field for faster lookups
    collection.create_index("code", unique=True)
    collection.create_index([("sharedWithPlatform", 1), ("sharedWithParticipant", 1)])

    # Prepare documents
    documents = []
    for code in codes:
        documents.append({
            "code": code,
            "sharedWithParticipant": None,
            "sharedWithPlatform": None,
            "platform": None,
            "createdAt": datetime.utcnow()
        })

    # Insert in batches of 10000
    batch_size = 10000
    total_inserted = 0

    for i in range(0, len(documents), batch_size):
        batch = documents[i:i + batch_size]
        try:
            result = collection.insert_many(batch, ordered=False)
            total_inserted += len(result.inserted_ids)
            print(f"Inserted {total_inserted} / {len(documents)} codes...")
        except Exception as e:
            print(f"Batch insert error (may be duplicates): {e}")
            # Try inserting one by one for this batch
            for doc in batch:
                try:
                    collection.insert_one(doc)
                    total_inserted += 1
                except:
                    pass  # Skip duplicates

    print(f"\nTotal codes inserted: {total_inserted}")
    client.close()

def main():
    print("Generating 100,000 unique completion codes...")
    print("This may take a few minutes...\n")

    # Generate unique codes
    codes = generate_unique_codes(100000)
    print(f"\nGenerated {len(codes)} unique codes")

    # Insert into MongoDB
    print("\nInserting codes into MongoDB...")
    insert_codes_to_db(codes)

    print("\n✓ Done! 100,000 codes generated and stored in MongoDB")
    print(f"  Database: {DB_NAME}")
    print(f"  Collection: {COLLECTION_NAME}")

if __name__ == "__main__":
    main()
