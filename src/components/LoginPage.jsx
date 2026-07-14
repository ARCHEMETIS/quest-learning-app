// หน้า Login ของลุยเควส (LuiQuest) — mock data ด้านล่าง ฝั่งโค้ดต่อ Google OAuth จริงเองภายหลัง
// states: normal | loading | error | success | invite (ตาม design-brief section 3.1 + success เพิ่มเติม)

import { useState } from "react";
import GhostMascot from "./GhostMascot";
import { LuiQuestFavicon } from "./LuiQuestLogo";

const MOCK = {
  inviterName: "ณัฐวุฒิ ใจดี",
};

const PREVIEW_STATES = [
  { id: "normal", label: "ปกติ" },
  { id: "loading", label: "กำลังล็อกอิน" },
  { id: "error", label: "ล้มเหลว" },
  { id: "success", label: "สำเร็จ" },
  { id: "invite", label: "ลิงก์ชวนเพื่อน" },
];

const BUTTON_LABEL = {
  normal: "เข้าสู่ระบบด้วย Google",
  loading: "กำลังเข้าสู่ระบบ...",
  error: "ลองใหม่อีกครั้ง",
  success: "สำเร็จ! กำลังพาเข้าแอพ...",
  invite: "เข้าสู่ระบบด้วย Google",
};

const MASCOT_MOOD = {
  normal: "idle",
  loading: "idle",
  error: "sad",
  success: "celebrate",
  invite: "idle",
};

const GoogleIcon = () => (
  <svg viewBox="0 0 48 48" className="h-3 w-3">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.3 1 7.3 2.7l6-6C33.9 6.1 29.2 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 18.9 13 24 13c2.8 0 5.3 1 7.3 2.7l6-6C33.9 6.1 29.2 4 24 4c-7.5 0-13.9 4.2-17.2 10.4z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.4 26.7 36 24 36c-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.9 39.6 16.4 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.3 5.6l6.2 5.2C40.5 36 44 30.6 44 24c0-1.3-.1-2.7-.4-3.5z" />
  </svg>
);

// status/onLogin เสียบ auth จริง (ticket #09) — ปล่อยว่างไว้ ui ก็ยังขับด้วย toggle preview เดิมได้ตามปกติ
export default function LoginPage({ initialState = "normal", showStateToggle = true, status, onLogin }) {
  const [ui, setUi] = useState(initialState);
  const effectiveUi = status ?? ui;
  const busy = effectiveUi === "loading" || effectiveUi === "success";

  return (
    <div
      className="relative flex min-h-dvh flex-col overflow-hidden font-body text-[#831843]"
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
      {/* toggle สำหรับ preview แต่ละ state (ปิดได้ด้วย prop ตอนต่อ flow จริง) */}
      {showStateToggle && (
        <div className="absolute left-1/2 top-2 z-20 flex -translate-x-1/2 gap-1">
          {PREVIEW_STATES.map((s) => (
            <button
              key={s.id}
              onClick={() => setUi(s.id)}
              className={`rounded-full px-2.5 py-1 text-[10px] transition ${
                ui === s.id
                  ? "bg-[#8B5CF6] text-white"
                  : "border border-[#FBCFE8] bg-white/80 text-[#9D5C7C]"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* banner เพื่อนชวน — การ์ดลอยหัวจอ */}
      {effectiveUi === "invite" && (
        <div className="absolute inset-x-5 top-12 z-10 flex items-center gap-3 rounded-2xl border border-[#FBCFE8] bg-white/90 px-3.5 py-2.5 shadow-[0_6px_18px_rgba(139,92,246,.12)] backdrop-blur-sm">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-pink-400 font-heading text-sm font-bold text-white">
            {MOCK.inviterName.charAt(0)}
          </div>
          <div className="text-xs leading-snug text-[#9D5C7C]">
            <span className="block font-heading text-[13px] font-bold text-[#831843]">
              เพื่อนชวนคุณมาลุย 🎉
            </span>
            {MOCK.inviterName}
            <br />
            ชวนคุณมาลุยเควสด้วยกัน
          </div>
        </div>
      )}

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center px-8 pb-8 pt-28 md:max-w-lg">
        {/* กลุ่มแบรนด์: mascot → โลโก้ → tagline อ่านเป็นก้อนเดียว */}
        <div className="my-auto flex flex-col items-center">
          <GhostMascot mood={MASCOT_MOOD[effectiveUi]} className="mb-6 scale-75" />

          <div className="flex items-center gap-3">
            <LuiQuestFavicon />
            <span className="font-heading text-3xl font-bold tracking-wide">ลุยเควส</span>
          </div>

          <p className="mt-3 text-center text-xs leading-relaxed text-[#9D5C7C]">
            <span className="font-bold text-[#831843]">อยากเก่งอะไร ลุยเลย — วันละเควส</span>
            <br />
            เควสรายวันสร้างให้ตามหัวข้อที่คุณเลือก เก็บ XP ต่อ streak ไปกับเพื่อน
          </p>
        </div>

        {/* action — CTA เดียว ชิดขอบล่างจอ */}
        <div className="mt-auto flex w-full max-w-[300px] flex-col items-center gap-2.5">
          {effectiveUi === "error" && (
            <div className="flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1.5 text-[11px] text-red-600">
              ⚠️ เข้าสู่ระบบไม่สำเร็จ — ลองใหม่อีกครั้งนะ
            </div>
          )}

          <button
            disabled={busy}
            onClick={() => onLogin?.()}
            className={`flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 px-4 py-2.5 font-heading text-sm font-bold text-white shadow-[0_10px_24px_rgba(139,92,246,.30)] transition active:translate-y-px ${
              busy ? "opacity-75" : ""
            }`}
          >
            {effectiveUi === "loading" ? (
              <span className="h-4 w-4 animate-spin rounded-full border-[2.5px] border-white/40 border-t-white" />
            ) : effectiveUi === "success" ? null : (
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white">
                <GoogleIcon />
              </span>
            )}
            {BUTTON_LABEL[effectiveUi]}
          </button>
        </div>
      </main>
    </div>
  );
}
