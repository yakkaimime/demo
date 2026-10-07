
// ★★★★★ localStorage 安全ラッパ（Safari対応） ★★★★★
function safeGet(key) {
    try {
        return localStorage.getItem(key);
    } catch (e) {
        return null;
    }
}

function safeSet(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch (e) {
        // Safari プライベートモードではここに来る
    }
}

// ★★★★★ 初期値保存 ★★★★★
function saveInitialValues() {
    const ids = [
        "defaultStart", "defaultEnd",
        "break1_start", "break1_end",
        "break2_start", "break2_end",
        "break3_start", "break3_end"
    ];

    const data = {};
    ids.forEach(id => data[id] = document.getElementById(id).value);

    safeSet("initialValues", JSON.stringify(data));
}

// ★★★★★ 初期値復元（Safariでも例外で止まらない） ★★★★★
window.onload = () => {
    let saved = safeGet("initialValues");
    if (!saved) return;

    try {
        saved = JSON.parse(saved);
    } catch (e) {
        return;
    }

    Object.keys(saved).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = saved[id];
    });
};

// ▼ 勤務区分リスト
const selectItems = [
    { label: "通常勤務", code: 1 },
    { label: "有給休暇", code: 2 },
    { label: "特別休暇", code: 3 },
    { label: "欠勤", code: 4 },
    { label: "非営業日", code: 5 },
    { label: "休日", code: 6 }
];

// ▼ 勤務欄の ±15/±30（生成後は非活性化される）
function adjustTime(id, minutes, dateStr = null) {
    const input = document.getElementById(id);
    if (!input || !input.value) return;

    const [h, m] = input.value.split(":").map(Number);
    let total = h * 60 + m + minutes;

    if (total < 0) total = 0;
    if (total >= 1440) total = 1439;

    input.value =
        String(Math.floor(total / 60)).padStart(2, "0") + ":" +
        String(total % 60).padStart(2, "0");

    if (dateStr) calcWorkTime(dateStr);
}


// ▼ 休憩欄の ±15/±30（常に活性）
function adjustBreak(id, minutes) {
    const input = document.getElementById(id);
    if (!input || !input.value) return;

    const [h, m] = input.value.split(":").map(Number);
    let total = h * 60 + m + minutes;

    if (total < 0) total = 0;
    if (total >= 1440) total = 1439;

    input.value =
        String(Math.floor(total / 60)).padStart(2, "0") + ":" +
        String(total % 60).padStart(2, "0");

    recalcAllWorkTimes();
}


// ▼ 休憩控除（勤務範囲内のみ）
function calcBreakMinutes(start, end, w_s, w_e) {
    if (!start || !end) return 0;

    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);

    const b_s = sh * 60 + sm;
    const b_e = eh * 60 + em;

    return Math.max(0, Math.min(b_e, w_e) - Math.max(b_s, w_s));
}


// ▼ 就業時間計算
function calcWorkTime(dateStr) {
    const st = document.getElementById(`start_${dateStr}`);
    const en = document.getElementById(`end_${dateStr}`);
    const wt = document.getElementById(`work_${dateStr}`);

    if (!st || !en || !wt) return;

    if (!st.value || !en.value) {
        wt.textContent = "0:00";
        return;
    }

    const [sh, sm] = st.value.split(":").map(Number);
    const [eh, em] = en.value.split(":").map(Number);

    const w_s = sh * 60 + sm;
    const w_e = eh * 60 + em;

    let diff = w_e - w_s;
    if (diff < 0) diff = 0;

    const b1 = calcBreakMinutes(break1_start.value, break1_end.value, w_s, w_e);
    const b2 = calcBreakMinutes(break2_start.value, break2_end.value, w_s, w_e);
    const b3 = calcBreakMinutes(break3_start.value, break3_end.value, w_s, w_e);

    diff -= (b1 + b2 + b3);
    if (diff < 0) diff = 0;

    wt.textContent =
        `${Math.floor(diff / 60)}:${String(diff % 60).padStart(2, "0")}`;
}


// ▼ 休憩変更時 → 全日再計算
function recalcAllWorkTimes() {
    const ym = document.getElementById("monthPicker").value;
    if (!ym) return;

    const [year, month] = ym.split("-");
    const lastDay = new Date(year, month, 0).getDate();

    for (let d = 1; d <= lastDay; d++) {
        const dateStr =
            `${year}-${month.padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        calcWorkTime(dateStr);
    }
}


// ▼ 初期値欄を非活性化（勤務欄の ±15/±30 も非活性化）
function disableInitialInputs() {
    const ids = [
        "monthPicker",
        "defaultStart", "defaultEnd",
        "break1_start", "break1_end",
        "break2_start", "break2_end",
        "break3_start", "break3_end"
    ];

    // インプット を非活性化
    document.querySelectorAll(".generateDisabled").forEach(el => {
        el.disabled = true;
    });

    // 勤務欄の ±15/±30 を非活性化
    document.querySelectorAll(".adjustDisabled").forEach(el => {
        el.classList.add("disabled");
    });
}


// ▼ 取消ボタン → 初期状態に戻す
function resetAll() {
    const ids = [
        "monthPicker",
        "defaultStart", "defaultEnd",
        "break1_start", "break1_end",
        "break2_start", "break2_end",
        "break3_start", "break3_end"
    ];

    // インプット を非活性化
    document.querySelectorAll(".generateDisabled").forEach(el => {
        el.disabled = false;
    });

    // 勤務欄の ±15/±30 を活性化
    document.querySelectorAll(".adjustDisabled").forEach(el => {
        el.classList.remove("disabled");
    });

    document.getElementById("formArea").innerHTML = "";
    document.getElementById("excelBtn").style.display = "none";
}


// ▼ フォーム生成本体（Safari対応）
function generateForm() {

    saveInitialValues();  // Safari対策：localStorageまとめ保存

    const area = document.getElementById("formArea");
    area.innerHTML = "";

    const ym = document.getElementById("monthPicker").value;
    if (!ym) return;

    const defaultStart = document.getElementById("defaultStart").value;
    const defaultEnd = document.getElementById("defaultEnd").value;

    const [year, month] = ym.split("-");
    const lastDay = new Date(year, month, 0).getDate();

    const weekdayNames = ["日", "月", "火", "水", "木", "金", "土"];

    for (let d = 1; d <= lastDay; d++) {

        const dateStr =
            `${year}-${month.padStart(2, "0")}-${String(d).padStart(2, "0")}`;

        const day = new Date(dateStr).getDay();
        const weekday = weekdayNames[day];
        const disabled = (day === 0 || day === 6);

        const row = document.createElement("div");
        row.className = "day-row";

        let selectHTML =
            `<select id="sel_${dateStr}">`;

        selectItems.forEach(item => {
            selectHTML += `<option value="${item.code}" ${(day === 0 && item.code === 6) || (day === 6 && item.code === 5) ? "selected" : ""}>${item.label}</option>`;
        });
        selectHTML += `</select>`;

        row.innerHTML = `
            <div class="label-date">${dateStr}（${weekday}）</div>

            区分：
            ${selectHTML}

            <br>
            備考：
            <input type="text" id="notes_${dateStr}">

            <br>
            編集：
            <input type="checkbox" id="chk_${dateStr}" ${disabled ? "" : "checked"}>

            <br>
            開始：
            <span
                ${disabled ? "disabled class='adjust adjustDisabled'" : " class='adjust'"}
                id="adj_s_${dateStr}_-30"
                onclick="adjustTime('start_${dateStr}', -30, '${dateStr}')">-30</span>
            <span
                ${disabled ? "disabled class='adjust adjustDisabled'" : " class='adjust'"}
                id="adj_s_${dateStr}_-15"
                onclick="adjustTime('start_${dateStr}', -15, '${dateStr}')">-15</span>

            <input type="time" id="start_${dateStr}" value="${defaultStart}"
                ${disabled ? "disabled class='disabled'" : ""}
                onchange="calcWorkTime('${dateStr}')">

            <span
                ${disabled ? "disabled class='adjust adjustDisabled'" : " class='adjust'"}
                id="adj_s_${dateStr}_15"
                onclick="adjustTime('start_${dateStr}', 15, '${dateStr}')">+15</span>
            <span
                ${disabled ? "disabled class='adjust adjustDisabled'" : " class='adjust'"}
                id="adj_s_${dateStr}_30"
                onclick="adjustTime('start_${dateStr}', 30, '${dateStr}')">+30</span>

            <br>
            終了：
            <span
                ${disabled ? "disabled class='adjust adjustDisabled'" : " class='adjust'"}
                id="adj_e_${dateStr}_-30"
                onclick="adjustTime('end_${dateStr}', -30, '${dateStr}')">-30</span>
            <span
                ${disabled ? "disabled class='adjust adjustDisabled'" : " class='adjust'"}
                id="adj_e_${dateStr}_-15"
                onclick="adjustTime('end_${dateStr}', -15, '${dateStr}')">-15</span>

            <input type="time" id="end_${dateStr}" value="${defaultEnd}"
                ${disabled ? "disabled class='disabled'" : ""}
                onchange="calcWorkTime('${dateStr}')">

            <span
                ${disabled ? "disabled class='adjust adjustDisabled'" : " class='adjust'"}
                id="adj_e_${dateStr}_15"
                onclick="adjustTime('end_${dateStr}', 15, '${dateStr}')">+15</span>
            <span
                ${disabled ? "disabled class='adjust adjustDisabled'" : " class='adjust'"}
                id="adj_e_${dateStr}_30"
                onclick="adjustTime('end_${dateStr}', 30, '${dateStr}')">+30</span>

            <span class="worktime" id="work_${dateStr}">0:00</span>
        `;

        // チェックボックス ON/OFF
        row.querySelector(`#chk_${dateStr}`).addEventListener("change", (e) => {

            const st = document.getElementById(`start_${dateStr}`);
            const en = document.getElementById(`end_${dateStr}`);
            const wt = document.getElementById(`work_${dateStr}`);

            const adjIds = [
                `adj_s_${dateStr}_-30`, `adj_s_${dateStr}_-15`,
                `adj_s_${dateStr}_15`, `adj_s_${dateStr}_30`,
                `adj_e_${dateStr}_-30`, `adj_e_${dateStr}_-15`,
                `adj_e_${dateStr}_15`, `adj_e_${dateStr}_30`
            ];

            if (e.target.checked) {
                st.disabled = false; st.classList.remove("disabled");
                en.disabled = false; en.classList.remove("disabled");

                adjIds.forEach(id => document.getElementById(id).classList.remove("disabled"));

                calcWorkTime(dateStr);

            } else {
                st.disabled = true; st.classList.add("disabled");
                en.disabled = true; en.classList.add("disabled");

                adjIds.forEach(id => document.getElementById(id).classList.add("disabled"));

                wt.textContent = "0:00";
            }
        });

        // セレクト（勤務区分） CHANGE
        row.querySelector(`#sel_${dateStr}`).addEventListener("change", (e) => {

            const chk = document.getElementById(`chk_${dateStr}`);

            if (e.target.value === "5" || e.target.value === "6") {
                chk.checked = false;
            } else {
                chk.checked = true;
            }
            // change イベントを発火
            chk.dispatchEvent(new Event("change"));
        });

        area.appendChild(row);

        if (!disabled) {
            calcWorkTime(dateStr);
        }

    }

    // ★ Safari対策：DOM生成が完全に終わってから disabled を適用
    setTimeout(() => {
        disableInitialInputs();
    }, 0);

    document.getElementById("excelBtn").style.display = "block";
}


// ▼ Excel 出力
async function createExcel() {
    const ym = document.getElementById("monthPicker").value;
    if (!ym) return;

    const [year, month] = ym.split("-");

    // ログイン情報
    const loginData = await getSession();
    if (!loginData.loggedIn) {
        alert("ログインセッションが切れています");
        return;
    }

    const name = loginData.user.name;

    // 画面入力情報
    const defaultStart = document.getElementById("defaultStart").value;
    const defaultEnd   = document.getElementById("defaultEnd").value;
    const break1Start  = document.getElementById("break1_start").value;
    const break1End    = document.getElementById("break1_end").value;
    const break2Start  = document.getElementById("break2_start").value;
    const break2End    = document.getElementById("break2_end").value;
    const break3Start  = document.getElementById("break3_start").value;
    const break3End    = document.getElementById("break3_end").value;

    const lastDay = new Date(year, month, 0).getDate();
    const days = [];

    for (let d = 1; d <= lastDay; d++) {
        const dateStr =
            `${year}-${month.padStart(2, "0")}-${String(d).padStart(2, "0")}`;

        const sel   = document.getElementById(`sel_${dateStr}`).value;
        const st    = document.getElementById(`start_${dateStr}`).value;
        const en    = document.getElementById(`end_${dateStr}`).value;
        const wt    = document.getElementById(`work_${dateStr}`).textContent;
        const notes = document.getElementById(`notes_${dateStr}`).value;
        const chk   = document.getElementById(`chk_${dateStr}`).checked;

        const breaks = [
            { start: break1Start, end: break1End },
            { start: break2Start, end: break2End },
            { start: break3Start, end: break3End }
        ];
        const totalBreak = calcTotalBreakMinutes(st, en, breaks);
        const nightBreak = calcNightBreakMinutes(breaks);
        const breakTime  = totalBreak - nightBreak;

        let holiday = "";
        if (sel === "5") holiday = "2";
        else if (sel === "6") holiday = "1";

        days.push({
            date: dateStr,
            sel,
            start: (chk && (sel === "1" || sel === "5" || sel === "6"))? st : "",
            end: (chk && (sel === "1" || sel === "5" || sel === "6"))? en : "",
            work: wt,
            holiday,
            breakTime: (chk && (sel === "1" || sel === "5" || sel === "6"))? toHHMM(breakTime) : "",
            nightBreak: (chk && (sel === "1" || sel === "5" || sel === "6"))? toHHMM(nightBreak) : "",
            notes
        });
    }

    const payload = {
        year,
        month,
        name,
        defaultStart,
        defaultEnd,
        break1Start,
        break1End,
        break2Start,
        break2End,
        break3Start,
        break3End,
        days
    };

    const res = await fetch("/api/kintai/excelCreate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    // ▼ レスポンスの Content-Type を確認する
    const contentType = res.headers.get("Content-Type") || "";

    if (!res.ok) {
        if (contentType.includes("application/json")) {
            const err = await res.json();
            console.log(
                "エラー発生\n\n" +
                "種類: " + err.error + "\n" +
                "内容: " + err.message + "\n\n" +
                "スタックトレース:\n" + err.stackTrace
            );
            alert(
                "エラー発生\n\n" +
                "種類: " + err.error + "\n" +
                "内容: " + err.message + "\n\n" +
                "スタックトレース:\n" + err.stackTrace
            );
        } else {
            // JSON じゃない場合（＝undefined の原因）
            const text = await res.text();
            alert("JSON ではないレスポンス:\n" + text);
        }
        return;
    }

    // 正常時
    const blob = await res.blob();
    // Content-Disposition からファイル名を取得
    const disposition = res.headers.get("Content-Disposition");
    let filename = "download.xlsx";
    if (disposition && disposition.includes("filename=")) {
        filename = disposition.split("filename=")[1].trim();
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${payload.year}-${payload.month}_kintai.xlsm`;
    a.click();
    URL.revokeObjectURL(url);

}

// 総休憩時間
function calcTotalBreakMinutes(startTime, endTime, breaks) {
    if (!startTime || !endTime) {
        return 0;
    }
    const start = toMinutes(startTime);
    const end   = toMinutes(endTime);

    let total = 0;

    breaks.forEach(b => {
        if (!b.start || !b.end) {
            return;
        }
        const bs = toMinutes(b.start);
        const be = toMinutes(b.end);

        // 翌日まで続く休憩
        if (be < bs) {
            total += overlap(start, end, bs, 24 * 60);
            total += overlap(start, end, 0, be);
        } else {
            total += overlap(start, end, bs, be);
        }
    });

    return total;
}

// 深夜時間（22:00〜05:00）と重なる休憩時間を計算
function calcNightBreakMinutes(breaks) {
    const night1Start = 22 * 60;  // 22:00
    const night1End   = 24 * 60;  // 24:00
    const night2Start = 0;        // 00:00
    const night2End   = 5 * 60;   // 05:00

    let total = 0;

    breaks.forEach(b => {
        if (!b.start || !b.end) {
            return;
        }
        const bs = toMinutes(b.start);
        const be = toMinutes(b.end);

        // 休憩が翌日まで続く場合（例：23:00〜02:00）
        if (be < bs) {
            // 22:00〜24:00 と重なる部分
            total += overlap(bs, 24 * 60, night1Start, night1End);

            // 00:00〜05:00 と重なる部分
            total += overlap(0, be, night2Start, night2End);
        } else {
            // 通常の休憩（同日内）
            total += overlap(bs, be, night1Start, night1End);
            total += overlap(bs, be, night2Start, night2End);
        }
    });

    return total;
}

// 時刻 → 分変換
function toMinutes(t) {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
}

// 時間範囲の重なりを計算
function overlap(start1, end1, start2, end2) {
    const s = Math.max(start1, start2);
    const e = Math.min(end1, end2);
    return Math.max(0, e - s);
}

// 分 → "HH:mm" に変換
function toHHMM(mins) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
}

// ▼ Safari対応：onclick禁止 → addEventListenerで登録
document.getElementById("genBtn").addEventListener("click", generateForm);
document.getElementById("resetBtn").addEventListener("click", resetAll);
