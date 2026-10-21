(() => {
  if (!window.MG) return;

  const page = MG.page;
  const catalogTypes = {
    "gallery.html": "",
    "images.html": "image",
    "videos.html": "video",
    "audio.html": "audio"
  };
  const isCatalogPage = page in catalogTypes;
  const audioDurations = new Map();
  window.MediaGalleryGetAudioDuration = (id) => audioDurations.get(Number(id)) || 0;

  function readAudioDuration(material) {
    return new Promise((resolve) => {
      const source = MG.mediaUrl(material.fileUrl || material.sourceUrl || "");
      if (!source) { resolve(0); return; }
      const audio = document.createElement("audio");
      let settled = false;
      const finish = (seconds) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        const duration = Number.isFinite(seconds) ? seconds : 0;
        audioDurations.set(Number(material.id), duration);
        resolve(duration);
        audio.removeAttribute("src");
        audio.load();
      };
      const timeout = setTimeout(() => finish(0), 6000);
      audio.addEventListener("loadedmetadata", () => finish(audio.duration), { once: true });
      audio.addEventListener("error", () => finish(0), { once: true });
      audio.preload = "metadata";
      audio.src = source;
    });
  }

  if (isCatalogPage) {
    document.documentElement.classList.add("mg-catalog-loading");
  }

  async function loadCatalog() {
    if (!isCatalogPage) return;

    const type = catalogTypes[page];
    const query = type ? "?type=" + encodeURIComponent(type) : "";
    const [result, categoryResult] = await Promise.all([
      MG.api("materials", { query }),
      MG.api("categories")
    ]);
    const categoryNames = ["Все категории", ...categoryResult.categories.map((item) => item.name)];
    window.MediaGalleryCategoryNames = categoryNames;
    window.MediaGalleryDurationReady = type === "audio"
      ? Promise.all(result.materials.map(readAudioDuration))
      : Promise.resolve();

    document.querySelectorAll(".desktop-view,.mobile-view").forEach((scope) => {
      MG.renderCards(scope, result.materials);
      updateMobileCatalogSummary(scope, result.materials, type);
      setupMobileCatalog(scope, result.materials, type, categoryNames);
    });

    if (window.MediaGalleryRefreshFilters) {
      window.MediaGalleryRefreshFilters();
    }
    if (type === "audio") {
      window.MediaGalleryDurationReady.then(() => {
        const sorter = document.querySelector(".desktop-view .mg-filter-panel [data-mg-sort]");
        if (sorter?.value === "duration") sorter.dispatchEvent(new Event("change"));
      });
    }

    document.documentElement.classList.remove("mg-catalog-loading");
  }

  function searchStats(scope, count, query) {
    let word = "материалов";
    if (count === 1) word = "материал";
    if (count >= 2 && count <= 4) word = "материала";

    const mobileCount = scope.querySelector("#results-count");
    if (mobileCount) {
      mobileCount.textContent = "Найдено: " + count + " " + word;

      const queryLabel = mobileCount.parentElement?.parentElement?.querySelector(":scope > span:last-child");
      if (queryLabel) {
        queryLabel.textContent = query ? "по запросу «" + query + "»" : "";
        queryLabel.style.display = query ? "" : "none";
      }
      return;
    }

    const line = [...scope.querySelectorAll("div")].find((div) => {
      const children = [...div.children];
      const hasCounterText = children.some((child) =>
        /^Найдено:\s*\d+\s*материал/i.test(child.textContent.trim())
      );
      const hasDot = children.some((child) =>
        child.classList?.contains("rounded-full") &&
        child.classList?.contains("bg-primary")
      );

      return hasCounterText && hasDot;
    });

    if (!line) return;

    line.innerHTML =
      '<span class="w-2 h-2 rounded-full bg-primary inline-block"></span>' +
      '<span>Найдено: <strong class="text-on-surface font-title-md">' + count + " " + word + "</strong>" +
      (query ? ' по запросу <span class="text-primary font-title-md">«' + MG.esc(query) + '»</span>' : "") +
      "</span>";
  }

  function buttonType(button) {
    const text = button.textContent.toLowerCase();
    if (text.includes("изображ")) return "image";
    if (text.includes("видео")) return "video";
    if (text.includes("аудио")) return "audio";
    return "";
  }

  function updateMobileCatalogSummary(scope, materials, type) {
    if (!scope.classList.contains("mobile-view")) return;

    const total = materials.length;

    if (!type) {
      const counts = {
        all: total,
        image: materials.filter((item) => item.type === "image").length,
        video: materials.filter((item) => item.type === "video").length,
        audio: materials.filter((item) => item.type === "audio").length
      };

      const subtitle = [...scope.querySelectorAll("p")].find((node) =>
        /^Все материалы пользователей\s+\d+/i.test(node.textContent.replace(/\s+/g, " ").trim())
      );
      const subtitleCount = subtitle?.querySelector("span");
      if (subtitleCount) subtitleCount.textContent = counts.all;

      scope.querySelectorAll("button[data-type]").forEach((button) => {
        const key = button.dataset.type || "all";
        if (!(key in counts)) return;

        const number = [...button.querySelectorAll("span")].find((span) =>
          /^\d+$/.test(span.textContent.trim())
        );
        if (number) number.textContent = counts[key];
      });

      scope.querySelectorAll("span").forEach((node) => {
        const text = node.textContent.replace(/\s+/g, " ").trim();
        if (/^Показано\s+\d+\s+из\s+\d+\s+материал/i.test(text)) {
          node.textContent = "Показано " + total + " из " + total + " материалов";
        }
      });

      const applyButton = scope.querySelector("#applyFiltersBtn");
      if (applyButton) applyButton.textContent = "Применить (" + total + ")";

      return;
    }

    const label = type === "image" ? "ФОТО" : type === "video" ? "ВИДЕО" : "ТРЕКА";

    scope.querySelectorAll("span").forEach((node) => {
      const text = node.textContent.replace(/\s+/g, " ").trim();

      if (/^\d+\s+(ФОТО|ВИДЕО|ТРЕКА)$/i.test(text)) {
        node.textContent = total + " " + label;
      }

      if (/^Показано\s+\d+(?:–\d+)?\s+из\s+\d+/i.test(text)) {
        const noun = type === "image"
          ? "изображений"
          : type === "video"
            ? "видео"
            : "аудиофайлов";
        node.textContent = "Показано " + total + " из " + total + " " + noun;
      }
    });

    scope.querySelectorAll("p").forEach((node) => {
      const text = node.textContent.replace(/\s+/g, " ").trim();
      if (/\(\d+\)\s*$/.test(text)) {
        node.textContent = text.replace(/\(\d+\)\s*$/, "(" + total + ")");
      }
    });

  }

  function normalizeMobileCards(container) {
    container.querySelectorAll(".mg-card").forEach((card) => {
      const type = card.dataset.materialType;
      const badge = card.querySelector(".mg-card__type");
      const save = card.querySelector(".mg-card__save");
      const saveIcon = save?.querySelector(".material-symbols-outlined");

      if (save && !save.hasAttribute("data-api-delete")) {
        save.setAttribute("aria-label", "Сохранить");
        if (saveIcon) saveIcon.textContent = "bookmark_border";
      }

      if (type === "image") {
        if (badge) badge.textContent = "ФОТО";
      } else if (type === "video") {
        if (badge) badge.textContent = "ВИДЕО";
      } else if (type === "audio") {
        if (badge) badge.textContent = "АУДИО";
      }
    });
  }

  function renderMobileCards(container, materials) {
    if (!materials.length) {
      container.innerHTML =
        '<div class="mg-mobile-empty">' +
          '<span class="material-symbols-outlined text-[34px] text-outline">search_off</span>' +
          '<h3 class="font-headline-sm text-headline-sm text-on-surface mt-2">Ничего не найдено</h3>' +
          '<p class="font-body-md text-body-md text-on-surface-variant mt-1">Измени поиск или категорию.</p>' +
        '</div>';
      return;
    }

    container.innerHTML = materials.map((item) => MG.cardHtml(item)).join("");
    normalizeMobileCards(container);
  }

  function setupMobileCatalog(scope, materials, fixedType, categoryNames) {
    if (!scope.classList.contains("mobile-view")) return;
    if (scope.dataset.mgMobileCatalogMounted === "1") return;

    const firstCard = scope.querySelector(".mg-card");
    const container = firstCard?.parentElement;
    if (!container) return;

    scope.dataset.mgMobileCatalogMounted = "1";

    const allMaterials = [...materials];
    const state = {
      query: "",
      type: fixedType || "",
      category: "",
      categories: new Set(),
      sort: "newest",
      limit: page === "gallery.html" ? 6 : 3,
      list: false
    };

    const clean = (value) => String(value || "").replace(/\s+/g, " ").trim();
    const search = page === "gallery.html"
      ? scope.querySelector("#gallerySearchInput")
      : [...scope.querySelectorAll('input[type="text"],input[type="search"]')].find((input) =>
          /поиск/i.test(input.placeholder || "")
        );
    const clearSearch = scope.querySelector("#clearSearchBtn");
    let loadMore = scope.querySelector("#loadMoreBtn") || [...scope.querySelectorAll("button")].find((button) =>
      /Загрузить\s+(?:еще|ещё)|Показать\s+(?:еще|ещё)/i.test(clean(button.textContent))
    );
    const status = [...scope.querySelectorAll("p,span")].find((node) =>
      /^Показано\s+/i.test(clean(node.textContent))
    );

    const paginationRoot = status?.parentElement;
    let percentLabel = paginationRoot?.querySelector("[data-mobile-page-percent]") ||
      paginationRoot?.querySelector(".font-semibold.text-primary");

    if (loadMore) {
      loadMore.id = "loadMoreBtn";
      loadMore.type = "button";
      loadMore.className = "mt-2 w-full h-12 bg-surface-container-lowest hover:bg-surface-container text-primary font-label-lg text-label-lg rounded-xl shadow-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all";
      loadMore.innerHTML =
        '<span class="material-symbols-outlined text-[20px]">refresh</span>' +
        '<span>Загрузить еще материалы</span>';
    }

    if (paginationRoot && page !== "gallery.html" && status && loadMore) {
      const progressTrack = paginationRoot.querySelector(".w-full.bg-surface-container");
      const panel = document.createElement("div");
      panel.className = "w-full flex flex-col items-center gap-space-sm bg-surface-container-low p-space-md rounded-2xl";

      const topRow = document.createElement("div");
      topRow.className = "w-full flex items-center justify-between font-label-caps text-label-caps text-on-surface-variant";

      percentLabel = document.createElement("span");
      percentLabel.dataset.mobilePagePercent = "1";
      percentLabel.className = "font-semibold text-primary";
      percentLabel.textContent = "0%";

      status.className = "";
      topRow.append(status, percentLabel);
      panel.appendChild(topRow);

      if (progressTrack) {
        progressTrack.className = "w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden";
        panel.appendChild(progressTrack);
      }

      panel.appendChild(loadMore);
      paginationRoot.className = "px-gutter-mobile mt-space-lg mb-space-md";
      paginationRoot.replaceChildren(panel);
    }

    function filteredList(categoryOverride = null) {
      const q = state.query.toLowerCase();
      const selectedCategories = categoryOverride || state.categories;
      let list = allMaterials.filter((item) => {
        const typeOk = !state.type || item.type === state.type;
        const categoryOk = !selectedCategories.size || selectedCategories.has(item.category);
        const haystack = clean([
          item.title,
          item.description,
          item.category,
          ...(item.tags || []),
          item.author?.name,
          item.author?.username
        ].join(" ")).toLowerCase();
        return typeOk && categoryOk && (!q || haystack.includes(q));
      });

      if (state.sort === "oldest") {
        list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      } else if (state.sort === "popular") {
        list.sort((a, b) =>
          (Number(b.views || 0) + Number(b.likes || 0) * 10) -
          (Number(a.views || 0) + Number(a.likes || 0) * 10)
        );
      } else if (state.sort === "likes") {
        list.sort((a, b) => Number(b.likes || 0) - Number(a.likes || 0));
      } else if (state.sort === "duration") {
        list.sort((a, b) => window.MediaGalleryGetAudioDuration(b.id) - window.MediaGalleryGetAudioDuration(a.id));
      } else if (state.sort === "name") {
        list.sort((a, b) => clean(a.title).localeCompare(clean(b.title), "ru"));
      } else {
        list.sort((a, b) => {
          const diff = new Date(b.createdAt) - new Date(a.createdAt);
          return diff || Number(b.id || 0) - Number(a.id || 0);
        });
      }

      return list;
    }

    function updateStatus(total, shown) {
      if (status) {
        const noun = fixedType === "image"
          ? "изображений"
          : fixedType === "video"
            ? "видео"
            : fixedType === "audio"
              ? "аудиоматериалов"
              : "материалов";
        status.textContent = "Показано " + shown + " из " + total + " " + noun;
      }

      if (paginationRoot) {
        const percent = total ? Math.round(shown / total * 100) : 0;
        const progress = paginationRoot.querySelector(".bg-primary.h-full");
        if (progress) {
          progress.style.width = percent + "%";
        }
        if (percentLabel) {
          percentLabel.textContent = percent + "%";
        }
      }
    }

    function render() {
      const filtered = filteredList();
      const shown = Number.isFinite(state.limit)
        ? filtered.slice(0, state.limit)
        : filtered;

      renderMobileCards(container, shown);
      container.classList.toggle("mg-mobile-catalog-list", state.list);
      container.classList.toggle("mg-mobile-catalog-grid", !state.list);
      updateStatus(filtered.length, shown.length);

      if (loadMore) {
        const canLoad = shown.length < filtered.length;
        loadMore.style.display = canLoad ? "" : "none";
        loadMore.hidden = !canLoad;
      }

      const applyButton = scope.querySelector("#applyFiltersBtn");
      if (applyButton) {
        applyButton.textContent = "Применить (" + filtered.length + ")";
      }
    }

    if (search) {
      search.addEventListener("input", () => {
        state.query = search.value.trim();
        state.limit = page === "gallery.html" ? 6 : 3;
        render();
      });
    }

    clearSearch?.addEventListener("click", () => {
      state.query = "";
      if (search) search.value = "";
      state.limit = page === "gallery.html" ? 6 : 3;
      render();
    });

    if (loadMore) {
      loadMore.addEventListener("click", () => {
        state.limit += page === "gallery.html" ? 6 : 3;
        render();
      });
    }

    if (page === "gallery.html") {
      const typeChips = [...scope.querySelectorAll(".filter-chip[data-type]")];
      const mobileTypeLabels = {
        all: "Все",
        image: "Изображения",
        video: "Видео",
        audio: "Аудио"
      };

      typeChips.forEach((chip) => {
        chip.type = "button";
        chip.textContent = mobileTypeLabels[chip.dataset.type] || chip.textContent.trim();
        chip.classList.remove("gap-1.5");
        chip.classList.add("px-3.5", "py-1.5", "whitespace-nowrap");
      });

      function setActiveTypeChip(active) {
        typeChips.forEach((chip) => {
          const isActive = chip === active;
          chip.classList.toggle("bg-primary", isActive);
          chip.classList.toggle("bg-primary-container", false);
          chip.classList.toggle("text-on-primary", isActive);
          chip.classList.toggle("shadow-sm", isActive);
          chip.classList.toggle("bg-surface-container", !isActive);
          chip.classList.toggle("text-on-surface-variant", !isActive);
        });
      }

      if (typeChips[0]) setActiveTypeChip(typeChips[0]);

      typeChips.forEach((chip) => {
        chip.type = "button";
        chip.addEventListener("click", () => {
          state.type = chip.dataset.type === "all" ? "" : chip.dataset.type;
          state.limit = 6;
          setActiveTypeChip(chip);
          render();
        });
      });

      const sortOptions = [...scope.querySelectorAll(".sort-option")];
      const sortLabel = scope.querySelector("#currentSortLabel");
      sortOptions.forEach((option) => {
        option.type = "button";
        option.addEventListener("click", () => {
          const value = option.dataset.value;
          state.sort = value === "popular"
            ? "popular"
            : value === "likes"
              ? "likes"
              : "newest";
          if (sortLabel) sortLabel.textContent = clean(option.textContent);
          render();
        });
      });

      scope.querySelector("#viewToggleBtn")?.remove();

      const gallerySortButton = scope.querySelector("#sortDropdownBtn");
      const gallerySortHost = gallerySortButton?.parentElement;
      const gallerySortRow = gallerySortHost?.parentElement;
      scope.querySelector("#quickTagsBtn")?.remove();

      if (gallerySortButton && gallerySortHost) {
        gallerySortHost.className = "relative flex items-center gap-1.5 text-on-surface-variant";

        const existingCaption = [...gallerySortButton.querySelectorAll("span")].find((node) =>
          /^Сортировка:/i.test(clean(node.textContent))
        );
        existingCaption?.remove();

        const existingArrow = [...gallerySortButton.querySelectorAll(".material-symbols-outlined")].pop();
        if (existingArrow) {
          existingArrow.textContent = "expand_more";
          existingArrow.className = "material-symbols-outlined text-[16px]";
        }

        gallerySortButton.className = "font-label-md text-label-md text-primary font-semibold flex items-center gap-0.5";

        const sortIcon = document.createElement("span");
        sortIcon.className = "material-symbols-outlined text-[16px]";
        sortIcon.textContent = "swap_vert";

        const sortCaption = document.createElement("span");
        sortCaption.className = "font-label-caps text-label-caps uppercase tracking-wider text-outline";
        sortCaption.textContent = "Сортировка:";

        gallerySortHost.insertBefore(sortCaption, gallerySortButton);
        gallerySortHost.insertBefore(sortIcon, sortCaption);
      }

      if (gallerySortRow) {
        const viewControls = document.createElement("div");
        viewControls.className = "flex items-center gap-1.5";
        viewControls.innerHTML =
          '<button type="button" data-mobile-view="grid" aria-label="Вид сеткой" aria-pressed="true" class="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-on-primary shadow-sm transition-colors">' +
            '<span class="material-symbols-outlined text-[18px]">grid_view</span>' +
          '</button>' +
          '<button type="button" data-mobile-view="list" aria-label="Вид списком" aria-pressed="false" class="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-container-low text-on-surface-variant hover:text-on-surface transition-colors">' +
            '<span class="material-symbols-outlined text-[18px]">view_agenda</span>' +
          '</button>';
        gallerySortRow.appendChild(viewControls);

        const gridButton = viewControls.querySelector('[data-mobile-view="grid"]');
        const listButton = viewControls.querySelector('[data-mobile-view="list"]');

        const syncViewButtons = () => {
          [[gridButton, !state.list], [listButton, state.list]].forEach(([button, active]) => {
            if (!button) return;
            button.setAttribute("aria-pressed", active ? "true" : "false");
            button.classList.toggle("bg-primary", active);
            button.classList.toggle("text-on-primary", active);
            button.classList.toggle("shadow-sm", active);
            button.classList.toggle("bg-surface-container-low", !active);
            button.classList.toggle("text-on-surface-variant", !active);
          });
        };

        gridButton?.addEventListener("click", () => {
          state.list = false;
          syncViewButtons();
          render();
        });

        listButton?.addEventListener("click", () => {
          state.list = true;
          syncViewButtons();
          render();
        });

        syncViewButtons();
      }

      const drawer = scope.querySelector("#filterDrawerBackdrop");
      const categoryHeading = drawer
        ? [...drawer.querySelectorAll("span")].find((node) => clean(node.textContent) === "Тематика")
        : null;
      const categoryHost = categoryHeading?.parentElement?.querySelector(".flex.flex-wrap");
      const categories = categoryNames.filter((name) => name !== "Все категории");

      if (categoryHost) {
        categoryHost.innerHTML = categories.map((category) =>
          '<label class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container font-label-md text-label-md cursor-pointer">' +
            '<input class="accent-primary rounded" type="checkbox" data-mobile-drawer-category="' + MG.esc(category) + '">' +
            '<span>' + MG.esc(category) + '</span>' +
          '</label>'
        ).join("");

        categoryHost.querySelectorAll("[data-mobile-drawer-category]").forEach((input) => {
          input.addEventListener("change", () => {
            const draft = new Set(
              [...categoryHost.querySelectorAll("[data-mobile-drawer-category]:checked")]
                .map((item) => item.dataset.mobileDrawerCategory)
            );
            const count = filteredList(draft).length;
            const applyButton = scope.querySelector("#applyFiltersBtn");
            if (applyButton) applyButton.textContent = "Применить (" + count + ")";
          });
        });
      }

      const qualityHeading = drawer
        ? [...drawer.querySelectorAll("span")].find((node) => clean(node.textContent) === "Качество контента")
        : null;
      if (qualityHeading?.parentElement) {
        qualityHeading.parentElement.style.display = "none";
      }

      scope.querySelector("#applyFiltersBtn")?.addEventListener("click", () => {
        state.categories = categoryHost
          ? new Set(
              [...categoryHost.querySelectorAll("[data-mobile-drawer-category]:checked")]
                .map((item) => item.dataset.mobileDrawerCategory)
            )
          : new Set();
        state.limit = 6;
        render();
      });

      scope.querySelector("#resetFiltersBtn")?.addEventListener("click", () => {
        state.query = "";
        state.type = "";
        state.categories = new Set();
        state.sort = "newest";
        state.limit = 6;
        if (search) {
          search.value = "";
          search.dispatchEvent(new Event("input", { bubbles: true }));
        }
        categoryHost?.querySelectorAll("[data-mobile-drawer-category]").forEach((input) => {
          input.checked = false;
        });
        if (typeChips[0]) setActiveTypeChip(typeChips[0]);
        if (sortLabel) sortLabel.textContent = "Сначала новые";
        render();
      });
    } else {
      const searchBox = search?.closest("div.relative.w-full");
      const categoryRow = searchBox?.nextElementSibling;
      const categories = categoryNames.filter((name) => name !== "Все категории");

      if (categoryRow && categoryRow.querySelector("button")) {
        categoryRow.classList.add("mg-mobile-category-row");
        categoryRow.innerHTML = [
          '<button type="button" data-mobile-category="" class="px-3.5 py-1.5 rounded-full bg-primary text-on-primary font-label-md text-label-md shadow-sm whitespace-nowrap">Все</button>',
          ...categories.map((category) =>
            '<button type="button" data-mobile-category="' + MG.esc(category) + '" class="px-3.5 py-1.5 rounded-full bg-surface-container text-on-surface-variant font-label-md text-label-md whitespace-nowrap">' +
              MG.esc(category) +
            '</button>'
          )
        ].join("");

        const categoryButtons = [...categoryRow.querySelectorAll("[data-mobile-category]")];
        categoryButtons.forEach((button) => {
          button.addEventListener("click", () => {
            const value = button.dataset.mobileCategory;
            state.categories = value ? new Set([value]) : new Set();
            categoryButtons.forEach((item) => {
              const active = item === button;
              item.classList.toggle("bg-primary", active);
              item.classList.toggle("text-on-primary", active);
              item.classList.toggle("shadow-sm", active);
              item.classList.toggle("bg-surface-container", !active);
              item.classList.toggle("text-on-surface-variant", !active);
            });
            render();
          });
        });

        const filterButton = searchBox.querySelector('button[aria-label="Фильтры"]');
        filterButton?.addEventListener("click", () => {
          categoryRow.scrollIntoView({ behavior: "smooth", block: "center" });
          categoryRow.scrollTo({ left: 0, behavior: "smooth" });
        });
      }

      const sortCaption = [...scope.querySelectorAll("span")].find((node) =>
        /^Сортировка:/i.test(clean(node.textContent))
      );
      const sortWrap = sortCaption?.parentElement;
      const sortButton = sortWrap?.querySelector("button");
      const controlRow = sortWrap?.parentElement;

      if (controlRow && sortWrap) {
        [...controlRow.children].forEach((child) => {
          if (child !== sortWrap) child.remove();
        });

        const viewControls = document.createElement("div");
        viewControls.className = "flex items-center gap-1.5";
        viewControls.innerHTML =
          '<button type="button" data-mobile-view="grid" aria-label="Вид сеткой" aria-pressed="true" class="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-on-primary shadow-sm transition-colors">' +
            '<span class="material-symbols-outlined text-[18px]">grid_view</span>' +
          '</button>' +
          '<button type="button" data-mobile-view="list" aria-label="Вид списком" aria-pressed="false" class="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-container-low text-on-surface-variant hover:text-on-surface transition-colors">' +
            '<span class="material-symbols-outlined text-[18px]">view_agenda</span>' +
          '</button>';
        controlRow.appendChild(viewControls);

        const gridButton = viewControls.querySelector('[data-mobile-view="grid"]');
        const listButton = viewControls.querySelector('[data-mobile-view="list"]');

        const syncViewButtons = () => {
          [[gridButton, !state.list], [listButton, state.list]].forEach(([button, active]) => {
            if (!button) return;
            button.setAttribute("aria-pressed", active ? "true" : "false");
            button.classList.toggle("bg-primary", active);
            button.classList.toggle("text-on-primary", active);
            button.classList.toggle("shadow-sm", active);
            button.classList.toggle("bg-surface-container-low", !active);
            button.classList.toggle("text-on-surface-variant", !active);
          });
        };

        gridButton?.addEventListener("click", () => {
          state.list = false;
          syncViewButtons();
          render();
        });

        listButton?.addEventListener("click", () => {
          state.list = true;
          syncViewButtons();
          render();
        });

        syncViewButtons();
      }

      if (sortWrap && sortButton) {
        sortWrap.style.position = "relative";
        const label = [...sortButton.querySelectorAll("span")].find((node) =>
          !node.classList.contains("material-symbols-outlined")
        );

        const menu = document.createElement("div");
        menu.className = "mg-mobile-sort-menu";
        menu.hidden = true;
        menu.innerHTML =
          '<button type="button" data-mobile-sort="newest" class="is-active">Сначала новые</button>' +
          '<button type="button" data-mobile-sort="popular">По популярности</button>' +
          '<button type="button" data-mobile-sort="name">По названию</button>' +
          (fixedType === "audio" ? '<button type="button" data-mobile-sort="duration">По длительности</button>' : "");
        sortWrap.appendChild(menu);

        sortButton.type = "button";
        sortButton.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          menu.hidden = !menu.hidden;
        });

        menu.querySelectorAll("[data-mobile-sort]").forEach((option) => {
          option.addEventListener("click", (event) => {
            event.preventDefault();
            state.sort = option.dataset.mobileSort;
            menu.querySelectorAll("[data-mobile-sort]").forEach((item) => {
              item.classList.toggle("is-active", item === option);
            });
            if (label) label.textContent = clean(option.textContent);
            menu.hidden = true;
            render();
          });
        });

        document.addEventListener("click", (event) => {
          if (!sortWrap.contains(event.target)) menu.hidden = true;
        });
      }
    }

    render();
    if (fixedType === "audio") {
      window.MediaGalleryDurationReady?.then(() => {
        if (state.sort === "duration") render();
      });
    }
  }

  async function setupSearch() {
    if (page !== "search.html") return;

    const initialQuery = new URLSearchParams(location.search).get("q") || "";
    const [all, categoryResult] = await Promise.all([
      MG.api("materials"), MG.api("categories")
    ]);
    const counts = {
      all: all.materials.length,
      image: all.materials.filter((item) => item.type === "image").length,
      video: all.materials.filter((item) => item.type === "video").length,
      audio: all.materials.filter((item) => item.type === "audio").length
    };

    document.querySelectorAll(".desktop-view,.mobile-view").forEach((scope) => {
      const input = scope.querySelector("#searchInput, #search-input, input[aria-label='Поисковый запрос']");
      const firstCard = scope.querySelector(".mg-card");

      if (!input || !firstCard) return;

      const container = firstCard.parentElement;
      const isMobile = scope.classList.contains("mobile-view");
      const typeButtons = [...scope.querySelectorAll("button")].filter((button) => {
        return /Все\s*\(\d+\)|Изображения\s*\(\d+\)|Видео\s*\(\d+\)|Аудио\s*\(\d+\)/i.test(button.textContent);
      });
      const category = scope.querySelector("#categorySelect") || scope.querySelector("select");
      if (category) {
        category.innerHTML = '<option value="all">Все категории</option>' +
          categoryResult.categories.map((item) =>
            '<option value="' + MG.esc(item.name) + '">' + MG.esc(item.name) + "</option>"
          ).join("");
      }
      const sort = scope.querySelector("#sortSelect") || [...scope.querySelectorAll("select")][1];
      const findButton = [...scope.querySelectorAll("button")].find((button) => {
        return button.textContent.trim() === "Найти";
      });
      const desktopLoadMoreButton = [...scope.querySelectorAll("button")].find((button) => {
        return /Показать еще/i.test(button.textContent);
      });

      let mobilePager = null;
      let mobileLoadMoreButton = null;
      let mobileStatus = null;
      let mobilePercent = null;
      let mobileProgress = null;
      let visibleLimit = isMobile ? 6 : Number.POSITIVE_INFINITY;

      if (isMobile) {
        mobilePager = document.createElement("div");
        mobilePager.className = "px-gutter-mobile mt-space-lg mb-space-md";
        mobilePager.innerHTML =
          '<div class="w-full flex flex-col items-center gap-space-sm bg-surface-container-low p-space-md rounded-2xl">' +
            '<div class="w-full flex items-center justify-between font-label-caps text-label-caps text-on-surface-variant">' +
              '<span data-mobile-search-status>Показано 0 из 0 материалов</span>' +
              '<span data-mobile-search-percent class="font-semibold text-primary">0%</span>' +
            '</div>' +
            '<div class="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">' +
              '<div data-mobile-search-progress class="h-full bg-primary rounded-full transition-all duration-500" style="width:0%"></div>' +
            '</div>' +
            '<button data-mobile-search-load type="button" class="mt-2 w-full h-12 bg-surface-container-lowest hover:bg-surface-container text-primary font-label-lg text-label-lg rounded-xl shadow-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all">' +
              '<span class="material-symbols-outlined text-[20px]">refresh</span>' +
              '<span>Загрузить еще материалы</span>' +
            '</button>' +
          '</div>';
        container.insertAdjacentElement("afterend", mobilePager);
        mobileLoadMoreButton = mobilePager.querySelector("[data-mobile-search-load]");
        mobileStatus = mobilePager.querySelector("[data-mobile-search-status]");
        mobilePercent = mobilePager.querySelector("[data-mobile-search-percent]");
        mobileProgress = mobilePager.querySelector("[data-mobile-search-progress]");
      }

      let activeType = "";
      let timer;

      typeButtons.forEach((button) => {
        const type = buttonType(button);
        const label = type === "image"
          ? "Изображения"
          : type === "video"
            ? "Видео"
            : type === "audio"
              ? "Аудио"
              : "Все";
        const count = type ? counts[type] : counts.all;

        button.innerHTML = button.innerHTML.replace(
          /(Все|Изображения|Видео|Аудио)\s*\(\d+\)/i,
          label + " (" + count + ")"
        );

        button.addEventListener("click", () => {
          activeType = type;
          visibleLimit = isMobile ? 6 : Number.POSITIVE_INFINITY;
          typeButtons.forEach((item) => {
            item.classList.remove("bg-primary-container", "text-on-primary");
          });
          button.classList.add("bg-primary-container", "text-on-primary");
          runSearch();
        });
      });

      async function runSearch() {
        const params = new URLSearchParams();
        const q = input.value.trim();

        if (q) params.set("q", q);
        if (activeType) params.set("type", activeType);
        if (sort) {
          const sorting = {
            relevance: "newest",
            "По релевантности": "newest",
            "Сначала новые": "newest",
            "По популярности": "popular",
            "По размеру": "size"
          };
          params.set("sort", sorting[sort.value] || sort.value);
        }

        if (category) {
          const selected = category.options[category.selectedIndex]?.text || "";
          if (selected && !/все категор/i.test(selected)) {
            params.set("category", selected);
          }
        }

        const query = params.toString() ? "?" + params.toString() : "";
        const result = await MG.api("materials", { query });

        const shownMaterials = isMobile
          ? result.materials.slice(0, visibleLimit)
          : result.materials;

        container.innerHTML = result.materials.length
          ? shownMaterials.map((item) => MG.cardHtml(item)).join("")
          : '<div class="col-span-full w-full rounded-2xl bg-surface-container-lowest p-space-xl text-center shadow-sm">' +
              '<span class="material-symbols-outlined text-[36px] text-outline">search_off</span>' +
              '<h3 class="font-headline-sm text-headline-sm text-on-surface mt-2">Ничего не найдено</h3>' +
              '<p class="font-body-md text-body-md text-on-surface-variant mt-1">Попробуйте изменить запрос или фильтры.</p>' +
            '</div>';

        if (isMobile && result.materials.length) {
          normalizeMobileCards(container);
        }

        if (isMobile && mobilePager) {
          const total = result.materials.length;
          const shown = shownMaterials.length;
          const percent = total ? Math.round(shown / total * 100) : 0;
          mobilePager.style.display = total ? "" : "none";
          if (mobileStatus) mobileStatus.textContent = "Показано " + shown + " из " + total + " материалов";
          if (mobilePercent) mobilePercent.textContent = percent + "%";
          if (mobileProgress) mobileProgress.style.width = percent + "%";
          if (mobileLoadMoreButton) {
            const canLoad = shown < total;
            mobileLoadMoreButton.style.display = canLoad ? "" : "none";
            mobileLoadMoreButton.hidden = !canLoad;
          }
        } else if (desktopLoadMoreButton) {
          desktopLoadMoreButton.style.display = result.materials.length ? "" : "none";
        }

        searchStats(scope, result.total, q);
      }

      input.value = initialQuery;

      input.addEventListener("input", () => {
        clearTimeout(timer);
        visibleLimit = isMobile ? 6 : Number.POSITIVE_INFINITY;
        timer = setTimeout(runSearch, 250);
      });

      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          runSearch();
        }
      });

      sort?.addEventListener("change", () => {
        visibleLimit = isMobile ? 6 : Number.POSITIVE_INFINITY;
        runSearch();
      });
      category?.addEventListener("change", () => {
        visibleLimit = isMobile ? 6 : Number.POSITIVE_INFINITY;
        runSearch();
      });
      findButton?.addEventListener("click", () => {
        visibleLimit = isMobile ? 6 : Number.POSITIVE_INFINITY;
        runSearch();
      });
      mobileLoadMoreButton?.addEventListener("click", () => {
        visibleLimit += 6;
        runSearch();
      });

      runSearch();
    });
  }

  loadCatalog().catch((error) => {
    document.documentElement.classList.remove("mg-catalog-loading");
    MG.toast(error.message, true);
  });
  setupSearch().catch((error) => MG.toast(error.message, true));
})();
