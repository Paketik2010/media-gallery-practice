(() => {
  if (!window.MG || MG.page !== "upload.html") return;

  function showError(text) {
    MG.toast(text, true);
  }

  function formatBytes(bytes) {
    const value = Number(bytes || 0);
    if (value < 1024) return value + " Б";
    if (value < 1024 * 1024) return (value / 1024).toFixed(1) + " КБ";
    if (value < 1024 * 1024 * 1024) return (value / 1024 / 1024).toFixed(1) + " МБ";
    return (value / 1024 / 1024 / 1024).toFixed(2) + " ГБ";
  }

  function formatTime(seconds) {
    const value = Math.max(0, Number(seconds || 0));
    const min = Math.floor(value / 60);
    const sec = Math.floor(value % 60);
    return String(min).padStart(2, "0") + ":" + String(sec).padStart(2, "0");
  }

  function typeFromFile(file) {
    const mime = String(file?.type || "").toLowerCase();
    const name = String(file?.name || "").toLowerCase();

    if (/\.(jpg|jpeg|png|webp|gif)$/.test(name)) return "image";
    if (/\.(mp3|wav|m4a|aac|flac|oga|ogg)$/.test(name)) return "audio";
    if (/\.(mp4|webm|ogv|mov)$/.test(name)) return "video";

    if (mime.startsWith("image/")) return "image";
    if (mime.startsWith("audio/") || mime === "application/ogg") return "audio";
    if (mime.startsWith("video/")) return "video";

    return "";
  }

  function currentType(scope) {
    if (scope._selectedUploadFile) {
      return typeFromFile(scope._selectedUploadFile) || scope.dataset.uploadType || "video";
    }

    const radio = scope.querySelector('input[name="media_type"]:checked');
    return radio?.value || scope.dataset.uploadType || "video";
  }

  function updateTypeCopy(scope, type) {
    const config = {
      image: {
        accept: "image/*",
        short: "JPG / PNG / WEBP",
        help: "Поддерживаемые форматы: JPG, PNG, WEBP до 20 МБ",
        mobile: "JPG, PNG, WEBP до 20 МБ"
      },
      video: {
        accept: "video/*",
        short: "MP4 / WEBM",
        help: "Поддерживаемые форматы: MP4, WEBM до 500 МБ",
        mobile: "MP4, WEBM до 500 МБ"
      },
      audio: {
        accept: "audio/*",
        short: "MP3 / WAV / OGG",
        help: "Поддерживаемые форматы: MP3, WAV, OGG до 100 МБ",
        mobile: "MP3, WAV, OGG до 100 МБ"
      }
    }[type];

    if (!config) return;
    if (scope._fileInput) scope._fileInput.accept = config.accept;

    const uploadTitle = [...scope.querySelectorAll("span")].find((node) => {
      return node.textContent.trim() === "Загрузка файла";
    });
    const header = uploadTitle?.parentElement;
    const short = header?.querySelector("span:last-child");
    if (short && short !== uploadTitle) short.textContent = config.short;

    [...scope.querySelectorAll("div,p")].forEach((node) => {
      const text = node.textContent.trim();

      if (/^Поддерживаемые форматы:/i.test(text) && !node.querySelector("div,p")) {
        node.textContent = config.help;
      }

      if (/^MP4, WEBM, QuickTime/i.test(text) || /^JPG, PNG, WEBP до/i.test(text) || /^MP3, WAV, OGG до/i.test(text)) {
        node.textContent = config.mobile;
      }
    });
  }

  function drawTypeButtons(scope, type) {
    scope.querySelectorAll("[data-upload-type-button]").forEach((item) => {
      const itemType = item.dataset.uploadTypeButton;
      const active = itemType === type;

      item.style.outline = active ? "2px solid #4f46e5" : "";
      item.style.outlineOffset = active ? "1px" : "";

      if (scope.classList.contains("mobile-view")) {
        item.classList.toggle("bg-primary-fixed", active);
        item.classList.toggle("bg-surface-container-lowest", !active);
        item.classList.toggle("shadow-md", active);
        item.classList.toggle("shadow-sm", !active);

        let check = item.querySelector("[data-upload-check]");
        if (active && !check) {
          check = document.createElement("div");
          check.dataset.uploadCheck = "1";
          check.className = "absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary text-on-primary flex items-center justify-center shadow";
          check.innerHTML = '<span class="material-symbols-outlined text-[14px]">check</span>';
          item.prepend(check);
        } else if (!active && check) {
          check.remove();
        }

        const iconWrap = item.querySelector(".w-9.h-9.rounded-full");
        if (iconWrap) {
          iconWrap.classList.toggle("bg-primary", active);
          iconWrap.classList.toggle("text-on-primary", active);
          iconWrap.classList.toggle("shadow-sm", active);
          iconWrap.classList.toggle("bg-surface-container", !active);
          iconWrap.classList.remove("text-secondary", "text-tertiary", "text-primary");

          if (!active) {
            iconWrap.classList.add(itemType === "audio" ? "text-tertiary" : itemType === "image" ? "text-secondary" : "text-primary");
          }
        }

        const title = [...item.querySelectorAll("span")].find((node) => {
          return ["Фото", "Видео", "Аудио"].includes(node.textContent.trim());
        });
        if (title) {
          title.classList.toggle("text-on-primary-fixed", active);
          title.classList.toggle("font-semibold", active);
          title.classList.toggle("text-on-surface", !active);
        }

        const subtitle = [...item.querySelectorAll("span")].find((node) => /до\s+\d+\s*МБ/i.test(node.textContent));
        if (subtitle) {
          subtitle.classList.toggle("text-on-primary-fixed-variant", active);
          subtitle.classList.toggle("text-on-surface-variant/80", !active);
        }

        return;
      }

      const iconWrap = item.querySelector(":scope > div > div:first-child");
      const checkBadge = item.querySelector(":scope > div > div:last-child");
      const overlay = item.querySelector(".pointer-events-none");

      if (iconWrap) {
        iconWrap.className = active
          ? "w-10 h-10 rounded-lg bg-primary-container text-on-primary flex items-center justify-center transition-colors"
          : "w-10 h-10 rounded-lg bg-surface-container-lowest flex items-center justify-center text-on-surface-variant transition-colors";
      }

      if (checkBadge) {
        checkBadge.className = active
          ? "w-5 h-5 rounded-full bg-primary-container text-on-primary flex items-center justify-center opacity-100 transition-opacity"
          : "w-5 h-5 rounded-full bg-surface-container-high flex items-center justify-center opacity-0 transition-opacity";
      }

      if (overlay) {
        overlay.className = active
          ? "absolute inset-0 rounded-xl bg-primary/10 opacity-100 pointer-events-none transition-opacity"
          : "absolute inset-0 rounded-xl bg-primary/5 opacity-0 pointer-events-none transition-opacity";
      }
    });
  }

  function selectType(scope, type) {
    if (!["image", "video", "audio"].includes(type)) return;

    scope.dataset.uploadType = type;

    scope.querySelectorAll('input[name="media_type"]').forEach((radio) => {
      radio.checked = radio.value === type;
    });

    drawTypeButtons(scope, type);
    updateTypeCopy(scope, type);
  }

  function setupTypeButtons(scope) {
    scope.querySelectorAll('input[name="media_type"]').forEach((radio) => {
      radio.addEventListener("change", () => {
        if (!radio.checked) return;

        if (scope._selectedUploadFile) {
          const detected = typeFromFile(scope._selectedUploadFile);

          if (detected && detected !== radio.value) {
            selectType(scope, detected);
            MG.toast("Тип определяется по загруженному файлу");
            return;
          }
        }

        selectType(scope, radio.value);
      });
    });

    scope.querySelectorAll("[data-upload-type-button]").forEach((card) => {
      card.addEventListener("click", () => {
        const type = card.dataset.uploadTypeButton;

        if (scope._selectedUploadFile) {
          const detected = typeFromFile(scope._selectedUploadFile);

          if (detected && detected !== type) {
            selectType(scope, detected);
            MG.toast("Сначала удалите выбранный файл, чтобы сменить тип");
            return;
          }
        }

        selectType(scope, type);
      });
    });

    const initial = scope.querySelector('input[name="media_type"]:checked')?.value || scope.dataset.uploadType || "video";
    selectType(scope, initial);
  }

  function captureFrame(video, time, index) {
    return new Promise((resolve) => {
      const done = () => {
        if (!video.videoWidth || !video.videoHeight) {
          resolve(null);
          return;
        }

        const maxWidth = 1280;
        const scale = Math.min(1, maxWidth / video.videoWidth);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
        canvas.height = Math.max(1, Math.round(video.videoHeight * scale));

        const context = canvas.getContext("2d");
        if (!context) {
          resolve(null);
          return;
        }

        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (!blob) {
            resolve(null);
            return;
          }

          resolve({
            file: new File([blob], "video-preview-" + (index + 1) + ".jpg", { type: "image/jpeg" }),
            blob,
            time
          });
        }, "image/jpeg", 0.82);
      };

      if (Math.abs(video.currentTime - time) < 0.05) {
        done();
        return;
      }

      video.addEventListener("seeked", done, { once: true });

      try {
        video.currentTime = time;
      } catch (_) {
        resolve(null);
      }
    });
  }

  function makeVideoFrames(file) {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const video = document.createElement("video");
      let finished = false;

      function finish(result) {
        if (finished) return;
        finished = true;
        URL.revokeObjectURL(url);
        video.remove();
        resolve(result || []);
      }

      video.muted = true;
      video.preload = "metadata";
      video.playsInline = true;

      video.addEventListener("loadedmetadata", async () => {
        const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0;

        if (!duration) {
          finish([]);
          return;
        }

        const times = [
          Math.max(0, Math.min(duration - 0.05, duration * 0.15)),
          Math.max(0, Math.min(duration - 0.05, duration * 0.50)),
          Math.max(0, Math.min(duration - 0.05, duration * 0.82))
        ];

        const frames = [];

        for (let i = 0; i < times.length; i += 1) {
          const frame = await captureFrame(video, times[i], i);
          if (frame) frames.push(frame);
        }

        finish(frames);
      }, { once: true });

      video.addEventListener("error", () => finish([]), { once: true });
      video.src = url;
    });
  }

  function findAttachedCard(scope) {
    let card = scope.querySelector("[data-upload-selected-card]");
    let name = card
      ? [...card.querySelectorAll("p,h4")].find((node) => /tutorial_responsive_web\.mp4/i.test(node.textContent))
      : null;

    if (!card) {
      name = [...scope.querySelectorAll("p,h4")].find((node) => {
        return node.textContent.trim() === "tutorial_responsive_web.mp4";
      });

      if (!name) return null;

      card = name.parentElement;

      while (card && card !== scope) {
        const hasProgress = card.querySelector('[class~="h-1.5"]') || card.textContent.includes("Готово к публикации");
        const hasDelete = card.querySelector('button[title="Удалить файл"],button[aria-label="Удалить файл"]');

        if (hasProgress && hasDelete) break;
        card = card.parentElement;
      }
    }

    if (!card || card === scope) return null;

    if (!name) {
      name = [...card.querySelectorAll("p,h4")].find((node) => {
        return /tutorial_responsive_web\.mp4/i.test(node.textContent);
      }) || card.querySelector("p,h4");
    }

    return {
      root: card,
      name,
      image: card.querySelector("img"),
      imageWrap: card.querySelector("img")?.parentElement || null,
      deleteButton: card.querySelector('button[title="Удалить файл"],button[aria-label="Удалить файл"]'),
      details: [...card.querySelectorAll("p")].find((node) => /МБ|КБ|ГБ/.test(node.textContent)) || null,
      progress: card.querySelector('[class~="h-1.5"] > div'),
      status: [...card.querySelectorAll("span")].find((node) => /Готово к публикации/.test(node.textContent)) || null,
      percent: [...card.querySelectorAll("span")].find((node) => node.textContent.trim() === "100%") || null,
      progressBytes: [...card.querySelectorAll("span")].find((node) => /\d.+\/\s*\d.+(МБ|КБ|ГБ)/i.test(node.textContent.trim())) || null,
      checkedFormat: [...card.querySelectorAll("span")].find((node) => /H\.264|проверен/i.test(node.textContent.trim())) || null
    };
  }

  function findPreviewFrames(scope) {
    const marked = scope.querySelector("[data-upload-preview-settings]");

    if (marked) {
      return {
        host: marked,
        images: [...marked.querySelectorAll("img")].slice(0, 3)
      };
    }

    const title = [...scope.querySelectorAll("span,label")].find((node) => {
      return node.textContent.trim() === "Настройки превью" ||
        node.textContent.trim() === "Кадр обложки";
    });

    if (!title) return null;

    const host = title.closest(".bg-surface-container-lowest") || title.parentElement?.parentElement;
    if (!host) return null;

    const images = [...host.querySelectorAll("img")].slice(0, 3);
    return { host, images };
  }

  function cleanupObjectUrls(scope) {
    (scope._previewObjectUrls || []).forEach((url) => URL.revokeObjectURL(url));
    scope._previewObjectUrls = [];
  }

  function updateSelectedPreview(scope, file, frames) {
    cleanupObjectUrls(scope);

    const ui = scope._attachedUi || findAttachedCard(scope);
    scope._attachedUi = ui;

    if (!ui) return;

    const type = typeFromFile(file);
    ui.name.textContent = file.name;

    if (ui.details) {
      ui.details.textContent = formatBytes(file.size) + " • " +
        (type === "image" ? "Изображение" : type === "audio" ? "Аудио" : "Видео");
    }

    if (ui.status) ui.status.textContent = "Готово к публикации";
    if (ui.percent) ui.percent.textContent = "100%";
    if (ui.progress) ui.progress.style.width = "100%";
    if (ui.progressBytes) {
      const size = formatBytes(file.size);
      ui.progressBytes.textContent = size + " / " + size;
    }
    if (ui.checkedFormat) {
      ui.checkedFormat.textContent = type === "video"
        ? "Видео проверено"
        : type === "audio"
          ? "Аудиофайл проверен"
          : "Изображение проверено";
    }

    const validation = scope.querySelector("[data-upload-validation]");
    if (validation) {
      validation.style.display = "";
      const title = validation.querySelector(".font-label-md");
      const text = validation.querySelector(".font-body-sm");

      if (title) title.textContent = "Проверка формата завершена успешно";
      if (text) {
        text.textContent = type === "video"
          ? "Видео поддерживается браузером и готово к публикации."
          : type === "audio"
            ? "Аудиофайл поддерживается и готов к публикации."
            : "Изображение поддерживается и готово к публикации.";
      }
    }

    if (ui.image) {
      if (type === "video" && frames[0]) {
        const url = URL.createObjectURL(frames[0].blob);
        scope._previewObjectUrls.push(url);
        ui.image.src = url;
        ui.image.style.display = "";
      } else if (type === "image") {
        const url = URL.createObjectURL(file);
        scope._previewObjectUrls.push(url);
        ui.image.src = url;
        ui.image.style.display = "";
      } else {
        ui.image.style.display = "none";
      }
    }

    const frameUi = scope._frameUi || findPreviewFrames(scope);
    scope._frameUi = frameUi;

    if (!frameUi) return;

    if (type !== "video") {
      frameUi.host.style.display = "none";
      return;
    }

    frameUi.host.style.display = "";

    frameUi.images.forEach((img, index) => {
      const frame = frames[index];
      if (!frame) return;

      const url = URL.createObjectURL(frame.blob);
      scope._previewObjectUrls.push(url);
      img.src = url;

      const box = img.parentElement;
      const time = box?.querySelector("span[class*='absolute']");
      if (time) time.textContent = formatTime(frame.time);

      box?.addEventListener("click", () => {
        scope._videoThumbnail = frame.file;

        frameUi.images.forEach((other) => {
          other.parentElement?.style.removeProperty("outline");
        });

        if (box) {
          box.style.outline = "2px solid #4f46e5";
          box.style.outlineOffset = "-2px";
        }
      });
    });

    if (frames[0]) scope._videoThumbnail = frames[0].file;
  }

  function resetSelectedFile(scope, label, input) {
    scope._selectedUploadFile = null;
    scope._videoFrames = [];
    scope._videoThumbnail = null;
    scope._thumbnailPromise = null;
    if (input) input.value = "";
    cleanupObjectUrls(scope);

    if (label) {
      label.textContent = scope.classList.contains("mobile-view")
        ? "Нажмите для выбора файла"
        : "Перетащите файл сюда";
    }

    const ui = scope._attachedUi;
    if (ui) ui.root.style.display = "none";

    const frameUi = scope._frameUi;
    if (frameUi) frameUi.host.style.display = "none";

    const validation = scope.querySelector("[data-upload-validation]");
    if (validation) validation.style.display = "none";
  }

  function setupFilePicker(scope) {
    const label = [...scope.querySelectorAll("p,h4")].find((node) => {
      return /Перетащите файл сюда|Нажмите для выбора файла/i.test(node.textContent);
    });

    const dropzone = label?.closest(".cursor-pointer") || label?.parentElement;
    if (!dropzone) return;

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,video/*,audio/*";
    input.hidden = true;
    input.dataset.uploadFile = "1";
    dropzone.appendChild(input);
    scope._fileInput = input;
    updateTypeCopy(scope, currentType(scope));

    scope._attachedUi = findAttachedCard(scope);
    scope._frameUi = findPreviewFrames(scope);

    if (scope._attachedUi) scope._attachedUi.root.style.display = "none";
    if (scope._frameUi) scope._frameUi.host.style.display = "none";

    scope._attachedUi?.deleteButton?.addEventListener("click", () => {
      resetSelectedFile(scope, label, input);
    });

    async function showFile(file) {
      scope._selectedUploadFile = file || null;
      scope._videoFrames = [];
      scope._videoThumbnail = null;
      scope._thumbnailPromise = null;

      if (!file) {
        resetSelectedFile(scope, label, input);
        return;
      }

      const detected = typeFromFile(file);

      if (!detected) {
        resetSelectedFile(scope, label, input);
        showError("Поддерживаются только изображения, видео и аудио");
        return;
      }

      selectType(scope, detected);
      if (label) label.textContent = file.name;
      if (scope._attachedUi) scope._attachedUi.root.style.display = "";

      if (detected === "video") {
        scope._thumbnailPromise = makeVideoFrames(file).then((frames) => {
          if (scope._selectedUploadFile !== file) return [];

          scope._videoFrames = frames;
          scope._videoThumbnail = frames[0]?.file || null;
          updateSelectedPreview(scope, file, frames);
          return frames;
        });

        const frames = await scope._thumbnailPromise;

        if (!frames.length) {
          updateSelectedPreview(scope, file, []);
          MG.toast("Видео выбрано, но кадры превью создать не удалось");
        }
      } else {
        updateSelectedPreview(scope, file, []);
      }
    }

    dropzone.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
      input.click();
    });

    input.addEventListener("change", () => {
      showFile(input.files?.[0]);
    });

    dropzone.addEventListener("dragover", (event) => event.preventDefault());
    dropzone.addEventListener("drop", (event) => {
      event.preventDefault();
      showFile(event.dataTransfer?.files?.[0]);
    });
  }

  function setupTags(scope) {
    const label = [...scope.querySelectorAll("label")].find((node) => {
      return /^(Теги|Теги и ключевые слова)$/.test(node.textContent.trim());
    });

    if (!label) {
      scope._tags = [];
      return;
    }

    const section = label.closest(".flex.flex-col");
    const box = section?.querySelector(".flex.flex-wrap");
    if (!box) {
      scope._tags = [];
      return;
    }

    scope._tags = [];

    [...box.children].forEach((child) => {
      if (child.tagName === "SPAN" && child.textContent.trim().startsWith("#")) {
        child.remove();
      }
    });

    let input = box.querySelector('input[placeholder*="тег" i]');

    if (!input) {
      input = document.createElement("input");
      input.type = "text";
      input.placeholder = "Добавить тег...";
      input.className = "flex-1 min-w-[110px] bg-transparent border-0 px-2 py-1 text-on-surface font-body-sm text-body-sm focus:outline-none placeholder:text-outline";
      const addButton = [...box.querySelectorAll("button")].find((button) => {
        return button.textContent.trim() === "Добавить";
      });
      box.insertBefore(input, addButton || null);
    }

    input.dataset.uploadTagInput = "1";
    scope._tagInput = input;

    const addButton = [...box.querySelectorAll("button")].find((button) => {
      return button.textContent.trim() === "Добавить";
    });

    const counter = section?.querySelector(".font-label-caps.text-label-caps");

    function render() {
      box.querySelectorAll("[data-user-tag]").forEach((item) => item.remove());

      scope._tags.forEach((tag) => {
        const chip = document.createElement("span");
        chip.dataset.userTag = "1";
        chip.className = "inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-lg bg-surface-container-high text-primary font-label-md text-label-md";
        chip.innerHTML =
          '<span>#' + MG.esc(tag) + '</span>' +
          '<button class="w-4 h-4 rounded-full flex items-center justify-center hover:bg-surface-variant text-on-surface-variant" type="button" aria-label="Удалить тег">' +
            '<span class="material-symbols-outlined text-[13px]">close</span>' +
          '</button>';

        chip.querySelector("button").addEventListener("click", () => {
          scope._tags = scope._tags.filter((item) => item !== tag);
          render();
        });

        box.insertBefore(chip, input);
      });

      if (counter && /\d+\s+из\s+8/i.test(counter.textContent)) {
        counter.textContent = scope._tags.length + " из 8";
      }
    }

    function addTag(value = input.value) {
      const values = String(value || "")
        .split(/[,;\n]+/)
        .map((part) => part.replace(/^#+/, "").trim())
        .filter(Boolean);

      values.forEach((raw) => {
        const tag = raw.slice(0, 30);

        if (!scope._tags.includes(tag) && scope._tags.length < 8) {
          scope._tags.push(tag);
        }
      });

      input.value = "";
      render();
    }

    scope._commitTags = () => addTag(input.value);

    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === "," || event.key === ";") {
        event.preventDefault();
        addTag(input.value);
      }
    });

    input.addEventListener("blur", () => addTag(input.value));
    addButton?.addEventListener("click", () => {
      addTag(input.value);
      input.focus();
    });

    render();
  }

  function setupLink(scope) {
    [...scope.querySelectorAll("button")].forEach((button) => {
      if (!/Указать ссылку/i.test(button.textContent)) return;

      button.addEventListener("click", () => {
        let input = scope.querySelector("[data-upload-link]");

        if (!input) {
          input = document.createElement("input");
          input.type = "url";
          input.placeholder = "https://example.com/media.mp4";
          input.dataset.uploadLink = "1";
          input.className =
            "w-full h-11 px-3.5 rounded-xl bg-surface-container-lowest text-on-surface " +
            "font-body-md text-body-md shadow-sm outline-none focus:shadow-md mt-2";
          button.parentElement?.insertAdjacentElement("afterend", input);
        }

        input.focus();
      });
    });
  }

  async function setupScope(scope, categories) {
    setupTypeButtons(scope);
    setupTags(scope);
    setupFilePicker(scope);
    setupLink(scope);

    if (scope.classList.contains("mobile-view")) {
      [...scope.querySelectorAll("button")].forEach((button) => {
        const text = button.textContent.replace(/\s+/g, " ").trim();

        if (/В черновики/i.test(text)) {
          button.style.display = "none";
        }

        if (text === "Отмена") {
          button.addEventListener("click", (event) => {
            event.preventDefault();
            location.href = MG.pageFile("gallery.html");
          });
        }
      });
    }

    scope.querySelectorAll("#assetCategory,#category-select").forEach((select) => {
      select.innerHTML = categories.map((category) => {
        return '<option value="' + MG.esc(category.name) + '">' +
          MG.esc(category.name) + '</option>';
      }).join("");
    });

    const form = scope.querySelector("form");
    if (!form) return;

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (scope._thumbnailPromise) {
        await scope._thumbnailPromise;
      }

      scope._commitTags?.();

      const data = new FormData();
      data.set("title", scope.querySelector("#assetTitle,#material-title")?.value || "");
      data.set("description", scope.querySelector("#assetDescription,#material-desc")?.value || "");
      data.set("category", scope.querySelector("#assetCategory,#category-select")?.value || "Другое");
      data.set("type", currentType(scope));
      data.set("tags", (scope._tags || []).join(","));

      if (scope._selectedUploadFile) {
        data.set("file", scope._selectedUploadFile);
      }

      if (scope._videoThumbnail) {
        data.set("thumbnail", scope._videoThumbnail);
      }

      const source = scope.querySelector("[data-upload-link]")?.value.trim();
      if (source) data.set("source_url", source);

      if (!scope._selectedUploadFile && !source) {
        showError("Загрузите файл или укажите ссылку");
        return;
      }

      try {
        const result = await MG.api("add_material", {
          method: "POST",
          form: data
        });

        MG.toast("Материал опубликован");

        setTimeout(() => {
          location.href = MG.pageFile("detail.html", "?id=" + result.material.id);
        }, 300);
      } catch (error) {
        showError(error.message);
      }
    });
  }

  async function run() {
    const user = await MG.getUser(true);

    if (!user) {
      location.href = MG.pageFile("login.html");
      return;
    }

    const categories = (await MG.api("categories")).categories;

    for (const scope of document.querySelectorAll(".desktop-view,.mobile-view")) {
      await setupScope(scope, categories);
    }
  }

  run().catch((error) => MG.toast(error.message, true));
})();
