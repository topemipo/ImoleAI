import openai
from openai import OpenAI
from dotenv import load_dotenv
import os
import psycopg2

# OpenAI
load_dotenv()
openai_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=openai_key)


def augment_query_generated(user_query, model="gpt-3.5-turbo"):
    """Generate an augmented query to improve retrieval."""
    system_prompt = """You are a helpful expert legal research assistant. 
    Provide a plausible example answer to the user's query as if you found it in a case document."""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_query},
    ]
    
    response = openai.chat.completions.create(
        model=model,
        messages=messages,
    )
    
    return response.choices[0].message.content


def retrieve_similar_case(augumented_query):
    """Retrieve the most relevant legal cases based on vector similarity search."""
    # Generate embedding for the query
    response = openai.embeddings.create(
        input=[augumented_query],
        model="text-embedding-ada-002"
    )
    query_embedding = response.data[0].embedding  # 1536-dimensional vector

    # Database connection details
    DB_PARAMS = {
        "dbname": os.getenv("DB_NAME"),
        "user": os.getenv("DB_USER"),
        "password": os.getenv("DB_PASSWORD"),
        "host": os.getenv("DB_HOST"),
        "port": os.getenv("DB_PORT"),
        "sslmode": "require"
    }
    
    # Connect to PostgreSQL
    conn = psycopg2.connect(**DB_PARAMS)
    cursor = conn.cursor()

    # Execute similarity search in PostgreSQL
    cursor.execute("""
        SELECT filename, summary, 1 - (embedding <=> %s::vector) AS similarity
        FROM legal_cases
        ORDER BY similarity DESC
        LIMIT 1;
    """, (query_embedding,))

    results = cursor.fetchall()
    
    # Close DB connection
    cursor.close()
    conn.close()

    # Extract just the summaries from the results
    summaries = [row[1] for row in results]  # Extract summaries from tuples

    return summaries

def generate_response(question, context_data):
    """Generate a final response based on retrieved case documents."""
    prompt = f"""You are a legal assistant designed to help users understand their legal situations by retrieving and summarizing relevant cases. Follow these steps STRICTLY:
    
    1. **Sympathize with the user** (1-2 sentences):
       - Acknowledge their situation with empathy (e.g., "I’m sorry to hear...", "This sounds difficult...").
    
    2. **Retrieve and summarize a case** from the knowledge base below:
    {context_data}
       - Format:
         **Case Name**: [Exact case title]\n\n

         **Introduction**: [1-2 sentence overview: who was involved and the core issue]\n\n

         **Details**: [Key facts/events in chronological order]\n\n

         **Verdict**: [Court decision + outcomes like damages or policy changes]\n\n

    3. **Next Steps** (3-4 bullet points):
       - Practical actions tied to the case (e.g., "Save emails from [date range]")\n\n
       - Resources (e.g., "Contact [Agency Name] within [timeframe]")\n\n
    
    Tone Rules:
    - Professional but compassionate
    - Zero legal jargon (avoid terms like "plaintiff" or "motion")
    - If no matching case: 
      * Apologize briefly
      * Provide 2-3 general steps\n\n

      * Add: "Every case is unique – consulting a lawyer is recommended"

    Example structure to mimic:
    "I’m sorry to hear about your situation. Let me share a similar case:

    **Case Name**: Smith v. ABC Corp\n\n

    **Introduction**: A warehouse worker fired after reporting safety issues.\n\n

    **Details**: The employee reported violations in March 2022, was terminated April 2022 with no warning. The employer claimed budget cuts.\n\n

    **Verdict**: Court ruled wrongful termination – $150k awarded due to retaliation evidence.\n\n

    **Next steps:**
    - Document all safety reports you filed
    - Contact OSHA within 30 days
    - Consult an employment lawyer \n\n"""

    response = client.chat.completions.create(
        model="gpt-4-turbo",
        messages=[
            {"role": "system", "content": prompt},
            {"role": "user", "content": question},
        ],
        temperature=0.3,
        max_tokens=1500
    )

    return response.choices[0].message.content

# def generate_response(question, context_data):
#     """Generate a final response based on retrieved case documents."""
#     prompt = f"""You are a legal assistant designed to help users understand their legal situations by retrieving and summarizing relevant cases. Follow these steps STRICTLY:
    
#     1. **Sympathize with the user** (1-2 sentences):
#        - Acknowledge their situation with empathy (e.g., "I’m sorry to hear...", "This sounds difficult...").
    
#     2. **Retrieve and summarize a case** from the knowledge base below:
#     {context_data}

#        - Format (use new lines between sections for readability):
#         **Case Name**: [Exact case title]\n\n

#         **Introduction**: [1-2 sentence overview]\n\n

#         **Details**: [Chronological order]\n\n

#         **Verdict**: [Court decision and outcomes]\n\n

#     3. **Next Steps** (3-4 bullet points):
#        - Practical actions tied to the case (e.g., "Save emails from [date range]")
#        - Resources (e.g., "Contact [Agency Name] within [timeframe]")
    
#     Tone Rules:
#     - Professional but compassionate
#     - Zero legal jargon (avoid terms like "plaintiff" or "motion")

#     - If no matching case: 
#       * Apologize briefly
#       * Provide 2-3 general steps
#       * Add: "Every case is unique – consulting a lawyer is recommended"

#     **Output Requirements:**
#      - Use new lines between sections for readability.
#      - Maintain consistent spacing.
#      - Use bullet points for lists.
#      - Avoid legal jargon (e.g., "plaintiff", "motion").

#     Example structure to mimic:
#     I’m truly sorry to hear about the distressing situation your family is facing. A violent incident resulting in severe injuries can be incredibly difficult to navigate, both emotionally and legally. Let me share a similar case that might help clarify some aspects of your situation:

#     **Case Name:** 
    
#     Smith v. ABC Corp

#     **Introduction:**
    
#     This case involved a violent dispute between neighbors over a property boundary issue. The altercation escalated, leading to multiple injuries, including a victim who suffered permanent vision loss due to a severe head injury.

#     **Details:** 
    
#     •	The incident took place on April 17, 1991, in a rural village in Uttar Pradesh.

# 	•	A longstanding dispute over a property demarcation line led to a heated argument between two families.

# 	•	During the altercation, weapons such as iron rods and wooden sticks were used, causing significant injuries.

# 	•	One victim, Anil Verma, sustained a serious head injury, which led to permanent blindness in one eye.

# 	•	The perpetrators were initially convicted of attempted murder, unlawful assembly, and grievous harm.

#     **Verdict:** 
    
#     •	Upon appeal, the initial convictions were reconsidered, and the charges were reduced to grievous hurt under IPC Section 326.
	
#     •	Three of the accused were sentenced to five years of imprisonment, while two others received suspended sentences due to their limited involvement.
	
#     •	The court ordered compensation of ₹5,00,000 (approx. £5,000) to be paid to the victim to support medical expenses and loss of livelihood.
    
#     **Next steps:**
    
# 	•	Ensure all medical records, eyewitness statements, and any available video/photo evidence are well-preserved for future legal proceedings.

# 	•	Given the severity of your son’s injury, you may be eligible for additional compensation to cover long-term medical care, rehabilitation, and loss of quality of life.

# 	•	Stay in close communication with the public prosecutor or legal representative to monitor case developments and ensure your concerns are properly addressed.

# 	•	A lawyer specializing in personal injury law can guide you on how to maximize legal remedies available in your jurisdiction and advocate for fair justice."""

#     response = client.chat.completions.create(
#         model="gpt-4-turbo",
#         messages=[
#             {"role": "system", "content": prompt},
#             {"role": "user", "content": question},
#         ],
#         temperature=0.3,
#         max_tokens=1500
#     )

#     return response.choices[0].message.content

