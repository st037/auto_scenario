"use client";

import { useState, useEffect, SyntheticEvent, useRef } from "react";

type Message = {
  role: "user" | "ai";
  content: string;
};

type Document = {
  id: string;
  title: string;
  content: string;
};

type Session = {
  id: string;
  title: string;
  messages: Message[];
  document: Document;
};

export default function Home() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState(false); // 初回ロード完了フラグ
  const [isChatOpen, setIsChatOpen] = useState(false);

  // 1. 初回ロード（LocalStorageから読み込み）
  useEffect(() => {
    const saved = localStorage.getItem(
      "chat_sessions"
    );

    if (saved) {
      try {
        const parsedSessions: Session[] = JSON.parse(saved);
        if (parsedSessions.length > 0) {
          setSessions(parsedSessions);
          setCurrentSessionId(parsedSessions[0].id);
        } else {
          createNewSession();
        }
      } catch {
        createNewSession();
      }
    } else {
      createNewSession();
    }
    setIsInitialized(true); // 初期化完了
  }, []);

  // 2. セッションが更新されたら LocalStorage に保存
  useEffect(() => {
    if (!isInitialized) return; {

      localStorage.setItem(
        "chat_sessions", 
        JSON.stringify(sessions)
      );
    }
  }, [sessions, isInitialized]);

  const currentSession = 
  sessions.find(
    (s) => s.id === currentSessionId
  );

  // 新規セッション作成
  const createNewSession = () => {

    const id = Date.now().toString();

    const newSession: Session = {
      id,
      title: "新しいチャット",

      messages: [],

      document: {
        id: `document-${id}`,
        title: "新しいシナリオ",
        content: "",
      },
    };

    setSessions((prev) => [
      newSession,
       ...prev
    ]);

    setCurrentSessionId(id);
  };

  const deleteSession = (id: string) => {

    setSessions((prev) => {

      const newSessions = 
        prev.filter(
          (s) => s.id !== id
        );

      if(id === currentSessionId) {

        if (newSessions.length > 0) {
          setCurrentSessionId(
            newSessions[0].id
          );
        } else {
          setCurrentSessionId(null)
        }
    
      } 

      return newSessions;
    });
  };

  //ドキュメント更新
  const updateDocument = (
    field: "title" | "content",
    value: string
  ) => {

    if (!currentSessionId) return;

    setSessions((prev) =>
      prev.map((session) => {

        if (
          session.id !==
          currentSessionId
        ) {
          return session;
        }
        return {
          ...session,

          document: {
            ...session.document,
            [field]: value,
          },
        };
      })
    );
  };

  // メッセージ送信
  const sendMessage = async (
    e: SyntheticEvent<HTMLFormElement>
  ) => {

    e.preventDefault();

    if (
      !input.trim() || 
      loading || 
      !currentSessionId ||
      !currentSession
    ) {
      return;
    }

    const userText = input;

    setInput("");

    const currentMsgs = 
      currentSession?.messages || [];

    const updatedMsgs: Message[] = [
      ...currentMsgs,

      { 
        role: "user", 
        content: userText 
      },
    ];

    const isFirstMessage = 
      currentMsgs.length === 0;

    const newTitle = 
      isFirstMessage
        ? userText.slice(0, 15)
        : currentSession?.title;

    // ユーザー発言を即時反映 & タイトル更新
    setSessions((prev) =>
      prev.map((s) =>
        s.id === currentSessionId
          ? { 
              ...s, 
              title: 
                newTitle || s.title, 
              messages: updatedMsgs 
            }
          : s
      )
    );

    setLoading(true);

    try {

      const res = await fetch(
        "http://localhost:8000/api/chat", 
        {
        method: "POST",

        headers: { 
          "Content-Type": 
            "application/json", 
        },

        body: JSON.stringify({ 
          messages: updatedMsgs,
          
          document: 
            currentSession.document,
            
        }),
        }
      );

      if (!res.ok) {

        const errorText = 
          await res.text();

        console.error(
          "API Error",
          res.status,
          errorText
        );

        throw new Error("APIエラーが発生しました");
      }

      const data = await res.json();

      // AIの返答を反映
      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId
            ? {
                ...s,
                messages: [
                  ...updatedMsgs,
                  { 
                    role: "ai", 
                    content:
                     data.response,
                  },
                ],
              }
            : s
        )
      );

    } catch (error) {

      console.error(error);

    } finally {

      setLoading(false);
    }
  };

  return (
    <div className="chat-app-container">
    
      {/* ─── 左側：サイドバー ─── */}
  
      <div className="sidebar">
  
        <button
          onClick={createNewSession}
          className="btn-new-chat"
        >
          <span>+</span> 新しいチャット
        </button>
  
        <div className="session-list">
  
          {sessions.map((s) => (
          
            <div
              key={s.id}
              className={`session-item ${
                s.id === currentSessionId
                  ? "session-item-active"
                  : ""
              }`}
            >
            
              <button
                onClick={() =>
                  setCurrentSessionId(s.id)
                }
                className="session-select"
              >
                <span>💬 {s.title}</span>
              </button>
              
              <button
                onClick={() =>
                  deleteSession(s.id)
                }
                className="session-delete"
                title="チャットを削除"
              >
                ✖
              </button>
              
            </div>
  
          ))}
  
        </div>
        
      </div>
        
        
      {/* ─── 右側：メインコンテンツ ─── */}
        
      <div className="main-content">
        
        
        {/* =========================
            Document Editor
            ========================= */}
  
        <div className="document-editor">
        
          <input
            type="text"
            value={
              currentSession?.document.title || ""
            }
            onChange={(e) =>
              updateDocument(
                "title",
                e.target.value
              )
            }
            className="document-title"
            placeholder="シナリオタイトル"
          />
  
          <textarea
            value={
              currentSession?.document.content || ""
            }
            onChange={(e) =>
              updateDocument(
                "content",
                e.target.value
              )
            }
            className="document-content"
            placeholder="ここにシナリオを書いてください..."
          />
  
        </div>
          
          
        {/* =========================
            AI Chat Button
            ========================= */}
  
        <button
          className="chat-toggle"
          onClick={() => setIsChatOpen(true)}
        >
          💬 AI
        </button>
        
        
        {/* =========================
            Chat Overlay
            ========================= */}
  
        {isChatOpen && (
        
          <div className="chat-overlay">
          
            <div className="chat-panel">
        
        
              {/* ─── Chat Header ─── */}
        
              <div className="chat-header">
        
                <span>AIアシスタント</span>
        
                <button
                  className="chat-close"
                  onClick={() =>
                    setIsChatOpen(false)
                  }
                >
                  ✖
                </button>
                
              </div>
                
                
              {/* ─── Chat History ─── */}
                
              <div className="chat-history">
                
                {currentSession?.messages.length === 0 ? (
                
                  <div className="chat-empty">
                    アイディアやシナリオについて相談してみよう
                  </div>
  
                ) : (
                
                  currentSession?.messages.map(
                    (msg, index) => (
                    
                      <div
                        key={index}
                        className={
                          msg.role === "user"
                            ? "msg-row-user"
                            : "msg-row-ai"
                        }
                      >
                      
                        <div
                          className={
                            msg.role === "user"
                              ? "msg-bubble-user"
                              : "msg-bubble-ai"
                          }
                        >
                          {msg.content}
                        </div>
                        
                      </div>
  
                    )
                  )
                
                )}
  
              
                {/* ─── Loading ─── */}
              
                {loading && (
                
                  <div className="msg-row-ai">
                  
                    <div className="loading-bubble">
                      Geminiが考えています...
                    </div>
                
                  </div>
  
                )}
  
              </div>
              
              
              {/* ─── Chat Input ─── */}
              
              <form
                onSubmit={sendMessage}
                className="chat-form"
              >
              
                <input
                  type="text"
                  value={input}
                  onChange={(e) =>
                    setInput(e.target.value)
                  }
                  placeholder="メッセージを入力..."
                  className="chat-input"
                />
  
                <button
                  type="submit"
                  disabled={
                    loading ||
                    !input.trim()
                  }
                  className="chat-btn"
                >
                  送信
                </button>
                
              </form>
                
                
            </div>
                
          </div>
  
        )}
  
      </div>
      
    </div>
  );
}