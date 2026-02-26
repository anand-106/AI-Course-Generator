import logging
logging.basicConfig(level=logging.WARNING)

from dotenv import load_dotenv
from pathlib import Path
load_dotenv(Path('../.env'))

from agent.agent import _generate_module_package, _generate_subtopics

topic = "C Basics and Environment Setup"
print("Generating subtopics...")
subtopics = _generate_subtopics(topic)
print("Subtopics:", subtopics)
print("\nGenerating module package...")

# Patch llm_client._parse_json to expose failure
from agent import agent as ag
original_parse = ag.llm_client._parse_json

def debug_parse(text):
    print("=== RAW CONTENT type:", type(text))
    print("=== FIRST 300 chars:", repr(text[:300]) if text else "EMPTY")
    print("=== LAST 300 chars:", repr(text[-300:]) if text else "EMPTY")
    result = original_parse(text)
    if result is None:
        import json, re
        print("=== JSON PARSE FAILED. Trying to find the error...")
        try:
            json.loads(text)
        except json.JSONDecodeError as e:
            print(f"=== JSONDecodeError: {e}")
            # Show context around the error
            pos = e.pos
            print(f"=== Context around error (pos {pos}): {repr(text[max(0,pos-100):pos+100])}")
    return result

ag.llm_client._parse_json = debug_parse

pkg = _generate_module_package(topic, subtopics[:2], [])
print("\nFINAL PACKAGE KEYS:", list(pkg.keys()) if pkg else "EMPTY/FAILED")
