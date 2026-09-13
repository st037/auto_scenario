import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
#pydanticは送られてきたjsonデータが、型にあっているかをチェックして、Pythonオブジェクトに変換する
from pydantic import BaseModel
from typing import List, Optional
from google import genai
from google.genai import types
from dotenv import load_dotenv
from database import engine, SessionLocal
from sqlalchemy import text
from models import Project
from sqlalchemy.orm import Session
from fastapi import Depends

load_dotenv()

app = FastAPI()

#APIをDBが使うときにNeonとの接続を用意し、処理が終われば閉じる
def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()

# フロントエンド(Next.js)からのアクセスを許可する設定(CORS)
app.add_middleware(
    CORSMiddleware,
    #アクセスを許可するオリジンを指定
    allow_origins=["http://localhost:3000"],
    #クッキーや認証ヘッダーの共有を許可
    allow_credentials=True,
    #全てのHTTPメソッドを許可
    allow_methods=["*"],
    #全てのHTTPヘッダーを許可
    allow_headers=["*"],
)

#GEMINI_API_KEYの取得
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("WARNING: GEMINI_API_KEY is not set in .env")

#クライアントの初期化
client = genai.Client(api_key=api_key)

class MessageItem(BaseModel):
    role: str
    content: str

class Document(BaseModel):
    title: str
    content: str

class ChatRequest(BaseModel):
    #過去の会話履歴を含むメッセージのリスト
    messages: List[MessageItem]
    #追加で渡せるドキュメントデータ
    document: Optional[Document] = None

#/api/db-testにGETアクセスが来たら、db_testを実行する
@app.get("/api/db-test")
def db_test():
    #エラーが起きるかもしれない処理
    try:
        #データベースに接続する(コンテキストマネージャー)
        with engine.connect() as connection:
            #データベースサーバーが応答するかを確認
            result = connection.execute(
                text("SELECT 1")
            )

            #レスポンスを返す
            return {
                "database": result.scalar()
            }

    #エラーが発生したときだけ実行
    except Exception as e:
        print(f"Database error: {e}")

        #JSON形式のエラーを返す
        raise HTTPException(
            status_code=500,
            detail="Database connection failed"
        )

#クライアントが/api/chatにリクエストを送るとgenerate_chatが動く
@app.post("/api/chat")
def generate_chat(request: ChatRequest):

    #request.messagesが空の場合は404 Bad Requestを返して中断
    if not request.messages:
        raise HTTPException(
            status_code=400, 
            detail="メッセージが空です"
        )

    #例外処理開始
    try:
        #オーバーレイ内の会話履歴
        formatted_history = []

        #最新の発言以外をループ処理
        for msg in request.messages[:-1]:

            #aiかassistantならmodelに置き換える。そうでなければuserに置き換える
            role = (
                "model" 
                if msg.role in ["ai", "assistant"] 
                else "user"
            )

            #formatted_historyに追加
            formatted_history.append(

                #一つの発言を表す構造体
                types.Content(
                    role=role,
                    parts=[
                        #テキストデータをGemini用の要素に変換
                        types.Part.from_text(
                            #フロントエンドから送られてきた文字列
                            text=msg.content
                        )
                    ],
                )
            )

        #空の変数で初期化
        document_context = ""

        #ドキュメントが開かれているかの確認
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
        #最新メッセージの抽出
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

        #サーバー内部エラー
        raise HTTPException(
            status_code=500, 
            detail="Gemini APIとの連携に失敗しました"
        )

class ProjectCreate(BaseModel):
    title: str
    data: dict = {}

@app.post("api/projects")
def create_project(
    project_data: ProjectCreate,
    db: Session = Depends(get_db)
):
    project = Project(
        title=project_data.titel,
        data=project_data.data,
    )

    db.add(project)
    db.commit()
    db.refresh(project)

    return {
        "id": str(project.id),
        "title": project.title,
        "data": project.data,
    }