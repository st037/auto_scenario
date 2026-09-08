import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set")

engine = create_engine(
    #DATABASE_URLのpostgresqlをpostgresql+psycopgに置換する
    DATABASE_URL.replace(
        "postgresql://",
        "postgresql+psycopg://",
    ),
    #接続切れを防ぐためのチェック
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(
    #自動コミットを無効化し、不完全なデータの保存を防ぐ
    autocommit=False,
    #自動フラッシュを無効化し、未コミットの変更を手動制御することで、意図しない変更を防ぐ
    autoflush=False,
    #紐づけるデータベースの指定
    bind=engine,
)

#データベースの形を定義するために使う
class Base(DeclarativeBase):
    pass