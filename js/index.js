document.getElementById("loginBtn").addEventListener("click", async () => {
    const id = document.getElementById("userid").value;
    const pass = document.getElementById("password").value;

    if (!id || !pass) {
        alert("ユーザーIDとパスワードを入力してください");
        return;
    }

    const isLogin = await login(id, pass);
    if (isLogin) {

        const url = window.location.pathname;

        if (url === "/") {
            window.location.href = "/mypage";
        } else {
            window.location.href = url;
        }

    } else {
        alert("ユーザーIDかパスワードが間違っています");
    }
});

async function login(id, pass) {

    const res = await fetch("/api/index/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, pass })
    });

    const data = await res.json();

    return data.isLogin;
}