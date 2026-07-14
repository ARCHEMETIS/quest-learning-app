// Placeholder ชั่วคราวสำหรับหน้าเปล่า — component จริงจากเพื่อนจะมาแทนใน ticket #09
export default function Placeholder({ title }) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-3 bg-slate-900 text-slate-100 p-6 text-center">
      <div className="text-2xl font-bold">ลุยเควส (LuiQuest)</div>
      <div className="text-slate-400">หน้า: {title}</div>
      <p className="text-xs text-slate-500 max-w-xs">
        โครงพร้อมแล้ว — รอเสียบ component ดีไซน์ + auth/state/API (ticket #09)
      </p>
    </main>
  );
}
