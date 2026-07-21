const SHEET_ID = "1UykHn4JGBxrrVW61cClI0yGqm5MaRKdBl0e-SA1boKE";
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=0`;

const FALLBACK_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="0 0 900 900">
  <defs>
    <linearGradient id="room" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#b93605"/>
      <stop offset="0.45" stop-color="#ff7a00"/>
      <stop offset="1" stop-color="#ffd43b"/>
    </linearGradient>
    <radialGradient id="glow" cx="70%" cy="35%" r="55%">
      <stop offset="0" stop-color="#fff8a8" stop-opacity=".95"/>
      <stop offset=".45" stop-color="#ffd83d" stop-opacity=".75"/>
      <stop offset="1" stop-color="#ff7800" stop-opacity="0"/>
    </radialGradient>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#4d1200" flood-opacity=".35"/>
    </filter>
  </defs>
  <rect width="900" height="900" fill="url(#room)"/>
  <circle cx="650" cy="300" r="330" fill="url(#glow)"/>
  <rect x="0" y="650" width="900" height="250" fill="#a63a06" opacity=".36"/>
  <g filter="url(#shadow)">
    <ellipse cx="205" cy="780" rx="155" ry="34" fill="#161616"/>
    <rect x="180" y="350" width="38" height="430" rx="18" fill="#181818"/>
    <rect x="163" y="468" width="72" height="44" rx="10" fill="#242424"/>
    <circle cx="199" cy="285" r="145" fill="#101010"/>
    <circle cx="199" cy="285" r="113" fill="#171717"/>
  </g>
  <g transform="translate(480 560) rotate(-18)" filter="url(#shadow)">
    <rect width="250" height="300" rx="28" fill="#f8f8f8" stroke="#333" stroke-width="10"/>
    <rect x="25" y="24" width="200" height="42" rx="12" fill="#ececec"/>
    <circle cx="52" cy="45" r="13" fill="#555"/>
    <circle cx="198" cy="45" r="13" fill="#ff3b30"/>
    <g>
      <circle cx="48" cy="102" r="18" fill="#ff3b30"/><circle cx="98" cy="102" r="18" fill="#34c759"/><circle cx="148" cy="102" r="18" fill="#007aff"/><circle cx="198" cy="102" r="18" fill="#f5f5f5" stroke="#aaa"/>
      <circle cx="48" cy="150" r="18" fill="#ff9500"/><circle cx="98" cy="150" r="18" fill="#ffcc00"/><circle cx="148" cy="150" r="18" fill="#5ac8fa"/><circle cx="198" cy="150" r="18" fill="#af52de"/>
      <circle cx="48" cy="198" r="18" fill="#ff2d55"/><circle cx="98" cy="198" r="18" fill="#64d2ff"/><circle cx="148" cy="198" r="18" fill="#5856d6"/><circle cx="198" cy="198" r="18" fill="#30d158"/>
      <circle cx="48" cy="246" r="18" fill="#ff453a"/><circle cx="98" cy="246" r="18" fill="#ffd60a"/><circle cx="148" cy="246" r="18" fill="#0a84ff"/><circle cx="198" cy="246" r="18" fill="#bf5af2"/>
    </g>
  </g>
  <g transform="translate(754 70)">
    <rect width="108" height="620" rx="22" fill="#151515" opacity=".95"/>
    <circle cx="54" cy="54" r="34" fill="#84ff00"/><circle cx="54" cy="124" r="34" fill="#ff9f0a"/>
    <circle cx="54" cy="194" r="34" fill="#ff2d55"/><circle cx="54" cy="264" r="34" fill="#00e0ff"/>
    <circle cx="54" cy="334" r="34" fill="#ff453a"/><circle cx="54" cy="404" r="34" fill="#0a84ff"/>
    <circle cx="54" cy="474" r="34" fill="#bf5af2"/><circle cx="54" cy="544" r="34" fill="#30d158"/>
  </g>
  <rect x="38" y="38" width="260" height="64" rx="32" fill="#fff" opacity=".94"/>
  <text x="168" y="80" text-anchor="middle" font-family="Arial,sans-serif" font-size="30" font-weight="700" fill="#d84a0b">16-COLOR SUNSET LAMP</text>
</svg>`;

const FALLBACK_IMAGE = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(FALLBACK_SVG)}`;

const FALLBACK_PRODUCTS = [{
  id: "1",
  title: "16-Color LED Sunset Projection Lamp with Remote Control",
  description: "Create a warm, colorful atmosphere in bedrooms, living rooms, parties, photography setups, and gaming spaces with this USB-powered 16-color LED sunset projection lamp.",
  image: FALLBACK_IMAGE,
  link: "https://s.click.aliexpress.com/e/_c3yYJHFD",
  category: "Home & Living",
  keywords: "sunset lamp LED projection light RGB night light bedroom decor room aesthetic ambient lighting USB lamp remote control lamp",
  alt: "16-color LED sunset projection lamp with remote control",
  publish: "Yes",
  price: "Check latest price",
  dealEnd: ""
}];

const grid = document.getElementById("productsGrid");
const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const sortFilter = document.getElementById("sortFilter");
const categoryCards = document.querySelectorAll("[data-category]");
const productCount = document.getElementById("productCount");
const dealsSection = document.getElementById("deals");
const flashGrid = document.getElementById("flashGrid");
const year = document.getElementById("year");

if (year) year.textContent = new Date().getFullYear();

let products = [];
let pendingCategory = "all";

function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell.trim());
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  if (cell.length || row.length) {
    row.push(cell.trim());
    if (row.some((value) => value !== "")) rows.push(row);
  }
  return rows;
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  })[char]);
}

function normalize(value = "") {
  return String(value).toLowerCase().trim().replace(/\s+/g, " ");
}

function isPublished(value) {
  const status = normalize(value);
  return !status || ["yes", "true", "1", "publish", "published", "live"].includes(status);
}

function parseDealEnd(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const timestamp = Date.parse(raw);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function buildProducts(rows) {
  if (rows.length < 2) return [];
  const headers = rows[0].map(normalize);
  const findIndex = (...names) => {
    for (const name of names.map(normalize)) {
      const index = headers.indexOf(name);
      if (index >= 0) return index;
    }
    return -1;
  };
  const indexes = {
    id: findIndex("id"),
    title: findIndex("title", "product title"),
    description: findIndex("description", "product description"),
    image: findIndex("image url", "image", "product image"),
    link: findIndex("affiliate link", "product link", "link", "url"),
    category: findIndex("category"),
    keywords: findIndex("keywords", "tags"),
    alt: findIndex("alt text", "image alt"),
    publish: findIndex("publish", "status"),
    price: findIndex("price", "sale price", "display price"),
    dealEnd: findIndex("deal end", "deal end time", "flash end", "sale end", "offer end")
  };
  return rows.slice(1).map((row, index) => ({
    id: indexes.id >= 0 ? row[indexes.id] : String(index + 1),
    title: indexes.title >= 0 ? row[indexes.title] : "",
    description: indexes.description >= 0 ? row[indexes.description] : "",
    image: indexes.image >= 0 ? row[indexes.image] : "",
    link: indexes.link >= 0 ? row[indexes.link] : "",
    category: indexes.category >= 0 ? row[indexes.category] : "Lifestyle",
    keywords: indexes.keywords >= 0 ? row[indexes.keywords] : "",
    alt: indexes.alt >= 0 ? row[indexes.alt] : "",
    publish: indexes.publish >= 0 ? row[indexes.publish] : "",
    price: indexes.price >= 0 ? row[indexes.price] : "",
    dealEnd: indexes.dealEnd >= 0 ? row[indexes.dealEnd] : ""
  })).filter((product) => product.title && isPublished(product.publish));
}

function productMatches(product, query, category) {
  const haystack = `${product.title} ${product.description} ${product.category} ${product.keywords}`.toLowerCase();
  const categoryMatch = category === "all" || normalize(product.category) === normalize(category);
  return haystack.includes(query) && categoryMatch;
}

function sortProducts(list, order) {
  const result = [...list];
  if (order === "az") result.sort((a, b) => a.title.localeCompare(b.title));
  if (order === "za") result.sort((a, b) => b.title.localeCompare(a.title));
  if (order === "category") result.sort((a, b) => a.category.localeCompare(b.category));
  return result;
}

function getSavedProducts() {
  try {
    return new Set(JSON.parse(localStorage.getItem("zavoSavedProducts") || "[]").map(String));
  } catch {
    return new Set();
  }
}

function saveSavedProducts(saved) {
  try {
    localStorage.setItem("zavoSavedProducts", JSON.stringify([...saved]));
  } catch {}
}

function attachImageFallbacks() {
  if (!grid) return;
  grid.querySelectorAll("img[data-product-image]").forEach((image) => {
    image.addEventListener("error", () => {
      image.alt = "";
      image.src = FALLBACK_IMAGE;
    }, { once: true });
  });
}

function renderProducts() {
  if (!grid) return;
  const query = (searchInput?.value || "").trim().toLowerCase();
  const category = categoryFilter?.value || "all";
  const order = sortFilter?.value || "featured";
  const visible = sortProducts(products.filter((product) => productMatches(product, query, category)), order);
  const saved = getSavedProducts();
  if (productCount) productCount.textContent = String(visible.length);
  if (!visible.length) {
    grid.innerHTML = `<div class="empty-state"><strong>${products.length ? "No products match your search." : "New products are being added."}</strong>${products.length ? "Try a different keyword or category." : "Please check back soon."}</div>`;
    return;
  }
  grid.innerHTML = visible.map((product) => {
    const productId = String(product.id || product.title);
    const safeLink = /^https?:\/\//i.test(product.link) ? product.link : "#";
    const image = /^https?:\/\//i.test(product.image) ? product.image : FALLBACK_IMAGE;
    const price = product.price || "Check latest price";
    const savedClass = saved.has(productId) ? " is-saved" : "";
    const savedLabel = saved.has(productId) ? "Remove from saved products" : "Save product";
    return `<article class="product-card">
      <div class="product-media">
        <img data-product-image src="${escapeHTML(image)}" alt="${escapeHTML(product.alt || product.title)}" loading="eager" decoding="async">
        <span class="product-badge">Zavo Pick</span>
        <button class="product-save${savedClass}" type="button" data-save-id="${escapeHTML(productId)}" aria-label="${savedLabel}" title="${savedLabel}">♡</button>
      </div>
      <div class="product-body">
        <div class="product-category">${escapeHTML(product.category || "Lifestyle")}</div>
        <h3 class="product-title">${escapeHTML(product.title)}</h3>
        <p class="product-description">${escapeHTML(product.description || "An interesting product selected for everyday style, usefulness, and value.")}</p>
        <div class="product-confidence">✓ Zavo curated <span>• Retailer listing</span></div>
        <div class="product-meta"><span class="product-price">${escapeHTML(price)}</span><a class="btn btn-primary product-link" href="${escapeHTML(safeLink)}" target="_blank" rel="nofollow sponsored noopener">View Product</a></div>
      </div>
    </article>`;
  }).join("");
  attachImageFallbacks();
}

function populateCategories() {
  if (!categoryFilter) return;
  const categories = [...new Set(products.map((product) => product.category).filter(Boolean))].sort();
  categoryFilter.innerHTML = '<option value="all">All Categories</option>' + categories.map((category) => `<option value="${escapeHTML(category)}">${escapeHTML(category)}</option>`).join("");
  const match = [...categoryFilter.options].find((option) => normalize(option.value) === normalize(pendingCategory));
  categoryFilter.value = match ? match.value : "all";
}

function selectCategory(category) {
  pendingCategory = category || "all";
  if (categoryFilter) {
    const option = [...categoryFilter.options].find((item) => normalize(item.value) === normalize(pendingCategory));
    categoryFilter.value = option ? option.value : "all";
  }
  document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
  renderProducts();
}

function formatRemaining(milliseconds) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const clock = [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
  return days > 0 ? `${days}d ${clock}` : clock;
}

function activeDeals() {
  const now = Date.now();
  return products.map((product) => ({ ...product, dealTimestamp: parseDealEnd(product.dealEnd) })).filter((product) => product.dealTimestamp && product.dealTimestamp > now && /^https?:\/\//i.test(product.link)).sort((a, b) => a.dealTimestamp - b.dealTimestamp).slice(0, 4);
}

function flashClass(category, index) {
  const value = normalize(category);
  if (value.includes("fashion")) return "flash-fashion";
  if (value.includes("home")) return "flash-home";
  if (value.includes("beauty")) return "flash-beauty";
  if (value.includes("gadget") || value.includes("tech")) return "flash-tech";
  return ["flash-fashion", "flash-home", "flash-beauty", "flash-tech"][index % 4];
}

function renderDeals() {
  if (!dealsSection || !flashGrid) return;
  const deals = activeDeals();
  if (!deals.length) {
    dealsSection.hidden = true;
    flashGrid.innerHTML = "";
    return;
  }
  dealsSection.hidden = false;
  flashGrid.innerHTML = deals.map((product, index) => `<a class="flash-card ${flashClass(product.category, index)}" href="${escapeHTML(product.link)}" target="_blank" rel="nofollow sponsored noopener"><div><span>${escapeHTML(product.category || "Limited-time offer")} • Retailer deal</span><strong>${escapeHTML(product.title)}</strong><small>${escapeHTML(product.price || "Check retailer price")} · Ends in <time data-deal-end="${product.dealTimestamp}">${formatRemaining(product.dealTimestamp - Date.now())}</time> →</small></div></a>`).join("");
}

function updateDealCountdowns() {
  if (!dealsSection || dealsSection.hidden) return;
  let expired = false;
  document.querySelectorAll("[data-deal-end]").forEach((element) => {
    const end = Number(element.dataset.dealEnd);
    const remaining = end - Date.now();
    if (!Number.isFinite(end) || remaining <= 0) expired = true;
    else element.textContent = formatRemaining(remaining);
  });
  if (expired) renderDeals();
}

function applyProducts(nextProducts) {
  products = nextProducts.length ? nextProducts : [...FALLBACK_PRODUCTS];
  populateCategories();
  renderProducts();
  renderDeals();
}

async function loadProducts() {
  if (!grid) return;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(`${CSV_URL}&_=${Date.now()}`, { cache: "no-store", signal: controller.signal });
    if (!response.ok) throw new Error("Catalog request failed");
    const loaded = buildProducts(parseCSV(await response.text()));
    applyProducts(loaded);
  } catch {
    applyProducts([...FALLBACK_PRODUCTS]);
  } finally {
    clearTimeout(timeout);
  }
}

searchForm?.addEventListener("submit", (event) => { event.preventDefault(); document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" }); renderProducts(); });
searchInput?.addEventListener("input", renderProducts);
categoryFilter?.addEventListener("change", () => { pendingCategory = categoryFilter.value; renderProducts(); });
sortFilter?.addEventListener("change", renderProducts);
categoryCards.forEach((card) => card.addEventListener("click", (event) => { event.preventDefault(); selectCategory(card.dataset.category); }));

grid?.addEventListener("click", (event) => {
  const saveButton = event.target.closest("[data-save-id]");
  if (!saveButton) return;
  const productId = String(saveButton.dataset.saveId);
  const saved = getSavedProducts();
  if (saved.has(productId)) saved.delete(productId); else saved.add(productId);
  saveSavedProducts(saved);
  const isSaved = saved.has(productId);
  saveButton.classList.toggle("is-saved", isSaved);
  saveButton.setAttribute("aria-label", isSaved ? "Remove from saved products" : "Save product");
  saveButton.setAttribute("title", isSaved ? "Remove from saved products" : "Save product");
});

const initialQuery = new URLSearchParams(window.location.search).get("q");
if (searchInput && initialQuery) searchInput.value = initialQuery;
setInterval(updateDealCountdowns, 1000);
loadProducts();
