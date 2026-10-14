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

    const joined = user.created_at
      ? new Date(user.created_at.replace(" ", "T")).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })
      : "";
    const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      node.nodeValue = node.nodeValue.replace("alexey.smirnov@example.com", user.email);
      if (joined) node.nodeValue = node.nodeValue.replace("14 января 2026 г.", joined);
    }
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

  async function run() {
    const user = await MG.getUser(true);

    if (!user) {
      location.href = MG.pageFile("login.html");
      return;
    }

    const result = await MG.api("materials", { query: "?mine=1" });

    document.querySelectorAll(".desktop-view,.mobile-view").forEach((scope) => {
      updateText(scope, user);
      MG.renderCards(scope, result.materials);
      updateCounters(scope, result.materials);

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
