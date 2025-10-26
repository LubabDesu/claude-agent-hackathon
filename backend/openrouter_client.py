import httpx, json, re
from typing import Any, Dict
from config import (
    OPENROUTER_API_KEY, OPENROUTER_MODEL, OPENROUTER_URL,
    OPENROUTER_REFERER, OPENROUTER_TITLE
)
from utils import extract_json

async def chat_completion(user_content: str, system_prompt: str,
                          max_tokens: int = 400, temperature: float = 0.2) -> Dict[str, Any]:
    if not OPENROUTER_API_KEY:
        raise RuntimeError("Missing OPENROUTER_API_KEY")
    
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }
    body = {
        "model": OPENROUTER_MODEL,   # e.g., "tngtech/deepseek-r1t-chimera:free"
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": user_content}
        ],
        "max_tokens": max_tokens,
        "temperature": temperature,
        "response_format": {"type": "json_object"} 
    }

     # Make the HTTP request using an async client (fits neatly with FastAPI).
    async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.post(OPENROUTER_URL, headers=headers, json=body)
        r.raise_for_status()  # if HTTP status is not 2xx, raise an exception
        data = r.json()       # parse JSON response into a Python dict

    # OpenRouter returns OpenAI-like structure:
    # data["choices"][0]["message"]["content"] holds the assistant text.
    content = (data.get("choices") or [{}])[0].get("message", {}).get("content", "{}")

    # Try to parse the assistant text as JSON:
    #  - If the model followed instructions, this will be valid JSON already.
    #  - If it added extra text/markdown, _extract_json_block() pulls the JSON object out.
    try:
        # return {"_raw": content, "parsed": extract_json(content)}
        return content
    except Exception:
        # Worst case: return the raw string for logging/debugging upstream.
        return {"_raw": content}