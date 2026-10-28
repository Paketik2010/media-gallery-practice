(() => {
  if (!window.MG) return;

  function humanSize(bytes) {
    const value = Number(bytes || 0);

    if (!value) return "Не определён";
    if (value < 1024 * 1024) return Math.max(1, Math.round(value / 1024)) + " КБ";
    if (value < 1024 * 1024 * 1024) return (value / 1024 / 1024).toFixed(1) + " МБ";

    return (value / 1024 / 1024 / 1024).toFixed(2) + " ГБ";
  }

  function fullDate(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "Недавно";

    return new Intl.DateTimeFormat("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(date);
  }

  function formatTime(seconds) {
    const value = Math.max(0, Number(seconds || 0));
    const minutes = Math.floor(value / 60);
    const rest = Math.floor(value % 60);
    return String(minutes).padStart(2, "0") + ":" + String(rest).padStart(2, "0");
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

  async function probeResourceMetadata(material) {
    const source = MG.mediaUrl(material.fileUrl || material.sourceUrl || "");
    if (!source) return {};

    try {
      const response = await fetch(source, {
        method: "HEAD",
        cache: "force-cache"
      });

      if (!response.ok) return {};

      const sizeBytes = Number(response.headers.get("content-length") || 0);
      const mimeType = String(response.headers.get("content-type") || "").split(";")[0].trim();

      return {
        sizeBytes: Number.isFinite(sizeBytes) && sizeBytes > 0 ? sizeBytes : 0,
        mimeType
      };
    } catch (_) {
      return {};
    }
  }

  function humanDuration(seconds) {
    const value = Number(seconds || 0);
    if (!Number.isFinite(value) || value <= 0) return "—";

    const total = Math.round(value);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    const parts = [];

    if (hours) parts.push(hours + " ч");
    if (minutes || hours) parts.push(minutes + " мин");
    parts.push(secs + " сек");

    return parts.join(" ");
  }

  function resolutionText(width, height) {
    const w = Number(width || 0);
    const h = Number(height || 0);

    if (!w || !h) return "—";

    const gcd = (a, b) => b ? gcd(b, a % b) : a;
    const divisor = gcd(w, h) || 1;

    return w + " × " + h + " (" + Math.round(w / divisor) + ":" + Math.round(h / divisor) + ")";
  }

  function waitForMediaMetadata(scope, material) {
    const isMobile = scope.classList.contains("mobile-view");
    const container = isMobile
      ? scope.querySelector("main .aspect-video")
      : scope.querySelector("#video-container");

    if (!container) return Promise.resolve({});

    const element = material.type === "video"
      ? container.querySelector("video")
      : material.type === "audio"
        ? container.querySelector("audio")
        : container.querySelector("img");

    if (!element) return Promise.resolve({});

    if (material.type === "image") {
      if (element.complete && element.naturalWidth) {
        return Promise.resolve({
          width: element.naturalWidth,
          height: element.naturalHeight
        });
      }

      return new Promise((resolve) => {
        const finish = () => resolve({
          width: element.naturalWidth || 0,
          height: element.naturalHeight || 0
        });

        element.addEventListener("load", finish, { once: true });
        element.addEventListener("error", () => resolve({}), { once: true });
        setTimeout(() => resolve({}), 5000);
      });
    }

    const read = () => ({
      width: material.type === "video" ? element.videoWidth || 0 : 0,
      height: material.type === "video" ? element.videoHeight || 0 : 0,
      duration: Number.isFinite(element.duration) ? element.duration : 0
    });

    if (element.readyState >= 1) {
      return Promise.resolve(read());
    }

    return new Promise((resolve) => {
      element.addEventListener("loadedmetadata", () => resolve(read()), { once: true });
      element.addEventListener("error", () => resolve({}), { once: true });

      try {
        element.load();
      } catch (_) {}

      setTimeout(() => resolve(read()), 8000);
    });
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

  function renderTags(scope, material) {
    const label = [...scope.querySelectorAll("span")].find((node) => {
      return node.textContent.trim() === "Теги:";
    });

    if (!label) return;

    const row = label.parentElement;
    if (!row) return;

    row.querySelectorAll("a,[data-material-tag]").forEach((node) => node.remove());

    const tags = Array.isArray(material.tags)
      ? material.tags.map((tag) => String(tag || "").replace(/^#+/, "").trim()).filter(Boolean)
      : [];

    if (!tags.length) {
      row.style.display = "none";
      return;
    }

    row.style.display = "";

    tags.forEach((tag) => {
      const chip = document.createElement("span");
      chip.dataset.materialTag = "1";
      chip.className = "px-2.5 py-1 rounded-lg bg-surface-container text-on-surface-variant font-body-sm text-body-sm";
      chip.textContent = "#" + tag;
      row.appendChild(chip);
    });
  }

  function downloadMaterial(material) {
    const source = MG.mediaUrl(material.fileUrl || material.sourceUrl || "");
    if (!source) {
      MG.toast("Файл недоступен", true);
      return;
    }

    const link = document.createElement("a");
    link.href = source;
    link.download = material.originalName || "";
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function bindLike(scope, material) {
    const desktopButton = [...scope.querySelectorAll("button")].find((button) => {
      return button.title === "Закладки";
    });
    const mobileButton = scope.querySelector("#btn-favorite");
    const button = desktopButton || mobileButton;

    if (!button) return;

    button.removeAttribute("onclick");

    const icon = button.querySelector(".material-symbols-outlined");

    function draw(liked, likes) {
      material.liked = liked;
      material.likes = likes;

      if (mobileButton && icon) {
        icon.textContent = "favorite";
        icon.style.fontVariationSettings = liked ? "'FILL' 1" : "'FILL' 0";
        icon.classList.toggle("text-error", liked);
      } else if (icon) {
        icon.textContent = liked ? "bookmark" : "bookmark_border";
        icon.style.fontVariationSettings = liked ? "'FILL' 1" : "'FILL' 0";
      }

      const title = scope.querySelector("main h1") ||
        scope.querySelector("main .font-headline-lg-mobile");
      const infoRoot = title?.closest(".p-space-lg.rounded-xl") || title?.parentElement;
      setMetric(infoRoot, scope.classList.contains("mobile-view") ? "favorite" : "thumb_up", likes + " лайков");

      const mobileLikes = scope.querySelector("#likes-count");
      if (mobileLikes) mobileLikes.textContent = likes + " лайков";
    }

    draw(Boolean(material.liked), Number(material.likes || 0));

    button.addEventListener("click", async (event) => {
      event.preventDefault();

      try {
        const result = await MG.api("like", {
          method: "POST",
          json: { id: material.id }
        });
        draw(result.liked, result.likes);
      } catch (error) {
        if (error.status === 401) {
          location.href = MG.pageFile("login.html");
          return;
        }
        MG.toast(error.message, true);
      }
    });
  }

  function bindDelete(scope, material, user) {
    const canDelete = user &&
      (user.role === "admin" || Number(user.id) === Number(material.author.id));

    if (scope.classList.contains("desktop-view")) {
      const deleteButton = scope.querySelector("#delete-asset-btn");
      const editButton = scope.querySelector('a[data-path="edit-asset"]');

      if (editButton) editButton.style.display = "none";
      if (deleteButton) deleteButton.style.display = canDelete ? "" : "none";

      const confirmButton = scope.querySelector("#confirm-delete-btn");

      if (confirmButton && canDelete) {
        confirmButton.addEventListener("click", async () => {
          try {
            await MG.api("delete_material", {
              method: "POST",
              json: { id: material.id }
            });
            location.href = MG.pageFile("gallery.html");
          } catch (error) {
            MG.toast(error.message, true);
          }
        });
      }

      return;
    }

    const buttons = [...scope.querySelectorAll("button")].filter((button) => {
      return button.textContent.trim() === "Удалить";
    });

    buttons.forEach((button) => {
      button.style.display = canDelete ? "" : "none";

      if (!canDelete) return;

      button.addEventListener("click", async () => {
        if (!confirm("Удалить этот материал?")) return;

        try {
          await MG.api("delete_material", {
            method: "POST",
            json: { id: material.id }
          });
          location.href = MG.pageFile("gallery.html");
        } catch (error) {
          MG.toast(error.message, true);
        }
      });
    });

    [...scope.querySelectorAll("button")].forEach((button) => {
      const text = button.textContent.trim();
      if (text === "Редактировать" || text === "Подписаться") {
        button.style.display = "none";
      }
    });
  }

  function setupRealVideo(scope, container, material) {
    const source = MG.mediaUrl(material.fileUrl || material.sourceUrl || "");
    const poster = MG.mediaUrl(material.thumbnailUrl || "");

    if (!source) return;

    const cover = container.querySelector("[data-media-preview]");

    if (cover) {
      cover.style.backgroundImage = poster ? "url('" + poster.replace(/'/g, "%27") + "')" : "none";
      cover.style.backgroundColor = "#111827";
      cover.style.transition = "opacity .18s ease";
      cover.style.pointerEvents = "none";
    }

    const video = document.createElement("video");
    video.src = source;
    video.preload = "metadata";
    video.playsInline = true;
    video.className = "absolute inset-0 w-full h-full object-contain bg-black";
    video.style.zIndex = "0";
    container.prepend(video);

    const centerButton = container.querySelector("#center-play-btn");
    if (centerButton) centerButton.style.zIndex = "20";
    const barButton = container.querySelector("#bar-play-btn") ||
      [...container.querySelectorAll("button")].find((button) => {
        return button.querySelector("#bottom-play-icon");
      });
    const centerIcon = container.querySelector("#center-play-icon");
    const barIcon = container.querySelector("#bar-play-icon") ||
      container.querySelector("#bottom-play-icon");
    const current = container.querySelector("#time-current");
    const total = container.querySelector("#time-total");
    const mobileTime = [...container.querySelectorAll("span")].find((node) => {
      return /^\d{2}:\d{2}\s*\/\s*\d{2}:\d{2}$/.test(node.textContent.trim());
    });
    const scrubber = container.querySelector("#scrubber-container") ||
      container.querySelector("#playback-fill")?.parentElement ||
      [...container.querySelectorAll("div")].find((node) => {
        return String(node.getAttribute("onclick") || "").includes("handleScrub");
      });
    const fill = container.querySelector("#scrubber-fill") ||
      container.querySelector("#playback-fill");
    const thumb = container.querySelector("#scrubber-thumb") ||
      container.querySelector("#scrub-thumb");
    const fullscreen = container.querySelector("#fullscreen-btn") ||
      container.querySelector('button[title="На весь экран"]');

    function togglePlayback() {
      if (video.paused) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    }

    [centerButton, barButton].forEach((button) => {
      if (!button) return;
      button.removeAttribute("onclick");
      button.addEventListener("click", togglePlayback);
    });

    container.addEventListener("click", (event) => {
      if (event.target.closest("button") || (scrubber && scrubber.contains(event.target))) return;
      togglePlayback();
    });

    if (scrubber) {
      scrubber.removeAttribute("onclick");
      scrubber.style.touchAction = "none";
      let dragging = false;

      function seek(clientX) {
        if (!Number.isFinite(video.duration) || video.duration <= 0) return;
        const rect = scrubber.getBoundingClientRect();
        if (!rect.width) return;
        const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        video.currentTime = video.duration * ratio;
        updateTime();
      }

      scrubber.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        event.stopPropagation();
        dragging = true;
        scrubber.setPointerCapture?.(event.pointerId);
        seek(event.clientX);
      });
      scrubber.addEventListener("pointermove", (event) => {
        if (dragging) seek(event.clientX);
      });
      scrubber.addEventListener("pointerup", (event) => {
        if (dragging) seek(event.clientX);
        dragging = false;
      });
      scrubber.addEventListener("pointercancel", () => { dragging = false; });
      scrubber.addEventListener("click", (event) => {
        event.stopPropagation();
        seek(event.clientX);
      });
    }

    fullscreen?.addEventListener("click", () => {
      container.requestFullscreen?.();
    });

    function updateIcons() {
      const name = video.paused ? "play_arrow" : "pause";
      if (centerIcon) centerIcon.textContent = name;
      if (barIcon) barIcon.textContent = name;
    }

    function updateTime() {
      if (!Number.isFinite(video.duration) || !video.duration) return;

      const ratio = Math.max(0, Math.min(1, video.currentTime / video.duration));
      const percent = (ratio * 100).toFixed(2) + "%";

      if (fill) fill.style.width = percent;
      if (thumb) thumb.style.left = percent;
      if (current) current.textContent = formatTime(video.currentTime);
      if (total) total.textContent = formatTime(video.duration);
      if (mobileTime) {
        mobileTime.textContent = formatTime(video.currentTime) + " / " + formatTime(video.duration);
      }
    }

    video.addEventListener("play", () => {
      if (cover) cover.style.opacity = "0";
      updateIcons();
    });

    video.addEventListener("pause", updateIcons);
    video.addEventListener("timeupdate", updateTime);
    video.addEventListener("durationchange", updateTime);
    video.addEventListener("loadedmetadata", () => {
      updateTime();

      const quality = video.videoHeight ? video.videoHeight + "p" : formatName(material);

      [...scope.querySelectorAll("span,button")].forEach((node) => {
        const text = node.textContent.trim();
        if (text === "1080p 60fps" || text === "1080p HD" || text === "1080p Full HD" || text === "1080p") {
          node.textContent = quality;
        }
      });

      const about = [...scope.querySelectorAll("h2")].find((node) => {
        return node.textContent.trim() === "О материале";
      })?.closest(".p-space-lg.rounded-xl");

      if (about) {
        [...about.querySelectorAll('[class~="py-2.5"]')].forEach((row) => {
          const label = row.querySelector(".text-on-surface-variant")?.textContent.trim();
          const value = row.querySelector(".font-semibold");

          if (label === "Разрешение" && value) {
            value.textContent = video.videoWidth + " × " + video.videoHeight;
          }

          if (label === "Длительность" && value) {
            value.textContent = formatTime(video.duration);
          }
        });
      }
    });
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
      setupRealVideo(scope, container, material);
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
          ? '<audio class="w-full max-w-xl" controls preload="metadata" src="' + MG.esc(source) + '"></audio>'
          : '<p class="text-inverse-on-surface">Аудиофайл недоступен</p>') +
      '</div>';
  }

  function applyTechnicalSpecs(scope, material, meta = {}) {
    const isMobile = scope.classList.contains("mobile-view");
    const info = MG.typeInfo(material.type);
    const format = formatName(material, meta);
    const resolution = resolutionText(meta.width, meta.height);
    const duration = humanDuration(meta.duration);
    const sizeBytes = Number(material.sizeBytes || meta.sizeBytes || 0);

    if (!isMobile) {
      const aboutTitle = [...scope.querySelectorAll("h2")].find((node) => {
        return node.textContent.trim() === "О материале";
      });
      const about = aboutTitle?.closest(".p-space-lg.rounded-xl");

      if (about) {
        const typeBadge = about.querySelector(":scope > div:first-child > span:last-child");
        if (typeBadge) typeBadge.textContent = info.label;

        const values = material.type === "image"
          ? {
              "Тип контента": info.label,
              "Формат / Кодек": format,
              "Разрешение": resolution,
              "Размер файла": humanSize(sizeBytes)
            }
          : material.type === "video"
            ? {
                "Тип контента": info.label,
                "Формат / Кодек": format,
                "Разрешение": resolution,
                "Длительность": duration,
                "Размер файла": humanSize(sizeBytes)
              }
            : {
                "Тип контента": info.label,
                "Формат / Кодек": format,
                "Длительность": duration,
                "Размер файла": humanSize(sizeBytes)
              };

        [...about.querySelectorAll('[class~="py-2.5"]')].forEach((row) => {
          const labelNode = row.querySelector(".text-on-surface-variant");
          const valueNode = row.querySelector(".font-semibold");
          const rowText = row.textContent || "";
          const label = [
            "Тип контента",
            "Формат / Кодек",
            "Формат",
            "Разрешение",
            "Длительность",
            "Размер файла",
            "Лицензия",
            "Частота кадров",
            "Аудиодорожка"
          ].find((item) => rowText.includes(item));

          if (!label) return;

          const key = label === "Формат" ? "Формат / Кодек" : label;

          if (label === "Формат / Кодек" && labelNode) {
            const icon = labelNode.querySelector(".material-symbols-outlined");
            labelNode.childNodes.forEach((node) => {
              if (node.nodeType === Node.TEXT_NODE) node.remove();
            });
            labelNode.append(document.createTextNode(" Формат"));
            if (icon) labelNode.prepend(icon);
          }

          const shouldShow = Object.prototype.hasOwnProperty.call(values, key);
          row.style.display = shouldShow ? "" : "none";

          if (shouldShow && valueNode) {
            valueNode.textContent = values[key];
          }
        });
      }

      const fakeStats = [...scope.querySelectorAll("h3")].find((node) => {
        return node.textContent.trim() === "Статистика просмотров";
      })?.closest(".p-space-lg.rounded-xl");
      if (fakeStats) fakeStats.style.display = "none";

      const timecodesTitle = [...scope.querySelectorAll("span")].find((node) => {
        return node.textContent.trim() === "Таймкоды и содержание";
      });
      const timecodes = timecodesTitle?.closest(".mt-2");
      if (timecodes) timecodes.style.display = "none";

      const resourceButton = [...scope.querySelectorAll("button")].find((button) => {
        return button.textContent.includes("Материалы урока");
      });
      if (resourceButton) resourceButton.style.display = "none";

      const updated = [...scope.querySelectorAll("span,p")].find((node) => {
        return /^Обновлено:/i.test(node.textContent.trim());
      });
      if (updated) updated.textContent = "Добавлено: " + fullDate(material.createdAt);

      const relatedSubtitle = [...scope.querySelectorAll("p")].find((node) => {
        return node.textContent.includes("Рекомендации на основе тематики");
      });
      if (relatedSubtitle) {
        relatedSubtitle.textContent = "Рекомендации по категории «" + material.category + "»";
      }

      const relatedLink = [...scope.querySelectorAll("a")].find((node) => {
        return /Смотреть все (видео|изображения|аудио)/i.test(node.textContent);
      });
      if (relatedLink) {
        const labels = {
          image: ["Смотреть все изображения", "images"],
          video: ["Смотреть все видео", "videos"],
          audio: ["Смотреть все аудио", "audio"]
        };
        const [label, path] = labels[material.type];
        const textSpan = relatedLink.querySelector("span:first-child");
        if (textSpan) textSpan.textContent = label;
        relatedLink.dataset.path = path;
        relatedLink.href = MG.pageFile(path + ".html");
      }

      return;
    }

    const cells = scope.querySelectorAll("#tech-specs-content .grid > div");
    const specs = material.type === "image"
      ? [
          ["Формат", format],
          ["Разрешение", resolution],
          ["Размер", humanSize(sizeBytes)],
          ["Категория", material.category]
        ]
      : material.type === "video"
        ? [
            ["Формат", format],
            ["Разрешение", resolution],
            ["Длительность", duration],
            ["Размер", humanSize(sizeBytes)]
          ]
        : [
            ["Формат", format],
            ["Длительность", duration],
            ["Размер", humanSize(sizeBytes)],
            ["Категория", material.category]
          ];

    cells.forEach((cell, index) => {
      const spec = specs[index];
      if (!spec) return;

      const spans = cell.querySelectorAll("span");
      if (spans[0]) spans[0].textContent = spec[0];
      if (spans[1]) spans[1].textContent = spec[1];
    });

    const timecodes = [...scope.querySelectorAll("h3")].find((node) => {
      return node.textContent.trim() === "Таймкоды и содержание";
    })?.closest(".flex.flex-col.gap-3");
    if (timecodes) timecodes.style.display = "none";
  }

  function hydrateDesktop(scope, material) {
    const title = scope.querySelector("main h1");
    if (!title) return;

    title.textContent = material.title;

    const breadcrumb = scope.querySelector("main nav");
    const breadcrumbLast = breadcrumb?.querySelector("span:last-child");
    if (breadcrumbLast) breadcrumbLast.textContent = material.title;

    const card = title.closest(".p-space-lg.rounded-xl");
    const badgeRow = card?.querySelector(".flex.flex-wrap.items-center.gap-2");
    updateBadges(badgeRow, material);

    setMetric(card, "calendar_today", fullDate(material.createdAt));
    setMetric(card, "visibility", Number(material.views || 0) + " просмотров");
    setMetric(card, "thumb_up", Number(material.likes || 0) + " лайков");

    const author = [...(card?.querySelectorAll('a[data-path="profile"]') || [])].find((node) => {
      return node.classList.contains("font-title-md");
    });

    if (author) author.textContent = material.author.name;

    const authorLine = card?.querySelector("p.font-body-sm");
    if (authorLine) authorLine.textContent = "@" + material.author.username;

    const descriptionTitle = [...scope.querySelectorAll("h2")].find((node) => {
      return node.textContent.includes("Описание урока");
    });

    if (descriptionTitle) {
      descriptionTitle.textContent = "Описание";
      const descriptionCard = descriptionTitle.closest(".p-space-lg.rounded-xl");
      const body = descriptionCard?.querySelector(".font-body-lg");

      if (body) {
        body.innerHTML = '<p>' + MG.esc(material.description || "Без описания") + '</p>';
      }

      const contents = [...(descriptionCard?.querySelectorAll("div") || [])].find((node) => {
        return node.textContent.includes("Таймкоды и содержание");
      });

      if (contents) {
        if (material.type !== "video") {
          contents.style.display = "none";
        } else {
          const buttons = contents.querySelectorAll("button");
          buttons.forEach((button, index) => {
            button.style.display = index === 0 ? "" : "none";
          });

          const first = buttons[0]?.querySelector(".text-body-sm");
          if (first) first.textContent = "00:00 — Начало";
        }
      }
    }

    const aboutTitle = [...scope.querySelectorAll("h2")].find((node) => {
      return node.textContent.trim() === "О материале";
    });
    const about = aboutTitle?.closest(".p-space-lg.rounded-xl");

    if (about) {
      const values = {
        "Тип контента": MG.typeInfo(material.type).label,
        "Формат / Кодек": formatName(material),
        "Разрешение": "—",
        "Длительность": "—",
        "Размер файла": humanSize(material.sizeBytes),
        "Лицензия": "Учебный проект",
        "Частота кадров": "—",
        "Аудиодорожка": material.type === "audio" ? formatName(material) : "—"
      };

      [...about.querySelectorAll('[class~="py-2.5"]')].forEach((row) => {
        const label = row.querySelector(".text-on-surface-variant")?.textContent.trim();
        const value = row.querySelector(".font-semibold");

        if (label && value && label in values) {
          value.textContent = values[label];
        }
      });
    }

    const download = [...scope.querySelectorAll("button")].find((button) => {
      return button.textContent.includes("Скачать оригинал");
    });

    if (download) {
      const label = [...download.querySelectorAll("span")].find((node) => {
        return node.textContent.includes("Скачать оригинал");
      });

      if (label) label.textContent = "Скачать оригинал" + (material.sizeBytes ? " (" + humanSize(material.sizeBytes) + ")" : "");
      download.addEventListener("click", () => downloadMaterial(material));
    }
  }

  function hydrateMobile(scope, material) {
    const title = scope.querySelector("main .font-headline-lg-mobile");
    if (!title) return;

    title.textContent = material.title;

    const block = title.parentElement;
    const badgeRow = block?.querySelector(".flex.flex-wrap.items-center.gap-2");
    updateBadges(badgeRow, material);

    setMetric(block, "visibility", Number(material.views || 0) + " просмотров");
    setMetric(block, "favorite", Number(material.likes || 0) + " лайков");
    setMetric(block, "calendar_today", fullDate(material.createdAt));

    const author = [...scope.querySelectorAll(".font-title-md")].find((node) => {
      return node.textContent.trim() === "Алексей Смирнов";
    });

    if (author) author.textContent = material.author.name;

    const aboutText = scope.querySelector("#tech-specs-content > p");
    if (aboutText) aboutText.textContent = material.description || "Без описания";

    const cells = scope.querySelectorAll("#tech-specs-content .grid > div");
    const mobileSpecs = [
      ["Формат", formatName(material)],
      ["Тип", MG.typeInfo(material.type).label],
      ["Размер", humanSize(material.sizeBytes)],
      ["Категория", material.category]
    ];

    cells.forEach((cell, index) => {
      if (!mobileSpecs[index]) return;
      const spans = cell.querySelectorAll("span");
      if (spans[0]) spans[0].textContent = mobileSpecs[index][0];
      if (spans[1]) spans[1].textContent = mobileSpecs[index][1];
    });

    const timecodes = [...scope.querySelectorAll("h3")].find((node) => {
      return node.textContent.trim() === "Таймкоды и содержание";
    })?.closest(".flex.flex-col.gap-3");

    if (timecodes) {
      if (material.type !== "video") {
        timecodes.style.display = "none";
      } else {
        const buttons = timecodes.querySelectorAll("button");
        buttons.forEach((button, index) => {
          button.style.display = index === 0 ? "" : "none";
        });

        const firstTitle = buttons[0]?.querySelector(".font-body-md");
        if (firstTitle) firstTitle.textContent = "Начало";
        const count = timecodes.querySelector(".font-body-sm.text-body-sm.text-outline");
        if (count) count.textContent = "1 раздел";
      }
    }

    const download = [...scope.querySelectorAll("button")].find((button) => {
      return button.textContent.includes("Скачать оригинал");
    });

    if (download) {
      download.removeAttribute("onclick");
      const label = [...download.querySelectorAll("span")].find((node) => {
        return node.textContent.includes("Скачать оригинал");
      });

      if (label) label.textContent = "Скачать оригинал" + (material.sizeBytes ? " (" + humanSize(material.sizeBytes) + ")" : "");
      download.addEventListener("click", () => downloadMaterial(material));
    }
  }


  function findRelated(scope) {
    const heading = [...scope.querySelectorAll("h2,h3")].find((node) =>
      node.textContent.trim() === "Похожие материалы"
    );
    const section = scope.classList.contains("mobile-view")
      ? heading?.parentElement?.parentElement
      : heading?.closest("section");
    const cards = section?.querySelector(
      scope.classList.contains("mobile-view") ? ".overflow-x-auto" : ".grid"
    );
    return section && cards ? { scope, section, cards } : null;
  }

  async function loadRelated(material, areas) {
    if (!areas.length) return;
    let result;
    try {
      result = await MG.api("materials", {
        query: "?type=" + encodeURIComponent(material.type)
      });
    } catch (_) {
      return;
    }

    const others = (result.materials || [])
      .filter((item) => item.type === material.type && Number(item.id) !== Number(material.id))
      .sort((a, b) =>
        Number(b.category === material.category) - Number(a.category === material.category)
      );

    const pageByType = { image: "images.html", video: "videos.html", audio: "audio.html" };
    const listUrl = MG.pageFile(pageByType[material.type]);
    const titleByType = { image: "изображений", video: "видео", audio: "аудио" };

    areas.forEach(({ scope, section, cards }) => {
      const mobile = scope.classList.contains("mobile-view");
      const slots = [...cards.children];
      slots.forEach((card, index) => {
        const item = others[index];
        if (!item) {
          card.remove();
          return;
        }

        const url = MG.pageFile("detail.html", "?id=" + item.id);
        const title = card.querySelector(mobile ? "h4" : "a.font-title-md");
        if (title) {
          title.textContent = item.title;
          if (title.tagName === "A") title.href = url;
        }

        const preview = card.querySelector("[data-media-preview]");
        const image = MG.mediaUrl(
          item.thumbnailUrl || (item.type === "image" ? item.fileUrl || item.sourceUrl : "") || ""
        );
        if (preview?.tagName === "IMG") {
          preview.alt = item.title;
          if (image) preview.src = image;
          else {
            preview.removeAttribute("src");
            preview.style.display = "none";
          }
        } else if (preview) {
          preview.style.backgroundImage = image ? "url(" + JSON.stringify(image) + ")" : "none";
        }

        const kind = card.querySelector(".absolute.top-2.left-2");
        if (kind) kind.textContent = MG.typeInfo(item.type).label;
        card.querySelector(".absolute.bottom-2.right-2")?.remove();

        const footer = card.querySelector(mobile
          ? ".p-3 .flex.items-center.justify-between"
          : ".border-t");
        const author = footer?.children[0];
        const views = footer?.children[1];
        if (author) author.textContent = item.author?.name || "Автор";
        if (views) {
          const count = Number(item.views || 0).toLocaleString("ru-RU");
          if (mobile) views.textContent = count + " просмотров";
          else {
            [...views.childNodes].forEach((child) => {
              if (child.nodeType === Node.TEXT_NODE) child.remove();
            });
            views.append(document.createTextNode(" " + count));
          }
        }

        card.dataset.materialId = String(item.id);
        card.style.cursor = "pointer";
        card.setAttribute("role", "link");
        card.setAttribute("tabindex", "0");
        card.setAttribute("aria-label", "Открыть материал: " + item.title);
        card.addEventListener("click", (event) => {
          if (event.target.closest("a[href]")) return;
          location.href = url;
        });
        card.addEventListener("keydown", (event) => {
          if (event.target === card && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            location.href = url;
          }
        });
      });

      if (!others.length) return;

      const subtitle = section.querySelector("p");
      if (subtitle) {
        subtitle.textContent = others.some((item) => item.category === material.category)
          ? "Похожие материалы по категории «" + material.category + "»"
          : "Другие материалы раздела";
      }

      if (mobile) {
        const all = section.querySelector("button");
        if (all) {
          all.textContent = "Все (" + Number(result.total || result.materials.length) + ")";
          all.addEventListener("click", () => { location.href = listUrl; });
        }
      } else {
        const all = section.querySelector("a[data-path]");
        if (all) {
          all.removeAttribute("data-path");
          all.href = listUrl;
          const label = all.querySelector("span:first-child");
          if (label) label.textContent = "Все " + titleByType[material.type];
        }
      }
      section.style.display = "";
    });
  }

  async function loadDetail() {
    if (MG.page !== "detail.html") return;

    const id = Number(new URLSearchParams(location.search).get("id") || 0);
    if (!id) return;

    const areas = [...document.querySelectorAll(".desktop-view,.mobile-view")]
      .map(findRelated).filter(Boolean);
    areas.forEach(({ section }) => { section.style.display = "none"; });

    const [result, user] = await Promise.all([
      MG.api("material", { query: "?id=" + id }),
      MG.getUser(true).catch(() => null)
    ]);

    const material = result.material;

    document.querySelectorAll(".desktop-view,.mobile-view").forEach((scope) => {
      if (scope.classList.contains("desktop-view")) {
        hydrateDesktop(scope, material);
      } else {
        hydrateMobile(scope, material);
      }

      renderTags(scope, material);
      setupMedia(scope, material);
      applyTechnicalSpecs(scope, material, {});
      Promise.all([
        waitForMediaMetadata(scope, material),
        probeResourceMetadata(material)
      ]).then(([mediaMeta, resourceMeta]) => {
        applyTechnicalSpecs(scope, material, {
          ...mediaMeta,
          ...resourceMeta
        });
      });
      bindLike(scope, material);
      bindDelete(scope, material, user);
    });
    loadRelated(material, areas);
  }

  function adminHtml(users, materials) {
    const userRows = users.map((user) => {
      return '<tr class="border-b border-outline-variant/20">' +
        '<td class="py-3 pr-4 font-medium">' + MG.esc(user.name) + '</td>' +
        '<td class="py-3 pr-4 text-on-surface-variant">@' + MG.esc(user.username) + '</td>' +
        '<td class="py-3 pr-4 text-on-surface-variant">' + MG.esc(user.email) + '</td>' +
        '<td class="py-3 pr-4">' + MG.esc(user.role) + '</td>' +
        '<td class="py-3 text-right">' + Number(user.materials_count || 0) + '</td>' +
      '</tr>';
    }).join("");

    const materialRows = materials.map((material) => {
      return '<tr class="border-b border-outline-variant/20">' +
        '<td class="py-3 pr-4 font-medium">' + MG.esc(material.title) + '</td>' +
        '<td class="py-3 pr-4">' + MG.esc(MG.typeInfo(material.type).label) + '</td>' +
        '<td class="py-3 pr-4">' + MG.esc(material.category) + '</td>' +
        '<td class="py-3 pr-4">' + MG.esc(material.author.name) + '</td>' +
        '<td class="py-3 text-right"><button class="w-9 h-9 rounded-lg text-error hover:bg-error-container" data-api-delete="' + material.id + '"><span class="material-symbols-outlined text-[18px]">delete</span></button></td>' +
      '</tr>';
    }).join("");

    return '<div class="max-w-[1200px] mx-auto px-margin py-space-lg flex flex-col gap-space-lg">' +
      '<div><h1 class="font-headline-lg text-headline-lg text-on-surface">Админ-панель</h1><p class="text-on-surface-variant mt-1">Управление пользователями и материалами</p></div>' +
      '<section class="rounded-2xl bg-surface-container-lowest shadow-sm p-space-lg overflow-x-auto">' +
        '<h2 class="font-headline-sm text-headline-sm mb-space-md">Пользователи (' + users.length + ')</h2>' +
        '<table class="w-full text-left min-w-[700px]"><thead><tr class="text-outline"><th class="pb-3 pr-4">Имя</th><th class="pb-3 pr-4">Логин</th><th class="pb-3 pr-4">Email</th><th class="pb-3 pr-4">Роль</th><th class="pb-3 text-right">Материалы</th></tr></thead><tbody>' + userRows + '</tbody></table>' +
      '</section>' +
      '<section class="rounded-2xl bg-surface-container-lowest shadow-sm p-space-lg overflow-x-auto">' +
        '<h2 class="font-headline-sm text-headline-sm mb-space-md">Все материалы (' + materials.length + ')</h2>' +
        '<table class="w-full text-left min-w-[700px]"><thead><tr class="text-outline"><th class="pb-3 pr-4">Название</th><th class="pb-3 pr-4">Тип</th><th class="pb-3 pr-4">Категория</th><th class="pb-3 pr-4">Автор</th><th class="pb-3 text-right">Действия</th></tr></thead><tbody>' + materialRows + '</tbody></table>' +
      '</section>' +
    '</div>';
  }

  async function loadAdmin() {
    if (MG.page !== "admin.html") return;

    const user = await MG.getUser(true);

    if (!user || user.role !== "admin") {
      location.href = MG.pageFile("login.html");
      return;
    }

    const [usersResult, materialsResult] = await Promise.all([
      MG.api("admin_users"),
      MG.api("admin_materials")
    ]);

    document.querySelectorAll(".desktop-view main,.mobile-view main").forEach((main) => {
      main.innerHTML = adminHtml(usersResult.users, materialsResult.materials);
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
  loadAdmin().catch((error) => MG.toast(error.message, true));
})();
