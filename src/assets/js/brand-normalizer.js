(() => {
  function clean(value) {
    return (value || "").replace(/\s+/g, " ").trim();
  }

  function isBrandImage(img) {
    const alt = clean(img.getAttribute("alt"));
    return /MediaGallery Logo|Brand logo|MediaGallery/i.test(alt);
  }

  function makeBrandText() {
    const span = document.createElement("span");
    span.className = "mg-brand-text";
    span.textContent = "MediaGallery";
    return span;
  }

  function ensureMobileHeaderSearch(root) {
    if (!root.classList.contains("mobile-view")) return;

    const header = root.querySelector("header");
    if (!header) return;

    const existing = header.querySelector(
      'a[data-path="poisk"], a[data-path="search"], [aria-label="Поиск"]'
    );
    if (existing) return;

    const rightControls = [...header.querySelectorAll("div")]
      .filter((div) =>
        div.classList.contains("flex") &&
        div.classList.contains("items-center") &&
        (div.querySelector('button[aria-label="Меню"]') ||
         div.querySelector('a[aria-label="Профиль"]') ||
         div.querySelector("button"))
      )
      .sort((a, b) => b.getBoundingClientRect().right - a.getBoundingClientRect().right)[0];

    if (!rightControls) return;

    const search = document.createElement("a");
    search.href = "#";
    search.dataset.path = "poisk";
    search.setAttribute("aria-label", "Поиск");
    search.className = "w-11 h-11 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors";
    search.innerHTML = '<span class="material-symbols-outlined text-[22px]">search</span>';

    rightControls.prepend(search);
  }

  function removeHeaderSearch(root) {
    if (root.classList.contains("mobile-view")) {
      ensureMobileHeaderSearch(root);
      return;
    }

    const header = root.querySelector("header");
    if (!header) return;

    header.querySelectorAll(
      'form[data-path="search"], a[data-path="search"], a[data-path="poisk"], [aria-label="Поиск"]'
    ).forEach((el) => {
      if (el.matches('a[data-path="search"], a[data-path="poisk"]') && el.closest("nav")) return;
      el.remove();
    });

    [...header.querySelectorAll("input")].forEach((input) => {
      const placeholder = clean(input.getAttribute("placeholder"));
      if (!/поиск|search/i.test(placeholder)) return;

      const form = input.closest("form");
      if (form && header.contains(form)) {
        form.remove();
        return;
      }

      let wrapper = input.parentElement;
      while (
        wrapper &&
        wrapper.parentElement &&
        wrapper.parentElement !== header &&
        !wrapper.classList.contains("relative")
      ) {
        wrapper = wrapper.parentElement;
      }

      if (wrapper && header.contains(wrapper)) {
        wrapper.remove();
      } else {
        input.remove();
      }
    });

    [...header.querySelectorAll(".material-symbols-outlined")].forEach((icon) => {
      if (clean(icon.textContent) !== "search") return;
      const candidate = icon.closest("form") || icon.parentElement;
      if (candidate && header.contains(candidate)) candidate.remove();
    });
  }

  function normalizeCatalogEyebrow(root) {
    if (!root.classList.contains("desktop-view")) return;

    const path = location.pathname.toLowerCase();
    const icon = path.endsWith("/gallery.html")
      ? "grid_view"
      : path.endsWith("/images.html")
        ? "image"
        : path.endsWith("/videos.html")
          ? "videocam"
          : path.endsWith("/audio.html")
            ? "graphic_eq"
            : "";

    if (!icon) return;

    const h1 = root.querySelector("h1");
    const block = h1?.parentElement;
    if (!block) return;

    const eyebrow = [...block.children].find((el) =>
      /каталог/i.test(clean(el.innerText))
    );
    if (!eyebrow) return;

    eyebrow.className = "flex items-center gap-space-xs text-primary font-label-md text-label-md uppercase tracking-wider mb-1";
    eyebrow.innerHTML =
      '<span class="material-symbols-outlined text-[18px]">' + icon + '</span>' +
      '<span>Каталог материалов</span>';
  }

  function removeDesktopPageIntro(root) {
    if (!root.classList.contains("desktop-view")) return;

    const path = location.pathname.toLowerCase();
    const main = root.querySelector("main");
    if (!main) return;

    if (path.endsWith("/gallery.html")) {
      main.style.removeProperty("padding-top");

      const galleryContent = [...main.children].find((child) =>
        child.classList.contains("flex") &&
        child.classList.contains("flex-col") &&
        child.classList.contains("w-full")
      );

      if (galleryContent) {
        galleryContent.style.setProperty("padding-top", "32px", "important");
      }
    }

    if (
      path.endsWith("/gallery.html") ||
      path.endsWith("/images.html") ||
      path.endsWith("/videos.html") ||
      path.endsWith("/audio.html") ||
      path.endsWith("/upload.html")
    ) {
      const h1 = main.querySelector("h1");
      if (!h1) return;

      let intro = h1.parentElement;
      while (
        intro &&
        intro.parentElement &&
        intro.parentElement !== main &&
        !(
          intro.classList.contains("relative") ||
          intro.classList.contains("mb-space-xl") ||
          (intro.classList.contains("flex") && intro.classList.contains("justify-between"))
        )
      ) {
        intro = intro.parentElement;
      }

      if (intro && intro !== main) {
        intro.remove();
      }
      return;
    }

    if (path.endsWith("/search.html")) {
      const searchHeader = main.querySelector("header");
      if (!searchHeader) return;

      [...searchHeader.children].forEach((child) => {
        const text = clean(child.innerText);
        if (
          text === "ПОИСКОВЫЙ ЦЕНТР" ||
          text === "Поисковый центр" ||
          text === "Поиск" ||
          text === "Поиск по всем материалам платформы"
        ) {
          child.remove();
        }
      });

      searchHeader.classList.remove("pt-space-sm", "pb-space-xs");
      searchHeader.style.paddingTop = "0";
      searchHeader.style.paddingBottom = "0";
    }
  }

  function normalizeBrand(root) {
    const header = root.querySelector("header");
    if (!header) return;

    if (root.classList.contains("mobile-view")) {
      return;
    }

    removeHeaderSearch(root);

    const images = [...header.querySelectorAll("img")].filter(isBrandImage);

    images.forEach((img) => {
      const anchor = img.closest("a");

      if (anchor) {
        anchor.innerHTML = "";
        anchor.appendChild(makeBrandText());
        return;
      }

      const parent = img.parentElement;
      if (!parent) return;

      img.remove();

      [...parent.children].forEach((child) => {
        if (child.classList?.contains("mg-brand-text")) return;
        if (/MediaGallery|Главная|Галерея|Изображения|Видео|Аудио/i.test(clean(child.innerText))) {
          child.remove();
        }
      });

      if (!parent.querySelector(".mg-brand-text")) {
        parent.prepend(makeBrandText());
      }
    });
  }

  function run() {
    document.querySelectorAll(".desktop-view, .mobile-view")
      .forEach((root) => {
        normalizeBrand(root);
        normalizeCatalogEyebrow(root);
        removeDesktopPageIntro(root);
      });
  }

  run();
})();
