const favoritesSupabase = window.supabase.createClient(
    "https://oegqbjlolcmpczyeehzs.supabase.co",
    "sb_publishable_dAYEcoUsdV9AmQfh4_XZrA_FqSBOicQ"
);

async function initFavorites() {
    const { data: { user }, error } =
        await favoritesSupabase.auth.getUser();

    if (error) {
        console.error("Ошибка авторизации:", error);
        return;
    }

    const buttons = document.querySelectorAll(".favorite-toggle");

    if (!user && buttons.length) {
        buttons.forEach(button => {
            button.title = "Войди в аккаунт, чтобы сохранять избранное";
        });
    }

    const { data: favorites, error: favoritesError } =
        await favoritesSupabase
            .from("favorites")
            .select("mod_url");

    if (favoritesError && user) {
        console.error("Ошибка загрузки избранного:", favoritesError);
        return;
    }

    const favoriteUrls = new Set(
        (favorites || []).map(item => item.mod_url)
    );

    function updateButton(button) {
        const isFavorite = favoriteUrls.has(button.dataset.modUrl);

        button.textContent = isFavorite ? "★" : "☆";
        button.classList.toggle("is-favorite", isFavorite);
        button.setAttribute(
            "aria-label",
            isFavorite ? "Убрать из избранного" : "Добавить в избранное"
        );
    }

    buttons.forEach(button => {
        updateButton(button);

        button.addEventListener("click", async () => {
            if (!user) {
                window.location.href = "auth.html";
                return;
            }

            if (button.dataset.busy === "true") return;
            button.dataset.busy = "true";
            button.disabled = true;

            const name = button.dataset.modName;
            const url = button.dataset.modUrl;
            const alreadyFavorite = favoriteUrls.has(url);

            try {
                if (alreadyFavorite) {
                    const { error } = await favoritesSupabase
                        .from("favorites")
                        .delete()
                        .eq("mod_url", url);

                    if (error) throw error;

                    favoriteUrls.delete(url);
                } else {
                    const { error } = await favoritesSupabase
                        .from("favorites")
                        .insert({
                            mod_name: name,
                            mod_url: url
                        });

                    if (error) throw error;

                    favoriteUrls.add(url);
                }

                updateButton(button);

                // Если это страница избранного — обновляем список
                if (typeof loadFavoritesPage === "function") {
                    await loadFavoritesPage();
                }
            } catch (error) {
                console.error("Ошибка избранного:", error);
                alert("Не удалось изменить избранное. Попробуй ещё раз.");
            } finally {
                button.disabled = false;
                delete button.dataset.busy;
            }
        });
    });

    if (typeof loadFavoritesPage === "function") {
        await loadFavoritesPage();
    }
}

initFavorites();
