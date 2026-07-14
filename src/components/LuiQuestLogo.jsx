const SwordMark = ({ className = "" }) => (
  <svg viewBox="0 0 40 40" fill="none" className={className}>
    <g transform="rotate(45 20 20)">
      <polygon points="20,3 23,10 23,26 17,26 17,10" fill="#fff" />
      <rect x="13" y="25" width="14" height="3" rx="1" fill="#fff" />
      <rect x="18" y="27" width="4" height="9" rx="1" fill="#fff" />
      <circle cx="20" cy="37" r="2.3" fill="#fff" />
    </g>
    <g transform="rotate(-45 20 20)">
      <polygon points="20,3 23,10 23,26 17,26 17,10" fill="#fff" opacity=".92" />
      <rect x="13" y="25" width="14" height="3" rx="1" fill="#fff" opacity=".92" />
      <rect x="18" y="27" width="4" height="9" rx="1" fill="#fff" opacity=".92" />
      <circle cx="20" cy="37" r="2.3" fill="#fff" opacity=".92" />
    </g>
  </svg>
);

export const LuiQuestWordmark = ({ className = "" }) => (
  <div
    className={`inline-flex items-center gap-3 rounded-3xl px-8 py-7 shadow-[0_12px_28px_rgba(139,92,246,0.25)] bg-gradient-to-br from-violet-500 via-purple-400 to-pink-400 ${className}`}
  >
    <SwordMark className="w-10 h-10 shrink-0" />
    <span className="font-heading font-bold text-3xl text-white">ลุยเควส</span>
  </div>
);

export const LuiQuestFavicon = ({ className = "" }) => (
  <div
    className={`inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-pink-400 ${className}`}
  >
    <SwordMark className="w-[26px] h-[26px]" />
  </div>
);

export default LuiQuestWordmark;
