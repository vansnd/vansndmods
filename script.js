/* =========================
   1. SUPABASE: АВТОРИЗАЦИЯ
========================= */

const authSupabase = window.supabase.createClient(
    "https://oegqbjlolcmpczyeehzs.supabase.co",
    "sb_publishable_dAYEcoUsdV9AmQfh4_XZrA_FqSBOicQ"
);


/* =========================
   2. SUPABASE: ОБЩИЙ СЧЁТЧИК
========================= */

const SUPABASE_URL =
    "https://xzimpyqvgvtcbesgvpgu.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_EP374gh7_0cAXQOL31VUBw_zrS-7VCQ";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


/* =========================
   3. ЗАГРУЗКА СЧЁТЧИКА
========================= */

async function loadCounter() {
    const counter = document.getElementById("totalDownloads");

    if (!counter) return;

    const { data, error } = await supabaseClient
        .from("site_stats")
        .select("total_downloads")
        .eq("id", 1)
        .single();

    if (error) {
        console.error("Ошибка загрузки счётчика:", error);
        return;
    }

    counter.textContent = data.total_downloads;
}

loadCounter();


/* =========================
   4. СКАЧИВАНИЯ И ИСТОРИЯ
========================= */

document.querySelectorAll(".download-mod").forEach(link => {
    link.addEventListener("click", async event => {
        // Сохраняем обычное поведение ссылки,
        // но сначала обрабатываем запросы к базе.
        event.preventDefault();

        if (link.dataset.processing === "true") return;

        link.dataset.processing = "true";

        const downloadUrl = link.href;

        const modName =
            link.dataset.modName ||
            link.closest(".card")
                ?.querySelector("h2")
                ?.textContent.trim() ||
            "Неизвестный мод";

        try {
            // Увеличиваем общий счётчик
            const { error: counterError } =
                await supabaseClient.rpc("increment_downloads");

            if (counterError) {
                console.error(
                    "Ошибка увеличения счётчика:",
                    counterError
                );
            } else {
                await loadCounter();
            }

            // Получаем текущего пользователя
            const { data, error: userError } =
                await authSupabase.auth.getUser();

            if (userError) {
                console.error(
                    "Ошибка получения пользователя:",
                    userError
                );
            } else if (data.user) {
                // Записываем скачивание в историю
                const { error: historyError } =
                    await authSupabase
                        .from("download_history")
                        .insert({
                            mod_name: modName,
                            download_url: downloadUrl
                        });

                if (historyError) {
                    console.error(
                        "Ошибка записи истории:",
                        historyError
                    );
                }
            }
        } catch (error) {
            console.error(
                "Ошибка обработки скачивания:",
                error
            );
        } finally {
            // Продолжаем скачивание даже при ошибке базы
            window.location.href = downloadUrl;
        }
    });
});


/* =========================
   5. МЕНЮ АККАУНТА
========================= */

const accountNickname =
    document.getElementById("accountNickname");

const dropdownNickname =
    document.getElementById("dropdownNickname");

const accountButton =
    document.getElementById("accountButton");

const loginLink =
    document.getElementById("loginLink");

const logoutButton =
    document.getElementById("logoutButton");


async function updateAccountMenu() {
    const { data, error } =
        await authSupabase.auth.getUser();

    if (error) {
        console.error(
            "Ошибка получения аккаунта:",
            error
        );
        return;
    }

    const user = data.user;

    if (user) {
        const nickname =
            user.user_metadata?.nickname ||
            user.email ||
            "Мой аккаунт";

        if (accountNickname) {
            accountNickname.textContent = nickname;
        }

        if (dropdownNickname) {
            dropdownNickname.textContent = nickname;
        }

        if (accountButton) {
            accountButton.hidden = false;
        }

        if (loginLink) {
            loginLink.hidden = true;
        }
    } else {
        if (accountButton) {
            accountButton.hidden = true;
        }

        if (loginLink) {
            loginLink.hidden = false;
        }
    }
}


/* =========================
   6. ОТКРЫТИЕ МЕНЮ
========================= */

if (accountButton) {
    accountButton.addEventListener("click", () => {
        const dropdown =
            document.getElementById("accountDropdown");

        if (dropdown) {
            dropdown.classList.toggle("show");
        }
    });
}

// Закрываем меню при клике вне него
document.addEventListener("click", event => {
    const menu = document.getElementById("accountMenu");
    const dropdown = document.getElementById("accountDropdown");

    if (
        menu &&
        dropdown &&
        !menu.contains(event.target)
    ) {
        dropdown.classList.remove("show");
    }
});


/* =========================
   7. ВЫХОД ИЗ АККАУНТА
========================= */

if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
        logoutButton.disabled = true;

        const { error } =
            await authSupabase.auth.signOut();

        if (error) {
            console.error("Ошибка выхода:", error);

            alert("Не удалось выйти: " + error.message);

            logoutButton.disabled = false;
            return;
        }

        window.location.href = "index.html";
    });
}


/* =========================
   8. ЗАПУСК
========================= */

updateAccountMenu();
