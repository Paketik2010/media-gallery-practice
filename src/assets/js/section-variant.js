(() => {
  const PATH = location.pathname.toLowerCase();

  const IMAGE_DATA = [
    {
      title: "Рассвет на плато Бермамыт",
      category: "Фотографии",
      author: "Дмитрий К.",
      date: "Сегодня, 08:30",
      likes: "248",
      views: "1.4k",
      description: "Первые лучи восходящего солнца над Эльбрусом и плотное туманное море в ущелье.",
      preview: "/assets/media/media-119.jpg"
    },
    {
      title: "Геометрия бетона: Музей",
      category: "Архитектура",
      author: "Мария Волкова",
      date: "Вчера",
      likes: "167",
      views: "920",
      description: "Минималистичный брутализм, ритмичные тени и геометрические световые люки в атриуме.",
      preview: "/assets/media/media-098.jpg"
    },
    {
      title: "Утренняя роса на клевере",
      category: "Фотографии",
      author: "Максим И.",
      date: "3 дня назад",
      likes: "142",
      views: "780",
      description: "Макросъемка капель с преломлением солнечных лучей на рассвете в саду.",
      preview: "/assets/media/media-036.jpg"
    },
    {
      title: "Неоновые отражения Синдзюку",
      category: "Город",
      author: "Kenji Sato",
      date: "4 дня назад",
      likes: "512",
      views: "2.1k",
      description: "Атмосферный ночной Токио под дождем: зеркальные лужи и неоновые вывески.",
      preview: "/assets/media/media-061.jpg"
    },
    {
      title: "Скандинавская студия",
      category: "Дизайн",
      author: "Эмма Линд",
      date: "5 дней назад",
      likes: "210",
      views: "1.1k",
      description: "Минималистичное жилое пространство в теплых естественных тонах с обилием света.",
      preview: "/assets/media/media-090.jpg"
    },
    {
      title: "Минимализм в архитектуре",
      category: "Архитектура",
      author: "Артем Романов",
      date: "1 неделю назад",
      likes: "98",
      views: "640",
      description: "Ритм стеклянных панелей и четкие фасадные линии высотного делового квартала.",
      preview: "/assets/media/media-034.jpg"
    },
    {
      title: "Альпийский рассвет над озером",
      category: "Фотографии",
      author: "Ольга Ветрова",
      date: "1 неделю назад",
      likes: "880",
      views: "3.4k",
      description: "Зеркальная гладь воды и розовое сияние первых лучей на заснеженных вершинах.",
      preview: "/assets/media/media-053.jpg"
    },
    {
      title: "Рабочее место дизайнера",
      category: "Дизайн",
      author: "Илья Чернов",
      date: "2 недели назад",
      likes: "340",
      views: "1.8k",
      description: "Минималистичный сетап с ультрашироким дисплеем, механической клавиатурой и лампой.",
      preview: "/assets/media/media-113.jpg"
    }
  ];

  const VIDEO_DATA = [
    {
      title: "Введение в CSS Grid и Flexbox: полное руководство",
      category: "Обучение",
      author: "Михаил Воронов",
      date: "Вчера, 18:30",
      likes: "348",
      views: "4.2k",
      description: "Пошаговый разбор современной адаптивной верстки и практических приемов.",
      preview: "/assets/media/media-067.jpg"
    },
    {
      title: "Дикая Исландия: Аэросъемка ледников и водопадов",
      category: "Путешествия",
      author: "Елена Романова",
      date: "3 дня назад",
      likes: "1.2k",
      views: "12.8k",
      description: "Кинематографическая аэросъемка ледников, черных пляжей и мощных водопадов.",
      preview: "/assets/media/media-109.jpg"
    },
    {
      title: "Архитектура дизайн-систем: масштабирование токенов",
      category: "Обучение",
      author: "Артем Васильев",
      date: "Неделю назад",
      likes: "512",
      views: "6.4k",
      description: "Как строить масштабируемые дизайн-системы и поддерживать единый визуальный язык.",
      preview: "/assets/media/media-015.jpg"
    },
    {
      title: "Таймлапс: ночное побережье и звездное небо",
      category: "Путешествия",
      author: "Сергей Кузнецов",
      date: "2 недели назад",
      likes: "840",
      views: "9.1k",
      description: "Медленный ночной таймлапс побережья под ярким звездным небом.",
      preview: "/assets/media/media-045.jpg"
    },
    {
      title: "Шоурил моушн-дизайна 2026",
      category: "Развлечения",
      author: "Анна Соколова",
      date: "Вчера",
      likes: "2.1k",
      views: "18.5k",
      description: "Подборка 3D-анимации, кинетической типографики и экспериментального моушна.",
      preview: "/assets/media/media-064.jpg"
    },
    {
      title: "Основы UI-анимации: физика жестов и тайминги",
      category: "Обучение",
      author: "Дмитрий Лебедев",
      date: "4 дня назад",
      likes: "610",
      views: "7.3k",
      description: "Практика плавных интерфейсных переходов, жестов и естественной физики движения.",
      preview: "/assets/media/media-059.jpg"
    },
    {
      title: "Утро в кофейне: кинематографичный слоу-моушн",
      category: "Развлечения",
      author: "Ольга Ильина",
      date: "5 дней назад",
      likes: "490",
      views: "5.8k",
      description: "Мягкий утренний свет, кофе и спокойная кинематографичная съемка в слоу-моушн.",
      preview: "/assets/media/media-052.jpg"
    },
    {
      title: "Как устроен квантовый процессор",
      category: "Технологии",
      author: "Константин Власов",
      date: "1 неделю назад",
      likes: "970",
      views: "11.2k",
      description: "Наглядный разбор архитектуры квантового процессора и базовых принципов его работы.",
      preview: "/assets/media/media-017.jpg"
    }
  ];

  const CONFIG = {
    images: {
      title: "Изображения",
      subtitle: "Фотографии и графические материалы пользователей",
      mobileSubtitle: "Фотографии и графические материалы пользователей (180)",
      mobileCount: "180 ФОТО",
      icon: "image",
      typeText: "Изображения (180)",
      summary: "Всего файлов: 180",
      shownDesktop: "Показано 1–8 из 180 изображений",
      shownMobile: "Показано 4 из 180 изображений",
      uploadTitle: "Есть свои изображения?",
      uploadText: "Загрузите JPG, PNG или WEBP",
      data: IMAGE_DATA
    },
    videos: {
      title: "Видео",
      subtitle: "Видео пользователей галереи",
      mobileSubtitle: "Видео пользователей галереи (98)",
      mobileCount: "98 ВИДЕО",
      icon: "videocam",
      typeText: "Видео (98)",
      summary: "Всего видео: 98",
      shownDesktop: "Показано 1–8 из 98 видео",
      shownMobile: "Показано 4 из 98 видео",
      uploadTitle: "Есть свое видео?",
      uploadText: "Загрузите MP4 или WEBM",
      data: VIDEO_DATA
    }
  };

  function pageKey() {
    if (PATH.endsWith("/images.html")) return "images";
    if (PATH.endsWith("/videos.html")) return "videos";
    return "";
  }

  function clean(value) {
    return (value || "").replace(/\s+/g, " ").trim();
  }

  function replaceExact(scope, from, to) {
    [...scope.querySelectorAll("*")].forEach((el) => {
      if (el.children.length === 0 && clean(el.textContent) === from) {
        el.textContent = to;
      }
    });
  }

  function updateHeader(scope, cfg) {
    const h1 = scope.querySelector("h1");
    if (h1) h1.textContent = cfg.title;

    if (h1?.parentElement) {
      const mobile = scope.classList.contains("mobile-view");
      const headerBlock = mobile ? h1.parentElement.parentElement : h1.parentElement;
      const subtitle = headerBlock
        ? [...headerBlock.children].find((el) => el.tagName === "P")
        : null;

      if (subtitle) {
        subtitle.textContent = mobile ? cfg.mobileSubtitle : cfg.subtitle;

        if (!mobile) {
          subtitle.classList.remove("font-body-md", "text-body-md");
          subtitle.classList.add("font-body-lg", "text-body-lg");
          subtitle.style.setProperty("font-size", "16px", "important");
          subtitle.style.setProperty("line-height", "24px", "important");
          subtitle.style.setProperty("font-weight", "400", "important");
        }
      }

      if (!mobile) {
        const typeIcon = h1.parentElement.querySelector(".material-symbols-outlined");
        if (typeIcon) typeIcon.textContent = cfg.icon;
      }
    }

    if (scope.classList.contains("mobile-view")) {
      const badge = h1?.parentElement?.querySelector("span");
      if (badge) badge.textContent = cfg.mobileCount;
    }

    replaceExact(scope, "Тип: Аудио (64 трека)", "Тип: " + cfg.typeText);
    replaceExact(scope, "Суммарно: 18 ч 40 мин", cfg.summary);
    replaceExact(scope, "Показано 1–8 из 64 аудиоматериалов", cfg.shownDesktop);
    replaceExact(scope, "Показано 4 из 64 аудиофайлов", cfg.shownMobile);
    replaceExact(scope, "Есть свой трек?", cfg.uploadTitle);
    replaceExact(scope, "Загрузите MP3, WAV или FLAC", cfg.uploadText);

    const quickChip = [...scope.querySelectorAll("strong")]
      .find((el) => clean(el.textContent) === "Аудио (64 трека)");
    if (quickChip) quickChip.textContent = cfg.typeText;

    const quickChipWrap = quickChip?.closest("div");
    const quickChipIcon = quickChipWrap?.querySelector(".material-symbols-outlined");
    if (quickChipIcon) quickChipIcon.textContent = cfg.icon;
  }

  function updateCard(card, data) {
    if (!card || !data) return;

    const preview = card.querySelector(".mg-card__preview");
    const image = preview?.querySelector("img");
    const placeholder = preview?.querySelector(".mg-card__placeholder");

    if (data.preview) {
      if (image) {
        image.src = data.preview;
      } else if (preview) {
        const img = document.createElement("img");
        img.src = data.preview;
        img.alt = "";
        if (placeholder) placeholder.replaceWith(img);
        else preview.prepend(img);
      }
    }

    const title = card.querySelector(".mg-card__title");
    const category = card.querySelector(".mg-card__category");
    const author = card.querySelector(".mg-card__author-name");
    const date = card.querySelector(".mg-card__date");
    const description = card.querySelector(".mg-card__description");
    const metrics = [...card.querySelectorAll(".mg-card__metric")];

    if (title) title.textContent = data.title;
    if (category) category.textContent = data.category;
    if (author) author.textContent = data.author;
    if (date) date.textContent = data.date;
    if (description) description.textContent = data.description;

    const likes = card.querySelector(".mg-card__metric--likes");
    if (likes) {
      const icon = likes.querySelector(".material-symbols-outlined");
      likes.textContent = data.likes;
      if (icon) likes.prepend(icon);
    }

    const views = metrics.find((el) => !el.classList.contains("mg-card__metric--likes"));
    if (views) {
      const icon = views.querySelector(".material-symbols-outlined");
      views.textContent = data.views;
      if (icon) views.prepend(icon);
    }

    const save = card.querySelector(".mg-card__save");
    if (save) save.setAttribute("aria-label", "Сохранить " + data.title);
  }

  function updateCards(scope, cfg) {
    [...scope.querySelectorAll(".mg-card")].forEach((card, index) => {
      updateCard(card, cfg.data[index % cfg.data.length]);
    });
  }

  function updateMobileControls(scope, key) {
    if (!scope.classList.contains("mobile-view")) return;

    const input = [...scope.querySelectorAll("input")].find((node) =>
      /поиск/i.test(node.getAttribute("placeholder") || "")
    );

    if (input) {
      input.placeholder = key === "images"
        ? "Поиск по названию или автору..."
        : "Поиск видео...";
    }

    const chipRow = [...scope.querySelectorAll("div")].find((node) =>
      node.classList.contains("overflow-x-auto") &&
      node.querySelectorAll(":scope > button").length >= 3
    );

    if (chipRow) {
      const specs = key === "images"
        ? [
            ["Все категории", ""],
            ["Фотографии", "photo_camera"],
            ["Обучение", "school"],
            ["Развлечения", "celebration"],
            ["Другое", "category"]
          ]
        : [
            ["Все", ""],
            ["Обучение", "school"],
            ["Развлечения", "movie"],
            ["Путешествия", "travel_explore"],
            ["Технологии", "memory"]
          ];

      const template = chipRow.querySelector("button");
      if (template) {
        chipRow.innerHTML = "";
        specs.forEach(([label, icon], index) => {
          const button = template.cloneNode(true);
          button.removeAttribute("onclick");
          button.classList.toggle("bg-primary", index === 0);
          button.classList.toggle("bg-primary-container", index === 0);
          button.classList.toggle("text-on-primary", index === 0);
          button.classList.toggle("bg-surface-container", index !== 0);
          button.classList.toggle("text-on-surface-variant", index !== 0);
          button.innerHTML = (icon
            ? '<span class="material-symbols-outlined text-[16px]">' + icon + "</span>"
            : "") + "<span>" + label + "</span>";
          chipRow.appendChild(button);
        });
      }
    }

    const extraAction = [...scope.querySelectorAll("button")].find((button) =>
      button.getAttribute("aria-label") === "Случайный трек"
    );

    if (extraAction) {
      if (key === "videos") {
        extraAction.style.display = "none";
      } else {
        extraAction.setAttribute("aria-label", "Вид списком");
        extraAction.innerHTML = '<span class="material-symbols-outlined text-[18px]">view_agenda</span>';

        if (!extraAction.previousElementSibling?.matches("[data-mg-grid-view]")) {
          const grid = extraAction.cloneNode(true);
          grid.dataset.mgGridView = "1";
          grid.setAttribute("aria-label", "Вид сеткой");
          grid.innerHTML = '<span class="material-symbols-outlined text-[18px]">grid_view</span>';
          extraAction.parentElement?.insertBefore(grid, extraAction);
        }
      }
    }

    scope.querySelectorAll(".mg-card").forEach((card) => {
      const type = card.querySelector(".mg-card__type");
      const save = card.querySelector(".mg-card__save");
      const saveIcon = save?.querySelector(".material-symbols-outlined");

      if (key === "images") {
        if (type) type.textContent = "ФОТО";
        if (save) save.setAttribute("aria-label", "Сохранить");
        if (saveIcon) saveIcon.textContent = "bookmark_border";
      } else if (key === "videos") {
        if (type) type.textContent = "ВИДЕО";
      }
    });
  }

  function updateDesktopNav(scope, key) {
    const targetPath = key === "images" ? "images" : key === "videos" ? "videos" : "audio";
    const header = scope.querySelector("header");
    if (!header) return;

    const links = [...header.querySelectorAll('a[data-path="images"], a[data-path="videos"], a[data-path="audio"]')];

    links.forEach((link) => {
      const active = link.dataset.path === targetPath;

      link.classList.remove(
        "bg-surface-container-high",
        "text-primary",
        "font-title-md"
      );

      link.classList.add(
        "rounded-lg",
        "transition-colors",
        "hover:bg-surface-container",
        "hover:text-on-surface"
      );

      if (active) {
        link.classList.remove("text-on-surface-variant");
        link.classList.add(
          "bg-surface-container-high",
          "text-primary",
          "font-title-md"
        );
        link.setAttribute("aria-current", "page");
      } else {
        link.classList.add("text-on-surface-variant");
        link.removeAttribute("aria-current");
      }
    });
  }

  function updateBottomNav(scope, key) {
    const wantedPaths = key === "images"
      ? ["images", "izobrazheniya"]
      : key === "videos"
        ? ["videos", "video"]
        : ["audio"];

    const nav = scope.querySelector("nav.fixed.bottom-0");
    if (!nav) return;

    [...nav.querySelectorAll("a[data-path]")].forEach((link) => {
      const active = wantedPaths.includes(link.dataset.path);
      link.classList.remove("text-primary", "font-semibold");
      link.removeAttribute("aria-current");

      if (active) {
        link.classList.add("text-primary", "font-semibold");
        link.setAttribute("aria-current", "page");
      }
    });
  }

  function run() {
    const key = pageKey();
    if (!key) return;
    const cfg = CONFIG[key];

    document.title = cfg.title + " — MediaGallery";

    document.querySelectorAll(".desktop-view, .mobile-view").forEach((scope) => {
      updateHeader(scope, cfg);
      updateCards(scope, cfg);
      updateMobileControls(scope, key);
      updateDesktopNav(scope, key);
      updateBottomNav(scope, key);
    });
  }

  run();
})();
