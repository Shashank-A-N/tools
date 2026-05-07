import os
import json
import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
from dotenv import load_dotenv

# Load environment variables from .env file (if running locally)
load_dotenv()

app = FastAPI()
base_dir = os.path.dirname(os.path.abspath(__file__))

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")

@app.get("/")
async def serve_index():
    """Serves the QA-2 Engine HTML file."""
    return FileResponse(os.path.join(base_dir, 'index.html'))


@app.post("/api/generate")
async def generate_response(request: Request):
    """
    Acts as a secure proxy to stream responses from Gemini or OpenRouter.
    Hides API keys from the client network inspector.
    """
    body = await request.json()
    prompt = body.get("prompt", "")
    context = body.get("context", "")
    provider = body.get("provider", "gemini") # "gemini" or "openrouter"

    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt is required")

    combined_prompt = f"""Based on the following document context, please provide a clear and concise answer to the question with citations to the document where applicable. If the answer is not found in the document context, state that the information is not available.

Document Context:
---
{context[:30000]}
---

Question: {prompt}"""

    async def stream_generator():
        async with httpx.AsyncClient() as client:
            if provider == "gemini":
                if not GEMINI_API_KEY:
                    yield "ERROR: GEMINI_API_KEY is not configured on the server."
                    return
                
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?key={GEMINI_API_KEY}"
                payload = {
                    "contents": [{"role": "user", "parts": [{"text": combined_prompt}]}]
                }
                
                async with client.stream("POST", url, json=payload, timeout=60.0) as response:
                    if response.status_code != 200:
                        yield f"ERROR: Gemini API returned status {response.status_code}"
                        return
                    
                    async for chunk in response.aiter_text():
                        if chunk:
                            yield chunk

            elif provider == "openrouter":
                if not OPENROUTER_API_KEY:
                    yield "ERROR: OPENROUTER_API_KEY is not configured on the server."
                    return
                
                url = "https://openrouter.ai/api/v1/chat/completions"
                headers = {
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "HTTP-Referer": "https://documind-rag.space", # Optional for OpenRouter rankings
                    "X-Title": "DocuMind RAG UI",
                    "Content-Type": "application/json"
                }
                payload = {
                    "model": "google/gemini-2.5-flash", # You can change this to any openrouter model
                    "messages": [
                        {"role": "user", "content": combined_prompt}
                    ],
                    "stream": True
                }
                
                async with client.stream("POST", url, headers=headers, json=payload, timeout=60.0) as response:
                    if response.status_code != 200:
                        yield f"ERROR: OpenRouter returned status {response.status_code}"
                        return
                    
                    async for chunk in response.aiter_text():
                        if chunk:
                            yield chunk
                            
            else:
                yield "ERROR: Invalid provider selected."

    return StreamingResponse(stream_generator(), media_type="text/plain")

# Mount static files correctly
app.mount("/", StaticFiles(directory=base_dir), name="static")
