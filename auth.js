const SUPABASE_URL = "https://oegqbjlolcmpczyeehzs.supabase.co";
const SUPABASE_KEY = "sb_publishable_dAYEcoUsdV9AmQfh4_XZrA_FqSBOicQ";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const form = document.getElementById("authForm");
const nicknameInput = document.getElementById("nickname");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const repeatPasswordInput = document.getElementById("repeatPassword");

const emailBlock = document.getElementById("emailBlock");
const repeatBlock = document.getElementById("repeatBlock");

const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");

const submitButton = document.getElementById("submitButton");
const formTitle = document.getElementById("formTitle");
const message = document.getElementById("message");

let mode = "login";

function setMode(newMode) {
    mode = newMode;

    const registering = mode === "register";

    loginTab.classList.toggle("active", !registering);
    registerTab.classList.toggle("active", registering);

    emailBlock.hidden = !registering;
    repeatBlock.hidden = !registering;

    emailInput.required = registering;
    repeatPasswordInput.required = registering;

    nicknameInput.placeholder = registering
        ? "Придумай Display Name"
        : "Email или Display Name";

    nicknameInput.autocomplete = "username";

    formTitle.textContent = registering
        ? "Регистрация"
        : "Вход";

    submitButton.textContent = registering
        ? "Создать аккаунт"
        : "Войти";

    passwordInput.autocomplete = registering
        ? "new-password"
        : "current-password";

    message.textContent = "";
}

loginTab.addEventListener("click", () => setMode("login"));
registerTab.addEventListener("click", () => setMode("register"));

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const displayName = nicknameInput.value.trim();
    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;
    const registering = mode === "register";

    message.textContent = "";

    if (!/^[A-Za-z0-9_-]{3,20}$/.test(displayName)) {
        message.textContent =
            "Display Name должен содержать 3–20 символов: латинские буквы, цифры, _ или -.";
        return;
    }

    if (password.length < 8) {
        message.textContent =
            "Пароль должен содержать минимум 8 символов.";
        return;
    }

    if (registering) {
        if (!emailInput.checkValidity() || !email) {
            message.textContent =
                "Введи корректный адрес электронной почты.";
            return;
        }

        if (password !== repeatPasswordInput.value) {
            message.textContent = "Пароли не совпадают.";
            return;
        }
    }

    submitButton.disabled = true;

    try {
        const { data, error } =
            await supabaseClient.functions.invoke("username-login", {
                body: {
                    action: registering ? "register" : "login",
                    display_name: displayName,
                    email: registering ? email : undefined,
                    password
                }
            });

if (error) {
    console.error("Edge Function error:", error);
    console.error("Function response:", data);

    let details = data?.error || error.message;

    if (error.context) {
        try {
            const responseData = await error.context.json();
            console.error("Server response:", responseData);
            details = responseData.error || details;
        } catch (e) {
            console.error("Не удалось прочитать ответ сервера");
        }
    }

    message.textContent = "Ошибка: " + details;
    return;
}

        if (!data?.success) {
            throw new Error(
                data?.error || "Не удалось выполнить операцию."
            );
        }

        // Если регистрация требует подтверждения email,
        // Supabase не вернёт сессию до подтверждения.
        if (registering && !data.session) {
            message.textContent =
                data.message ||
                "Аккаунт создан. Проверь почту для подтверждения.";
            return;
        }

        const session = registering ? data.session : data;

        if (!session?.access_token || !session?.refresh_token) {
            throw new Error("Сервер не вернул данные сессии.");
        }

        const { error: sessionError } =
            await supabaseClient.auth.setSession({
                access_token: session.access_token,
                refresh_token: session.refresh_token
            });

        if (sessionError) throw sessionError;

        message.textContent = registering
            ? "Регистрация успешна!"
            : "Вход выполнен!";

        window.location.replace("profile.html");

    } catch (error) {
        console.error("Ошибка авторизации:", error);

        message.textContent =
            "Ошибка: " +
            (error.message || "Не удалось выполнить запрос.");
    } finally {
        submitButton.disabled = false;
    }
});

setMode("login");