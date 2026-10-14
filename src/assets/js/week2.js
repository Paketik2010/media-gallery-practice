const apiRoot = new URL("../../api/", document.currentScript.src);

async function api(file, options = {}) {
  const response = await fetch(new URL(file, apiRoot), options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Произошла ошибка");
  }

  return data;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

function showMessage(element, text) {
  element.textContent = text;
  element.hidden = !text;
}

function showCards(element, items) {
  if (!items.length) {
    element.innerHTML = '<div class="empty-state"><p>Материалов пока нет.</p></div>';
    return;
  }

  const symbols = { image: "▧", video: "▶", audio: "♫" };
  const names = { image: "Изображение", video: "Видео", audio: "Аудио" };

  element.innerHTML = '<div class="card-grid">' + items.map((item) => {
    const url = escapeHtml(item.sourceUrl || item.fileUrl || "");
    const picture = item.type === "image" && url
      ? '<img src="' + url + '" alt="">'
      : '<span>' + symbols[item.type] + '</span>';

    return '<article class="media-card">' +
      '<a class="card-image card-image--' + escapeHtml(item.type) +
      '" href="detail.html?id=' + item.id + '">' + picture + '</a>' +
      '<div class="card-content"><div class="card-details"><span>' +
      names[item.type] + '</span><span>' + escapeHtml(item.category) +
      '</span></div><h3><a href="detail.html?id=' + item.id + '">' +
      escapeHtml(item.title) + '</a></h3><p>Автор: ' +
      escapeHtml(item.author.name) + '</p></div></article>';
  }).join("") + '</div>';
}

const page = document.body.dataset.week2;

if (page === "register" || page === "login") {
  const form = document.querySelector("#account-form");
  const message = document.querySelector("#form-message");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    showMessage(message, "");

    const data = Object.fromEntries(new FormData(form));
    const button = form.querySelector("button[type=submit]");
    button.disabled = true;

    try {
      await api(page + ".php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      location.href = "profile.html";
    } catch (error) {
      showMessage(message, error.message);
      button.disabled = false;
    }
  });
}

if (page === "profile") {
  const info = document.querySelector("#profile-info");
  const list = document.querySelector("#my-materials");
  const logoutButton = document.querySelector("#logout-button");

  (async () => {
    try {
      const { user } = await api("me.php");

      if (!user) {
        info.innerHTML = '<p>Сначала <a class="text-link" href="login.html">войдите в аккаунт</a>.</p>';
        list.textContent = "";
        return;
      }

      document.querySelector("#profile-name").textContent = user.name;
      document.querySelector("#profile-data").textContent = user.username + " · " + user.email;
      document.querySelector("#profile-avatar").textContent = user.name.charAt(0).toUpperCase();

      const { materials } = await api("materials.php?mine=1");
      showCards(list, materials);
    } catch (error) {
      list.textContent = error.message;
    }
  })();

  logoutButton.addEventListener("click", async () => {
    try {
      await api("logout.php", { method: "POST" });
      location.href = "login.html";
    } catch (error) {
      list.textContent = error.message;
    }
  });
}

if (page === "upload") {
  const form = document.querySelector("#material-form");
  const message = document.querySelector("#form-message");
  const select = document.querySelector("#category");

  (async () => {
    try {
      const { user } = await api("me.php");

      if (!user) {
        form.hidden = true;
        showMessage(message, "Сначала войдите в аккаунт.");
        return;
      }

      const { categories } = await api("categories.php");
      select.innerHTML = '<option value="">Выберите категорию</option>';

      categories.forEach((category) => {
        const option = document.createElement("option");
        option.value = category.name;
        option.textContent = category.name;
        select.append(option);
      });
    } catch (error) {
      form.hidden = true;
      showMessage(message, error.message);
    }
  })();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    showMessage(message, "");

    const button = form.querySelector("button[type=submit]");
    button.disabled = true;

    try {
      const data = await api("add_material.php", {
        method: "POST",
        body: new FormData(form)
      });
      location.href = "detail.html?id=" + data.material.id;
    } catch (error) {
      showMessage(message, error.message);
      button.disabled = false;
    }
  });
}

if (page === "gallery") {
  const list = document.querySelector("#gallery-materials");

  api("materials.php").then((data) => {
    showCards(list, data.materials);
  }).catch((error) => {
    list.textContent = error.message;
  });
}

if (page === "detail") {
  const element = document.querySelector("#material-detail");
  const id = Number(new URLSearchParams(location.search).get("id"));

  if (!Number.isInteger(id) || id < 1) {
    element.textContent = "Материал не найден.";
  } else {
    api("material.php?id=" + id).then(({ material }) => {
      const url = escapeHtml(material.sourceUrl || material.fileUrl || "");
      let media = '<p>Файл не указан.</p>';

      if (url && material.type === "image") {
        media = '<img class="detail-media" src="' + url + '" alt="">';
      } else if (url && material.type === "video") {
        media = '<video class="detail-media" controls src="' + url + '"></video>';
      } else if (url && material.type === "audio") {
        media = '<audio class="detail-audio" controls src="' + url + '"></audio>';
      }

      element.innerHTML = '<article class="detail-panel"><h1>' +
        escapeHtml(material.title) + '</h1><p class="detail-meta">' +
        escapeHtml(material.category) + ' · ' +
        escapeHtml(material.author.name) + ' · ' +
        escapeHtml(material.createdAt) + '</p><p>' +
        escapeHtml(material.description || "Без описания") +
        '</p><div class="detail-view">' + media + '</div></article>';
    }).catch((error) => {
      element.textContent = error.message;
    });
  }
}
