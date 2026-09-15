"use client";

import { FormEvent, useEffect, useState } from "react";
import type {
  Message,
  World,
  Character,
  Plot,
  Timeline,
  Project,
  Session,
} from "./types/project";
import ChatOverlay from "./components/chat-overlay";

//HOMEをエクスポート可能にする
export default function Home() {
  //Session型オブジェクトが入る
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [isInitialized, setIsInitialized] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  //Union型　型定義
  type EditorMode =
  | "scenario"
  | "world"
  | "characters"
  | "plot"
  | "timeline"
  | "settings";

const [editorMode, setEditorMode] =
  useState<EditorMode>("scenario");

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
    title: "新しいシナリオ",

    messages: [],

    project: {
      world: {
        description: "",
        era: "",
        technology: "",
        rules: "",
      },

      characters: [
        {
          id: `character-${id}-1`,
          name: "",
          age: "",
          personality: "",
          background: "",
          goal: "",
        },
      ],

      plot: {
        summary: "",
        chapters: "",
      },

      timeline: {
        past: "",
        present: "",
        future: "",
      },

      scenario: {
        title: "新しいシナリオ",
        content: "",
      },
    },
  };

  setSessions((prev) => [
    newSession,
    ...prev,
  ]);

  setCurrentSessionId(id);

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

  const updateScenario = (
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

        project: {
          ...session.project,

          scenario: {
            ...session.project.scenario,
            [field]: value,
          },
        },
      };
    })
  );
};

const updateWorld = (
  field: keyof World,
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

        project: {
          ...session.project,

          world: {
            ...session.project.world,
            [field]: value,
          },
        },
      };
    })
  );
};

const updateCharacter = (
  id: string,
  field: keyof Character,
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

        project: {
          ...session.project,

          characters:
            session.project.characters.map(
              (character) =>
                character.id === id
                  ? {
                      ...character,
                      [field]: value,
                    }
                  : character
            ),
        },
      };
    })
  );
};

const updatePlot = (
  field: keyof Plot,
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

        project: {
          ...session.project,

          plot: {
            ...session.project.plot,
            [field]: value,
          },
        },
      };
    })
  );
};

const updateTimeline = (
  field: keyof Timeline,
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

        project: {
          ...session.project,

          timeline: {
            ...session.project.timeline,
            [field]: value,
          },
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
            project: currentSession.project,
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

            <button 
              onClick={() => setEditorMode("world")}
            >
              <span>🌎</span>
              世界観
            </button>

            <button
              onClick={() => setEditorMode("characters")}
            >
              <span>👤</span>
              キャラクター
            </button>

            <button
              onClick={() => setEditorMode("plot")}
            >
              <span>📖</span>
              プロット
            </button>

            <button
              onClick={() => setEditorMode("timeline")}
            >
              <span>🕒</span>
              時系列
            </button>

            <button
              onClick={() => setEditorMode("settings")}
            >
              <span>⚙</span>
              設定
            </button>

            <button
              onClick={() => setEditorMode("scenario")}
            >
              <span>📝</span>
              シナリオ
            </button>

          </div>

        </div>


        {/* ========================================
            シナリオエディタ
        ======================================== */}

        <div className="document-editor">

          {editorMode === "scenario" && (
            <>
              <input
                type="text"
                value={
                  currentSession.project.scenario.title
                }
                onChange={(e) =>
                  updateScenario(
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
                  currentSession.project.scenario.content
                }
                onChange={(e) =>
                  updateScenario(
                  "content",
                  e.target.value
                  )
                }
                className="document-content"
                placeholder="ここにシナリオを書いてください..."
              />
            </>
          )}


          {editorMode === "world" && (
            <div className="settings-editor">

              <h1>世界観</h1>

              <p className="settings-description">
                物語の舞台となる世界について設定します。
              </p>

              <label>
                世界の説明
              </label>

              <textarea
                value={
                  currentSession.project.world.description
                }
                onChange={(e) =>
                  updateWorld(
                    "description",
                    e.target.value
                  )
                }
                placeholder="この世界はどのような世界なのか..."
              />

              <label>
                時代
              </label>

              <textarea
                value={
                  currentSession.project.world.era
                }
                onChange={(e) =>
                  updateWorld(
                  "era",
                  e.target.value
                  )
                }
                placeholder="いつの時代の物語なのか..."
              />

              <label>
                技術・文明
              </label>

              <textarea
                value={
                  currentSession.project.world.technology
                }
                onChange={(e) =>
                  updateWorld(
                    "technology",
                    e.target.value
                  )
                }
                placeholder="科学技術、魔法、文明レベルなど..."
              />

                      <label>
                世界のルール
              </label>

                      <textarea
                value={
                  currentSession.project.world.rules
                }
                onChange={(e) =>
                  updateWorld(
                    "rules",
                    e.target.value
                  )
                }
                placeholder="この世界に存在するルールや制約..."
              />

            </div>
          )}


          {editorMode === "characters" && (
            <div className="settings-editor">
            
              <h1>キャラクター</h1>
          
              <p className="settings-description">
                登場人物の設定を管理します。
              </p>
          
              {currentSession.project.characters.map(
                (character) => (
                
                  <div
                    key={character.id}
                    className="character-card"
                  >
                  
                    <input
                      value={character.name}
                      onChange={(e) =>
                        updateCharacter(
                          character.id,
                          "name",
                          e.target.value
                        )
                      }
                      placeholder="名前"
                      className="character-name"
                    />
        
                    <label>
                      年齢
                    </label>
                    
                    <input
                      value={character.age}
                      onChange={(e) =>
                        updateCharacter(
                          character.id,
                          "age",
                          e.target.value
                        )
                      }
                      placeholder="18歳"
                    />
        
                    <label>
                      性格
                    </label>
                    
                    <textarea
                      value={character.personality}
                      onChange={(e) =>
                        updateCharacter(
                          character.id,
                          "personality",
                          e.target.value
                        )
                      }
                      placeholder="性格..."
                    />
        
                    <label>
                      過去
                    </label>
                    
                    <textarea
                      value={character.background}
                      onChange={(e) =>
                        updateCharacter(
                          character.id,
                          "background",
                          e.target.value
                        )
                      }
                      placeholder="このキャラクターの過去..."
                    />
        
                    <label>
                      目的
                    </label>
                    
                    <textarea
                      value={character.goal}
                      onChange={(e) =>
                        updateCharacter(
                          character.id,
                          "goal",
                          e.target.value
                        )
                      }
                      placeholder="このキャラクターが達成したいこと..."
                    />
        
                  </div>
        
                )
              )}
        
            </div>
          )}
        
        
          {editorMode === "plot" && (
            <div className="settings-editor">
            
              <h1>プロット</h1>
          
              <p className="settings-description">
                物語全体の構成を管理します。
              </p>
          
              <label>
                全体のあらすじ
              </label>
          
              <textarea
                value={
                  currentSession.project.plot.summary
                }
                onChange={(e) =>
                  updatePlot(
                    "summary",
                    e.target.value
                  )
                }
                placeholder="物語全体の大まかな流れ..."
              />
        
              <label>
                各章の構成
              </label>
              
              <textarea
                value={
                  currentSession.project.plot.chapters
                }
                onChange={(e) =>
                  updatePlot(
                    "chapters",
                    e.target.value
                  )
                }
                placeholder={
                  "第1章：...\n" +
                  "第2章：...\n" +
                  "第3章：..."
                }
              />
        
            </div>
          )}
        
        
          {editorMode === "timeline" && (
            <div className="settings-editor">
            
              <h1>時系列</h1>
          
              <p className="settings-description">
                物語の時間軸を管理します。
              </p>
          
              <label>
                過去
              </label>
          
              <textarea
                value={
                  currentSession.project.timeline.past
                }
                onChange={(e) =>
                  updateTimeline(
                    "past",
                    e.target.value
                  )
                }
                placeholder="物語開始以前に起きた出来事..."
              />
        
              <label>
                現在
              </label>
              
              <textarea
                value={
                  currentSession.project.timeline.present
                }
                onChange={(e) =>
                  updateTimeline(
                    "present",
                    e.target.value
                  )
                }
                placeholder="現在起きている出来事..."
              />
        
              <label>
                未来
              </label>
              
              <textarea
                value={
                  currentSession.project.timeline.future
                }
                onChange={(e) =>
                  updateTimeline(
                    "future",
                    e.target.value
                  )
                }
                placeholder="今後起こる予定の出来事..."
              />
        
            </div>
          )}
        
        
          {editorMode === "settings" && (
            <div className="settings-editor">
            
              <h1>設定</h1>
          
              <p className="settings-description">
                シナリオ制作に関する設定を管理します。
              </p>
          
              <div className="setting-item">
                <span>AIアシスタント</span>
                <span className="setting-status">
                  Gemini
                </span>
              </div>
          
              <div className="setting-item">
                <span>保存方式</span>
                <span className="setting-status">
                  LocalStorage
                </span>
              </div>
          
            </div>
          )}
        
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
          <ChatOverlay
            messages={currentSession.messages}
            input={input}
            loading={loading}
            setInput={setInput}
            sendMessage={sendMessage}
            setIsChatOpen={setIsChatOpen}
          />
        )}

      </main>

    </div>
  );
}