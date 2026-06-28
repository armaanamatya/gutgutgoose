/**
 * 3D talking avatar + conversational gut health guide for Susan.
 *
 * Avatar: Three.js RobotExpressive (CC0, hosted on threejs.org CDN)
 * Animations: Idle ↔ Wave (talking state) via @react-three/drei useAnimations
 * Speech: Web Speech API (browser-native TTS, no API key)
 * Q&A: keyword-matched against pre-computed susan_qa.json pairs
 */

import { Suspense, useEffect, useRef, useState, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF, useAnimations, Environment, OrbitControls } from "@react-three/drei";

const AVATAR_URL =
  "https://threejs.org/examples/models/gltf/RobotExpressive/RobotExpressive.glb";

const FALLBACK_ANSWER =
  "I can best help with questions about your specific gut findings — try asking about your Akkermansia levels, what to eat, why you're bloated, how your gut affects your energy, or what the estrobolome is.";

// ── Avatar 3D model ──────────────────────────────────────────────────────────

function AvatarModel({ isTalking }) {
  const group = useRef();
  const { scene, animations } = useGLTF(AVATAR_URL);
  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    if (!actions) return;
    const idle = actions["Idle"];
    const talk = actions["Wave"];
    if (isTalking) {
      idle?.fadeOut(0.3);
      talk?.reset().fadeIn(0.3).play();
    } else {
      talk?.fadeOut(0.3);
      idle?.reset().fadeIn(0.3).play();
    }
  }, [isTalking, actions]);

  // Start idle on mount
  useEffect(() => {
    actions?.["Idle"]?.play();
  }, [actions]);

  return (
    <primitive
      ref={group}
      object={scene}
      scale={1.1}
      position={[0, -0.9, 0]}
      rotation={[0, 0.1, 0]}
    />
  );
}

// ── Q&A engine ───────────────────────────────────────────────────────────────

function findAnswer(question, qaData) {
  if (!qaData?.length) return FALLBACK_ANSWER;
  const q = question.toLowerCase();
  let best = null;
  let bestScore = 0;
  for (const item of qaData) {
    const score = item.keywords.filter((kw) => q.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }
  return bestScore > 0 ? best.answer : FALLBACK_ANSWER;
}

// ── Web Speech TTS ───────────────────────────────────────────────────────────

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
  // prefer a female voice if available
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(
    (v) => v.lang.startsWith("en") && v.name.toLowerCase().includes("female")
  ) || voices.find((v) => v.lang.startsWith("en")) || voices[0];
  if (preferred) utt.voice = preferred;
  utt.onstart = onStart;
  utt.onend = onEnd;
  window.speechSynthesis.speak(utt);
}

// ── Main component ───────────────────────────────────────────────────────────

const GREETING =
  "Hi Susan! I'm your gut health guide. I've read your full microbiome report and I'm ready to answer questions about your findings. You can ask me why your Akkermansia is low, what to eat, how your gut affects your hormones, or anything else about your results.";

const SUGGESTED = [
  "Why is my Akkermansia so low?",
  "Why do I feel so bloated?",
  "What should I eat?",
  "How does this affect my hormones?",
  "Which finding is most urgent?",
];

export default function AvatarChat({ onClose }) {
  const [qaData, setQaData] = useState([]);
  const [messages, setMessages] = useState([
    { role: "guide", text: GREETING },
  ]);
  const [input, setInput] = useState("");
  const [isTalking, setIsTalking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Load Q&A data
  useEffect(() => {
    fetch("/susan_qa.json")
      .then((r) => r.json())
      .then(setQaData)
      .catch(() => {});
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Speak greeting on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      speak(GREETING, () => setIsTalking(true), () => setIsTalking(false));
    }, 800);
    return () => {
      clearTimeout(timer);
      window.speechSynthesis?.cancel();
    };
  }, []);

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
        {/* Close */}
        <button className="avatar-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        {/* 3D scene */}
        <div className="avatar-scene">
          <Canvas camera={{ position: [0, 0.5, 3], fov: 45 }}>
            <ambientLight intensity={0.6} />
            <directionalLight position={[2, 4, 2]} intensity={0.8} />
            <Suspense fallback={null}>
              <AvatarModel isTalking={isTalking} />
              <Environment preset="city" />
            </Suspense>
          </Canvas>
          <div className="avatar-name-tag">
            <span className={`avatar-status ${isTalking ? "talking" : "listening"}`} />
            Gut Guide
          </div>
        </div>

        {/* Chat panel */}
        <div className="avatar-chat-panel">
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
                <p className="avatar-thinking">
                  <span /><span /><span />
                </p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested questions */}
          {messages.length <= 1 && (
            <div className="avatar-suggestions">
              {SUGGESTED.map((q) => (
                <button key={q} className="avatar-suggestion" onClick={() => handleSend(q)}>
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
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
