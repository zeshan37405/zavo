const SHEET_ID = "1UykHn4JGBxrrVW61cClI0yGqm5MaRKdBl0e-SA1boKE";
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=0`;
const SITE_ROOT = "https://zeshan37405.github.io/zavo/";
const PRODUCT_PAGE = `${SITE_ROOT}products/16-color-led-sunset-projection-lamp.html`;
const PRODUCT_IMAGE_PRIMARY = `${SITE_ROOT}images/16-color-led-sunset-projection-lamp.png`;
const PRODUCT_IMAGE_BACKUP = "https://raw.githubusercontent.com/zeshan37405/smart-gadget-site/99508eb2f16db21dd3a1e81f0cc088f841a02821/images/16-color-led-sunset-projection-lamp.png";

const FALLBACK_PRODUCTS = [{
  id: "1",
  title: "16-Color LED Sunset Projection Lamp with Remote Control",
  description: "Create a warm, colorful atmosphere in bedrooms, living rooms, parties and photography setups with this USB-powered 16-color LED sunset projection lamp.",
  image: PRODUCT_IMAGE_PRIMARY,
  link: "https://s.click.aliexpress.com/e/_c3yYJHFD",
  category: "Home & Living",
  keywords: "sunset lamp LED projection light RGB night light bedroom decor room aesthetic ambient lighting USB lamp remote control lamp",
  alt: "16-color LED sunset projection lamp with remote control in a warm bedroom setting",
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

let products = [...FALLBACK_PRODUCTS];
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
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
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

function getProductPage(product) {
  const identifier = normalize(`${product.id} ${product.title}`);
  if (identifier.includes("16-color") || identifier.startsWith("1 ")) {
    return PRODUCT_PAGE;
  }
  return "";
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
  } catch {
    // The catalog remains usable when storage is unavailable.
  }
}

function attachImageFallbacks() {
  if (!grid) return;

  grid.querySelectorAll("img[data-product-image]").forEach((image) => {
    image.addEventListener("error", () => {
      const fallbackStage = image.dataset.fallbackStage || "0";

      if (fallbackStage === "0") {
        image.dataset.fallbackStage = "1";
        image.src = PRODUCT_IMAGE_PRIMARY;
        return;
      }

      if (fallbackStage === "1") {
        image.dataset.fallbackStage = "2";
        image.src = PRODUCT_IMAGE_BACKUP;
        return;
      }

      image.alt = "";
      image.style.display = "none";
      image.parentElement?.classList.add("image-unavailable");
    });
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
  grid.classList.toggle("single-product", visible.length === 1);

  if (!visible.length) {
    grid.innerHTML = `<div class="empty-state"><strong>No products match your search.</strong>Try a different keyword or category.</div>`;
    return;
  }

  grid.innerHTML = visible.map((product) => {
    const productId = String(product.id || product.title);
    const retailerLink = /^https?:\/\//i.test(product.link) ? product.link : "#";
    const image = /^https?:\/\//i.test(product.image) ? product.image : PRODUCT_IMAGE_PRIMARY;
    const productPage = getProductPage(product);
    const fallbackStage = image === PRODUCT_IMAGE_PRIMARY ? "1" : "0";
    const savedClass = saved.has(productId) ? " is-saved" : "";
    const savedLabel = saved.has(productId) ? "Remove from saved products" : "Save product";
    const mediaOpen = productPage ? `<a class="product-media product-media-link" href="${escapeHTML(productPage)}" aria-label="View details for ${escapeHTML(product.title)}">` : `<div class="product-media">`;
    const mediaClose = productPage ? `</a>` : `</div>`;
    const title = productPage
      ? `<a href="${escapeHTML(productPage)}">${escapeHTML(product.title)}</a>`
      : escapeHTML(product.title);
    const detailLink = productPage
      ? `<a class="product-details-link" href="${escapeHTML(productPage)}">Product details</a>`
      : `<span></span>`;

    return `<article class="product-card">
      ${mediaOpen}
        <img data-product-image data-fallback-stage="${fallbackStage}" src="${escapeHTML(image)}" width="1536" height="1536" alt="${escapeHTML(product.alt || product.title)}" loading="eager" decoding="async">
        <span class="product-badge">Zavo Pick</span>
      ${mediaClose}
      <button class="product-save${savedClass}" type="button" data-save-id="${escapeHTML(productId)}" aria-label="${savedLabel}" title="${savedLabel}">♡</button>
      <div class="product-body">
        <div class="product-category">${escapeHTML(product.category || "Lifestyle")}</div>
        <h3 class="product-title">${title}</h3>
        <p class="product-description">${escapeHTML(product.description || "An interesting product selected for everyday style, usefulness and value.")}</p>
        <div class="product-confidence">✓ Zavo curated <span>• Retailer listing</span></div>
        <div class="product-meta">
          ${detailLink}
          <a class="btn btn-primary product-link" href="${escapeHTML(retailerLink)}" target="_blank" rel="nofollow sponsored noopener">View retailer deal</a>
        </div>
      </div>
    </article>`;
  }).join("");

  attachImageFallbacks();
}

function populateCategories() {
  if (!categoryFilter) return;

  const categories = [...new Set(products.map((product) => product.category).filter(Boolean))].sort();
  categoryFilter.innerHTML = '<option value="all">All Categories</option>' + categories
    .map((category) => `<option value="${escapeHTML(category)}">${escapeHTML(category)}</option>`)
    .join("");

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
  return products
    .map((product) => ({ ...product, dealTimestamp: parseDealEnd(product.dealEnd) }))
    .filter((product) => product.dealTimestamp && product.dealTimestamp > now && /^https?:\/\//i.test(product.link))
    .sort((a, b) => a.dealTimestamp - b.dealTimestamp)
    .slice(0, 4);
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
  flashGrid.innerHTML = deals.map((product) => `
    <a class="flash-card" href="${escapeHTML(product.link)}" target="_blank" rel="nofollow sponsored noopener">
      <div>
        <span>${escapeHTML(product.category || "Limited-time offer")} • Retailer deal</span>
        <strong>${escapeHTML(product.title)}</strong>
        <small>${escapeHTML(product.price || "Check retailer price")} · Ends in <time data-deal-end="${product.dealTimestamp}">${formatRemaining(product.dealTimestamp - Date.now())}</time> →</small>
      </div>
    </a>`).join("");
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
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(`${CSV_URL}&_=${Date.now()}`, {
      cache: "no-store",
      signal: controller.signal
    });

    if (!response.ok) throw new Error("Catalog request failed");
    const loaded = buildProducts(parseCSV(await response.text()));
    applyProducts(loaded);
  } catch {
    applyProducts([...FALLBACK_PRODUCTS]);
  } finally {
    clearTimeout(timeout);
  }
}

searchForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
  renderProducts();
});

searchInput?.addEventListener("input", renderProducts);
categoryFilter?.addEventListener("change", () => {
  pendingCategory = categoryFilter.value;
  renderProducts();
});
sortFilter?.addEventListener("change", renderProducts);
categoryCards.forEach((card) => card.addEventListener("click", (event) => {
  event.preventDefault();
  selectCategory(card.dataset.category);
}));

grid?.addEventListener("click", (event) => {
  const saveButton = event.target.closest("[data-save-id]");
  if (!saveButton) return;

  const productId = String(saveButton.dataset.saveId);
  const saved = getSavedProducts();
  if (saved.has(productId)) saved.delete(productId);
  else saved.add(productId);

  saveSavedProducts(saved);
  const isSaved = saved.has(productId);
  saveButton.classList.toggle("is-saved", isSaved);
  saveButton.setAttribute("aria-label", isSaved ? "Remove from saved products" : "Save product");
  saveButton.setAttribute("title", isSaved ? "Remove from saved products" : "Save product");
});

const initialQuery = new URLSearchParams(window.location.search).get("q");
if (searchInput && initialQuery) searchInput.value = initialQuery;

attachImageFallbacks();
setInterval(updateDealCountdowns, 1000);
loadProducts();
