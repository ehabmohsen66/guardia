(() => {
  "use strict";

  const root = document.getElementById("guardia-oracle-erp");
  if (!root || root.dataset.initialized === "true") return;
  root.dataset.initialized = "true";

  const languageButtons = Array.from(root.querySelectorAll("[data-language]"));
  const form = root.querySelector("[data-lead-form]");
  const formSteps = Array.from(root.querySelectorAll("[data-form-step]"));
  const nextButton = root.querySelector("[data-next-step]");
  const previousButton = root.querySelector("[data-prev-step]");
  const progress = root.querySelector(".g-form-progress");
  const progressStep = root.querySelector("[data-progress-step]");
  const submitButton = root.querySelector("[data-submit-button]");
  const submitLabel = root.querySelector("[data-submit-label]");
  const statusRegion = root.querySelector("[data-form-status]");
  const currentYear = root.querySelector("[data-current-year]");
  const roiCalculator = root.querySelector("[data-roi-calculator]");
  const roiFields = {
    currency: root.querySelector("[data-roi-currency]"),
    tech: root.querySelector("[data-roi-tech]"),
    manual: root.querySelector("[data-roi-manual]"),
    spend: root.querySelector("[data-roi-spend]"),
    techRate: root.querySelector("[data-roi-tech-rate]"),
    manualRate: root.querySelector("[data-roi-manual-rate]"),
    spendRate: root.querySelector("[data-roi-spend-rate]")
  };
  const roiOutputs = {
    annual: root.querySelector("[data-roi-annual]"),
    tech: root.querySelector("[data-roi-tech-result]"),
    manual: root.querySelector("[data-roi-manual-result]"),
    spend: root.querySelector("[data-roi-spend-result]"),
    threeYear: root.querySelector("[data-roi-three-year]")
  };
  const roiExampleButton = root.querySelector("[data-roi-example]");
  const roiClearButton = root.querySelector("[data-roi-clear]");
  const roiCta = root.querySelector("[data-roi-cta]");
  const liveHost = /(^|\.)guardiasystems\.com$/i.test(window.location.hostname);
  const languageStorageKey = "guardia-erp-language";
  let currentLanguage = "en";
  let currentStep = 1;
  let leadSubmitted = false;

  const copy = {
    en: {
      loading: "Sending request…",
      success: "Thank you. Your request has been sent to Guardia Systems.",
      demo: "Demo mode: the form passed validation, but no lead was sent. It will use Guardia’s existing enquiry form when hosted on guardiasystems.com.",
      error: "We could not send your request. Please try again or use Guardia Systems’ contact page.",
      validation: "Please complete the highlighted field before continuing.",
      contactLink: "Open contact page"
    },
    ar: {
      loading: "جارٍ إرسال الطلب…",
      success: "شكراً لك. تم إرسال طلبك إلى غواريديا سيستمز.",
      demo: "وضع المعاينة: اجتاز النموذج التحقق، لكن لم يتم إرسال أي بيانات. عند استضافته على guardiasystems.com سيستخدم نموذج الاستفسارات الحالي لدى غواريديا.",
      error: "تعذر إرسال طلبك. يرجى المحاولة مرة أخرى أو استخدام صفحة التواصل مع غواريديا سيستمز.",
      validation: "يرجى إكمال الحقل المحدد قبل المتابعة.",
      contactLink: "افتح صفحة التواصل"
    }
  };

  function safeStorageGet(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (_) {
      return null;
    }
  }

  function safeStorageSet(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (_) {
      // Language persistence is helpful, not required.
    }
  }

  function setLanguage(language, persist = true) {
    currentLanguage = language === "ar" ? "ar" : "en";
    const direction = currentLanguage === "ar" ? "rtl" : "ltr";

    root.lang = currentLanguage;
    root.dir = direction;

    root.querySelectorAll("[data-en][data-ar]").forEach((element) => {
      element.textContent = element.dataset[currentLanguage] || element.dataset.en;
    });

    root.querySelectorAll("[data-en-placeholder][data-ar-placeholder]").forEach((element) => {
      element.placeholder = element.dataset[`${currentLanguage}Placeholder`] || element.dataset.enPlaceholder;
    });

    root.querySelectorAll("[data-en-alt][data-ar-alt]").forEach((element) => {
      element.alt = element.dataset[`${currentLanguage}Alt`] || element.dataset.enAlt;
    });

    root.querySelectorAll("[data-en-aria][data-ar-aria]").forEach((element) => {
      element.setAttribute("aria-label", element.dataset[`${currentLanguage}Aria`] || element.dataset.enAria);
    });

    languageButtons.forEach((button) => {
      const active = button.dataset.language === currentLanguage;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    const navigationLabel = currentLanguage === "ar" ? "أقسام الصفحة" : "Page sections";
    const header = root.querySelector(".g-header");
    const navigation = root.querySelector(".g-nav");
    const languageGroup = root.querySelector(".g-lang-switch");
    if (header) header.setAttribute("aria-label", currentLanguage === "ar" ? "التنقل في صفحة الهبوط" : "Landing page navigation");
    if (navigation) navigation.setAttribute("aria-label", navigationLabel);
    if (languageGroup) languageGroup.setAttribute("aria-label", currentLanguage === "ar" ? "اختر اللغة" : "Select language");

    updateRoi();
    if (persist) safeStorageSet(languageStorageKey, currentLanguage);
    pushAnalytics("erp_language_change", { language: currentLanguage });
  }

  function pushAnalytics(event, properties = {}) {
    if (!Array.isArray(window.dataLayer)) return;
    window.dataLayer.push({ event, ...properties });
  }

  function showStep(stepNumber) {
    currentStep = stepNumber === 2 ? 2 : 1;
    formSteps.forEach((step) => {
      const active = Number(step.dataset.formStep) === currentStep;
      step.hidden = !active;
      step.classList.toggle("is-active", active);
    });
    if (progress) progress.classList.toggle("is-complete", currentStep === 2);
    if (progressStep) progressStep.textContent = String(currentStep);

    const firstField = formSteps
      .find((step) => Number(step.dataset.formStep) === currentStep)
      ?.querySelector("input, select, textarea");
    if (firstField && window.matchMedia("(max-width: 900px)").matches) {
      window.setTimeout(() => firstField.focus({ preventScroll: true }), 220);
    }
  }

  function setStatus(type, message, includeContactLink = false) {
    if (!statusRegion) return;
    statusRegion.className = `g-form-status${type ? ` is-${type}` : ""}`;
    statusRegion.textContent = message || "";

    if (includeContactLink) {
      const separator = document.createTextNode(" ");
      const link = document.createElement("a");
      link.href = "https://guardiasystems.com/contact-us-new/";
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = copy[currentLanguage].contactLink;
      link.style.textDecoration = "underline";
      link.style.fontWeight = "800";
      statusRegion.append(separator, link);
    }
  }

  function fieldsForStep(stepNumber) {
    const step = formSteps.find((item) => Number(item.dataset.formStep) === stepNumber);
    return step ? Array.from(step.querySelectorAll("input, select, textarea")) : [];
  }

  function validateStep(stepNumber) {
    const fields = fieldsForStep(stepNumber);
    const firstInvalid = fields.find((field) => !field.checkValidity());

    fields.forEach((field) => {
      const invalid = !field.checkValidity();
      field.setAttribute("aria-invalid", String(invalid));
    });

    if (firstInvalid) {
      setStatus("error", copy[currentLanguage].validation);
      firstInvalid.focus();
      firstInvalid.reportValidity();
      return false;
    }

    setStatus("", "");
    return true;
  }

  function getAttribution() {
    const params = new URLSearchParams(window.location.search);
    const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid"];
    const values = {};
    keys.forEach((key) => {
      const value = params.get(key);
      if (value) values[key] = value.slice(0, 250);
    });
    values.landing_page = window.location.href.slice(0, 1000);
    values.language = currentLanguage;
    return values;
  }

  function numberFromField(field, maximum = Number.MAX_SAFE_INTEGER) {
    const value = Number.parseFloat(field?.value || "0");
    if (!Number.isFinite(value)) return 0;
    return Math.min(Math.max(value, 0), maximum);
  }

  function getRoiEstimate() {
    const techBaseline = numberFromField(roiFields.tech);
    const manualBaseline = numberFromField(roiFields.manual);
    const spendBaseline = numberFromField(roiFields.spend);
    const techRate = numberFromField(roiFields.techRate, 100);
    const manualRate = numberFromField(roiFields.manualRate, 100);
    const spendRate = numberFromField(roiFields.spendRate, 100);
    const techValue = techBaseline * (techRate / 100);
    const manualValue = manualBaseline * (manualRate / 100);
    const spendValue = spendBaseline * (spendRate / 100);
    const annualValue = techValue + manualValue + spendValue;

    return {
      currency: roiFields.currency?.value || "USD",
      techBaseline,
      manualBaseline,
      spendBaseline,
      techRate,
      manualRate,
      spendRate,
      techValue,
      manualValue,
      spendValue,
      annualValue,
      threeYearValue: annualValue * 3
    };
  }

  function formatRoiMoney(value, currency) {
    try {
      return new Intl.NumberFormat(currentLanguage === "ar" ? "ar" : "en", {
        style: "currency",
        currency,
        currencyDisplay: "code",
        maximumFractionDigits: 0
      }).format(value);
    } catch (_) {
      return `${currency} ${Math.round(value).toLocaleString(currentLanguage === "ar" ? "ar" : "en")}`;
    }
  }

  function updateRoi() {
    if (!roiCalculator) return;
    const estimate = getRoiEstimate();
    if (roiOutputs.annual) roiOutputs.annual.textContent = formatRoiMoney(estimate.annualValue, estimate.currency);
    if (roiOutputs.tech) roiOutputs.tech.textContent = formatRoiMoney(estimate.techValue, estimate.currency);
    if (roiOutputs.manual) roiOutputs.manual.textContent = formatRoiMoney(estimate.manualValue, estimate.currency);
    if (roiOutputs.spend) roiOutputs.spend.textContent = formatRoiMoney(estimate.spendValue, estimate.currency);
    if (roiOutputs.threeYear) roiOutputs.threeYear.textContent = formatRoiMoney(estimate.threeYearValue, estimate.currency);

    root.dataset.roiAnnualValue = String(Math.round(estimate.annualValue));
    root.dataset.roiCurrency = estimate.currency;
  }

  function setRoiExample() {
    if (!roiCalculator) return;
    roiFields.currency.value = "USD";
    roiFields.tech.value = "300000";
    roiFields.manual.value = "250000";
    roiFields.spend.value = "5000000";
    roiFields.techRate.value = "10";
    roiFields.manualRate.value = "15";
    roiFields.spendRate.value = "1";
    updateRoi();
    pushAnalytics("erp_roi_example_loaded", { language: currentLanguage, currency: "USD", annual_value: 117500 });
  }

  function clearRoiBaselines() {
    [roiFields.tech, roiFields.manual, roiFields.spend].forEach((field) => {
      if (field) field.value = "";
    });
    updateRoi();
    roiFields.tech?.focus();
  }

  function buildContactFormPayload() {
    const values = new FormData(form);
    const name = String(values.get("full_name") || "").trim();
    const email = String(values.get("email") || "").trim();
    const phone = String(values.get("phone") || "").trim();
    const company = String(values.get("company") || "").trim();
    const country = String(values.get("country") || "").trim();
    const objective = String(values.get("objective") || "").trim();
    const details = String(values.get("message") || "").trim();
    const attribution = getAttribution();
    const estimate = getRoiEstimate();
    const lines = [
      "Oracle ERP landing page enquiry",
      `Company: ${company}`,
      `Country: ${country}`,
      `Primary objective: ${objective}`,
      `Preferred page language: ${currentLanguage}`,
      "Illustrative ROI calculator (not a quote or guarantee):",
      `Currency: ${estimate.currency}`,
      `Current annual technology run cost: ${Math.round(estimate.techBaseline)}`,
      `Annual manual-work value: ${Math.round(estimate.manualBaseline)}`,
      `Addressable annual procurement spend: ${Math.round(estimate.spendBaseline)}`,
      `Assumptions — technology: ${estimate.techRate}%, capacity: ${estimate.manualRate}%, procurement: ${estimate.spendRate}%`,
      `Potential annual gross value: ${Math.round(estimate.annualValue)}`,
      details ? `Additional details: ${details}` : "Additional details: Not provided",
      ...Object.entries(attribution).map(([key, value]) => `${key}: ${value}`)
    ];

    const payload = new FormData();
    payload.set("_wpcf7", root.dataset.formId || "1062");
    payload.set("_wpcf7_version", root.dataset.formVersion || "6.1.6");
    payload.set("_wpcf7_locale", "en_US");
    payload.set("_wpcf7_unit_tag", `wpcf7-f${root.dataset.formId || "1062"}-o1`);
    payload.set("_wpcf7_container_post", "0");
    payload.set("_wpcf7_posted_data_hash", "");
    payload.set("your-name", name);
    payload.set("email", email);
    payload.set("telephone", phone);
    payload.set("subject", `Oracle ERP consultation — ${company} — ${country}`);
    payload.set("message", lines.join("\n"));
    return payload;
  }

  function loadRecaptcha() {
    if (window.grecaptcha) return Promise.resolve(window.grecaptcha);
    const existing = document.getElementById("guardia-erp-recaptcha");

    return new Promise((resolve, reject) => {
      const timeout = window.setTimeout(() => reject(new Error("reCAPTCHA timed out")), 12000);
      const finish = () => {
        window.clearTimeout(timeout);
        if (window.grecaptcha) resolve(window.grecaptcha);
        else reject(new Error("reCAPTCHA unavailable"));
      };

      if (existing) {
        existing.addEventListener("load", finish, { once: true });
        existing.addEventListener("error", () => reject(new Error("reCAPTCHA failed to load")), { once: true });
        return;
      }

      const script = document.createElement("script");
      script.id = "guardia-erp-recaptcha";
      script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(root.dataset.recaptchaSitekey)}`;
      script.async = true;
      script.defer = true;
      script.addEventListener("load", finish, { once: true });
      script.addEventListener("error", () => reject(new Error("reCAPTCHA failed to load")), { once: true });
      document.head.appendChild(script);
    });
  }

  async function getRecaptchaToken() {
    const recaptcha = await loadRecaptcha();
    return new Promise((resolve, reject) => {
      recaptcha.ready(async () => {
        try {
          const token = await recaptcha.execute(root.dataset.recaptchaSitekey, { action: "contactform" });
          resolve(token);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  async function submitLead(event) {
    event.preventDefault();
    if (!validateStep(2) || submitButton.disabled) return;

    submitButton.disabled = true;
    submitButton.setAttribute("aria-busy", "true");
    submitLabel.textContent = copy[currentLanguage].loading;
    setStatus("", "");

    pushAnalytics("erp_lead_submit_attempt", {
      language: currentLanguage,
      country: form.elements.country?.value || "",
      objective: form.elements.objective?.value || ""
    });

    try {
      const isLocal = !/^https?:$/.test(window.location.protocol) || /^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(window.location.hostname);
      const useApi = !liveHost && !isLocal && root.dataset.leadApi;

      if (useApi) {
        const data = buildContactFormPayload();
        const response = await window.fetch(root.dataset.leadApi, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            name: data.get("your-name"),
            email: data.get("email"),
            phone: data.get("telephone"),
            subject: data.get("subject"),
            message: data.get("message"),
            website: String(new FormData(form).get("website") || "")
          })
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.ok) throw new Error(result.error || `Request failed with ${response.status}`);
        leadSubmitted = true;
        setStatus("success", copy[currentLanguage].success);
        form.reset();
        showStep(1);
        pushAnalytics("erp_lead_submit_success", { language: currentLanguage });
        return;
      }

      if (!liveHost) {
        await new Promise((resolve) => window.setTimeout(resolve, 650));
        setStatus("success", copy[currentLanguage].demo);
        pushAnalytics("erp_lead_demo_validated", { language: currentLanguage });
        return;
      }

      const payload = buildContactFormPayload();
      const token = await getRecaptchaToken();
      payload.set("_wpcf7_recaptcha_response", token);

      const response = await window.fetch(root.dataset.formEndpoint, {
        method: "POST",
        body: payload,
        credentials: "same-origin",
        headers: { Accept: "application/json" }
      });

      if (!response.ok) throw new Error(`Request failed with ${response.status}`);
      const result = await response.json();
      if (result.status !== "mail_sent") {
        throw new Error(result.message || result.status || "Contact form rejected the request");
      }

      leadSubmitted = true;
      setStatus("success", copy[currentLanguage].success);
      form.reset();
      showStep(1);
      pushAnalytics("erp_lead_submit_success", { language: currentLanguage });
    } catch (error) {
      setStatus("error", copy[currentLanguage].error, true);
      pushAnalytics("erp_lead_submit_error", {
        language: currentLanguage,
        message: String(error?.message || "Unknown error").slice(0, 180)
      });
    } finally {
      submitButton.disabled = false;
      submitButton.removeAttribute("aria-busy");
      submitLabel.textContent = submitLabel.dataset[currentLanguage] || submitLabel.dataset.en;
    }
  }

  languageButtons.forEach((button) => {
    button.addEventListener("click", () => setLanguage(button.dataset.language));
  });

  root.querySelectorAll("input, select, textarea").forEach((field) => {
    field.addEventListener("input", () => field.removeAttribute("aria-invalid"));
    field.addEventListener("change", () => field.removeAttribute("aria-invalid"));
  });

  nextButton?.addEventListener("click", () => {
    if (!validateStep(1)) return;
    showStep(2);
    pushAnalytics("erp_lead_step_complete", { step: 1, language: currentLanguage });
  });

  previousButton?.addEventListener("click", () => {
    setStatus("", "");
    showStep(1);
  });

  form?.addEventListener("submit", submitLead);

  Object.values(roiFields).forEach((field) => {
    field?.addEventListener("input", updateRoi);
    field?.addEventListener("change", updateRoi);
  });
  roiExampleButton?.addEventListener("click", setRoiExample);
  roiClearButton?.addEventListener("click", clearRoiBaselines);
  roiCta?.addEventListener("click", () => {
    const estimate = getRoiEstimate();
    pushAnalytics("erp_roi_cta_click", {
      language: currentLanguage,
      currency: estimate.currency,
      annual_value: Math.round(estimate.annualValue)
    });
  });

  root.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
      const target = root.querySelector(anchor.getAttribute("href"));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
      if (anchor.getAttribute("href") === "#g-consultation") {
        pushAnalytics("erp_consultation_cta_click", { language: currentLanguage });
      }
    });
  });

  root.querySelectorAll(".g-accordion details").forEach((details) => {
    details.addEventListener("toggle", () => {
      if (!details.open) return;
      root.querySelectorAll(".g-accordion details").forEach((other) => {
        if (other !== details) other.open = false;
      });
    });
  });


  /* ------------------------------------------------------------------
     Module tabs
  ------------------------------------------------------------------ */
  const tabs = Array.from(root.querySelectorAll("[data-tab]"));
  const panels = Array.from(root.querySelectorAll(".g-tab-panel"));

  function selectTab(index, focus = false) {
    tabs.forEach((tab, i) => {
      const active = i === index;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      if (panels[i]) panels[i].hidden = !active;
      if (active && focus) tab.focus();
    });
    pushAnalytics("erp_module_tab", { module: tabs[index]?.textContent.trim(), language: currentLanguage });
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => selectTab(index));
    tab.addEventListener("keydown", (event) => {
      const rtl = root.dir === "rtl";
      const next = rtl ? "ArrowLeft" : "ArrowRight";
      const previous = rtl ? "ArrowRight" : "ArrowLeft";
      let target = null;
      if (event.key === next || event.key === "ArrowDown") target = (index + 1) % tabs.length;
      if (event.key === previous || event.key === "ArrowUp") target = (index - 1 + tabs.length) % tabs.length;
      if (event.key === "Home") target = 0;
      if (event.key === "End") target = tabs.length - 1;
      if (target === null) return;
      event.preventDefault();
      selectTab(target, true);
    });
  });

  /* ------------------------------------------------------------------
     Savings percentage (single source: data-savings-percent on root)
  ------------------------------------------------------------------ */
  const savingsPercent = `${Number.parseFloat(root.dataset.savingsPercent || "20") || 20}%`;
  root.querySelectorAll("[data-pct]").forEach((element) => { element.textContent = savingsPercent; });

  /* ------------------------------------------------------------------
     Sticky mobile call-to-action bar
  ------------------------------------------------------------------ */
  const sticky = root.querySelector("[data-sticky]");
  if (sticky && "IntersectionObserver" in window) {
    const hidingTargets = [root.querySelector("#g-consultation"), root.querySelector("#g-contact")].filter(Boolean);
    const inView = new Set();
    const stickyLinks = Array.from(sticky.querySelectorAll("a"));
    const syncSticky = () => {
      const visible = inView.size === 0 && window.scrollY > 400;
      sticky.classList.toggle("is-visible", visible);
      sticky.setAttribute("aria-hidden", String(!visible));
      stickyLinks.forEach((link) => { link.tabIndex = visible ? 0 : -1; });
    };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) inView.add(entry.target); else inView.delete(entry.target);
      });
      syncSticky();
    }, { threshold: 0.15 });
    hidingTargets.forEach((target) => observer.observe(target));
    window.addEventListener("scroll", syncSticky, { passive: true });
  }

  /* ------------------------------------------------------------------
     Exit-intent savings popup
     Desktop: pointer leaves through the top of the window.
     Touch: quick scroll back up after reading, or 45s of inactivity.
     Shown once per browser session, never after a lead or while typing.
  ------------------------------------------------------------------ */
  const pop = root.querySelector("[data-pop]");
  const popPanel = pop?.querySelector(".g-pop__panel");
  const popStorageKey = "guardia-erp-exit-popup";
  const pageLoadedAt = Date.now();
  let popOpen = false;
  let popReturnFocus = null;

  function sessionGet(key) {
    try { return window.sessionStorage.getItem(key); } catch (_) { return null; }
  }
  function sessionSet(key, value) {
    try { window.sessionStorage.setItem(key, value); } catch (_) { /* optional */ }
  }

  function userIsFillingForm() {
    return ["#g-full-name", "#g-email", "#g-phone"].some((selector) => root.querySelector(selector)?.value.trim());
  }

  function popAllowed() {
    return Boolean(pop) && !popOpen && !leadSubmitted && !sessionGet(popStorageKey) && !userIsFillingForm();
  }

  function openPop(reason) {
    if (!popAllowed()) return;
    popOpen = true;
    sessionSet(popStorageKey, "1");
    popReturnFocus = document.activeElement;
    pop.hidden = false;
    document.documentElement.style.overflow = "hidden";
    popPanel?.focus({ preventScroll: true });
    pushAnalytics("erp_exit_popup_shown", { reason, language: currentLanguage });
  }

  function closePop(outcome = "dismiss") {
    if (!popOpen) return;
    popOpen = false;
    pop.hidden = true;
    document.documentElement.style.overflow = "";
    if (popReturnFocus && typeof popReturnFocus.focus === "function") popReturnFocus.focus({ preventScroll: true });
    pushAnalytics("erp_exit_popup_closed", { outcome, language: currentLanguage });
  }

  if (pop) {
    pop.querySelectorAll("[data-pop-close]").forEach((element) => element.addEventListener("click", () => closePop("dismiss")));
    pop.querySelectorAll("[data-pop-go]").forEach((element) => element.addEventListener("click", () => closePop("cta")));
    pop.addEventListener("keydown", (event) => {
      if (event.key === "Escape") { event.preventDefault(); closePop("escape"); return; }
      if (event.key !== "Tab") return;
      const focusable = Array.from(pop.querySelectorAll("a[href], button:not([disabled])")).filter((el) => el.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === popPanel)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });

    // Desktop: cursor leaves through the top edge (heading for tabs, address bar or close button).
    document.documentElement.addEventListener("mouseleave", (event) => {
      if (event.clientY <= 0 && Date.now() - pageLoadedAt > 5000) openPop("exit_intent");
    });

    // Touch devices: fast upward scroll after meaningful depth, or long inactivity.
    if (window.matchMedia("(pointer: coarse)").matches) {
      let lastY = window.scrollY;
      let lastTime = Date.now();
      let idleTimer = null;
      const armIdle = () => {
        window.clearTimeout(idleTimer);
        idleTimer = window.setTimeout(() => openPop("inactivity"), 45000);
      };
      window.addEventListener("scroll", () => {
        const now = Date.now();
        const y = window.scrollY;
        const depth = y / Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        const speed = (lastY - y) / Math.max(1, now - lastTime);
        if (speed > 1.4 && depth > 0.3 && now - pageLoadedAt > 8000) openPop("scroll_up");
        lastY = y;
        lastTime = now;
        armIdle();
      }, { passive: true });
      armIdle();
    }

    // Test hook: add ?exitpopup=1 to the URL to open it immediately (ignores the once-per-session limit).
    if (new URLSearchParams(window.location.search).get("exitpopup") === "1") {
      try { window.sessionStorage.removeItem(popStorageKey); } catch (_) { /* optional */ }
      window.setTimeout(() => openPop("preview"), 600);
    }
  }

  if (currentYear) currentYear.textContent = String(new Date().getFullYear());

  const requestedLanguage = new URLSearchParams(window.location.search).get("lang");
  const storedLanguage = safeStorageGet(languageStorageKey);
  const browserLanguage = navigator.language?.toLowerCase().startsWith("ar") ? "ar" : "en";
  setLanguage(requestedLanguage || storedLanguage || browserLanguage, false);
  showStep(1);
})();
