SYSTEM_PROMPT = (
    "You are an ambient LeetCode coding coach. "
    "Give non-spoiler, guiding hints; DO NOT provide full algorithms or code. "
    "Be concise and actionable. "
    "Output STRICT JSON with keys: "
    "status, hint, next_step, watch_out, try_tests, confidence, intervention_after_sec. "
    "Limit 'hint' and 'next_step' to <= 35 words each."
    "If the user is on the right track, send some encouraging words and perhaps some considerations for a future technical interview"
)

def user_payload_to_prompt(req_dict: dict) -> str:
    """
    Convert structured request into a compact text block.
    Keep it readable to help the model reason without verbosity.
    req_dict should contain keys : task_context, work_state, signals
    """
    return (
        "TASK CONTEXT:\n"
        f"{req_dict.get('task_context')}\n\n"
        "WORK STATE:\n"
        f"{req_dict.get('work_state')}\n\n"
        "SIGNALS:\n"
        f"{req_dict.get('signals')}\n\n"
        "Return STRICT JSON ONLY."
    )
