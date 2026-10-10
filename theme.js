(() => {
    const STORAGE_KEY = "vansnd-theme";
    const button = document.getElementById("themeToggle");

    // Определяем тему устройства
    const systemTheme = window.matchMedia(
        "(prefers-color-scheme: light)"
    );

    function getSavedTheme() {
        try {
            return localStorage.getItem(STORAGE_KEY);
        } catch (error) {
            console.warn("Не удалось прочитать тему:", error);
            return null;
        }
    }

    function saveTheme(theme) {
        try {
            localStorage.setItem(STORAGE_KEY, theme);
        } catch (error) {
            console.warn("Не удалось сохранить тему:", error);
        }
    }

    function applyTheme(theme) {
        const isLight = theme === "light";

        document.body.classList.toggle("light-theme", isLight);

        if (button) {
            // Только значок, без надписи
            button.textContent = isLight ? "🌙" : "☀️";

            button.setAttribute(
                "aria-label",
                isLight
                    ? "Переключить на тёмную тему"
                    : "Переключить на светлую тему"
            );

            button.title = isLight
                ? "Переключить на тёмную тему"
                : "Переключить на светлую тему";
        }
    }

    // Сохранённая тема важнее системной
    const savedTheme = getSavedTheme();

    const initialTheme =
        savedTheme === "light" || savedTheme === "dark"
            ? savedTheme
            : systemTheme.matches
                ? "light"
                : "dark";

    applyTheme(initialTheme);

    // Переключение по нажатию на значок
    if (button) {
        button.addEventListener("click", () => {
            const newTheme =
                document.body.classList.contains("light-theme")
                    ? "dark"
                    : "light";

            applyTheme(newTheme);
            saveTheme(newTheme);
        });
    }
})();