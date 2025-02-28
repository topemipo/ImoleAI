import json
import re

# === Read the input text file ===
input_file = "/Users/temit/Documents/Project/Masters Dissertation/AILA_2019_dataset/Query_doc.txt"  # Replace with the actual file containing queries
output_json = "queries.json"

# Read the file content
with open(input_file, "r", encoding="utf-8") as f:
    content = f.read()

# === Extract queries using regex ===
pattern = r"(AILA_Q\d+\|\|)(.*?)(?=(AILA_Q\d+\|\||$))"
matches = re.findall(pattern, content, re.DOTALL)

# Convert to dictionary format
queries_dict = {match[0].strip("||"): match[1].strip() for match in matches}

# === Save to JSON file ===
with open(output_json, "w", encoding="utf-8") as f:
    json.dump(queries_dict, f, indent=4, ensure_ascii=False)

print(f"✅ Queries saved successfully in {output_json}")