const API_BASE = "https://localhost:7188/api";

document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("form-login")) {
        initAuthPage();
    } else if (document.getElementById("grid-subastas")) {
        initAuctionsPage();
    }
});

function initAuthPage() {
    const cardLogin = document.getElementById("card-login");
    const cardRegister = document.getElementById("card-register");
    const btnShowRegister = document.getElementById("btn-show-register");
    const btnShowLogin = document.getElementById("btn-show-login");
    const formLogin = document.getElementById("form-login");
    const formRegister = document.getElementById("form-register");

    btnShowRegister.onclick = () => {
        cardLogin.classList.add("hidden");
        cardRegister.classList.remove("hidden");
    };

    btnShowLogin.onclick = () => {
        cardRegister.classList.add("hidden");
        cardLogin.classList.remove("hidden");
    };

    formLogin.onsubmit = async (e) => {
        e.preventDefault();
        const errBox = document.getElementById("login-error");
        errBox.textContent = "";

        const email = document.getElementById("login-email").value.trim();
        const password = document.getElementById("login-password").value;

        try {
            const res = await fetch(`${API_BASE}/Users/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Usuario o contraseña inválidos");

            localStorage.setItem("token", data.token);
            localStorage.setItem("userName", data.name);
            localStorage.setItem("userId", data.id);
            window.location.href = "subastas.html";
        } catch (ex) {
            errBox.textContent = ex.message;
        }
    };

    formRegister.onsubmit = async (e) => {
        e.preventDefault();
        const errBox = document.getElementById("reg-error");
        const okBox = document.getElementById("reg-success");
        errBox.textContent = "";
        okBox.textContent = "";

        const name = document.getElementById("reg-name").value.trim();
        const email = document.getElementById("reg-email").value.trim();
        const password = document.getElementById("reg-password").value;

        try {
            const res = await fetch(`${API_BASE}/Users/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Error al registrarse");

            okBox.textContent = "¡Usuario registrado! Ya podés ingresar.";
            setTimeout(() => {
                document.getElementById("login-email").value = email;
                btnShowLogin.click();
            }, 1200);
        } catch (ex) {
            errBox.textContent = ex.message;
        }
    };
}

let subastasCache = [];

function initAuctionsPage() {
    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "index.html";
        return;
    }

    const userName = localStorage.getItem("userName");
    if (userName) {
        document.getElementById("user-display").textContent = `Hola, ${userName}`;
    }

    document.getElementById("btn-logout").onclick = () => {
        localStorage.clear();
        window.location.href = "index.html";
    };

    const boxRecharge = document.getElementById("box-recharge");
    const boxAuction = document.getElementById("box-auction");

    document.getElementById("btn-toggle-recharge").onclick = () => {
        boxRecharge.classList.toggle("hidden");
    };

    document.getElementById("btn-cancel-recharge").onclick = () => {
        boxRecharge.classList.add("hidden");
    };

    document.getElementById("btn-toggle-auction").onclick = () => {
        precargarFechas();
        boxAuction.classList.toggle("hidden");
    };

    document.getElementById("btn-cancel-auction").onclick = () => {
        boxAuction.classList.add("hidden");
    };

    document.getElementById("form-recharge").onsubmit = async (e) => {
        e.preventDefault();
        const msg = document.getElementById("recharge-msg");
        msg.textContent = "Procesando...";
        msg.className = "";

        const amount = parseFloat(document.getElementById("recharge-amount").value);

        try {
            const res = await fetch(`${API_BASE}/Wallets/recharge`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ amount })
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.message || "Error al recargar saldo");

            msg.className = "success-msg";
            msg.textContent = "¡Saldo acreditado exitosamente!";
            document.getElementById("recharge-amount").value = "";

            cargarBilletera();
            setTimeout(() => boxRecharge.classList.add("hidden"), 1000);
        } catch (err) {
            msg.className = "error-msg";
            msg.textContent = err.message;
        }
    };

    document.getElementById("form-create-auction").onsubmit = async (e) => {
        e.preventDefault();
        const msg = document.getElementById("auction-msg");
        msg.textContent = "Publicando...";
        msg.className = "";

        const bodyData = {
            title: document.getElementById("auc-title").value.trim(),
            description: document.getElementById("auc-desc").value.trim(),
            imageUrl: document.getElementById("auc-image").value.trim(),
            startingPrice: parseFloat(document.getElementById("auc-price").value),
            minimumIncrement: parseFloat(document.getElementById("auc-increment").value),
            startDate: new Date(document.getElementById("auc-start").value).toISOString(),
            endDate: new Date(document.getElementById("auc-end").value).toISOString(),
            categoryId: parseInt(document.getElementById("auc-category").value)
        };

        try {
            const res = await fetch(`${API_BASE}/Auctions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(bodyData)
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.message || "No se pudo crear la subasta");

            msg.className = "success-msg";
            msg.textContent = "¡Subasta creada!";
            document.getElementById("form-create-auction").reset();

            cargarSubastas(false);
            setTimeout(() => boxAuction.classList.add("hidden"), 1000);
        } catch (err) {
            msg.className = "error-msg";
            msg.textContent = err.message;
        }
    };

    cargarBilletera();
    cargarSubastas(false);

    setInterval(actualizarCronometrosLocales, 1000);

    setInterval(() => {
        cargarBilletera();
        cargarSubastas(true);
    }, 3000);
}

async function cargarBilletera() {
    const token = localStorage.getItem("token");
    const display = document.getElementById("wallet-display");
    if (!display || !token) return;

    try {
        const res = await fetch(`${API_BASE}/Wallets/me`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (res.ok) {
            const w = await res.json();
            display.textContent = `Saldo: $${Number(w.availableBalance).toFixed(2)}`;
        }
    } catch (err) {
        console.error("Error al obtener balance", err);
    }
}

async function cargarSubastas(esSilencioso = false) {
    const token = localStorage.getItem("token");
    const currentUserId = parseInt(localStorage.getItem("userId") || "0");
    const grid = document.getElementById("grid-subastas");
    if (!grid || !token) return;

    try {
        const res = await fetch(`${API_BASE}/Auctions`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!res.ok) throw new Error("No se pudieron cargar las subastas");

        const lista = await res.json();
        subastasCache = lista;

        const detalles = await Promise.all(
            lista.map(a =>
                fetch(`${API_BASE}/Auctions/${a.id}`, {
                    headers: { "Authorization": `Bearer ${token}` }
                }).then(r => r.ok ? r.json() : null).catch(() => null)
            )
        );

        const cardsExistentes = grid.querySelectorAll(".auction-card");
        if (esSilencioso && cardsExistentes.length === lista.length && lista.length > 0) {
            lista.forEach((a, index) => {
                const det = detalles[index];
                if (!det) return;

                const currentPrice = Number(det.currentPrice);
                const minimumIncrement = Number(det.minimumIncrement ?? 1);
                const hasBids = (a.totalBids > 0);

                const nextBidRequired = hasBids
                    ? (currentPrice + minimumIncrement)
                    : Number(det.startingPrice);

                const elPrice = document.getElementById(`price-${a.id}`);
                const elMin = document.getElementById(`min-${a.id}`);
                const elBids = document.getElementById(`bids-${a.id}`);
                const inputBid = document.getElementById(`monto-${a.id}`);

                if (elPrice) elPrice.textContent = `$${currentPrice.toFixed(2)}`;
                if (elMin) elMin.textContent = `$${minimumIncrement.toFixed(2)}`;
                if (elBids) elBids.textContent = a.totalBids;

                if (inputBid && document.activeElement !== inputBid) {
                    inputBid.placeholder = `Mínimo a ingresar: $${nextBidRequired.toFixed(2)}`;
                    inputBid.min = nextBidRequired.toFixed(2);
                }
            });
            return;
        }

        grid.innerHTML = "";

        if (lista.length === 0) {
            grid.innerHTML = "<p>No hay subastas activas actualmente.</p>";
            return;
        }

        lista.forEach((a, index) => {
            const det = detalles[index] || {};
            const startingPrice = Number(det.startingPrice ?? a.currentPrice);
            const currentPrice = Number(det.currentPrice ?? a.currentPrice);
            const minimumIncrement = Number(det.minimumIncrement ?? 1);
            const hasBids = (a.totalBids > 0);

            const nextBidRequired = hasBids
                ? (currentPrice + minimumIncrement).toFixed(2)
                : startingPrice.toFixed(2);

            const esCreador = (det.sellerId === currentUserId);
            const activa = a.status === "ACTIVA";

            const card = document.createElement("div");
            card.className = "card auction-card";

            card.innerHTML = `
                <div>
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span class="status-tag status-${a.status}">${a.status}</span>
                    <span style="font-size: 0.8rem; color: #6b7280;">${a.categoryName || "General"}</span>
                  </div>
                  <h3 style="margin: 0.75rem 0 0.2rem;">${a.title}</h3>
                 
                  <div>
                    <span id="timer-${a.id}" class="auction-timer timer-green">Calculando...</span>
                  </div>

                  <hr style="margin: 0.5rem 0 0.8rem; border: none; border-top: 1px solid #f3f4f6;" />
                 
                  <p><strong>Precio publicado:</strong> $${startingPrice.toFixed(2)}</p>
                 
                  <p style="font-size: 1.05rem; margin: 0.2rem 0;">
                    <strong>Puja actual:</strong>
                    <span id="price-${a.id}" style="color: #1d4ed8; font-weight: bold;">$${currentPrice.toFixed(2)}</span>
                  </p>

                  <p style="margin-bottom: 0.2rem;">
                    <strong>Mínimo de puja:</strong>
                    <span id="min-${a.id}" style="color: #047857; font-weight: 600;">$${minimumIncrement.toFixed(2)}</span>
                  </p>
                </div>

                ${esCreador ? `
                  <div style="margin-top: 1.2rem; background: #eff6ff; padding: 0.6rem; border-radius: 6px; text-align: center; border: 1px solid #bfdbfe;">
                    <span style="color: #1e40af; font-size: 0.85rem; font-weight: 600;">Esta es tu subasta (no podés ofertar)</span>
                  </div>
                ` : activa ? `
                  <div style="margin-top: 1.2rem;">
                    <input type="number" step="0.01" id="monto-${a.id}" min="${nextBidRequired}" placeholder="Mínimo a ingresar: $${nextBidRequired}" style="margin-bottom: 0.5rem;">
                    <button class="btn btn-primary btn-block btn-bid" data-id="${a.id}">Pujar</button>
                  </div>
                ` : '<p style="color: #9ca3af; margin-top: 1.2rem; font-size: 0.9rem;">Subasta cerrada para ofertas.</p>'}
            `;
            grid.appendChild(card);
        });

        grid.querySelectorAll(".btn-bid").forEach(btn => {
            btn.onclick = () => enviarPuja(parseInt(btn.dataset.id));
        });

        actualizarCronometrosLocales();

    } catch (err) {
        if (!esSilencioso) {
            grid.innerHTML = `<p class="error-msg">${err.message}</p>`;
        }
    }
}

function actualizarCronometrosLocales() {
    const ahora = new Date().getTime();

    subastasCache.forEach(a => {
        const el = document.getElementById(`timer-${a.id}`);
        if (!el) return;

        if (a.status === "FINALIZADA") {
            el.textContent = "Finalizada";
            el.className = "auction-timer timer-gray";
            return;
        }

        const fin = new Date(a.endDate).getTime();
        const distancia = fin - ahora;

        if (distancia <= 0) {
            el.textContent = "Finalizando...";
            el.className = "auction-timer timer-gray";
            return;
        }

        const minutos = Math.floor(distancia / (1000 * 60));
        const segundos = Math.floor((distancia % (1000 * 60)) / 1000);
        const textoTiempo = `${minutos}m ${segundos < 10 ? '0' : ''}${segundos}s`;

        if (distancia <= 60000) {
            el.className = "auction-timer timer-orange";
            el.textContent = `⏳ ${textoTiempo}`;
        } else if (distancia <= 120000) {
            el.className = "auction-timer timer-yellow";
            el.textContent = `⏳ ${textoTiempo}`;
        } else {
            el.className = "auction-timer timer-green";
            el.textContent = `⏳ ${textoTiempo}`;
        }
    });
}

async function enviarPuja(auctionId) {
    const token = localStorage.getItem("token");
    const input = document.getElementById(`monto-${auctionId}`);
    const amount = parseFloat(input.value);

    if (!amount || isNaN(amount)) {
        alert("Ingresá un monto válido.");
        return;
    }

    try {
        const resAuction = await fetch(`${API_BASE}/Auctions/${auctionId}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const currentAuction = await resAuction.json();
        const currentVersion = currentAuction.version ?? 0;

        const res = await fetch(`${API_BASE}/Auctions/${auctionId}/bids`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                auctionId: auctionId,
                amount: amount,
                expectedVersion: currentVersion
            })
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            alert(data.message || "No se pudo realizar la puja.");
        } else {
            alert("¡Puja realizada con éxito!");
            input.value = "";
            await cargarBilletera();
            await cargarSubastas(false);
        }
    } catch (err) {
        alert("Error al comunicarse con el servidor.");
    }
}

function precargarFechas() {
    const now = new Date();
    const end = new Date(now.getTime() + 15 * 60000);

    const toIsoStringLocal = d => {
        const offset = d.getTimezoneOffset() * 60000;
        return new Date(d.getTime() - offset).toISOString().slice(0, 16);
    };

    const startInput = document.getElementById("auc-start");
    const endInput = document.getElementById("auc-end");
    if (startInput && endInput) {
        startInput.value = toIsoStringLocal(now);
        endInput.value = toIsoStringLocal(end);
    }
}