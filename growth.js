(() => {
  "use strict";

  const config = window.ZAVO_ANALYTICS || {};
  const campaignKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
  const attributionStorageKey = "zavoAttribution";
  const trackedScrollMarks = new Set();

  window.dataLayer = window.dataLayer || [];

  function cleanValue(value, maxLength = 180) {
    return String(value || "").trim().slice(0, maxLength);
  }

  function currentAttribution() {
    try {
      return JSON.parse(localStorage.getItem(attributionStorageKey) || "{}") || {};
    } catch {
      return {};
    }
  }

  function captureAttribution() {
    const params = new URLSearchParams(window.location.search);
    const incoming = {};
    campaignKeys.forEach((key) => {
      const value = params.get(key);
      if (value) incoming[key] = cleanValue(value, 120);
    });

    if (!Object.keys(incoming).length) return currentAttribution();

    const attribution = {
      ...currentAttribution(),
      ...incoming,
      landing_page: window.location.pathname,
      captured_at: new Date().toISOString()
    };

    try {
      localStorage.setItem(attributionStorageKey, JSON.stringify(attribution));
    } catch {
      // Tracking remains optional when browser storage is unavailable.
    }
    return attribution;
  }

  const attribution = captureAttribution();

  function loadGa4(measurementId) {
    if (!/^G-[A-Z0-9]+$/i.test(measurementId || "")) return;
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    document.head.appendChild(script);

    window.gtag = window.gtag || function gtag() {
      window.dataLayer.push(arguments);
    };
    window.gtag("js", new Date());
    window.gtag("config", measurementId, {
      anonymize_ip: true,
      send_page_view: true
    });
  }

  function trackEvent(eventName, parameters = {}) {
    const payload = {
      page_type: document.body?.dataset.pageType || "page",
      page_path: window.location.pathname,
      page_title: document.title,
      ...attribution,
      ...parameters
    };

    window.dataLayer.push({ event: eventName, ...payload });
    if (typeof window.gtag === "function") window.gtag("event", eventName, payload);
    window.dispatchEvent(new CustomEvent("zavo:analytics", { detail: { eventName, payload } }));
  }

  window.zavoTrack = trackEvent;
  loadGa4(cleanValue(config.ga4MeasurementId, 30));

  function closestProductName(element) {
    const card = element.closest("[data-product-name], .product-card, .product-detail");
    return cleanValue(
      card?.dataset.productName ||
      card?.querySelector(".product-title, h1")?.textContent ||
      document.body?.dataset.productName ||
      document.querySelector("h1")?.textContent ||
      element.textContent,
      160
    );
  }

  document.addEventListener("click", async (event) => {
    const copyButton = event.target.closest("[data-copy-page-link]");
    if (copyButton) {
      try {
        await navigator.clipboard.writeText(window.location.href);
        const originalText = copyButton.textContent;
        copyButton.textContent = "Link copied";
        setTimeout(() => { copyButton.textContent = originalText; }, 1800);
        trackEvent("share", { method: "copy_link", content_type: "product", item_id: closestProductName(copyButton) });
      } catch {
        trackEvent("share_error", { method: "copy_link" });
      }
      return;
    }

    const saveButton = event.target.closest("[data-save-id]");
    if (saveButton) {
      trackEvent("save_product", {
        product_id: cleanValue(saveButton.dataset.saveId, 80),
        product_name: closestProductName(saveButton)
      });
      return;
    }

    const link = event.target.closest("a[href]");
    if (!link) return;

    if (link.matches('[rel~="sponsored"]')) {
      let destinationHost = "retailer";
      try { destinationHost = new URL(link.href).hostname; } catch { /* Keep generic fallback. */ }
      trackEvent("affiliate_click", {
        product_name: closestProductName(link),
        cta_location: cleanValue(link.dataset.ctaLocation || (link.closest(".mobile-product-cta") ? "mobile_sticky" : "page"), 60),
        link_text: cleanValue(link.textContent, 100),
        destination_host: destinationHost
      });
      return;
    }

    if (link.dataset.shareNetwork) {
      trackEvent("share", {
        method: cleanValue(link.dataset.shareNetwork, 40),
        content_type: "product",
        item_id: closestProductName(link)
      });
      return;
    }

    const href = link.getAttribute("href") || "";
    if (href.includes("/products/") || href.startsWith("products/")) {
      trackEvent("select_item", { item_name: closestProductName(link), link_url: link.href });
    } else if (href.includes("/guides/") || href.startsWith("guides/") || href.startsWith("../guides/")) {
      trackEvent("select_content", { content_type: "guide", item_name: cleanValue(link.textContent, 140), link_url: link.href });
    }
  });

  document.querySelectorAll('form[role="search"], #searchForm').forEach((form) => {
    form.addEventListener("submit", () => {
      const input = form.querySelector('input[type="search"], input[name="q"]');
      trackEvent("search", { search_term: cleanValue(input?.value, 100) });
    });
  });

  function onScroll() {
    const doc = document.documentElement;
    const scrollable = Math.max(1, doc.scrollHeight - window.innerHeight);
    const percent = Math.round((window.scrollY / scrollable) * 100);
    [50, 90].forEach((mark) => {
      if (percent >= mark && !trackedScrollMarks.has(mark)) {
        trackedScrollMarks.add(mark);
        trackEvent("scroll_depth", { percent_scrolled: mark });
      }
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  trackEvent("zavo_page_ready", {
    product_name: cleanValue(document.body?.dataset.productName, 160)
  });
})();
