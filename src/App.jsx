import { useState, useEffect, useRef, useCallback } from "react";

const SUPABASE_URL = "https://rsjgybleagpruyuhhucd.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzamd5YmxlYWdwcnV5dWhodWNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MDM1MjksImV4cCI6MjA5MDE3OTUyOX0.-P-f5XlgyjU5vDVhOEdalwI5ntjQiJ9u00pTOI3oYuY";
const AI_MODEL = "claude-sonnet-4-20250514";
const PACK_SIZES = { onion: 3, "red onion": 3, pepper: 3, egg: 6, sausage: 8 };
const UNITS = ["", "g", "kg", "ml", "l", "tsp", "tbsp", "oz"];

// ── Supabase helpers ──────────────────────────────────────────────────────────
async function sbGet(id) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/meal_planner?id=eq.${id}&select=data`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  const rows = await r.json();
  return rows?.[0]?.data ?? null;
}

async function sbSet(id, data) {
  await fetch(`${SUPABASE_URL}/rest/v1/meal_planner`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify({ id, data, updated_at: new Date().toISOString() }),
  });
}

// ── Default state ─────────────────────────────────────────────────────────────
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const blankMeals = () => Object.fromEntries(DAYS.map(d => [d, { breakfast: "", lunch: "", dinner: "" }]));

const DEFAULT_STATE = {
  onboarded: false,
  familyName: "",
  adults: 2,
  children: 0,
  dietaryNotes: "",
  meals: blankMeals(),
  recipes: [],
  shopList: [],
  checkedItems: {},
  activeTab: "planner",
};

// ── Utility ───────────────────────────────────────────────────────────────────
function mergeQuantities(items) {
  const map = {};
  items.forEach(({ name, qty, unit }) => {
    const key = `${name.toLowerCase().trim()}__${unit}`;
    if (!map[key]) map[key] = { name: name.trim(), qty: 0, unit };
    map[key].qty += qty;
  });
  return Object.values(map);
}

// ── Components ────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: 32 }}>
      <div style={{
        width: 36, height: 36, border: "4px solid #e5e7eb",
        borderTopColor: "#6366f1", borderRadius: "50%",
        animation: "spin 0.8s linear infinite"
      }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function Tag({ children, color = "#6366f1" }) {
  return (
    <span style={{
      background: color + "22", color, border: `1px solid ${color}44`,
      borderRadius: 999, padding: "2px 10px", fontSize: 12, fontWeight: 600
    }}>{children}</span>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const saveTimer = useRef(null);

  // Load from Supabase on mount
  useEffect(() => {
    sbGet("main").then(data => {
      setState(data ?? DEFAULT_STATE);
      setLoading(false);
    }).catch(() => {
      setState(DEFAULT_STATE);
      setLoading(false);
    });
  }, []);

  // Poll for remote changes every 15 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const data = await sbGet("main").catch(() => null);
      if (data) setState(prev => ({ ...prev, ...data }));
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Debounced save to Supabase
  const save = useCallback((newState) => {
    setState(newState);
    setSyncing(true);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await sbSet("main", newState).catch(console.error);
      setSyncing(false);
    }, 1200);
  }, []);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8f7ff" }}>
      <Spinner />
    </div>
  );

  if (!state.onboarded) return <Onboarding state={state} save={save} />;

  return <MainApp state={state} save={save} syncing={syncing} />;
}

// ── Onboarding ────────────────────────────────────────────────────────────────
function Onboarding({ state, save }) {
  const [form, setForm] = useState({
    familyName: state.familyName || "",
    adults: state.adults || 2,
    children: state.children || 0,
    dietaryNotes: state.dietaryNotes || "",
  });

  const go = () => {
    if (!form.familyName.trim()) return;
    save({ ...DEFAULT_STATE, ...form, onboarded: true });
  };

  const s = {
    wrap: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#6366f1 0%,#a855f7 100%)", padding: 24 },
    card: { background: "#fff", borderRadius: 24, padding: "48px 40px", maxWidth: 460, width: "100%", boxShadow: "0 20px 60px #0002" },
    h1: { fontFamily: "Georgia,serif", fontSize: 32, color: "#1e1b4b", marginBottom: 8 },
    sub: { color: "#6b7280", marginBottom: 32, lineHeight: 1.5 },
    label: { display: "block", fontWeight: 600, color: "#374151", marginBottom: 6, fontSize: 14 },
    input: { width: "100%", border: "2px solid #e5e7eb", borderRadius: 10, padding: "10px 14px", fontSize: 15, outline: "none", boxSizing: "border-box", marginBottom: 20 },
    row: { display: "flex", gap: 16, marginBottom: 20 },
    num: { flex: 1, border: "2px solid #e5e7eb", borderRadius: 10, padding: "10px 14px", fontSize: 15, outline: "none" },
    btn: { width: "100%", background: "linear-gradient(135deg,#6366f1,#a855f7)", color: "#fff", border: "none", borderRadius: 12, padding: "14px 0", fontSize: 16, fontWeight: 700, cursor: "pointer", marginTop: 8 },
  };

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <h1 style={s.h1}>🍽 Your weekly shop,<br />sorted.</h1>
        <p style={s.sub}>Plan meals, build your shopping list, and let AI help — all synced between your phones.</p>

        <label style={s.label}>Family name</label>
        <input style={s.input} placeholder="e.g. The Smiths" value={form.familyName}
          onChange={e => setForm(f => ({ ...f, familyName: e.target.value }))} />

        <label style={s.label}>How many people?</label>
        <div style={s.row}>
          <div style={{ flex: 1 }}>
            <label style={{ ...s.label, fontWeight: 400, color: "#6b7280" }}>Adults</label>
            <input style={s.num} type="number" min={1} max={10} value={form.adults}
              onChange={e => setForm(f => ({ ...f, adults: +e.target.value }))} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ ...s.label, fontWeight: 400, color: "#6b7280" }}>Children</label>
            <input style={s.num} type="number" min={0} max={10} value={form.children}
              onChange={e => setForm(f => ({ ...f, children: +e.target.value }))} />
          </div>
        </div>

        <label style={s.label}>Dietary notes <span style={{ fontWeight: 400, color: "#9ca3af" }}>(optional)</span></label>
        <input style={s.input} placeholder="e.g. no nuts, vegetarian on weekdays" value={form.dietaryNotes}
          onChange={e => setForm(f => ({ ...f, dietaryNotes: e.target.value }))} />

        <button style={s.btn} onClick={go}>Let's get started →</button>
      </div>
    </div>
  );
}

// ── Main App Shell ────────────────────────────────────────────────────────────
function MainApp({ state, save, syncing }) {
  const tabs = [
    { id: "planner", icon: "📅", label: "Planner" },
    { id: "recipes", icon: "📖", label: "Recipes" },
    { id: "shop", icon: "🛒", label: "Shop" },
  ];

  const setTab = t => save({ ...state, activeTab: t });

  const s = {
    wrap: { minHeight: "100vh", background: "#f8f7ff", paddingBottom: 80 },
    header: { background: "linear-gradient(135deg,#6366f1,#a855f7)", padding: "20px 20px 16px", color: "#fff" },
    hrow: { display: "flex", alignItems: "center", justifyContent: "space-between" },
    title: { fontFamily: "Georgia,serif", fontSize: 22, fontWeight: 700 },
    sync: { fontSize: 12, opacity: 0.8 },
    nav: { position: "fixed", bottom: 0, left: 0, right: 0, background: "#fff", borderTop: "1px solid #e5e7eb", display: "flex", zIndex: 100 },
    navBtn: active => ({
      flex: 1, padding: "10px 0", border: "none", background: "none", cursor: "pointer",
      color: active ? "#6366f1" : "#9ca3af", fontWeight: active ? 700 : 400, fontSize: 12,
      display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
    }),
    navIcon: { fontSize: 20 },
  };

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <div style={s.hrow}>
          <span style={s.title}>🍽 {state.familyName}</span>
          <span style={s.sync}>{syncing ? "⏳ Saving…" : "✅ Synced"}</span>
        </div>
      </div>

      <div style={{ padding: "16px 16px 0" }}>
        {state.activeTab === "planner" && <Planner state={state} save={save} />}
        {state.activeTab === "recipes" && <Recipes state={state} save={save} />}
        {state.activeTab === "shop" && <ShopList state={state} save={save} />}
      </div>

      <nav style={s.nav}>
        {tabs.map(t => (
          <button key={t.id} style={s.navBtn(state.activeTab === t.id)} onClick={() => setTab(t.id)}>
            <span style={s.navIcon}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

// ── Planner ───────────────────────────────────────────────────────────────────
function Planner({ state, save }) {
  const [generating, setGenerating] = useState(false);
  const [expandedDay, setExpandedDay] = useState(null);

  const setMeal = (day, slot, val) => {
    const meals = { ...state.meals, [day]: { ...state.meals[day], [slot]: val } };
    save({ ...state, meals });
  };

  const generateWeek = async () => {
    setGenerating(true);
    const prompt = `Generate a full week of meals for a family: ${state.adults} adults, ${state.children} children. Dietary notes: "${state.dietaryNotes || "none"}".
Return ONLY valid JSON in this exact shape, no markdown:
{"Monday":{"breakfast":"...","lunch":"...","dinner":"..."},"Tuesday":{...},"Wednesday":{...},"Thursday":{...},"Friday":{...},"Saturday":{...},"Sunday":{...}}
Keep meal names short (3-6 words). Variety is important.`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: AI_MODEL, max_tokens: 1000, messages: [{ role: "user", content: prompt }] }),
      });
      const data = await res.json();
      const text = data.content?.find(b => b.type === "text")?.text || "{}";
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      save({ ...state, meals: { ...blankMeals(), ...parsed } });
    } catch (e) {
      console.error(e);
    }
    setGenerating(false);
  };

  const buildShopList = async () => {
    setGenerating(true);
    const mealList = DAYS.flatMap(d =>
      Object.entries(state.meals[d] || {}).map(([slot, meal]) => meal ? `${d} ${slot}: ${meal}` : null).filter(Boolean)
    ).join("\n");

    const prompt = `Given these meals for a family of ${state.adults + state.children}:
${mealList}

Return a shopping list as ONLY valid JSON array, no markdown:
[{"name":"item","qty":1,"unit":"kg"},...]
Use units: g, kg, ml, l, tsp, tbsp, or "" for countable items.
Group similar items. Be practical with quantities.`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: AI_MODEL, max_tokens: 1000, messages: [{ role: "user", content: prompt }] }),
      });
      const data = await res.json();
      const text = data.content?.find(b => b.type === "text")?.text || "[]";
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      const merged = mergeQuantities(parsed);
      save({ ...state, shopList: merged, checkedItems: {}, activeTab: "shop" });
    } catch (e) {
      console.error(e);
    }
    setGenerating(false);
  };

  const s = {
    card: { background: "#fff", borderRadius: 16, marginBottom: 12, overflow: "hidden", boxShadow: "0 2px 8px #0001" },
    dayHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", cursor: "pointer" },
    dayName: { fontWeight: 700, color: "#1e1b4b", fontSize: 15 },
    preview: { fontSize: 13, color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 },
    body: { padding: "0 16px 16px", borderTop: "1px solid #f3f4f6" },
    label: { fontSize: 12, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", marginTop: 12, marginBottom: 4 },
    input: { width: "100%", border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "8px 12px", fontSize: 14, outline: "none", boxSizing: "border-box" },
    btnRow: { display: "flex", gap: 10, marginBottom: 16 },
    btn: (color) => ({ flex: 1, background: color, color: "#fff", border: "none", borderRadius: 10, padding: "12px 0", fontWeight: 700, fontSize: 13, cursor: "pointer" }),
  };

  return (
    <div>
      <div style={s.btnRow}>
        <button style={s.btn("linear-gradient(135deg,#6366f1,#a855f7)")} onClick={generateWeek} disabled={generating}>
          {generating ? "⏳ Thinking…" : "✨ Plan my week"}
        </button>
        <button style={s.btn("linear-gradient(135deg,#10b981,#059669)")} onClick={buildShopList} disabled={generating}>
          🛒 Build shop list
        </button>
      </div>

      {DAYS.map(day => {
        const meals = state.meals?.[day] || {};
        const expanded = expandedDay === day;
        const preview = [meals.breakfast, meals.lunch, meals.dinner].filter(Boolean).join(" · ") || "No meals yet";
        return (
          <div key={day} style={s.card}>
            <div style={s.dayHeader} onClick={() => setExpandedDay(expanded ? null : day)}>
              <span style={s.dayName}>{day}</span>
              <span style={s.preview}>{preview}</span>
              <span>{expanded ? "▲" : "▼"}</span>
            </div>
            {expanded && (
              <div style={s.body}>
                {["breakfast", "lunch", "dinner"].map(slot => (
                  <div key={slot}>
                    <div style={s.label}>{slot}</div>
                    <input style={s.input} value={meals[slot] || ""} placeholder={`Enter ${slot}…`}
                      onChange={e => setMeal(day, slot, e.target.value)} />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Recipes ───────────────────────────────────────────────────────────────────
function Recipes({ state, save }) {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const findRecipe = async () => {
    if (!search.trim()) return;
    setLoading(true);
    const prompt = `Give me a recipe for "${search}" suitable for ${state.adults} adults and ${state.children} children. Dietary notes: "${state.dietaryNotes || "none"}".
Return ONLY valid JSON, no markdown:
{"name":"...","time":"30 mins","servings":4,"ingredients":["200g pasta","..."],"steps":["Step 1...","..."]}`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: AI_MODEL, max_tokens: 1000, messages: [{ role: "user", content: prompt }] }),
      });
      const data = await res.json();
      const text = data.content?.find(b => b.type === "text")?.text || "{}";
      const recipe = JSON.parse(text.replace(/```json|```/g, "").trim());
      const recipes = [{ ...recipe, id: Date.now() }, ...state.recipes];
      save({ ...state, recipes });
      setSearch("");
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const del = (id) => save({ ...state, recipes: state.recipes.filter(r => r.id !== id) });

  const s = {
    searchRow: { display: "flex", gap: 8, marginBottom: 16 },
    input: { flex: 1, border: "2px solid #e5e7eb", borderRadius: 10, padding: "10px 14px", fontSize: 14, outline: "none" },
    btn: { background: "linear-gradient(135deg,#6366f1,#a855f7)", color: "#fff", border: "none", borderRadius: 10, padding: "0 18px", fontWeight: 700, cursor: "pointer", fontSize: 14 },
    card: { background: "#fff", borderRadius: 16, marginBottom: 12, boxShadow: "0 2px 8px #0001", overflow: "hidden" },
    header: { padding: "14px 16px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" },
    name: { fontWeight: 700, color: "#1e1b4b", fontSize: 15 },
    meta: { fontSize: 12, color: "#6b7280", display: "flex", gap: 8, marginTop: 4 },
    body: { padding: "0 16px 16px", borderTop: "1px solid #f3f4f6" },
    sectionTitle: { fontWeight: 700, color: "#374151", marginTop: 12, marginBottom: 6, fontSize: 14 },
    item: { fontSize: 14, color: "#4b5563", marginBottom: 3 },
    delBtn: { background: "#fee2e2", color: "#ef4444", border: "none", borderRadius: 8, padding: "4px 12px", cursor: "pointer", fontSize: 12, fontWeight: 600 },
  };

  return (
    <div>
      <div style={s.searchRow}>
        <input style={s.input} value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search a recipe…" onKeyDown={e => e.key === "Enter" && findRecipe()} />
        <button style={s.btn} onClick={findRecipe} disabled={loading}>{loading ? "⏳" : "Find"}</button>
      </div>

      {state.recipes.length === 0 && !loading && (
        <div style={{ textAlign: "center", color: "#9ca3af", padding: 40 }}>
          <div style={{ fontSize: 40 }}>📖</div>
          <div>Search for a recipe to get started</div>
        </div>
      )}

      {state.recipes.map(r => (
        <div key={r.id} style={s.card}>
          <div style={s.header} onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
            <div>
              <div style={s.name}>{r.name}</div>
              <div style={s.meta}>
                {r.time && <Tag color="#6366f1">⏱ {r.time}</Tag>}
                {r.servings && <Tag color="#10b981">👥 {r.servings}</Tag>}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button style={s.delBtn} onClick={e => { e.stopPropagation(); del(r.id); }}>✕</button>
              <span>{expanded === r.id ? "▲" : "▼"}</span>
            </div>
          </div>
          {expanded === r.id && (
            <div style={s.body}>
              <div style={s.sectionTitle}>Ingredients</div>
              {(r.ingredients || []).map((ing, i) => <div key={i} style={s.item}>• {ing}</div>)}
              <div style={s.sectionTitle}>Method</div>
              {(r.steps || []).map((step, i) => <div key={i} style={{ ...s.item, marginBottom: 8 }}>{i + 1}. {step}</div>)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Shop List ─────────────────────────────────────────────────────────────────
function ShopList({ state, save }) {
  const [newItem, setNewItem] = useState({ name: "", qty: 1, unit: "" });

  const toggle = (key) => {
    const checkedItems = { ...state.checkedItems, [key]: !state.checkedItems[key] };
    save({ ...state, checkedItems });
  };

  const addItem = () => {
    if (!newItem.name.trim()) return;
    const shopList = [...state.shopList, { ...newItem, qty: +newItem.qty }];
    save({ ...state, shopList: mergeQuantities(shopList) });
    setNewItem({ name: "", qty: 1, unit: "" });
  };

  const removeItem = (idx) => {
    const shopList = state.shopList.filter((_, i) => i !== idx);
    save({ ...state, shopList });
  };

  const clearChecked = () => {
    const checked = new Set(Object.entries(state.checkedItems).filter(([, v]) => v).map(([k]) => k));
    const shopList = state.shopList.filter((_, i) => !checked.has(String(i)));
    save({ ...state, shopList, checkedItems: {} });
  };

  const unchecked = state.shopList.filter((_, i) => !state.checkedItems[i]);
  const checked = state.shopList.filter((_, i) => state.checkedItems[i]);

  const s = {
    addRow: { display: "flex", gap: 8, marginBottom: 16, alignItems: "center" },
    nameInput: { flex: 2, border: "2px solid #e5e7eb", borderRadius: 10, padding: "10px 12px", fontSize: 14, outline: "none" },
    qtyInput: { width: 60, border: "2px solid #e5e7eb", borderRadius: 10, padding: "10px 8px", fontSize: 14, outline: "none", textAlign: "center" },
    unitSel: { width: 70, border: "2px solid #e5e7eb", borderRadius: 10, padding: "10px 4px", fontSize: 13, outline: "none" },
    addBtn: { background: "#6366f1", color: "#fff", border: "none", borderRadius: 10, padding: "0 14px", fontWeight: 700, cursor: "pointer", fontSize: 18, height: 42 },
    item: (done) => ({ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "#fff", borderRadius: 12, marginBottom: 8, boxShadow: "0 1px 4px #0001", opacity: done ? 0.5 : 1 }),
    check: { width: 22, height: 22, accentColor: "#6366f1", cursor: "pointer", flexShrink: 0 },
    itemName: (done) => ({ flex: 1, fontSize: 15, color: done ? "#9ca3af" : "#1e1b4b", textDecoration: done ? "line-through" : "none", fontWeight: 500 }),
    itemQty: { fontSize: 13, color: "#6b7280" },
    delBtn: { background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#d1d5db" },
    sectionLabel: { fontWeight: 700, color: "#9ca3af", fontSize: 12, textTransform: "uppercase", marginBottom: 8, marginTop: 4 },
    clearBtn: { background: "#fee2e2", color: "#ef4444", border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 13, fontWeight: 600, marginBottom: 12 },
  };

  return (
    <div>
      <div style={s.addRow}>
        <input style={s.nameInput} value={newItem.name} onChange={e => setNewItem(n => ({ ...n, name: e.target.value }))}
          placeholder="Add item…" onKeyDown={e => e.key === "Enter" && addItem()} />
        <input style={s.qtyInput} type="number" min={0.1} step={0.1} value={newItem.qty}
          onChange={e => setNewItem(n => ({ ...n, qty: e.target.value }))} />
        <select style={s.unitSel} value={newItem.unit} onChange={e => setNewItem(n => ({ ...n, unit: e.target.value }))}>
          {UNITS.map(u => <option key={u} value={u}>{u || "—"}</option>)}
        </select>
        <button style={s.addBtn} onClick={addItem}>+</button>
      </div>

      {state.shopList.length === 0 && (
        <div style={{ textAlign: "center", color: "#9ca3af", padding: 40 }}>
          <div style={{ fontSize: 40 }}>🛒</div>
          <div>Your shop list will appear here</div>
          <div style={{ fontSize: 13, marginTop: 8 }}>Go to Planner → Build shop list</div>
        </div>
      )}

      {unchecked.length > 0 && (
        <>
          <div style={s.sectionLabel}>To buy ({unchecked.length})</div>
          {state.shopList.map((item, i) => !state.checkedItems[i] && (
            <div key={i} style={s.item(false)}>
              <input type="checkbox" style={s.check} checked={false} onChange={() => toggle(i)} />
              <span style={s.itemName(false)}>{item.name}</span>
              <span style={s.itemQty}>{item.qty}{item.unit}</span>
              <button style={s.delBtn} onClick={() => removeItem(i)}>✕</button>
            </div>
          ))}
        </>
      )}

      {checked.length > 0 && (
        <>
          <div style={{ ...s.sectionLabel, marginTop: 20 }}>In basket ({checked.length})</div>
          <button style={s.clearBtn} onClick={clearChecked}>Clear ticked items</button>
          {state.shopList.map((item, i) => state.checkedItems[i] && (
            <div key={i} style={s.item(true)}>
              <input type="checkbox" style={s.check} checked onChange={() => toggle(i)} />
              <span style={s.itemName(true)}>{item.name}</span>
              <span style={s.itemQty}>{item.qty}{item.unit}</span>
              <button style={s.delBtn} onClick={() => removeItem(i)}>✕</button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}