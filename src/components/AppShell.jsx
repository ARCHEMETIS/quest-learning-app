// App shell / navigation ของลุยเควส (ticket #10 — design-brief section 3, "app shell") — เพราะแอพเป็น PWA แบบ standalone ต้องมี navigation ในตัว ไม่พึ่ง back button ของ browser
// ครอบ 3 หน้าหลักด้วย header + bottom nav ถาวร: เควสวันนี้ (DailyQuestPage) / แชทโค้ช (CoachChatPage) / อันดับ (LeaderboardPage)
// รูปโปรไฟล์+ชื่อผู้ใช้อยู่ที่ header (ไม่ใช่ nav) กดแล้วเปิด ProfileDrawer เป็น overlay แบบ controlled — ชวนเพื่อนอยู่ในแถบนั้นแล้วตาม ticket #10 addendum ไม่ต้องมีหน้า/แท็บแยก
// /stats เป็นหน้าสาธารณะนอก nav หลักตามบรีฟ — ไม่ต้องอยู่ในเชลล์นี้
//
// การตัดสินใจ (คำถามค้างจาก ProfileDrawer note): nav เหลือ 3 ทาง (เควส/โค้ช/อันดับ) + อวตารโปรไฟล์เป็นตัวเปิดแถบเมนูแทนแท็บที่ 4
// เผื่อพื้นที่ให้ nav ขยายได้ในอนาคต (push notification / เพื่อน-duo / พรีเมียม — ยังไม่ต้องออกแบบตาม brief) ด้วยการ derive จำนวนคอลัมน์จาก NAV_ITEMS.length เอง ไม่ hardcode 3 ที่ไหน — เพิ่มแท็บที่ 4 ในอนาคตแค่ต่อ array
//
// รอบสอง (feedback หลังโชว์ local preview): ย่อ header/nav ที่ใหญ่เกินไป, เพิ่มลูกเล่น (แถบ active ไหลตามแท็บ + ประกายตอนสลับ + มาสคอตจิ๋วใน header) ไม่ให้ดูเรียบไป,
// แก้บั๊ก state `done`/`rankup`/`notready` ของหน้าเควสเลื่อนได้ทั้งที่ควรพอดีจอ (สลับ min-h-dvh → min-h-full ตอนฝัง ผ่าน prop heightClass เดียวกับที่ CoachChatPage มีอยู่แล้ว),
// และแก้บั๊กการ์ด pin อันดับค้าง/กดไม่ได้ (ของเดิมใช้ transform:translateZ(0) ทำให้ปุ่ม fixed กลายเป็นเลื่อนตามเนื้อหาแทนลอยค้างกับจอจริง — เอาออก แล้วส่งความสูง nav ผ่าน CSS var --shell-bottom-offset ให้ DailyQuestPage/LeaderboardPage บวกเข้าไปในค่า bottom ของปุ่ม fixed ของตัวเองแทน)

import { useState } from "react";
import DailyQuestPage from "./DailyQuestPage";
import CoachChatPage from "./CoachChatPage";
import LeaderboardPage from "./LeaderboardPage";
import ProfileDrawer from "./ProfileDrawer";
import GhostMascot from "./GhostMascot";
import { LuiQuestFavicon } from "./LuiQuestLogo";

const MOCK = {
  // ชื่อ/initial เดียวกับ mock user ในหน้าเควส/อันดับ/ProfileDrawer (พิมพ์ชนก รักเรียน) เพื่อความต่อเนื่องข้ามหน้า
  user: { name: "พิมพ์ชนก รักเรียน", initial: "พ" },
};

// ความสูงจริงของ bottom nav (โดยประมาณจากพาดิ้ง/ขนาดไอคอนด้านล่าง) — ปุ่ม fixed ของหน้าเควส/อันดับใช้ค่านี้ผ่าน CSS var เพื่อไม่ให้ลอยไปชนแถบ nav
const SHELL_NAV_HEIGHT = "56px";

// path จาก Heroicons 24/outline (assets/heroicons — MIT): home, chat-bubble-left-right, trophy
const ICON_PATHS = {
  quest: [
    "m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25",
  ],
  coach: [
    "M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155",
  ],
  leaderboard: [
    "M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0",
  ],
};

const Icon = ({ paths, className = "h-[18px] w-[18px]", strokeWidth = "1.5" }) => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth={strokeWidth} stroke="currentColor" aria-hidden="true" className={className}>
    {paths.map((d, i) => (
      <path key={i} strokeLinecap="round" strokeLinejoin="round" d={d} />
    ))}
  </svg>
);

// มาสคอตจิ๋วข้างโลโก้ header — ย่อ GhostMascot (grid จริง 96×108) ด้วยเทคนิคเดียวกับ CoachAvatar ใน CoachChatPage.jsx (absolute + scale จากมุมบนซ้าย ไม่ใช่เซ็นเตอร์ก่อนย่อ)
const HEADER_MASCOT_GRID_W = 96;
const HEADER_MASCOT_GRID_H = 108;
const HeaderMascot = ({ size = 26 }) => {
  const scale = size / HEADER_MASCOT_GRID_W;
  return (
    <span
      className="relative inline-block shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-violet-100 to-pink-100"
      style={{ width: size, height: size * (HEADER_MASCOT_GRID_H / HEADER_MASCOT_GRID_W) }}
    >
      <span style={{ position: "absolute", top: 0, left: 0, width: HEADER_MASCOT_GRID_W, height: HEADER_MASCOT_GRID_H, transform: `scale(${scale})`, transformOrigin: "top left" }}>
        <GhostMascot mood="idle" />
      </span>
    </span>
  );
};

// 3 ทางหลักตามที่เคาะไว้ — เพิ่มแท็บใหม่ในอนาคตแค่ต่อ array นี้ (กริดคอลัมน์ + แถบ active ไหลตาม อ้างจาก .length/index เอง)
const NAV_ITEMS = [
  { id: "quest", label: "เควสวันนี้", icon: ICON_PATHS.quest },
  { id: "coach", label: "แชทโค้ช", icon: ICON_PATHS.coach },
  { id: "leaderboard", label: "อันดับ", icon: ICON_PATHS.leaderboard },
];

export default function AppShell({ initialTab = "quest", onShareStreak, onLogout, onUpgrade, onShare, onSwitchTopic }) {
  const [tab, setTab] = useState(initialTab);
  const [profileOpen, setProfileOpen] = useState(false);
  const activeIndex = NAV_ITEMS.findIndex((i) => i.id === tab);

  return (
    <div
      className="relative mx-auto flex h-dvh w-full max-w-md flex-col overflow-hidden font-body text-[#831843] md:max-w-xl"
      style={{
        backgroundColor: "#FDF2F8",
        backgroundImage: [
          "radial-gradient(ellipse 220px 160px at 8% 4%, rgba(139,92,246,.14), transparent 70%)",
          "radial-gradient(ellipse 200px 180px at 95% 22%, rgba(249,168,212,.30), transparent 70%)",
          "radial-gradient(ellipse 260px 200px at 15% 96%, rgba(236,72,153,.10), transparent 70%)",
        ].join(","),
        backgroundRepeat: "no-repeat",
        // ปุ่ม fixed ในหน้าเควส/อันดับ (ปุ่มถามโค้ช, การ์ด pin อันดับ) อ่านค่านี้ไปบวกเข้ากับ bottom ของตัวเอง กันลอยไปชน bottom nav — ประกาศเป็น CSS var เพราะ custom property inherit ทะลุ position:fixed ได้ตามปกติ (ไม่ต้องพึ่ง containing-block hack ที่ทำให้ปุ่มเลื่อนตามเนื้อหาแทนลอยค้างกับจอจริง)
        "--shell-bottom-offset": SHELL_NAV_HEIGHT,
      }}
    >
      <style>{`
        @keyframes shell-in { 0% { opacity: 0; transform: translateY(4px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes shell-nav-pop { 0% { transform: scale(.7); } 60% { transform: scale(1.14); } 100% { transform: scale(1); } }
        @keyframes shell-spark { 0% { opacity: 0; transform: translateY(0) scale(.4) rotate(0deg); } 30% { opacity: 1; transform: translateY(-6px) scale(1.1) rotate(15deg); } 100% { opacity: 0; transform: translateY(-16px) scale(.8) rotate(-10deg); } }
      `}</style>

      {/* header: โลโก้+มาสคอตจิ๋ว + อวตารโปรไฟล์ (กดเปิด ProfileDrawer) — เด่นแยกจากเนื้อหาด้วยไล่สีขาว→ชมพูอ่อนตาม token */}
      <header className="z-10 flex shrink-0 items-center justify-between gap-2 border-b border-[#FBCFE8] bg-gradient-to-b from-white to-[#FDF2F8] px-3 py-1.5">
        <div className="flex items-center gap-1.5">
          <LuiQuestFavicon size={26} />
          <HeaderMascot size={24} />
          <span className="font-heading text-xs font-bold">ลุยเควส</span>
        </div>
        <button
          onClick={() => setProfileOpen(true)}
          aria-label={`เปิดโปรไฟล์ของ ${MOCK.user.name}`}
          className="flex items-center gap-1.5 rounded-full border border-[#FBCFE8] bg-white/80 py-0.5 pl-0.5 pr-2.5 transition hover:border-[#8B5CF6]/50 hover:bg-white active:translate-y-px"
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-200 to-pink-200 font-heading text-[10px] font-bold text-[#831843]">
            {MOCK.user.initial}
          </span>
          <span className="max-w-[100px] truncate text-[10px] font-bold text-[#831843]">{MOCK.user.name}</span>
        </button>
      </header>

      {/* พื้นที่เนื้อหา — คง mount ทั้ง 3 หน้าไว้เสมอ สลับด้วย hidden ไม่ unmount ตอนเปลี่ยนแท็บ (กันแดร็ฟข้อความแชท/checklist ที่ติ๊กไว้หาย)
          ทั้ง 3 หน้าได้ heightClass="min-h-full" (แทน min-h-dvh เดิม) ให้เกาะความสูงจริงของพื้นที่นี้ (ที่หักหัว/nav ออกแล้ว) — ไม่งั้น state สั้น ๆ (done/rankup/notready/loading) จะยืดเลยกรอบจนเลื่อนได้ทั้งที่ควรพอดีจอ */}
      {/* ซ่อน scrollbar เมาส์ (เลื่อนด้วย wheel/touch/ปุ่ม pin ยังใช้ได้ปกติ) — แอพมือถือ/PWA ไม่ต้องโชว์แถบเลื่อนแบบเดสก์ท็อป */}
      <main className="min-h-0 flex-1 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className={tab === "quest" ? "h-full" : "hidden"} style={tab === "quest" ? { animation: "shell-in .22s ease-out" } : undefined}>
          <DailyQuestPage showStateToggle={false} heightClass="min-h-full" onOpenCoach={() => setTab("coach")} onShareStreak={onShareStreak} onInvite={() => setProfileOpen(true)} />
        </div>
        {/* h-full เพราะ CoachChatPage ล็อกช่องพิมพ์ไว้ก้นจอด้วย flex layout ของตัวเอง — ต้องมีความสูงจริงให้เกาะ ไม่ปล่อยให้ยืดยาวเกิน main แล้วช่องพิมพ์หลุดจอ */}
        <div className={tab === "coach" ? "h-full" : "hidden"} style={tab === "coach" ? { animation: "shell-in .22s ease-out" } : undefined}>
          <CoachChatPage showStateToggle={false} heightClass="h-full" onBack={() => setTab("quest")} onGoToQuest={() => setTab("quest")} />
        </div>
        <div className={tab === "leaderboard" ? "h-full" : "hidden"} style={tab === "leaderboard" ? { animation: "shell-in .22s ease-out" } : undefined}>
          <LeaderboardPage showStateToggle={false} heightClass="min-h-full" onInvite={() => setProfileOpen(true)} />
        </div>
      </main>

      {/* bottom nav — เด่นแยกจากเนื้อหาด้วยไล่สี+เงายกตัวขึ้นตาม token, แถบ active ไหลตามแท็บ (แทนแค่ fade เข้า/ออกทีละไอเท็ม) + ประกายเล็ก ๆ ตอนสลับ ไม่ให้ chrome ดูเรียบไป */}
      <nav
        className="z-10 shrink-0 border-t border-[#FBCFE8] bg-gradient-to-t from-white to-[#FDF2F8] px-2"
        style={{ boxShadow: "0 -6px 16px rgba(139,92,246,.10)", paddingBottom: "max(4px, env(safe-area-inset-bottom))" }}
      >
        {/* ไม่มี padding แนวนอนในตัวนี้ (ย้ายไปไว้ที่ <nav> ข้างนอกแทน) เพราะแถบไฮไลต์ข้างล่างคำนวณ % จาก padding-box ของ div นี้เป๊ะ ๆ — ถ้ามี px ค้างอยู่ตรงนี้ด้วย เปอร์เซ็นต์จะเพี้ยนจากคอลัมน์ของกริดจริง */}
        <div className="relative grid pt-1" style={{ gridTemplateColumns: `repeat(${NAV_ITEMS.length}, minmax(0,1fr))` }}>
          {/* แถบไฮไลต์ที่ไหลไปหาแท็บ active — ตำแหน่ง/ขนาดคำนวณจาก index เอง ไม่ผูกกับจำนวนแท็บตายตัว */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-1 rounded-2xl bg-[#8B5CF6]/[.10] transition-transform duration-300 ease-out"
            style={{ width: `calc(${100 / NAV_ITEMS.length}% - 8px)`, left: "4px", transform: `translateX(calc(${activeIndex} * (100% + 8px)))` }}
          />
          {NAV_ITEMS.map((item, i) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                className="relative flex flex-col items-center gap-0.5 rounded-2xl py-1 transition active:translate-y-px"
              >
                <span
                  className="relative flex h-6 w-9 items-center justify-center"
                  style={active ? { animation: "shell-nav-pop .3s ease-out" } : undefined}
                >
                  <Icon paths={item.icon} strokeWidth={active ? "2" : "1.5"} className={`h-[18px] w-[18px] transition ${active ? "text-[#8B5CF6]" : "text-[#9D5C7C]"}`} />
                  {active && (
                    <>
                      <span aria-hidden="true" className="pointer-events-none absolute -right-1 -top-1 text-[10px] text-[#FBBF24]" style={{ animation: "shell-spark .5s ease-out" }}>✦</span>
                      <span aria-hidden="true" className="pointer-events-none absolute -left-1 -top-0.5 text-[8px] text-[#EC4899]" style={{ animation: "shell-spark .5s ease-out .08s" }}>✧</span>
                    </>
                  )}
                </span>
                <span className={`text-[9px] font-bold ${active ? "text-[#8B5CF6]" : "text-[#9D5C7C]"}`}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* แถบโปรไฟล์ (รวมชวนเพื่อน) — controlled overlay, mount ค้างไว้เสมอ (ห้าม mount/unmount ตาม state ตามโน้ตของ ProfileDrawer เอง) */}
      <ProfileDrawer
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        onSwitchTopic={onSwitchTopic}
        onUpgrade={onUpgrade}
        onShare={onShare}
        onLogout={onLogout}
        showStateToggle={false}
      />
    </div>
  );
}
