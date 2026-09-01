"use client";

import { FormEvent, useEffect, useState } from "react";

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
  const [loading, setLoading] = useState(false);

  const [isInitialized, setIsInitialized] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // =========================
  // 初期化
  // =========================

  useEffect(() => {
    const saved = localStorage.getItem("chat_sessions");

    if (saved) {
      try {
        const parsed: Session[] = JSON.parse(saved);

        setSessions(parsed);

        if (parsed.length > 0) {
          setCurrentSessionId(parsed[0].id);
        }
      } catch (error) {
        console.error("セッションの読み込みに失敗しました:", error);
      }
    }

    setIsInitialized(true);
  }, []);

  // =========================
  // localStorage保存
  // =========================

  useEffect(() => {
    if (!isInitialized) return;

    localStorage.setItem(
      "chat_sessions",
      JSON.stringify(sessions)
    );
  }, [sessions, isInitialized]);

  // =========================
  // 現在のセッション
  // =========================

  const currentSession = sessions.find(
    (session) => session.id === currentSessionId
  );

  // =========================
  // 新しいチャット
  // =========================

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

    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(id);

    // 新規チャットを作ったらAIを閉じる
    setIsChatOpen(false);
  };

  // =========================
  // セッション削除
  // =========================

  const deleteSession = (id: string) => {
    setSessions((prev) => {
      const next = prev.filter(
        (session) => session.id !== id
      );

      if (id === currentSessionId) {
        if (next.length > 0) {
          setCurrentSessionId(next[0].id);
        } else {
          setCurrentSessionId(null);
        }
      }

      return next;
    });
  };

  // =========================
  // ドキュメント更新
  // =========================

  const updateDocument = (
    field: "title" | "content",
    value: string
  ) => {
    if (!currentSessionId) return;

    setSessions((prev) =>
      prev.map((session) => {
        if (session.id !== currentSessionId) {
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

  // =========================
  // メッセージ送信
  // =========================

  const sendMessage = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (!input.trim() || !currentSession) {
      return;
    }

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
    };

    const updatedMessages = [
      ...currentSession.messages,
      userMessage,
    ];

    // 入力欄を空にする
    setInput("");

    // ユーザーメッセージを即座に画面へ追加
    setSessions((prev) =>
      prev.map((session) => {
        if (session.id !== currentSession.id) {
          return session;
        }

        return {
          ...session,
          messages: updatedMessages,

          // 最初のメッセージをチャットタイトルにする
          title:
            session.messages.length === 0
              ? input.trim().slice(0, 30)
              : session.title,
        };
      })
    );

    setLoading(true);

    try {
      const res = await fetch(
        "http://localhost:8000/api/chat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: updatedMessages,
            document: currentSession.document,
          }),
        }
      );

      const responseText = await res.text();

      if (!res.ok) {
        console.error(
          "API Error:",
          res.status,
          responseText
        );

        throw new Error(
          `APIエラー: ${res.status}`
        );
      }

      const data = JSON.parse(responseText);

      const aiMessage: Message = {
        role: "ai",
        content: data.response,
      };

      setSessions((prev) =>
        prev.map((session) => {
          if (session.id !== currentSession.id) {
            return session;
          }

          return {
            ...session,
            messages: [
              ...session.messages,
              aiMessage,
            ],
          };
        })
      );
    } catch (error) {
      console.error("チャットエラー:", error);

      const errorMessage: Message = {
        role: "ai",
        content:
          "AIとの通信に失敗しました。FastAPIサーバーが起動しているか確認してください。",
      };

      setSessions((prev) =>
        prev.map((session) => {
          if (session.id !== currentSession.id) {
            return session;
          }

          return {
            ...session,
            messages: [
              ...session.messages,
              errorMessage,
            ],
          };
        })
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // セッションがない場合
  // =========================

  if (!currentSession) {
    return (
      <div className="empty-app">
        <div className="empty-app-content">
          <h1>Scenario Studio</h1>

          <p>
            シナリオ制作を始めましょう。
          </p>

          <button
            onClick={createNewSession}
            className="btn-start"
          >
            ＋ 新しいシナリオを作成
          </button>
        </div>
      </div>
    );
  }

  // =========================
  // UI
  // =========================

  return (
    <div className="chat-app-container">

      {/* ========================================
          左サイドバー
      ======================================== */}

      <aside className="sidebar">

        <div className="app-logo">
          <div className="app-logo-mark">
            S
          </div>

          <div>
            <div className="app-logo-title">
              Scenario
            </div>

            <div className="app-logo-subtitle">
              Studio
            </div>
          </div>
        </div>

        <button
          onClick={createNewSession}
          className="btn-new-chat"
        >
          <span>＋</span>
          新しいチャット
        </button>

        <div className="sidebar-label">
          CHAT HISTORY
        </div>

        <div className="session-list">

          {sessions.map((session) => (
            <div
              key={session.id}
              className={`session-item ${
                session.id === currentSessionId
                  ? "session-item-active"
                  : ""
              }`}
            >

              <button
                onClick={() => {
                  setCurrentSessionId(session.id);
                  setIsChatOpen(false);
                }}
                className="session-select"
              >
                <span className="session-icon">
                  💬
                </span>

                <span className="session-title">
                  {session.title}
                </span>
              </button>

              <button
                onClick={() =>
                  deleteSession(session.id)
                }
                className="session-delete"
                title="チャットを削除"
              >
                ×
              </button>

            </div>
          ))}

        </div>

      </aside>


      {/* ========================================
          メインエリア
      ======================================== */}

      <main className="main-content">

        {/* ========================================
            上部ホバーメニュー
        ======================================== */}

        <div className="top-menu-area">

          <div className="top-menu-trigger">
            SCENARIO SETTINGS
          </div>

          <div className="top-menu">

            <button>
              <span>🌎</span>
              世界観
            </button>

            <button>
              <span>👤</span>
              キャラクター
            </button>

            <button>
              <span>📖</span>
              プロット
            </button>

            <button>
              <span>🕒</span>
              時系列
            </button>

            <button>
              <span>⚙</span>
              設定
            </button>

          </div>

        </div>


        {/* ========================================
            シナリオエディタ
        ======================================== */}

        <div className="document-editor">

          <input
            type="text"
            value={
              currentSession.document.title
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

          <div className="document-meta">
            SCENARIO
          </div>

          <textarea
            value={
              currentSession.document.content
            }
            onChange={(e) =>
              updateDocument(
                "content",
                e.target.value
              )
            }
            className="document-content"
            placeholder={
              "ここにシナリオを書いてください...\n\n" +
              "世界観やキャラクター設定を入力して、" +
              "AIと一緒に物語を作っていきましょう。"
            }
          />

        </div>


        {/* ========================================
            AI起動ボタン
        ======================================== */}

        {!isChatOpen && (
          <button
            className="chat-toggle"
            onClick={() => setIsChatOpen(true)}
          >
            <span className="chat-toggle-icon">
              ✦
            </span>

            <span>
              AI Assistant
            </span>
          </button>
        )}


        {/* ========================================
            AIオーバーレイ
        ======================================== */}

        {isChatOpen && (

          <div className="chat-overlay">

            <div className="chat-panel">

              {/* ヘッダー */}

              <div className="chat-header">

                <div className="chat-header-info">

                  <div className="ai-avatar">
                    ✦
                  </div>

                  <div>
                    <div className="chat-header-title">
                      AI Assistant
                    </div>

                    <div className="chat-header-status">
                      Scenario Assistant
                    </div>
                  </div>

                </div>

                <button
                  className="chat-close"
                  onClick={() =>
                    setIsChatOpen(false)
                  }
                >
                  ×
                </button>

              </div>


              {/* チャット履歴 */}

              <div className="chat-history">

                {currentSession.messages.length === 0 ? (

                  <div className="chat-empty">

                    <div className="chat-empty-icon">
                      ✦
                    </div>

                    <h3>
                      シナリオを一緒に作ろう
                    </h3>

                    <p>
                      世界観やキャラクター、
                      展開について相談できます。
                    </p>

                  </div>

                ) : (

                  currentSession.messages.map(
                    (msg, index) => (

                      <div
                        key={index}
                        className={
                          msg.role === "user"
                            ? "msg-row-user"
                            : "msg-row-ai"
                        }
                      >

                        {msg.role === "ai" && (
                          <div className="message-avatar">
                            ✦
                          </div>
                        )}

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

                {loading && (

                  <div className="msg-row-ai">

                    <div className="message-avatar">
                      ✦
                    </div>

                    <div className="loading-bubble">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>

                  </div>

                )}

              </div>


              {/* 入力フォーム */}

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
                  placeholder="シナリオについて相談..."
                  className="chat-input"
                  disabled={loading}
                />

                <button
                  type="submit"
                  disabled={
                    loading ||
                    !input.trim()
                  }
                  className="chat-btn"
                >
                  ↑
                </button>

              </form>

            </div>

          </div>

        )}

      </main>

    </div>
  );
}