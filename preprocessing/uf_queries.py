import json
import os
import anthropic
from dotenv import load_dotenv

# Load API Key
load_dotenv()
anthropic_key = os.getenv("ANTHROPIC_KEY")

# Initialize Anthropic Client
client_atp = anthropic.Anthropic(api_key=anthropic_key)

# Input and Output File Paths
input_json = "queries.json"
output_json = "user_friendly_queries.json"

# Load the original legal queries
with open(input_json, "r", encoding="utf-8") as f:
    legal_queries = json.load(f)

# Function to simplify legal queries
def simplify_legal_issue(legal_text):
    """Uses Claude-3.5-Sonnet to convert a legal case into a user-friendly issue for a legal chatbot."""

    prompt = f"""
    Convert the following complex legal case into a simple, natural-language question 
    or statement that a regular person might type into a chatbot. 
    The output should be conversational, brief, and avoid legal jargon.
    
    The question or issue should:
    - Sound like something a real person would ask online or in a chatbot
    - Be in either first-person ("I was fired from my job...") or third-person ("My friend was fired...")
    - If relevant, reframe it as a general legal inquiry ("What happens if someone is fired after being falsely accused?")
    
    Legal Case:
    {legal_text}

    Expected Output:
    - A clear, simple legal issue stated in everyday language
    - Format it as a direct question or a brief statement

    Example Outputs:
    - "I was fired from my bank job for allegedly taking money, but I was later found not guilty. Can I get my job back?"
    - "My uncle was charged with fraud but later acquitted. His company still refuses to reinstate him. What are his rights?"
    - "What happens if someone is wrongly accused of a crime at work and loses their job because of it?"
    """

    response = client_atp.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=500,
        system="You are an expert legal advisor specializing in making complex legal cases easy for the general public to understand.",
        messages=[{"role": "user", "content": prompt}]
    )

    return response.content[0].text.strip()

# Dictionary to store user-friendly legal issues
simplified_queries = {}

# Process each legal case
for case_id, legal_text in legal_queries.items():
    print(f"🛠 Simplifying {case_id}...")
    simplified_queries[case_id] = simplify_legal_issue(legal_text)

# Save the transformed queries to a JSON file
with open(output_json, "w", encoding="utf-8") as f:
    json.dump(simplified_queries, f, indent=4, ensure_ascii=False)

print(f"✅ Simplified legal issues saved to {output_json}")