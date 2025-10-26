import os
from dotenv import load_dotenv
load_dotenv()
CLAUDE_API_KEY = os.getenv("ANTHROPIC_API_KEY")
MODEL_NAME = os.getenv("MODEL_NAME", "claude-3-5-sonnet-2025-06-06")
PORT = int(os.getenv("PORT", 8787))