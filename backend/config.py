import os
from dotenv import load_dotenv

load_dotenv()

CLAUDE_API_KEY = os.getenv("ANTHROPIC_API_KEY")
MODEL_NAME = os.getenv("MODEL_NAME", "claude-3-5-sonnet-2025-06-06")
PORT = int(os.getenv("PORT", 8787))

# OpenRouter
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "tngtech/deepseek-r1t-chimera:free")
OPENROUTER_URL   = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_REFERER = os.getenv("OPENROUTER_REFERER", "")
OPENROUTER_TITLE   = os.getenv("OPENROUTER_TITLE", "LeetCode Ambient Agent")
