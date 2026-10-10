const favoritesList = document.getElementById("favoritesList");

async function loadFavoritesPage() {
    if (!favoritesList) return;

    const { data: { user }, error: userError } =
        await favoritesSupabase.auth.getUser();

    if (userError) {
        favoritesList.textContent = "Не удалось проверить аккаунт.";
        return;
    }

    if (!user) {
        favoritesList.replaceChildren();

        const message = document.createElement("p");
        message.textContent = "Войди в аккаунт, чтобы увидеть избранное.";

        const login = document.createElement("a");
        login.href = "auth.html";
        login.textContent = "Войти";

        favoritesList.append(message, login);
        return;
    }

    const { data, error } = await favoritesSupabase
        .from("favorites")
        .select("id, mod_name, mod_url, created_at")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Ошибка загрузки избранного:", error);
        favoritesList.textContent = "Не удалось загрузить избранное.";
        return;
    }

    favoritesList.replaceChildren();

    if (!data || data.length === 0) {
        favoritesList.textContent =
            "Здесь пока пусто. Добавь моды в избранное!";
        return;
    }

    data.forEach(item => {
        const card = document.createElement("div");
        card.className = "card";

        const content = document.createElement("div");
        content.className = "card-content";

        const title = document.createElement("h2");
        title.textContent = item.mod_name;

        const link = document.createElement("a");
        link.href = item.mod_url;
        link.className = "download-mod";
        link.textContent = "Открыть / скачать";

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "favorite-toggle is-favorite";
        remove.textContent = "★ Убрать из избранного";

        remove.addEventListener("click", async () => {
            remove.disabled = true;

            const { error } = await favoritesSupabase
                .from("favorites")
                .delete()
                .eq("id", item.id);

            if (error) {
                console.error("Ошибка удаления:", error);
                remove.disabled = false;
                alert("Не удалось удалить мод из избранного.");
                return;
            }

            await loadFavoritesPage();
        });

        content.append(title, link, remove);
        card.append(content);
        favoritesList.append(card);
    });
}