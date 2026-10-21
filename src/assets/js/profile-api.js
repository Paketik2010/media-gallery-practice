(() => {
  if (!window.MG || MG.page !== "profile.html") return;

  const STORAGE_LIMIT = 10 * 1024 * 1024 * 1024;

  function clean(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function formatBytes(bytes) {
    const value = Math.max(0, Number(bytes || 0));

    if (value < 1024) return value + " Б";
    if (value < 1024 * 1024) return (value / 1024).toFixed(1) + " КБ";
    if (value < 1024 * 1024 * 1024) return (value / 1024 / 1024).toFixed(1) + " МБ";

    return (value / 1024 / 1024 / 1024).toFixed(2) + " ГБ";
  }

  function formatPercent(value) {
    const n = Math.max(0, Math.min(100, Number(value || 0)));

    if (n === 0 || n === 100) return String(Math.round(n));
    if (n > 0 && n < 0.01) return "<0.01";
    if (n < 1) return n.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
    if (n < 10) return n.toFixed(1).replace(/\.0$/, "");

    return String(Math.round(n));
  }

  function updateText(scope, user) {
    scope.querySelectorAll("h1,h2,h3,p,span").forEach((node) => {
      const text = node.textContent.trim();

      if (text === "Алексей Смирнов") node.textContent = user.name;
      if (text === "@alex_smirnov") node.textContent = "@" + user.username;
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) node.textContent = user.email;
    });
  }

  function metricCard(scope, labelText) {
    const label = [...scope.querySelectorAll("span")].find((node) => {
      return clean(node.textContent) === labelText;
    });

    if (!label) return null;

    return label.closest(".bg-surface-container-lowest");
  }

  function setMetric(scope, labelText, value) {
    const card = metricCard(scope, labelText);
    const count = card?.querySelector(".font-headline-lg, .font-headline-sm");

    if (count) count.textContent = value;
  }

  function setProgress(card, percent) {
    if (!card) return;

    const track = [...card.querySelectorAll("div")].find((node) => {
      const classes = node.className || "";
      return typeof classes === "string" &&
        classes.includes("rounded-full") &&
        (classes.includes("h-1.5") || classes.includes("h-2")) &&
        node.firstElementChild;
    });

    const fill = track?.firstElementChild;
    if (fill) {
      const real = Math.max(0, Math.min(100, percent));
      const visible = real > 0 ? Math.max(0.5, real) : 0;
      fill.style.width = visible + "%";
    }
  }

  function updateCounters(scope, materials) {
    const total = materials.length;
    const images = materials.filter((item) => item.type === "image").length;
    const videos = materials.filter((item) => item.type === "video").length;
    const audio = materials.filter((item) => item.type === "audio").length;
    const imagePercent = total ? images / total * 100 : 0;
    const videoPercent = total ? videos / total * 100 : 0;
    const audioPercent = total ? audio / total * 100 : 0;
    const used = materials.reduce((sum, item) => sum + Number(item.sizeBytes || 0), 0);
    const storagePercent = Math.min(100, used / STORAGE_LIMIT * 100);
    const available = Math.max(0, STORAGE_LIMIT - used);

    setMetric(scope, "Всего материалов", total);
    setMetric(scope, "Всего файлов", total);
    setMetric(scope, "Изображений", images);
    setMetric(scope, "Изображения", images);
    setMetric(scope, "Видео", videos);
    setMetric(scope, "Аудио / Хранилище", audio);
    setMetric(scope, "Аудио", audio);

    const totalCard = metricCard(scope, "Всего материалов");
    const imageCard = metricCard(scope, "Изображений");
    const videoCard = metricCard(scope, "Видео");
    const audioStorageCard = metricCard(scope, "Аудио / Хранилище");

    setProgress(totalCard, total ? 100 : 0);
    setProgress(imageCard, imagePercent);
    setProgress(videoCard, videoPercent);
    setProgress(audioStorageCard, storagePercent);

    if (totalCard) {
      const text = totalCard.querySelector("p.font-body-sm");
      if (text) text.textContent = total ? "100% всех ваших материалов" : "Материалов пока нет";
    }

    if (imageCard) {
      const text = imageCard.querySelector("p.font-body-sm");
      if (text) text.textContent = formatPercent(imagePercent) + "% от всей галереи";
    }

    if (videoCard) {
      const text = videoCard.querySelector("p.font-body-sm");
      if (text) text.textContent = formatPercent(videoPercent) + "% от всей галереи";
    }

    if (audioStorageCard) {
      const line = audioStorageCard.querySelector("p.font-body-sm");
      const spans = line?.querySelectorAll("span");

      if (spans?.[0]) spans[0].textContent = formatBytes(used) + " из 10 ГБ";
      if (spans?.[1]) spans[1].textContent = formatPercent(storagePercent) + "%";
    }

    scope.querySelectorAll("span,p").forEach((node) => {
      const text = clean(node.textContent);

      if (/^Хранилище заполнено на\s+\d/.test(text)) {
        node.textContent = "Хранилище заполнено на " + formatPercent(storagePercent) + "%";
      }

      if (/^1[.,]8\s*ГБ из 10 ГБ$/i.test(text) || /из 10 ГБ$/i.test(text) && text.includes("ГБ")) {
        node.textContent = formatBytes(used) + " из 10 ГБ";
      }

      if (/^Заполнено на\s+\d/.test(text)) {
        node.textContent = "Заполнено на " + formatPercent(storagePercent) + "%";
      }

      if (/^Доступно\s+/i.test(text)) {
        node.textContent = "Доступно " + formatBytes(available);
      }
    });

    const mobileStorageTitle = [...scope.querySelectorAll("span")].find((node) => {
      return clean(node.textContent) === "Хранилище";
    });
    const mobileStorageCard = mobileStorageTitle?.closest(".bg-surface-container-low");
    setProgress(mobileStorageCard, storagePercent);

    const mobileMetricInfo = {
      "Всего файлов": total ? "100% медиатеки" : "Медиатека пуста",
      "Изображения": formatPercent(imagePercent) + "% медиатеки",
      "Видео": formatPercent(videoPercent) + "% медиатеки",
      "Аудио": formatPercent(audioPercent) + "% медиатеки"
    };

    Object.entries(mobileMetricInfo).forEach(([labelText, text]) => {
      const label = [...scope.querySelectorAll("span")].find((node) => clean(node.textContent) === labelText);
      const card = label?.closest(".bg-surface-container-lowest");
      const sub = card?.querySelector(".font-body-sm");
      if (sub) sub.textContent = text;
    });

    const title = [...scope.querySelectorAll("h2")].find((node) => {
      return clean(node.textContent) === "Мои материалы";
    });

    if (title) {
      const badge = title.parentElement?.querySelector("span");
      if (badge) {
        badge.textContent = badge.textContent.includes("(") ? "(" + total + ")" : String(total);
      }
    }

    scope.querySelectorAll("button").forEach((button) => {
      const text = clean(button.textContent);

      if (/^Все\s*\(/.test(text)) button.textContent = "Все (" + total + ")";
      if (/^Изображения\s*\(/.test(text)) button.textContent = "Изображения (" + images + ")";
      if (/^Видео\s*\(/.test(text)) button.textContent = "Видео (" + videos + ")";
      if (/^Аудио\s*\(/.test(text)) button.textContent = "Аудио (" + audio + ")";
    });
  }

  function paginationUi(scope) {
    const status = [...scope.querySelectorAll("p,span")].find((node) => {
      return /^Показано\s+/i.test(clean(node.textContent));
    });

    if (!status) return null;

    const root = status.parentElement;
    if (!root) return null;

    let numeric = [...root.querySelectorAll("div")].find((node) => {
      const text = clean(node.textContent);
      return node.querySelectorAll("button").length >= 2 &&
        (text.includes("1") || node.querySelector(".material-symbols-outlined"));
    });

    if (!numeric) {
      numeric = document.createElement("div");
      numeric.className = "flex items-center gap-1.5";
      root.appendChild(numeric);
    }

    const loadMore = [...root.querySelectorAll("button")].find((button) => {
      return clean(button.textContent) === "Показать еще";
    }) || null;

    return { status, numeric, loadMore };
  }

  function setupFilters(scope) {
    const search = scope.querySelector('input[placeholder="Поиск по моим файлам..."]');
    const buttons = [...scope.querySelectorAll("button")].filter((button) => {
      return /^(Все|Изображения|Видео|Аудио)\s*\(/.test(clean(button.textContent));
    });
    const cards = [...scope.querySelectorAll(".mg-card")];
    const container = cards[0]?.parentElement || null;
    const pageSize = scope.classList.contains("mobile-view") ? 4 : 6;
    const ui = paginationUi(scope);
    const desktopSort = scope.querySelector("select");
    const clearButton = search?.parentElement?.querySelector('button[aria-label="Очистить"]') || null;
    const mobileSortButton = !desktopSort
      ? [...scope.querySelectorAll("button")].find((button) => {
          return clean(button.textContent).startsWith("Сначала новые");
        }) || null
      : null;

    let type = "";
    let currentPage = 1;
    let sortMode = desktopSort?.value || "newest";

    function cardDate(card) {
      const raw = card.dataset.materialCreated || "";
      const parsed = Date.parse(raw.replace(" ", "T"));
      return Number.isFinite(parsed) ? parsed : Number(card.dataset.materialId || 0);
    }

    function matchedAndSortedCards() {
      const query = (search?.value || "").trim().toLocaleLowerCase("ru-RU");

      const matched = cards.filter((card) => {
        const cardType = card.dataset.materialType || "";
        const text = (card.dataset.mgSearchText || card.textContent || "").toLocaleLowerCase("ru-RU");

        return (!type || cardType === type) && (!query || text.includes(query));
      });

      matched.sort((a, b) => {
        if (sortMode === "views") {
          return Number(b.dataset.materialViews || 0) - Number(a.dataset.materialViews || 0) ||
            cardDate(b) - cardDate(a);
        }

        if (sortMode === "likes") {
          return Number(b.dataset.materialLikes || 0) - Number(a.dataset.materialLikes || 0) ||
            cardDate(b) - cardDate(a);
        }

        if (sortMode === "title") {
          const aTitle = clean(a.querySelector(".mg-card__title")?.textContent);
          const bTitle = clean(b.querySelector(".mg-card__title")?.textContent);
          return aTitle.localeCompare(bTitle, "ru", { sensitivity: "base" });
        }

        return cardDate(b) - cardDate(a);
      });

      return matched;
    }

    function goToPage(page) {
      currentPage = page;
      apply();
    }

    function renderPagination(total) {
      if (!ui) return;

      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      currentPage = Math.max(1, Math.min(currentPage, totalPages));

      const start = total ? (currentPage - 1) * pageSize + 1 : 0;
      const end = total ? Math.min(currentPage * pageSize, total) : 0;
      ui.status.textContent = "Показано " + start + (start !== end ? "–" + end : "") + " из " + total + " материалов";

      const base = scope.classList.contains("mobile-view")
        ? "w-9 h-9 rounded-lg bg-surface-container-lowest text-on-surface flex items-center justify-center shadow-sm"
        : "w-9 h-9 rounded-xl bg-surface-container-lowest text-on-surface-variant hover:text-on-surface hover:bg-surface-container font-label-md text-label-md flex items-center justify-center shadow-xs transition-colors";
      const active = scope.classList.contains("mobile-view")
        ? "w-9 h-9 rounded-lg bg-primary text-on-primary font-label-md text-label-md flex items-center justify-center shadow-sm"
        : "w-9 h-9 rounded-xl bg-primary-container text-on-primary font-label-md text-label-md font-semibold flex items-center justify-center shadow-xs";

      ui.numeric.innerHTML = "";

      const prev = document.createElement("button");
      prev.type = "button";
      prev.className = base + (currentPage === 1 ? " opacity-40 cursor-not-allowed" : "");
      prev.disabled = currentPage === 1;
      prev.innerHTML = '<span class="material-symbols-outlined text-[18px]">chevron_left</span>';
      prev.addEventListener("click", () => goToPage(currentPage - 1));
      ui.numeric.appendChild(prev);

      const from = Math.max(1, Math.min(currentPage - 2, Math.max(1, totalPages - 4)));
      const to = Math.min(totalPages, from + 4);

      for (let page = from; page <= to; page += 1) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = page === currentPage ? active : base;
        button.textContent = page;
        button.addEventListener("click", () => goToPage(page));
        ui.numeric.appendChild(button);
      }

      const next = document.createElement("button");
      next.type = "button";
      next.className = base + (currentPage === totalPages ? " opacity-40 cursor-not-allowed" : "");
      next.disabled = currentPage === totalPages;
      next.innerHTML = '<span class="material-symbols-outlined text-[18px]">chevron_right</span>';
      next.addEventListener("click", () => goToPage(currentPage + 1));
      ui.numeric.appendChild(next);

      if (ui.loadMore) {
        ui.loadMore.hidden = currentPage >= totalPages;
        ui.loadMore.onclick = () => goToPage(Math.min(totalPages, currentPage + 1));
      }
    }

    function apply() {
      const matched = matchedAndSortedCards();

      if (container) {
        matched.forEach((card) => container.appendChild(card));
        cards.filter((card) => !matched.includes(card)).forEach((card) => container.appendChild(card));
      }

      const start = (currentPage - 1) * pageSize;
      const pageCards = new Set(matched.slice(start, start + pageSize));

      cards.forEach((card) => {
        const visible = pageCards.has(card);
        card.hidden = !visible;
        card.style.setProperty("display", visible ? "flex" : "none", "important");
      });

      renderPagination(matched.length);
    }

    function syncSearchClear() {
      if (!clearButton || !search) return;
      clearButton.classList.toggle("hidden", !search.value.trim());
    }

    search?.addEventListener("input", () => {
      currentPage = 1;
      syncSearchClear();
      apply();
    });

    clearButton?.addEventListener("click", () => {
      if (!search) return;
      search.value = "";
      currentPage = 1;
      syncSearchClear();
      apply();
      search.focus();
    });

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const text = clean(button.textContent);

        type =
          text.startsWith("Изображения") ? "image" :
          text.startsWith("Видео") ? "video" :
          text.startsWith("Аудио") ? "audio" :
          "";

        buttons.forEach((item) => {
          item.style.opacity = item === button ? "1" : ".72";
        });

        currentPage = 1;
        apply();
      });
    });

    desktopSort?.addEventListener("change", () => {
      sortMode = desktopSort.value || "newest";
      currentPage = 1;
      apply();
    });

    if (mobileSortButton) {
      const sortLabels = {
        newest: "Сначала новые",
        views: "По просмотрам",
        likes: "По лайкам",
        title: "По алфавиту"
      };

      const host = mobileSortButton.parentElement;
      if (host) {
        host.classList.add("relative");

        const menu = document.createElement("div");
        menu.hidden = true;
        menu.className = "absolute left-0 top-full mt-1 z-40 min-w-[170px] p-1.5 rounded-xl bg-surface-container-lowest shadow-lg border border-outline-variant/30";
        menu.innerHTML = Object.entries(sortLabels).map(([value, label]) => {
          return '<button type="button" data-profile-sort="' + value + '" class="w-full px-3 py-2 rounded-lg text-left font-label-md text-label-md text-on-surface hover:bg-surface-container-low">' + label + '</button>';
        }).join("");
        host.appendChild(menu);

        mobileSortButton.addEventListener("click", (event) => {
          event.stopPropagation();
          menu.hidden = !menu.hidden;
        });

        menu.querySelectorAll("[data-profile-sort]").forEach((button) => {
          button.addEventListener("click", (event) => {
            event.stopPropagation();
            sortMode = button.dataset.profileSort || "newest";
            const label = mobileSortButton.querySelector("span:first-child");
            if (label) label.textContent = sortLabels[sortMode];
            menu.hidden = true;
            currentPage = 1;
            apply();
          });
        });

        document.addEventListener("click", () => {
          menu.hidden = true;
        });
      }
    }

    const addButton = [...scope.querySelectorAll("button")].find((button) => {
      return clean(button.textContent) === "Добавить";
    });

    addButton?.addEventListener("click", () => {
      location.href = MG.pageFile("upload.html");
    });

    syncSearchClear();
    apply();
  }

  async function run() {
    const user = await MG.getUser(true);

    if (!user) {
      location.href = MG.pageFile("login.html");
      return;
    }

    const result = await MG.api("materials", { query: "?mine=1" });

    document.querySelectorAll(".desktop-view,.mobile-view").forEach((scope) => {
      updateText(scope, user);
      MG.renderCards(scope, result.materials, true);
      updateCounters(scope, result.materials);
      setupFilters(scope);

      if (scope.classList.contains("mobile-view")) {
        [...scope.querySelectorAll("button,a")].forEach((control) => {
          const text = clean(control.textContent);
          const icon = clean(control.querySelector(".material-symbols-outlined")?.textContent);

          if (text === "Редактировать" || icon === "settings") {
            control.style.display = "none";
          }
        });
      }
    });
  }

  run().catch((error) => MG.toast(error.message, true));
})();
