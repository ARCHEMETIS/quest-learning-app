// หน้าแชทโค้ช AI ของลุยเควส (ticket #5 — design-brief section 3.6) — mock data ด้านล่าง ฝั่งโค้ดต่อ API จริงเองภายหลัง
// states: empty (ยังไม่เคยคุย) | active (คุยอยู่ พิมพ์/ส่งได้จริงในนี้) | typing (โค้ชกำลังพิมพ์ — สแนปช็อตรีวิว)
//         | quota (โควต้าหมด 0/10) | failed (ส่งไม่สำเร็จ — สแนปช็อตรีวิว)
// กติกาโควต้า: นับตอนผู้ใช้ "ส่งสำเร็จ" เท่านั้น ครบ 10 แล้วช่องพิมพ์ disable ทันที + บอกเวลารีเซ็ต

import { useEffect, useRef, useState } from "react";
import GhostMascot from "./GhostMascot";

const QUOTA_TOTAL = 10;

const MOCK = {
  topic: "Python",
  userInitial: "พ",
  suggestions: [
    "ตัวแปรกับค่าคงที่ต่างกันยังไง",
    "โค้ดฉัน error ตรงนี้ แก้ยังไงดี",
    "ขอตัวอย่างโจทย์ฝึกเพิ่ม",
  ],
  // ชุดคำตอบโค้ชแบบวนไว้ demo การพิมพ์จริงในหน้านี้ (ของจริงยิง API)
  replies: [
    "ตัวแปร (variable) เปลี่ยนค่าได้ระหว่างรันโปรแกรม ส่วนค่าคงที่ตั้งไว้แล้วไม่ควรเปลี่ยน ใน Python ไม่มีคีย์เวิร์ด const จริง ๆ แต่นิยมตั้งชื่อตัวพิมพ์ใหญ่ทั้งหมดเพื่อสื่อว่าไม่ควรแก้ เช่น MAX_SCORE = 100",
    "ลองแปะโค้ดกับ error message ที่เจอมาให้ดูเต็ม ๆ ได้เลย จะได้ชี้จุดถูกบรรทัด",
    "งั้นลองข้อนี้ดู: เขียนฟังก์ชันรับรายชื่อแล้วคืนค่าเฉพาะชื่อที่ยาวกว่า 5 ตัวอักษร ลองทำแล้วส่งโค้ดมาดูได้เลย",
  ],
  activeMessages: [
    { role: "coach", text: "สวัสดี! มีอะไรให้โค้ชช่วยเรื่องเควส Python วันนี้ไหม", time: "09:14" },
    { role: "user", text: "ตัวแปรกับค่าคงที่ต่างกันยังไงครับ", time: "09:15" },
    {
      role: "coach",
      text: "ตัวแปร (variable) เปลี่ยนค่าได้ระหว่างรันโปรแกรม ส่วนค่าคงที่ตั้งไว้แล้วไม่ควรเปลี่ยน ใน Python ไม่มีคีย์เวิร์ด const จริง ๆ แต่นิยมตั้งชื่อตัวพิมพ์ใหญ่ทั้งหมดเพื่อสื่อว่าไม่ควรแก้ เช่น MAX_SCORE = 100",
      time: "09:15",
    },
    { role: "user", text: "แล้ว type ของตัวแปรใน Python ต้องประกาศเองมั้ยครับ", time: "09:16" },
    {
      role: "coach",
      text: "ไม่ต้องเลย Python เป็นแบบ dynamically typed ล่ามเดาชนิดจากค่าที่ใส่ให้อัตโนมัติ เช่น x = 5 ได้ int ทันที ถ้าอยากรู้ชนิดของตัวแปรใช้ type(x) เช็คได้ตลอด",
      time: "09:16",
    },
    { role: "user", text: "int กับ float ต่างกันตรงไหนครับ", time: "09:18" },
    {
      role: "coach",
      text: "int คือเลขจำนวนเต็ม ไม่มีจุดทศนิยม ส่วน float คือเลขทศนิยม เช่น 5 เป็น int แต่ 5.0 เป็น float ผสมสองแบบในสูตรคำนวณ Python จะแปลงผลลัพธ์เป็น float ให้อัตโนมัติ",
      time: "09:18",
    },
    { role: "user", text: "ถ้าอยากเปลี่ยน int เป็น string ทำไงครับ", time: "09:20" },
    {
      role: "coach",
      text: "ใช้ str() ห่อค่านั้นได้เลย เช่น str(5) จะได้ \"5\" แบบ string ตรงข้ามกันใช้ int() แปลง string เป็นเลขได้เหมือนกัน ถ้าข้อความนั้นแปลงเป็นเลขได้จริง",
      time: "09:20",
    },
    { role: "user", text: "งั้น bool นับเป็นตัวเลขมั้ยครับ", time: "09:22" },
    {
      role: "coach",
      text: "นับ! ใน Python True เท่ากับ 1 และ False เท่ากับ 0 เวลาบวกเลขกับ boolean ได้จริง ๆ เช่น True + True ได้ 2",
      time: "09:22",
    },
    { role: "user", text: "โห ไม่เคยรู้เลย งั้นสรุปคือดู type() เช็คชนิดได้เสมอใช่มั้ย", time: "09:24" },
    {
      role: "coach",
      text: "ใช่เลย! พิมพ์ type(ตัวแปร) เช็คได้ตลอด เวลาโค้ด error เรื่องชนิดข้อมูลก็เริ่มเช็คตรงนี้ก่อนได้เลย",
      time: "09:24",
    },
    { role: "user", text: "เข้าใจละ ขอบคุณครับ ไปทำเควสต่อดีกว่า", time: "09:25" },
    { role: "coach", text: "เยี่ยมเลย ลุยเควสต่อได้เลย มีอะไรสงสัยกลับมาถามได้ตลอดนะ", time: "09:25" },
  ],
  typingMessages: [
    { role: "coach", text: "สวัสดี! มีอะไรให้โค้ชช่วยเรื่องเควส Python วันนี้ไหม", time: "09:14" },
    { role: "user", text: "ทำไมลิสต์กับทูเพิลถึงมีสองแบบ ใช้ต่างกันตรงไหน", time: "09:17" },
  ],
  quotaMessages: [
    { role: "coach", text: "สวัสดี! มีอะไรให้โค้ชช่วยเรื่องเควส Python วันนี้ไหม", time: "08:40" },
    { role: "user", text: "loop for กับ while เลือกใช้ตอนไหนดี", time: "08:41" },
    { role: "coach", text: "for ใช้เมื่อรู้จำนวนรอบ/มี sequence ให้วน ส่วน while ใช้เมื่อวนจนกว่าเงื่อนไขจะเป็นเท็จ ยังไม่รู้จำนวนรอบล่วงหน้า", time: "08:41" },
    { role: "user", text: "เข้าใจละ ขอบคุณครับ วันนี้ถามจนครบโควต้าเลย 😅", time: "12:02" },
  ],
  failedMessages: [
    { role: "coach", text: "สวัสดี! มีอะไรให้โค้ชช่วยเรื่องเควส Python วันนี้ไหม", time: "09:14" },
    { role: "user", text: "ขอตัวอย่างการใช้ dictionary หน่อยครับ", time: "09:18", failed: true },
  ],
};

const PREVIEW_STATES = [
  { id: "empty", label: "ว่าง" },
  { id: "active", label: "กำลังคุย" },
  { id: "typing", label: "โค้ชพิมพ์อยู่" },
  { id: "quota", label: "โควต้าหมด" },
  { id: "failed", label: "ส่งไม่สำเร็จ" },
];

// path จาก Heroicons 24/outline (assets/heroicons — MIT)
const ICON_PATHS = {
  send: ["M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"],
  clock: ["M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"],
  back: ["M15.75 19.5 8.25 12l7.5-7.5"],
  retry: [
    "M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99",
  ],
};

const Icon = ({ name, className = "h-4 w-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor" aria-hidden="true" className={className}>
    {ICON_PATHS[name].map((d, i) => (
      <path key={i} strokeLinecap="round" strokeLinejoin="round" d={d} />
    ))}
  </svg>
);

// อวตารโค้ช — ผีพิกเซลตัวจริงจาก GhostMascot ย่อด้วย transform scale ให้พอดีวงกลมอวตาร (ขนาดจริงของ grid คือ 96×108 ตาม GhostMascot.jsx)
const GHOST_GRID_W = 96;
const GHOST_GRID_H = 108;

const CoachAvatar = ({ size = 28 }) => {
  const scale = size / GHOST_GRID_W;
  return (
    <span
      className="relative inline-block shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-violet-100 to-pink-100"
      style={{ width: size, height: size }}
    >
      {/* วางที่มุมบนซ้ายแบบ absolute แทนปล่อยให้ flex เซ็นเตอร์กล่องขนาดจริงก่อนย่อ — ไม่งั้น scale จะหดเข้าหาจุดที่ถูกเซ็นเตอร์ไว้นอกกรอบ ทำให้ผีหายไปหมด */}
      <span
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: GHOST_GRID_W,
          height: GHOST_GRID_H,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        <GhostMascot mood="idle" />
      </span>
    </span>
  );
};

const PRESETS = {
  empty: { messages: [], quotaUsed: 0, typing: false },
  active: { messages: MOCK.activeMessages, quotaUsed: 7, typing: false },
  typing: { messages: MOCK.typingMessages, quotaUsed: 3, typing: true },
  quota: { messages: MOCK.quotaMessages, quotaUsed: QUOTA_TOTAL, typing: false },
  failed: { messages: MOCK.failedMessages, quotaUsed: 0, typing: false },
};

export default function CoachChatPage({ initialState = "active", onBack, onGoToQuest, showStateToggle = true }) {
  const [ui, setUi] = useState(initialState);
  const [messages, setMessages] = useState(PRESETS[initialState].messages);
  const [quotaUsed, setQuotaUsed] = useState(PRESETS[initialState].quotaUsed);
  const [typing, setTyping] = useState(PRESETS[initialState].typing);
  const [input, setInput] = useState("");
  const replyTimer = useRef(null);
  const replyCursor = useRef(0);
  const bottomRef = useRef(null);

  const quotaLeft = QUOTA_TOTAL - quotaUsed;
  const quotaExhausted = quotaLeft <= 0;
  const canSend = !quotaExhausted && !typing && input.trim().length > 0;

  // เปลี่ยน state preview แล้วโหลด mock ชุดใหม่ + เคลียร์ timer/ลำดับคำตอบค้าง
  useEffect(() => {
    const preset = PRESETS[ui];
    setMessages(preset.messages);
    setQuotaUsed(preset.quotaUsed);
    setTyping(preset.typing);
    setInput("");
    replyCursor.current = 0;
    clearTimeout(replyTimer.current);
    return () => clearTimeout(replyTimer.current);
  }, [ui]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, typing]);

  // ใช้ร่วมกันทั้งส่งข้อความใหม่และลองส่งใหม่ — กันไทม์เมอร์ค้างซ้อนกันด้วย clearTimeout ก่อนตั้งใหม่เสมอ
  // หักโควต้าตอนตอบสำเร็จเท่านั้น (ตอนพังไม่นับ ตามโน้ตใน luiquest-style.md)
  const scheduleReply = () => {
    clearTimeout(replyTimer.current);
    setTyping(true);
    replyTimer.current = setTimeout(() => {
      const reply = MOCK.replies[replyCursor.current % MOCK.replies.length];
      replyCursor.current += 1;
      const time = new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
      setMessages((m) => [...m, { role: "coach", text: reply, time }]);
      setTyping(false);
      setQuotaUsed((q) => q + 1);
    }, 1300);
  };

  const send = (text) => {
    const trimmed = text.trim();
    if (!trimmed || quotaExhausted || typing) return;
    const time = new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
    setMessages((m) => [...m, { role: "user", text: trimmed, time }]);
    setInput("");
    scheduleReply();
  };

  const retryFailed = (i) => {
    if (typing || quotaExhausted) return;
    setMessages((m) => m.map((msg, idx) => (idx === i ? { ...msg, failed: false } : msg)));
    scheduleReply();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    send(input);
  };

  return (
    <div
      className="relative flex h-dvh flex-col overflow-hidden font-body text-[#831843]"
      style={{
        backgroundColor: "#FDF2F8",
        backgroundImage: [
          "radial-gradient(ellipse 220px 160px at 8% 4%, rgba(139,92,246,.14), transparent 70%)",
          "radial-gradient(ellipse 200px 180px at 95% 22%, rgba(249,168,212,.30), transparent 70%)",
          "radial-gradient(ellipse 260px 200px at 15% 96%, rgba(236,72,153,.10), transparent 70%)",
        ].join(","),
        backgroundRepeat: "no-repeat",
      }}
    >
      <style>{`
        @keyframes coach-in { 0% { opacity: 0; transform: translateY(6px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes coach-dot { 0%,60%,100% { opacity: .3; transform: translateY(0); } 30% { opacity: 1; transform: translateY(-3px); } }
      `}</style>

      {/* toggle สำหรับ preview แต่ละ state (ปิดได้ด้วย prop ตอนต่อ flow จริง) */}
      {showStateToggle && (
        <div className="absolute inset-x-0 top-2 z-20 flex flex-wrap items-center justify-center gap-1 px-3">
          {PREVIEW_STATES.map((s) => (
            <button
              key={s.id}
              onClick={() => setUi(s.id)}
              className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] transition ${
                ui === s.id
                  ? "bg-[#8B5CF6] text-white"
                  : "border border-[#FBCFE8] bg-white/80 text-[#9D5C7C] hover:border-[#8B5CF6]/50 hover:text-[#8B5CF6]"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      <div className={`mx-auto flex w-full min-h-0 max-w-md flex-1 flex-col md:max-w-xl ${showStateToggle ? "pt-14" : "pt-2"}`}>
        {/* header: ย้อนกลับ + ชื่อโค้ช + ตัวนับโควต้า (เห็นชัดตลอดตามบรีฟ) */}
        <div className="flex items-center gap-3 border-b border-[#FBCFE8] px-4 pb-3">
          <button
            onClick={() => onBack?.()}
            aria-label="ย้อนกลับ"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#FBCFE8] bg-white/80 text-[#9D5C7C] transition hover:border-[#8B5CF6]/50 hover:bg-white hover:text-[#8B5CF6] active:translate-y-px"
          >
            <Icon name="back" className="h-5 w-5" />
          </button>
          <CoachAvatar size={36} />
          <div className="min-w-0 flex-1">
            <h1 className="font-heading text-[15px] font-bold leading-tight">โค้ชเอไอ</h1>
            <p className="truncate text-[10px] text-[#9D5C7C]">ถามได้ทุกเรื่องของเควส {MOCK.topic}</p>
          </div>
          <span
            className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-bold ${
              quotaExhausted
                ? "bg-red-100 text-red-600"
                : quotaLeft <= 2
                  ? "bg-amber-100 text-amber-700"
                  : "border border-[#FBCFE8] bg-white/80 text-[#9D5C7C]"
            }`}
          >
            เหลือ {Math.max(quotaLeft, 0)}/{QUOTA_TOTAL} ข้อความวันนี้
          </span>
        </div>

        {/* พื้นที่บทสนทนา */}
        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {messages.length === 0 ? (
            /* ---------- ว่าง — ยังไม่เคยคุย: ข้อความต้อนรับ + ปุ่มคำถามแนะนำ ---------- */
            <div className="flex h-full flex-col items-center justify-center px-4 text-center">
              <GhostMascot mood="idle" className="mb-4 scale-75" />
              <h2 className="font-heading text-lg font-bold">มีอะไรให้โค้ชช่วยไหม 👋</h2>
              <p className="mt-1.5 text-xs leading-relaxed text-[#9D5C7C]">
                ถามได้เลยเรื่องเควส {MOCK.topic} วันนี้ ไม่เข้าใจตรงไหน โค้ชอธิบายให้ทันที
              </p>
              <div className="mt-5 flex w-full max-w-[300px] flex-col gap-2">
                {MOCK.suggestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => send(q)}
                    className="w-full rounded-full border border-[#FBCFE8] bg-white/80 px-4 py-2 text-left text-xs font-bold text-[#8B5CF6] transition hover:-translate-y-0.5 hover:border-[#8B5CF6]/50 hover:shadow-[0_6px_14px_rgba(139,92,246,.15)] active:translate-y-px"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex items-end gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}
                  style={{ animation: "coach-in .25s ease-out" }}
                >
                  {m.role === "coach" && <CoachAvatar />}
                  <div className={`flex max-w-[78%] flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
                    {m.failed ? (
                      <div className="rounded-2xl rounded-br-sm border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] leading-relaxed text-red-700">
                        {m.text}
                      </div>
                    ) : (
                      <div
                        className={`px-3.5 py-2.5 text-[13px] leading-relaxed ${
                          m.role === "user"
                            ? "rounded-2xl rounded-br-sm bg-gradient-to-r from-violet-500 to-pink-500 text-white"
                            : "rounded-2xl rounded-bl-sm border-2 border-[#FBCFE8] bg-white/90 text-[#831843]"
                        }`}
                      >
                        {m.text}
                      </div>
                    )}
                    {m.failed ? (
                      <button
                        onClick={() => retryFailed(i)}
                        className="mt-1 flex items-center gap-1 text-[10px] font-bold text-red-600 hover:text-red-700"
                      >
                        <Icon name="retry" className="h-3 w-3" />
                        ส่งไม่สำเร็จ — ลองใหม่
                      </button>
                    ) : (
                      <span className="mt-1 px-1 text-[10px] text-[#9D5C7C]/70">{m.time}</span>
                    )}
                  </div>
                </div>
              ))}

              {/* โค้ชกำลังพิมพ์ — จุดสามเม็ดกระเพื่อม */}
              {typing && (
                <div className="flex items-end gap-2" style={{ animation: "coach-in .25s ease-out" }}>
                  <CoachAvatar />
                  <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border-2 border-[#FBCFE8] bg-white/90 px-4 py-3">
                    {[0, 1, 2].map((d) => (
                      <span
                        key={d}
                        className="h-1.5 w-1.5 rounded-full bg-[#9D5C7C]"
                        style={{ animation: `coach-dot 1s ease-in-out ${d * 0.15}s infinite` }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </main>

        {/* โควต้าหมด — ปลอบ + บอกเวลารีเซ็ต + ชวนไปทำอย่างอื่นต่อ */}
        {quotaExhausted && (
          <div className="mx-4 mb-3 flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs leading-relaxed text-amber-800" style={{ animation: "coach-in .3s ease-out" }}>
            <Icon name="clock" className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <span className="font-bold">คุยกับโค้ชครบโควต้าวันนี้แล้ว 🌙</span>
              <br />
              เที่ยงคืนโควต้าเต็มอีกครั้ง ระหว่างนี้ไปลุยเควสต่อกันไหม?
              <button
                onClick={() => onGoToQuest?.()}
                className="mt-2 block rounded-full bg-gradient-to-r from-violet-500 to-pink-500 px-3.5 py-1.5 font-heading text-[11px] font-bold text-white shadow-[0_8px_18px_rgba(139,92,246,.28)] transition hover:-translate-y-0.5 active:translate-y-px"
              >
                ไปทำเควสต่อ 🚀
              </button>
            </div>
          </div>
        )}

        {/* ช่องพิมพ์ — disable ตอนโควต้าหมด/โค้ชกำลังพิมพ์อยู่ */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-[#FBCFE8] px-4 py-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={quotaExhausted || typing}
            placeholder={quotaExhausted ? "โควต้าหมดสำหรับวันนี้" : typing ? "รอโค้ชตอบแป๊บนึง..." : "พิมพ์คำถามถึงโค้ช..."}
            className="flex-1 rounded-full border-2 border-[#FBCFE8] bg-white/80 px-4 py-2.5 text-[13px] text-[#831843] outline-none transition placeholder:text-[#9D5C7C]/70 focus:border-[#8B5CF6] disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!canSend}
            aria-label="ส่งข้อความ"
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-violet-500 to-pink-500 text-white shadow-[0_10px_24px_rgba(139,92,246,.30)] transition active:translate-y-px ${
              canSend ? "hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(139,92,246,.42)]" : "opacity-40"
            }`}
          >
            <Icon name="send" className="h-[18px] w-[18px]" />
          </button>
        </form>
      </div>
    </div>
  );
}
