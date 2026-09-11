const API_BASE = "https://localhost:7188/api";

document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("form-login")) {
        initAuthPage();
    } else if (document.getElementById("grid-categorias")) {
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

            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.message || data.title || "Usuario o contraseña inválidos");

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
            const res = await fetch(`${API_BASE}/Users/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password })
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.message || data.title || "Error al registrarse");

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

const CATEGORIAS_LISTA = [
    { id: "", nombre: "Todas", imagen: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400&auto=format&fit=crop&q=60" },
    { id: 1, nombre: "Vehículos", imagen: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&auto=format&fit=crop&q=60" },
    { id: 2, nombre: "Tecnología", imagen: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&auto=format&fit=crop&q=60" },
    { id: 3, nombre: "Hogar y Muebles", imagen: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&auto=format&fit=crop&q=60" },
    { id: 4, nombre: "Arte y Antigüedades", imagen: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=400&auto=format&fit=crop&q=60" },
    { id: 5, nombre: "Joyas y Relojes", imagen: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&auto=format&fit=crop&q=60" },
    { id: 6, nombre: "Moda y Accesorios", imagen: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&auto=format&fit=crop&q=60" },
    { id: 7, nombre: "Deportes y Fitness", imagen: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&auto=format&fit=crop&q=60" },
    { id: 8, nombre: "Inmuebles", imagen: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&auto=format&fit=crop&q=60" },
    { id: 9, nombre: "Otros", imagen: "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=400&auto=format&fit=crop&q=60" }
];

let subastasCache = [];
let categoriaSeleccionada = null;
let busquedaIdActiva = null;

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
        precargarFechas();
        boxAuction.classList.toggle("hidden");
    };
    document.getElementById("btn-cancel-auction").onclick = () => boxAuction.classList.add("hidden");

    document.getElementById("btn-toggle-activity").onclick = () => {
        boxRecharge.classList.add("hidden");
        boxAuction.classList.add("hidden");
        boxActivity.classList.toggle("hidden");
        if (!boxActivity.classList.contains("hidden")) {
            cargarMiActividad();
        }
    };
    document.getElementById("btn-cerrar-activity").onclick = () => boxActivity.classList.add("hidden");

    const tabPub = document.getElementById("tab-publicaciones");
    const tabComp = document.getElementById("tab-compras");
    const contPub = document.getElementById("contenedor-mis-publicaciones");
    const contComp = document.getElementById("contenedor-mis-compras");

    tabPub.onclick = () => {
        tabPub.className = "btn btn-primary";
        tabComp.className = "btn btn-outline";
        contPub.classList.remove("hidden");
        contComp.classList.add("hidden");
    };

    tabComp.onclick = () => {
        tabComp.className = "btn btn-primary";
        tabPub.className = "btn btn-outline";
        contComp.classList.remove("hidden");
        contPub.classList.add("hidden");
    };

    document.getElementById("btn-volver-categorias").onclick = () => {
        categoriaSeleccionada = null;
        busquedaIdActiva = null;
        document.getElementById("vista-subastas").classList.add("hidden");
        document.getElementById("vista-categorias").classList.remove("hidden");
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

        const catId = parseInt(document.getElementById("auc-category").value) || 1;

        const bodyData = {
            title: document.getElementById("auc-title").value.trim(),
            description: document.getElementById("auc-desc").value.trim(),
            imageUrl: document.getElementById("auc-image").value.trim(),
            startingPrice: parseFloat(document.getElementById("auc-price").value),
            minimumIncrement: parseFloat(document.getElementById("auc-increment").value),
            startDate: new Date(document.getElementById("auc-start").value).toISOString(),
            endDate: new Date(document.getElementById("auc-end").value).toISOString(),
            categoryId: catId
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

            abrirCategoria(catId.toString());
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
        const idVal = parseInt(inputSearch.value);
        if (!idVal || isNaN(idVal)) return;

        busquedaIdActiva = idVal;
        categoriaSeleccionada = "busqueda";

        document.getElementById("vista-categorias").classList.add("hidden");
        document.getElementById("vista-subastas").classList.remove("hidden");
        document.getElementById("titulo-categoria-activa").textContent = `Búsqueda por ID #${idVal}`;
        document.getElementById("subtitulo-filtro").textContent = "";

        cargarSubastas(false);
    };

    renderizarVitrinaCategorias();
    cargarBilletera();

    setInterval(actualizarCronometrosLocales, 1000);

    setInterval(() => {
        cargarBilletera();
        if (categoriaSeleccionada !== null && categoriaSeleccionada !== "busqueda") {
            cargarSubastas(true);
        }
    }, 3000);
}

async function cargarMiActividad() {
    const token = localStorage.getItem("token");
    const currentUserId = parseInt(localStorage.getItem("userId") || "0");
    const contPub = document.getElementById("contenedor-mis-publicaciones");
    const contComp = document.getElementById("contenedor-mis-compras");

    contPub.innerHTML = "<p style='color: #6b7280;'>Consultando tus ventas...</p>";
    contComp.innerHTML = "<p style='color: #6b7280;'>Consultando tus compras en el libro contable...</p>";

    try {
        const resTrans = await fetch(`${API_BASE}/Wallets/transactions`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!resTrans.ok) throw new Error("No se pudo obtener el historial contable.");

        const transactions = await resTrans.json();

        const compras = transactions.filter(t => t.auctionId !== null && t.auctionId !== undefined);

        if (compras.length === 0) {
            contComp.innerHTML = "<p style='color: #6b7280;'>Aún no tenés movimientos registrados en el libro contable.</p>";
        } else {
            contComp.innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                    ${compras.map(c => {
                const d = new Date(c.date);
                const fecha = d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                const tipoUpper = (c.type || "").toUpperCase();

                const esIngreso = tipoUpper.includes("SALE") ||
                    tipoUpper.includes("VENTA") ||
                    tipoUpper.includes("CREDIT") ||
                    tipoUpper.includes("DEPOSIT") ||
                    c.amount > 0 && (tipoUpper.includes("REWARD") || tipoUpper.includes("GANANCIA"));

                const signo = esIngreso ? "+" : "-";
                const colorMonto = esIngreso ? "#16a34a" : "#ea580c";
                const montoAbsoluto = Math.abs(Number(c.amount)).toFixed(2);

                return `
                            <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 0.85rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; background: #fafafa;">
                                <div>
                                    <strong>${c.auctionId ? `Subasta #${c.auctionId} - ` : ""}${c.auctionTitle || "Operación Contable"}</strong>
                                    <div style="font-size: 0.85rem; color: #6b7280;">Fecha: ${fecha} | Movimiento: ${c.type}</div>
                                </div>
                                <div style="font-size: 1.05rem; font-weight: 700; color: ${colorMonto};">
                                    ${signo}$${montoAbsoluto}
                                </div>
                            </div>
                        `;
            }).join("")}
                </div>
            `;
        }

        const resAuctions = await fetch(`${API_BASE}/Auctions`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        const listaAuctions = resAuctions.ok ? await resAuctions.json() : [];
        const detalles = await Promise.all(
            listaAuctions.map(a =>
                fetch(`${API_BASE}/Auctions/${a.id}`, {
                    headers: { "Authorization": `Bearer ${token}` }
                }).then(r => r.ok ? r.json() : null).catch(() => null)
            )
        );

        const misVentas = listaAuctions
            .map((a, i) => ({ ...a, det: detalles[i] || {} }))
            .filter(x => x.det.sellerId === currentUserId);

        if (misVentas.length === 0) {
            contPub.innerHTML = "<p style='color: #6b7280;'>No tenés publicaciones activas registradas.</p>";
        } else {
            contPub.innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                    ${misVentas.map(v => {
                const finalizada = v.status === "FINALIZADA";
                const tienePujas = v.totalBids > 0;
                let estado = "";
                let color = "";

                if (!finalizada) {
                    estado = `🟡 En curso`;
                    color = "#854d0e";
                } else if (tienePujas) {
                    estado = `🟢 ¡VENDIDA! por $${Number(v.currentPrice).toFixed(2)}`;
                    color = "#166534";
                } else {
                    estado = `⚪ Sin ofertas`;
                    color = "#6b7280";
                }

                return `
                            <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 0.85rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; background: #fafafa;">
                                <div>
                                    <strong>#${v.id} - ${v.title}</strong>
                                    <div style="font-size: 0.85rem; color: #6b7280;">Precio inicial: $${Number(v.det.startingPrice ?? v.currentPrice).toFixed(2)}</div>
                                </div>
                                <div style="font-size: 0.95rem; font-weight: 700; color: ${color};">
                                    ${estado}
                                </div>
                            </div>
                        `;
            }).join("")}
                </div>
            `;
        }

    } catch (err) {
        contPub.innerHTML = `<p class="error-msg">${err.message}</p>`;
        contComp.innerHTML = `<p class="error-msg">${err.message}</p>`;
    }
}

function renderizarVitrinaCategorias() {
    const contenedor = document.getElementById("grid-categorias");
    if (!contenedor) return;

    contenedor.innerHTML = "";

    CATEGORIAS_LISTA.forEach(cat => {
        const card = document.createElement("div");
        card.className = "category-card";

        card.innerHTML = `
            <img src="${cat.imagen}" alt="${cat.nombre}" loading="lazy">
            <div class="category-card-overlay">
                <span class="category-card-title">${cat.nombre}</span>
            </div>
        `;

        card.onclick = () => abrirCategoria(cat.id.toString(), cat.nombre);
        contenedor.appendChild(card);
    });
}

function abrirCategoria(catId, nombreCat) {
    categoriaSeleccionada = catId;
    busquedaIdActiva = null;

    if (!nombreCat) {
        const encontrada = CATEGORIAS_LISTA.find(c => c.id.toString() === catId);
        nombreCat = encontrada ? encontrada.nombre : "Subastas";
    }

    document.getElementById("vista-categorias").classList.add("hidden");
    document.getElementById("vista-subastas").classList.remove("hidden");
    document.getElementById("titulo-categoria-activa").textContent = `Categoría: ${nombreCat}`;
    document.getElementById("subtitulo-filtro").textContent = catId === "" ? "Viendo todo el catálogo" : `ID Categoría: ${catId}`;

    cargarSubastas(false);
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
            display.textContent = `Saldo: $${Number(w.availableBalance ?? w.AvailableBalance).toFixed(2)}`;
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
        let lista = [];

        if (busquedaIdActiva !== null) {
            const resDetalle = await fetch(`${API_BASE}/Auctions/${busquedaIdActiva}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!resDetalle.ok) {
                grid.innerHTML = `<p class="error-msg">No se encontró ninguna subasta con el ID #${busquedaIdActiva}.</p>`;
                return;
            }

            const detalle = await resDetalle.json();
            lista = [detalle];
        } else {
            let url = `${API_BASE}/Auctions`;
            if (categoriaSeleccionada !== "") {
                url += `?categoryId=${categoriaSeleccionada}`;
            }

            const res = await fetch(url, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!res.ok) throw new Error("No se pudieron cargar las subastas");
            lista = await res.json();
        }

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

                const currentPrice = Number(det.currentPrice ?? a.currentPrice);
                const minimumIncrement = Number(det.minimumIncrement ?? 1);
                const hasBids = (a.totalBids > 0);

                const nextBidRequired = hasBids
                    ? (currentPrice + minimumIncrement)
                    : Number(det.startingPrice ?? a.currentPrice);

                const elPrice = document.getElementById(`price-${a.id}`);
                const elMin = document.getElementById(`min-${a.id}`);
                const inputBid = document.getElementById(`monto-${a.id}`);

                if (elPrice) elPrice.textContent = `$${currentPrice.toFixed(2)}`;
                if (elMin) elMin.textContent = `$${minimumIncrement.toFixed(2)}`;

                if (inputBid && document.activeElement !== inputBid) {
                    inputBid.placeholder = "Ingresar monto: ";
                    inputBid.min = nextBidRequired.toFixed(2);
                }
            });
            return;
        }

        grid.innerHTML = "";

        if (lista.length === 0) {
            grid.innerHTML = "<p>No hay subastas activas en esta categoría actualmente.</p>";
            return;
        }

        lista.forEach((a, index) => {
            const det = detalles[index] || {};
            const startingPrice = Number(det.startingPrice ?? a.currentPrice);
            const currentPrice = Number(det.currentPrice ?? a.currentPrice);
            const minimumIncrement = Number(det.minimumIncrement ?? 1);
            const hasBids = (a.totalBids > 0);

            const fotoUrl = det.imageUrl || det.ImageUrl || a.imageUrl || a.ImageUrl || "";

            const nextBidRequired = hasBids
                ? (currentPrice + minimumIncrement).toFixed(2)
                : startingPrice.toFixed(2);

            const esCreador = (det.sellerId === currentUserId);
            const activa = a.status === "ACTIVA";

            const card = document.createElement("div");
            card.className = "card auction-card";
            card.style.padding = "0";
            card.style.overflow = "hidden";

            card.innerHTML = `
                ${fotoUrl ? `
                  <div style="width: 100%; height: 180px; background-color: #e5e7eb; overflow: hidden; position: relative;">
                    <img src="${fotoUrl}" alt="${a.title}" style="width: 100%; height: 100%; object-fit: cover; display: block;" onerror="this.parentElement.style.display='none';">
                  </div>
                ` : ''}

                <div style="padding: 1.25rem; display: flex; flex-direction: column; justify-content: space-between; flex-grow: 1;">
                  <div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                      <span class="status-tag status-${a.status}">${a.status}</span>
                      <span style="font-size: 0.8rem; color: #6b7280;">ID #${a.id} • ${det.categoryName || a.categoryName || "General"}</span>
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
                      <input type="number" step="0.01" id="monto-${a.id}" min="${nextBidRequired}" placeholder="Ingresar monto" style="margin-bottom: 0.5rem;">
                      <button class="btn btn-primary btn-block btn-bid" data-id="${a.id}">Pujar</button>
                    </div>
                  ` : '<p style="color: #9ca3af; margin-top: 1.2rem; font-size: 0.9rem;">Subasta cerrada para ofertas.</p>'}
                </div>
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

        if (!res.ok) {
            const errorRaw = await res.text();
            let mensajeError = "";

            try {
                const errorJson = JSON.parse(errorRaw);
                mensajeError = errorJson.message
                    || errorJson.detail
                    || errorJson.title
                    || (errorJson.errors ? Object.values(errorJson.errors).flat().join("\n") : "");
            } catch {
                mensajeError = errorRaw;
            }

            alert(mensajeError || "No se pudo realizar la puja.");
            return;
        }

        alert("¡Puja realizada con éxito!");
        input.value = "";
        await cargarBilletera();
        await cargarSubastas(false);

    } catch (err) {
        alert("Error al comunicarse con el servidor.");
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