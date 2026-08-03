"use client";

import { useState } from "react";

export default function Home() {
  const [message, setMessage] = useState<string>("ボタンを押して接続テスト");
  const [loading, setLoading] = useState<boolean>(false);

  const fetchApi = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/hello");
      const data = await response.json();
      setMessage(data.message);
    } catch (error) {
      console.error(error);
      setMessage("接続に失敗しました。FastAPIが起動しているか確認してください。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="main-container">
      <div className="card-wrapper">
        <h1 className="text-3xl font-bold">シナリオ自動生成アプリ</h1>
    
        <div className="card-box">
          <p className="text-lg mb-4">{loading ? "通信中..." : message}</p>
      
          <button
            onClick={fetchApi}
            disabled={loading}
            className="btn-primary"
          >
            FastAPIと通信する
          </button>
        </div>
      </div>
    </main>
  );
}