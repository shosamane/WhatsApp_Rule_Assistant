#!/usr/bin/env python3
"""
Script 2: Allocate codes to a platform and export to CSV
Usage: python allocate_codes.py --n 20 --platform clickworker
Platform must be one of: clickworker, prolific, referral
"""

import argparse
import csv
from pymongo import MongoClient
from datetime import datetime

# MongoDB connection settings
MONGO_URI = "mongodb://localhost:27017/"  # Update with your MongoDB URI
DB_NAME = "whatsapp_rule_assistant"  # Must match server.js database
COLLECTION_NAME = "completion_codes"  # Separate from submissions collection

# Webapp URL for CSV export
WEBAPP_URL = "go.rutgers.edu/whatsapprules"

def allocate_codes(n, platform):
    """
    Allocate n codes to a platform and export to CSV

    Args:
        n: Number of codes to allocate
        platform: Platform name (e.g., 'clickworker', 'prolific')
    """
    # Connect to MongoDB
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    collection = db[COLLECTION_NAME]

    # Find n codes that haven't been shared with any platform yet
    unallocated_codes = list(collection.find(
        {"sharedWithPlatform": None},
        {"code": 1, "_id": 1}
    ).limit(n))

    if len(unallocated_codes) < n:
        print(f"⚠️  Warning: Only {len(unallocated_codes)} unallocated codes available (requested {n})")
        if len(unallocated_codes) == 0:
            print("❌ No unallocated codes available!")
            client.close()
            return []

    # Update these codes to mark them as allocated to the platform
    code_ids = [doc["_id"] for doc in unallocated_codes]
    codes = [doc["code"] for doc in unallocated_codes]

    result = collection.update_many(
        {"_id": {"$in": code_ids}},
        {
            "$set": {
                "sharedWithPlatform": True,
                "platform": platform,
                "allocatedAt": datetime.utcnow()
            }
        }
    )

    print(f"\n✓ Allocated {result.modified_count} codes to {platform}")

    # Generate CSV filename with timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    csv_filename = f"codes_{platform}_{n}_{timestamp}.csv"

    # Write to CSV
    with open(csv_filename, 'w', newline='') as csvfile:
        writer = csv.writer(csvfile)
        # Write header
        writer.writerow(['URL', 'Code'])
        # Write data
        for code in codes:
            writer.writerow([WEBAPP_URL, code])

    print(f"✓ Exported to: {csv_filename}")
    print(f"\nCodes allocated:")
    for i, code in enumerate(codes[:10], 1):  # Show first 10
        print(f"  {i}. {code}")
    if len(codes) > 10:
        print(f"  ... and {len(codes) - 10} more")

    client.close()
    return codes

def show_statistics():
    """Show current statistics of code allocation"""
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    collection = db[COLLECTION_NAME]

    total = collection.count_documents({})
    unallocated = collection.count_documents({"sharedWithPlatform": None})
    allocated = collection.count_documents({"sharedWithPlatform": True})
    used = collection.count_documents({"sharedWithParticipant": True})

    print("\n" + "="*50)
    print("CODE STATISTICS")
    print("="*50)
    print(f"Total codes:                {total:,}")
    print(f"Unallocated codes:          {unallocated:,}")
    print(f"Allocated to platforms:     {allocated:,}")
    print(f"Used by participants:       {used:,}")
    print(f"Available for participants: {allocated - used:,}")

    # Show breakdown by platform
    platforms = collection.distinct("platform", {"platform": {"$ne": None}})
    if platforms:
        print("\nBreakdown by platform:")
        for platform in platforms:
            platform_total = collection.count_documents({"platform": platform})
            platform_used = collection.count_documents({
                "platform": platform,
                "sharedWithParticipant": True
            })
            print(f"  {platform}: {platform_total:,} allocated, {platform_used:,} used")

    print("="*50 + "\n")

    client.close()

def main():
    parser = argparse.ArgumentParser(
        description='Allocate completion codes to a platform and export to CSV'
    )
    parser.add_argument(
        '--n',
        type=int,
        required=True,
        help='Number of codes to allocate'
    )
    parser.add_argument(
        '--platform',
        type=str,
        required=True,
        choices=['clickworker', 'prolific', 'referral'],
        help='Platform name (must be one of: clickworker, prolific, referral)'
    )
    parser.add_argument(
        '--stats',
        action='store_true',
        help='Show statistics only (no allocation)'
    )

    args = parser.parse_args()

    if args.stats:
        show_statistics()
    else:
        print(f"Allocating {args.n} codes to {args.platform}...")
        allocate_codes(args.n, args.platform)
        show_statistics()

if __name__ == "__main__":
    main()
