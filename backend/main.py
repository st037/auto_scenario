import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# フロントエンド(Next.js)からのアクセスを許可する設定(CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("WARNING: GEMINI_API_KEY is not set in .env")

client = genai.Client(api_key=api_key)

class MessageItem(BaseModel):
    role: str
    content: str

class Document(BaseModel):
    title: str
    content: str

class ChatRequest(BaseModel):
    messages: List[MessageItem]
    document: Optional[Document] = None

@app.post("/api/chat")
def generate_chat(request: ChatRequest):

    if not request.messages:
        raise HTTPException(
            status_code=400, 
            detail="メッセージが空です"
        )

    try:
        formatted_history = []

        for msg in request.messages[:-1]:

            role = (
                "model" 
                if msg.role in ["ai", "assistant"] 
                else "user"
            )

            formatted_history.append(
                types.Content(
                    role=role,
                    parts=[
                        types.Part.from_text(
                            text=msg.content
                        )
                    ],
                )
            )

        document_context = ""

        if request.document:

            document_context = f""" 
現在ユーザーが編集しているドキュメントがあります。

タイトル:
{request.document.title}

本文:
{request.document.content}

このドキュメントの内容を考慮して回答してください。
ユーザーが文章の修正や続きを求めた場合は、
このドキュメントの内容と矛盾しないようにしてください。
"""
        latest_message = request.messages[-1].content

        prompt = f"""
あなたは物語・シナリオ制作を支援するAIアシスタントです。

ユーザーは現在、物語のドキュメントを編集しています。

{document_context}

ユーザーからの最新の指示:

{latest_message}

必要に応じて、現在のドキュメントや会話履歴を参照してください。
"""

        chat_session = client.chats.create(
            model="gemini-3.6-flash",
            history=formatted_history,
        )

        response = chat_session.send_message(prompt)

        return {
            "response": response.text
        }
    
    except Exception as e:

        print(f"Error: {e}")
        
        raise HTTPException(
            status_code=500, 
            detail="Gemini APIとの連携に失敗しました"
        )
