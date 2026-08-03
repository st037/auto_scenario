from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# フロントエンド(Next.js)からのアクセスを許可する設定(CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ルートパス (動作確認用)
@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI!"}

# ★ ここが必要です！
@app.get("/api/hello")
def get_hello():
    return {"message": "FastAPIとの接続に成功しました！"}