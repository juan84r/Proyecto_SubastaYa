# SubastaYa - Plataforma de Subastas en Tiempo Real
Plataforma web de subastas en línea desarrollada con ASP.NET Core Web API en el backend y una interfaz de usuario 
ligera construida con Vanilla JavaScript, HTML5 y CSS3 (sin frameworks pesados). El sistema cuenta con control de 
saldos mediante billetera virtual integrada y garantiza la consistencia transaccional mediante Control de Concurrencia 
Optimista (OCC)

Paquetes NuGet Requeridos
Para la persistencia, migraciones y seguridad con tokens JWT, el proyecto requiere los siguientes paquetes en la 
capa de infraestructura / API:

# Entity Framework Core y Base de Datos (SQL Server)
dotnet add package Microsoft.EntityFrameworkCore
dotnet add package Microsoft.EntityFrameworkCore.SqlServer
dotnet add package Microsoft.EntityFrameworkCore.Design
dotnet add package Microsoft.EntityFrameworkCore.Tools

# Autenticación y Tokens JWT
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer
dotnet add package System.IdentityModel.Tokens.Jwt

# Documentación interactiva de API
dotnet add package Swashbuckle.AspNetCore

Comandos para Migraciones de Base de Datos

# Crear una nueva migración
dotnet ef migrations add InitialCreate

# Aplicar los cambios a la base de datos
dotnet ef database update

Configuración del Sistema
1. Variables de Entorno y appsettings.json
Asegurarse de tener configurada la cadena de conexión y los parámetros del token JWT:

{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=SubastaYaDb;Trusted_Connection=True;TrustServerCertificate=True;"
  },
  "Jwt": {
    "Key": "ClaveSecretaSuperSeguraParaFirmarLosTokensJWT2026!",
    "Issuer": "SubastaYa",
    "Audience": "SubastaYaApp",
    "ExpireMinutes": 120
  }
}

# Ejecución del Proyecto

# Restaurar dependencias
dotnet restore

# Compilar y levantar la API
dotnet run

Swagger UI: https://localhost:7188/swagger

Frontend: Servido vía IIS Express / Live Server en https://localhost:7077/ o directo abriendo index.html.

# Demostración de Control de Concurrencia Optimista (OCC)

¿Cómo funciona la protección contra condiciones de carrera?
En una plataforma de subastas, si dos usuarios intentan pujar exactamente al mismo tiempo sobre el mismo precio base, 
el sistema debe evitar que ambos ganen o que se sobreescriban los saldos sin control.

La entidad Auction posee una propiedad de control de versión (Version o RowVersion).

Cuando el cliente consulta la subasta, recibe el número de versión actual (ejemplo: version = 2).

Al emitir una puja, el cliente envía en el cuerpo de la petición expectedVersion: 2.

El backend evalúa la transacción:

El primer request que llega a la base de datos: Encuentra Version == 2, procesa la deducción de saldo, asigna al nuevo 
postor, incrementa la versión a 3 y responde con 200 OK.

El segundo request (concurrente): Intenta operar esperando la versión 2, pero el registro en base de datos ya mutó a 3. 
La condición de concurrencia falla, se aborta la transacción y se rechaza la operación inmediatamente con 409 Conflict, 
protegiendo la integridad del saldo y del ganador.

Script de Prueba de Concurrencia Simultánea
Este script utiliza Promise.all desde la consola del navegador para despachar dos ofertas de dos usuarios distintos en 
el mismo milisegundo exacto, demostrando cómo una petición triunfa y la otra es rechazada por colisión de versión.

Instrucciones de Ejecución:
Abrir la aplicación en el navegador y presionar F12 -> pestaña Console.

Si la consola muestra advertencias de pegado, tipear allow pasting y presionar Enter.

Copiar y ejecutar el siguiente script:

(async () => {
 
    const idSubasta = 1; // ID de una subasta ACTIVA
    const tokenUsuario1 = "PEGAR_AQUI_TOKEN_JWT_USUARIO_1";
    const tokenUsuario2 = "PEGAR_AQUI_TOKEN_JWT_USUARIO_2";

    console.log(`%c[TEST] Consultando estado inicial de Subasta #${idSubasta}...`, "color: #2563eb; font-weight: bold;");

    const resAuction = await fetch(`https://localhost:7188/api/Auctions/${idSubasta}`, {
        headers: { "Authorization": `Bearer ${tokenUsuario1}` }
    });

    if (!resAuction.ok) {
        console.error("No se pudo obtener la subasta especificada. Verifique que el ID exista y esté activa.");
        return;
    }

    const auction = await resAuction.json();
    const currentVersion = auction.version ?? 0;
    const currentPrice = Number(auction.currentPrice ?? auction.startingPrice);
    const minIncrement = Number(auction.minimumIncrement ?? 1);
    const bidAmount = currentPrice + minIncrement;

    console.log(`Subasta #${idSubasta} detectada | Versión actual: ${currentVersion} | Oferta calculada: $${bidAmount}`);
    console.log("%c[TEST] Despachando peticiones simultáneas en paralelo...", "color: #d97706; font-weight: bold;");

    const payload = {
        auctionId: idSubasta,
        amount: bidAmount,
        expectedVersion: currentVersion
    };

    const [resUsuario1, resUsuario2] = await Promise.all([
        fetch(`https://localhost:7188/api/Auctions/${idSubasta}/bids`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${tokenUsuario1}` },
            body: JSON.stringify(payload)
        }),
        fetch(`https://localhost:7188/api/Auctions/${idSubasta}/bids`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${tokenUsuario2}` },
            body: JSON.stringify(payload)
        })
    ]);

    const dataUsuario1 = await resUsuario1.json().catch(() => ({}));
    const dataUsuario2 = await resUsuario2.json().catch(() => ({}));

    console.log(`Respuesta Usuario 1 (HTTP ${resUsuario1.status}):`, dataUsuario1);
    console.log(`Respuesta Usuario 2 (HTTP ${resUsuario2.status}):`, dataUsuario2);

    if ((resUsuario1.ok && !resUsuario2.ok) || (!resUsuario1.ok && resUsuario2.ok)) {
        const ganador = resUsuario1.ok ? "Usuario 1" : "Usuario 2";
        const rechazado = resUsuario1.ok ? "Usuario 2" : "Usuario 1";
        console.log(`%c✔ DEMOSTRACIÓN EXITOSA: La oferta de ${ganador} fue aceptada (HTTP 200 OK) y la de ${rechazado} 
        fue rechazada por conflicto de versión (HTTP 409 Conflict).`, "color: #166534; font-weight: bold; font-size: 13px;");
    } else {
        console.warn(`Resultado: Usuario 1 finalizó con status ${resUsuario1.status} y Usuario 2 con status 
        ${resUsuario2.status}.`);
    }
})();

# Reglas de Negocio Implementadas

Integridad del Vendedor: Un usuario no puede participar ni emitir pujas en sus propias subastas (HTTP 409 - El 
vendedor no puede pujar en su propia subasta).

Liderazgo de Oferta: El postor con la mayor oferta actual tiene restringida la sobrepuja consecutiva sobre sí mismo 
(HTTP 409 - Ya sos el máximo postor en esta subasta).

Cierre y Transacciones: Al expirar el tiempo de la subasta, el estado transiciona a FINALIZADA y el libro contable de 
la billetera acredita automáticamente los fondos al vendedor y descuenta la reserva del comprador.

Refresco Reactivo Silencioso: El panel de usuario actualiza el saldo y estado de actividad cada 3 segundos comparando 
cambios en el DOM, evitando parpadeos visuales en la interfaz.