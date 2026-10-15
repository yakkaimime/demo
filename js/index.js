const API_BASE = "https://demo-service-185014424630.asia-northeast1.run.app";

document.getElementById("loginBtn").addEventListener("click", async () => {
    const id = document.getElementById("userid").value;
    const pass = document.getElementById("password").value;

    if (!id || !pass) {
        alert("ユーザーIDとパスワードを入力してください");
        return;
    }

    const isLogin = await login(id, pass);
    console.log("■■■ isLogin：" + isLogin);
    if (isLogin) {

        const url = window.location.pathname;

        if (url === "/") {
            console.log("■■■ url：" + url);
            window.location.href = "/demo/mypage.html";
        } else {
            console.log("■■■ url：" + url);
            window.location.href = url;
        }

    } else {
        alert("ユーザーIDかパスワードが間違っています");
    }
});

async function login(id, pass) {

    try {

        const res = await fetch(`${API_BASE}/api/index/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, pass })
        });

        const data = await res.json();

        return data.isLogin;

    } catch (ex) {
        console.error("login() 内で例外発生:", ex);
        return false;
    }
}