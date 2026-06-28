import { useEffect, useRef, useState, useCallback } from "react";

const FALLBACK_ANSWER =
  "I can best help with questions about your specific gut findings — try asking about your Akkermansia levels, what to eat, why you're bloated, how your gut affects your energy, or what the estrobolome is.";

const GREETING =
  "Hi Susan! I'm your gut health guide. I've read your full microbiome report and I'm ready to answer questions about your findings. You can ask me why your Akkermansia is low, what to eat, how your gut affects your hormones, or anything else about your results.";

const SUGGESTED = [
  "Why is my Akkermansia so low?",
  "Why do I feel so bloated?",
  "What should I eat?",
  "How does this affect my hormones?",
  "Which finding is most urgent?",
];

function findAnswer(question, qaData) {
  if (!qaData?.length) return FALLBACK_ANSWER;
  const q = question.toLowerCase();
  let best = null;
  let bestScore = 0;
  for (const item of qaData) {
    const score = item.keywords.filter((kw) => q.includes(kw)).length;
    if (score > bestScore) { bestScore = score; best = item; }
  }
  return bestScore > 0 ? best.answer : FALLBACK_ANSWER;
}

function speak(text, onStart, onEnd) {
  if (!("speechSynthesis" in window)) {
    onStart?.();
    setTimeout(onEnd, text.length * 40);
    return;
  }
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.rate = 0.92;
  utt.pitch = 1.05;
  const voices = window.speechSynthesis.getVoices();
  const preferred =
    voices.find((v) => v.lang.startsWith("en") && v.name.toLowerCase().includes("female")) ||
    voices.find((v) => v.lang.startsWith("en")) ||
    voices[0];
  if (preferred) utt.voice = preferred;
  utt.onstart = onStart;
  utt.onend = onEnd;
  utt.onerror = onEnd;
  window.speechSynthesis.speak(utt);
}

export default function AvatarChat({ onClose }) {
  const iframeRef = useRef(null);
  const messagesEndRef = useRef(null);

  const [qaData, setQaData] = useState([]);
  const [messages, setMessages] = useState([{ role: "guide", text: GREETING }]);
  const [input, setInput] = useState("");
  const [isTalking, setIsTalking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [avatarReady, setAvatarReady] = useState(false);

  // Load Q&A
  useEffect(() => {
    fetch("/susan_qa.json").then((r) => r.json()).then(setQaData).catch(() => {});
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Listen for avatar iframe messages
  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === "avatar_loaded") setAvatarReady(true);
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  // Speak greeting once avatar is ready
  useEffect(() => {
    if (!avatarReady) return;
    const timer = setTimeout(() => {
      speak(GREETING, () => setIsTalking(true), () => setIsTalking(false));
    }, 600);
    return () => { clearTimeout(timer); window.speechSynthesis?.cancel(); };
  }, [avatarReady]);

  // Sync talking state to iframe
  useEffect(() => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: isTalking ? "talking" : "idle" },
      "*"
    );
  }, [isTalking]);

  const handleSend = useCallback(
    (text) => {
      const question = (text || input).trim();
      if (!question) return;
      setInput("");
      setMessages((prev) => [...prev, { role: "user", text: question }]);
      setIsLoading(true);
      setTimeout(() => {
        const answer = findAnswer(question, qaData);
        setMessages((prev) => [...prev, { role: "guide", text: answer }]);
        setIsLoading(false);
        speak(answer, () => setIsTalking(true), () => setIsTalking(false));
      }, 400);
    },
    [input, qaData]
  );

  return (
    <div className="avatar-overlay">
      <div className="avatar-panel">
        {/* Avatar scene — TalkingHead in iframe */}
        <div className="avatar-scene">
          <iframe
            ref={iframeRef}
            src="/avatar.html"
            title="Gut Guide Avatar"
            style={{ width: "100%", height: "100%", border: "none", display: "block" }}
            sandbox="allow-scripts allow-same-origin"
          />
          {!avatarReady && (
            <div className="avatar-iframe-loading">Loading avatar…</div>
          )}
          <div className="avatar-name-tag">
            <span className={`avatar-status ${isTalking ? "talking" : "listening"}`} />
            Gut Guide
          </div>
        </div>

        {/* Chat panel */}
        <div className="avatar-chat-panel">
          <div className="avatar-chat-header">
            <span className="avatar-chat-title">Gut Guide</span>
            <button className="avatar-close" onClick={onClose} aria-label="Close">✕</button>
          </div>

          <div className="avatar-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`avatar-msg avatar-msg-${msg.role}`}>
                {msg.role === "guide" && <span className="avatar-msg-icon">🦠</span>}
                <p>{msg.text}</p>
              </div>
            ))}
            {isLoading && (
              <div className="avatar-msg avatar-msg-guide">
                <span className="avatar-msg-icon">🦠</span>
                <p className="avatar-thinking"><span /><span /><span /></p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {messages.length <= 1 && (
            <div className="avatar-suggestions">
              {SUGGESTED.map((q) => (
                <button key={q} className="avatar-suggestion" onClick={() => handleSend(q)}>
                  {q}
                </button>
              ))}
            </div>
          )}

          <div className="avatar-input-row">
            <input
              className="avatar-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask about your gut health…"
              autoFocus
            />
            <button
              className="avatar-send"
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
            >
              →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
