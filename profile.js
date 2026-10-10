/* =========================
   SUPABASE: АВТОРИЗАЦИЯ
========================= */

const authSupabase = window.supabase.createClient(
    "https://oegqbjlolcmpczyeehzs.supabase.co",
    "sb_publishable_dAYEcoUsdV9AmQfh4_XZrA_FqSBOicQ"
);


/* =========================
   ЭЛЕМЕНТЫ СТРАНИЦЫ
========================= */

const nicknameElement =
    document.getElementById("profileNickname");

const emailElement =
    document.getElementById("profileEmail");

const messageElement =
    document.getElementById("message");

const logoutButton =
    document.getElementById("logoutButton");

const historyElement =
    document.getElementById("downloadHistory");


/* =========================
   ЗАГРУЗКА ПРОФИЛЯ
========================= */

async function loadProfile() {
    try {
        const { data, error } =
            await authSupabase.auth.getUser();

        if (error) throw error;

        if (!data.user) {
            window.location.replace("auth.html");
            return;
        }

        const user = data.user;

        nicknameElement.textContent =
            user.user_metadata?.nickname || "Не указан";

        emailElement.textContent =
            user.email || "Не указан";

        await loadDownloadHistory();

    } catch (error) {
        console.error("Ошибка профиля:", error);

        messageElement.textContent =
            "Не удалось загрузить профиль.";
    }
}


/* =========================
   ИСТОРИЯ СКАЧИВАНИЙ
========================= */

async function loadDownloadHistory() {
    if (!historyElement) return;

    historyElement.textContent = "Загрузка истории...";

    const { data, error } = await authSupabase
        .from("download_history")
        .select("id, mod_name, download_url, downloaded_at")
        .order("downloaded_at", { ascending: false })
        .limit(50);

    if (error) {
        console.error("Ошибка истории:", error);

        historyElement.textContent =
            "Не удалось загрузить историю скачиваний.";

        return;
    }

    if (!data || data.length === 0) {
        historyElement.textContent =
            "История пока пуста. Скачай свой первый мод!";

        return;
    }

    historyElement.replaceChildren();

    data.forEach(item => {
        const entry = document.createElement("div");
        entry.className = "history-item";

        const name = document.createElement("strong");
        name.textContent = item.mod_name;

        const date = document.createElement("p");

        const parsedDate = new Date(item.downloaded_at);

        date.textContent = Number.isNaN(parsedDate.getTime())
            ? "Дата неизвестна"
            : parsedDate.toLocaleString("ru-RU");

        entry.append(name, date);
        historyElement.appendChild(entry);
    });
}


/* =========================
   ВЫХОД ИЗ АККАУНТА
========================= */

if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
        logoutButton.disabled = true;

        const { error } =
            await authSupabase.auth.signOut();

        if (error) {
            console.error("Ошибка выхода:", error);

            messageElement.textContent =
                "Не удалось выйти из аккаунта.";

            logoutButton.disabled = false;
            return;
        }

        window.location.replace("index.html");
    });
}


/* =========================
   ЗАПУСК
========================= */

loadProfile();


const deleteAccountButton =
    document.getElementById("deleteAccountButton");

if (deleteAccountButton) {
    deleteAccountButton.addEventListener("click", async () => {
        if (!confirm(
            "Точно удалить аккаунт? История скачиваний и избранное тоже будут удалены."
        )) {
            return;
        }

        if (!confirm(
            "Удаление необратимо. Подтверждаешь удаление аккаунта?"
        )) {
            return;
        }

        deleteAccountButton.disabled = true;

        try {
            const { data, error } =
                await authSupabase.functions.invoke("delete-account");

            if (error) throw error;

            if (!data?.success) {
                throw new Error(
                    data?.error || "Не удалось удалить аккаунт"
                );
            }

            await authSupabase.auth.signOut();

            window.location.replace("index.html");

        } catch (error) {
            console.error("Ошибка удаления аккаунта:", error);

            alert(
                "Не удалось удалить аккаунт. Проверь настройки функции Supabase."
            );

            deleteAccountButton.disabled = false;
        }
    });
}
