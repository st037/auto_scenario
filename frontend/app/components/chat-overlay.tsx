"use client";

import type { SubmitEvent } from "react";
import type { Message } from "../types/project";

type ChatOverlayProps = {
  //Message型のオブジェクトが入るリスト
  messages: Message[];
  input: string;
  loading: boolean;
  /*()内の引数を受け取って、何も返さない関数(状態を変える関数)*/
  setInput: (value: string) => void;
  sendMessage: (e: SubmitEvent<HTMLFormElement>) => void;
  setIsChatOpen: (value: boolean) => void;
};

export default function ChatOverlay({
  messages,
  input,
  loading,
  setInput,
  sendMessage,
  setIsChatOpen,
}: ChatOverlayProps) {
  return (
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
            onClick={() => setIsChatOpen(false)}
          >
            ×
          </button>

        </div>


        {/* チャット履歴 */}

        <div className="chat-history">

          {messages.length === 0 ? (

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

            messages.map((msg, index) => (

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

            ))

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
  );
}