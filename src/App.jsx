import { useState, useRef, useEffect, createContext, useContext } from "react";

// \u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
// \u4fee\u6b63\u70b9\u30b5\u30de\u30ea\u30fc\uff08\u5143\u30d5\u30a1\u30a4\u30eb\u304b\u3089\u306e\u5909\u66f4\u7b87\u6240\uff09
// \u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
// [FIX-1] THEMES \u306e grad/sh \u304c \\\" \u306b\u306a\u3063\u3066\u3044\u305f \u2192 \u6b63\u3057\u3044\u6587\u5b57\u5217\u30ea\u30c6\u30e9\u30eb\u306b\u4fee\u6b63
// [FIX-2] PostModal \u306e z_index \u2192 zIndex (React DOM \u30d7\u30ed\u30d1\u30c6\u30a3\u540d)
// [FIX-3] via.placeholder.com (404) \u2192 SVG data URI \u306e\u30d5\u30a9\u30fc\u30eb\u30d0\u30c3\u30af\u753b\u50cf\u306b\u5909\u66f4
// [FIX-4] groups \u304c localStorage \u306b\u672a\u4fdd\u5b58 \u2192 useEffect \u8ffd\u52a0
// [FIX-5] useCallback import \u306e\u307f\u3067\u672a\u4f7f\u7528 \u2192 \u524a\u9664
// [FIX-6] MyPage <img src={undefined}> \u2192 \u30d5\u30a9\u30fc\u30eb\u30d0\u30c3\u30af\u8ffd\u52a0
// [ADD]   \u30c7\u30e2\u30c7\u30fc\u30bf\u8ffd\u52a0\uff08\u521d\u56de\u8868\u793a\u6642\u306b\u8a18\u9332\u304c\u898b\u3048\u308b\u72b6\u614b\u306b\uff09
// [ADD]   Men\uff5eLog \u30ed\u30b4\uff08\u9ebaSVG\uff09\u3092\u30d8\u30c3\u30c0\u30fc\u306b\u8ffd\u52a0
// [ADD]   MenLogMonitor \u30b3\u30f3\u30dd\u30fc\u30cd\u30f3\u30c8\uff08\u30c7\u30e2\uff0f\u5dee\u3057\u66ff\u3048\u30e2\u30cb\u30bf\u30fc\uff09
// \u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501

// \u2500\u2500\u2500 \u30c6\u30fc\u30de\u8a2d\u5b9a \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// [FIX-1] grad / sh \u306e \\\" \u30a8\u30b9\u30b1\u30fc\u30d7\u3092\u9664\u53bb
const THEMES = {
  warm:   { bg:"#FFF8F3", bg2:"#FFF0E6", card:"#FFFFFF", acc:"#C0392B", accm:"#FADBD8", tx:"#1A0A00", tx2:"#6B4C3B", txm:"#A0826D", br:"#F0DDD5", star:"#E67E22", grad:"linear-gradient(135deg,#C0392B,#E74C3C)", sh:"rgba(192,57,43,0.12)" },
  dark:   { bg:"#0F0A08", bg2:"#1A110D", card:"#231610", acc:"#E74C3C", accm:"#3D1A17", tx:"#F5EDE8", tx2:"#C4A99A", txm:"#7A5C4F", br:"#3D2418", star:"#F39C12", grad:"linear-gradient(135deg,#E74C3C,#FF6B6B)", sh:"rgba(231,76,60,0.2)"  },
  cool:   { bg:"#F0F4FF", bg2:"#E8EEFF", card:"#FFFFFF", acc:"#3B5BDB", accm:"#DBE4FF", tx:"#0A0F2C", tx2:"#3B4A8A", txm:"#7C8DB0", br:"#D0D9F5", star:"#F59F00", grad:"linear-gradient(135deg,#3B5BDB,#4C6EF5)", sh:"rgba(59,91,219,0.12)" },
  season: { bg:"#F5FFF0", bg2:"#EAFAE0", card:"#FFFFFF", acc:"#2E7D32", accm:"#C8E6C9", tx:"#0A1F0C", tx2:"#2E5C30", txm:"#6A9B6D", br:"#D4EDD6", star:"#F57F17", grad:"linear-gradient(135deg,#2E7D32,#43A047)", sh:"rgba(46,125,50,0.12)" },
};

const RAMENDB_BASE = "https://ramendb.supleks.jp";
const RAMENDB_RANK = "https://ramendb.supleks.jp/rank";
const APP_LINK     = "https://men-log2-yerr.vercel.app/";
const GENRES = ["\u3059\u3079\u3066","\u91a4\u6cb9","\u8c5a\u9aa8","\u5869","\u5473\u564c","\u3064\u3051\u9eba","\u9d8f\u767d\u6e6f","\u4e8c\u90ce\u7cfb","\u4e2d\u83ef\u305d\u3070","\u716e\u5e72\u3057","\u305d\u306e\u4ed6"];
const AREAS  = ["\u3059\u3079\u3066","\u65b0\u5bbf","\u6e0b\u8c37","\u6c60\u888b","\u4ee3\u3005\u6728","\u4e2d\u91ce","\u4e09\u7530","\u5de3\u9d28","\u4e94\u53cd\u7530","\u6a2a\u6d5c","\u677e\u6238","\u535a\u591a","\u672d\u5e4c"];

// [FIX-3] via.placeholder.com \u306e\u4ee3\u308f\u308a\u306b\u4f7f\u3046SVG Data URI
const PLACEHOLDER = (text="\ud83c\udf5c") =>
  `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='150' height='150'><rect width='150' height='150' fill='%23FADBD8'/><text x='75' y='85' font-size='48' text-anchor='middle'>${encodeURIComponent(text)}</text></svg>`;

// [ADD] \u30c7\u30e2\u30c7\u30fc\u30bf\uff08\u521d\u56de\u8868\u793a\u7528\uff09
const DEMO_ENTRIES = [
  { id:"d1", shopName:"\u98ef\u7530\u5546\u5e97",   visitDate:"2026-03-20", rating:5, genre:"\u5869",   area:"\u6e6f\u6cb3\u539f", images:[PLACEHOLDER("\u2728")], groupId:"g1", comment:"\u4eba\u751f\u3067\u4e00\u756a\u3046\u307e\u3044\u30e9\u30fc\u30e1\u30f3" },
  { id:"d2", shopName:"\u4e2d\u83ef\u305d\u3070 \u3068\u307f\u7530", visitDate:"2026-03-15", rating:5, genre:"\u3064\u3051\u9eba", area:"\u677e\u6238",  images:[PLACEHOLDER("\ud83c\udfaf")], groupId:"g1", comment:"\u3064\u3051\u9eba\u306e\u6982\u5ff5\u304c\u5909\u308f\u3063\u305f" },
  { id:"d3", shopName:"\u4e00\u862d \u6e0b\u8c37",  visitDate:"2026-02-28", rating:4, genre:"\u8c5a\u9aa8", area:"\u6e0b\u8c37",  images:[PLACEHOLDER("\ud83d\udc37")], groupId:"",   comment:"\u500b\u5ba4\u3067\u96c6\u4e2d\u3057\u3066\u98df\u3079\u308b" },
  { id:"d4", shopName:"\u4e8c\u90ce \u4e09\u7530\u672c\u5e97",visitDate:"2026-02-10",rating:3, genre:"\u4e8c\u90ce\u7cfb",area:"\u4e09\u7530", images:[PLACEHOLDER("\ud83d\udcaa")], groupId:"",   comment:"\u91cf\u304c\u9650\u754c\u7a81\u7834\u3057\u3066\u305f" },
];
const DEMO_SHOPS = [
  { name:"\u3089\u3041\u9eba \u98ef\u7530\u5546\u5e97",       score:98.5, genre:"\u5869",   area:"\u6e6f\u6cb3\u539f", id:"119107" },
  { name:"\u4e2d\u83ef\u305d\u3070 \u3068\u307f\u7530",       score:97.2, genre:"\u3064\u3051\u9eba",area:"\u677e\u6238",  id:"3051"   },
  { name:"Japanese Soba Noodles \u8526", score:96.0, genre:"\u91a4\u6cb9", area:"\u5de3\u9d28",  id:"58279"  },
  { name:"\u9eba\u5c4b \u6b66\u8535",             score:88.5, genre:"\u91a4\u6cb9", area:"\u65b0\u5bbf",  id:"1"      },
  { name:"\u98a8\u96f2\u5150",                score:89.3, genre:"\u9d8f\u767d\u6e6f",area:"\u4ee3\u3005\u6728",id:"4"      },
];

// \u2500\u2500\u2500 Context \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
const Ctx = createContext(null);
const useApp = () => useContext(Ctx);

function Provider({ children }) {
  const load = (key, fallback) => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } };

  const [entries,    setEntries]    = useState(() => load("rd_entries",  DEMO_ENTRIES));
  const [groups,     setGroups]     = useState(() => load("rd_groups",   [{ id:"g1", name:"\u30e9\u30fc\u30e1\u30f3\u90e8", emoji:"\ud83c\udf5c", members:["\u3042\u306a\u305f","\u7530\u4e2d","\u4f50\u85e4"] }]));
  const [profile,    setProfile]    = useState(() => load("rd_profile",  { name:"\u30e6\u30fc\u30b6\u30fc", gender:"\u672a\u8a2d\u5b9a", station:"\u672a\u8a2d\u5b9a", favorite:"\u91a4\u6cb9" }));
  const [settings,   setSettings]   = useState(() => load("rd_settings", { theme:"warm" }));
  const [tab,        setTab]        = useState(0);
  const [showPost,   setShowPost]   = useState(false);
  const [filterMode, setFilterMode] = useState({ type:"all", value:null });

  // [FIX-4] groups \u3082 localStorage \u306b\u4fdd\u5b58
  useEffect(() => { localStorage.setItem("rd_entries",  JSON.stringify(entries));  }, [entries]);
  useEffect(() => { localStorage.setItem("rd_groups",   JSON.stringify(groups));   }, [groups]);
  useEffect(() => { localStorage.setItem("rd_profile",  JSON.stringify(profile));  }, [profile]);
  useEffect(() => { localStorage.setItem("rd_settings", JSON.stringify(settings)); }, [settings]);

  const t = THEMES[settings.theme] || THEMES.warm;

  return (
    <Ctx.Provider value={{ entries, setEntries, groups, setGroups, profile, setProfile, settings, setSettings, tab, setTab, showPost, setShowPost, filterMode, setFilterMode, t }}>
      {children}
    </Ctx.Provider>
  );
}

// \u2500\u2500\u2500 \u5171\u901a: Men\uff5eLog \u30ed\u30b4 SVG \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function MenLogLogo({ size = 20 }) {
  const { t } = useApp();
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:1, fontFamily:"Georgia,serif", fontWeight:700, fontSize:size, color:t.tx, lineHeight:1 }}>
      <span>Men</span>
      <svg width={Math.round(size*1.8)} height={Math.round(size*0.85)} viewBox="0 0 36 16" fill="none"
        style={{ display:"inline-block", verticalAlign:"middle", margin:"0 1px" }}>
        <path d="M2 3 Q7 0 12 3 Q17 6 22 3 Q27 0 32 3 Q34.5 4.5 34 4"  stroke={t.acc} strokeWidth="2.2" strokeLinecap="round" fill="none"/>
        <path d="M2 7.5 Q7 4.5 12 7.5 Q17 10.5 22 7.5 Q27 4.5 32 7.5 Q34.5 9 34 8.5" stroke={t.acc} strokeWidth="1.9" strokeLinecap="round" fill="none" opacity="0.65"/>
        <path d="M2 12 Q7 9 12 12 Q17 15 22 12 Q27 9 32 12 Q34.5 13.5 34 13" stroke={t.acc} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.35"/>
      </svg>
      <span>Log</span>
    </span>
  );
}

// \u2500\u2500\u2500 \u30db\u30fc\u30e0 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function HomePage() {
  const { entries, profile, setTab, setFilterMode, t } = useApp();
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const months = Array.from(new Set(entries.map(e => e.visitDate?.slice(0, 7)).filter(Boolean))).sort().reverse();
  if (!months.includes(new Date().toISOString().slice(0, 7))) months.unshift(new Date().toISOString().slice(0, 7));

  const stats = {
    total: entries.length,
    month: entries.filter(e => e.visitDate?.startsWith(selectedMonth)).length,
    avg:   entries.length ? (entries.reduce((a, b) => a + (b.rating||0), 0) / entries.length).toFixed(1) : "0.0",
  };

  return (
    <div style={{ height:"100%", overflowY:"auto", background:t.bg }}>
      {/* \u30d2\u30fc\u30ed\u30fc\u30d0\u30ca\u30fc */}
      <div style={{ background:t.grad, padding:"40px 20px 24px", color:"white", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-30, right:-30, width:130, height:130, borderRadius:"50%", background:"rgba(255,255,255,0.1)" }}/>
        <div style={{ fontSize:12, opacity
