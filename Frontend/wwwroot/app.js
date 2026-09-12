const API_BASE = "https://localhost:7188/api";

document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("form-login")) {
        initAuthPage();
    } else if (document.getElementById("grid-categories")) {
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
            const response = await fetch(`${API_BASE}/Users/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data.message || data.title || "Usuario o contraseña inválidos");

            const token = data.token || data.Token;
            const userName = data.name || data.Name || email;
            const userId = data.id || data.Id || 0;

            if (!token) throw new Error("No se recibió el token de autenticación.");

            localStorage.setItem("token", token);
            localStorage.setItem("userName", userName);
            localStorage.setItem("userId", userId);
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
            const response = await fetch(`${API_BASE}/Users/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data.message || data.title || "Error al registrarse");

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


const CATEGORIES_CONFIG = [
    { id: "", name: "Todas", image: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400&auto=format&fit=crop&q=60" },
    { id: 1, name: "Vehículos", image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&auto=format&fit=crop&q=60" },
    { id: 2, name: "Tecnología", image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&auto=format&fit=crop&q=60" },
    { id: 3, name: "Hogar y Muebles", image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&auto=format&fit=crop&q=60" },
    { id: 4, name: "Arte y Antigüedades", image: "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=400&auto=format&fit=crop&q=60" },
    { id: 5, name: "Joyas y Relojes", image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&auto=format&fit=crop&q=60" },
    { id: 6, name: "Moda y Accesorios", image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&auto=format&fit=crop&q=60" },
    { id: 7, name: "Deportes y Fitness", image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&auto=format&fit=crop&q=60" },
    { id: 8, name: "Inmuebles", image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&auto=format&fit=crop&q=60" },
    { id: 9, name: "Otros", image: "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=400&auto=format&fit=crop&q=60" }
];

let auctionsCache = [];
let selectedCategoryId = null;
let activeSearchAuctionId = null;

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
    const boxActivity = document.getElementById("box-activity");

    document.getElementById("btn-toggle-recharge").onclick = () => {
        boxAuction.classList.add("hidden");
        boxActivity.classList.add("hidden");
        boxRecharge.classList.toggle("hidden");
    };
    document.getElementById("btn-cancel-recharge").onclick = () => boxRecharge.classList.add("hidden");

    document.getElementById("btn-toggle-auction").onclick = () => {
        boxRecharge.classList.add("hidden");
        boxActivity.classList.add("hidden");
        preloadDateInputs();
        boxAuction.classList.toggle("hidden");
    };
    document.getElementById("btn-cancel-auction").onclick = () => boxAuction.classList.add("hidden");

    document.getElementById("btn-toggle-activity").onclick = () => {
        boxRecharge.classList.add("hidden");
        boxAuction.classList.add("hidden");
        boxActivity.classList.toggle("hidden");
        if (!boxActivity.classList.contains("hidden")) {
            loadMyActivity();
        }
    };
    document.getElementById("btn-close-activity").onclick = () => boxActivity.classList.add("hidden");

    const tabSales = document.getElementById("tab-sales");
    const tabPurchases = document.getElementById("tab-purchases");
    const containerSales = document.getElementById("container-my-sales");
    const containerPurchases = document.getElementById("container-my-purchases");

    tabSales.onclick = () => {
        tabSales.className = "btn btn-primary";
        tabPurchases.className = "btn btn-outline";
        containerSales.classList.remove("hidden");
        containerPurchases.classList.add("hidden");
    };

    tabPurchases.onclick = () => {
        tabPurchases.className = "btn btn-primary";
        tabSales.className = "btn btn-outline";
        containerPurchases.classList.remove("hidden");
        containerSales.classList.add("hidden");
    };

    document.getElementById("btn-back-categories").onclick = () => {
        selectedCategoryId = null;
        activeSearchAuctionId = null;
        document.getElementById("view-auctions").classList.add("hidden");
        document.getElementById("view-categories").classList.remove("hidden");
    };

    document.getElementById("form-recharge").onsubmit = async (e) => {
        e.preventDefault();
        const msg = document.getElementById("recharge-msg");
        msg.textContent = "Procesando...";
        msg.className = "";

        const amount = parseFloat(document.getElementById("recharge-amount").value);

        try {
            const response = await fetch(`${API_BASE}/Wallets/recharge`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ amount })
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data.message || "Error al recargar saldo");

            msg.className = "success-msg";
            msg.textContent = "¡Saldo acreditado exitosamente!";
            document.getElementById("recharge-amount").value = "";

            loadWalletBalance();
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

        const categoryId = parseInt(document.getElementById("auc-category").value) || 1;

        const requestBody = {
            title: document.getElementById("auc-title").value.trim(),
            description: document.getElementById("auc-desc").value.trim(),
            imageUrl: document.getElementById("auc-image").value.trim(),
            startingPrice: parseFloat(document.getElementById("auc-price").value),
            minimumIncrement: parseFloat(document.getElementById("auc-increment").value),
            startDate: new Date(document.getElementById("auc-start").value).toISOString(),
            endDate: new Date(document.getElementById("auc-end").value).toISOString(),
            categoryId: categoryId
        };

        try {
            const response = await fetch(`${API_BASE}/Auctions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data.message || "No se pudo crear la subasta");

            msg.className = "success-msg";
            msg.textContent = "¡Subasta creada!";
            document.getElementById("form-create-auction").reset();

            openCategoryView(categoryId.toString());
            setTimeout(() => boxAuction.classList.add("hidden"), 1000);
        } catch (err) {
            msg.className = "error-msg";
            msg.textContent = err.message;
        }
    };

    const formSearch = document.getElementById("form-search-id");
    const inputSearch = document.getElementById("search-id-input");

    formSearch.onsubmit = (e) => {
        e.preventDefault();
        const searchId = parseInt(inputSearch.value);
        if (!searchId || isNaN(searchId)) return;

        activeSearchAuctionId = searchId;
        selectedCategoryId = "search";

        document.getElementById("view-categories").classList.add("hidden");
        document.getElementById("view-auctions").classList.remove("hidden");
        document.getElementById("active-category-title").textContent = `Búsqueda por ID #${searchId}`;
        document.getElementById("filter-subtitle").textContent = "";

        loadAuctions(false);
    };

    renderCategoryShowcase();
    loadWalletBalance();

    setInterval(updateLocalTimers, 1000);

    setInterval(() => {
        loadWalletBalance();
        if (selectedCategoryId !== null && selectedCategoryId !== "search") {
            loadAuctions(true);
        }
    }, 3000);
}


async function loadMyActivity() {
    const token = localStorage.getItem("token");
    const currentUserId = parseInt(localStorage.getItem("userId") || "0");
    const containerSales = document.getElementById("container-my-sales");
    const containerPurchases = document.getElementById("container-my-purchases");

    containerSales.innerHTML = "<p style='color: #6b7280;'>Consultando tus ventas...</p>";
    containerPurchases.innerHTML = "<p style='color: #6b7280;'>Consultando tus compras en el libro contable...</p>";

    try {
        const responseTransactions = await fetch(`${API_BASE}/Wallets/transactions`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!responseTransactions.ok) throw new Error("No se pudo obtener el historial contable.");

        const transactions = await responseTransactions.json();
        const purchaseTransactions = transactions.filter(t => t.auctionId !== null && t.auctionId !== undefined);

        if (purchaseTransactions.length === 0) {
            containerPurchases.innerHTML = "<p style='color: #6b7280;'>Aún no tenés movimientos registrados en el libro contable.</p>";
        } else {
            containerPurchases.innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                    ${purchaseTransactions.map(transaction => {
                const dateObj = new Date(transaction.date);
                const formattedDate = dateObj.toLocaleDateString() + " " + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                const transactionTypeUpper = (transaction.type || "").toUpperCase();

                const isIncome = transactionTypeUpper.includes("SALE") ||
                    transactionTypeUpper.includes("VENTA") ||
                    transactionTypeUpper.includes("CREDIT") ||
                    transactionTypeUpper.includes("DEPOSIT") ||
                    (transaction.amount > 0 && (transactionTypeUpper.includes("REWARD") || transactionTypeUpper.includes("GANANCIA")));

                const amountSign = isIncome ? "+" : "-";
                const amountColor = isIncome ? "#16a34a" : "#b43403";
                const absoluteAmount = Math.abs(Number(transaction.amount)).toFixed(2);

                return `
                            <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 0.85rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; background: #fafafa;">
                                <div>
                                    <strong>${transaction.auctionId ? `Subasta #${transaction.auctionId} - ` : ""}${transaction.auctionTitle || "Operación Contable"}</strong>
                                    <div style="font-size: 0.85rem; color: #6b7280;">Fecha: ${formattedDate} | Movimiento: ${transaction.type}</div>
                                </div>
                                <div style="font-size: 1.05rem; font-weight: 700; color: ${amountColor} !important;">
                                    ${amountSign}$${absoluteAmount}
                                </div>
                            </div>
                        `;
            }).join("")}
                </div>
            `;
        }

        const responseAuctions = await fetch(`${API_BASE}/Auctions`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        const auctionList = responseAuctions.ok ? await responseAuctions.json() : [];
        const auctionDetails = await Promise.all(
            auctionList.map(auction =>
                fetch(`${API_BASE}/Auctions/${auction.id}`, {
                    headers: { "Authorization": `Bearer ${token}` }
                }).then(r => r.ok ? r.json() : null).catch(() => null)
            )
        );

        const mySales = auctionList
            .map((auction, idx) => ({ ...auction, details: auctionDetails[idx] || {} }))
            .filter(item => item.details.sellerId === currentUserId);

        if (mySales.length === 0) {
            containerSales.innerHTML = "<p style='color: #6b7280;'>No tenés publicaciones activas registradas.</p>";
        } else {
            containerSales.innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                    ${mySales.map(sale => {
                const isFinished = sale.status === "FINALIZADA";
                const hasBids = sale.totalBids > 0;
                let statusText = "";
                let statusColor = "";

                if (!isFinished) {
                    statusText = `🟡 En curso`;
                    statusColor = "#854d0e";
                } else if (hasBids) {
                    statusText = `🟢 ¡VENDIDA! por $${Number(sale.currentPrice).toFixed(2)}`;
                    statusColor = "#166534";
                } else {
                    statusText = `⚪ Sin ofertas`;
                    statusColor = "#6b7280";
                }

                return `
                            <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 0.85rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; background: #fafafa;">
                                <div>
                                    <strong>#${sale.id} - ${sale.title}</strong>
                                    <div style="font-size: 0.85rem; color: #6b7280;">Precio inicial: $${Number(sale.details.startingPrice ?? sale.currentPrice).toFixed(2)}</div>
                                </div>
                                <div style="font-size: 0.95rem; font-weight: 700; color: ${statusColor};">
                                    ${statusText}
                                </div>
                            </div>
                        `;
            }).join("")}
                </div>
            `;
        }

    } catch (err) {
        containerSales.innerHTML = `<p class="error-msg">${err.message}</p>`;
        containerPurchases.innerHTML = `<p class="error-msg">${err.message}</p>`;
    }
}

function renderCategoryShowcase() {
    const container = document.getElementById("grid-categories");
    if (!container) return;

    container.innerHTML = "";

    CATEGORIES_CONFIG.forEach(category => {
        const card = document.createElement("div");
        card.className = "category-card";

        card.innerHTML = `
            <img src="${category.image}" alt="${category.name}" loading="lazy">
            <div class="category-card-overlay">
                <span class="category-card-title">${category.name}</span>
            </div>
        `;

        card.onclick = () => openCategoryView(category.id.toString(), category.name);
        container.appendChild(card);
    });
}

function openCategoryView(categoryId, categoryName) {
    selectedCategoryId = categoryId;
    activeSearchAuctionId = null;

    if (!categoryName) {
        const found = CATEGORIES_CONFIG.find(c => c.id.toString() === categoryId);
        categoryName = found ? found.name : "Subastas";
    }

    document.getElementById("view-categories").classList.add("hidden");
    document.getElementById("view-auctions").classList.remove("hidden");
    document.getElementById("active-category-title").textContent = `Categoría: ${categoryName}`;
    document.getElementById("filter-subtitle").textContent = categoryId === "" ? "Viendo todo el catálogo" : `ID Categoría: ${categoryId}`;

    loadAuctions(false);
}


async function loadWalletBalance() {
    const token = localStorage.getItem("token");
    const display = document.getElementById("wallet-display");
    if (!display || !token) return;

    try {
        const response = await fetch(`${API_BASE}/Wallets/me`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.ok) {
            const wallet = await response.json();
            display.textContent = `Saldo: $${Number(wallet.availableBalance ?? wallet.AvailableBalance).toFixed(2)}`;
        }
    } catch (err) {
        console.error("Error al obtener balance", err);
    }
}

async function loadAuctions(isSilent = false) {
    const token = localStorage.getItem("token");
    const currentUserId = parseInt(localStorage.getItem("userId") || "0");
    const grid = document.getElementById("grid-auctions");
    if (!grid || !token) return;

    try {
        let auctionList = [];

        if (activeSearchAuctionId !== null) {
            const responseDetail = await fetch(`${API_BASE}/Auctions/${activeSearchAuctionId}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!responseDetail.ok) {
                grid.innerHTML = `<p class="error-msg">No se encontró ninguna subasta con el ID #${activeSearchAuctionId}.</p>`;
                return;
            }

            const detail = await responseDetail.json();
            auctionList = [detail];
        } else {
            let requestUrl = `${API_BASE}/Auctions`;
            if (selectedCategoryId !== "") {
                requestUrl += `?categoryId=${selectedCategoryId}`;
            }

            const response = await fetch(requestUrl, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!response.ok) throw new Error("No se pudieron cargar las subastas");
            auctionList = await response.json();
        }

        auctionsCache = auctionList;

        const detailsList = await Promise.all(
            auctionList.map(auction =>
                fetch(`${API_BASE}/Auctions/${auction.id}`, {
                    headers: { "Authorization": `Bearer ${token}` }
                }).then(r => r.ok ? r.json() : null).catch(() => null)
            )
        );

        const existingCards = grid.querySelectorAll(".auction-card");
        if (isSilent && existingCards.length === auctionList.length && auctionList.length > 0) {
            auctionList.forEach((auction, index) => {
                const details = detailsList[index];
                if (!details) return;

                const currentPrice = Number(details.currentPrice ?? auction.currentPrice);
                const minimumIncrement = Number(details.minimumIncrement ?? 1);
                const hasBids = (auction.totalBids > 0);

                const nextBidRequired = hasBids
                    ? (currentPrice + minimumIncrement)
                    : Number(details.startingPrice ?? auction.currentPrice);

                const priceElement = document.getElementById(`price-${auction.id}`);
                const minElement = document.getElementById(`min-${auction.id}`);
                const inputBid = document.getElementById(`bid-input-${auction.id}`);

                if (priceElement) priceElement.textContent = `$${currentPrice.toFixed(2)}`;
                if (minElement) minElement.textContent = `$${minimumIncrement.toFixed(2)}`;

                if (inputBid && document.activeElement !== inputBid) {
                    inputBid.placeholder = "Ingresar monto";
                    inputBid.min = nextBidRequired.toFixed(2);
                }
            });
            return;
        }

        grid.innerHTML = "";

        if (auctionList.length === 0) {
            grid.innerHTML = "<p>No hay subastas activas en esta categoría actualmente.</p>";
            return;
        }

        auctionList.forEach((auction, index) => {
            const details = detailsList[index] || {};
            const startingPrice = Number(details.startingPrice ?? auction.currentPrice);
            const currentPrice = Number(details.currentPrice ?? auction.currentPrice);
            const minimumIncrement = Number(details.minimumIncrement ?? 1);
            const hasBids = (auction.totalBids > 0);

            const imageUrl = details.imageUrl || details.ImageUrl || auction.imageUrl || auction.ImageUrl || "";

            const nextBidRequired = hasBids
                ? (currentPrice + minimumIncrement).toFixed(2)
                : startingPrice.toFixed(2);

            const isSeller = (details.sellerId === currentUserId);
            const isActive = auction.status === "ACTIVA";

            const card = document.createElement("div");
            card.className = "card auction-card";
            card.style.padding = "0";
            card.style.overflow = "hidden";

            card.innerHTML = `
                ${imageUrl ? `
                  <div style="width: 100%; height: 180px; background-color: #e5e7eb; overflow: hidden; position: relative;">
                    <img src="${imageUrl}" alt="${auction.title}" style="width: 100%; height: 100%; object-fit: cover; display: block;" onerror="this.parentElement.style.display='none';">
                  </div>
                ` : ''}

                <div style="padding: 1.25rem; display: flex; flex-direction: column; justify-content: space-between; flex-grow: 1;">
                  <div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <span class="status-tag status-${auction.status}">${auction.status}</span>
                      <span style="font-size: 0.8rem; color: #6b7280;">ID #${auction.id} • ${details.categoryName || auction.categoryName || "General"}</span>
                    </div>

                    <h3 style="margin: 0.75rem 0 0.2rem;">${auction.title}</h3>
                   
                    <div>
                      <span id="timer-${auction.id}" class="auction-timer timer-green">Calculando...</span>
                    </div>

                    <hr style="margin: 0.5rem 0 0.8rem; border: none; border-top: 1px solid #f3f4f6;" />
                   
                    <p><strong>Precio publicado:</strong> $${startingPrice.toFixed(2)}</p>
                   
                    <p style="font-size: 1.05rem; margin: 0.2rem 0;">
                      <strong>Puja actual:</strong>
                      <span id="price-${auction.id}" style="color: #1d4ed8; font-weight: bold;">$${currentPrice.toFixed(2)}</span>
                    </p>

                    <p style="margin-bottom: 0.2rem;">
                      <strong>Mínimo de puja:</strong>
                      <span id="min-${auction.id}" style="color: #047857; font-weight: 600;">$${minimumIncrement.toFixed(2)}</span>
                    </p>
                  </div>

                  ${isSeller ? `
                    <div style="margin-top: 1.2rem; background: #eff6ff; padding: 0.6rem; border-radius: 6px; text-align: center; border: 1px solid #bfdbfe;">
                      <span style="color: #1e40af; font-size: 0.85rem; font-weight: 600;">Esta es tu subasta (no podés ofertar)</span>
                    </div>
                  ` : isActive ? `
                    <div style="margin-top: 1.2rem;">
                      <input type="number" step="0.01" id="bid-input-${auction.id}" min="${nextBidRequired}" placeholder="Ingresar monto" style="margin-bottom: 0.5rem;">
                      <button class="btn btn-primary btn-block btn-bid" data-id="${auction.id}">Pujar</button>
                    </div>
                  ` : '<p style="color: #9ca3af; margin-top: 1.2rem; font-size: 0.9rem;">Subasta cerrada para ofertas.</p>'}
                </div>
            `;
            grid.appendChild(card);
        });

        grid.querySelectorAll(".btn-bid").forEach(btn => {
            btn.onclick = () => placeBid(parseInt(btn.dataset.id));
        });

        updateLocalTimers();

    } catch (err) {
        if (!isSilent) {
            grid.innerHTML = `<p class="error-msg">${err.message}</p>`;
        }
    }
}

async function placeBid(auctionId) {
    const token = localStorage.getItem("token");
    const input = document.getElementById(`bid-input-${auctionId}`);
    const amount = parseFloat(input.value);

    if (!amount || isNaN(amount)) {
        alert("Ingresá un monto válido.");
        return;
    }

    try {
        const responseAuction = await fetch(`${API_BASE}/Auctions/${auctionId}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const currentAuction = await responseAuction.json();
        const currentVersion = currentAuction.version ?? 0;

        const responseBid = await fetch(`${API_BASE}/Auctions/${auctionId}/bids`, {
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

        if (!responseBid.ok) {
            const errorRaw = await responseBid.text();
            let errorMessage = "";

            try {
                const errorJson = JSON.parse(errorRaw);
                errorMessage = errorJson.message
                    || errorJson.detail
                    || errorJson.title
                    || (errorJson.errors ? Object.values(errorJson.errors).flat().join("\n") : "");
            } catch {
                errorMessage = errorRaw;
            }

            alert(errorMessage || "No se pudo realizar la puja.");
            return;
        }

        alert("¡Puja realizada con éxito!");
        input.value = "";
        await loadWalletBalance();
        await loadAuctions(false);

    } catch (err) {
        alert("Error al comunicarse con el servidor.");
    }
}

function updateLocalTimers() {
    const now = new Date().getTime();

    auctionsCache.forEach(auction => {
        const timerElement = document.getElementById(`timer-${auction.id}`);
        if (!timerElement) return;

        if (auction.status === "FINALIZADA") {
            timerElement.textContent = "Finalizada";
            timerElement.className = "auction-timer timer-gray";
            return;
        }

        const endTime = new Date(auction.endDate).getTime();
        const distance = endTime - now;

        if (distance <= 0) {
            timerElement.textContent = "Finalizando...";
            timerElement.className = "auction-timer timer-gray";
            return;
        }

        const minutes = Math.floor(distance / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        const formattedRemaining = `${minutes}m ${seconds < 10 ? '0' : ''}${seconds}s`;

        if (distance <= 60000) {
            timerElement.className = "auction-timer timer-orange";
            timerElement.textContent = `⏳ ${formattedRemaining}`;
        } else if (distance <= 120000) {
            timerElement.className = "auction-timer timer-yellow";
            timerElement.textContent = `⏳ ${formattedRemaining}`;
        } else {
            timerElement.className = "auction-timer timer-green";
            timerElement.textContent = `⏳ ${formattedRemaining}`;
        }
    });
}

function preloadDateInputs() {
    const now = new Date();
    const end = new Date(now.getTime() + 15 * 60000);

    const toLocalIsoString = date => {
        const offset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() - offset).toISOString().slice(0, 16);
    };

    const startInput = document.getElementById("auc-start");
    const endInput = document.getElementById("auc-end");
    if (startInput && endInput) {
        startInput.value = toLocalIsoString(now);
        endInput.value = toLocalIsoString(end);
    }
}