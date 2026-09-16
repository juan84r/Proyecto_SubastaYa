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
        const msg = document.getElementById("recharge-msg");
        if (msg) {
            msg.textContent = "";
            msg.className = "";
        }
        boxRecharge.classList.toggle("hidden");
    };
    document.getElementById("btn-cancel-recharge").onclick = () => boxRecharge.classList.add("hidden");

    document.getElementById("btn-toggle-auction").onclick = () => {
        boxRecharge.classList.add("hidden");
        boxActivity.classList.add("hidden");

        const msg = document.getElementById("auction-msg");
        if (msg) {
            msg.textContent = "";
            msg.className = "";
        }
        const form = document.getElementById("form-create-auction");
        if (form) form.reset();

        document.getElementById("auc-edit-id").value = "";
        const modalTitle = document.getElementById("auction-modal-title");
        if (modalTitle) modalTitle.textContent = "Publicar Nueva Subasta";

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
            setTimeout(() => {
                boxRecharge.classList.add("hidden");
                msg.textContent = "";
            }, 1200);
        } catch (err) {
            msg.className = "error-msg";
            msg.textContent = err.message;
        }
    };

    document.getElementById("form-create-auction").onsubmit = async (e) => {
        e.preventDefault();
        const msg = document.getElementById("auction-msg");
        msg.textContent = "Guardando...";
        msg.className = "";

        const startingPrice = parseFloat(document.getElementById("auc-price").value);
        const minimumIncrement = parseFloat(document.getElementById("auc-increment").value);

        if (isNaN(startingPrice) || startingPrice <= 0) {
            msg.className = "error-msg";
            msg.textContent = "El precio base no puede ser cero ni negativo.";
            return;
        }

        if (isNaN(minimumIncrement) || minimumIncrement <= 0) {
            msg.className = "error-msg";
            msg.textContent = "El incremento mínimo no puede ser cero ni negativo.";
            return;
        }

        const startVal = document.getElementById("auc-start").value;
        const endVal = document.getElementById("auc-end").value;
        const startDate = new Date(startVal);
        const endDate = new Date(endVal);

        if (endDate <= startDate) {
            msg.className = "error-msg";
            msg.textContent = "La fecha de fin debe ser posterior a la de inicio.";
            return;
        }

        const editId = document.getElementById("auc-edit-id").value;
        const isEditing = Boolean(editId);
        const categoryId = parseInt(document.getElementById("auc-category").value) || 1;

        const requestBody = {
            title: document.getElementById("auc-title").value.trim(),
            description: document.getElementById("auc-desc").value.trim(),
            imageUrl: document.getElementById("auc-image").value.trim(),
            startingPrice: startingPrice,
            minimumIncrement: minimumIncrement,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            categoryId: categoryId
        };

        const url = isEditing ? `${API_BASE}/Auctions/${editId}` : `${API_BASE}/Auctions`;
        const method = isEditing ? "PUT" : "POST";

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                let backendMsg = data.message || data.detail;

                if (!backendMsg && data.errors) {
                    const firstKey = Object.keys(data.errors)[0];
                    backendMsg = data.errors[firstKey][0];
                }

                throw new Error(backendMsg || "Error al procesar la subasta.");
            }

            msg.className = "success-msg";
            msg.textContent = isEditing ? "¡Subasta modificada!" : "¡Subasta creada!";
            document.getElementById("form-create-auction").reset();
            document.getElementById("auc-edit-id").value = "";

            const modalTitle = document.getElementById("auction-modal-title");
            if (modalTitle) modalTitle.textContent = "Publicar Nueva Subasta";

            loadAuctions(false);
            setTimeout(() => {
                boxAuction.classList.add("hidden");
                msg.textContent = "";
                msg.className = "";
            }, 1200);
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

        const boxActivity = document.getElementById("box-activity");
        if (boxActivity && !boxActivity.classList.contains("hidden")) {
            loadMyActivity(true);
        }
    }, 3000);
}

async function loadMyActivity(isSilent = false) {
    const token = localStorage.getItem("token");
    const currentUserId = parseInt(localStorage.getItem("userId") || "0");
    const containerSales = document.getElementById("container-my-sales");
    const containerPurchases = document.getElementById("container-my-purchases");

    if (!containerSales || !containerPurchases || !token) return;

    if (!isSilent && !containerSales.dataset.loaded) {
        containerSales.innerHTML = "<p style='color: #6b7280;'>Consultando tus ventas...</p>";
        containerPurchases.innerHTML = "<p style='color: #6b7280;'>Consultando tus compras en el libro contable...</p>";
    }

    try {
        const responseTransactions = await fetch(`${API_BASE}/Wallets/transactions`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (responseTransactions.ok) {
            const transactions = await responseTransactions.json();
            const purchaseTransactions = transactions.filter(t => t.auctionId !== null && t.auctionId !== undefined);

            let newPurchasesHtml = "";
            if (purchaseTransactions.length === 0) {
                newPurchasesHtml = "<p style='color: #6b7280;'>Aún no tenés movimientos registrados en el libro contable.</p>";
            } else {
                newPurchasesHtml = `
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

            if (containerPurchases.innerHTML.trim() !== newPurchasesHtml.trim()) {
                containerPurchases.innerHTML = newPurchasesHtml;
            }
        }

        const responseAuctions = await fetch(`${API_BASE}/Auctions`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        const list = responseAuctions.ok ? await responseAuctions.json() : [];

        const detailsList = await Promise.all(
            list.map(item =>
                fetch(`${API_BASE}/Auctions/${item.id}`, {
                    headers: { "Authorization": `Bearer ${token}` }
                }).then(r => r.ok ? r.json() : null).catch(() => null)
            )
        );

        const mySales = list
            .map((item, idx) => ({ ...item, details: detailsList[idx] || {} }))
            .filter(item => item.details.sellerId === currentUserId);

        let newSalesHtml = "";
        if (mySales.length === 0) {
            newSalesHtml = "<p style='color: #6b7280;'>No tenés publicaciones activas registradas.</p>";
        } else {
            const now = new Date().getTime();

            newSalesHtml = `
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                    ${mySales.map(sale => {
                const isFinished = sale.status === "FINALIZADA" || new Date(sale.endDate).getTime() <= now;

                return `
                    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 0.85rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; background: #fafafa;">
                        <div>
                            <strong>#${sale.id} - ${sale.title}</strong>
                            <div style="font-size: 0.85rem; color: #6b7280;">Precio inicial: $${Number(sale.details.startingPrice ?? sale.currentPrice).toFixed(2)}</div>
                        </div>
                        <div style="font-size: 0.95rem; font-weight: 700; color: ${isFinished ? '#166534' : '#854d0e'};">
                            ${isFinished ? '🟢 ¡Finalizada!' : '🟡 En curso'}
                        </div>
                    </div>
                `;
            }).join("")}
                </div>
            `;
        }

        if (containerSales.innerHTML.trim() !== newSalesHtml.trim()) {
            containerSales.innerHTML = newSalesHtml;
        }

        containerSales.dataset.loaded = "true";

    } catch (err) {
        if (!isSilent) {
            containerSales.innerHTML = `<p class="error-msg">${err.message}</p>`;
            containerPurchases.innerHTML = `<p class="error-msg">${err.message}</p>`;
        }
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

async function openEditAuction(id) {
    const token = localStorage.getItem("token");
    try {
        const res = await fetch(`${API_BASE}/Auctions/${id}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("No se pudo cargar la subasta.");
        const auc = await res.json();

        const msg = document.getElementById("auction-msg");
        if (msg) {
            msg.textContent = "";
            msg.className = "";
        }

        document.getElementById("auc-edit-id").value = auc.id;
        document.getElementById("auc-title").value = auc.title;
        document.getElementById("auc-desc").value = auc.description;
        document.getElementById("auc-image").value = auc.imageUrl || "";
        document.getElementById("auc-price").value = auc.startingPrice;
        document.getElementById("auc-increment").value = auc.minimumIncrement;
        document.getElementById("auc-category").value = auc.categoryId;

        const toLocalIso = d => {
            const date = new Date(d);
            const offset = date.getTimezoneOffset() * 60000;
            return new Date(date.getTime() - offset).toISOString().slice(0, 16);
        };

        document.getElementById("auc-start").value = toLocalIso(auc.startDate);
        document.getElementById("auc-end").value = toLocalIso(auc.endDate);

        const modalTitle = document.getElementById("auction-modal-title");
        if (modalTitle) modalTitle.textContent = `Modificar Subasta #${auc.id}`;

        const boxAuction = document.getElementById("box-auction");
        boxAuction.classList.remove("hidden");
        boxAuction.scrollIntoView({ behavior: "smooth" });
    } catch (e) {
        alert(e.message);
    }
}

async function deleteAuction(id) {
    if (!confirm(`¿Estás seguro de que querés eliminar la subasta #${id}?`)) return;

    const token = localStorage.getItem("token");
    try {
        const res = await fetch(`${API_BASE}/Auctions/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            alert(data.message || data.detail || "Error al eliminar la subasta.");
            return;
        }

        alert("Subasta eliminada exitosamente.");
        loadAuctions(false);
    } catch (err) {
        alert("Error de conexión: " + err.message);
    }
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

function renderAuctionSkeletons(container, count = 6) {
    container.innerHTML = Array(count).fill(`
        <div class="card auction-card" style="padding: 0; overflow: hidden; border: 1px solid #e5e7eb;">
            <div class="skeleton" style="width: 100%; height: 180px; border-bottom: 1px solid #e5e7eb;"></div>
            <div style="padding: 1.25rem; display: flex; flex-direction: column; gap: 0.8rem;">
                <div style="display: flex; justify-content: space-between;">
                    <div class="skeleton" style="width: 70px; height: 20px;"></div>
                    <div class="skeleton" style="width: 90px; height: 16px;"></div>
                </div>
                <div class="skeleton" style="width: 80%; height: 22px; margin-top: 0.3rem;"></div>
                <div class="skeleton" style="width: 100%; height: 14px;"></div>
                <div class="skeleton" style="width: 60%; height: 14px;"></div>
                <div style="margin-top: 1.2rem; display: flex; flex-direction: column; gap: 0.4rem;">
                    <div class="skeleton" style="width: 50%; height: 18px;"></div>
                    <div class="skeleton" style="width: 70%; height: 20px;"></div>
                    <div class="skeleton" style="width: 100%; height: 38px; border-radius: 6px; margin-top: 0.5rem;"></div>
                </div>
            </div>
        </div>
    `).join("");
}

async function loadAuctions(isSilent = false) {
    const token = localStorage.getItem("token");
    const currentUserId = parseInt(localStorage.getItem("userId") || "0");
    const grid = document.getElementById("grid-auctions");
    if (!grid || !token) return;

    if (!isSilent && grid.querySelectorAll(".auction-card").length === 0) {
        renderAuctionSkeletons(grid, 6);
    }

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

        const detailsList = await Promise.all(
            auctionList.map(auction =>
                fetch(`${API_BASE}/Auctions/${auction.id}`, {
                    headers: { "Authorization": `Bearer ${token}` }
                }).then(r => r.ok ? r.json() : null).catch(() => null)
            )
        );

        auctionsCache = auctionList.map((auc, idx) => ({
            ...auc,
            ...(detailsList[idx] || {})
        }));

        const existingCards = grid.querySelectorAll(".auction-card");

        const hasStatusChanged = auctionsCache.some(auction => {
            const currentBadge = grid.querySelector(`.auction-card:has(#price-${auction.id}) .status-tag`);
            return currentBadge && currentBadge.textContent.trim() !== auction.status;
        });

        if (!hasStatusChanged && isSilent && existingCards.length === auctionList.length && auctionList.length > 0) {
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
                const leaderElement = document.getElementById(`leader-${auction.id}`);
                const inputBid = document.getElementById(`bid-input-${auction.id}`);

                if (priceElement) priceElement.textContent = `$${currentPrice.toFixed(2)}`;
                if (minElement) minElement.textContent = `$${minimumIncrement.toFixed(2)}`;

                if (leaderElement) {
                    const leaderName = details.highestBidderName || details.HighestBidderName || auction.highestBidderName || auction.HighestBidderName;
                    leaderElement.textContent = leaderName ? `(Lidera: ${leaderName})` : "(Sin ofertas aún)";
                    leaderElement.style.color = leaderName ? "#2563eb" : "#9ca3af";
                }

                if (inputBid && document.activeElement !== inputBid) {
                    inputBid.placeholder = "Ingresar monto";
                    inputBid.min = nextBidRequired.toFixed(2);
                }
            });
            return;
        }

        grid.innerHTML = "";

        if (auctionList.length === 0) {
            grid.innerHTML = "<p>No hay subastas disponibles en esta categoría actualmente.</p>";
            return;
        }

        auctionList.forEach((auction, index) => {
            const details = detailsList[index] || {};
            const startingPrice = Number(details.startingPrice ?? auction.currentPrice);
            const currentPrice = Number(details.currentPrice ?? auction.currentPrice);
            const minimumIncrement = Number(details.minimumIncrement ?? 1);
            const hasBids = (auction.totalBids > 0);

            const rawImg = details.imageUrl || details.ImageUrl || auction.imageUrl || auction.ImageUrl || "";
            const hasValidImage = typeof rawImg === "string" && rawImg.trim() !== "" && rawImg.trim() !== "null" && rawImg.trim() !== "undefined";
            const imageUrl = hasValidImage ? rawImg.trim() : "";

            const leaderName = details.highestBidderName || details.HighestBidderName || auction.highestBidderName || auction.HighestBidderName || "";

            const nextBidRequired = hasBids
                ? (currentPrice + minimumIncrement).toFixed(2)
                : startingPrice.toFixed(2);

            const isSeller = (details.sellerId === currentUserId);
            const isActive = auction.status === "ACTIVA";
            const isScheduled = auction.status === "PROGRAMADA";

            const rawDescription = details.description || auction.description || "";
            const isLong = rawDescription.length > 65;
            const shortDescription = isLong ? rawDescription.substring(0, 65) + "..." : rawDescription;

            const card = document.createElement("div");
            card.className = "card auction-card";
            card.style.padding = "0";
            card.style.overflow = "hidden";

            card.innerHTML = `
                <div style="width: 100%; height: 180px; background-color: #f3f4f6; overflow: hidden; position: relative; border-bottom: 1px solid #e5e7eb; flex-shrink: 0;">
                  ${imageUrl ? `
                    <img src="${imageUrl}" alt="${auction.title}" style="width: 100%; height: 100%; object-fit: cover; display: block;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                  ` : ''}
                  <div style="display: ${imageUrl ? 'none' : 'flex'}; width: 100%; height: 100%; align-items: center; justify-content: center; flex-direction: column; gap: 0.35rem; color: #9ca3af; background-color: #f3f4f6;">
                    <span style="font-size: 2rem; line-height: 1;">📷</span>
                    <span style="font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280;">Sin Foto</span>
                  </div>
                </div>

                <div style="padding: 1.25rem; display: flex; flex-direction: column; flex-grow: 1;">
                  <!-- PARTE SUPERIOR: Textos variables -->
                  <div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <span class="status-tag status-${auction.status}">${auction.status}</span>
                      <span style="font-size: 0.8rem; color: #6b7280;">ID #${auction.id} • ${details.categoryName || auction.categoryName || "General"}</span>
                    </div>

                    <h3 style="margin: 0.75rem 0 0.25rem; font-size: 1.15rem; min-height: 1.4em;">${auction.title}</h3>

                    <!-- Bloque de Detalle / Descripción -->
                    <div style="margin-bottom: 0.8rem; font-size: 0.88rem; color: #4b5563; line-height: 1.35; min-height: 1.3em;">
                        <span id="desc-text-${auction.id}">${shortDescription}</span>
                        ${isLong ? `
                            <button type="button" class="btn-toggle-desc" data-id="${auction.id}" data-full="${encodeURIComponent(rawDescription)}" data-short="${encodeURIComponent(shortDescription)}" style="background: none; border: none; padding: 0; color: #2563eb; font-weight: 600; cursor: pointer; font-size: 0.82rem; margin-left: 4px;">Ver más</button>
                        ` : ''}
                    </div>
                  </div>

                  <!-- PARTE INFERIOR: Reloj, Precios y Acciones (ANCLADOS ABAJO) -->
                  <div style="margin-top: auto;">
                    <div style="margin-bottom: 0.4rem;">
                      <span id="timer-${auction.id}" class="auction-timer timer-green">Calculando...</span>
                    </div>

                    <hr style="margin: 0.5rem 0 0.8rem; border: none; border-top: 1px solid #f3f4f6;" />
                   
                    <p style="margin: 0.2rem 0; font-size: 0.9rem;"><strong>Precio publicado:</strong> $${startingPrice.toFixed(2)}</p>
                   
                    <p style="font-size: 1.05rem; margin: 0.2rem 0; display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap;">
                      <strong>Puja actual:</strong>
                      <span id="price-${auction.id}" style="color: #1d4ed8; font-weight: bold;">$${currentPrice.toFixed(2)}</span>
                      <span id="leader-${auction.id}" style="font-size: 0.83rem; font-weight: 600; color: ${leaderName ? '#2563eb' : '#9ca3af'};">
                        ${leaderName ? `(Lidera: ${leaderName})` : '(Sin ofertas aún)'}
                      </span>
                    </p>

                    <p style="margin: 0.2rem 0 0.5rem;">
                      <strong>Mínimo de puja:</strong>
                      <span id="min-${auction.id}" style="color: #047857; font-weight: 600;">$${minimumIncrement.toFixed(2)}</span>
                    </p>

                    ${isSeller ? `
                      <div style="margin-top: 0.8rem; display: flex; flex-direction: column; gap: 0.5rem;">
                         <div style="background: #eff6ff; padding: 0.4rem; border-radius: 6px; text-align: center; border: 1px solid #bfdbfe;">
                          <span style="color: #1e40af; font-size: 0.8rem; font-weight: 600;">Esta es tu publicación</span>
                         </div>
                      <div id="seller-actions-${auction.id}">
                      ${isScheduled ? `
                        <div style="display: flex; gap: 0.5rem;">
                            <button class="btn btn-block btn-edit-auction" data-id="${auction.id}" style="background-color: #eab308; color: #000; font-weight: 600; padding: 0.4rem; font-size: 0.85rem;">✏️ Modificar</button>
                            <button class="btn btn-block btn-delete-auction" data-id="${auction.id}" style="background-color: #c2410c; color: #fff; font-weight: 600; padding: 0.4rem; font-size: 0.85rem;">🗑️ Eliminar</button>
                        </div>
                      ` : `
                        <div style="display: flex; gap: 0.5rem;">
                            <button disabled style="background-color: #d1d5db; color: #6b7280; font-weight: 600; padding: 0.4rem; font-size: 0.85rem; border: none; border-radius: 4px; width: 100%; cursor: not-allowed;" title="No modificable mientras esté activa">✏️ Modificar</button>
                            <button disabled style="background-color: #d1d5db; color: #6b7280; font-weight: 600; padding: 0.4rem; font-size: 0.85rem; border: none; border-radius: 4px; width: 100%; cursor: not-allowed;" title="No eliminable mientras esté activa">🗑️ Eliminar</button>
                        </div>
                      `}
                      </div>
                    </div>
                    ` : isScheduled ? `
                      <div style="margin-top: 0.8rem; background: #fefce8; padding: 0.6rem; border-radius: 6px; text-align: center; border: 1px solid #fde047;">
                        <span style="color: #854d0e; font-size: 0.85rem; font-weight: 600;">⏳ Próximamente (Aún no iniciada)</span>
                      </div>
                    ` : isActive ? `
                      <div style="margin-top: 0.8rem;">
                        <input type="number" step="0.01" id="bid-input-${auction.id}" min="${nextBidRequired}" placeholder="Ingresar monto" style="margin-bottom: 0.5rem;">
                        <button class="btn btn-primary btn-block btn-bid" data-id="${auction.id}">Pujar</button>
                      </div>
                    ` : '<p style="color: #9ca3af; margin-top: 0.8rem; font-size: 0.9rem;">Subasta cerrada para ofertas.</p>'}
                  </div>
                </div>
            `;
            grid.appendChild(card);
        });

        grid.querySelectorAll(".btn-toggle-desc").forEach(btn => {
            btn.onclick = () => {
                const id = btn.dataset.id;
                const textSpan = document.getElementById(`desc-text-${id}`);
                const isExpanded = btn.dataset.expanded === "true";

                if (isExpanded) {
                    textSpan.textContent = decodeURIComponent(btn.dataset.short);
                    btn.textContent = "Ver más";
                    btn.dataset.expanded = "false";
                } else {
                    textSpan.textContent = decodeURIComponent(btn.dataset.full);
                    btn.textContent = "Ver menos";
                    btn.dataset.expanded = "true";
                }
            };
        });

        grid.querySelectorAll(".btn-bid").forEach(btn => {
            btn.onclick = () => placeBid(parseInt(btn.dataset.id));
        });

        grid.querySelectorAll(".btn-edit-auction").forEach(btn => {
            btn.onclick = () => openEditAuction(parseInt(btn.dataset.id));
        });

        grid.querySelectorAll(".btn-delete-auction").forEach(btn => {
            btn.onclick = () => deleteAuction(parseInt(btn.dataset.id));
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
    if (!token || !input) return;

    const amount = parseFloat(input.value);
    if (isNaN(amount) || amount <= 0) {
        alert("Por favor, ingresá un monto válido.");
        return;
    }

    const currentAuction = auctionsCache.find(a => a.id === auctionId);
    const expectedVersion = currentAuction ? currentAuction.version : 1;

    try {
        const response = await fetch(`${API_BASE}/Auctions/${auctionId}/bids`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                auctionId: auctionId,
                amount: amount,
                expectedVersion: expectedVersion
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || errorData.title || "No se pudo registrar la oferta.");
        }

        input.value = "";
        await loadAuctions(false);

    } catch (err) {
        alert(err.message);
    }
}

function updateLocalTimers() {
    const now = Date.now();

    auctionsCache.forEach(auction => {
        const timerElement = document.getElementById(`timer-${auction.id}`);
        const actionsContainer = document.getElementById(`seller-actions-${auction.id}`);
        if (!timerElement) return;

        if (auction.status === "FINALIZADA") {
            timerElement.textContent = "Finalizada";
            timerElement.className = "auction-timer timer-gray";
            return;
        }

        const rawStart = auction.startDate || auction.StartDate;
        const rawEnd = auction.endDate || auction.EndDate;

        if (auction.status === "PROGRAMADA") {
            if (!rawStart) {
                timerElement.textContent = "Próximamente";
                return;
            }

            const startTime = new Date(rawStart).getTime();
            if (isNaN(startTime)) {
                timerElement.textContent = "Próximamente";
                return;
            }

            const distanceToStart = startTime - now;

            if (distanceToStart <= 0) {
                timerElement.textContent = "¡Iniciando ahora!";
                timerElement.className = "auction-timer timer-green";

                if (actionsContainer && !actionsContainer.dataset.locked) {
                    actionsContainer.dataset.locked = "true";
                    actionsContainer.innerHTML = `
                        <div style="display: flex; gap: 0.5rem;">
                            <button disabled style="background-color: #d1d5db; color: #6b7280; font-weight: 600; padding: 0.4rem; font-size: 0.85rem; border: none; border-radius: 4px; width: 100%; cursor: not-allowed;" title="No modificable (subasta en curso)">✏️ Modificar</button>
                            <button disabled style="background-color: #d1d5db; color: #6b7280; font-weight: 600; padding: 0.4rem; font-size: 0.85rem; border: none; border-radius: 4px; width: 100%; cursor: not-allowed;" title="No eliminable (subasta en curso)">🗑️ Eliminar</button>
                        </div>
                    `;
                }
                return;
            }

            const minutes = Math.floor(distanceToStart / (1000 * 60));
            const seconds = Math.floor((distanceToStart % (1000 * 60)) / 1000);
            timerElement.textContent = `Inicia en: ${minutes}m ${seconds < 10 ? '0' : ''}${seconds}s`;
            timerElement.className = "auction-timer timer-yellow";
            return;
        }

        if (!rawEnd) {
            timerElement.textContent = "En curso";
            return;
        }

        const endTime = new Date(rawEnd).getTime();
        if (isNaN(endTime)) {
            timerElement.textContent = "En curso";
            return;
        }

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
        } else if (distance <= 120000) {
            timerElement.className = "auction-timer timer-yellow";
        } else {
            timerElement.className = "auction-timer timer-green";
        }
        timerElement.textContent = `⏳ ${formattedRemaining}`;
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