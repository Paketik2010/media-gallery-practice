(() => {
  if (!window.MG) return;

  function fullDate(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "Недавно";

    return new Intl.DateTimeFormat("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(date);
  }

  function formatName(material, meta = {}) {
    const candidates = [
      String(material.originalName || ""),
      String(material.fileUrl || ""),
      String(material.sourceUrl || "")
    ];

    for (const candidate of candidates) {
      const clean = candidate.split(/[?#]/)[0];
      const ext = clean.includes(".") ? clean.split(".").pop().toUpperCase() : "";

      if (/^(JPG|JPEG|PNG|WEBP|GIF|MP3|WAV|M4A|AAC|FLAC|OGG|OGA|MP4|WEBM|OGV|MOV)$/.test(ext)) {
        return ext === "JPEG" ? "JPG" : ext;
      }
    }

    const mime = String(material.mimeType || meta.mimeType || "").toLowerCase();
    const mimeFormats = {
      "image/jpeg": "JPG",
      "image/jpg": "JPG",
      "image/png": "PNG",
      "image/webp": "WEBP",
      "image/gif": "GIF",
      "audio/mpeg": "MP3",
      "audio/mp3": "MP3",
      "audio/wav": "WAV",
      "audio/x-wav": "WAV",
      "audio/mp4": "M4A",
      "audio/x-m4a": "M4A",
      "audio/aac": "AAC",
      "audio/flac": "FLAC",
      "audio/ogg": "OGG",
      "application/ogg": "OGG",
      "video/mp4": "MP4",
      "video/webm": "WEBM",
      "video/ogg": "OGV",
      "video/quicktime": "MOV"
    };

    if (mimeFormats[mime]) return mimeFormats[mime];

    return material.type === "image" ? "JPG" :
      material.type === "audio" ? "MP3" : "MP4";
  }

  function setMetric(root, iconName, value) {
    if (!root) return;

    const icon = [...root.querySelectorAll(".material-symbols-outlined")].find((node) => {
      return node.textContent.trim() === iconName;
    });

    if (!icon) return;

    const row = icon.parentElement;
    if (!row) return;

    [...row.childNodes].forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) node.remove();
    });

    const valueNode = [...row.children].find((node) => node !== icon);

    if (valueNode) {
      valueNode.textContent = value;
    } else {
      row.append(document.createTextNode(" " + value));
    }
  }

  function updateBadges(row, material) {
    if (!row) return;

    const badges = [...row.children].filter((node) => node.tagName === "SPAN");
    const info = MG.typeInfo(material.type);

    if (badges[0]) badges[0].textContent = info.label;
    if (badges[1]) badges[1].textContent = material.category;
    if (badges[2]) badges[2].textContent = formatName(material);
    if (badges[3]) badges[3].hidden = true;
  }

  function setupMedia(scope, material) {
    const isMobile = scope.classList.contains("mobile-view");
    const container = isMobile
      ? scope.querySelector("main .aspect-video")
      : scope.querySelector("#video-container");

    if (!container) return;

    const source = MG.mediaUrl(material.fileUrl || material.sourceUrl || "");
    const poster = MG.mediaUrl(material.thumbnailUrl || "");

    if (material.type === "video") {
      container.innerHTML = source
        ? '<video class="w-full h-full object-contain bg-black" src="' + MG.esc(source) + '"></video>'
        : '<div class="w-full h-full flex items-center justify-center bg-surface-container">Видео</div>';
      return;
    }

    if (material.type === "image") {
      container.innerHTML = source
        ? '<img class="w-full h-full object-contain bg-black" src="' + MG.esc(source) + '" alt="' + MG.esc(material.title) + '">'
        : '<div class="w-full h-full flex items-center justify-center bg-surface-container"><span class="material-symbols-outlined text-[64px] text-outline">image</span></div>';
      return;
    }

    container.innerHTML =
      '<div class="w-full h-full flex flex-col items-center justify-center gap-4 p-6 bg-inverse-surface">' +
        (poster
          ? '<img class="w-40 h-40 rounded-xl object-cover shadow-lg" src="' + MG.esc(poster) + '" alt="">'
          : '<div class="w-32 h-32 rounded-full bg-tertiary-fixed flex items-center justify-center"><span class="material-symbols-outlined text-[58px] text-tertiary">headphones</span></div>') +
        (source
          ? '<span class="text-inverse-on-surface">Аудиоматериал добавлен</span>'
          : '<p class="text-inverse-on-surface">Аудиофайл недоступен</p>') +
      '</div>';
  }

  function hydrateDesktop(scope, material) {
    const title = scope.querySelector("main h1");
    if (!title) return;

    title.textContent = material.title;

    const breadcrumb = scope.querySelector("main nav");
    const breadcrumbLast = breadcrumb?.querySelector("span:last-child");
    if (breadcrumb) {
      const home = breadcrumb.querySelector('a[data-path="main"] span:not(.material-symbols-outlined)');
      if (home) home.textContent = "Главная";
      const typeLink = breadcrumb.querySelector('a[data-path="videos"]');
      const pages = { image: ["images", "Изображения"], video: ["videos", "Видео"], audio: ["audio", "Аудио"] };
      if (typeLink) {
        typeLink.dataset.path = pages[material.type][0];
        typeLink.href = MG.pageFile(pages[material.type][0] + ".html");
        typeLink.textContent = pages[material.type][1];
      }
      const current = breadcrumb.querySelector("span.text-on-surface");
      if (current) current.textContent = material.title;
    }

    const card = title.closest(".p-space-lg.rounded-xl");
    const badgeRow = card?.querySelector(".flex.flex-wrap.items-center.gap-2");
    updateBadges(badgeRow, material);

    setMetric(card, "calendar_today", fullDate(material.createdAt));

    const author = [...(card?.querySelectorAll('a[data-path="profile"]') || [])].find((node) => {
      return node.classList.contains("font-title-md");
    });

    if (author) author.textContent = material.author.name;

    const authorLine = card?.querySelector("p.font-body-sm");
    if (authorLine) authorLine.textContent = "@" + material.author.username;
    const aside = scope.querySelector("aside");
    const about = [...(aside?.querySelectorAll("h2") || [])]
      .find((node) => node.textContent.trim() === "О материале")?.closest(".p-space-lg.rounded-xl");
    if (about) {
      about.querySelector(".bg-secondary-fixed")?.remove();
      about.querySelectorAll('[class~="py-2.5"]').forEach((row) => {
        if (row.textContent.includes("Тип контента")) {
          const value = row.querySelector(".font-semibold");
          if (value) value.textContent = MG.typeInfo(material.type).label;
        } else {
          row.remove();
        }
      });
      about.querySelectorAll("button").forEach((node) => node.remove());
    }
    if (aside) [...aside.children].slice(1).forEach((node) => node.remove());
    scope.querySelector("#delete-asset-btn")?.parentElement?.remove();
    [...scope.querySelectorAll("button")].filter((node) => node.textContent.includes("Подписаться"))
      .forEach((node) => node.remove());
    card?.querySelectorAll(".material-symbols-outlined").forEach((icon) => {
      if (["visibility", "thumb_up"].includes(icon.textContent.trim())) icon.parentElement?.remove();
    });


    const related = [...scope.querySelectorAll("h2")].find((node) => node.textContent.trim() === "Похожие материалы");
    related?.closest("section")?.remove();

    const descriptionTitle = [...scope.querySelectorAll("h2")].find((node) => {
      return node.textContent.includes("Описание урока");
    });

    if (descriptionTitle) {
      descriptionTitle.textContent = "Описание";
      const descriptionCard = descriptionTitle.closest(".p-space-lg.rounded-xl");
      const body = descriptionCard?.querySelector(".font-body-lg");

      if (body) {
        body.innerHTML = '<p>' + MG.esc(material.description || "Без описания") + '</p>';
        descriptionCard?.querySelectorAll(".mt-2").forEach((node) => {
          if (node.textContent.includes("Таймкоды и содержание")) node.remove();
        });
        descriptionCard?.querySelectorAll("span,p").forEach((node) => {
          if (node.textContent.trim().startsWith("Обновлено:")) node.textContent = "Добавлено: " + fullDate(material.createdAt);
        });
      }

    }
  }

  function hydrateMobile(scope, material) {
    const title = scope.querySelector("main .font-headline-lg-mobile");
    if (!title) return;

    title.textContent = material.title;

    const block = title.parentElement;
    const badgeRow = block?.querySelector(".flex.flex-wrap.items-center.gap-2");
    updateBadges(badgeRow, material);

    setMetric(block, "calendar_today", fullDate(material.createdAt));

    const author = [...scope.querySelectorAll(".font-title-md")].find((node) => {
      return node.textContent.trim() === "Алексей Смирнов";
    });

    if (author) author.textContent = material.author.name;

    const aboutText = scope.querySelector("#tech-specs-content > p");
    if (aboutText) aboutText.textContent = material.description || "Без описания";

  }

  async function loadDetail() {
    if (MG.page !== "detail.html") return;

    const id = Number(new URLSearchParams(location.search).get("id") || 0);
    if (!id) return;

    const result = await MG.api("material", { query: "?id=" + id });
    const material = result.material;

    document.querySelectorAll(".desktop-view,.mobile-view").forEach((scope) => {
      if (scope.classList.contains("desktop-view")) {
        hydrateDesktop(scope, material);
      } else {
        hydrateMobile(scope, material);
      }

      setupMedia(scope, material);
    });
  }

  loadDetail().catch((error) => {
    if (MG.page !== "detail.html") return;

    document.querySelectorAll(".desktop-view main,.mobile-view main").forEach((main) => {
      main.innerHTML =
        '<div class="w-full max-w-[760px] mx-auto px-margin-mobile md:px-margin py-space-xl">' +
          '<div class="rounded-2xl bg-surface-container-lowest shadow-sm p-space-xl text-center">' +
            '<span class="material-symbols-outlined text-[48px] text-outline">error_outline</span>' +
            '<h1 class="font-headline-sm text-headline-sm text-on-surface mt-3">' +
              (error.status === 404 ? "Материал не найден" : "Не удалось открыть материал") +
            '</h1>' +
            '<p class="font-body-md text-body-md text-on-surface-variant mt-2">' + MG.esc(error.message || "Попробуйте открыть страницу ещё раз.") + '</p>' +
            '<a class="inline-flex items-center justify-center h-10 px-space-md rounded-xl bg-primary-container text-on-primary font-label-lg text-label-lg mt-5" href="' + MG.pageFile("gallery.html") + '">Вернуться в галерею</a>' +
          '</div>' +
        '</div>';
    });

    MG.toast(error.message, true);
  });
})();
