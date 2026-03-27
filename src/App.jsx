import { useState, useEffect, useRef, useCallback, cloneElement } from "react";

const STORAGE_KEY = "family-shop-v14";
const AI_MODEL = "claude-sonnet-4-20250514";
const PACK_SIZES = { "onion":3,"red onion":3,"pepper":3,"egg":6,"sausage":8 };
const UNITS = ["","g","kg","ml","l","tsp","tbsp","oz","lb","cm","tin","pack","bag","bottle","pot","head","clove","piece","slice"];
const INGREDIENT_DICT = [
  "chicken breast","chicken thighs","minced beef","beef steak","lamb chops","pork chops","bacon","sausages","salmon fillet","cod fillet","tuna","prawns","ham",
  "milk","butter","cheddar cheese","mozzarella","parmesan","feta cheese","cream cheese","double cream","yoghurt","eggs",
  "bread","white bread","wholemeal bread","pitta bread","naan bread","tortilla wraps","baguette","croissant",
  "spaghetti","penne","tagliatelle","lasagne sheets","rice","basmati rice","quinoa","couscous","orzo","noodles",
  "onion","red onion","garlic","garlic cloves","ginger","tomatoes","cherry tomatoes","red pepper","yellow pepper","green pepper",
  "courgette","aubergine","broccoli","cauliflower","carrots","potatoes","sweet potato","spinach","kale","cucumber",
  "lettuce","avocado","mushrooms","leek","celery","peas","green beans","spring onion","chilli","lemon","lime",
  "fresh coriander","fresh parsley","fresh basil","chopped tomatoes","coconut milk","kidney beans","chickpeas","lentils",
  "baked beans","chicken stock","vegetable stock","beef stock",
  "olive oil","vegetable oil","soy sauce","fish sauce","tomato puree","tomato ketchup","mayonnaise","mustard","pesto",
  "sriracha","balsamic vinegar","honey","teriyaki sauce","oyster sauce","tikka masala paste","harissa","miso paste",
  "plain flour","self-raising flour","sugar","caster sugar","brown sugar","baking powder","cocoa powder","vanilla extract","cornflour","yeast",
  "salt","black pepper","cumin","coriander","turmeric","paprika","smoked paprika","chilli powder","garam masala",
  "curry powder","oregano","thyme","rosemary","bay leaves","cinnamon","cayenne pepper"
];

const CAT_META = {
  "Fruit & Veg":          { color:"green",  icon:"veg"    },
  "Meat & Fish":          { color:"coral",  icon:"meat"   },
  "Dairy & Eggs":         { color:"blue",   icon:"dairy"  },
  "Bread & Bakery":       { color:"amber",  icon:"bread"  },
  "Pasta, Rice & Grains": { color:"pink",   icon:"pasta"  },
  "Tins & Jars":          { color:"gray",   icon:"tin"    },
  "Sauces & Condiments":  { color:"purple", icon:"sauce"  },
  "Baking":               { color:"amber",  icon:"baking" },
  "Snacks & Treats":      { color:"coral",  icon:"snack"  },
  "Other":                { color:"gray",   icon:"basket" },
};
const CATS = Object.keys(CAT_META);

const RAMP = {
  green:  { light:{bg:"#EAF3DE",border:"#97C459",text:"#27500A",dot:"#639922"}, dark:{bg:"#1E2B14",border:"#3B6D11",text:"#C0DD97",dot:"#639922"} },
  coral:  { light:{bg:"#FAECE7",border:"#F0997B",text:"#712B13",dot:"#D85A30"}, dark:{bg:"#2B1710",border:"#993C1D",text:"#F5C4B3",dot:"#D85A30"} },
  blue:   { light:{bg:"#E6F1FB",border:"#85B7EB",text:"#0C447C",dot:"#378ADD"}, dark:{bg:"#0E1E30",border:"#185FA5",text:"#B5D4F4",dot:"#378ADD"} },
  amber:  { light:{bg:"#FAEEDA",border:"#EF9F27",text:"#633806",dot:"#EF9F27"}, dark:{bg:"#2A1E08",border:"#854F0B",text:"#FAC775",dot:"#EF9F27"} },
  pink:   { light:{bg:"#FBEAF0",border:"#ED93B1",text:"#72243E",dot:"#D4537E"}, dark:{bg:"#28101C",border:"#993556",text:"#F4C0D1",dot:"#D4537E"} },
  gray:   { light:{bg:"#F1EFE8",border:"#B4B2A9",text:"#444441",dot:"#888780"}, dark:{bg:"#1E1D1B",border:"#5F5E5A",text:"#D3D1C7",dot:"#888780"} },
  purple: { light:{bg:"#EEEDFE",border:"#AFA9EC",text:"#3C3489",dot:"#7F77DD"}, dark:{bg:"#17153A",border:"#534AB7",text:"#CECBF6",dot:"#7F77DD"} },
  teal:   { light:{bg:"#E1F5EE",border:"#5DCAA5",text:"#085041",dot:"#1D9E75"}, dark:{bg:"#0A2820",border:"#0F6E56",text:"#9FE1CB",dot:"#1D9E75"} },
};

const TAG = {
  pasta:  { color:"pink",   label:"pasta",  icon:"pasta"  },
  meat:   { color:"coral",  label:"meat",   icon:"meat"   },
  veggie: { color:"green",  label:"veggie", icon:"veg"    },
  quick:  { color:"purple", label:"quick",  icon:"quick"  },
  fish:   { color:"blue",   label:"fish",   icon:"fish"   },
  other:  { color:"gray",   label:"other",  icon:"basket" },
};

const NAV = [
  { label:"Plan",    icon:"plan"    },
  { label:"List",    icon:"list"    },
  { label:"Recipes", icon:"recipes" },
  { label:"Staples", icon:"staples" },
  { label:"AI",      icon:"ai"      },
];

const THEMES = {
  light: { bg:"#FAF9F6",card:"#FFFFFF",surface:"#F4F3F0",input:"#FFFFFF",text:"#1A1A1A",muted:"#777770",hint:"#AAAAAA",border:"rgba(0,0,0,0.11)",btn:"#FFFFFF",navBg:"#FFFFFF",navBorder:"rgba(0,0,0,0.08)",progressBg:"#E8E7E4",syncDot:"#639922",warnBg:"#FFFBF0",warnBorder:"rgba(186,117,23,0.3)",warnText:"#855010" },
  dark:  { bg:"#141414",card:"#1F1E1C",surface:"#252422",input:"#1A1917",text:"#F0EDE8",muted:"#888880",hint:"#555550",border:"rgba(255,255,255,0.1)",btn:"#2A2927",navBg:"#181715",navBorder:"rgba(255,255,255,0.07)",progressBg:"#2A2927",syncDot:"#639922",warnBg:"#1F1A0A",warnBorder:"rgba(186,117,23,0.3)",warnText:"#FAC775" },
};

const ICONS = {
  veg:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C9 2 6 5 6 8c0 2.5 1.5 4.5 3.5 5.5M12 2c3 0 6 3 6 6 0 2.5-1.5 4.5-3.5 5.5M12 2v20M9.5 13.5C8 15 7 17 7 19h10c0-2-1-4-2.5-5.5"/></svg>,
  meat:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4.5c2.5-1 5 .5 5 3.5 0 2-1.5 3.5-3.5 4L8 19H5l-1-1v-3l7.5-8c-.5-1.5 0-3.5 1.5-4.5z"/><path d="M16 7l1 1M18 9l1-1"/></svg>,
  dairy:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2h8l1 4H7L8 2z"/><path d="M7 6l-1 14a1 1 0 001 1h10a1 1 0 001-1L17 6"/><path d="M9 11h6M9 14h4"/></svg>,
  bread:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10c0-3.5 2.5-6 8-6s8 2.5 8 6c0 2-1 3.5-2.5 4.5V20H6.5v-5.5C5 13.5 4 12 4 10z"/><path d="M6.5 14.5h11"/></svg>,
  pasta:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 17c0 2 6.5 3 7 3s7-1 7-3"/><path d="M5 17v-1.5c0-2 14-2 14 0V17"/><path d="M8 15.5V9m4 6.5V7m4 8.5V9"/><path d="M6 9c0-2 1.5-3 2-5M12 9c0-2 1.5-3 2-5M10 7c0-2 1.5-3 2-5"/></svg>,
  tin:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="6" width="12" height="14" rx="2"/><path d="M6 10h12M9 6V4h6v2"/><path d="M10 13h4M10 16h2"/></svg>,
  sauce:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2h4v3l1 1h1a1 1 0 011 1v1H7V7a1 1 0 011-1h1L10 5V2z"/><path d="M7 8l-1 12a1 1 0 001 1h10a1 1 0 001-1L17 8"/><path d="M9 13c1 1 5 1 6 0"/></svg>,
  baking:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19h16M6 19v-6a6 6 0 0112 0v6"/><path d="M12 7V4M10 5l2-2 2 2"/><path d="M9 13h6"/></svg>,
  snack:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="8" width="16" height="11" rx="2"/><path d="M8 8V6a4 4 0 018 0v2"/><circle cx="9" cy="13" r="0.5" fill="currentColor"/><circle cx="12" cy="13" r="0.5" fill="currentColor"/><circle cx="15" cy="13" r="0.5" fill="currentColor"/></svg>,
  basket:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2l-4 7h20l-4-7M2 9l2 11h16l2-11"/><path d="M9 9v8M12 9v8M15 9v8"/></svg>,
  quick:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L4 14h8l-1 8 9-12h-8l1-8z"/></svg>,
  fish:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12c2-5 6-8 10-8 5 0 8 4 8 8s-3 8-8 8c-4 0-8-3-10-8z"/><path d="M18 9l3-3M18 15l3 3"/><circle cx="8" cy="11" r="1" fill="currentColor"/></svg>,
  plan:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/></svg>,
  list:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12l2 2 4-4"/></svg>,
  recipes: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/><path d="M9 7h6M9 11h6M9 15h4"/></svg>,
  staples: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2v6l-2 4v9a1 1 0 001 1h14a1 1 0 001-1v-9l-2-4V2"/><path d="M6 8h12M12 2v6"/></svg>,
  ai:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/><path d="M19 15l.75 2.25L22 18l-2.25.75L19 21l-.75-2.25L16 18l2.25-.75L19 15z"/><path d="M5 17l.5 1.5L7 19l-1.5.5L5 21l-.5-1.5L3 19l1.5-.5L5 17z"/></svg>,
  camera:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  search:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>,
  suggest: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>,
  person:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  share:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/></svg>,
  family:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  sun:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>,
  moon:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>,
  check:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>,
  info:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>,
  edit:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>,
  plus:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>,
  close:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>,
  note:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  warn:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
};

var mkid = function () { return Date.now() + Math.floor(Math.random() * 9999); };
var norm = function (s) { return s.toLowerCase().trim(); };

function getRamp(cat, dark) {
  var k = (CAT_META[cat] && CAT_META[cat].color) || "gray";
  return RAMP[k][dark ? "dark" : "light"];
}
function getTagR(tag, dark) {
  var k = (TAG[tag] && TAG[tag].color) || "gray";
  return RAMP[k][dark ? "dark" : "light"];
}

function guessCat(name) {
  var n = norm(name);
  if (/spinach|lettuce|onion|tomato|pepper|carrot|potato|broccoli|cucumber|garlic|ginger|celery|courgette|aubergine|leek|mushroom|avocado|lemon|lime|herb|parsley|coriander|basil|mint|sweet potato|green bean|pea|corn|cabbage|kale|rocket|salad|veg|apple|banana|orange|berr|mango|grape|melon|peach/.test(n)) return "Fruit & Veg";
  if (/chicken|beef|mince|lamb|pork|turkey|bacon|sausage|steak|ham|duck|salmon|tuna|cod|fish|prawn|shrimp/.test(n)) return "Meat & Fish";
  if (/milk|cheese|butter|cream|yoghurt|yogurt|egg|feta|mozzarella|cheddar|parmesan|brie/.test(n)) return "Dairy & Eggs";
  if (/bread|wrap|tortilla|pitta|roll|bun|bagel|croissant|loaf|naan/.test(n)) return "Bread & Bakery";
  if (/pasta|spaghetti|penne|tagliatelle|lasagne|noodle|rice|quinoa|couscous|orzo/.test(n)) return "Pasta, Rice & Grains";
  if (/tin|can|kidney bean|chickpea|lentil|chopped tomato|coconut milk|baked bean/.test(n)) return "Tins & Jars";
  if (/sauce|ketchup|mayo|mustard|soy|teriyaki|pesto|stock|vinegar|oil|dressing|relish|chutney|jam|honey|syrup|guacamole/.test(n)) return "Sauces & Condiments";
  if (/flour|sugar|baking|yeast|cocoa|vanilla/.test(n)) return "Baking";
  if (/crisp|biscuit|chocolate|sweet|snack|nut|almond|cashew|popcorn/.test(n)) return "Snacks & Treats";
  return "Other";
}

function ingKey(name) {
  return norm(name).replace(/cloves?$/, "").replace(/\s+/g, " ").trim().replace(/ies$/, "y").replace(/es$/, "").replace(/s$/, "");
}

function smartQty(qty, unit) {
  var whole = ["", "tin", "pack", "bag", "head", "bulb", "bottle", "pot", "piece", "clove", "slice"];
  if (whole.indexOf((unit || "").toLowerCase()) >= 0) return Math.ceil(qty);
  return Math.round(qty * 4) / 4;
}

function fmtQty(qty, unit) {
  if (qty == null) return "";
  if (!unit && qty === 1) return "";
  var fracs = { 0.25: "¼", 0.5: "½", 0.75: "¾", 1.25: "1¼", 1.5: "1½", 1.75: "1¾", 2.5: "2½", 3.5: "3½" };
  if (fracs[qty]) return fracs[qty];
  if (qty === Math.floor(qty)) return String(qty);
  return String(qty);
}

function sanitiseIngs(ings) {
  if (!ings || !Array.isArray(ings)) return [];
  return ings.filter(function (i) { return i && i.name; }).map(function (i) {
    var q = parseFloat(i.qty);
    return { name: String(i.name).trim(), qty: (isNaN(q) || q <= 0) ? 1 : q, unit: String(i.unit || "").toLowerCase(), category: i.category || guessCat(i.name) };
  });
}

function buildList(meals, selIds, staples, actSta, serves, extras) {
  var map = {};
  selIds.forEach(function (id) {
    var meal = meals.find(function (m) { return m.id === id; });
    if (!meal) return;
    var scale = serves / (meal.serves || 4);
    meal.ingredients.forEach(function (ing) {
      var key = ingKey(ing.name);
      if (!map[key]) map[key] = Object.assign({}, ing, { totalQty: 0, sources: [], displayName: ing.name });
      map[key].totalQty += ing.qty * scale;
      map[key].sources.push(meal.name);
    });
  });
  var mealItems = Object.values(map).map(function (item) {
    var q = smartQty(item.totalQty, item.unit);
    var pk = item.packKey;
    if (pk && PACK_SIZES[pk]) {
      var ps = PACK_SIZES[pk], packs = Math.ceil(q / ps), spare = packs * ps - q;
      return Object.assign({}, item, { name: item.displayName, displayQty: packs, displayUnit: "pack" + (packs > 1 ? "s" : "") + " of " + ps, detail: spare > 0 ? "need " + q + ", " + spare + " spare" : "exact" });
    }
    return Object.assign({}, item, { name: item.displayName, displayQty: q, displayUnit: item.unit, detail: null });
  });
  var stapleItems = staples.filter(function (s) { return actSta.indexOf(s.id) >= 0; }).map(function (s) {
    return Object.assign({}, s, { totalQty: 0, displayQty: null, displayUnit: "", sources: ["Staple"], detail: null, isStaple: true });
  });
  var extraItems = (extras || []).map(function (e) {
    return Object.assign({}, e, { totalQty: 0, displayQty: null, displayUnit: "", sources: ["Added"], detail: null, isExtra: true });
  });
  return mealItems.concat(stapleItems).concat(extraItems);
}

function groupBy(items) {
  var g = {};
  items.forEach(function (i) { var c = i.category || "Other"; if (!g[c]) g[c] = []; g[c].push(i); });
  return g;
}

function parseIngs(txt) {
  var unitRx = /^([\d.]+)\s*(tbsps?|tsps?|tablespoons?|teaspoons?|kg|ml|g|l|cm|oz|lb|tins?|jars?|packs?|bags?|heads?|cloves?|bottles?|pots?|pieces?|slices?)\s+(.+)$/i;
  var bareRx = /^([\d.]+)\s+(.+)$/;
  return txt.split(",").map(function (s) { return s.trim(); }).filter(Boolean).map(function (p) {
    var qty = 1, unit = "", name = p;
    var m1 = p.match(unitRx);
    if (m1) { qty = parseFloat(m1[1]); unit = m1[2].toLowerCase().replace(/s$/, "").replace("tablespoon", "tbsp").replace("teaspoon", "tsp"); name = m1[3].trim(); }
    else { var m2 = p.match(bareRx); if (m2) { qty = parseFloat(m2[1]); name = m2[2].trim(); } }
    var pk = Object.keys(PACK_SIZES).find(function (k) { return norm(name).indexOf(k) >= 0; });
    return { name: name, qty: qty, unit: unit, category: guessCat(name), packKey: pk || undefined };
  });
}

function callAI(messages, system) {
  return fetch("https://api.anthropic.com/v1/messages", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: AI_MODEL, max_tokens: 1000, system: system, messages: messages }),
  }).then(function (r) { return r.json(); }).then(function (d) {
    var b = d.content && d.content.find(function (x) { return x.type === "text"; });
    return b ? b.text : "";
  });
}

function parseAIRecipes(txt) {
  try { return JSON.parse(txt.replace(/```json|```/g, "").trim()); } catch (e) { return []; }
}

function Icon(p) {
  var s = p.size || 16, c = p.color || "currentColor", icon = ICONS[p.name];
  if (!icon) return null;
  return (
    <span style={{ width: s, height: s, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: c }}>
      {cloneElement(icon, { width: s, height: s })}
    </span>
  );
}

function Spin(p) {
  var s = p.size || 18, c = p.color || "#378ADD";
  return <div style={{ width: s, height: s, border: "2px solid " + c + "33", borderTopColor: c, borderRadius: "50%", animation: "spin 0.7s linear infinite", flexShrink: 0 }} />;
}

function Chip(p) {
  var t = TAG[p.tag]; if (!t) return null;
  var r = getTagR(p.tag, p.dark);
  return (
    <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px 2px 6px", borderRadius: 20, background: r.bg, color: r.text, letterSpacing: "0.03em", display: "inline-flex", alignItems: "center", gap: 4, border: "0.5px solid " + r.border + "55" }}>
      <Icon name={t.icon} size={11} color={r.text} />{t.label}
    </span>
  );
}

function Tick(p) {
  var s = p.size || 22, d = p.dot || "#378ADD";
  return (
    <div style={{ width: s, height: s, borderRadius: 6, flexShrink: 0, border: p.checked ? "none" : "1.5px solid " + d + "44", background: p.checked ? d : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
      {p.checked && <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 5.5l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
    </div>
  );
}

function Lbl(p) {
  return <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 10, fontWeight: 600, color: p.dark ? "#777" : "#999", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>{p.children}{p.hint && <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, marginLeft: 4 }}>({p.hint})</span>}</div>;
}

function IngEditor(p) {
  function toRows(ings) {
    if (!ings || !ings.length) return [{ id: mkid(), name: "", qty: "", unit: "" }];
    return ings.map(function (i) { return { id: mkid(), name: i.name || "", qty: i.qty ? String(i.qty) : "", unit: i.unit || "" }; });
  }
  var ms = useState("rows"), mode = ms[0], setMode = ms[1];
  var rs = useState(""), raw = rs[0], setRaw = rs[1];
  var rws = useState(function () { return toRows(p.value); }), rows = rws[0], setRows = rws[1];

  useEffect(function () { if (p.value && p.value.length > 0) setRows(toRows(p.value)); }, [p.value]);

  function sync(nr) { setRows(nr); p.onChange(nr.filter(function (r) { return r.name.trim(); })); }
  function upd(id, f, v) { sync(rows.map(function (r) { return r.id === id ? Object.assign({}, r, { [f]: v }) : r; })); }
  function addRow() { setRows(function (prev) { return prev.concat([{ id: mkid(), name: "", qty: "", unit: "" }]); }); }
  function delRow(id) { var n = rows.length > 1 ? rows.filter(function (r) { return r.id !== id; }) : [{ id: mkid(), name: "", qty: "", unit: "" }]; sync(n); }
  function goRows() { var parsed = parseIngs(raw); var n = parsed.length ? parsed.map(function (x) { return { id: mkid(), name: x.name, qty: x.qty ? String(x.qty) : "", unit: x.unit || "" }; }) : [{ id: mkid(), name: "", qty: "", unit: "" }]; sync(n); setMode("rows"); }
  function goPaste() { setRaw(rows.filter(function (r) { return r.name.trim(); }).map(function (r) { return (r.qty ? r.qty + " " : "") + (r.unit ? r.unit + " " : "") + r.name; }).join(", ")); setMode("paste"); }

  var T = p.T, dark = p.dark, isR = mode === "rows";
  var iS = { background: T.input, color: T.text, border: "0.5px solid " + T.border, borderRadius: 7, padding: "6px 8px", fontSize: 13, fontFamily: "'Inter',sans-serif", outline: "none" };
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
        <Lbl dark={dark}>Ingredients</Lbl>
        <div style={{ display: "flex", border: "0.5px solid " + T.border, borderRadius: 7, overflow: "hidden" }}>
          <button onClick={function () { if (!isR) goRows(); }} style={{ fontSize: 11, padding: "3px 10px", border: "none", background: isR ? T.text : T.surface, color: isR ? (dark ? "#141414" : "#fff") : T.muted, cursor: "pointer", fontFamily: "'Inter',sans-serif", fontWeight: 500 }}>Rows</button>
          <button onClick={function () { if (isR) goPaste(); }} style={{ fontSize: 11, padding: "3px 10px", border: "none", background: !isR ? T.text : T.surface, color: !isR ? (dark ? "#141414" : "#fff") : T.muted, cursor: "pointer", fontFamily: "'Inter',sans-serif", fontWeight: 500 }}>Paste</button>
        </div>
      </div>
      {isR && (
        <div>
          <datalist id="ing-list">{INGREDIENT_DICT.map(function (i) { return <option key={i} value={i} />; })}</datalist>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 54px 78px 24px", gap: 5, marginBottom: 4 }}>
            <div style={{ fontSize: 10, color: T.hint, fontFamily: "'Inter',sans-serif", paddingLeft: 2 }}>Ingredient</div>
            <div style={{ fontSize: 10, color: T.hint, fontFamily: "'Inter',sans-serif" }}>Qty</div>
            <div style={{ fontSize: 10, color: T.hint, fontFamily: "'Inter',sans-serif" }}>Unit</div>
            <div />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {rows.map(function (row, idx) {
              return (
                <div key={row.id} style={{ display: "grid", gridTemplateColumns: "1fr 54px 78px 24px", gap: 5, alignItems: "center" }}>
                  <input value={row.name} onChange={function (e) { upd(row.id, "name", e.target.value); }} onKeyDown={function (e) { if (e.key === "Enter") { e.preventDefault(); addRow(); } }} placeholder={idx === 0 ? "e.g. chicken breast" : ""} list="ing-list" style={{ ...iS, width: "100%", boxSizing: "border-box" }} />
                  <input value={row.qty} onChange={function (e) { upd(row.id, "qty", e.target.value); }} placeholder="1" type="text" inputMode="decimal" style={{ ...iS, width: "100%", boxSizing: "border-box" }} />
                  <select value={row.unit} onChange={function (e) { upd(row.id, "unit", e.target.value); }} style={{ ...iS, width: "100%", boxSizing: "border-box", cursor: "pointer" }}>
                    {UNITS.map(function (u) { return <option key={u} value={u}>{u || "count"}</option>; })}
                  </select>
                  <button onClick={function () { delRow(row.id); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="close" size={14} color={T.hint} /></button>
                </div>
              );
            })}
          </div>
          <button onClick={addRow} style={{ marginTop: 8, fontSize: 12, color: T.muted, background: "none", border: "0.5px dashed " + T.border, borderRadius: 7, padding: "5px 0", cursor: "pointer", fontFamily: "'Inter',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, width: "100%", boxSizing: "border-box" }}>
            <Icon name="plus" size={12} color={T.muted} />Add ingredient
          </button>
        </div>
      )}
      {!isR && (
        <div>
          <textarea value={raw} onChange={function (e) { setRaw(e.target.value); }} placeholder="500g chicken breast, 2 onions, 1 tsp cumin..." style={{ ...iS, width: "100%", boxSizing: "border-box", minHeight: 80, padding: "8px 10px", borderRadius: 10, resize: "vertical", lineHeight: 1.6 }} />
          <button onClick={goRows} style={{ marginTop: 6, fontSize: 12, color: T.muted, background: T.surface, border: "0.5px solid " + T.border, borderRadius: 7, padding: "5px 12px", cursor: "pointer", fontFamily: "'Inter',sans-serif", display: "flex", alignItems: "center", gap: 5 }}>
            <Icon name="check" size={12} color={T.muted} />Parse into rows
          </button>
        </div>
      )}
    </div>
  );
}

function AISave(p) {
  var r = getTagR(p.recipe.tag || "other", p.dark);
  return (
    <div style={{ borderRadius: 12, border: "1px solid " + r.border + "55", background: r.bg, overflow: "hidden", marginBottom: 8 }}>
      <div style={{ height: 3, background: r.dot }} />
      <div style={{ padding: "10px 12px 11px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 5 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, fontFamily: "'Inter',sans-serif", color: r.text, marginBottom: 4 }}>{p.recipe.name}</div>
            <Chip tag={p.recipe.tag} dark={p.dark} />
          </div>
          <button onClick={function () { p.onSave(p.recipe); }} style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid " + r.border, background: "white", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "'Inter',sans-serif", color: r.text, flexShrink: 0, marginLeft: 10, display: "flex", alignItems: "center", gap: 5 }}>
            <Icon name="plus" size={12} color={r.text} />Save
          </button>
        </div>
        <div style={{ fontSize: 12, color: r.text, opacity: 0.75, lineHeight: 1.6, fontFamily: "'Inter',sans-serif" }}>
          {p.recipe.ingredients ? p.recipe.ingredients.map(function (i) { return i.name; }).join(", ") : ""}
        </div>
        {p.recipe.notes && <div style={{ fontSize: 11, color: r.text, opacity: 0.65, fontStyle: "italic", marginTop: 4, fontFamily: "'Inter',sans-serif" }}>{p.recipe.notes}</div>}
        <div style={{ fontSize: 11, color: r.text, opacity: 0.55, marginTop: 3, fontFamily: "'Inter',sans-serif" }}>Serves {p.recipe.serves || 4}</div>
      </div>
    </div>
  );
}

function RecipeForm(p) {
  var ns = useState(p.meal ? p.meal.name : ""), name = ns[0], setName = ns[1];
  var ts = useState(p.meal ? p.meal.tag : "meat"), tag = ts[0], setTag = ts[1];
  var ss = useState(p.meal ? p.meal.serves : 4), srv = ss[0], setSrv = ss[1];
  var is = useState(p.meal ? sanitiseIngs(p.meal.ingredients) : []), ings = is[0], setIngs = is[1];
  var nos = useState(p.meal ? p.meal.notes : ""), notes = nos[0], setNotes = nos[1];
  var ms = useState(p.meal ? p.meal.method || "" : ""), method = ms[0], setMethod = ms[1];
  var fs = useState(false), filling = fs[0], setFilling = fs[1];
  var gs = useState(false), genMethod = gs[0], setGenMethod = gs[1];
  var showMs = useState(!!(p.meal && p.meal.method)), showMethod = showMs[0], setShowMethod = showMs[1];
  var ref = useRef();
  useEffect(function () { if (ref.current) ref.current.focus(); }, []);

  var T = p.T, dark = p.dark;

  function save() {
    if (!name.trim()) return;
    var ingredients = ings.filter(function (i) { return i.name && i.name.trim(); }).map(function (i) {
      var n = i.name.trim(), q = parseFloat(i.qty);
      if (isNaN(q) || q <= 0) q = 1;
      var pk = Object.keys(PACK_SIZES).find(function (k) { return norm(n).indexOf(k) >= 0; });
      return { name: n, qty: q, unit: i.unit || "", category: guessCat(n), packKey: pk || undefined };
    });
    p.onSave({ name: name.trim(), tag: tag, serves: srv, notes: notes.trim(), method: method.trim(), ingredients: ingredients }, p.meal ? p.meal.id : undefined);
  }

  function autoFill() {
    if (!name.trim()) return;
    setFilling(true);
    var prompt = "Ingredients for " + name.trim() + " for " + srv + " people. Reply ONLY comma-separated: 500g chicken breast, 2 onions. Nothing else.";
    callAI([{ role: "user", content: prompt }], "You are a cooking assistant. Return only a comma-separated ingredient list.").then(function (txt) {
      var parsed = parseIngs(txt.trim());
      setIngs(parsed.map(function (x) { return { id: mkid(), name: x.name, qty: x.qty ? String(x.qty) : "", unit: x.unit || "" }; }));
      setFilling(false);
    }).catch(function () { setFilling(false); });
  }

  function generateMethod() {
    if (!name.trim()) return;
    setGenMethod(true);
    var ingList = ings.filter(function (i) { return i.name.trim(); }).map(function (i) { return (i.qty ? i.qty + " " : "") + (i.unit ? i.unit + " " : "") + i.name; }).join(", ");
    var prompt = "Write a simple step-by-step cooking method for " + name.trim() + " for " + srv + " people. Ingredients: " + ingList + ". Write 6-10 clear numbered steps. Each step one sentence. No intro or outro text, just the numbered steps.";
    callAI([{ role: "user", content: prompt }], "You are a helpful cooking assistant. Return only numbered cooking steps, nothing else.").then(function (txt) {
      setMethod(txt.trim());
      setShowMethod(true);
      setGenMethod(false);
    }).catch(function () { setGenMethod(false); });
  }

  var blueR = RAMP.blue[dark ? "dark" : "light"];
  var iS = { background: T.input, color: T.text, border: "0.5px solid " + T.border, borderRadius: 9, padding: "8px 10px", fontSize: 13, fontFamily: "'Inter',sans-serif", outline: "none" };

  return (
    <div style={{ background: T.card, border: "0.5px solid " + T.border, borderRadius: 16, padding: "1.1rem" }}>
      <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 17, color: T.text, marginBottom: 14 }}>{p.meal ? "Edit recipe" : "New recipe"}</div>
      <div style={{ marginBottom: 11 }}>
        <Lbl dark={dark}>Name</Lbl>
        <div style={{ display: "flex", gap: 6 }}>
          <input ref={ref} value={name} onChange={function (e) { setName(e.target.value); }} onKeyDown={function (e) { if (e.key === "Enter") save(); }} placeholder="e.g. Chicken curry" style={{ ...iS, flex: 1 }} />
          <button onClick={autoFill} disabled={filling || !name.trim()} style={{ padding: "0 12px", borderRadius: 9, border: "0.5px solid " + blueR.border, background: blueR.bg, cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "'Inter',sans-serif", color: blueR.text, display: "flex", alignItems: "center", gap: 5, opacity: (!name.trim() || filling) ? 0.45 : 1 }}>
            {filling ? <Spin size={13} color={blueR.dot} /> : <Icon name="ai" size={13} color={blueR.text} />}AI fill
          </button>
        </div>
      </div>
      <div style={{ marginBottom: 11 }}>
        <Lbl dark={dark}>Type</Lbl>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {Object.keys(TAG).map(function (k) {
            var v = TAG[k], r = getTagR(k, dark), active = tag === k;
            return <div key={k} onClick={function () { setTag(k); }} style={{ padding: "4px 11px 4px 8px", borderRadius: 20, fontSize: 12, cursor: "pointer", fontWeight: active ? 600 : 400, fontFamily: "'Inter',sans-serif", background: active ? r.bg : T.surface, color: active ? r.text : T.muted, border: active ? "1px solid " + r.border : "0.5px solid " + T.border, transition: "all 0.12s", display: "inline-flex", alignItems: "center", gap: 5 }}><Icon name={v.icon} size={12} color={active ? r.text : T.muted} />{v.label}</div>;
          })}
        </div>
      </div>
      <div style={{ marginBottom: 11 }}>
        <Lbl dark={dark}>Serves</Lbl>
        <div style={{ display: "flex", gap: 6 }}>
          {[1, 2, 3, 4, 5, 6].map(function (n) {
            var br = RAMP.blue[dark ? "dark" : "light"], active = srv === n;
            return <div key={n} onClick={function () { setSrv(n); }} style={{ width: 34, height: 34, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 13, fontWeight: active ? 600 : 400, fontFamily: "'Inter',sans-serif", background: active ? br.bg : T.surface, color: active ? br.text : T.muted, border: active ? "1.5px solid " + br.border : "0.5px solid " + T.border, transition: "all 0.12s" }}>{n}</div>;
          })}
        </div>
      </div>
      <div style={{ marginBottom: 11 }}>
        <IngEditor value={ings} onChange={setIngs} dark={dark} T={T} />
      </div>
      <div style={{ marginBottom: 14 }}>
        <Lbl dark={dark} hint="optional">Notes</Lbl>
        <input value={notes} onChange={function (e) { setNotes(e.target.value); }} placeholder="e.g. marinate overnight, double the sauce" style={{ ...iS, width: "100%", boxSizing: "border-box" }} />
      </div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: showMethod ? 7 : 0 }}>
          <Lbl dark={dark}>Cooking method</Lbl>
          <button onClick={generateMethod} disabled={genMethod || !name.trim()} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 7, border: "0.5px solid " + blueR.border, background: blueR.bg, cursor: "pointer", fontFamily: "'Inter',sans-serif", color: blueR.text, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, opacity: (!name.trim() || genMethod) ? 0.45 : 1, marginBottom: 5 }}>
            {genMethod ? <Spin size={11} color={blueR.dot} /> : <Icon name="ai" size={11} color={blueR.text} />}{method ? "Regenerate" : "Generate with AI"}
          </button>
        </div>
        {showMethod && (
          <textarea value={method} onChange={function (e) { setMethod(e.target.value); }} placeholder="Steps will appear here..." style={{ ...iS, width: "100%", boxSizing: "border-box", minHeight: 160, padding: "10px 11px", borderRadius: 10, resize: "vertical", lineHeight: 1.8, fontSize: 13 }} />
        )}
        {!showMethod && !method && (
          <div style={{ fontSize: 12, color: T.hint, fontStyle: "italic" }}>Generate a step-by-step method with AI, or skip — it's optional.</div>
        )}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={save} style={{ padding: "8px 18px", borderRadius: 9, border: "0.5px solid " + T.border, background: T.btn, fontSize: 13, cursor: "pointer", fontWeight: 600, fontFamily: "'Inter',sans-serif", color: T.text }}>Save recipe</button>
        <button onClick={p.onCancel} style={{ padding: "8px 12px", borderRadius: 9, border: "none", background: "none", fontSize: 13, cursor: "pointer", fontFamily: "'Inter',sans-serif", color: T.muted }}>Cancel</button>
      </div>
    </div>
  );
}

export default function App() {
  var A = useState(false), dark = A[0], setDark = A[1];
  var B = useState(true), ready = B[0], setReady = B[1];
  var C = useState([]), meals = C[0], setMeals = C[1];
  var D = useState([]), staples = D[0], setStaples = D[1];
  var E = useState([]), sel = E[0], setSel = E[1];
  var F = useState([]), actSta = F[0], setActSta = F[1];
  var G = useState({}), checked = G[0], setChecked = G[1];
  var H = useState([]), extras = H[0], setExtras = H[1];
  var I = useState(4), serves = I[0], setServes = I[1];
  var J = useState(0), tab = J[0], setTab = J[1];
  var K = useState(false), saving = K[0], setSaving = K[1];
  var L = useState(null), lastSync = L[0], setLastSync = L[1];
  var M = useState(false), clearDlg = M[0], setClearDlg = M[1];
  var N = useState(false), resetDlg = N[0], setResetDlg = N[1];
  var O = useState(false), copied = O[0], setCopied = O[1];
  var P = useState(false), showForm = P[0], setShowForm = P[1];
  var Q = useState(null), editMeal = Q[0], setEditMeal = Q[1];
  var R = useState(null), preview = R[0], setPreview = R[1];
  var S = useState(null), expanded = S[0], setExpanded = S[1];
  var U = useState(false), showSta = U[0], setShowSta = U[1];
  var V = useState(""), newSName = V[0], setNewSName = V[1];
  var W = useState("Other"), newSCat = W[0], setNewSCat = W[1];
  var X = useState(""), quickAdd = X[0], setQuickAdd = X[1];
  var Y = useState("fridge"), aiMode = Y[0], setAiMode = Y[1];
  var Z = useState(null), fridgeImg = Z[0], setFridgeImg = Z[1];
  var AA = useState(null), fridgeData = AA[0], setFridgeData = AA[1];
  var BB = useState([]), fridgeRes = BB[0], setFridgeRes = BB[1];
  var CC = useState(false), fridgeLoad = CC[0], setFridgeLoad = CC[1];
  var DD = useState(""), searchQ = DD[0], setSearchQ = DD[1];
  var EE = useState([]), searchRes = EE[0], setSearchRes = EE[1];
  var FF = useState(false), searchLoad = FF[0], setSearchLoad = FF[1];
  var GG = useState([]), suggestRes = GG[0], setSuggestRes = GG[1];
  var HH = useState(false), suggestLoad = HH[0], setSuggestLoad = HH[1];
  var II = useState({}), savedIds = II[0], setSavedIds = II[1];

  var fileRef = useRef(), stateRef = useRef({});
  var T = THEMES[dark ? "dark" : "light"];

  useEffect(function () {
    stateRef.current = { meals, staples, sel, actSta, checked, extras, serves, dark };
  }, [meals, staples, sel, actSta, checked, extras, serves, dark]);

  var persist = useCallback(function (patch) {
    setSaving(true);
    var data = Object.assign({}, stateRef.current, patch || {});
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setLastSync(new Date());
    } catch (e) {}
    setSaving(false);
  }, []);

  useEffect(function () {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var d = JSON.parse(raw);
        if (d.meals) setMeals(d.meals);
        if (d.staples) setStaples(d.staples);
        if (d.sel) setSel(d.sel);
        if (d.actSta) setActSta(d.actSta);
        if (d.checked) setChecked(d.checked);
        if (d.extras) setExtras(d.extras);
        if (d.serves) setServes(d.serves);
        if (d.dark !== undefined) setDark(d.dark);
        setLastSync(new Date());
      }
    } catch (e) {}
    setReady(true);
  }, []);

  function toggleDark() { var n = !dark; setDark(n); persist({ dark: n }); }
  function bumpServes() { var n = serves >= 6 ? 1 : serves + 1; setServes(n); persist({ serves: n }); }
  function toggleMeal(id) { var n = sel.indexOf(id) >= 0 ? sel.filter(function (x) { return x !== id; }) : sel.concat([id]); setSel(n); persist({ sel: n }); }
  function toggleSta(id) { var n = actSta.indexOf(id) >= 0 ? actSta.filter(function (x) { return x !== id; }) : actSta.concat([id]); setActSta(n); persist({ actSta: n }); }
  function toggleCheck(key) { var n = Object.assign({}, checked); n[key] = !n[key]; setChecked(n); persist({ checked: n }); }
  function clearWeek() { setSel([]); setChecked({}); setExtras([]); setClearDlg(false); persist({ sel: [], checked: {}, extras: [] }); }
  function resetTicks() { setChecked({}); setResetDlg(false); persist({ checked: {} }); }

  var saveMeal = useCallback(function (data, editingId) {
    setMeals(function (prev) {
      var next = editingId ? prev.map(function (m) { return m.id === editingId ? Object.assign({ id: m.id }, data) : m; }) : prev.concat([Object.assign({ id: mkid() }, data)]);
      persist({ meals: next }); return next;
    });
    setShowForm(false); setEditMeal(null);
  }, [persist]);

  var deleteMeal = useCallback(function (id) {
    setMeals(function (prev) { var n = prev.filter(function (m) { return m.id !== id; }); persist({ meals: n }); return n; });
    setSel(function (prev) { var n = prev.filter(function (x) { return x !== id; }); persist({ sel: n }); return n; });
  }, [persist]);

  function saveSta() {
    if (!newSName.trim()) return;
    var item = { id: mkid(), name: newSName.trim(), category: newSCat };
    var ns = staples.concat([item]), na = actSta.concat([item.id]);
    setStaples(ns); setActSta(na); setNewSName(""); setNewSCat("Other"); setShowSta(false); persist({ staples: ns, actSta: na });
  }
  function deleteSta(id) {
    var ns = staples.filter(function (s) { return s.id !== id; }), na = actSta.filter(function (x) { return x !== id; });
    setStaples(ns); setActSta(na); persist({ staples: ns, actSta: na });
  }
  function doQuickAdd() {
    if (!quickAdd.trim()) return;
    var item = { id: mkid(), name: quickAdd.trim(), category: guessCat(quickAdd) };
    var next = extras.concat([item]); setExtras(next); setQuickAdd(""); persist({ extras: next });
  }
  function saveAIRecipe(recipe) {
    var nm = { id: "ai-" + mkid(), name: recipe.name, tag: recipe.tag || "other", serves: recipe.serves || 4, notes: recipe.notes || "", ingredients: sanitiseIngs(recipe.ingredients) };
    var next = meals.concat([nm]); setMeals(next); persist({ meals: next });
    setSavedIds(function (prev) { var n = Object.assign({}, prev); n[recipe.name] = true; return n; });
  }
  function handleFridgePhoto(e) {
    var file = e.target.files[0]; if (!file) return;
    setFridgeImg(URL.createObjectURL(file)); setFridgeRes([]);
    var reader = new FileReader();
    reader.onload = function (ev) { setFridgeData(ev.target.result.split(",")[1]); };
    reader.readAsDataURL(file);
  }
  function scanFridge() {
    if (!fridgeData) return; setFridgeLoad(true); setFridgeRes([]);
    var sys = "You are a chef. Suggest 3 recipes from the fridge photo. Return ONLY valid JSON array, each: name, tag (pasta/meat/veggie/quick/fish/other), serves (number), notes (short tip), ingredients (array of {name,qty,unit,category}). No markdown.";
    fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: AI_MODEL, max_tokens: 1000, system: sys, messages: [{ role: "user", content: [{ type: "image", source: { type: "base64", media_type: "image/jpeg", data: fridgeData } }, { type: "text", text: "Suggest 3 recipes. Return only valid JSON." }] }] }) }).then(function (r) { return r.json(); }).then(function (d) {
      var b = d.content && d.content.find(function (x) { return x.type === "text"; });
      setFridgeRes(parseAIRecipes(b ? b.text : "")); setFridgeLoad(false);
    }).catch(function () { setFridgeLoad(false); });
  }
  function doSearch() {
    if (!searchQ.trim()) return; setSearchLoad(true); setSearchRes([]);
    var existing = meals.map(function (m) { return m.name; }).join(", ") || "none";
    var prompt = "Recipes matching: " + JSON.stringify(searchQ) + ". My existing: " + existing + ". Suggest 4. Return ONLY valid JSON array, each: name, tag (pasta/meat/veggie/quick/fish/other), serves (number), notes (short tip), ingredients (array of {name,qty,unit,category}). No markdown.";
    callAI([{ role: "user", content: prompt }], "You are a helpful cooking assistant. Return only valid JSON.").then(function (txt) { setSearchRes(parseAIRecipes(txt)); setSearchLoad(false); }).catch(function () { setSearchLoad(false); });
  }
  function doSuggest() {
    setSuggestLoad(true); setSuggestRes([]);
    var myMeals = meals.length ? meals.map(function (m) { return m.name + " (" + m.tag + ")"; }).join(", ") : "none";
    var prompt = "Based on my library: " + myMeals + ", suggest 4 NEW recipes. Vary types. Return ONLY valid JSON array, each: name, tag (pasta/meat/veggie/quick/fish/other), serves (4), notes (short tip), ingredients (array of {name,qty,unit,category}). No markdown.";
    callAI([{ role: "user", content: prompt }], "You are a helpful cooking assistant. Return only valid JSON.").then(function (txt) { setSuggestRes(parseAIRecipes(txt)); setSuggestLoad(false); }).catch(function () { setSuggestLoad(false); });
  }
  function copyList() {
    var lines = ["Shopping list - " + serves + " people\n"];
    sortedCats.forEach(function (c) { lines.push("\n" + c); grouped[c].forEach(function (i) { var q = fmtQty(i.displayQty, i.displayUnit); var qs = q ? (q + (i.displayUnit ? " " + i.displayUnit : "")) : ""; lines.push("  - " + i.name + (qs ? " (" + qs + ")" : "")); }); });
    navigator.clipboard.writeText(lines.join("\n")).then(function () { setCopied(true); setTimeout(function () { setCopied(false); }, 2500); });
  }

  var list = buildList(meals, sel, staples, actSta, serves, extras);
  var grouped = groupBy(list);
  var sortedCats = CATS.filter(function (c) { return !!grouped[c]; });
  var total = list.length, ticked = Object.values(checked).filter(Boolean).length;
  var pct = total > 0 ? Math.round((ticked / total) * 100) : 0, allDone = total > 0 && ticked === total;
  var tagCounts = sel.reduce(function (a, id) { var m = meals.find(function (x) { return x.id === id; }); if (m && m.tag) a[m.tag] = (a[m.tag] || 0) + 1; return a; }, {});

  var css = "@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Inter:wght@400;500;600&display=swap'); @keyframes spin{to{transform:rotate(360deg)}}";
  var iS = { background: T.input, color: T.text, border: "0.5px solid " + T.border, borderRadius: 9, padding: "8px 10px", fontSize: 13, fontFamily: "'Inter',sans-serif", outline: "none" };
  var smB = { fontSize: 12, padding: "5px 11px", borderRadius: 8, border: "0.5px solid " + T.border, background: T.surface, cursor: "pointer", fontFamily: "'Inter',sans-serif", color: T.muted, fontWeight: 500, display: "flex", alignItems: "center", gap: 5 };
  var purR = RAMP.purple[dark ? "dark" : "light"], tealR = RAMP.teal[dark ? "dark" : "light"], blueR = RAMP.blue[dark ? "dark" : "light"], greenR = RAMP.green[dark ? "dark" : "light"];

  if (!ready) return (
    <div style={{ fontFamily: "'Inter',sans-serif", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", height: 260, flexDirection: "column", gap: 12 }}>
      <style>{css}</style>
      <Spin size={26} /><span style={{ fontSize: 13, color: T.muted }}>Loading your planner...</span>
    </div>
  );

  if (meals.length === 0 && staples.length === 0) return (
    <div style={{ fontFamily: "'Inter',sans-serif", background: T.bg, maxWidth: 500, margin: "0 auto", padding: "2.5rem 1.25rem 5rem" }}>
      <style>{css}</style>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1.5rem" }}>
        <button onClick={toggleDark} style={smB}><Icon name={dark ? "sun" : "moon"} size={14} color={T.muted} />{dark ? "Light mode" : "Dark mode"}</button>
      </div>
      <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 32, color: T.text, lineHeight: 1.15, marginBottom: 8 }}>Your weekly<br />shop, sorted.</div>
      <div style={{ fontSize: 14, color: T.muted, lineHeight: 1.7, marginBottom: "2rem" }}>Build your recipe library once. Tap what you're cooking each week. Your shopping list writes itself.</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: "2rem" }}>
        {[{ icon: "recipes", title: "Recipe library", desc: "Add meals once, reuse every week." }, { icon: "list", title: "One-tap planning", desc: "Pick this week's meals in seconds." }, { icon: "ai", title: "AI-powered", desc: "Scan your fridge, find recipes instantly." }, { icon: "family", title: "Shared list", desc: "Both partners see the same live list." }].map(function (it) {
          return <div key={it.title} style={{ borderRadius: 14, padding: "13px 14px", border: "0.5px solid " + T.border, background: T.card }}><div style={{ marginBottom: 8 }}><Icon name={it.icon} size={24} color={T.muted} /></div><div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 2 }}>{it.title}</div><div style={{ fontSize: 12, color: T.muted, lineHeight: 1.5 }}>{it.desc}</div></div>;
        })}
      </div>
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: T.hint, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Cooking for how many?</div>
        <div style={{ display: "flex", gap: 7 }}>
          {[1, 2, 3, 4, 5, 6].map(function (n) { var active = serves === n; return <div key={n} onClick={function () { setServes(n); persist({ serves: n }); }} style={{ width: 38, height: 38, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 14, fontWeight: active ? 600 : 400, background: active ? blueR.bg : T.surface, color: active ? blueR.text : T.muted, border: active ? "1.5px solid " + blueR.border : "0.5px solid " + T.border, transition: "all 0.12s" }}>{n}</div>; })}
        </div>
      </div>
      {showForm ? <RecipeForm key="new" meal={null} onSave={saveMeal} onCancel={function () { setShowForm(false); }} dark={dark} T={T} /> : <button onClick={function () { setShowForm(true); }} style={{ padding: "11px 24px", borderRadius: 12, border: "0.5px solid " + T.border, background: T.card, fontSize: 14, cursor: "pointer", fontWeight: 600, color: T.text }}>Add your first recipe</button>}
    </div>
  );

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", background: T.bg, minHeight: "100vh" }}>
      <style>{css}</style>
      <div style={{ background: T.navBg, borderBottom: "0.5px solid " + T.navBorder, padding: "0.7rem 1rem 0.6rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 21, color: T.text }}>Weekly shop</div>
        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
          <button onClick={bumpServes} style={smB}><Icon name="person" size={13} color={T.muted} />{serves}p</button>
          {total > 0 && <button onClick={copyList} style={smB}>{copied ? <Icon name="check" size={13} color={T.muted} /> : <Icon name="share" size={13} color={T.muted} />}{copied ? "Copied!" : "Share"}</button>}
          <button onClick={toggleDark} style={{ ...smB, padding: "5px 8px" }}><Icon name={dark ? "sun" : "moon"} size={15} color={T.muted} /></button>
        </div>
      </div>

      {total > 0 && (
        <div style={{ padding: "0.5rem 1rem 0.45rem", background: T.navBg, borderBottom: "0.5px solid " + T.navBorder }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
            <div style={{ fontSize: 11, color: T.hint, display: "flex", alignItems: "center", gap: 5 }}>
              {saving ? <><Spin size={5} color="#EF9F27" />Syncing...</> : <><span style={{ width: 5, height: 5, borderRadius: "50%", background: T.syncDot, display: "inline-block" }} />{lastSync ? "Saved " + lastSync.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Ready"}</>}
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: pct === 100 ? greenR.dot : T.hint }}>{ticked}/{total} · {pct}%</span>
          </div>
          <div style={{ height: 5, background: T.progressBg, borderRadius: 3 }}>
            <div style={{ height: 5, borderRadius: 3, width: pct + "%", background: pct === 100 ? greenR.dot : blueR.dot, transition: "width 0.4s ease" }} />
          </div>
        </div>
      )}
      {!total && (
        <div style={{ padding: "0.4rem 1rem", background: T.navBg, borderBottom: "0.5px solid " + T.navBorder, fontSize: 11, color: T.hint, display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: T.syncDot, display: "inline-block" }} />Ready
        </div>
      )}

      {clearDlg && (
        <div style={{ margin: "6px 1rem 0", background: T.warnBg, border: "0.5px solid " + T.warnBorder, borderRadius: 12, padding: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Icon name="warn" size={16} color={T.warnText} /><span style={{ fontSize: 14, fontWeight: 600, color: T.warnText }}>Start a new week?</span>
          </div>
          <div style={{ fontSize: 12, color: T.warnText, opacity: 0.8, marginBottom: 12, lineHeight: 1.5 }}>This clears your selected meals and shopping ticks. Your recipes and staples are kept.</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={clearWeek} style={{ flex: 1, padding: "8px", borderRadius: 8, border: "none", background: T.warnText, cursor: "pointer", color: "white", fontWeight: 600, fontSize: 13, fontFamily: "'Inter',sans-serif" }}>Yes, start new week</button>
            <button onClick={function () { setClearDlg(false); }} style={{ padding: "8px 16px", borderRadius: 8, border: "0.5px solid " + T.warnBorder, background: "none", cursor: "pointer", color: T.warnText, fontSize: 13, fontFamily: "'Inter',sans-serif" }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", background: T.navBg, borderBottom: "0.5px solid " + T.navBorder, padding: "0 0.5rem" }}>
        {NAV.map(function (t, i) {
          var active = tab === i, badge = i === 1 && total > 0 && !allDone, isAI = i === 4, ac = isAI ? purR.dot : T.text;
          return (
            <button key={i} onClick={function () { setTab(i); }} style={{ flex: 1, padding: "9px 0 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "none", border: "none", borderBottom: active ? "2px solid " + ac : "2px solid transparent", marginBottom: -1, cursor: "pointer", position: "relative" }}>
              {badge && <span style={{ position: "absolute", top: 7, right: "calc(50% - 16px)", width: 6, height: 6, borderRadius: "50%", background: blueR.dot, border: "1.5px solid " + T.navBg }} />}
              <Icon name={t.icon} size={18} color={active ? ac : T.hint} />
              <span style={{ fontSize: 10, fontWeight: active ? 600 : 400, color: active ? ac : T.hint }}>{t.label}</span>
            </button>
          );
        })}
      </div>

      <div style={{ padding: "0.9rem 1rem 5rem", background: T.bg }}>

        {tab === 0 && (
          <div>
            {sel.length > 0 && (
              <div style={{ marginBottom: "1rem", borderRadius: 14, border: "0.5px solid " + T.border, overflow: "hidden", background: T.card }}>
                <div style={{ padding: "9px 13px", background: T.surface, display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "0.5px solid " + T.border }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: T.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>This week — {sel.length} meal{sel.length !== 1 ? "s" : ""} · {total} items</span>
                  <div style={{ display: "flex", gap: 4 }}>
                    {Object.keys(tagCounts).map(function (tg) { var info = TAG[tg]; if (!info) return null; var r = getTagR(tg, dark); return <span key={tg} style={{ fontSize: 10, padding: "2px 8px 2px 6px", borderRadius: 20, background: r.bg, color: r.text, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}><Icon name={info.icon} size={10} color={r.text} />{tagCounts[tg]}</span>; })}
                  </div>
                </div>
                {sel.map(function (id) {
                  var m = meals.find(function (x) { return x.id === id; }); if (!m) return null;
                  return (
                    <div key={id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 13px", borderBottom: "0.5px solid " + T.border }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                        <Chip tag={m.tag} dark={dark} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, color: T.text, fontWeight: 500 }}>{m.name}</div>
                          {m.notes && <div style={{ fontSize: 11, color: T.hint, fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.notes}</div>}
                        </div>
                      </div>
                      <button onClick={function () { toggleMeal(id); }} style={{ background: "none", border: "none", cursor: "pointer", padding: "0 0 0 10px", flexShrink: 0 }}><Icon name="close" size={16} color={T.hint} /></button>
                    </div>
                  );
                })}
                <div style={{ padding: "8px 13px", background: T.surface, borderTop: "0.5px solid " + T.border, display: "flex", justifyContent: "flex-end" }}>
                  <button onClick={function () { setClearDlg(true); }} style={{ fontSize: 12, color: T.hint, background: "none", border: "0.5px solid " + T.border, borderRadius: 7, padding: "4px 12px", cursor: "pointer", fontFamily: "'Inter',sans-serif", display: "flex", alignItems: "center", gap: 5 }}>
                    <Icon name="close" size={12} color={T.hint} />Start new week
                  </button>
                </div>
              </div>
            )}
            <div style={{ fontSize: 10, fontWeight: 600, color: T.hint, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>{sel.length === 0 ? "Tap a meal to add it this week" : "Add more meals"}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(148px,1fr))", gap: 8 }}>
              {meals.map(function (meal) {
                var isSel = sel.indexOf(meal.id) >= 0, isPrev = preview && preview.id === meal.id;
                var r = meal.tag ? getTagR(meal.tag, dark) : RAMP.gray[dark ? "dark" : "light"];
                return (
                  <div key={meal.id} style={{ borderRadius: 13, border: "0.5px solid " + (isSel ? r.border : T.border), background: isSel ? r.bg : T.card, transition: "all 0.15s", position: "relative", overflow: "hidden" }}>
                    <div style={{ height: 3, background: r.dot }} />
                    <div style={{ padding: "9px 10px 10px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                        <div onClick={function () { toggleMeal(meal.id); }} style={{ fontSize: 13, fontWeight: 500, color: isSel ? r.text : T.text, paddingRight: 4, lineHeight: 1.3, flex: 1, cursor: "pointer" }}>{meal.name}</div>
                        <button onClick={function () { setPreview(isPrev ? null : meal); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}><Icon name="info" size={14} color={isPrev ? r.dot : T.hint} /></button>
                      </div>
                      <div onClick={function () { toggleMeal(meal.id); }} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                        <Chip tag={meal.tag} dark={dark} />
                        {isSel && <span style={{ fontSize: 10, color: r.text, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 3 }}><Icon name="check" size={10} color={r.dot} />added</span>}
                      </div>
                      {isPrev && (
                        <div style={{ marginTop: 9, paddingTop: 9, borderTop: "0.5px solid " + T.border }}>
                          <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.7 }}>{meal.ingredients.map(function (i) { var p = []; if (i.qty && i.qty !== 1) p.push(i.qty); if (i.unit) p.push(i.unit); p.push(i.name); return p.join(" "); }).join(", ")}</div>
                          {meal.notes && <div style={{ fontSize: 11, color: T.hint, fontStyle: "italic", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}><Icon name="note" size={11} color={T.hint} />{meal.notes}</div>}
                          {meal.method && (
                            <div style={{ marginTop: 8, paddingTop: 8, borderTop: "0.5px solid " + T.border }}>
                              <div style={{ fontSize: 10, fontWeight: 600, color: T.hint, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>Method</div>
                              <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.8, whiteSpace: "pre-line" }}>{meal.method}</div>
                            </div>
                          )}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 7 }}>
                            <span style={{ fontSize: 11, color: T.hint }}>Serves {meal.serves || 4}</span>
                            <button onClick={function () { setEditMeal(meal); setShowForm(true); setTab(2); }} style={{ fontSize: 11, color: blueR.text, background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "'Inter',sans-serif", display: "flex", alignItems: "center", gap: 3 }}><Icon name="edit" size={11} color={blueR.text} />Edit</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div onClick={function () { setEditMeal(null); setTab(2); setTimeout(function () { setShowForm(true); }, 40); }} style={{ borderRadius: 13, border: "0.5px dashed " + T.border, background: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 82, gap: 5 }}>
                <Icon name="plus" size={20} color={T.hint} /><span style={{ fontSize: 11, color: T.hint }}>Add recipe</span>
              </div>
            </div>
            {sel.length > 0 && <button onClick={function () { setTab(1); }} style={{ marginTop: "1rem", width: "100%", padding: "11px", borderRadius: 11, border: "0.5px solid " + T.border, background: T.card, fontSize: 13, cursor: "pointer", fontWeight: 600, color: T.text, display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}><Icon name="list" size={15} color={T.text} />View shopping list ({total} items)</button>}
          </div>
        )}

        {tab === 1 && (
          <div>
            {total === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}><Icon name="basket" size={48} color={T.border} /></div>
                <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 22, color: T.text, marginBottom: 6 }}>Nothing here yet</div>
                <div style={{ fontSize: 13, color: T.muted, marginBottom: 16 }}>Select some meals on the Plan tab to build your list</div>
                <button onClick={function () { setTab(0); }} style={{ padding: "8px 18px", borderRadius: 9, border: "0.5px solid " + T.border, background: T.card, fontSize: 13, cursor: "pointer", fontWeight: 600, color: T.text }}>Plan meals</button>
              </div>
            ) : allDone ? (
              <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}><Icon name="check" size={52} color={greenR.dot} /></div>
                <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 24, color: T.text, marginBottom: 4 }}>All done!</div>
                <div style={{ fontSize: 13, color: T.muted, marginBottom: 18 }}>Enjoy the week!</div>
                <button onClick={function () { setResetDlg(true); }} style={{ padding: "7px 16px", borderRadius: 9, border: "0.5px solid " + T.border, background: "none", fontSize: 12, cursor: "pointer", color: T.muted }}>Reset ticks</button>
              </div>
            ) : (
              <div>
                {sel.map(function (id) {
                  var m = meals.find(function (x) { return x.id === id; }); if (!m || !m.notes) return null;
                  return <div key={id} style={{ fontSize: 12, color: T.muted, padding: "6px 11px", background: T.surface, borderRadius: 8, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}><Icon name="note" size={12} color={T.hint} /><strong style={{ fontWeight: 600, fontStyle: "normal" }}>{m.name}:</strong><span style={{ fontStyle: "italic" }}>{m.notes}</span></div>;
                })}
                {sortedCats.map(function (cat) {
                  var r = getRamp(cat, dark), meta = CAT_META[cat], items = grouped[cat];
                  var catTicked = items.filter(function (i) { return !!checked[i.name + "-" + i.category]; }).length;
                  var catDone = catTicked === items.length, hr = catDone ? greenR : r;
                  return (
                    <div key={cat} style={{ marginBottom: "0.75rem" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 12px", borderRadius: "11px 11px 0 0", background: hr.bg, border: "0.5px solid " + hr.border + "44" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <Icon name={catDone ? "check" : meta.icon} size={15} color={hr.text} />
                          <span style={{ fontSize: 11, fontWeight: 600, color: hr.text, textTransform: "uppercase", letterSpacing: "0.06em" }}>{cat}</span>
                        </div>
                        <span style={{ fontSize: 11, color: hr.text, opacity: 0.7 }}>{catTicked}/{items.length}</span>
                      </div>
                      <div style={{ background: T.card, border: "0.5px solid " + hr.border + "33", borderTop: "none", borderRadius: "0 0 11px 11px", overflow: "hidden" }}>
                        {items.map(function (item, i) {
                          var key = item.name + "-" + item.category, isChk = !!checked[key];
                          var qStr = fmtQty(item.displayQty, item.displayUnit);
                          var showQ = !item.isStaple && !item.isExtra && qStr !== "";
                          return (
                            <div key={i} onClick={function () { toggleCheck(key); }} style={{ display: "flex", alignItems: "center", gap: 11, padding: "12px 13px", borderBottom: i < items.length - 1 ? "0.5px solid " + T.border : "none", cursor: "pointer", opacity: isChk ? 0.32 : 1, transition: "opacity 0.18s" }}>
                              <Tick checked={isChk} dot={r.dot} size={21} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 14, fontWeight: isChk ? 400 : 500, color: T.text, textDecoration: isChk ? "line-through" : "none", lineHeight: 1.3 }}>{item.name}</div>
                                {!item.isStaple && !item.isExtra && item.sources.length > 1 && <div style={{ fontSize: 11, color: T.hint, marginTop: 1 }}>{item.sources.join(" · ")}</div>}
                                {item.isStaple && <div style={{ fontSize: 10, color: r.dot, marginTop: 1, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>staple</div>}
                                {item.isExtra && (
                                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 1 }}>
                                    <span style={{ fontSize: 10, color: r.dot, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>added</span>
                                    <button onClick={function (e) { e.stopPropagation(); var n = extras.filter(function (x) { return x.id !== item.id; }); setExtras(n); persist({ extras: n }); }} style={{ fontSize: 11, color: T.hint, background: "none", border: "none", cursor: "pointer", padding: 0 }}>remove</button>
                                  </div>
                                )}
                                {item.detail && <div style={{ fontSize: 10, color: T.hint, marginTop: 1 }}>{item.detail}</div>}
                              </div>
                              {showQ && (
                                <div style={{ textAlign: "right", flexShrink: 0 }}>
                                  <div style={{ fontSize: 13, fontWeight: 600, color: r.text, whiteSpace: "nowrap" }}>{qStr}{item.displayUnit ? " " + item.displayUnit : ""}</div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                <div style={{ marginTop: "0.75rem", borderRadius: 11, padding: "11px 13px", border: "0.5px solid " + T.border, background: T.surface }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: T.hint, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Quick add</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <input value={quickAdd} onChange={function (e) { setQuickAdd(e.target.value); }} onKeyDown={function (e) { if (e.key === "Enter") doQuickAdd(); }} placeholder="e.g. orange juice — category auto-detected" style={{ ...iS, flex: 1 }} />
                    <button onClick={doQuickAdd} style={{ padding: "0 16px", borderRadius: 9, border: "0.5px solid " + T.border, background: T.btn, cursor: "pointer", fontSize: 13, fontWeight: 600, color: T.text, whiteSpace: "nowrap" }}>Add</button>
                  </div>
                </div>
                {resetDlg ? (
                  <div style={{ marginTop: 8, borderRadius: 10, padding: "10px 13px", background: T.warnBg, border: "0.5px solid " + T.warnBorder, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: T.warnText }}>Reset all ticks?</span>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={resetTicks} style={{ fontSize: 12, padding: "4px 12px", borderRadius: 7, border: "0.5px solid " + T.warnBorder, background: "none", cursor: "pointer", color: T.warnText, fontWeight: 600 }}>Reset</button>
                      <button onClick={function () { setResetDlg(false); }} style={{ fontSize: 12, padding: "4px 8px", border: "none", background: "none", cursor: "pointer", color: T.muted }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={function () { setResetDlg(true); }} style={{ width: "100%", marginTop: 8, padding: "7px", borderRadius: 8, border: "0.5px solid " + T.border, background: "none", fontSize: 12, cursor: "pointer", color: T.hint }}>Reset all ticks</button>
                )}
              </div>
            )}
          </div>
        )}

        {tab === 2 && (
          <div>
            {showForm ? (
              <RecipeForm key={editMeal ? editMeal.id : "new"} meal={editMeal} onSave={saveMeal} onCancel={function () { setShowForm(false); setEditMeal(null); }} dark={dark} T={T} />
            ) : (
              <div>
                <button onClick={function () { setEditMeal(null); setShowForm(true); }} style={{ marginBottom: "0.9rem", padding: "7px 14px", borderRadius: 9, border: "0.5px solid " + T.border, background: T.card, fontSize: 13, cursor: "pointer", fontWeight: 600, color: T.text, display: "flex", alignItems: "center", gap: 6 }}>
                  <Icon name="plus" size={14} color={T.text} />Add recipe
                </button>
                {meals.length === 0 && <p style={{ fontSize: 13, color: T.muted }}>No recipes yet. Add your first one above.</p>}
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {meals.map(function (meal) {
                    var r = meal.tag ? getTagR(meal.tag, dark) : RAMP.gray[dark ? "dark" : "light"], isExp = expanded === meal.id;
                    return (
                      <div key={meal.id} style={{ borderRadius: 12, border: "0.5px solid " + T.border, background: T.card, overflow: "hidden" }}>
                        <div style={{ height: 3, background: r.dot }} />
                        <div style={{ padding: "9px 12px 10px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 7, flex: 1, minWidth: 0 }}>
                              <span style={{ fontSize: 14, fontWeight: 500, color: T.text }}>{meal.name}</span>
                              <Chip tag={meal.tag} dark={dark} />
                            </div>
                            <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                              <button onClick={function () { setExpanded(isExp ? null : meal.id); }} style={{ background: "none", border: "none", cursor: "pointer", padding: "3px 6px", display: "flex", alignItems: "center" }}><Icon name="info" size={14} color={isExp ? r.dot : T.muted} /></button>
                              <button onClick={function () { setEditMeal(meal); setShowForm(true); }} style={{ background: "none", border: "none", cursor: "pointer", padding: "3px 6px", display: "flex", alignItems: "center" }}><Icon name="edit" size={14} color={T.muted} /></button>
                              <button onClick={function () { deleteMeal(meal.id); }} style={{ background: "none", border: "none", cursor: "pointer", padding: "3px 6px", display: "flex", alignItems: "center" }}><Icon name="trash" size={14} color="#E24B4A" /></button>
                            </div>
                          </div>
                          <div onClick={function () { setExpanded(isExp ? null : meal.id); }} style={{ cursor: "pointer" }}>
                            {isExp ? (
                              <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.8, marginTop: 4 }}>
                                {meal.ingredients.map(function (i) { var p = []; if (i.qty && i.qty !== 1) p.push(i.qty); if (i.unit) p.push(i.unit); p.push(i.name); return p.join(" "); }).join(", ")}
                              </div>
                            ) : (
                              <div style={{ fontSize: 12, color: T.hint }}>{meal.ingredients.length} ingredient{meal.ingredients.length !== 1 ? "s" : ""} · Serves {meal.serves || 4}</div>
                            )}
                          </div>
                          {isExp && meal.notes && <div style={{ fontSize: 11, color: T.hint, fontStyle: "italic", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}><Icon name="note" size={11} color={T.hint} />{meal.notes}</div>}
                          {isExp && meal.method && (
                            <div style={{ marginTop: 10, paddingTop: 10, borderTop: "0.5px solid " + T.border }}>
                              <div style={{ fontSize: 10, fontWeight: 600, color: T.hint, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Method</div>
                              <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.9, whiteSpace: "pre-line" }}>{meal.method}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 3 && (
          <div>
            <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.6, marginBottom: "0.9rem", padding: "10px 13px", background: T.surface, borderRadius: 11, border: "0.5px solid " + T.border }}>
              Staples are things you buy <strong>every week</strong> regardless of meals — milk, bread, eggs, etc. Tick the ones you need this week.
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}>
              <span style={{ fontSize: 13, color: T.muted }}>{actSta.length} of {staples.length} active this week</span>
              <div style={{ display: "flex", gap: 5 }}>
                <button onClick={function () { var n = staples.map(function (s) { return s.id; }); setActSta(n); persist({ actSta: n }); }} style={smB}>All</button>
                <button onClick={function () { setActSta([]); persist({ actSta: [] }); }} style={smB}>None</button>
              </div>
            </div>
            {staples.length > 0 && (
              <div style={{ borderRadius: 12, border: "0.5px solid " + T.border, overflow: "hidden", marginBottom: "0.9rem", background: T.card }}>
                {staples.map(function (s, i) {
                  var active = actSta.indexOf(s.id) >= 0, r = getRamp(s.category, dark);
                  return (
                    <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 13px", borderBottom: i < staples.length - 1 ? "0.5px solid " + T.border : "none" }}>
                      <div onClick={function () { toggleSta(s.id); }} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                        <Tick checked={active} dot={r.dot} size={21} />
                        <span style={{ fontSize: 13, color: T.text, flex: 1 }}>{s.name}</span>
                        <span style={{ fontSize: 11, padding: "2px 8px 2px 6px", borderRadius: 9, background: r.bg, color: r.text, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <Icon name={(CAT_META[s.category] && CAT_META[s.category].icon) || "basket"} size={11} color={r.text} />{s.category}
                        </span>
                      </div>
                      <button onClick={function () { deleteSta(s.id); }} style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 4px" }}><Icon name="close" size={15} color={T.hint} /></button>
                    </div>
                  );
                })}
              </div>
            )}
            {showSta ? (
              <div style={{ borderRadius: 12, border: "0.5px solid " + T.border, padding: "0.9rem", background: T.card }}>
                <div style={{ marginBottom: 10 }}>
                  <Lbl dark={dark}>Item name</Lbl>
                  <input value={newSName} onChange={function (e) { setNewSName(e.target.value); }} onKeyDown={function (e) { if (e.key === "Enter") saveSta(); }} placeholder="e.g. Orange juice" style={{ ...iS, width: "100%", boxSizing: "border-box" }} autoFocus />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <Lbl dark={dark}>Category</Lbl>
                  <select value={newSCat} onChange={function (e) { setNewSCat(e.target.value); }} style={{ ...iS, width: "100%", boxSizing: "border-box", cursor: "pointer" }}>
                    {CATS.map(function (c) { return <option key={c}>{c}</option>; })}
                  </select>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={saveSta} style={{ padding: "7px 16px", borderRadius: 8, border: "0.5px solid " + T.border, background: T.btn, fontSize: 13, cursor: "pointer", fontWeight: 600, color: T.text }}>Add</button>
                  <button onClick={function () { setShowSta(false); }} style={{ padding: "7px 12px", borderRadius: 8, border: "none", background: "none", fontSize: 13, cursor: "pointer", color: T.muted }}>Cancel</button>
                </div>
              </div>
            ) : (
              <button onClick={function () { setShowSta(true); }} style={{ padding: "7px 14px", borderRadius: 9, border: "0.5px solid " + T.border, background: T.card, fontSize: 13, cursor: "pointer", fontWeight: 600, color: T.text, display: "flex", alignItems: "center", gap: 6 }}>
                <Icon name="plus" size={14} color={T.text} />Add staple
              </button>
            )}
          </div>
        )}

        {tab === 4 && (
          <div>
            <div style={{ display: "flex", gap: 6, marginBottom: "1.1rem", background: T.surface, borderRadius: 12, padding: 5 }}>
              {[{ key: "fridge", icon: "camera", label: "Fridge scan" }, { key: "search", icon: "search", label: "Search" }, { key: "suggest", icon: "suggest", label: "Suggest" }].map(function (m) {
                var active = aiMode === m.key;
                return <button key={m.key} onClick={function () { setAiMode(m.key); }} style={{ flex: 1, padding: "8px 4px", borderRadius: 9, border: "none", background: active ? T.card : "none", cursor: "pointer", fontSize: 12, fontWeight: active ? 600 : 400, color: active ? T.text : T.muted, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all 0.15s", boxShadow: active ? "0 0 0 0.5px " + T.border : "none" }}><Icon name={m.icon} size={15} color={active ? T.text : T.muted} />{m.label}</button>;
              })}
            </div>

            {aiMode === "fridge" && (
              <div>
                <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 18, color: T.text, marginBottom: 4 }}>Scan your fridge</div>
                <div style={{ fontSize: 13, color: T.muted, marginBottom: 14, lineHeight: 1.6 }}>Take or upload a photo of your fridge or cupboard. AI will suggest recipes from what it sees.</div>
                <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFridgePhoto} style={{ display: "none" }} />
                {!fridgeImg ? (
                  <div onClick={function () { if (fileRef.current) fileRef.current.click(); }} style={{ borderRadius: 14, border: "1.5px dashed " + purR.border, background: purR.bg, padding: "2.5rem 1rem", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, cursor: "pointer" }}>
                    <Icon name="camera" size={40} color={purR.text} />
                    <div style={{ fontSize: 14, fontWeight: 600, color: purR.text }}>Tap to take a photo</div>
                    <div style={{ fontSize: 12, color: purR.text, opacity: 0.7 }}>or upload from your camera roll</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ position: "relative", marginBottom: 10 }}>
                      <img src={fridgeImg} alt="Fridge" style={{ width: "100%", borderRadius: 14, maxHeight: 240, objectFit: "cover", border: "0.5px solid " + T.border }} />
                      <button onClick={function () { setFridgeImg(null); setFridgeData(null); setFridgeRes([]); }} style={{ position: "absolute", top: 8, right: 8, background: T.card, border: "0.5px solid " + T.border, borderRadius: 8, padding: "4px 10px", fontSize: 12, cursor: "pointer", color: T.muted, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
                        <Icon name="close" size={12} color={T.muted} />Change
                      </button>
                    </div>
                    <button onClick={scanFridge} disabled={fridgeLoad} style={{ width: "100%", padding: "11px", borderRadius: 11, border: "1px solid " + purR.border, background: purR.bg, cursor: "pointer", fontSize: 14, fontWeight: 600, color: purR.text, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 14, opacity: fridgeLoad ? 0.7 : 1 }}>
                      {fridgeLoad ? <><Spin size={16} color={purR.dot} />Analysing your fridge...</> : <><Icon name="ai" size={16} color={purR.text} />Find recipes from this photo</>}
                    </button>
                  </div>
                )}
                {fridgeRes.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: T.hint, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Recipes you can make</div>
                    {fridgeRes.map(function (r, i) { return <div key={i} style={{ opacity: savedIds[r.name] ? 0.5 : 1 }}>{savedIds[r.name] ? <div style={{ fontSize: 12, color: T.hint, padding: "8px 0", textAlign: "center" }}>{r.name} saved</div> : <AISave recipe={r} onSave={saveAIRecipe} dark={dark} />}</div>; })}
                  </div>
                )}
              </div>
            )}

            {aiMode === "search" && (
              <div>
                <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 18, color: T.text, marginBottom: 4 }}>Find recipes</div>
                <div style={{ fontSize: 13, color: T.muted, marginBottom: 14, lineHeight: 1.6 }}>Search by ingredient, cuisine, mood, or dish name.</div>
                <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                  <input value={searchQ} onChange={function (e) { setSearchQ(e.target.value); }} onKeyDown={function (e) { if (e.key === "Enter") doSearch(); }} placeholder="e.g. quick pasta, Thai, high protein..." style={{ ...iS, flex: 1 }} />
                  <button onClick={doSearch} disabled={searchLoad || !searchQ.trim()} style={{ padding: "0 14px", borderRadius: 9, border: "1px solid " + tealR.border, background: tealR.bg, cursor: "pointer", fontSize: 13, fontWeight: 600, color: tealR.text, display: "flex", alignItems: "center", gap: 6, opacity: (searchLoad || !searchQ.trim()) ? 0.5 : 1 }}>
                    {searchLoad ? <Spin size={14} color={tealR.dot} /> : <Icon name="search" size={14} color={tealR.text} />}Search
                  </button>
                </div>
                {searchRes.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: T.hint, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Results</div>
                    {searchRes.map(function (r, i) { return <div key={i} style={{ opacity: savedIds[r.name] ? 0.5 : 1 }}>{savedIds[r.name] ? <div style={{ fontSize: 12, color: T.hint, padding: "8px 0", textAlign: "center" }}>{r.name} saved</div> : <AISave recipe={r} onSave={saveAIRecipe} dark={dark} />}</div>; })}
                  </div>
                )}
              </div>
            )}

            {aiMode === "suggest" && (
              <div>
                <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 18, color: T.text, marginBottom: 4 }}>Recipe suggestions</div>
                <div style={{ fontSize: 13, color: T.muted, marginBottom: 14, lineHeight: 1.6 }}>Based on your recipe library, AI suggests new meals you would probably enjoy.</div>
                {meals.length === 0 && <div style={{ fontSize: 13, color: T.hint, marginBottom: 14, padding: "10px 13px", background: T.surface, borderRadius: 10, border: "0.5px solid " + T.border }}>Add some recipes to your library first so AI can learn your taste.</div>}
                <button onClick={doSuggest} disabled={suggestLoad} style={{ width: "100%", padding: "11px", borderRadius: 11, border: "1px solid " + tealR.border, background: tealR.bg, cursor: "pointer", fontSize: 14, fontWeight: 600, color: tealR.text, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 14, opacity: suggestLoad ? 0.7 : 1 }}>
                  {suggestLoad ? <><Spin size={16} color={tealR.dot} />Finding ideas for you...</> : <><Icon name="suggest" size={16} color={tealR.text} />Suggest recipes for me</>}
                </button>
                {suggestRes.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: T.hint, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>Picked for you</div>
                    {suggestRes.map(function (r, i) { return <div key={i} style={{ opacity: savedIds[r.name] ? 0.5 : 1 }}>{savedIds[r.name] ? <div style={{ fontSize: 12, color: T.hint, padding: "8px 0", textAlign: "center" }}>{r.name} saved</div> : <AISave recipe={r} onSave={saveAIRecipe} dark={dark} />}</div>; })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}