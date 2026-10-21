(() => {
  const path = location.pathname.toLowerCase();
  if (!path.endsWith("/detail.html")) return;

  const params = new URLSearchParams(location.search);
  const requested = (params.get("type") || "video").toLowerCase();
  const type = ["image", "video", "audio"].includes(requested) ? requested : "video";

  const CONFIG = {
    video: {
      title: "Создание адаптивных интерфейсов на HTML и CSS",
      category: "Обучение",
      kind: "Видео",
      topLabel: "Учебный курс",
      topFormat: "1080p 60fps",
      formatBadge: "1080p Full HD",
      topic: "CSS Grid & Flexbox",
      viewerInfo: "05:24 / 18:40",
      quality: "1080p",
      speed: "1.0x",
      viewsWord: "просмотров",
      descriptionTitle: "Описание урока",
      description1: "В этом практическом уроке мы детально разберем методологию создания полностью отзывчивых веб-страниц, начиная от настройки базового холста до сложных адаптивных систем на чистом CSS. Мы откажемся от избыточных библиотек в пользу нативных возможностей современных браузеров: Flexbox, CSS Grid с автоподстройкой колонок через minmax(), а также современных единиц измерения dvh и cqw.",
      description2: "Урок включает пошаговую верстку реального интерфейса каталога медиафайлов, работу с медиазапросами для мобильных устройств, планшетов и сверхшироких мониторов, а также оптимизацию загрузки графических ассетов.",
      contentsTitle: "Таймкоды и содержание",
      contents: [
        ["00:00 — Введение и архитектура макета", "00:00"],
        ["05:24 — Настройка сетки Grid и Breakpoints", "Текущий"],
        ["09:15 — Оптимизация медиафайлов и srcset", "09:15"],
        ["14:50 — Тестирование на реальных девайсах", "14:50"]
      ],
      infoBadge: "HD Video",
      info: {
        "Тип контента": ["Тип контента", "Видео"],
        "Формат / Кодек": ["Формат / Кодек", "MP4 (H.264)"],
        "Разрешение": ["Разрешение", "1920 × 1080 (16:9)"],
        "Длительность": ["Длительность", "18 мин 40 сек"],
        "Размер файла": ["Размер файла", "245 МБ"],
        "Частота кадров": ["Частота кадров", "60 fps"],
        "Аудиодорожка": ["Аудиодорожка", "AAC 320 kbps Stereo"]
      },
      download: "Скачать оригинал (245 МБ)",
      attachment: "Материалы урока (ZIP, 14 МБ)",
      statsTitle: "Статистика просмотров",
      statLabel: "Удержание аудитории",
      statHint: "Пик активности на 05:24 (разбор CSS Grid layout).",
      relatedHint: "Рекомендации на основе тематики и категории видео",
      relatedCta: "Смотреть все видео",
      relatedKind: "Видео",
      relatedTitles: [
        "Быстрый старт с Tailwind CSS",
        "Токены дизайн-систем в Figma",
        "Микро-анимации на чистом JS",
        "Адаптивная типографика без библиотек"
      ],
      deleteText: "Вы собираетесь удалить «Создание адаптивных интерфейсов на HTML и CSS». Это действие невозможно отменить, и файл будет удален из облачного хранилища."
    },
    audio: {
      title: "Synthwave Midnight Drive",
      category: "Музыка",
      kind: "Аудио",
      topLabel: "Аудиотрек",
      topFormat: "MP3 • 320 kbps",
      formatBadge: "MP3 • Stereo",
      topic: "Synthwave",
      viewerInfo: "01:36 / 03:42",
      quality: "320 kbps",
      speed: "1.0x",
      viewsWord: "прослушиваний",
      descriptionTitle: "Описание аудио",
      description1: "Атмосферный synthwave-трек с плотным басом, мягкими аналоговыми синтезаторами и ночным ретро-футуристическим настроением.",
      description2: "Композиция подходит для фонового прослушивания, поездок и творческой работы. Оригинальный файл доступен в высоком качестве.",
      contentsTitle: "Структура трека",
      contents: [
        ["00:00 — Интро и атмосферный слой", "00:00"],
        ["00:42 — Основная тема", "Главная"],
        ["01:36 — Синтезаторный переход", "01:36"],
        ["02:48 — Финальная часть", "02:48"]
      ],
      infoBadge: "MP3 Audio",
      info: {
        "Тип контента": ["Тип контента", "Аудио"],
        "Формат / Кодек": ["Формат / Кодек", "MP3"],
        "Разрешение": ["Каналы", "Stereo 2.0"],
        "Длительность": ["Длительность", "3 мин 42 сек"],
        "Размер файла": ["Размер файла", "8.6 МБ"],
        "Частота кадров": ["Частота дискретизации", "44.1 кГц"],
        "Аудиодорожка": ["Битрейт", "320 kbps"]
      },
      download: "Скачать оригинал (8.6 МБ)",
      attachment: "Обложка и метаданные (ZIP, 2 МБ)",
      statsTitle: "Статистика прослушиваний",
      statLabel: "Дослушивания",
      statHint: "Пик активности на 01:36 (синтезаторный переход).",
      relatedHint: "Рекомендации на основе жанра и категории аудио",
      relatedCta: "Смотреть все аудио",
      relatedKind: "Аудио",
      relatedTitles: [
        "Deep Horizon Lo-Fi",
        "Neon Horizon (Ambient Cut)",
        "Night Drive Sessions",
        "Focus Waves"
      ],
      deleteText: "Вы собираетесь удалить «Synthwave Midnight Drive». Это действие невозможно отменить, и аудиофайл будет удален из облачного хранилища."
    },
    image: {
      title: "Рассвет на плато Бермамыт",
      category: "Фотографии",
      kind: "Изображение",
      topLabel: "Фотография",
      topFormat: "RAW • Ultra-HD",
      formatBadge: "RAW • 24 МП",
      topic: "Пейзаж",
      viewerInfo: "6000 × 4000",
      quality: "100%",
      speed: "1:1",
      viewsWord: "просмотров",
      descriptionTitle: "Описание изображения",
      description1: "Первые лучи восходящего солнца над плато Бермамыт и плотное туманное море в ущельях Кавказа. Кадр снят в мягком утреннем свете.",
      description2: "Оригинал сохранен в высоком разрешении с широким динамическим диапазоном и подходит для детального просмотра и печати.",
      contentsTitle: "Параметры изображения",
      contents: [
        ["Разрешение — 6000 × 4000", "24 МП"],
        ["Камера — Sony α7 IV", "RAW"],
        ["Объектив — 24–70 мм f/2.8", "f/8"],
        ["Локация — плато Бермамыт", "Кавказ"]
      ],
      infoBadge: "RAW Photo",
      info: {
        "Тип контента": ["Тип контента", "Изображение"],
        "Формат / Кодек": ["Формат", "RAW (ARW)"],
        "Разрешение": ["Разрешение", "6000 × 4000"],
        "Длительность": ["Цветовой профиль", "sRGB"],
        "Размер файла": ["Размер файла", "42 МБ"],
        "Частота кадров": ["Ориентация", "Альбомная"],
        "Аудиодорожка": ["Камера", "Sony α7 IV"]
      },
      download: "Скачать оригинал (42 МБ)",
      attachment: "Превью и EXIF (ZIP, 3 МБ)",
      statsTitle: "Статистика просмотров",
      statLabel: "Сохранения",
      statHint: "Чаще всего изображение открывают в полном разрешении.",
      relatedHint: "Рекомендации на основе тематики и категории изображения",
      relatedCta: "Смотреть все изображения",
      relatedKind: "Изображение",
      relatedTitles: [
        "Альпийский рассвет над озером",
        "Утренняя роса на клевере",
        "Неоновые отражения Синдзюку",
        "Геометрия бетона: Музей"
      ],
      deleteText: "Вы собираетесь удалить «Рассвет на плато Бермамыт». Это действие невозможно отменить, и изображение будет удалено из облачного хранилища."
    }
  };

  const cfg = CONFIG[type];

  function clean(value) {
    return (value || "").replace(/\s+/g, " ").trim();
  }

  function replaceTextNodes(scope, replacements) {
    const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let node;
    while ((node = walker.nextNode())) nodes.push(node);

    nodes.forEach((textNode) => {
      const value = clean(textNode.nodeValue);
      if (!value) return;
      if (Object.prototype.hasOwnProperty.call(replacements, value)) {
        textNode.nodeValue = textNode.nodeValue.replace(value, replacements[value]);
      }
    });
  }

  function setExactElementText(scope, selector, from, to) {
    [...scope.querySelectorAll(selector)].forEach((el) => {
      if (clean(el.innerText) === from) el.textContent = to;
    });
  }

  function updateContents(scope) {
    const labels = [
      "00:00 — Введение и архитектура макета",
      "05:24 — Настройка сетки Grid и Breakpoints",
      "09:15 — Оптимизация медиафайлов и srcset",
      "14:50 — Тестирование на реальных девайсах"
    ];
    const right = ["00:00", "Текущий", "09:15", "14:50"];

    labels.forEach((oldText, index) => {
      setExactElementText(scope, "span", oldText, cfg.contents[index][0]);
    });

    right.forEach((oldText, index) => {
      const candidates = [...scope.querySelectorAll("span")].filter((el) => clean(el.innerText) === oldText);
      const target = candidates.find((el) => el.closest("button") && /rounded|group/.test(el.closest("button").className || ""));
      if (target) target.textContent = cfg.contents[index][1];
    });
  }

  function updateInfo(scope) {
    const values = {
      "Видео": cfg.info["Тип контента"][1],
      "MP4 (H.264)": cfg.info["Формат / Кодек"][1],
      "1920 × 1080 (16:9)": cfg.info["Разрешение"][1],
      "18 мин 40 сек": cfg.info["Длительность"][1],
      "245 МБ": cfg.info["Размер файла"][1],
      "60 fps": cfg.info["Частота кадров"][1],
      "AAC 320 kbps Stereo": cfg.info["Аудиодорожка"][1]
    };

    const labels = {
      "Тип контента": cfg.info["Тип контента"][0],
      "Формат / Кодек": cfg.info["Формат / Кодек"][0],
      "Разрешение": cfg.info["Разрешение"][0],
      "Длительность": cfg.info["Длительность"][0],
      "Размер файла": cfg.info["Размер файла"][0],
      "Частота кадров": cfg.info["Частота кадров"][0],
      "Аудиодорожка": cfg.info["Аудиодорожка"][0]
    };

    replaceTextNodes(scope, { ...values, ...labels });
  }

  function updateRelated(scope) {
    const typeBadges = [...scope.querySelectorAll("span")].filter((el) => clean(el.innerText) === "Видео");
    typeBadges.forEach((el) => {
      if (el.className.includes("absolute top-2 left-2")) el.textContent = cfg.relatedKind;
    });

    const relatedSection = [...scope.querySelectorAll("section")].find((section) =>
      [...section.querySelectorAll("h2,h3")].some((heading) => clean(heading.innerText) === "Похожие материалы")
    );

    if (relatedSection) {
      const titleNodes = [
        ...relatedSection.querySelectorAll("h4"),
        ...relatedSection.querySelectorAll("a.font-title-md")
      ].filter((el, index, array) =>
        clean(el.innerText) &&
        clean(el.innerText) !== cfg.relatedCta &&
        array.indexOf(el) === index
      );

      titleNodes.slice(0, cfg.relatedTitles.length).forEach((el, index) => {
        el.textContent = cfg.relatedTitles[index];
      });
    }

    if (type === "audio") {
      replaceTextNodes(scope, {
        "890 просмотров": "890 прослушиваний",
        "2.1k просмотров": "2.1k прослушиваний",
        "3.4k просмотров": "3.4k прослушиваний"
      });
    }

    if (type === "image") {
      const relatedMeta = [...scope.querySelectorAll("span")]
        .filter((el) => el.className.includes("absolute bottom-2 right-2"));
      ["6000×4000", "4K", "JPG", "RAW"].forEach((value, index) => {
        if (relatedMeta[index]) relatedMeta[index].textContent = value;
      });
    }
  }

  function updateMobileSpecific(scope) {
    if (!scope.classList.contains("mobile-view")) return;

    const topFormatBadge = [...scope.querySelectorAll("span")].find((el) =>
      el.className.includes("rounded-full") &&
      el.className.includes("bg-inverse-surface/80") &&
      /1080/i.test(clean(el.innerText))
    );

    const topTypeBadge = [...scope.querySelectorAll("span")].find((el) =>
      el.className.includes("rounded-full") &&
      el.className.includes("bg-primary-container/90")
    );

    const detailTypeBadge = [...scope.querySelectorAll("span")].find((el) =>
      el.className.includes("px-2.5") &&
      el.className.includes("bg-primary-fixed") &&
      !el.className.includes("absolute")
    );

    if (topFormatBadge) topFormatBadge.textContent = cfg.topFormat;
    if (topTypeBadge) topTypeBadge.textContent = cfg.kind;
    if (detailTypeBadge) detailTypeBadge.textContent = cfg.kind;

    const mobileDescription = [...scope.querySelectorAll("p")].find((p) =>
      clean(p.innerText).startsWith("Практический видеоурок")
    );
    if (mobileDescription) mobileDescription.textContent = cfg.description1;

    const infoLabels = [...scope.querySelectorAll("span")]
      .filter((el) => el.className.includes("font-body-sm") && el.className.includes("text-outline"));

    function setMobileInfoRow(oldLabels, newLabel, newValue) {
      const label = infoLabels.find((el) => oldLabels.includes(clean(el.innerText)));
      if (!label) return;
      const row = label.parentElement;
      const value = row?.querySelector("span.font-label-lg");
      label.textContent = newLabel;
      if (value) value.textContent = newValue;
    }

    if (type === "audio") {
      setMobileInfoRow(["Формат"], "Формат", "MP3");
      setMobileInfoRow(["Разрешение", "Каналы"], "Каналы", "Stereo 2.0");
      setMobileInfoRow(["Аудио", "Битрейт"], "Битрейт", "320 kbps");
    }

    if (type === "image") {
      setMobileInfoRow(["Формат"], "Формат", "RAW");
      setMobileInfoRow(["Разрешение", "Каналы"], "Разрешение", "6000 × 4000 px");
      setMobileInfoRow(["Аудио", "Камера"], "Камера", "Sony α7 IV");
    }

    const chapterButtons = [...scope.querySelectorAll("button")]
      .filter((button) =>
        button.className.includes("p-2.5") &&
        button.querySelector("span.font-body-md")
      )
      .slice(0, 4);

    if (chapterButtons.length === 4) {
      const mobileContents = type === "audio"
        ? [
            ["00:00", "Интро и атмосферный слой"],
            ["00:42", "Основная тема"],
            ["01:36", "Синтезаторный переход"],
            ["02:48", "Финальная часть"]
          ]
        : type === "image"
          ? [
              ["24 МП", "Разрешение 6000 × 4000"],
              ["RAW", "Камера Sony α7 IV"],
              ["f/8", "Объектив 24–70 мм f/2.8"],
              ["Кавказ", "Локация: плато Бермамыт"]
            ]
          : [
              ["00:00", "Введение и настройка окружения"],
              ["05:24", "Анатомия CSS Flexbox и адаптив"],
              ["09:15", "Построение макета на CSS Grid"],
              ["14:50", "Оптимизация под мобильные экраны"]
            ];

      chapterButtons.forEach((button, index) => {
        const spans = [...button.querySelectorAll("span")];
        const badge = spans.find((span) =>
          span.className.includes("shrink-0") &&
          !span.className.includes("material-symbols-outlined")
        );
        const label = spans.find((span) =>
          span.className.includes("font-body-md") &&
          !span.className.includes("material-symbols-outlined")
        );
        if (badge) badge.textContent = mobileContents[index][0];
        if (label) label.textContent = mobileContents[index][1];
      });
    }
  }

  function restoreNavigation(scope) {
    const mobileScope = scope.classList.contains("mobile-view");
    const headerLabels = {
      "gallery": "Галерея",
      "galereya": "Галерея",
      "images": mobileScope ? "Фото" : "Изображения",
      "izobrazheniya": mobileScope ? "Фото" : "Изображения",
      "videos": "Видео",
      "video": "Видео",
      "audio": "Аудио"
    };

    Object.entries(headerLabels).forEach(([path, label]) => {
      scope.querySelectorAll('a[data-path="' + path + '"]').forEach((link) => {
        const nav = link.closest("nav");
        const isBreadcrumb = nav &&
          (nav.className.includes("overflow-x-auto") || nav.className.includes("whitespace-nowrap"));

        if (isBreadcrumb && (path === "videos" || path === "video")) {
          const targetPath = type === "audio" ? "audio" : type === "image" ? "images" : "videos";
          link.dataset.path = targetPath;
          link.textContent = cfg.kind;
          return;
        }

        const labelSpan = [...link.querySelectorAll("span")]
          .filter((span) => !span.className.includes("material-symbols-outlined"))
          .pop();

        if (labelSpan) {
          labelSpan.textContent = label;
        } else if (!link.querySelector("img") && !link.querySelector(".material-symbols-outlined")) {
          link.textContent = label;
        }
      });
    });
  }

  function updateDescriptionBlocks(scope) {
    const desktopLead = [...scope.querySelectorAll("p")].find((p) =>
      clean(p.innerText).startsWith("В этом практическом уроке")
    );
    if (desktopLead) desktopLead.textContent = cfg.description1;

    const mobileLead = [...scope.querySelectorAll("p")].find((p) =>
      clean(p.innerText).startsWith("Практический видеоурок")
    );
    if (mobileLead) mobileLead.textContent = cfg.description1;

    const viewerInfo = [...scope.querySelectorAll("span")].find((span) =>
      span.className.includes("tracking-tight") &&
      span.className.includes("ml-2") &&
      /\//.test(clean(span.innerText))
    );
    if (viewerInfo) viewerInfo.textContent = cfg.viewerInfo;

    if (type === "audio") {
      replaceTextNodes(scope, {
        "#css": "#synthwave",
        "#html5": "#music",
        "#responsive": "#ambient",
        "#frontend": "#electronic",
        "#веб-разработка": "#audio"
      });
    }

    if (type === "image") {
      replaceTextNodes(scope, {
        "#css": "#пейзаж",
        "#html5": "#фотография",
        "#responsive": "#рассвет",
        "#frontend": "#горы",
        "#веб-разработка": "#nature"
      });
    }
  }

  function updateScope(scope) {
    const replacements = {
      "Создание адаптивных интерфейсов на HTML и CSS": cfg.title,
      "Учебный курс": cfg.topLabel,
      "1080p 60fps": cfg.topFormat,
      "05:24 / 18:40": cfg.viewerInfo,
      "1080p": cfg.quality,
      "1.0x": cfg.speed,
      "Видео": cfg.kind,
      "Обучение": cfg.category,
      "1080p Full HD": cfg.formatBadge,
      "CSS Grid & Flexbox": cfg.topic,
      "Описание урока": cfg.descriptionTitle,
      "В этом практическом уроке мы детально разберем методологию создания полностью отзывчивых веб-страниц, начиная от настройки базового холста до сложных адаптивных систем на чистом CSS. Мы откажемся от избыточных библиотек в пользу нативных возможностей современных браузеров: Flexbox, CSS Grid с автоподстройкой колонок через minmax(), а также современных единиц измерения dvh и cqw.": cfg.description1,
      "Урок включает пошаговую верстку реального интерфейса каталога медиафайлов, работу с медиазапросами для мобильных устройств, планшетов и сверхшироких мониторов, а также оптимизацию загрузки графических ассетов.": cfg.description2,
      "Таймкоды и содержание": cfg.contentsTitle,
      "HD Video": cfg.infoBadge,
      "Скачать оригинал (245 МБ)": cfg.download,
      "Материалы урока (ZIP, 14 МБ)": cfg.attachment,
      "Статистика просмотров": cfg.statsTitle,
      "Удержание аудитории": cfg.statLabel,
      "Пик активности на 05:24 (разбор CSS Grid layout).": cfg.statHint,
      "Рекомендации на основе тематики и категории видео": cfg.relatedHint,
      "Смотреть все видео": cfg.relatedCta,
      "Вы собираетесь удалить «Создание адаптивных интерфейсов на HTML и CSS». Это действие невозможно отменить, и файл будет удален из облачного хранилища.": cfg.deleteText
    };

    replaceTextNodes(scope, replacements);

    if (type === "audio") {
      replaceTextNodes(scope, {
        "1 420 просмотров": "1 420 прослушиваний"
      });
    }

    updateContents(scope);
    updateInfo(scope);
    updateRelated(scope);
    updateMobileSpecific(scope);
    updateDescriptionBlocks(scope);
    restoreNavigation(scope);
  }

  document.title = cfg.title + " — MediaGallery";
  document.querySelectorAll(".desktop-view, .mobile-view").forEach(updateScope);
})();
