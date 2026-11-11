// Demo de pedidos Mamá Gallina (MTG). Todo corre en el navegador: no hay servidor ni pagos reales.
// Las pestañas del mismo navegador se sincronizan con localStorage + BroadcastChannel.
"use strict";

const CLAVE = "mg-demo-v1";
const $ = (s) => document.querySelector(s);
const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const B = (n) => "B/. " + Number(n).toFixed(2);
const ahora = () => new Date().toLocaleTimeString("es-PA", { hour: "2-digit", minute: "2-digit", hour12: false });
const platoPor = (id) => PLATOS.find((p) => p.id === id);
const catPor = (id) => CATEGORIAS.find((c) => c.id === id);

function leer(store, k, def) { try { const v = store.getItem(k); return v ? JSON.parse(v) : def; } catch (e) { return def; } }
function guardarEn(store, k, v) { try { store.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento: la demo sigue en memoria */ } }

// Pestaña actual (para saber cuáles pedidos son "míos")
let TAB = leer(sessionStorage, CLAVE + "-tab", null);
if (!TAB) { TAB = Math.random().toString(36).slice(2, 9); guardarEn(sessionStorage, CLAVE + "-tab", TAB); }

// ───────── Datos compartidos (pedidos, agotados, cupo)
function semilla() {
  const t = Date.now(), min = 60000;
  const o = (n, fonda, nombre, estado, canal, pago, platos, extra = {}) => ({
    n, fonda, nombre, estado, canal, pago, hora: extra.hora || "12:00", platos,
    total: platos.reduce((a, p) => a + p.precio, 0), creado: t - (extra.hace || 20) * min, ...extra });
  const p = (persona, nombre, precio, desc = "") => ({ persona, nombre, precio, desc });
  return {
    next: 47, cupo: 12, agotados: ["lechona", "pargo"],
    pedidos: [
      o(41, "Obarrio", "Oficina BG", "entregado", "Web", "Tarjeta", [p("Luis", "Pollo guisado", 3.5), p("Marta", "Carne asada", 6.0), p("Iván", "Sopa de pollo", 3.5), p("Rita", "Pescado frito en presa", 6.5), p("Todos", "4 jugos naturales", 6.0), p("Todos", "Flan de la casa", 2.5), p("Todos", "Arroz con leche", 2.0), p("Todos", "Cocada", 1.0)], { hace: 22 }),
      o(42, "Obarrio", "Marta", "entregado", "WhatsApp", "Yappy", [p("Marta", "Chuleta de cerdo guisada", 5.75), p("Marta", "Bistec entero encebollado", 5.5), p("Marta", "Jugo natural", 1.25)], { hace: 18 }),
      o(43, "Obarrio", "Pedro", "entregado", "Web", "Yappy", [p("Pedro", "Pollo guisado", 3.5), p("Pedro", "Sopa de pollo con arroz", 3.5)], { hace: 15 }),
      o(44, "Obarrio", "Luz", "listo", "Web", "Yappy", [p("Luz", "Guacho de rabito", 4.25)], { hace: 12 }),
      o(45, "Obarrio", "Elena", "cocina", "WhatsApp", "Yappy", [p("Elena", "Carne guisada", 4.0, "Comida completa")], { hace: 9 }),
      o(46, "Obarrio", "Raúl", "cocina", "Web", "Tarjeta", [p("Raúl", "Chuleta de cerdo guisada", 5.75), p("Raúl", "Jugo natural", 1.5)], { hace: 6, hora: "12:15" }),
      { n: null, id: "chat-rosa", fonda: "Obarrio", nombre: "Rosa M.", estado: "nuevo", canal: "Chat", texto: "Mándame 2 sopas de pata con arroz", creado: t - 6 * min, platos: [], total: 0 },
      { n: null, id: "chat-pedro", fonda: "Obarrio", nombre: "Pedro", estado: "nuevo", canal: "Chat", texto: "¿Hay lechona hoy?", atiende: "Yeni", creado: t - 2 * min, platos: [], total: 0 },
      o(201, "Vía España", "Carlos", "cocina", "Web", "Yappy", [p("Carlos", "Pollo apanado", 4.75)], { hace: 5 }),
      o(202, "Vía España", "Oficina Torre", "pagado", "Web", "Tarjeta", [p("Ana", "Lengua a la criolla", 6.0), p("Beto", "Sopa de costilla", 4.25)], { hace: 2, hora: "12:30" }),
    ],
  };
}
let D = leer(localStorage, CLAVE, null) || semilla();
const canal = ("BroadcastChannel" in window) ? new BroadcastChannel(CLAVE) : null;
function guardar() { guardarEn(localStorage, CLAVE, D); if (canal) canal.postMessage("cambio"); alCambiar(); }
if (canal) canal.onmessage = () => { D = leer(localStorage, CLAVE, D); alCambiar(); };
window.addEventListener("storage", (e) => { if (e.key === CLAVE) { D = leer(localStorage, CLAVE, D); alCambiar(); } });

// ───────── Estado del teléfono (por pestaña)
const S = Object.assign({
  pantalla: "chat", fonda: null, chat: [], cat: null, busca: "",
  editando: null, carrito: [], hora: "12:15", pago: "Yappy", ruc: false,
  mios: [], avisados: {}, vista: "cliente", mgTab: "kommo", mgFonda: "Obarrio", auto: false,
}, leer(sessionStorage, CLAVE + "-tel", {}));
S.escribiendo = false;
function guardarTel() { const c = { ...S }; delete c.escribiendo; guardarEn(sessionStorage, CLAVE + "-tel", c); }

// ───────── Chat
function msg(de, html, extra = {}) { S.chat.push({ de, html, t: ahora(), ...extra }); guardarTel(); }
function bot(html, extra = {}, espera = 750) {
  S.escribiendo = true; pintarTel();
  setTimeout(() => {
    S.escribiendo = false; msg("in", html, extra);
    if (S.pantalla !== "chat") avisoTel(html); pintarTel();
  }, espera);
}
function enlaceMenu() {
  return { html: `<div class="prev"><div class="img"></div><div class="tx"><b>Menú de hoy · ${esc(S.fonda)}</b><span>pidemamagallina.com</span></div></div>Arme su pedido aquí, plato por plato, y pague en línea. Cuando termine, vuelve a este chat con su número. 🧾`,
    botones: [{ txt: "🍽 Ver menú y pedir", act: "abrir-menu" }] };
}
function enviar(texto) {
  texto = texto.trim(); if (!texto) return;
  msg("out", esc(texto));
  const pareceGracias = /gracias|voy|ok|listo|dale|perfecto/i.test(texto) && texto.length < 30;
  if (!S.fonda) {
    bot("¡Hola! 👋 Bienvenido a Mamá Gallina.\n¿En cuál fonda va a retirar?", { botones: [{ txt: "📍 Obarrio", act: "fonda", arg: "Obarrio" }, { txt: "📍 Vía España", act: "fonda", arg: "Vía España" }] });
  } else if (pareceGracias) {
    bot("¡A la orden! 🙌");
  } else {
    // Lo que escriba queda como tarjeta en Kommo para que una muchacha lo vea
    D.pedidos.push({ n: null, id: "chat-" + Date.now(), fonda: S.fonda, nombre: "Usted (demo)", estado: "nuevo", canal: "Chat", texto, creado: Date.now(), platos: [], total: 0, tab: TAB });
    guardar();
    const e = enlaceMenu();
    bot("¡Recibido! Para que le salga el precio exacto y no tenga que esperar la cotización, arme su pedido aquí 👇\n" + e.html, { botones: e.botones });
  }
  pintarTel();
}

// ───────── Precios del plato que se está armando
function precioEdit(ed) {
  const pl = platoPor(ed.id); let p = pl.precio; const partes = [];
  gruposDe(pl).forEach((g) => {
    const sel = ed.sel[g.id];
    if (g.tipo === "radio") { const op = g.ops[sel ?? 0]; p += op.p; if ((sel ?? 0) > 0 || g.id === "ens") partes.push(op.n); }
    else (sel || []).forEach((i) => { p += g.ops[i].p; partes.push((g.ops[i].p ? "+ " : "") + g.ops[i].n.toLowerCase()); });
  });
  if (pl.tipo === "sopa" && (ed.sel.arroz ?? 0) === 0) partes.unshift("Sin arroz");
  return { precio: Math.round(p * 100) / 100, desc: partes.join(" · ") };
}
const totalCarrito = () => S.carrito.reduce((a, c) => a + c.precio, 0);

// ───────── Pantallas del teléfono
function vistaChat() {
  const mensajes = S.chat.map((m, i) => {
    let h = `<div class="m ${m.de}">${m.html}<div class="t">${m.t}${m.de === "out" ? " ✓✓" : ""}</div></div>`;
    if (m.botones) h += `<div class="wbtns">${m.botones.map((b) => `<button class="wbtn" data-act="${b.act}" data-arg="${esc(b.arg || "")}" ${b.usado ? "disabled" : ""} data-msg="${i}">${b.txt}</button>`).join("")}</div>`;
    return h;
  }).join("");
  const sugs = !S.fonda
    ? ["Buenas, quiero pedir 4 almuerzos para la oficina", "¿Qué hay de almuerzo hoy?"]
    : ["Mándame 2 sopas de pollo con arroz", "Gracias, voy bajando"];
  return `<div class="estado" style="background:var(--wa);color:#fff"><span>${ahora()}</span><span>●●● 5G</span></div>
  <div class="wh"><span style="font-size:20px">‹</span><div class="av">MG</div><div><b>Mamá Gallina</b><small>${S.escribiendo ? "escribiendo…" : "Cuenta de empresa · en línea"}</small></div></div>
  <div class="scroll" id="chat-scroll"><div class="wa"><div class="dia">HOY</div>${mensajes}${S.escribiendo ? '<div class="m in escribiendo">escribiendo…</div>' : ""}</div></div>
  <div class="sugs">${sugs.map((s) => `<button data-act="sug" data-arg="${esc(s)}">${esc(s)}</button>`).join("")}</div>
  <form class="escribir" data-form="chat"><input id="chat-in" placeholder="Mensaje" autocomplete="off"><button type="submit" aria-label="Enviar">➤</button></form>`;
}

function imgDe(x, cls = "img") {
  return x.foto ? `<div class="${cls}" style="background-image:url(${x.foto})"></div>` : `<div class="${cls}" style="background-color:${x.color || "#f6efe6"}">${x.emoji || "🍽️"}</div>`;
}
function itemHTML(p) {
  const ag = D.agotados.includes(p.id);
  const precio = p.tipo === "sopa" ? "desde " + B(p.precio) : B(p.precio);
  return `<button class="item ${ag ? "agotado" : ""}" ${ag ? "" : `data-act="plato" data-arg="${p.id}"`}>${imgDe(p)}<div class="tx">${ag ? '<span class="pill gris">AGOTADO HOY</span>' : p.top ? '<span class="pill">⭐ FAVORITO</span>' : ""}<b>${esc(p.nombre)}</b>${esc(p.desc)}<div class="p">${precio}</div></div></button>`;
}
function listaMenu() {
  const q = S.busca.trim().toLowerCase();
  if (q) {
    const r = PLATOS.filter((p) => (p.nombre + " " + p.desc).toLowerCase().includes(q));
    return `<div class="sub">${r.length} resultado${r.length === 1 ? "" : "s"}</div>` + (r.map(itemHTML).join("") || '<div class="vacio">No encontramos ese plato hoy.</div>');
  }
  if (!S.cat) {
    return `<div class="sub">Categorías</div><div class="cats">${CATEGORIAS.map((c) => `<button class="cat" data-act="cat" data-arg="${c.id}">${imgDe(c)}${esc(c.nombre)}</button>`).join("")}</div>
      <div class="sub">Lo más pedido hoy</div>${PLATOS.filter((p) => p.top).map(itemHTML).join("")}`;
  }
  const c = catPor(S.cat);
  return `<div class="chips"><button data-act="cat" data-arg="">Inicio</button>${CATEGORIAS.map((x) => `<button class="${x.id === S.cat ? "on" : ""}" data-act="cat" data-arg="${x.id}">${esc(x.nombre)}</button>`).join("")}</div>
    ${c.nota ? `<div class="nota-cat">${esc(c.nota)}${c.id === "completa" ? " · Arroz especial B/. 1.00 adicional" : ""}</div>` : ""}
    ${PLATOS.filter((p) => p.cat === S.cat).map(itemHTML).join("")}`;
}
function barraCarrito() {
  if (!S.carrito.length) return "";
  const n = S.carrito.length;
  return `<button class="carr" data-act="ver-carrito"><span>🛒 ${n} plato${n === 1 ? "" : "s"} · ${B(totalCarrito())}</span><span>Ver pedido</span></button>`;
}
function vistaMenu() {
  return `<div class="estado" style="background:var(--rojo);color:#fff"><span>${ahora()}</span><span>●●● 5G</span></div>
  <div class="mtop"><div class="r"><button class="volver" data-act="ir" data-arg="chat">‹ WhatsApp</button><span class="loc">📍 ${esc(S.fonda)} · retiro</span></div>
    <div class="marca">MAMÁ GALLINA</div><h1>¿Qué le provoca hoy?</h1></div>
  <div class="busca"><input id="busca" placeholder="🔍 Buscar: sopa, pollo, patacón…" value="${esc(S.busca)}" autocomplete="off"></div>
  <div class="scroll" id="menu-scroll"><div id="menu-lista">${listaMenu()}</div><div class="espacio"></div></div>
  ${barraCarrito()}`;
}
function vistaPlato() {
  const ed = S.editando, pl = platoPor(ed.id), { precio } = precioEdit(ed);
  const num = S.carrito.length + 1;
  const grupos = gruposDe(pl).map((g) => {
    const ops = g.ops.map((op, i) => {
      const on = g.tipo === "radio" ? (ed.sel[g.id] ?? 0) === i : (ed.sel[g.id] || []).includes(i);
      const pr = op.nota || (op.p ? "+ " + B(op.p) : "incluido");
      return `<button class="op ${on ? "on" : ""}" data-act="op" data-arg="${g.id}:${i}"><span class="${g.tipo === "radio" ? "r" : "c"}">${g.tipo === "check" && on ? "✓" : ""}</span>${esc(op.n)}<span class="pr">${pr}</span></button>`;
    }).join("");
    return `<div class="sec"><h4><span>${g.titulo}</span>${g.tipo === "radio" ? "<em>Elija 1</em>" : ""}</h4>${ops}</div>`;
  }).join("");
  return `<div class="scroll">${imgDe(pl, "hero").replace('class="hero"', 'class="hero"').replace("</div>", '<button class="x" data-act="ir" data-arg="menu" aria-label="Cerrar">✕</button></div>')}
    <div style="padding:8px 16px 0"><div style="font-size:21px;font-weight:800">${esc(pl.nombre)}</div><div style="font-size:12.5px;color:var(--gris)">${esc(pl.desc)} · <b style="color:var(--tinta)">${B(pl.precio)}</b></div></div>
    <div class="sec"><h4>¿PARA QUIÉN ES? (PLATO ${num})</h4><input class="nombre-in" id="persona" placeholder="Ej.: Ana" value="${esc(ed.persona)}" maxlength="24" autocomplete="off"></div>
    ${grupos}<div class="espacio"></div></div>
    <button class="barra" data-act="agregar"><span id="lbl-agregar">Agregar plato de ${esc(ed.persona || "…")}</span><span id="precio-agregar">${B(precio)}</span></button>`;
}
function vistaCarrito() {
  const lista = S.carrito.map((c, i) => {
    const pl = platoPor(c.id);
    return `<div class="pl">${pl.foto ? `<div class="f" style="background-image:url(${pl.foto})"></div>` : `<div class="f">${pl.emoji || "🍽️"}</div>`}<div class="t"><b>${esc(c.persona)}</b> · ${esc(pl.nombre)}<small>${esc(c.desc || pl.desc)}</small></div><b>${c.precio.toFixed(2)}</b><button class="q" data-act="quitar" data-arg="${i}" aria-label="Quitar">✕</button></div>`;
  }).join("") || '<div class="vacio">Todavía no hay platos.</div>';
  const horas = ["12:00", "12:15", "12:30", "12:45"].map((h) => h === "12:00"
    ? `<span class="hora lleno" title="Cupo lleno">${h}</span>` : `<button class="hora ${S.hora === h ? "on" : ""}" data-act="hora" data-arg="${h}">${h}</button>`).join("");
  const n = S.carrito.length;
  return `<div class="estado"><span>${ahora()}</span><span>●●● 5G</span></div>
  <div class="cab-simple"><button class="v" data-act="ir" data-arg="menu">← Seguir pidiendo</button><h2>${n > 1 ? "Pedido de la oficina" : "Su pedido"}</h2></div>
  <div class="scroll">
    <div class="sec"><h4>${n} PLATO${n === 1 ? "" : "S"} · CADA UNO CON SU NOMBRE</h4>${lista}<button class="op" data-act="ir" data-arg="menu" style="color:var(--rojo);font-weight:700;border:none">+ Agregar otro plato</button></div>
    <div class="sec"><h4>¿POSTRE PARA LA OFICINA?</h4><div class="sug2"><button data-act="postre" data-arg="flan">+ Flan de la casa<br>${B(2.5)}</button><button data-act="postre" data-arg="arroz-leche">+ Arroz con leche<br>${B(2)}</button></div></div>
    <div class="sec"><h4>RETIRA EN ${esc(S.fonda || "").toUpperCase()} · ¿A QUÉ HORA PASA?</h4><div class="horas">${horas}</div><div style="font-size:11.5px;color:var(--gris);margin-top:6px">Las 12:00 ya están llenas: así la cocina no se satura.</div></div>
    <div class="sec"><h4>PAGO · BANCO GENERAL</h4><div class="pago"><button class="${S.pago === "Yappy" ? "on" : ""}" data-act="pago" data-arg="Yappy">Yappy</button><button class="${S.pago === "Tarjeta" ? "on" : ""}" data-act="pago" data-arg="Tarjeta">Visa / Mastercard</button></div>
      <button class="fila" data-act="ruc" style="width:100%"><span>Factura con RUC de la empresa</span><span class="sw ${S.ruc ? "on" : ""}"></span></button></div>
    <div class="sec"><div class="total"><span>Total (se suma solo)</span><b>${B(totalCarrito())}</b></div></div>
    <div class="espacio"></div></div>
  <button class="barra" data-act="pagar" ${n ? "" : "disabled"}><span>Pagar</span><span>${B(totalCarrito())}</span></button>`;
}
function vistaPago() {
  const total = B(totalCarrito());
  if (S.procesando) return `<div class="estado"><span>${ahora()}</span><span>●●● 5G</span></div><div class="pago-sim"><div class="spinner"></div><h2>Confirmando el pago…</h2><p>Simulación: no se cobra nada.</p></div>`;
  if (S.pago === "Yappy") return `<div class="estado"><span>${ahora()}</span><span>●●● 5G</span></div>
    <div class="pago-sim"><div class="logo" style="background:#1d4fd8">Y</div><h2>Pagar con Yappy</h2><div class="monto">${total}</div>
    <p>Comercio: Mamá Gallina ${esc(S.fonda)}<br>Banco General · pago amarrado a su pedido</p>
    <p style="font-size:12.5px;background:#fff4d6;color:#7a5600;padding:8px 10px;border-radius:10px">Simulación: aquí se abriría la app de Yappy en su celular para confirmar.</p>
    <button class="btn-grande" data-act="confirmar-pago">Confirmar pago</button><button class="btn-grande gris" data-act="ir" data-arg="carrito">Volver</button></div>`;
  return `<div class="estado"><span>${ahora()}</span><span>●●● 5G</span></div>
    <div class="pago-sim"><h2>Pago con tarjeta</h2><p>Botón de Pago del Banco General</p><div class="monto">${total}</div>
    <div class="tarjeta-demo"><small>TARJETA DE DEMOSTRACIÓN</small>VISA&nbsp;&nbsp;•••• •••• •••• 4242<br><span style="font-size:12px;opacity:.8">No escriba datos reales: esto es una simulación</span></div>
    <button class="btn-grande" data-act="confirmar-pago">Pagar ${total}</button><button class="btn-grande gris" data-act="ir" data-arg="carrito">Volver</button></div>`;
}
const ETAPAS = [["pagado", "Pagado"], ["cocina", "En cocina"], ["listo", "Listo"], ["entregado", "Entregado"]];
function lineaEstado(estado) {
  const k = ETAPAS.findIndex((e) => e[0] === estado);
  return `<div class="lin">${ETAPAS.map((e, i) => `${i ? `<i class="${i <= k ? "on" : ""}"></i>` : ""}<b class="${i <= k ? "on" : ""}">${e[1]}</b>`).join("")}</div>`;
}
function vistaListo() {
  const p = D.pedidos.find((x) => x.n === S.ultimo);
  if (!p) { S.pantalla = "chat"; return vistaChat(); }
  return `<div class="estado"><span>${ahora()}</span><span>●●● 5G</span></div><div class="scroll">
    <div class="ok"><div class="ck">✓</div><h2>¡Pagado con ${p.pago === "Yappy" ? "Yappy" : "tarjeta"}!</h2><p>${B(p.total)} · ${p.platos.length} plato${p.platos.length === 1 ? "" : "s"} · Banco General</p></div>
    <div class="num"><small>SU NÚMERO DE RETIRO</small><div>#${String(p.n).padStart(3, "0")}</div><span>${esc(p.fonda)} · ${p.hora} · Ventanilla express</span></div>
    <div class="sec" style="margin:10px 16px 0"><h4>ESTADO DE SU PEDIDO (SE ACTUALIZA SOLO)</h4>${lineaEstado(p.estado)}</div>
    <div style="padding:0 16px"><button class="btn-grande verde" data-act="ir" data-arg="chat">💬 Volver a WhatsApp</button></div>
    <div style="text-align:center;font-size:12px;color:var(--gris);margin:6px 24px 0">El resumen ya le llegó al chat de Mamá Gallina.</div>
    <button class="fac" data-act="recibo" data-arg="${p.n}"><span>🧾 Comprobante del pedido</span><b>Ver</b></button>
    ${p.ruc ? '<div class="fac"><span>🏢 Factura con RUC</span><b style="color:var(--verde)">Se envía al correo</b></div>' : ""}
    <button class="fac" data-act="nuevo-pedido"><span>↻ Hacer otro pedido</span><b>Empezar</b></button><div class="espacio"></div></div>`;
}

function pintarTel() {
  const v = { chat: vistaChat, menu: vistaMenu, plato: vistaPlato, carrito: vistaCarrito, pago: vistaPago, listo: vistaListo }[S.pantalla] || vistaChat;
  const scrollMenu = $("#menu-scroll") ? $("#menu-scroll").scrollTop : 0;
  $("#tel").innerHTML = v();
  if (S.pantalla === "chat") { const sc = $("#chat-scroll"); if (sc) sc.scrollTop = sc.scrollHeight; }
  if (S.pantalla === "menu" && $("#menu-scroll") && S.mantenerScroll) $("#menu-scroll").scrollTop = scrollMenu;
  S.mantenerScroll = false;
}
let avisoTimer = null;
function avisoTel(html) {
  const tmp = document.createElement("div"); tmp.innerHTML = html;
  const txt = tmp.textContent.trim().slice(0, 90);
  clearTimeout(avisoTimer);
  const el = document.createElement("button"); el.className = "aviso"; el.dataset.act = "ir"; el.dataset.arg = "chat";
  el.innerHTML = `<span class="av">✆</span><span><b>Mamá Gallina</b><br>${esc(txt)}</span>`;
  const marco = $(".telefono");
  marco.querySelectorAll(".aviso").forEach((a) => a.remove());
  marco.appendChild(el);
  avisoTimer = setTimeout(() => el.remove(), 5000);
}

// ───────── Lado Mamá Gallina
const MG_TABS = [["kommo", "Kommo"], ["cocina", "Cocina"], ["tv", "Pantalla de listos"], ["menu", "Menú del día"], ["guia", "Cómo probar"]];
const COLS = [["nuevo", "NUEVO · SIN PAGAR", "#c90d20"], ["porpagar", "POR PAGAR", "#e8a400"], ["pagado", "PAGADO", "#3867b1"], ["cocina", "EN COCINA", "#4d92cf"], ["listo", "LISTO", "#61a05f"], ["entregado", "ENTREGADO", "#9ca2a2"]];
const delaFonda = () => D.pedidos.filter((p) => p.fonda === S.mgFonda);
const numTxt = (p) => p.n ? "#" + String(p.n).padStart(3, "0") : "";
const minutos = (p) => Math.max(0, Math.floor((Date.now() - p.creado) / 60000));
const nombreCorto = (p) => p.platos.length > 1 ? `${p.nombre} · ${p.platos.length} platos` : p.nombre;

function filtroFonda() {
  return ["Obarrio", "Vía España"].map((f) => `<button class="${S.mgFonda === f ? "on" : ""}" data-act="mg-fonda" data-arg="${f}">${f}</button>`).join("");
}
function vistaKommo() {
  const lista = delaFonda();
  const vendidos = lista.filter((p) => p.n && p.estado !== "porpagar");
  const cols = COLS.map(([id, tit, color]) => {
    const cards = lista.filter((p) => p.estado === id).sort((a, b) => b.creado - a.creado).map((p) => {
      if (p.estado === "nuevo") {
        const m = minutos(p), alerta = m >= 5 && !p.atiende;
        return `<button class="kcard ${alerta ? "alerta" : ""} ${p.tab === TAB && p.fresco ? "nuevo-llego" : ""}" data-act="ver-chat" data-arg="${p.id}"><b>${esc(p.nombre)} · chat</b><span class="g">"${esc(p.texto)}"</span>${alerta ? `<span class="tag tg-r">⚠ ${m} min sin respuesta</span>` : p.atiende ? `<span class="tag tg-y">Lo atiende ${esc(p.atiende)}</span>` : `<span class="tag tg-a">Nuevo · hace ${m} min</span>`}</button>`;
      }
      const tags = p.estado === "porpagar" ? '<span class="tag tg-y">Esperando pago</span>'
        : `<span class="tag tg-v">${esc(p.pago)} ✓</span><span class="tag tg-a">${esc(p.canal)}</span>`;
      const extra = p.estado === "cocina" ? `<span class="tag tg-a">⏱ ${minutos(p)} min</span>` : p.estado === "listo" ? '<span class="tag tg-v">Aviso enviado</span>' : "";
      return `<button class="kcard ${p.estado === "entregado" ? "tenue" : ""} ${p.fresco ? "nuevo-llego" : ""}" data-act="ver-pedido" data-arg="${p.n}"><b>${numTxt(p)} ${esc(nombreCorto(p))}</b><span class="g">${p.platos.slice(0, 2).map((x) => esc(x.nombre)).join(", ")}${p.platos.length > 2 ? "…" : ""} · ${p.hora}</span><b style="display:inline">${B(p.total)}</b><br>${tags}${extra}</button>`;
    }).join("");
    const n = lista.filter((p) => p.estado === id).length;
    return `<div class="kcol"><h4 style="border-color:${color}"><span>${tit}</span><span>${n}</span></h4>${cards}</div>`;
  }).join("");
  return `<div class="mg-bar"><h3>Kommo · Embudo «Pedidos»</h3><div class="f">${filtroFonda()}<span>${vendidos.length} pedidos · ${B(vendidos.reduce((a, p) => a + p.total, 0))}</span></div></div>
    <div class="kommo"><div class="kcols">${cols}</div></div>`;
}
function vistaCocina() {
  const lista = delaFonda().filter((p) => p.n);
  const tk = (p) => {
    const urg = p.estado === "pagado";
    const items = p.platos.map((x) => `<li><b>${esc(x.persona)}</b>${esc(x.nombre)}${x.desc ? `<small>${esc(x.desc)}</small>` : ""}</li>`).join("");
    const bots = p.estado === "pagado" ? `${p.platos.length > 1 ? `<button class="b az" data-act="etiquetas" data-arg="${p.n}">🏷 ${p.platos.length} etiquetas</button>` : ""}<button class="b" data-act="estado" data-arg="${p.n}:cocina">Empezar</button>`
      : p.estado === "cocina" ? `<button class="b" data-act="estado" data-arg="${p.n}:listo">Marcar listo</button>`
      : `<button class="b" data-act="estado" data-arg="${p.n}:entregado">Entregado</button>`;
    return `<div class="tk ${urg ? "urg" : p.estado === "listo" ? "ok" : ""}"><div class="h"><span>${numTxt(p)} ${esc(nombreCorto(p))}</span><span>${p.estado === "cocina" ? "⏱ " + minutos(p) + " min" : p.estado === "listo" ? "✓" : p.hora}</span></div><div class="m">${esc(p.canal)} · ${esc(p.pago)} pagado</div><ul>${items}</ul><div class="bots">${bots}</div></div>`;
  };
  const col = (est, tit) => { const l = lista.filter((p) => p.estado === est).sort((a, b) => a.hora.localeCompare(b.hora)); return `<div class="ccol"><h4><span>${tit}</span><span>${l.length}</span></h4>${l.map(tk).join("") || '<div class="vacio-osc">Nada por ahora</div>'}</div>`; };
  return `<div class="mg-bar"><h3>Tablet de cocina</h3><div class="f">${filtroFonda()}</div></div>
    <div class="cocina"><div class="top"><h3>🍳 Cocina · ${esc(S.mgFonda)}</h3><div class="r"><span>Ordenado por hora de retiro</span><button class="auto" data-act="auto"><span class="sw ${S.auto ? "on" : ""}"></span>Simular cocina sola</button></div></div>
    <div class="ccols">${col("pagado", "NUEVOS · PAGADOS")}${col("cocina", "EN PREPARACIÓN")}${col("listo", "LISTOS")}</div></div>`;
}
function vistaTV() {
  const lista = delaFonda().filter((p) => p.n);
  const prep = lista.filter((p) => p.estado === "pagado" || p.estado === "cocina").sort((a, b) => a.n - b.n);
  const listos = lista.filter((p) => p.estado === "listo").sort((a, b) => b.n - a.n);
  const fila = (p, cls = "") => `<div class="n ${cls}">${numTxt(p)} <small>${esc(nombreCorto(p))}</small></div>`;
  return `<div class="mg-bar"><h3>Pantalla de pedidos listos (TV en la ventanilla)</h3><div class="f">${filtroFonda()}</div></div>
    <div class="tv"><div class="s"><div class="izq"><h4>EN PREPARACIÓN</h4>${prep.map((p) => fila(p)).join("") || '<div class="pie">—</div>'}</div>
    <div class="der"><h4>✓ LISTOS · RETIRE AQUÍ</h4>${listos.map((p) => fila(p, p.tab === TAB ? "llego" : "")).join("") || '<div class="pie">Todavía no hay pedidos listos.</div>'}<div class="pie">Ya está pagado: diga su número en la ventanilla express y llévese su pedido.</div></div></div></div>`;
}
function vistaPanelMenu() {
  const grupos = CATEGORIAS.map((c) => `<div class="grupo"><h5>${esc(c.nombre)}</h5>${PLATOS.filter((p) => p.cat === c.id).map((p) => {
    const off = D.agotados.includes(p.id);
    return `<button class="pm ${off ? "off" : ""}" data-act="agotar" data-arg="${p.id}"><span>${esc(p.nombre)} · ${p.precio.toFixed(2)}</span><span class="sw ${off ? "" : "on"}"></span></button>`;
  }).join("")}</div>`).join("");
  return `<div class="mg-bar"><h3>Menú del día (celular de la encargada)</h3><div class="f">${filtroFonda()}<button data-act="copiar-menu">📋 Copiar menú de ayer</button></div></div>
    <div class="panel-menu"><p style="font-size:13.5px;color:var(--gris)">Lo que apague aquí sale como <b>AGOTADO</b> en el menú del cliente al instante. Pruebe apagar el pollo guisado y mire el teléfono.</p>
    <div class="cupo" style="margin-top:10px"><span>Pedidos que acepta la cocina cada 15 minutos:</span><button data-act="cupo" data-arg="-1">−</button><b>${D.cupo}</b><button data-act="cupo" data-arg="1">+</button></div>
    <div class="pm-cols">${grupos}</div></div>`;
}
function vistaGuia() {
  return `<div class="guia"><h3>Cómo probar la demo</h3><ol>
    <li>En el teléfono, toque <b>"Buenas, quiero pedir 4 almuerzos para la oficina"</b> (o escriba lo que quiera).</li>
    <li>Escoja la fonda y toque <b>Ver menú y pedir</b>.</li>
    <li>Arme varios platos, cada uno con un nombre distinto (Ana, Carlos…). Mire cómo cambia el precio con el arroz especial o el jugo.</li>
    <li>En <b>Ver pedido</b>, escoja la hora y la forma de pago, y toque <b>Pagar</b>. El pago es simulado.</li>
    <li>Fíjese en <b>Kommo</b>: el pedido aparece solo en la columna <b>Pagado</b>.</li>
    <li>En <b>Cocina</b>, toque <b>Empezar</b> y después <b>Marcar listo</b>. Al cliente le llegan los mensajes en el mismo chat y el número sale en la <b>Pantalla de listos</b>.</li>
    <li>Escriba en el chat un pedido suelto, como "Mándame 2 sopas de pollo con arroz": queda como tarjeta <b>Nuevo · sin pagar</b> en Kommo, y el bot le contesta con el enlace.</li>
    <li>En <b>Menú del día</b>, apague un plato y vea que sale agotado en el teléfono.</li></ol>
    <div class="caja">Si no quiere tocar la cocina, active <b>Simular cocina sola</b> en la pestaña Cocina y el pedido avanza solo.</div>
    <div class="caja">Es una simulación: no hay servidor, no se cobra nada y lo que se haga queda solo en este navegador. Para empezar de cero, toque <b>Reiniciar demo</b> arriba.</div></div>`;
}
function pintarMG() {
  $("#mg-tabs").innerHTML = MG_TABS.map(([id, t]) => `<button class="${S.mgTab === id ? "on" : ""}" data-act="mg-tab" data-arg="${id}">${t}</button>`).join("");
  const v = { kommo: vistaKommo, cocina: vistaCocina, tv: vistaTV, menu: vistaPanelMenu, guia: vistaGuia }[S.mgTab] || vistaKommo;
  const sc = $(".kommo") ? $(".kommo").scrollLeft : 0;
  $("#mg").innerHTML = v();
  if ($(".kommo")) $(".kommo").scrollLeft = sc;
}
let toastTimer = null;
function toastMG(t) { const el = $("#toast-mg"); el.textContent = t; el.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => (el.hidden = true), 3500); }

function modal(html) { const m = $("#modal"); m.innerHTML = `<div class="caja-m">${html}</div>`; m.hidden = false; }
function cerrarModal() { $("#modal").hidden = true; }

// ───────── Cambios de estado y avisos al cliente
function cambiarEstado(n, estado) {
  const p = D.pedidos.find((x) => x.n === n); if (!p) return;
  p.estado = estado; p.creado = estado === "cocina" ? Date.now() : p.creado; p.fresco = false;
  guardar();
}
function alCambiar() {
  // Mensajes de WhatsApp para los pedidos hechos desde este teléfono
  D.pedidos.filter((p) => p.n && p.tab === TAB).forEach((p) => {
    const ya = S.avisados[p.n];
    if (ya === p.estado) return;
    S.avisados[p.n] = p.estado;
    const num = numTxt(p);
    if (p.estado === "cocina") bot(`👨‍🍳 Su pedido ${num} ya está en la cocina.`, {}, 300);
    if (p.estado === "listo") bot(`🔔 <b>¡Pedido ${num} listo!</b> Pase a la ventanilla express y diga su número. Ya está pagado.`, {}, 300);
    if (p.estado === "entregado") bot("¡Gracias por pedir en Mamá Gallina! ¿Cómo estuvo su almuerzo? ⭐⭐⭐⭐⭐", {}, 300);
  });
  guardarTel(); pintarMG(); if (S.pantalla === "listo") pintarTel();
}

function crearPedido() {
  const n = D.next++;
  const platos = S.carrito.map((c) => ({ persona: c.persona, nombre: platoPor(c.id).nombre, precio: c.precio, desc: c.desc }));
  const nombre = S.carrito.length > 1 ? "Oficina · " + S.carrito[0].persona : S.carrito[0].persona;
  // El chat suelto de esta persona se une al pedido pagado
  D.pedidos = D.pedidos.filter((p) => !(p.estado === "nuevo" && p.tab === TAB));
  D.pedidos.push({ n, fonda: S.fonda, nombre, estado: "pagado", canal: "Web", pago: S.pago, hora: S.hora, platos, total: totalCarrito(), creado: Date.now(), tab: TAB, fresco: true, ruc: S.ruc });
  S.avisados[n] = "pagado"; S.ultimo = n; S.mios.push(n);
  const lineas = platos.map((p) => `• ${esc(p.persona)}: ${esc(p.nombre)}${p.desc ? ", " + esc(p.desc.toLowerCase()) : ""}`).join("\n");
  msg("in", `✅ <b>Pedido #${String(n).padStart(3, "0")} pagado</b> · ${B(totalCarrito())}\n${lineas}\n📍 Retira ${S.hora} en ${esc(S.fonda)}, ventanilla express`);
  S.carrito = []; S.pantalla = "listo";
  guardar(); toastMG(`Nuevo pedido #${String(n).padStart(3, "0")} pagado: entró solo a Kommo y a la cocina.`);
  setTimeout(() => { const p = D.pedidos.find((x) => x.n === n); if (p && p.fresco) { p.fresco = false; guardarEn(localStorage, CLAVE, D); } }, 4000);
}

// Cocina automática
setInterval(() => {
  if (!S.auto) return;
  const p = D.pedidos.filter((x) => x.n && x.tab === TAB && ["pagado", "cocina"].includes(x.estado)).sort((a, b) => a.n - b.n)[0];
  if (!p) return;
  const espera = p.estado === "pagado" ? 5000 : 9000;
  if (Date.now() - (p.ultimoCambio || p.creado) > espera) { p.ultimoCambio = Date.now(); cambiarEstado(p.n, p.estado === "pagado" ? "cocina" : "listo"); }
}, 1500);
setInterval(() => { if (S.mgTab === "kommo" || S.mgTab === "cocina") pintarMG(); }, 20000);

// ───────── Eventos
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-act]"); if (!b) { if (e.target.id === "modal") cerrarModal(); return; }
  const act = b.dataset.act, arg = b.dataset.arg;
  switch (act) {
    case "vista": S.vista = arg; $("#escenario").dataset.vista = arg; document.querySelectorAll(".tabs-movil button").forEach((x) => x.classList.toggle("on", x.dataset.arg === arg)); guardarTel(); return;
    case "reiniciar": if (confirm("¿Borrar todo y empezar la demo de cero?")) { try { localStorage.removeItem(CLAVE); sessionStorage.removeItem(CLAVE + "-tel"); } catch (x) {} location.reload(); } return;
    case "sug": enviar(arg); return;
    case "fonda": {
      const m = S.chat[+b.dataset.msg]; if (m) m.botones.forEach((x) => (x.usado = true));
      S.fonda = arg; msg("out", "📍 " + esc(arg)); const en = enlaceMenu(); bot(en.html, { botones: en.botones }); S.mgFonda = arg; pintarMG(); return;
    }
    case "abrir-menu": S.pantalla = "menu"; S.cat = null; S.busca = ""; break;
    case "ir": S.pantalla = arg; if (arg === "menu") S.mantenerScroll = false; break;
    case "cat": S.cat = arg || null; S.busca = ""; break;
    case "plato": S.editando = { id: arg, persona: "", sel: {} }; S.pantalla = "plato"; break;
    case "op": {
      const [g, i] = arg.split(":"); const pl = platoPor(S.editando.id); const grupo = gruposDe(pl).find((x) => x.id === g);
      if (grupo.tipo === "radio") S.editando.sel[g] = +i;
      else { const s = new Set(S.editando.sel[g] || []); s.has(+i) ? s.delete(+i) : s.add(+i); S.editando.sel[g] = [...s]; }
      const y = $("#tel .scroll").scrollTop; pintarTel(); $("#tel .scroll").scrollTop = y; guardarTel(); return;
    }
    case "agregar": {
      const ed = S.editando; const { precio, desc } = precioEdit(ed);
      S.carrito.push({ id: ed.id, persona: ed.persona.trim() || "Plato " + (S.carrito.length + 1), sel: ed.sel, precio, desc });
      S.editando = null; S.pantalla = "menu"; break;
    }
    case "ver-carrito": S.pantalla = "carrito"; break;
    case "quitar": S.carrito.splice(+arg, 1); break;
    case "postre": { const pl = platoPor(arg); S.carrito.push({ id: arg, persona: "Para todos", sel: {}, precio: pl.precio, desc: "Postre" }); break; }
    case "hora": S.hora = arg; break;
    case "pago": S.pago = arg; break;
    case "ruc": S.ruc = !S.ruc; break;
    case "pagar": S.pantalla = "pago"; break;
    case "confirmar-pago": S.procesando = true; pintarTel(); setTimeout(() => { S.procesando = false; crearPedido(); pintarTel(); }, 1300); return;
    case "nuevo-pedido": S.pantalla = "menu"; S.cat = null; break;
    case "recibo": {
      const p = D.pedidos.find((x) => x.n === +arg);
      modal(`<h3>Comprobante · ${numTxt(p)}</h3><div class="sub2">Mamá Gallina ${esc(p.fonda)} · ${p.hora} · ${esc(p.pago)}</div><div class="recibo">${p.platos.map((x) => `<div class="fila"><span>${esc(x.persona)} · ${esc(x.nombre)}</span><b>${x.precio.toFixed(2)}</b></div>`).join("")}<div class="fila"><b>Total pagado</b><b>${B(p.total)}</b></div></div><p class="sub2" style="margin-top:8px">La factura electrónica sale del sistema de facturación de Mamá Gallina con estos mismos datos.</p><div class="acciones"><button data-act="cerrar">Cerrar</button></div>`);
      return;
    }
    case "cerrar": cerrarModal(); return;
    // Mamá Gallina
    case "mg-tab": S.mgTab = arg; guardarTel(); pintarMG(); return;
    case "mg-fonda": S.mgFonda = arg; guardarTel(); pintarMG(); return;
    case "estado": { const [n, est] = arg.split(":"); cambiarEstado(+n, est); return; }
    case "auto": S.auto = !S.auto; guardarTel(); pintarMG(); return;
    case "etiquetas": {
      const p = D.pedidos.find((x) => x.n === +arg);
      modal(`<h3>Etiquetas · ${numTxt(p)}</h3><div class="sub2">Se imprimen en la impresora térmica, una por envase.</div><div class="etiquetas">${p.platos.map((x) => `<div class="etq"><div class="n">${numTxt(p)} · ${p.hora} · ${esc(p.fonda).toUpperCase()}</div><div class="q">${esc(x.persona).toUpperCase()}</div>${esc(x.nombre)}${x.desc ? "<br>" + esc(x.desc) : ""}</div>`).join("")}</div><div class="acciones"><button data-act="cerrar">Listo</button></div>`);
      return;
    }
    case "ver-pedido": {
      const p = D.pedidos.find((x) => x.n === +arg); if (!p) return;
      const sig = { porpagar: "pagado", pagado: "cocina", cocina: "listo", listo: "entregado" }[p.estado];
      const nom = { pagado: "Pagado", cocina: "En cocina", listo: "Listo", entregado: "Entregado" }[sig];
      modal(`<h3>${numTxt(p)} ${esc(nombreCorto(p))}</h3><div class="sub2">${esc(p.fonda)} · retira ${p.hora} · ${esc(p.canal)} · ${esc(p.pago || "sin pagar")}</div><div class="recibo">${p.platos.map((x) => `<div class="fila"><span><b>${esc(x.persona)}</b> · ${esc(x.nombre)}${x.desc ? `<br><small style="color:var(--gris)">${esc(x.desc)}</small>` : ""}</span><b>${x.precio.toFixed(2)}</b></div>`).join("")}<div class="fila"><b>Total</b><b>${B(p.total)}</b></div></div>
        <div class="acciones">${sig ? `<button data-act="mover" data-arg="${p.n}:${sig}">Mover a «${nom}»</button>` : ""}<button class="sec2" data-act="cerrar">Cerrar</button></div>`);
      return;
    }
    case "mover": { const [n, est] = arg.split(":"); cambiarEstado(+n, est); cerrarModal(); return; }
    case "ver-chat": {
      const p = D.pedidos.find((x) => x.id === arg); if (!p) return;
      modal(`<h3>Chat de ${esc(p.nombre)}</h3><div class="sub2">${esc(p.fonda)} · hace ${minutos(p)} min · todavía sin pagar</div><div class="m in" style="max-width:100%;box-shadow:none;background:var(--fondo)">${esc(p.texto)}</div>
        <p class="sub2" style="margin-top:10px">La muchacha que lo toma lo pasa al sistema: le sale el precio exacto y le manda al cliente el enlace del menú o el de pago.</p>
        <div class="acciones"><button data-act="atender" data-arg="${p.id}">Lo atiendo yo</button><button class="sec2" data-act="cerrar">Cerrar</button></div>`);
      return;
    }
    case "atender": { const p = D.pedidos.find((x) => x.id === arg); if (p) { p.atiende = "Usted"; guardar(); } cerrarModal(); return; }
    case "agotar": { const i = D.agotados.indexOf(arg); i >= 0 ? D.agotados.splice(i, 1) : D.agotados.push(arg); guardar(); if (S.pantalla === "menu") { S.mantenerScroll = true; pintarTel(); } return; }
    case "cupo": D.cupo = Math.max(1, D.cupo + +arg); guardar(); return;
    case "copiar-menu": toastMG("Listo: se copió el menú de ayer. Solo falta apagar lo que no hay."); return;
  }
  guardarTel(); pintarTel();
});

document.addEventListener("submit", (e) => {
  if (e.target.dataset.form === "chat") { e.preventDefault(); const i = $("#chat-in"); const t = i.value; i.value = ""; enviar(t); setTimeout(() => $("#chat-in") && $("#chat-in").focus(), 0); }
});
document.addEventListener("input", (e) => {
  if (e.target.id === "busca") { S.busca = e.target.value; $("#menu-lista").innerHTML = listaMenu(); }
  if (e.target.id === "persona" && S.editando) { S.editando.persona = e.target.value; $("#lbl-agregar").textContent = "Agregar plato de " + (e.target.value.trim() || "…"); guardarTel(); }
});

// Arranque
$("#escenario").dataset.vista = S.vista;
document.querySelectorAll(".tabs-movil button").forEach((x) => x.classList.toggle("on", x.dataset.arg === S.vista));
if (S.pantalla === "pago") S.pantalla = "carrito";
pintarTel(); pintarMG();
