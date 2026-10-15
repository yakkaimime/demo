const API_BASE = "https://demo-service-185014424630.asia-northeast1.run.app";

async function checkSession() {
    const data = await getSession();

    if (!data.loggedIn) {
        location.href = "/demo/";
    }
}
async function getSession() {
    try {
        const res = await fetch(`${API_BASE}/api/util/session`, {
            method: "GET",
            credentials: "include"
        });

        return await res.json();
    } catch(ex) {
        alert("エラーが発生しました");
        location.href = "/demo/";
    }
}

//checkSession(); // 初期処理でのチェック不要のためコメントアウト