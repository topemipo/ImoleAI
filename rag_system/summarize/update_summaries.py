import os
import json
from dotenv import load_dotenv
import anthropic
from functions import summarization_pipeline

# Load environment variables
load_dotenv()

# Anthropic
anthropic_key = os.getenv("ANTHROPIC_KEY")
client_atp = anthropic.Anthropic(api_key=anthropic_key)

# Paths
document_folder = "remaining_136"  # Change this to the folder containing new files
summary_file = "summariesup.json"
error_log_file = "error_log.txt"

# Load existing summaries if file exists
if os.path.exists(summary_file):
    with open(summary_file, "r", encoding="utf-8") as f:
        summaries = json.load(f)
else:
    summaries = {}

# Get the last document index from existing summaries
existing_indices = [int(key.split("_")[-1]) for key in summaries.keys()]
next_index = max(existing_indices) + 1 if existing_indices else 1

errors = []

# Process new text files
for filename in os.listdir(document_folder):
    file_path = os.path.join(document_folder, filename)
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            text = f.read()

        print(f"Summarizing {filename} (Document {next_index})...")
        summary = summarization_pipeline(text)

        summaries[f"document_{next_index}"] = {
            "filename": filename,
            "original_length": len(text),
            "summary": summary
        }
        next_index += 1
    
    except Exception as e:
        error_message = f"Error processing {filename}: {str(e)}"
        print(error_message)
        errors.append(error_message)

# Save updated summaries
with open(summary_file, "w", encoding="utf-8") as f:
    json.dump(summaries, f, indent=4)

# Save errors if any
if errors:
    with open(error_log_file, "w", encoding="utf-8") as f:
        f.write("\n".join(errors))
    print(f"Some files failed to process. See {error_log_file} for details.")

print(f"Updated summaries saved to {summary_file}")