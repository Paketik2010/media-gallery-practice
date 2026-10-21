(() => {
  if (!location.pathname.toLowerCase().endsWith("/search.html")) return;

  const clean = (value) => (value || "").replace(/\s+/g, " ").trim();

  const fallbackEmptyCard =
    '<div class="w-full bg-surface-container-lowest/80 rounded-2xl p-space-xl text-center flex flex-col items-center justify-center shadow-xs">' +
      '<div class="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-outline mb-space-md shadow-inner">' +
        '<span class="material-symbols-outlined text-[32px]">search_off</span>' +
      '</div>' +
      '<h3 class="font-headline-sm text-headline-sm text-on-surface mb-1">Ничего не найдено</h3>' +
      '<p class="font-body-md text-body-md text-on-surface-variant max-w-md mb-space-lg">Попробуйте изменить запрос или фильтры, чтобы найти подходящие материалы в медиатеке.</p>' +
      '<button class="inline-flex items-center gap-space-xs px-space-lg py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-lg text-label-lg transition-colors" type="button" data-search-reset>' +
        '<span class="material-symbols-outlined text-[18px]">restart_alt</span>' +
        '<span>Сбросить фильтры</span>' +
      '</button>' +
    '</div>';

  function findDemoEmptyState(scope) {
    return [...scope.querySelectorAll("section")].find((section) =>
      [...section.querySelectorAll("h3")].some((h3) => clean(h3.textContent) === "Ничего не найдено")
    ) || null;
  }

  function setup(scope) {
    const input = scope.querySelector("#searchInput, input[aria-label='Поисковый запрос']");
    const cards = [...scope.querySelectorAll(".mg-card")];
    if (!input || !cards.length) return;

    const cardContainer = cards[0].parentElement;
    if (!cardContainer) return;

    const originalEmptyState = findDemoEmptyState(scope);
    let emptyCardHtml = fallbackEmptyCard;

    if (originalEmptyState) {
      const card = [...originalEmptyState.children].find((child) =>
        [...child.querySelectorAll("h3")].some((h3) => clean(h3.textContent) === "Ничего не найдено")
      );
      if (card) emptyCardHtml = card.outerHTML;
      originalEmptyState.remove();
    }

    const typeButtons = [...scope.querySelectorAll("button")].filter((button) => {
      const text = clean(button.textContent);
      return /Все\s*\(\d+\)|Изображения\s*\(\d+\)|Видео\s*\(\d+\)|Аудио\s*\(\d+\)/i.test(text);
    });

    const selects = [...scope.querySelectorAll("select")];
    const categorySelect = selects[0] || null;
    const searchCategories = [
      "Все категории","Фотографии","Музыка","Обучение","Развлечения",
      "Архитектура","Город","Дизайн","Путешествия","Технологии",
      "Подкасты","Звуковые эффекты","Другое"
    ];
    if (categorySelect) {
      categorySelect.innerHTML = searchCategories
        .map((item) => '<option value="' + item + '">' + item + '</option>')
        .join("");
    }
    const findButton = [...scope.querySelectorAll("button")].find((button) =>
      /Найти/i.test(clean(button.textContent))
    );
    const clearButton = scope.querySelector("#clearSearchBtn");
    const loadMoreButton = [...scope.querySelectorAll("button")].find((button) =>
      /Показать еще/i.test(clean(button.textContent))
    );

    const statsLine = [...scope.querySelectorAll("div")].find((div) => {
      if (!/Найдено:\s*\d+\s*материал/i.test(clean(div.textContent))) return false;
      if (div.querySelector(".mg-card")) return false;

      const directChildren = [...div.children];
      const hasDot = directChildren.some((child) =>
        child.classList?.contains("rounded-full") &&
        child.classList?.contains("bg-primary")
      );
      const hasDirectText = directChildren.some((child) =>
        /Найдено:\s*\d+\s*материал/i.test(clean(child.textContent))
      );

      return hasDot && hasDirectText;
    }) || null;

    let activeType = "all";

    function visibleCardsCount() {
      return cards.filter((card) => !card.hidden && getComputedStyle(card).display !== "none").length;
    }

    function setCardVisible(card, visible) {
      card.hidden = !visible;
      if (visible) {
        card.style.removeProperty("display");
      } else {
        card.style.setProperty("display", "none", "important");
      }
    }

    function setLoadMoreVisible(visible) {
      if (!loadMoreButton) return;
      loadMoreButton.hidden = !visible;
      if (visible) loadMoreButton.style.removeProperty("display");
      else loadMoreButton.style.setProperty("display", "none", "important");
    }

    function removeLiveEmptyState() {
      scope.querySelector("[data-search-empty-state-live]")?.remove();
    }

    function showLiveEmptyState() {
      if (scope.querySelector("[data-search-empty-state-live]")) return;

      const section = document.createElement("section");
      section.className = "mt-space-lg flex flex-col gap-space-sm";
      section.dataset.searchEmptyStateLive = "1";
      section.innerHTML = emptyCardHtml;

      cardContainer.insertAdjacentElement("afterend", section);

      const resetButton = section.querySelector("button");
      if (resetButton) {
        resetButton.removeAttribute("onclick");
        resetButton.dataset.searchReset = "1";
        resetButton.addEventListener("click", resetFilters);
      }
    }

    function getCardType(card) {
      const typeText = clean(card.querySelector(".mg-card__type")?.textContent).toLowerCase();
      if (typeText.includes("видео")) return "video";
      if (typeText.includes("аудио")) return "audio";
      return "image";
    }

    function currentCategoryText() {
      if (!categorySelect) return "";
      return clean(categorySelect.options[categorySelect.selectedIndex]?.text || "");
    }

    function matches(card) {
      const query = clean(input.value).toLowerCase();
      const category = currentCategoryText().toLowerCase();
      const cardCategory = clean(card.querySelector(".mg-card__category")?.textContent).toLowerCase();
      const searchable = clean([
        card.dataset.mgSearchText,
        card.querySelector(".mg-card__title")?.textContent,
        card.querySelector(".mg-card__description")?.textContent,
        card.querySelector(".mg-card__author-name")?.textContent,
        cardCategory
      ].join(" ")).toLowerCase();

      const queryOk = !query || searchable.includes(query);
      const typeOk = activeType === "all" || getCardType(card) === activeType;
      const categoryOk =
        !category ||
        category.includes("все категор") ||
        cardCategory.includes(category);

      return queryOk && typeOk && categoryOk;
    }

    function updateStats(count) {
      if (!statsLine) return;

      const query = clean(input.value);
      const suffix = count === 1
        ? "материал"
        : count >= 2 && count <= 4
          ? "материала"
          : "материалов";

      statsLine.innerHTML =
        '<span class="w-2 h-2 rounded-full bg-primary inline-block"></span>' +
        '<span>Найдено: <strong class="text-on-surface font-title-md">' + count + ' ' + suffix + '</strong>' +
        (query
          ? ' по запросу <span class="text-primary font-title-md">«' + query.replace(/[<>]/g, "") + '»</span>'
          : '') +
        '</span>';
    }

    function updateTypeButtons(activeButton) {
      typeButtons.forEach((button) => {
        const active = button === activeButton;
        button.classList.toggle("bg-primary-container", active);
        button.classList.toggle("text-on-primary", active);
        if (!active) button.classList.remove("text-on-primary");
      });
    }

    function apply() {
      cards.forEach((card) => setCardVisible(card, matches(card)));

      const count = visibleCardsCount();
      if (count === 0) showLiveEmptyState();
      else removeLiveEmptyState();

      setLoadMoreVisible(count > 0);
      updateStats(count);
    }

    function resetFilters() {
      input.value = "";
      activeType = "all";
      if (categorySelect) categorySelect.selectedIndex = 0;

      cards.forEach((card) => setCardVisible(card, true));
      removeLiveEmptyState();
      setLoadMoreVisible(true);

      const allButton = typeButtons.find((button) => /Все/i.test(clean(button.textContent)));
      updateTypeButtons(allButton || null);

      updateStats(cards.length);
      input.focus();
    }

    typeButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const text = clean(button.textContent).toLowerCase();
        activeType = text.includes("изображ")
          ? "image"
          : text.includes("видео")
            ? "video"
            : text.includes("аудио")
              ? "audio"
              : "all";

        updateTypeButtons(button);
        apply();
      });
    });

    input.addEventListener("input", apply);
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        apply();
      }
    });

    findButton?.addEventListener("click", apply);
    categorySelect?.addEventListener("change", apply);
    clearButton?.addEventListener("click", () => setTimeout(apply, 0));

    const incomingQuery = clean(new URLSearchParams(location.search).get("q"));
    input.value = incomingQuery;
    apply();
  }

  function run() {
    document.querySelectorAll(".desktop-view, .mobile-view").forEach(setup);
  }

  run();
})();
