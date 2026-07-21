const SHEET_ID = "1UykHn4JGBxrrVW61cClI0yGqm5MaRKdBl0e-SA1boKE";
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=0`;

const grid = document.getElementById("productsGrid");
const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const sortFilter = document.getElementById("sortFilter");
const categoryCards = document.querySelectorAll("[data-category]");
const productCount = document.getElementById("productCount");
const dealCountdown = document.getElementById("dealCountdown");
const year = document.getElementById("year");

if (year) year.textContent = new Date().getFullYear();

let products = [];
let pendingCategory = "all";

function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && quoted && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
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
    rows.push(row);
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
  const status = String(value || "").trim().toLowerCase();
  return !status || ["yes", "true", "1", "publish", "published", "live"].includes(status);
}

function buildProducts(rows) {
  if (rows.length < 2) return [];

  const headers = rows[0].map(normalize);
  const findIndex = (...names) => names
    .map(normalize)
    .map((name) => headers.indexOf(name))
    .find((index) => index >= 0) ?? -1;

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
    price: findIndex("price", "sale price", "display price")
  };

  return rows.slice(1).map((row, index) => ({
    id: indexes.id >= 0 ? row[indexes.id] : index + 1,
    title: indexes.title >= 0 ? row[indexes.title] : "",
    description: indexes.description >= 0 ? row[indexes.description] : "",
    image: indexes.image >= 0 ? row[indexes.image] : "",
    link: indexes.link >= 0 ? row[indexes.link] : "",
    category: indexes.category >= 0 ? row[indexes.category] : "Lifestyle",
    keywords: indexes.keywords >= 0 ? row[indexes.keywords] : "",
    alt: indexes.alt >= 0 ? row[indexes.alt] : "",
    publish: indexes.publish >= 0 ? row[indexes.publish] : "",
    price: indexes.price >= 0 ? row[indexes.price] : ""
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
  } catch {
    // Browsing remains fully functional when storage is unavailable.
  }
}

function renderProducts() {
  if (!grid) return;

  const query = (searchInput?.value || "").trim().toLowerCase();
  const category = categoryFilter?.value || "all";
  const order = sortFilter?.value || "featured";
  const filtered = products.filter((product) => productMatches(product, query, category));
  const visible = sortProducts(filtered, order);
  const saved = getSavedProducts();

  if (productCount) productCount.textContent = String(visible.length);

  if (!visible.length) {
    const hasProducts = products.length > 0;
    grid.innerHTML = `
      <div class="empty-state">
        <strong>${hasProducts ? "No products match your search." : "New arrivals are being added."}</strong>
        ${hasProducts ? "Try a different keyword or category." : "Please check back soon for our latest curated products."}
      </div>`;
    return;
  }

  grid.innerHTML = visible.map((product) => {
    const productId = String(product.id || product.title);
    const safeLink = /^https?:\/\//i.test(product.link) ? product.link : "#";
    const image = product.image || "https://placehold.co/900x900/fff1e9/e64a12?text=Zavo";
    const price = product.price || "Check latest price";
    const savedClass = saved.has(productId) ? " is-saved" : "";
    const savedLabel = saved.has(productId) ? "Remove from saved products" : "Save product";

    return `
      <article class="product-card">
        <div class="product-media">
          <img src="${escapeHTML(image)}" alt="${escapeHTML(product.alt || product.title)}" loading="lazy">
          <span class="product-badge">Zavo Pick</span>
          <button class="product-save${savedClass}" type="button" data-save-id="${escapeHTML(productId)}" aria-label="${savedLabel}" title="${savedLabel}">♡</button>
        </div>
        <div class="product-body">
          <div class="product-category">${escapeHTML(product.category || "Lifestyle")}</div>
          <h3 class="product-title">${escapeHTML(product.title)}</h3>
          <p class="product-description">${escapeHTML(product.description || "An interesting product selected for everyday style, usefulness, and value.")}</p>
          <div class="product-confidence">✓ Zavo curated <span>• Retailer listing</span></div>
          <div class="product-meta">
            <span class="product-price">${escapeHTML(price)}</span>
            <a class="btn btn-primary product-link" href="${escapeHTML(safeLink)}" target="_blank" rel="nofollow sponsored noopener">View Deal</a>
          </div>
        </div>
      </article>`;
  }).join("");
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
    const matchingOption = [...categoryFilter.options].find((option) => normalize(option.value) === normalize(pendingCategory));
    categoryFilter.value = matchingOption ? matchingOption.value : "all";
  }

  document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
  renderProducts();
}

function updateCountdown() {
  if (!dealCountdown) return;

  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  const remaining = Math.max(0, end.getTime() - now.getTime());
  const hours = Math.floor(remaining / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  dealCountdown.textContent = [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}

async function loadProducts() {
  if (!grid) return;

  try {
    const response = await fetch(CSV_URL, { cache: "no-store" });
    if (!response.ok) throw new Error("Catalog request failed");
    products = buildProducts(parseCSV(await response.text()));
    populateCategories();
    renderProducts();
  } catch (error) {
    if (productCount) productCount.textContent = "0";
    grid.innerHTML = `
      <div class="empty-state">
        <strong>Our catalog is temporarily unavailable.</strong>
        Please refresh the page in a moment.
      </div>`;
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

categoryCards.forEach((card) => {
  card.addEventListener("click", (event) => {
    event.preventDefault();
    selectCategory(card.dataset.category);
  });
});

grid?.addEventListener("click", (event) => {
  const saveButton = event.target.closest("[data-save-id]");
  if (!saveButton) return;

  const productId = String(saveButton.dataset.saveId);
  const saved = getSavedProducts();

  if (saved.has(productId)) saved.delete(productId);
  else saved.add(productId);

  saveSavedProducts(saved);
  saveButton.classList.toggle("is-saved", saved.has(productId));
  saveButton.setAttribute("aria-label", saved.has(productId) ? "Remove from saved products" : "Save product");
  saveButton.setAttribute("title", saved.has(productId) ? "Remove from saved products" : "Save product");
});

const initialQuery = new URLSearchParams(window.location.search).get("q");
if (searchInput && initialQuery) searchInput.value = initialQuery;

updateCountdown();
setInterval(updateCountdown, 1000);
loadProducts();
