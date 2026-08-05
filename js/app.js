// Rendering, routing (hash-based) and localStorage persistence.
// No network calls for content — everything above is embedded.

const STORAGE_KEYS = {
  packing: "taylorUsa2026.packing",
  packingCustom: "taylorUsa2026.packingCustom",
  bucket: "taylorUsa2026.bucket",
  notes: "taylorUsa2026.notes",
};

const app = document.getElementById("app");
const drawer = document.getElementById("drawer");
const overlay = document.getElementById("overlay");
const menuBtn = document.getElementById("menuBtn");

// Transient (not persisted) — which note fields currently show their textarea.
const editingNotes = new Set();

// ---------- Storage helpers ----------

function loadState(key, fallback = {}) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function saveState(key, state) {
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch (e) {
    // storage unavailable (private mode / full) — fail silently, UI still works this session
  }
}

// ---------- Date helpers ----------

function parseDate(str) {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function today() {
  const t = new Date();
  return new Date(t.getFullYear(), t.getMonth(), t.getDate());
}

function legStatus(leg) {
  const now = today();
  const start = parseDate(leg.start);
  const end = parseDate(leg.end);
  if (now < start) return "upcoming";
  if (now > end) return "done";
  return "current";
}

function nextOrCurrentLegId() {
  const now = today();
  const current = LEGS.find((l) => legStatus(l) === "current");
  if (current) return current.id;
  const upcoming = LEGS.filter((l) => legStatus(l) === "upcoming").sort(
    (a, b) => parseDate(a.start) - parseDate(b.start)
  );
  if (upcoming.length) return upcoming[0].id;
  return LEGS[LEGS.length - 1].id;
}

function formatCountdown() {
  const now = today();
  const start = parseDate(TRIP.start);
  const end = parseDate(TRIP.end);
  const dayMs = 24 * 60 * 60 * 1000;
  if (now < start) {
    const days = Math.round((start - now) / dayMs);
    return days === 1 ? "Departs tomorrow" : `${days} days until departure`;
  }
  if (now > end) return "Trip complete";
  const days = Math.round((end - now) / dayMs);
  return days === 0 ? "Final day — flies home today" : `On the trip · ${days} day${days === 1 ? "" : "s"} to go`;
}

// ---------- Small render helpers ----------

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k === "html") node.innerHTML = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  }
  (Array.isArray(children) ? children : [children]).forEach((c) => {
    if (c === null || c === undefined) return;
    node.append(c.nodeType ? c : document.createTextNode(c));
  });
  return node;
}

function mapsUrl(query) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;
}

function mapPinIcon() {
  return el("span", {
    class: "pin-icon",
    "aria-hidden": "true",
    html:
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
  });
}

function directionsLink(query, label = "Get directions") {
  return el(
    "a",
    { href: mapsUrl(query), class: "directions-link", target: "_blank", rel: "noopener" },
    [mapPinIcon(), label]
  );
}

function placeholderRow(label) {
  return el("div", { class: "placeholder-row" }, [
    el("span", { class: "placeholder-label" }, label),
    el("span", { class: "placeholder-badge" }, "Details to follow"),
  ]);
}

function renderNoteField(key, placeholderText = "Add a note…") {
  const notes = loadState(STORAGE_KEYS.notes);
  const existing = notes[key] || "";
  const isEditing = editingNotes.has(key);

  if (isEditing) {
    const textarea = el("textarea", {
      class: "note-field-input",
      placeholder: placeholderText,
      rows: "2",
    });
    textarea.value = existing;
    const save = () => {
      const val = textarea.value.trim();
      const all = loadState(STORAGE_KEYS.notes);
      if (val) all[key] = val;
      else delete all[key];
      saveState(STORAGE_KEYS.notes, all);
      editingNotes.delete(key);
      render();
    };
    const saveBtn = el("button", { class: "note-field-save", type: "button", onclick: save }, "Save");
    const cancelBtn = el(
      "button",
      {
        class: "note-field-cancel",
        type: "button",
        onclick: () => {
          editingNotes.delete(key);
          render();
        },
      },
      "Cancel"
    );
    return el("div", { class: "note-field note-field--editing" }, [
      textarea,
      el("div", { class: "note-field-actions" }, [saveBtn, cancelBtn]),
    ]);
  }

  if (existing) {
    return el("div", { class: "note-field note-field--saved" }, [
      el("p", { class: "note-field-text" }, existing),
      el(
        "button",
        {
          class: "note-field-edit",
          type: "button",
          onclick: () => {
            editingNotes.add(key);
            render();
          },
        },
        "Edit note"
      ),
    ]);
  }

  return el(
    "button",
    {
      class: "note-field-add",
      type: "button",
      onclick: () => {
        editingNotes.add(key);
        render();
      },
    },
    "+ Add a note"
  );
}

function card(children, extraClass = "") {
  return el("section", { class: `card ${extraClass}`.trim() }, children);
}

function sectionHeading(text) {
  return el("h2", { class: "section-heading" }, text);
}

function pageHeader(title, subtitle) {
  const children = [el("h1", { class: "page-title" }, title)];
  if (subtitle) children.push(el("p", { class: "page-subtitle" }, subtitle));
  return el("div", { class: "page-header" }, children);
}

// ---------- Home ----------

function renderMumNote() {
  return el("div", { class: "note-card" }, [
    el("p", { class: "note-card-label" }, MUM_NOTE.from),
    el("p", { class: "note-card-body" }, MUM_NOTE.body),
  ]);
}

function renderHome() {
  const wrap = el("div", { class: "view" });
  wrap.append(
    pageHeader(TRIP.name, `${formatDateRange(TRIP.start, TRIP.end)} · Based in ${TRIP.base}`)
  );

  wrap.append(renderMumNote());

  const status = el("div", { class: "status-banner" }, formatCountdown());
  wrap.append(status);

  wrap.append(sectionHeading("Trip Legs"));
  const grid = el("div", { class: "leg-grid" });
  const highlightId = nextOrCurrentLegId();
  LEGS.forEach((leg) => {
    const status = legStatus(leg);
    const isHighlight = leg.id === highlightId;
    const tag =
      status === "current" ? "Current" : status === "done" ? "Completed" : isHighlight ? "Next" : "Upcoming";
    const a = el(
      "a",
      { href: `#${leg.id}`, class: `leg-card ${isHighlight ? "leg-card--highlight" : ""} leg-card--${status}` },
      [
        el("div", { class: "leg-card-top" }, [
          el("span", { class: "leg-card-order" }, `Leg ${leg.order}`),
          el("span", { class: `leg-tag leg-tag--${status}` }, tag),
        ]),
        el("h3", { class: "leg-card-title" }, leg.title),
        el("p", { class: "leg-card-meta" }, leg.dateLabel),
      ]
    );
    grid.append(a);
  });
  wrap.append(grid);

  wrap.append(sectionHeading("Trip Info"));
  const quick = el("div", { class: "quick-grid" }, [
    quickLink("#packing", "Packing List", "Interactive checklist"),
    quickLink("#info", "Useful Information", "Emergency, currency, tipping & more"),
    quickLink("#bucket", "Texas Bucket List", "Things to do & see"),
    quickLink("#flights", "Flights", "Awaiting documentation"),
  ]);
  wrap.append(quick);

  return wrap;
}

function quickLink(href, title, subtitle) {
  return el("a", { href, class: "quick-card" }, [
    el("h3", { class: "quick-card-title" }, title),
    el("p", { class: "quick-card-sub" }, subtitle),
  ]);
}

function formatDateRange(startStr, endStr) {
  const start = parseDate(startStr);
  const end = parseDate(endStr);
  const opts = { day: "numeric", month: "long" };
  const startFmt = start.toLocaleDateString("en-NZ", opts);
  const endFmt = end.toLocaleDateString("en-NZ", { ...opts, year: "numeric" });
  return `${startFmt} – ${endFmt}`;
}

// ---------- Leg page ----------

function renderLeg(leg) {
  const wrap = el("div", { class: "view" });
  wrap.append(pageHeader(`Leg ${leg.order} · ${leg.title}`, leg.dateLabel));

  const status = legStatus(leg);
  if (status === "current") {
    wrap.append(el("div", { class: "status-banner status-banner--current" }, "You're here now"));
  }

  // Accommodation card
  const p = leg.property;
  const accomChildren = [sectionHeadingInline(p.name)];

  const infoRows = [];
  if (p.checkIn) infoRows.push(infoRow("Check-in", p.checkIn));
  if (p.checkOut) infoRows.push(infoRow("Check-out", p.checkOut));
  if (p.minAge) infoRows.push(infoRow("Minimum check-in age", String(p.minAge)));
  if (p.room) infoRows.push(infoRow("Room", p.room));
  if (p.cost) infoRows.push(infoRow("Cost", p.cost));
  if (p.cancellation) infoRows.push(infoRow("Cancellation", p.cancellation));
  accomChildren.push(el("div", { class: "info-rows" }, infoRows));

  // Address
  if (p.address) {
    if (p.address.exact) {
      accomChildren.push(infoRow("Address", p.address.exact));
      accomChildren.push(directionsLink(p.address.exact));
    } else {
      accomChildren.push(placeholderRow(p.address.area ? `Address (${p.address.area})` : "Address"));
      if (p.address.area) {
        accomChildren.push(directionsLink(`${p.address.area}, ${leg.location}`, "View area on map"));
      }
      accomChildren.push(renderNoteField(`${leg.id}-address`, "Paste the full address here once you have it"));
    }
  }

  // Confirmation
  if (p.confirmation) {
    accomChildren.push(infoRow("Confirmation number", p.confirmation));
  } else {
    accomChildren.push(placeholderRow("Confirmation number"));
    if (p.confirmationNote) {
      accomChildren.push(el("p", { class: "note-text" }, p.confirmationNote));
    }
    accomChildren.push(
      renderNoteField(`${leg.id}-confirmation`, "Jot the confirmation number here once you have it")
    );
  }

  if (p.checkInMethod) {
    accomChildren.push(el("div", { class: "flag-box" }, [
      el("strong", {}, "Check-in method: "),
      p.checkInMethod,
    ]));
  }
  if (p.checkInFlag) {
    accomChildren.push(el("div", { class: "flag-box flag-box--action" }, [
      el("strong", {}, "Action needed: "),
      p.checkInFlag,
    ]));
  }
  if (p.transfers) {
    accomChildren.push(el("p", { class: "note-text" }, p.transfers));
  }

  wrap.append(card(accomChildren));

  // Event flag (Austin)
  if (leg.eventFlag) {
    wrap.append(
      card(
        [
          el("div", { class: "event-flag" }, [
            el("span", { class: "event-flag-icon" }, "🎟"),
            el("div", {}, [
              el("strong", {}, leg.eventFlag.name),
              el("p", { class: "note-text" }, leg.eventFlag.dates),
            ]),
          ]),
          directionsLink(`Moody Center, ${leg.location}`, "Get directions to Moody Center"),
        ],
        "card--accent"
      )
    );
  }

  // Local contact (Austin)
  if (leg.localContact) {
    const c = leg.localContact;
    wrap.append(
      card([
        sectionHeadingInline("Local Contact"),
        el("p", { class: "contact-name" }, `${c.name} (“${c.nickname}”)`),
        el("p", { class: "note-text" }, c.context),
        el("div", { class: "info-rows" }, [
          infoRow("WhatsApp", c.whatsapp),
          infoRow("Instagram", c.instagram),
        ]),
      ])
    );
  }

  // About this space
  if (leg.about) {
    wrap.append(card([sectionHeadingInline("About this space"), el("p", { class: "about-text" }, leg.about)]));
  }

  // Amenities
  if (leg.amenities) {
    wrap.append(
      card([
        sectionHeadingInline("Amenities"),
        el(
          "ul",
          { class: "amenity-grid" },
          leg.amenities.map((a) => el("li", { class: "amenity-item" }, [el("span", { class: "dot" }, "•"), a]))
        ),
      ])
    );
  }

  // Place groups (attractions, dining, shopping)
  if (leg.placeGroups) {
    leg.placeGroups.forEach((group) => {
      wrap.append(
        card([
          sectionHeadingInline(group.heading),
          el(
            "ul",
            { class: "place-list" },
            group.places.map((place) => {
              const query = `${place.name.replace(/\s*\([^)]*\)\s*/g, "").trim()}, ${leg.location}`;
              return el(
                "li",
                {},
                el("a", { href: mapsUrl(query), class: "place-item", target: "_blank", rel: "noopener" }, [
                  el("span", { class: "place-name" }, place.name),
                  el("span", { class: "place-time" }, [place.time, mapPinIcon()]),
                ])
              );
            })
          ),
        ])
      );
    });
  }

  // House rules
  if (leg.houseRules) {
    wrap.append(
      card(
        [
          sectionHeadingInline("House Rules"),
          el(
            "ul",
            { class: "rules-list" },
            leg.houseRules.map((r) => el("li", {}, r))
          ),
        ],
        "card--muted"
      )
    );
  }

  // Work schedule
  if (leg.workSchedule) {
    const ws = leg.workSchedule;
    const timeline = el("ul", { class: "timeline" });
    ws.confirmed.forEach((s) => {
      timeline.append(
        el("li", { class: "timeline-item timeline-item--confirmed" }, [
          el("span", { class: "timeline-date" }, formatShortDate(s.date)),
          el("span", { class: "timeline-label" }, s.label),
        ])
      );
    });
    ws.structure.forEach((s) => {
      timeline.append(
        el("li", { class: "timeline-item timeline-item--tbc" }, [
          el("span", { class: "timeline-date" }, "TBC"),
          el("span", { class: "timeline-label" }, s),
        ])
      );
    });
    wrap.append(
      card([sectionHeadingInline("Work Schedule"), timeline, el("p", { class: "note-text" }, ws.note)])
    );
  }

  return wrap;
}

function sectionHeadingInline(text) {
  return el("h2", { class: "card-heading" }, text);
}

function infoRow(label, value) {
  return el("div", { class: "info-row" }, [
    el("span", { class: "info-label" }, label),
    el("span", { class: "info-value" }, value),
  ]);
}

function formatShortDate(str) {
  return parseDate(str).toLocaleDateString("en-NZ", { day: "numeric", month: "short" });
}

// ---------- Packing List ----------

function renderCustomPackingSection(state, customItems) {
  const list = el("ul", { class: "checklist" });

  customItems.forEach((item) => {
    const key = `Custom::${item.id}`;
    const isChecked = !!state[key];
    const li = el("li", { class: `checklist-item ${isChecked ? "checklist-item--checked" : ""}` });
    const box = el("span", { class: "checkbox", "aria-hidden": "true" });
    const label = el("span", { class: "checklist-label" }, item.text);
    li.append(box, label);
    li.addEventListener("click", () => {
      state[key] = !state[key];
      saveState(STORAGE_KEYS.packing, state);
      render();
    });

    const del = el(
      "button",
      { class: "checklist-delete", type: "button", "aria-label": `Remove ${item.text}` },
      "×"
    );
    del.addEventListener("click", (e) => {
      e.stopPropagation();
      const remaining = loadState(STORAGE_KEYS.packingCustom, []).filter((i) => i.id !== item.id);
      saveState(STORAGE_KEYS.packingCustom, remaining);
      delete state[key];
      saveState(STORAGE_KEYS.packing, state);
      render();
    });
    li.append(del);
    list.append(li);
  });

  const input = el("input", {
    type: "text",
    class: "add-item-input",
    placeholder: "Add an item…",
    maxlength: "60",
  });
  const form = el("form", { class: "add-item-form" }, [
    input,
    el("button", { class: "add-item-btn", type: "submit" }, "Add"),
  ]);
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    const items = loadState(STORAGE_KEYS.packingCustom, []);
    items.push({ id: `c${Date.now()}${Math.random().toString(36).slice(2, 6)}`, text });
    saveState(STORAGE_KEYS.packingCustom, items);
    render();
  });

  return card([
    sectionHeadingInline("Your Additions"),
    customItems.length ? list : el("p", { class: "note-text" }, "Add anything that's not already on the list."),
    form,
  ]);
}

function renderPacking() {
  const wrap = el("div", { class: "view" });
  wrap.append(pageHeader("Packing List", "Tap items as you pack. Saved automatically on this device."));

  const state = loadState(STORAGE_KEYS.packing);
  const customItems = loadState(STORAGE_KEYS.packingCustom, []);
  let total = 0;
  let checked = 0;

  const progressEl = el("div", { class: "progress-banner" });
  wrap.append(progressEl);

  PACKING_LIST.forEach((group) => {
    if (group.note) {
      wrap.append(
        card([
          sectionHeadingInline(group.category),
          el("p", { class: "note-text" }, group.note),
        ])
      );
      return;
    }
    const list = el("ul", { class: "checklist" });
    group.items.forEach((item) => {
      const key = `${group.category}::${item}`;
      total += 1;
      const isChecked = !!state[key];
      if (isChecked) checked += 1;

      const li = el("li", { class: `checklist-item ${isChecked ? "checklist-item--checked" : ""}` });
      const box = el("span", { class: "checkbox", "aria-hidden": "true" });
      const label = el("span", { class: "checklist-label" }, item);
      li.append(box, label);
      li.addEventListener("click", () => {
        state[key] = !state[key];
        saveState(STORAGE_KEYS.packing, state);
        render(); // re-render current route to refresh counts
      });
      list.append(li);
    });
    wrap.append(card([sectionHeadingInline(group.category), list]));
  });

  customItems.forEach((item) => {
    total += 1;
    if (state[`Custom::${item.id}`]) checked += 1;
  });
  wrap.append(renderCustomPackingSection(state, customItems));

  progressEl.textContent = `${checked} of ${total} packed`;

  return wrap;
}

// ---------- Useful Information ----------

function linkArrowIcon() {
  return el("span", {
    class: "link-arrow",
    "aria-hidden": "true",
    html:
      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg>',
  });
}

function renderInfoItem(item) {
  if (typeof item === "string") return el("li", {}, item);
  if (!item.url) return el("li", {}, item.text);
  const isTel = item.url.startsWith("tel:");
  const attrs = { href: item.url, class: "info-link" };
  if (!isTel) {
    attrs.target = "_blank";
    attrs.rel = "noopener";
  }
  return el("li", {}, el("a", attrs, [el("span", {}, item.text), linkArrowIcon()]));
}

function renderInfo() {
  const wrap = el("div", { class: "view" });
  wrap.append(pageHeader("Useful Information", "Reference details for the trip."));

  USEFUL_INFO.forEach((section) => {
    wrap.append(
      card([
        sectionHeadingInline(section.heading),
        el("ul", { class: "plain-list" }, section.items.map(renderInfoItem)),
      ])
    );
  });

  return wrap;
}

// ---------- Texas Bucket List ----------

function renderBucket() {
  const wrap = el("div", { class: "view" });
  wrap.append(pageHeader("Texas Bucket List", "Things to see and do."));

  const state = loadState(STORAGE_KEYS.bucket);
  const list = el("ul", { class: "checklist" });
  let checked = 0;

  BUCKET_LIST.forEach((item, idx) => {
    const key = `item-${idx}`;
    const isChecked = !!state[key];
    if (isChecked) checked += 1;
    const li = el("li", { class: `checklist-item ${isChecked ? "checklist-item--checked" : ""}` });
    const box = el("span", { class: "checkbox", "aria-hidden": "true" });
    const label = el("span", { class: "checklist-label" }, item.text);
    li.append(box, label);
    li.addEventListener("click", () => {
      state[key] = !state[key];
      saveState(STORAGE_KEYS.bucket, state);
      render();
    });
    if (item.map) {
      const pin = el("a", {
        href: mapsUrl(item.map),
        class: "bucket-pin",
        target: "_blank",
        rel: "noopener",
        "aria-label": `Get directions to ${item.text}`,
      }, mapPinIcon());
      pin.addEventListener("click", (e) => e.stopPropagation());
      li.append(pin);
    }
    list.append(li);
  });

  const progressEl = el("div", { class: "progress-banner" }, `${checked} of ${BUCKET_LIST.length} done`);
  wrap.append(progressEl);
  wrap.append(card([list]));

  return wrap;
}

// ---------- Flights ----------

function renderFlights() {
  const wrap = el("div", { class: "view" });
  wrap.append(pageHeader("Flights", "Awaiting documentation."));

  wrap.append(
    card(
      [
        el("p", { class: "empty-state-text" }, [
          "Flight itinerary has not yet been reviewed. This section will be populated once booking details are confirmed. No flight numbers, times or references have been invented.",
        ]),
        sectionHeadingInline("Will include"),
        el(
          "ul",
          { class: "plain-list" },
          FLIGHT_FIELDS.map((f) => el("li", {}, f))
        ),
      ],
      "card--muted"
    )
  );

  wrap.append(
    card([
      sectionHeadingInline("Notes"),
      renderNoteField("flights-general", "Jot down flight details here once you have them"),
    ])
  );

  return wrap;
}

// ---------- Routing ----------

const ROUTES = {
  home: renderHome,
  packing: renderPacking,
  info: renderInfo,
  bucket: renderBucket,
  flights: renderFlights,
};

function buildFooter() {
  return el("footer", { class: "app-footer" }, FOOTER_TEXT);
}

function render() {
  const hash = (location.hash || "#home").slice(1);
  let view;

  const leg = LEGS.find((l) => l.id === hash);
  if (leg) {
    view = renderLeg(leg);
  } else if (ROUTES[hash]) {
    view = ROUTES[hash]();
  } else {
    view = renderHome();
  }

  app.replaceChildren(view, buildFooter());
  window.scrollTo(0, 0);
  closeDrawer();
  updateActiveLink(hash);
}

function updateActiveLink(hash) {
  document.querySelectorAll(".drawer-link").forEach((link) => {
    const isActive = link.getAttribute("href") === `#${hash}`;
    link.classList.toggle("drawer-link--active", isActive);
  });
}

// ---------- Drawer ----------

function openDrawer() {
  drawer.classList.add("drawer--open");
  overlay.classList.add("overlay--visible");
  menuBtn.setAttribute("aria-expanded", "true");
}

function closeDrawer() {
  drawer.classList.remove("drawer--open");
  overlay.classList.remove("overlay--visible");
  menuBtn.setAttribute("aria-expanded", "false");
}

menuBtn.addEventListener("click", () => {
  if (drawer.classList.contains("drawer--open")) closeDrawer();
  else openDrawer();
});
overlay.addEventListener("click", closeDrawer);

window.addEventListener("hashchange", render);
window.addEventListener("DOMContentLoaded", render);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
