async function checkSession() {
    const data = await getSession();

    if (!data.loggedIn) {
        location.href = "/";
    }
}
async function getSession() {
    try {
        const res = await fetch("/api/util/session", {
            method: "GET",
            credentials: "include"
        });

        return await res.json();
    } catch(ex) {
        alert("エラーが発生しました");
        location.href = "/";
    }
}

//checkSession(); // 初期処理でのチェック不要のためコメントアウト