"use client";

import { FormEvent, useMemo, useState } from "react";
import { ChatMessage } from "../types";

interface ChatWindowProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => Promise<void>;
  isSending?: boolean;
}

export default function ChatWindow({ messages, onSendMessage, isSending = false }: ChatWindowProps) {
  const [draft, setDraft] = useState("");

  const canSend = useMemo(() => Boolean(draft.trim()) && !isSending, [draft, isSending]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSend) return;

    const content = draft.trim();
    setDraft("");
    await onSendMessage(content);
  };

  return (
    <section className="chat-shell">
      <div className="chat-messages" aria-live="polite">
        {messages.map((message) => (
          <article
            key={message.id}
            className={`chat-bubble ${message.role === "user" ? "chat-bubble-user" : "chat-bubble-assistant"}`}
          >
            <p>{message.content}</p>
          </article>
        ))}
      </div>

      <form className="chat-compose" onSubmit={handleSubmit}>
        <input
          className="chat-input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="键入您的回答并点击发送..."
        />
        <button className="primary-btn" type="submit" disabled={!canSend}>
          {isSending ? "发送中..." : "发送"}
        </button>
      </form>
    </section>
  );
}
