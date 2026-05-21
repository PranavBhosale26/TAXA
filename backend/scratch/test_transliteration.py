import os
import sys

# Add backend directory to sys.path so we can import agent.graph
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from agent.graph import agent_app
from langchain_core.messages import HumanMessage

def test_transliteration():
    print("=== Testing Transliteration Response (English Script only) ===")
    
    # 1. Marathi query
    marathi_query = "hi kasa ahes ?"
    print(f"\nUser (Marathi): {marathi_query}")
    result = agent_app.invoke({"messages": [HumanMessage(content=marathi_query)]})
    response = result["messages"][-1].content
    print(f"TAXA Response:\n{response}")
    
    has_devanagari = any(ord(char) in range(0x0900, 0x0980) for char in response)
    print(f"Contains Devanagari characters? {has_devanagari} (Expected: False)")
    
    # 2. Hindi query
    hindi_query = "tum kya kar rahe ho?"
    print(f"\nUser (Hindi): {hindi_query}")
    result = agent_app.invoke({"messages": [HumanMessage(content=hindi_query)]})
    response = result["messages"][-1].content
    print(f"TAXA Response:\n{response}")
    
    has_devanagari = any(ord(char) in range(0x0900, 0x0980) for char in response)
    print(f"Contains Devanagari characters? {has_devanagari} (Expected: False)")

    # 3. Gujarati query
    gujarati_query = "tame kem cho?"
    print(f"\nUser (Gujarati): {gujarati_query}")
    result = agent_app.invoke({"messages": [HumanMessage(content=gujarati_query)]})
    response = result["messages"][-1].content
    print(f"TAXA Response:\n{response}")
    
    has_gujarati = any(ord(char) in range(0x0A80, 0x0B00) for char in response)
    print(f"Contains Gujarati characters? {has_gujarati} (Expected: False)")

    # 4. English query (Should respond in English)
    english_query_1 = "What is your name and what can you do?"
    print(f"\nUser (English): {english_query_1}")
    result = agent_app.invoke({"messages": [HumanMessage(content=english_query_1)]})
    response = result["messages"][-1].content
    print(f"TAXA Response:\n{response}")

    # 5. Another English query (Should respond in English)
    english_query_2 = "Can you write a short poem about coding?"
    print(f"\nUser (English): {english_query_2}")
    result = agent_app.invoke({"messages": [HumanMessage(content=english_query_2)]})
    response = result["messages"][-1].content
    print(f"TAXA Response:\n{response}")

if __name__ == "__main__":
    test_transliteration()

