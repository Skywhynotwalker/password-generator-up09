const STORAGE_KEY = "up09PasswordHistory";

const characterSets = {
  lowercase: {
    characters: "abcdefghijklmnopqrstuvwxyz",
    shortName: "abc"
  },
  uppercase: {
    characters: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    shortName: "ABC"
  },
  numbers: {
    characters: "0123456789",
    shortName: "123"
  },
  special: {
    characters: "!@#$%^&*()_+-=[]{};:,.<>?",
    shortName: "!@#"
  }
};

const lengthInput = document.getElementById("length");
const lengthValue = document.getElementById("length-value");
const generateButton = document.getElementById("generate");
const copyButton = document.getElementById("copy");
const clearHistoryButton = document.getElementById("clear-history");
const passwordOutput = document.getElementById("password");
const settingsMessage = document.getElementById("settings-message");
const copyMessage = document.getElementById("copy-message");
const historyMessage = document.getElementById("history-message");
const historyList = document.getElementById("history-list");
const emptyHistory = document.getElementById("empty-history");
const strengthText = document.getElementById("strength-text");
const strengthMeter = document.getElementById("strength-meter");
const strengthHint = document.getElementById("strength-hint");

let currentPassword = "";
let passwordHistory = loadHistory();

function loadHistory() {
  try {
    const savedHistory = localStorage.getItem(STORAGE_KEY);
    if (!savedHistory) return [];

    const parsedHistory = JSON.parse(savedHistory);
    return Array.isArray(parsedHistory) ? parsedHistory.slice(0, 5) : [];
  } catch (error) {
    localStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

function saveHistory() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(passwordHistory));
    return true;
  } catch (error) {
    showMessage(historyMessage, "Не удалось сохранить историю в браузере.", true);
    return false;
  }
}

function showMessage(element, text, isError = false) {
  element.textContent = text;
  element.className = isError ? "message error" : "message";
}

function getSelectedSets() {
  return Object.keys(characterSets).filter((name) => {
    return document.getElementById(name).checked;
  });
}

function getRandomIndex(maximum) {
  const randomValues = new Uint32Array(1);
  crypto.getRandomValues(randomValues);
  return randomValues[0] % maximum;
}

function getRandomCharacter(characters) {
  return characters[getRandomIndex(characters.length)];
}

function generatePassword(length, selectedSets) {
  const passwordCharacters = [];
  let availableCharacters = "";

  // Сначала добавляем по одному символу из каждого выбранного набора.
  selectedSets.forEach((setName) => {
    const setCharacters = characterSets[setName].characters;
    passwordCharacters.push(getRandomCharacter(setCharacters));
    availableCharacters += setCharacters;
  });

  while (passwordCharacters.length < length) {
    passwordCharacters.push(getRandomCharacter(availableCharacters));
  }

  // Перемешиваем символы, чтобы обязательные наборы не стояли в начале.
  for (let i = passwordCharacters.length - 1; i > 0; i--) {
    const randomPosition = getRandomIndex(i + 1);
    [passwordCharacters[i], passwordCharacters[randomPosition]] = [
      passwordCharacters[randomPosition],
      passwordCharacters[i]
    ];
  }

  return passwordCharacters.join("");
}

function getStrength(length, numberOfSets) {
  if (length < 10 || numberOfSets === 1) {
    return {
      className: "weak",
      text: "Слабый",
      hint: "Увеличьте длину минимум до 10 символов и добавьте разные наборы символов."
    };
  }

  if (length >= 14 && numberOfSets >= 3) {
    return {
      className: "strong",
      text: "Надёжный",
      hint: "Хорошее сочетание длины и разных типов символов."
    };
  }

  return {
    className: "medium",
    text: "Средний",
    hint: "Для более высокой оценки выберите длину от 14 символов и минимум три набора."
  };
}

function renderStrength(strength) {
  strengthText.textContent = strength.text;
  const strengthColors = { weak: "danger", medium: "warning", strong: "success" };
  strengthText.style.color = `var(--${strengthColors[strength.className]})`;
  strengthMeter.className = `strength-meter ${strength.className}`;
  strengthHint.textContent = strength.hint;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Дата не указана";

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function renderHistory() {
  historyList.replaceChildren();
  clearHistoryButton.disabled = passwordHistory.length === 0;
  emptyHistory.hidden = passwordHistory.length > 0;

  passwordHistory.forEach((entry) => {
    const item = document.createElement("li");
    item.className = "history-item";

    const password = document.createElement("span");
    password.className = "history-password";
    password.textContent = entry.password;

    const meta = document.createElement("span");
    meta.className = "history-meta";
    meta.textContent = `${entry.length} знаков · ${formatDate(entry.createdAt)}`;

    const settings = document.createElement("span");
    settings.className = "history-settings";
    const setNames = entry.options.map((name) => characterSets[name]?.shortName || name);
    settings.textContent = `Наборы: ${setNames.join(", ")}`;

    item.append(password, meta, settings);
    historyList.append(item);
  });
}

function addToHistory(password, length, selectedSets) {
  const entry = {
    id: `${Date.now()}-${getRandomIndex(100000)}`,
    password: password,
    length: length,
    options: selectedSets,
    createdAt: new Date().toISOString()
  };

  passwordHistory.unshift(entry);
  passwordHistory = passwordHistory.slice(0, 5);
  saveHistory();
  renderHistory();
}

generateButton.addEventListener("click", () => {
  const length = Number(lengthInput.value);
  const selectedSets = getSelectedSets();

  showMessage(settingsMessage, "");
  showMessage(copyMessage, "");
  showMessage(historyMessage, "");

  if (!Number.isInteger(length) || length < 6 || length > 30) {
    showMessage(settingsMessage, "Длина пароля должна быть целым числом от 6 до 30.", true);
    return;
  }

  if (selectedSets.length === 0) {
    showMessage(settingsMessage, "Выберите хотя бы один набор символов.", true);
    return;
  }

  try {
    currentPassword = generatePassword(length, selectedSets);
    passwordOutput.textContent = currentPassword;
    copyButton.disabled = false;
    renderStrength(getStrength(length, selectedSets.length));
    addToHistory(currentPassword, length, selectedSets);
    showMessage(settingsMessage, "Новый пароль сгенерирован.");
  } catch (error) {
    showMessage(settingsMessage, "Не удалось создать пароль. Попробуйте другой браузер.", true);
  }
});

copyButton.addEventListener("click", async () => {
  if (!currentPassword) return;

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(currentPassword);
    } else {
      const temporaryInput = document.createElement("textarea");
      temporaryInput.value = currentPassword;
      temporaryInput.setAttribute("readonly", "");
      temporaryInput.style.position = "fixed";
      temporaryInput.style.opacity = "0";
      document.body.append(temporaryInput);
      temporaryInput.select();
      const copied = document.execCommand("copy");
      temporaryInput.remove();
      if (!copied) throw new Error("Copy command failed");
    }

    showMessage(copyMessage, "Пароль скопирован в буфер обмена.");
  } catch (error) {
    showMessage(copyMessage, "Не удалось скопировать. Выделите пароль вручную.", true);
  }
});

clearHistoryButton.addEventListener("click", () => {
  passwordHistory = [];
  localStorage.removeItem(STORAGE_KEY);
  renderHistory();
  showMessage(historyMessage, "История очищена. Сгенерированный пароль остался на экране.");
});

lengthInput.addEventListener("input", () => {
  lengthValue.value = lengthInput.value;
  lengthValue.textContent = lengthInput.value;
  showMessage(settingsMessage, "");
});

Object.keys(characterSets).forEach((name) => {
  document.getElementById(name).addEventListener("change", () => {
    showMessage(settingsMessage, "");
  });
});

renderHistory();
