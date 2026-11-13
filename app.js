// Demo de pedidos Mamá Gallina (MTG), versión 2. Todo corre en el navegador: no hay servidor ni pagos reales.
// Las pestañas del mismo navegador se sincronizan con localStorage + BroadcastChannel.
"use strict";

const CLAVE = "mg-demo-v3";
const $ = (s) => document.querySelector(s);
const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const B = (n) => "B/. " + Number(n).toFixed(2);
const r2 = (n) => Math.round(n * 100) / 100;
const ahora = () => new Date().toLocaleTimeString("es-PA", { hour: "2-digit", minute: "2-digit", hour12: false });
const platoPor = (id) => PLATOS.find((p) => p.id === id);
const catPor = (id) => CATEGORIAS.find((c) => c.id === id);
const num3 = (n) => "#" + String(n).padStart(3, "0");

function leer(store, k, def) { try { const v = store.getItem(k); return v ? JSON.parse(v) : def; } catch (e) { return def; } }
function guardarEn(store, k, v) { try { store.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento: la demo sigue en memoria */ } }

let TAB = leer(sessionStorage, CLAVE + "-tab", null);
if (!TAB) { TAB = Math.random().toString(36).slice(2, 9); guardarEn(sessionStorage, CLAVE + "-tab", TAB); }

// ───────── Datos de ejemplo del día
function azar(seed) { return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const NOMBRES = ["Ana", "Carlos", "María", "José", "Luis", "Marta", "Pedro", "Rosa", "Elena", "Raúl", "Yaritza", "Iván", "Gloria", "Javier", "Itzel", "Ricardo", "Daniela", "Omar", "Lucía", "Eduardo", "Kathia", "Rubén", "Milagros", "Abdiel"];
const EMPRESAS = [
  { id: "e1", nombre: "Constructora Ejemplo, S.A.", fonda: "Obarrio", estado: "Aprobada", empleados: 14, mesPedidos: 38, mesTotal: 214.75, contacto: "Itzel (compras)" },
  { id: "e2", nombre: "Oficinas Torre Demo", fonda: "Vía España", estado: "Aprobada", empleados: 9, mesPedidos: 21, mesTotal: 118.5, contacto: "Javier (administración)" },
  { id: "e3", nombre: "Clínica Ejemplo", fonda: "Obarrio", estado: "Por aprobar", empleados: 6, mesPedidos: 0, mesTotal: 0, contacto: "Gloria (recepción)" },
];
function generarDia(fonda, desde, cuantos, seed) {
  const rnd = azar(seed);
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  const horas = [["07:30", 3], ["08:00", 2], ["11:30", 3], ["11:45", 4], ["12:00", 8], ["12:15", 8], ["12:30", 7], ["12:45", 5], ["13:00", 4], ["13:30", 2]];
  const totalPeso = horas.reduce((a, h) => a + h[1], 0);
  const hora = () => { let x = rnd() * totalPeso; for (const [h, p] of horas) { if ((x -= p) < 0) return h; } return "12:00"; };
  const almuerzo = PLATOS.filter((p) => ["completa", "sopas", "pescados", "arroces"].includes(p.cat));
  const desayuno = PLATOS.filter((p) => p.cat === "desayunos");
  const lista = [];
  for (let i = 0; i < cuantos; i++) lista.push(hora());
  lista.sort();
  return lista.map((h, i) => {
    const temprano = h < "09:00";
    const k = rnd() < 0.55 ? 1 : rnd() < 0.55 ? 2 : 3 + Math.floor(rnd() * 3);
    const platos = [];
    for (let j = 0; j < k; j++) {
      const pl = pick(temprano ? desayuno : almuerzo);
      let precio = pl.precio, desc = "";
      if (pl.tipo === "completa" && rnd() < 0.2) { precio += 1; desc = "Arroz con guandú y coco"; }
      if (pl.tipo === "sopa") { precio = pl.conArroz; desc = "Con arroz"; }
      if (!temprano && rnd() < 0.25) { precio += 1.5; desc = (desc ? desc + " · " : "") + "+ jugo natural"; }
      platos.push({ persona: pick(NOMBRES), nombre: pl.nombre, precio: r2(precio), desc });
    }
    const pr = rnd();
    const empresa = pr > 0.9 ? EMPRESAS.find((e) => e.fonda === fonda && e.estado === "Aprobada") : null;
    return { n: desde + i, fonda, nombre: k > 2 ? "Oficina · " + platos[0].persona : platos[0].persona, estado: "entregado",
      canal: rnd() < 0.55 ? "Web" : "WhatsApp", pago: empresa ? "Cuenta de empresa" : pr < 0.6 ? "Yappy" : "Tarjeta", empresa: empresa ? empresa.id : null,
      hora: h, platos, total: r2(platos.reduce((a, p) => a + p.precio, 0)), creado: Date.now() - (cuantos - i) * 240000, cliente: platos[0].persona };
  });
}
function semilla() {
  const t = Date.now(), min = 60000;
  const p = (persona, nombre, precio, desc = "") => ({ persona, nombre, precio, desc });
  const o = (n, fonda, nombre, estado, canal, pago, hora, platos, hace) => ({ n, fonda, nombre, estado, canal, pago, hora, platos, total: r2(platos.reduce((a, x) => a + x.precio, 0)), creado: t - hace * min, cliente: nombre });
  return {
    next: { "Obarrio": 47, "Vía España": 128 }, cupo: 12,
    ocupados: { "Obarrio": { "11:45": 5, "12:00": 12, "12:15": 9, "12:30": 6, "12:45": 3, "13:00": 1 }, "Vía España": { "11:45": 3, "12:00": 12, "12:15": 7, "12:30": 4, "12:45": 2, "13:00": 0 } }, agotados: ["lechona", "pargo"], empresas: EMPRESAS,
    pedidos: [
      ...generarDia("Obarrio", 1, 40, 7),
      ...generarDia("Vía España", 101, 25, 11),
      o(41, "Obarrio", "Oficina · Luis", "listo", "Web", "Yappy", "12:00", [p("Luis", "Pollo guisado", 3.5), p("Marta", "Carne asada", 6.0), p("Iván", "Sopa de pollo", 3.5, "Con arroz")], 14),
      o(44, "Obarrio", "Luz", "listo", "Web", "Yappy", "12:00", [p("Luz", "Guacho de rabito", 4.25)], 12),
      o(45, "Obarrio", "Elena", "cocina", "WhatsApp", "Yappy", "12:00", [p("Elena", "Carne guisada", 4.0, "Ensalada de papa")], 9),
      o(46, "Obarrio", "Raúl", "cocina", "Web", "Tarjeta", "12:15", [p("Raúl", "Chuleta de cerdo guisada", 5.75), p("Raúl", "Jugo natural", 1.5)], 6),
      o(126, "Vía España", "Carlos", "cocina", "Web", "Yappy", "12:00", [p("Carlos", "Pollo apanado", 4.75)], 5),
      o(127, "Vía España", "Oficina · Ana", "pagado", "Web", "Tarjeta", "12:30", [p("Ana", "Lengua a la criolla", 6.0), p("Beto", "Sopa de costilla", 4.25, "Con arroz")], 2),
      { n: null, id: "chat-rosa", fonda: "Obarrio", nombre: "Rosa M.", estado: "nuevo", canal: "Chat", creado: t - 6 * min, platos: [], total: 0,
        log: [{ de: "c", texto: "Buenas, mándame 2 sopas de pata con arroz para las 12:30", t: "11:46" }] },
      { n: null, id: "chat-pedro", fonda: "Obarrio", nombre: "Pedro", estado: "nuevo", canal: "Chat", creado: t - 2 * min, platos: [], total: 0, atiende: "Yeni",
        log: [{ de: "c", texto: "¿Hay lechona hoy?", t: "11:50" }] },
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
  pantalla: "chat", fonda: null, chat: [], cat: null, busca: "", editando: null, carrito: [], hora: "12:15", pago: "Yappy", ruc: false,
  avisados: {}, visto: {}, vista: "cliente", mgTab: "kommo", mgFonda: "Obarrio", duenoFonda: "Las dos", auto: false,
  grupo: null, guardado: null, ultimoCarrito: null, pagandoOrden: null, empresa: "e1", sellos: 8, premio: false, usarPremio: true,
}, leer(sessionStorage, CLAVE + "-tel", {}));
S.escribiendo = false; S.procesando = false;
function guardarTel() { const c = { ...S }; delete c.escribiendo; delete c.procesando; guardarEn(sessionStorage, CLAVE + "-tel", c); }

// ───────── Chat del cliente
function msg(de, html, extra = {}) { S.chat.push({ de, html, t: ahora(), ...extra }); guardarTel(); }
function bot(html, extra = {}, espera = 750) {
  S.escribiendo = true; pintarTel();
  setTimeout(() => { S.escribiendo = false; msg("in", html, extra); if (S.pantalla !== "chat") avisoTel(html); pintarTel(); }, espera);
}
function enlaceMenu() {
  return { html: `<div class="prev"><div class="img"></div><div class="tx"><b>Menú de hoy · ${esc(S.fonda)}</b><span>pidemamagallina.com</span></div></div>Arme su pedido aquí, plato por plato, y pague en línea. Cuando termine, vuelve a este chat con su número. 🧾`,
    botones: [{ txt: "🍽 Ver menú y pedir", act: "abrir-menu" }] };
}
const miChat = () => D.pedidos.find((p) => p.estado === "nuevo" && p.tab === TAB);
function enviar(texto) {
  texto = texto.trim(); if (!texto) return;
  msg("out", esc(texto));
  const corto = /gracias|voy|^ok|dale|perfecto|bajando/i.test(texto) && texto.length < 34;
  if (!S.fonda) {
    bot("¡Hola! 👋 Bienvenido a Mamá Gallina.\n¿En cuál fonda va a retirar?", { botones: [{ txt: "📍 Obarrio", act: "fonda", arg: "Obarrio" }, { txt: "📍 Vía España", act: "fonda", arg: "Vía España" }] });
  } else if (corto) {
    bot("¡A la orden! 🙌");
  } else {
    const c = miChat();
    if (c) { c.log.push({ de: "c", texto, t: ahora() }); c.creado = c.atiende ? c.creado : c.creado; guardar(); }
    else {
      D.pedidos.push({ n: null, id: "chat-" + Date.now(), fonda: S.fonda, nombre: "Usted (demo)", estado: "nuevo", canal: "Chat", creado: Date.now(), platos: [], total: 0, tab: TAB, log: [{ de: "c", texto, t: ahora() }] });
      guardar();
      const e = enlaceMenu();
      bot("¡Recibido! 🙌 Para que le salga el precio exacto sin esperar cotización, puede armarlo aquí. Si prefiere, una de nuestras muchachas le atiende por este chat.\n" + e.html, { botones: e.botones });
    }
  }
  pintarTel();
}

// ───────── Plato que se está armando
function precioEdit(ed) {
  const pl = platoPor(ed.id); let p = pl.precio; const partes = [];
  gruposDe(pl).forEach((g) => {
    const sel = ed.sel[g.id];
    if (g.tipo === "radio") { const op = g.ops[sel ?? 0]; p += op.p; if ((sel ?? 0) > 0 || g.id === "ens") partes.push(op.n); }
    else (sel || []).forEach((i) => { p += g.ops[i].p; partes.push((g.ops[i].p ? "+ " : "") + g.ops[i].n.toLowerCase()); });
  });
  if (pl.tipo === "sopa" && (ed.sel.arroz ?? 0) === 0) partes.unshift("Sin arroz");
  return { precio: r2(p), desc: partes.join(" · ") };
}
const totalMio = () => r2(S.carrito.reduce((a, c) => a + c.precio, 0));
const descuentoPremio = () => (S.premio && S.usarPremio && S.carrito.length && S.pago !== "Empresa") ? r2(Math.min(4, Math.max(...S.carrito.map((c) => c.precio)))) : 0;
const totalPagar = () => r2(totalMio() - descuentoPremio());
const SLOTS = ["11:45", "12:00", "12:15", "12:30", "12:45", "13:00"];
const quedan = (f, h) => Math.max(0, D.cupo - (((D.ocupados || {})[f] || {})[h] || 0));
function horaValida() { if (!S.fonda) return; if (quedan(S.fonda, S.hora) <= 0) { const h = SLOTS.find((x) => x >= "12:00" && quedan(S.fonda, x) > 0) || SLOTS.find((x) => quedan(S.fonda, x) > 0); if (h) S.hora = h; } }
const totalGrupo = () => r2(totalMio() + (S.grupo ? S.grupo.otros.reduce((a, o) => a + o.precio, 0) : 0));

// ───────── Pantallas del teléfono
const barraEstado = (fondo = "", color = "") => `<div class="estado" style="${fondo ? `background:${fondo};color:${color}` : ""}"><span>${ahora()}</span><span>●●● 5G</span></div>`;
function vistaChat() {
  const mensajes = S.chat.map((m, i) => {
    let h = `<div class="m ${m.de}">${m.html}<div class="t">${m.t}${m.de === "out" ? " ✓✓" : ""}</div></div>`;
    if (m.botones) h += `<div class="wbtns">${m.botones.map((b) => `<button class="wbtn" data-act="${b.act}" data-arg="${esc(b.arg || "")}" ${b.usado ? "disabled" : ""} data-msg="${i}">${b.txt}</button>`).join("")}</div>`;
    return h;
  }).join("");
  const sugs = !S.fonda ? ["Buenas, quiero pedir 4 almuerzos para la oficina", "¿Qué hay de almuerzo hoy?"] : ["Mándame 2 sopas de pata con arroz", "¿Hay lechona hoy?", "Gracias, voy bajando"];
  return `${barraEstado("var(--wa)", "#fff")}
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
    const r = PLATOS.filter(hayHoy).filter((p) => (p.nombre + " " + p.desc).toLowerCase().includes(q));
    return `<div class="sub">${r.length} resultado${r.length === 1 ? "" : "s"}</div>` + (r.map(itemHTML).join("") || '<div class="vacio">No encontramos ese plato hoy.</div>');
  }
  if (!S.cat) {
    const banners = [];
    if (S.grupo) banners.push(`<button class="banner verde" data-act="ir" data-arg="grupo"><span>👥</span><span><b>Pedido compartido ${esc(S.grupo.codigo)}</b><br>${S.grupo.otros.length} compañero${S.grupo.otros.length === 1 ? "" : "s"} ya pidieron · se cierra a las ${S.grupo.cierre}</span></button>`);
    else banners.push(`<button class="banner" data-act="grupo-nuevo"><span>👥</span><span><b>¿Pedido para la oficina?</b><br>Mande un enlace al grupo y que cada quien pida y pague lo suyo.</span></button>`);
    if (S.guardado && !S.grupo) banners.push(`<button class="banner gris" data-act="repetir"><span>↻</span><span><b>Repetir «pedido de la oficina»</b><br>${S.guardado.length} platos · ${B(S.guardado.reduce((a, c) => a + c.precio, 0))}</span></button>`);
    if (S.premio && !S.grupo) banners.unshift(`<div class="banner premio"><span>🎁</span><span><b>¡Tiene un almuerzo gratis!</b><br>Completó 10 pedidos. Se descuenta solo al pagar.</span></div>`);
    const delDia = MENU_SEMANA[DIA_HOY].map(platoPor).filter(Boolean);
    return `${banners.join("")}<div class="sub sub-fila"><span>Platos de hoy · ${DIAS[DIA_HOY]}</span><button data-act="semana">📅 Menú de la semana</button></div>${delDia.map(itemHTML).join("")}
      <div class="sub">Categorías</div><div class="cats">${CATEGORIAS.map((c) => `<button class="cat" data-act="cat" data-arg="${c.id}">${imgDe(c)}${esc(c.nombre)}</button>`).join("")}</div>
      <div class="sub">También todos los días</div>${PLATOS.filter((p) => p.top && !CAMBIA_CADA_DIA.includes(p.cat)).map(itemHTML).join("")}
      <p class="nota-fotos">Fotos ilustrativas. Platos y precios del menú de Mamá Gallina Obarrio.</p>`;
  }
  const c = catPor(S.cat);
  return `<div class="chips"><button data-act="cat" data-arg="">Inicio</button>${CATEGORIAS.map((x) => `<button class="${x.id === S.cat ? "on" : ""}" data-act="cat" data-arg="${x.id}">${esc(x.nombre)}</button>`).join("")}</div>
    ${c.nota ? `<div class="nota-cat">${esc(c.nota)}${c.id === "completa" ? " · Arroz especial B/. 1.00 adicional" : ""}</div>` : ""}
    ${CAMBIA_CADA_DIA.includes(S.cat) ? `<div class="nota-cat"><b>Hoy ${DIAS[DIA_HOY].toLowerCase()}</b>: estos platos cambian cada día. <button class="link-rojo" data-act="semana">Ver la semana</button></div>` : ""}
    ${PLATOS.filter((p) => p.cat === S.cat && hayHoy(p)).map(itemHTML).join("")}`;
}
function barraCarrito() {
  const n = S.carrito.length; if (!n) return "";
  return `<button class="carr" data-act="ver-carrito"><span>🛒 ${n} plato${n === 1 ? "" : "s"} · ${B(totalMio())}</span><span>Ver pedido</span></button>`;
}
function vistaMenu() {
  return `${barraEstado("var(--rojo)", "#fff")}
  <div class="mtop"><div class="r"><button class="volver" data-act="ir" data-arg="chat">‹ WhatsApp</button><span class="loc">📍 ${esc(S.fonda)} · retiro</span></div>
    <div class="marca">MAMÁ GALLINA</div><h1>¿Qué le provoca hoy?</h1></div>
  <div class="busca"><input id="busca" placeholder="🔍 Buscar: sopa, pollo, patacón…" value="${esc(S.busca)}" autocomplete="off"></div>
  <div class="scroll" id="menu-scroll"><div id="menu-lista">${listaMenu()}</div><div class="espacio"></div></div>${barraCarrito()}`;
}
function vistaPlato() {
  const ed = S.editando, pl = platoPor(ed.id), { precio } = precioEdit(ed);
  const grupos = gruposDe(pl).map((g) => {
    const ops = g.ops.map((op, i) => {
      const on = g.tipo === "radio" ? (ed.sel[g.id] ?? 0) === i : (ed.sel[g.id] || []).includes(i);
      return `<button class="op ${on ? "on" : ""}" data-act="op" data-arg="${g.id}:${i}"><span class="${g.tipo === "radio" ? "r" : "c"}">${g.tipo === "check" && on ? "✓" : ""}</span>${esc(op.n)}<span class="pr">${op.nota || (op.p ? "+ " + B(op.p) : "incluido")}</span></button>`;
    }).join("");
    return `<div class="sec"><h4><span>${g.titulo}</span>${g.tipo === "radio" ? "<em>Elija 1</em>" : ""}</h4>${ops}</div>`;
  }).join("");
  const hero = imgDe(pl, "hero").replace(/<\/div>$/, `<button class="x" data-act="ir" data-arg="menu" aria-label="Cerrar">✕</button>${pl.foto ? '<span class="ia-tag">Foto ilustrativa</span>' : ""}</div>`);
  return `<div class="scroll">${hero}
    <div style="padding:8px 16px 0"><div style="font-size:21px;font-weight:800">${esc(pl.nombre)}</div><div style="font-size:12.5px;color:var(--gris)">${esc(pl.desc)} · <b style="color:var(--tinta)">${B(pl.precio)}</b></div></div>
    <div class="sec"><h4>¿PARA QUIÉN ES? (PLATO ${S.carrito.length + 1})</h4><input class="nombre-in" id="persona" placeholder="Ej.: Ana" value="${esc(ed.persona)}" maxlength="24" autocomplete="off"></div>
    ${grupos}<div class="espacio"></div></div>
    <button class="barra" data-act="agregar"><span id="lbl-agregar">Agregar plato de ${esc(ed.persona || "…")}</span><span id="precio-agregar">${B(precio)}</span></button>`;
}
function filaPlato(c, i, quitar = true) {
  const pl = platoPor(c.id);
  return `<div class="pl">${pl.foto ? `<div class="f" style="background-image:url(${pl.foto})"></div>` : `<div class="f">${pl.emoji || "🍽️"}</div>`}<div class="t"><b>${esc(c.persona)}</b> · ${esc(pl.nombre)}<small>${esc(c.desc || pl.desc)}</small></div><b>${c.precio.toFixed(2)}</b>${quitar ? `<button class="q" data-act="quitar" data-arg="${i}" aria-label="Quitar">✕</button>` : ""}</div>`;
}
function vistaCarrito() {
  const n = S.carrito.length, emp = D.empresas.find((e) => e.id === S.empresa);
  const lista = S.carrito.map((c, i) => filaPlato(c, i)).join("") || '<div class="vacio" style="padding:10px">Todavía no ha agregado su plato.</div>';
  const otros = S.grupo ? `<div class="sec"><h4><span>👥 COMPAÑEROS · PEDIDO ${esc(S.grupo.codigo)}</span><em>Se cierra ${S.grupo.cierre}</em></h4>${S.grupo.otros.map((o) => `<div class="pl"><div class="f">🧑‍💼</div><div class="t"><b>${esc(o.persona)}</b> · ${esc(o.nombre)}<small>${esc(o.desc)}</small></div><span class="ok-mini">Pagó ✓</span></div>`).join("") || '<div class="vacio" style="padding:8px">Nadie más ha pedido todavía.</div>'}</div>` : "";
  horaValida();
  const horas = SLOTS.map((h) => { const q = quedan(S.fonda, h); return q <= 0 ? `<span class="hora lleno" title="Cupo lleno">${h}<small>lleno</small></span>` : `<button class="hora ${S.hora === h ? "on" : ""} ${q <= 3 ? "pocos" : ""}" data-act="hora" data-arg="${h}">${h}<small>quedan ${q}</small></button>`; }).join("");
  const premio = S.premio && S.pago !== "Empresa" ? `<div class="sec premio-sec"><button class="fila" data-act="usar-premio" style="width:100%"><span>🎁 <b>Almuerzo gratis</b> de cliente frecuente<br><small>Se descuenta un plato de hasta B/. 4.00</small></span><span class="sw ${S.usarPremio ? "on" : ""}"></span></button></div>` : "";
  const pagos = [["Yappy", "Yappy"], ["Tarjeta", "Visa / MC"], ["Empresa", "🏢 Empresa"]].map(([k, t]) => `<button class="${S.pago === k ? "on" : ""}" data-act="pago" data-arg="${k}">${t}</button>`).join("");
  const empresaInfo = S.pago === "Empresa" ? `<div class="emp-info">Se carga a <b>${esc(emp.nombre)}</b> (cuenta aprobada por Mamá Gallina). No paga ahora: la empresa recibe <b>una sola factura a fin de mes</b>.</div>` : "";
  const total = S.grupo ? totalGrupo() : totalPagar();
  return `${barraEstado()}
  <div class="cab-simple"><button class="v" data-act="ir" data-arg="menu">← Seguir pidiendo</button><h2>${S.grupo ? "Pedido compartido" : n > 1 ? "Pedido de la oficina" : "Su pedido"}</h2></div>
  <div class="scroll">
    ${otros}
    <div class="sec"><h4>${S.grupo ? "SU PARTE" : `${n} PLATO${n === 1 ? "" : "S"} · CADA UNO CON SU NOMBRE`}</h4>${lista}<button class="op" data-act="ir" data-arg="menu" style="color:var(--rojo);font-weight:700;border:none">+ Agregar otro plato</button></div>
    ${S.grupo ? "" : `<div class="sec"><h4>¿POSTRE PARA LA OFICINA?</h4><div class="sug2"><button data-act="postre" data-arg="flan">+ Flan de la casa<br>${B(2.5)}</button><button data-act="postre" data-arg="arroz-leche">+ Arroz con leche<br>${B(2)}</button></div></div>`}
    <div class="sec"><h4>RETIRA EN ${esc(S.fonda || "").toUpperCase()} · ¿A QUÉ HORA PASA?</h4><div class="horas">${horas}</div><div style="font-size:11.5px;color:var(--gris);margin-top:6px">La cocina acepta ${D.cupo} pedidos cada 15 minutos para no saturarse. Pida temprano y asegure su hora.</div></div>${premio}
    <div class="sec"><h4>PAGO · BANCO GENERAL</h4><div class="pago">${pagos}</div>${empresaInfo}
      ${S.pago === "Empresa" ? "" : `<button class="fila" data-act="ruc" style="width:100%"><span>Factura con RUC de la empresa</span><span class="sw ${S.ruc ? "on" : ""}"></span></button>`}</div>
    <div class="sec">${descuentoPremio() ? `<div class="total" style="color:var(--verde);margin-bottom:4px"><span>🎁 Almuerzo gratis</span><b>− ${B(descuentoPremio())}</b></div>` : ""}<div class="total"><span>${S.grupo ? "Total del pedido compartido" : "Total (se suma solo)"}</span><b>${B(total)}</b></div>${S.grupo ? `<div class="total" style="margin-top:4px;color:var(--rojo)"><span>Usted paga solo su parte</span><b>${B(totalPagar())}</b></div>` : ""}</div>
    <div class="espacio"></div></div>
  <button class="barra" data-act="pagar" ${n ? "" : "disabled"}><span>${S.pago === "Empresa" ? "Cargar a la cuenta" : S.grupo ? "Pagar mi parte y cerrar" : "Pagar"}</span><span>${B(totalPagar())}</span></button>`;
}
function vistaGrupo() {
  const g = S.grupo;
  return `${barraEstado()}
  <div class="cab-simple"><button class="v" data-act="ir" data-arg="menu">← Menú</button><h2>Pedido compartido</h2></div>
  <div class="scroll">
    <div class="sec"><p style="font-size:13.5px;line-height:1.4">Mande este enlace al grupo de WhatsApp de su oficina. <b>Cada compañero arma su plato y paga su parte.</b> El pedido se cierra solo a las <b>${g.cierre}</b> y sale junto a la cocina.</p>
      <div class="enlace">pidemamagallina.com/g/${esc(g.codigo)}</div>
      <button class="btn-grande verde" data-act="compartir">📤 Compartir en el grupo de la oficina</button></div>
    <div class="sec"><h4><span>QUIÉN YA PIDIÓ</span><em>${g.otros.length + (S.carrito.length ? 1 : 0)} persona${g.otros.length + (S.carrito.length ? 1 : 0) === 1 ? "" : "s"}</em></h4>
      ${S.carrito.length ? `<div class="pl"><div class="f">⭐</div><div class="t"><b>Usted (organiza)</b><small>${S.carrito.length} plato${S.carrito.length === 1 ? "" : "s"} · paga al cerrar</small></div><b>${totalMio().toFixed(2)}</b></div>` : ""}
      ${g.otros.map((o) => `<div class="pl"><div class="f">🧑‍💼</div><div class="t"><b>${esc(o.persona)}</b> · ${esc(o.nombre)}<small>Pagó con ${esc(o.pago)}</small></div><b>${o.precio.toFixed(2)}</b></div>`).join("")}
      ${g.otros.length < 4 ? `<button class="op" data-act="simular-companeros" style="color:var(--azul);font-weight:700;border:none">👥 Simular que los compañeros piden desde su celular</button>` : ""}</div>
    <div class="sec"><div class="total"><span>Total del pedido</span><b>${B(totalGrupo())}</b></div></div>
    <div style="padding:6px 16px 0;display:flex;gap:8px"><button class="btn-grande gris" data-act="ir" data-arg="menu">+ Mi plato</button><button class="btn-grande" data-act="ver-carrito" ${S.carrito.length ? "" : "disabled"}>Cerrar y pagar</button></div>
    <button class="op" data-act="grupo-cancelar" style="justify-content:center;color:var(--gris);border:none;margin-top:6px">Cancelar pedido compartido</button>
    <div class="espacio"></div></div>`;
}
function vistaPago() {
  const orden = S.pagandoOrden ? D.pedidos.find((p) => p.n === S.pagandoOrden) : null;
  const total = B(orden ? orden.total : totalPagar());
  if (S.procesando) return `${barraEstado()}<div class="pago-sim"><div class="spinner"></div><h2>Confirmando el pago…</h2><p>Simulación: no se cobra nada.</p></div>`;
  const volver = orden ? "chat" : "carrito";
  if (S.pago !== "Tarjeta") return `${barraEstado()}
    <div class="pago-sim"><div class="logo" style="background:#1d4fd8">Y</div><h2>Pagar con Yappy</h2><div class="monto">${total}</div>
    <p>Comercio: Mamá Gallina ${esc(S.fonda)}<br>Banco General · pago amarrado a su pedido</p>
    <p class="aviso-sim">Simulación: aquí se abriría la app de Yappy en su celular para confirmar.</p>
    <button class="btn-grande" data-act="confirmar-pago">Confirmar pago</button><button class="btn-grande gris" data-act="ir" data-arg="${volver}">Volver</button></div>`;
  return `${barraEstado()}
    <div class="pago-sim"><h2>Pago con tarjeta</h2><p>Botón de Pago del Banco General</p><div class="monto">${total}</div>
    <div class="tarjeta-demo"><small>TARJETA DE DEMOSTRACIÓN</small>VISA&nbsp;&nbsp;•••• •••• •••• 4242<br><span style="font-size:12px;opacity:.8">No escriba datos reales: esto es una simulación</span></div>
    <button class="btn-grande" data-act="confirmar-pago">Pagar ${total}</button><button class="btn-grande gris" data-act="ir" data-arg="${volver}">Volver</button></div>`;
}
const ETAPAS = [["pagado", "Pagado"], ["cocina", "En cocina"], ["listo", "Listo"], ["entregado", "Entregado"]];
function lineaEstado(estado) {
  const k = ETAPAS.findIndex((e) => e[0] === estado);
  return `<div class="lin">${ETAPAS.map((e, i) => `${i ? `<i class="${i <= k ? "on" : ""}"></i>` : ""}<b class="${i <= k ? "on" : ""}">${e[1]}</b>`).join("")}</div>`;
}
function vistaListo() {
  const p = D.pedidos.find((x) => x.n === S.ultimo && x.fonda === S.fondaUltimo);
  if (!p) { S.pantalla = "chat"; return vistaChat(); }
  const empresa = p.pago === "Cuenta de empresa";
  return `${barraEstado()}<div class="scroll">
    <div class="ok"><div class="ck">✓</div><h2>${empresa ? "¡Cargado a la cuenta!" : p.compartido ? "¡Pedido compartido cerrado!" : `¡Pagado con ${p.pago === "Tarjeta" ? "tarjeta" : "Yappy"}!`}</h2><p>${B(p.total)} · ${p.platos.length} plato${p.platos.length === 1 ? "" : "s"}${empresa ? " · factura a fin de mes" : " · Banco General"}</p></div>
    <div class="num"><small>SU NÚMERO DE RETIRO</small><div>${num3(p.n)}</div><span>${esc(p.fonda)} · ${p.hora} · Ventanilla express</span></div>
    <div class="sec" style="margin:10px 16px 0"><h4>ESTADO DE SU PEDIDO (SE ACTUALIZA SOLO)</h4>${lineaEstado(p.estado)}</div>
    <div class="sec sellos"><h4><span>⭐ CLIENTE FRECUENTE</span><em>${S.premio ? "¡Premio listo!" : `${S.sellos} de 10`}</em></h4><div class="puntos">${Array.from({ length: 10 }, (_, i) => `<i class="${S.premio || i < S.sellos ? "on" : ""}">${i === 9 ? "🎁" : ""}</i>`).join("")}</div><small>${S.premio ? "Su próximo almuerzo va por la casa." : "El décimo almuerzo es gratis. Se cuenta solo con su número de WhatsApp."}</small></div>
    <div style="padding:0 16px"><button class="btn-grande verde" data-act="ir" data-arg="chat">💬 Volver a WhatsApp</button></div>
    <div style="text-align:center;font-size:12px;color:var(--gris);margin:6px 24px 0">El resumen ya le llegó al chat de Mamá Gallina.</div>
    <button class="fac" data-act="recibo" data-arg="${p.fonda}|${p.n}"><span>🧾 Comprobante del pedido</span><b>Ver</b></button>
    ${S.ultimoCarrito && S.ultimoCarrito.length > 1 ? `<button class="fac" data-act="guardar-oficina"><span>⭐ ${S.guardado ? "Guardado como «pedido de la oficina»" : "Guardar como «pedido de la oficina»"}</span><b>${S.guardado ? "✓" : "Guardar"}</b></button>` : ""}
    <button class="fac" data-act="nuevo-pedido"><span>↻ Hacer otro pedido</span><b>Empezar</b></button><div class="espacio"></div></div>`;
}
function pintarTel() {
  const v = { chat: vistaChat, menu: vistaMenu, plato: vistaPlato, carrito: vistaCarrito, grupo: vistaGrupo, pago: vistaPago, listo: vistaListo }[S.pantalla] || vistaChat;
  const ms = $("#menu-scroll"); const y = ms ? ms.scrollTop : 0;
  $("#tel").innerHTML = v();
  if (S.pantalla === "chat") { const sc = $("#chat-scroll"); if (sc) sc.scrollTop = sc.scrollHeight; }
  if (S.mantenerScroll && $("#menu-scroll")) $("#menu-scroll").scrollTop = y;
  S.mantenerScroll = false;
}
let avisoTimer = null;
function avisoTel(html) {
  const tmp = document.createElement("div"); tmp.innerHTML = html;
  const txt = tmp.textContent.trim().slice(0, 95);
  clearTimeout(avisoTimer);
  const marco = $(".telefono"); marco.querySelectorAll(".aviso").forEach((a) => a.remove());
  const el = document.createElement("button"); el.className = "aviso"; el.dataset.act = "ir"; el.dataset.arg = "chat";
  el.innerHTML = `<span class="av">✆</span><span><b>Mamá Gallina</b><br>${esc(txt)}</span>`;
  marco.appendChild(el); avisoTimer = setTimeout(() => el.remove(), 5000);
}

// ───────── Lado Mamá Gallina
const MG_TABS = [["kommo", "Kommo"], ["cocina", "Cocina"], ["tv", "Pantalla de listos"], ["menu", "Menú del día"], ["dueno", "Panel del dueño"], ["empresas", "Empresas"], ["guia", "Cómo probar"]];
const COLS = [["nuevo", "NUEVO · SIN PAGAR", "#c90d20"], ["porpagar", "POR PAGAR", "#e8a400"], ["pagado", "PAGADO", "#3867b1"], ["cocina", "EN COCINA", "#4d92cf"], ["listo", "LISTO", "#61a05f"], ["entregado", "ENTREGADO", "#9ca2a2"]];
const delaFonda = (f = S.mgFonda) => D.pedidos.filter((p) => f === "Las dos" || p.fonda === f);
const minutos = (p) => Math.max(0, Math.floor((Date.now() - p.creado) / 60000));
const nombreCorto = (p) => p.platos.length > 1 && !/·/.test(p.nombre) ? `${p.nombre} · ${p.platos.length} platos` : p.platos.length > 1 ? `${p.nombre} (${p.platos.length})` : p.nombre;
const buscarPedido = (clave) => { const [f, n] = String(clave).split("|"); return D.pedidos.find((p) => p.fonda === f && p.n === +n); };
const clavePed = (p) => `${p.fonda}|${p.n}`;
const vendidos = (lista) => lista.filter((p) => p.n && !["porpagar", "nuevo"].includes(p.estado));

function filtroFonda(todas = false, actual = S.mgFonda, act = "mg-fonda") {
  return ["Obarrio", "Vía España", ...(todas ? ["Las dos"] : [])].map((f) => `<button class="${actual === f ? "on" : ""}" data-act="${act}" data-arg="${f}">${f}</button>`).join("");
}
function tarjetaKommo(p) {
  if (p.estado === "nuevo") {
    const m = minutos(p), alerta = m >= 5 && !p.atiende, ult = p.log[p.log.length - 1];
    return `<button class="kcard ${alerta ? "alerta" : ""}" data-act="ver-chat" data-arg="${p.id}"><b>${esc(p.nombre)} · chat</b><span class="g">${ult.de === "c" ? "" : "Usted: "}"${esc(ult.texto)}"</span>${alerta ? `<span class="tag tg-r">⚠ ${m} min sin respuesta</span>` : p.atiende ? `<span class="tag tg-y">Lo atiende ${esc(p.atiende)}</span>` : `<span class="tag tg-a">Nuevo · hace ${m} min</span>`}</button>`;
  }
  const tags = p.estado === "porpagar" ? '<span class="tag tg-y">Enlace de pago enviado</span>'
    : `<span class="tag tg-v">${esc(p.pago === "Cuenta de empresa" ? "Empresa" : p.compartido ? "Compartido" : p.pago)} ✓</span><span class="tag tg-a">${esc(p.canal)}</span>`;
  const extra = p.estado === "cocina" ? `<span class="tag tg-a">⏱ ${minutos(p)} min</span>` : p.estado === "listo" ? '<span class="tag tg-v">Aviso enviado</span>' : "";
  return `<button class="kcard ${p.estado === "entregado" ? "tenue" : ""} ${p.fresco ? "nuevo-llego" : ""}" data-act="ver-pedido" data-arg="${clavePed(p)}"><b>${num3(p.n)} ${esc(nombreCorto(p))}</b><span class="g">${p.platos.slice(0, 2).map((x) => esc(x.nombre)).join(", ")}${p.platos.length > 2 ? "…" : ""} · ${p.hora}</span><b style="display:inline">${B(p.total)}</b><br>${tags}${extra}</button>`;
}
function vistaKommo() {
  const lista = delaFonda(), vend = vendidos(lista);
  const cols = COLS.map(([id, tit, color]) => {
    let l = lista.filter((p) => p.estado === id).sort((a, b) => b.creado - a.creado);
    const n = l.length, extra = id === "entregado" && n > 5 ? n - 5 : 0;
    if (extra) l = l.slice(0, 5);
    return `<div class="kcol"><h4 style="border-color:${color}"><span>${tit}</span><span>${n}</span></h4>${l.map(tarjetaKommo).join("")}${extra ? `<div class="mas">y ${extra} más hoy</div>` : ""}</div>`;
  }).join("");
  return `<div class="mg-bar"><h3>Kommo · Embudo «Pedidos»</h3><div class="f">${filtroFonda()}<span>${vend.length} pedidos hoy · ${B(vend.reduce((a, p) => a + p.total, 0))}</span></div></div>
    <div class="kommo"><div class="kcols">${cols}</div></div>
    <div class="nota-mg">Toque un chat rojo para contestarlo como lo haría una muchacha: la respuesta le llega al cliente en su WhatsApp. Toque un pedido para verlo o moverlo de etapa.</div>`;
}
function vistaCocina() {
  const lista = delaFonda().filter((p) => p.n);
  const tk = (p) => {
    const items = p.platos.filter((x) => x.precio >= 0).map((x) => `<li><b>${esc(x.persona)}</b>${esc(x.nombre)}${x.desc ? `<small>${esc(x.desc)}</small>` : ""}</li>`).join("");
    const k = clavePed(p);
    const bots = p.estado === "pagado" ? `${p.platos.length > 1 ? `<button class="b az" data-act="etiquetas" data-arg="${k}">🏷 ${p.platos.length} etiquetas</button>` : ""}<button class="b" data-act="estado" data-arg="${k}|cocina">Empezar</button>`
      : p.estado === "cocina" ? `<button class="b" data-act="estado" data-arg="${k}|listo">Marcar listo</button>` : `<button class="b" data-act="estado" data-arg="${k}|entregado">Entregado</button>`;
    return `<div class="tk ${p.estado === "pagado" ? "urg" : p.estado === "listo" ? "ok" : ""}"><div class="h"><span>${num3(p.n)} ${esc(nombreCorto(p))}</span><span>${p.estado === "cocina" ? "⏱ " + minutos(p) + " min" : p.estado === "listo" ? "✓" : p.hora}</span></div><div class="m">${esc(p.canal)} · ${esc(p.compartido ? "compartido, cada uno pagó" : p.pago === "Cuenta de empresa" ? "cuenta de empresa" : p.pago + " pagado")}</div><ul>${items}</ul><div class="bots">${bots}</div></div>`;
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
  const fila = (p) => `<div class="n ${p.tab === TAB ? "llego" : ""}">${num3(p.n)} <small>${esc(nombreCorto(p))}</small></div>`;
  return `<div class="mg-bar"><h3>Pantalla de pedidos listos (TV en la ventanilla)</h3><div class="f">${filtroFonda()}</div></div>
    <div class="tv"><div class="s"><div class="izq"><h4>EN PREPARACIÓN</h4>${prep.map(fila).join("") || '<div class="pie">—</div>'}</div>
    <div class="der"><h4>✓ LISTOS · RETIRE AQUÍ</h4>${listos.map(fila).join("") || '<div class="pie">Todavía no hay pedidos listos.</div>'}<div class="pie">Ya está pagado: diga su número en la ventanilla express y llévese su pedido.</div></div></div></div>`;
}
function vistaPanelMenu() {
  const grupos = CATEGORIAS.map((c) => `<div class="grupo"><h5>${esc(c.nombre)}${CAMBIA_CADA_DIA.includes(c.id) ? ` · hoy ${DIAS[DIA_HOY].toLowerCase()}` : ""}</h5>${PLATOS.filter((p) => p.cat === c.id && hayHoy(p)).map((p) => {
    const off = D.agotados.includes(p.id);
    return `<button class="pm ${off ? "off" : ""}" data-act="agotar" data-arg="${p.id}"><span>${esc(p.nombre)} · ${p.precio.toFixed(2)}</span><span class="sw ${off ? "" : "on"}"></span></button>`;
  }).join("")}</div>`).join("");
  return `<div class="mg-bar"><h3>Menú del día (celular de la encargada)</h3><div class="f">${filtroFonda()}<button data-act="semana">📅 Menú de la semana</button><button data-act="copiar-menu">📋 Copiar menú de ayer</button></div></div>
    <div class="panel-menu"><p style="font-size:13.5px;color:var(--gris)">Lo que apague aquí sale como <b>AGOTADO</b> en el menú del cliente al instante. Pruebe apagar el pollo guisado y mire el teléfono.</p>
    <div class="cupo" style="margin-top:10px"><span>Pedidos que acepta la cocina cada 15 minutos:</span><button data-act="cupo" data-arg="-1">−</button><b>${D.cupo}</b><button data-act="cupo" data-arg="1">+</button></div>
    <div class="cupos-hoy">${SLOTS.map((h) => { const q = quedan(S.mgFonda, h); return `<span class="${q <= 0 ? "lleno" : q <= 3 ? "pocos" : ""}">${h} · ${q <= 0 ? "lleno" : "quedan " + q}</span>`; }).join("")}</div>
    <div class="pm-cols">${grupos}</div></div>`;
}
function barras(datos, unidad = "") {
  const max = Math.max(1, ...datos.map((d) => d[1]));
  return `<div class="barras">${datos.map(([k, v]) => `<div class="bar"><span class="v">${unidad === "B/." ? v.toFixed(0) : v}</span><i style="height:${Math.max(4, (v / max) * 100)}%"></i><span class="k">${esc(k)}</span></div>`).join("")}</div>`;
}
function vistaDueno() {
  const f = S.duenoFonda, lista = vendidos(delaFonda(f));
  const total = lista.reduce((a, p) => a + p.total, 0), platos = lista.reduce((a, p) => a + p.platos.length, 0);
  const porCanal = (fn) => lista.filter(fn).length;
  const pct = (n) => lista.length ? Math.round((n / lista.length) * 100) + "%" : "0%";
  const horas = {}; lista.forEach((p) => { horas[p.hora] = (horas[p.hora] || 0) + 1; });
  const conteo = {}; lista.forEach((p) => p.platos.forEach((x) => { conteo[x.nombre] = (conteo[x.nombre] || 0) + 1; }));
  const top = Object.entries(conteo).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const clientes = {}; lista.forEach((p) => { clientes[p.cliente || p.nombre] = (clientes[p.cliente || p.nombre] || 0) + 1; });
  const comparar = f === "Las dos" ? `<div class="dcaja"><h5>Obarrio vs. Vía España (hoy)</h5>${["Obarrio", "Vía España"].map((x) => { const l = vendidos(delaFonda(x)); const t = l.reduce((a, p) => a + p.total, 0); return `<div class="fila"><span>${x}</span><span><b>${B(t)}</b> · ${l.length} pedidos</span></div>`; }).join("")}</div>` : "";
  return `<div class="mg-bar"><h3>Panel del dueño · hoy</h3><div class="f">${filtroFonda(true, f, "dueno-fonda")}</div></div>
    <div class="dueno">
      <div class="kpis4">
        <div class="kp"><small>VENTAS DE HOY</small><b>${B(total)}</b></div>
        <div class="kp"><small>PEDIDOS</small><b>${lista.length}</b><span>${platos} platos</span></div>
        <div class="kp"><small>TICKET PROMEDIO</small><b>${B(lista.length ? total / lista.length : 0)}</b></div>
        <div class="kp"><small>PEDIDOS DE OFICINA</small><b>${pct(porCanal((p) => p.platos.length >= 3 || p.compartido || p.pago === "Cuenta de empresa"))}</b><span>3 platos o más, compartidos o de empresa</span></div>
      </div>
      <div class="dgrid">
        <div class="dcaja"><h5>Pedidos por hora de retiro</h5>${barras(Object.entries(horas).sort())}</div>
        <div class="dcaja"><h5>Platos que más salen</h5>${top.map(([k, v], i) => `<div class="fila"><span>${i + 1}. ${esc(k)}</span><b>${v}</b></div>`).join("")}</div>
        <div class="dcaja"><h5>Cómo pagan</h5>
          <div class="fila"><span>Yappy</span><b>${pct(porCanal((p) => p.pago === "Yappy" && !p.compartido))}</b></div>
          <div class="fila"><span>Tarjeta (Banco General)</span><b>${pct(porCanal((p) => p.pago === "Tarjeta"))}</b></div>
          <div class="fila"><span>Cuenta de empresa</span><b>${pct(porCanal((p) => p.pago === "Cuenta de empresa"))}</b></div>
          <div class="fila"><span>Compartido (cada uno lo suyo)</span><b>${pct(porCanal((p) => p.compartido))}</b></div>
          <h5 style="margin-top:10px">Por dónde llegan</h5>
          <div class="fila"><span>Menú web</span><b>${pct(porCanal((p) => p.canal === "Web"))}</b></div>
          <div class="fila"><span>Chat de WhatsApp</span><b>${pct(porCanal((p) => p.canal === "WhatsApp"))}</b></div></div>
        <div class="dcaja"><h5>Clientes que más repiten (este mes)</h5>
          ${Object.entries(clientes).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v], i) => `<div class="fila"><span>${esc(k)}</span><b>${v + 6 - i} pedidos</b></div>`).join("")}
          <div class="fila"><span>🎁 Almuerzos gratis entregados este mes</span><b>23</b></div>
          <p class="nota-mini">Cada cliente lleva su tarjeta de sellos con su número de WhatsApp: el décimo almuerzo es gratis.</p></div>
        ${comparar}
      </div>
      <p class="nota-mini">Datos de ejemplo de un día. Los pedidos que haga en la demo se suman aquí al instante.</p>
    </div>`;
}
function vistaEmpresas() {
  const filas = D.empresas.map((e) => {
    const hoy = D.pedidos.filter((p) => p.empresa === e.id && p.n);
    const t = r2(e.mesTotal + hoy.reduce((a, p) => a + p.total, 0)), n = e.mesPedidos + hoy.length;
    return `<tr><td><b>${esc(e.nombre)}</b><br><small>${esc(e.contacto)} · ${esc(e.fonda)}</small></td><td>${e.empleados}</td><td>${n}</td><td><b>${B(t)}</b></td>
      <td>${e.estado === "Aprobada" ? '<span class="tag tg-v">Aprobada</span>' : `<button class="tag tg-y" data-act="aprobar" data-arg="${e.id}">Por aprobar · Aprobar</button>`}</td>
      <td>${e.estado === "Aprobada" ? `<button class="mini-btn" data-act="factura-mes" data-arg="${e.id}">Factura del mes</button>` : ""}</td></tr>`;
  }).join("");
  return `<div class="mg-bar"><h3>Cuentas de empresa</h3><div class="f"><span>Noviembre</span></div></div>
    <div class="empresas"><p style="font-size:13.5px;color:var(--gris);margin-bottom:10px">Las empresas aprobadas piden durante el mes con <b>«🏢 Empresa»</b> al pagar. No pagan pedido por pedido: reciben <b>una sola factura con RUC a fin de mes</b>. Mamá Gallina decide a quién aprueba y con qué tope.</p>
    <table class="tabla"><tr><th>Empresa</th><th>Empleados</th><th>Pedidos del mes</th><th>Consumo</th><th>Estado</th><th></th></tr>${filas}</table></div>`;
}
function vistaGuia() {
  return `<div class="guia"><h3>Cómo probar la demo</h3><ol>
    <li><b>Pedido normal:</b> en el teléfono toque "Buenas, quiero pedir 4 almuerzos…", escoja la fonda y toque <b>Ver menú y pedir</b>. Arme platos con nombres distintos y pague. El pedido aparece solo en <b>Kommo</b> y en la <b>Cocina</b>.</li>
    <li><b>Cocina:</b> toque <b>Empezar</b> y <b>Marcar listo</b>. Al cliente le llegan los mensajes y el número sale en la <b>Pantalla de listos</b>. O active <b>Simular cocina sola</b>.</li>
    <li><b>Pedido compartido:</b> en el menú toque <b>¿Pedido para la oficina?</b>, luego <b>Simular que los compañeros piden</b>, agregue su plato y cierre. Sale un solo pedido con todos los platos.</li>
    <li><b>Cuenta de empresa:</b> al pagar, escoja <b>🏢 Empresa</b>. Vea la pestaña <b>Empresas</b> y toque <b>Factura del mes</b>.</li>
    <li><b>Chat de Kommo:</b> escriba en el teléfono "Mándame 2 sopas de pata con arroz". En <b>Kommo</b> toque ese chat, contéstele o use <b>Armar pedido con precio exacto</b>: al cliente le llega el enlace de pago en su WhatsApp.</li>
    <li><b>Panel del dueño:</b> ventas, platos que más salen, horas pico y cómo pagan, por fonda o las dos juntas.</li>
    <li><b>Menú del día:</b> apague un plato y vea que sale agotado en el teléfono.</li></ol>
    <div class="caja">Es una simulación: no hay servidor, no se cobra nada y lo que se haga queda solo en este navegador. Para empezar de cero, toque <b>Reiniciar demo</b> arriba.</div></div>`;
}
function pintarMG() {
  $("#mg-tabs").innerHTML = MG_TABS.map(([id, t]) => `<button class="${S.mgTab === id ? "on" : ""}" data-act="mg-tab" data-arg="${id}">${t}</button>`).join("");
  const v = { kommo: vistaKommo, cocina: vistaCocina, tv: vistaTV, menu: vistaPanelMenu, dueno: vistaDueno, empresas: vistaEmpresas, guia: vistaGuia }[S.mgTab] || vistaKommo;
  const k = $(".kommo"); const sc = k ? k.scrollLeft : 0;
  $("#mg").innerHTML = v();
  if ($(".kommo")) $(".kommo").scrollLeft = sc;
  if (chatAbierto) pintarChatKommo();
}
let toastTimer = null;
function toastMG(t) { const el = $("#toast-mg"); el.textContent = t; el.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => (el.hidden = true), 3800); }
function modal(html) { const m = $("#modal"); m.innerHTML = `<div class="caja-m">${html}</div>`; m.hidden = false; }
function cerrarModal() { $("#modal").hidden = true; chatAbierto = null; }

// ───────── Chat de Kommo (lo que ve la muchacha)
let chatAbierto = null, armado = [];
const RESPUESTAS = ["¡Hola! Sí, hoy hay 😊", "Hoy no nos queda, ¿le ofrezco otra cosa?", "Ya le paso el enlace del menú", "¿A qué hora pasa a retirar?"];
function pintarChatKommo() {
  const c = D.pedidos.find((p) => p.id === chatAbierto); if (!c) { cerrarModal(); return; }
  const opciones = PLATOS.filter((p) => !D.agotados.includes(p.id)).map((p) => `<option value="${p.id}">${esc(p.nombre)} · ${B(p.tipo === "sopa" ? p.conArroz : p.precio)}${p.tipo === "sopa" ? " (con arroz)" : ""}</option>`).join("");
  const sub = armado.reduce((a, x) => a + x.precio * x.cant, 0);
  modal(`<div class="kchat-cab"><div><h3>${esc(c.nombre)}</h3><div class="sub2">WhatsApp · ${esc(c.fonda)} · ${c.atiende ? "lo atiende " + esc(c.atiende) : "sin asignar"}</div></div><button class="mini-btn" data-act="cerrar">Cerrar</button></div>
    <div class="kchat">${c.log.map((m) => `<div class="m ${m.de === "c" ? "in" : "out"}">${m.de === "c" ? "" : `<b style="font-size:11.5px;color:#2f6b2e">${esc(m.quien || "Muchacha")}</b>\n`}${m.html || esc(m.texto)}<div class="t">${m.t}</div></div>`).join("")}</div>
    <div class="rapidas">${RESPUESTAS.map((r) => `<button data-act="k-rapida" data-arg="${esc(r)}">${esc(r)}</button>`).join("")}<button data-act="k-enlace">🍽 Mandar enlace del menú</button></div>
    <form class="kchat-in" data-form="kchat"><input id="kchat-in" placeholder="Escriba como Yeni (muchacha de turno)…" autocomplete="off"><button type="submit">Enviar</button></form>
    <details class="armar" ${armado.length ? "open" : ""}><summary>🧮 Armar pedido con precio exacto (sin cotizar a mano)</summary>
      <div class="armar-fila"><select id="armar-plato">${opciones}</select><input id="armar-cant" type="number" min="1" max="20" value="2"><button class="mini-btn" data-act="armar-agregar">Agregar</button></div>
      ${armado.map((x, i) => `<div class="fila"><span>${x.cant} × ${esc(x.nombre)}</span><span>${B(x.precio * x.cant)} <button class="q" data-act="armar-quitar" data-arg="${i}">✕</button></span></div>`).join("")}
      ${armado.length ? `<div class="fila"><b>Total exacto</b><b>${B(sub)}</b></div><div class="armar-fila"><span>Retira a las</span><select id="armar-hora"><option>12:15</option><option selected>12:30</option><option>12:45</option><option>13:00</option></select><button class="mini-btn verde" data-act="armar-enviar">💳 Mandar enlace de pago</button></div>` : ""}
    </details>`);
  const k = $(".kchat"); if (k) k.scrollTop = k.scrollHeight;
}
function responderKommo(c, texto, html) {
  c.log.push({ de: "mg", texto, html, t: ahora(), quien: "Yeni" });
  c.atiende = c.atiende || "Yeni (usted)";
  guardar();
}

// ───────── Cambios de estado y avisos al cliente
function cambiarEstado(clave, estado) {
  const p = buscarPedido(clave); if (!p) return;
  p.estado = estado; p.fresco = false; p.ultimoCambio = Date.now(); if (estado === "cocina") p.creado = Date.now();
  guardar();
}
function alCambiar() {
  D.pedidos.filter((p) => p.n && p.tab === TAB).forEach((p) => {
    const k = clavePed(p); if (S.avisados[k] === p.estado) return;
    const antes = S.avisados[k]; S.avisados[k] = p.estado;
    if (!antes && p.estado === "porpagar") return;
    if (p.estado === "pagado" && antes === "porpagar") bot(`✅ <b>Pedido ${num3(p.n)} pagado</b> · ${B(p.total)}\n📍 Retira ${p.hora} en ${esc(p.fonda)}, ventanilla express`, {}, 300);
    if (p.estado === "cocina") bot(`👨‍🍳 Su pedido ${num3(p.n)} ya está en la cocina.`, {}, 300);
    if (p.estado === "listo") bot(`🔔 <b>¡Pedido ${num3(p.n)} listo!</b> Pase a la ventanilla express y diga su número. Ya está pagado.`, {}, 300);
    if (p.estado === "entregado") bot("¡Gracias por pedir en Mamá Gallina! ¿Cómo estuvo su almuerzo? ⭐⭐⭐⭐⭐", {}, 300);
  });
  // Respuestas que las muchachas mandan desde Kommo
  D.pedidos.filter((p) => p.tab === TAB && p.log).forEach((c) => {
    const visto = S.visto[c.id] || 0;
    c.log.slice(visto).forEach((m) => { if (m.de === "mg") bot(`<b style="color:#2f6b2e">${esc(m.quien || "Mamá Gallina")}</b>\n${m.html || esc(m.texto)}`, m.botones ? { botones: m.botones } : {}, 400); });
    S.visto[c.id] = c.log.length;
  });
  guardarTel(); pintarMG(); if (["listo", "grupo"].includes(S.pantalla)) pintarTel();
}
function crearPedido() {
  const f = S.fonda, n = D.next[f]++;
  const mios = S.carrito.map((c) => ({ persona: c.persona, nombre: platoPor(c.id).nombre, precio: c.precio, desc: c.desc }));
  const otros = S.grupo ? S.grupo.otros.map((o) => ({ persona: o.persona, nombre: o.nombre, precio: o.precio, desc: o.desc })) : [];
  const platos = [...mios, ...otros];
  const desc = descuentoPremio(); if (desc) platos.push({ persona: "Premio", nombre: "Almuerzo gratis (cliente frecuente)", precio: -desc, desc: "" });
  const empresa = S.pago === "Empresa" ? S.empresa : null;
  D.ocupados[f] = D.ocupados[f] || {}; D.ocupados[f][S.hora] = (D.ocupados[f][S.hora] || 0) + 1;
  const nombre = S.grupo ? "Compartido · " + S.carrito[0].persona : platos.length > 1 ? "Oficina · " + platos[0].persona : platos[0].persona;
  const pago = empresa ? "Cuenta de empresa" : S.pago === "Tarjeta" ? "Tarjeta" : "Yappy";
  const chat = miChat(); if (chat) D.pedidos = D.pedidos.filter((p) => p !== chat);
  D.pedidos.push({ n, fonda: f, nombre, estado: "pagado", canal: "Web", pago, empresa, compartido: !!S.grupo, hora: S.hora, platos, total: r2(platos.reduce((a, p) => a + p.precio, 0)), creado: Date.now(), tab: TAB, fresco: true, ruc: S.ruc, cliente: platos[0].persona });
  S.avisados[`${f}|${n}`] = "pagado"; S.ultimo = n; S.fondaUltimo = f;
  const lineas = platos.map((p) => `• ${esc(p.persona)}: ${esc(p.nombre)}${p.desc ? ", " + esc(p.desc.toLowerCase()) : ""}`).join("\n");
  const cab = empresa ? `🏢 <b>Pedido ${num3(n)} cargado a la cuenta de la empresa</b>` : S.grupo ? `👥 <b>Pedido compartido ${num3(n)} cerrado</b> · todos pagaron` : `✅ <b>Pedido ${num3(n)} pagado</b>`;
  msg("in", `${cab} · ${B(platos.reduce((a, p) => a + p.precio, 0))}\n${lineas}\n📍 Retira ${S.hora} en ${esc(f)}, ventanilla express${desc ? "" : `\n⭐ Lleva ${Math.min(10, S.sellos + 1)} de 10 para su almuerzo gratis`}`);
  if (desc) { S.premio = false; S.usarPremio = true; }
  else { S.sellos += 1; if (S.sellos >= 10) { S.sellos = 0; S.premio = true; setTimeout(() => bot("🎁 <b>¡Completó 10 pedidos!</b> Su próximo almuerzo va por la casa. Se descuenta solo cuando pague."), 1800); } }
  S.ultimoCarrito = S.carrito.slice(); S.carrito = []; S.grupo = null; S.pantalla = "listo";
  guardar(); toastMG(`Nuevo pedido ${num3(n)} (${f}): entró solo a Kommo y a la cocina.`);
  setTimeout(() => { const p = D.pedidos.find((x) => x.n === n && x.fonda === f); if (p && p.fresco) { p.fresco = false; guardarEn(localStorage, CLAVE, D); } }, 4000);
}

// Cocina automática y relojes
setInterval(() => {
  if (!S.auto) return;
  const p = D.pedidos.filter((x) => x.n && x.tab === TAB && ["pagado", "cocina"].includes(x.estado)).sort((a, b) => a.creado - b.creado)[0];
  if (!p) return;
  if (Date.now() - (p.ultimoCambio || p.creado) > (p.estado === "pagado" ? 5000 : 9000)) cambiarEstado(clavePed(p), p.estado === "pagado" ? "cocina" : "listo");
}, 1500);
setInterval(() => { if (["kommo", "cocina"].includes(S.mgTab) && !chatAbierto) pintarMG(); }, 20000);

// ───────── Eventos
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-act]"); if (!b) { if (e.target.id === "modal") cerrarModal(); return; }
  const act = b.dataset.act, arg = b.dataset.arg;
  switch (act) {
    case "vista": S.vista = arg; $("#escenario").dataset.vista = arg; document.querySelectorAll(".tabs-movil button").forEach((x) => x.classList.toggle("on", x.dataset.arg === arg)); guardarTel(); return;
    case "reiniciar": if (confirm("¿Borrar todo y empezar la demo de cero?")) { try { localStorage.removeItem(CLAVE); sessionStorage.removeItem(CLAVE + "-tel"); } catch (x) { /* nada */ } location.reload(); } return;
    case "sug": enviar(arg); return;
    case "fonda": {
      const m = S.chat[+b.dataset.msg]; if (m && m.botones) m.botones.forEach((x) => (x.usado = true));
      S.fonda = arg; S.mgFonda = arg; msg("out", "📍 " + esc(arg)); const en = enlaceMenu(); bot(en.html, { botones: en.botones }); pintarMG(); return;
    }
    case "abrir-menu": if (!S.fonda) { S.fonda = S.mgFonda; } S.pantalla = "menu"; S.cat = null; S.busca = ""; break;
    case "ir": S.pantalla = arg; break;
    case "cat": S.cat = arg || null; S.busca = ""; break;
    case "plato": S.editando = { id: arg, persona: "", sel: {} }; S.pantalla = "plato"; break;
    case "op": {
      const [g, i] = arg.split(":"); const grupo = gruposDe(platoPor(S.editando.id)).find((x) => x.id === g);
      if (grupo.tipo === "radio") S.editando.sel[g] = +i;
      else { const s = new Set(S.editando.sel[g] || []); s.has(+i) ? s.delete(+i) : s.add(+i); S.editando.sel[g] = [...s]; }
      const y = $("#tel .scroll").scrollTop; pintarTel(); $("#tel .scroll").scrollTop = y; guardarTel(); return;
    }
    case "agregar": {
      const ed = S.editando, { precio, desc } = precioEdit(ed);
      S.carrito.push({ id: ed.id, persona: ed.persona.trim() || (S.grupo ? "Usted" : "Plato " + (S.carrito.length + 1)), sel: ed.sel, precio, desc });
      S.editando = null; S.pantalla = S.grupo ? "grupo" : "menu"; break;
    }
    case "ver-carrito": S.pantalla = "carrito"; break;
    case "quitar": S.carrito.splice(+arg, 1); break;
    case "postre": { const pl = platoPor(arg); S.carrito.push({ id: arg, persona: "Para todos", sel: {}, precio: pl.precio, desc: "Postre" }); break; }
    case "hora": S.hora = arg; break;
    case "usar-premio": S.usarPremio = !S.usarPremio; break;
    case "semana": {
      const filas = [1, 2, 3, 4, 5, 6].map((d) => `<div class="fila${d === DIA_HOY ? " hoy" : ""}"><b>${DIAS[d]}${d === DIA_HOY ? " (hoy)" : ""}</b><span>${MENU_SEMANA[d].map((id) => esc(platoPor(id).nombre)).join(", ")}</span></div>`).join("");
      modal(`<h3>Menú de la semana</h3><div class="sub2">Platos de comida completa y pescados. Las sopas, arroces, desayunos, bebidas y postres están todos los días. (Ejemplo)</div><div class="recibo semana">${filas}</div><div class="acciones"><button data-act="cerrar">Cerrar</button></div>`);
      return;
    }
    case "pago": S.pago = arg; break;
    case "ruc": S.ruc = !S.ruc; break;
    case "pagar": if (S.pago === "Empresa") { crearPedido(); break; } S.pagandoOrden = null; S.pantalla = "pago"; break;
    case "confirmar-pago":
      S.procesando = true; pintarTel();
      setTimeout(() => {
        S.procesando = false;
        if (S.pagandoOrden) {
          const p = D.pedidos.find((x) => x.n === S.pagandoOrden && x.tab === TAB);
          if (p) { p.estado = "pagado"; p.pago = S.pago === "Tarjeta" ? "Tarjeta" : "Yappy"; p.creado = Date.now(); p.fresco = true; S.ultimo = p.n; S.fondaUltimo = p.fonda; }
          S.chat.forEach((m) => (m.botones || []).forEach((x) => { if (x.act === "pagar-orden" && +x.arg === S.pagandoOrden) { x.usado = true; x.txt = "✓ Pagado"; } }));
          S.pagandoOrden = null; S.pantalla = "listo"; guardar(); toastMG(`El pedido del chat se pagó con el enlace: pasó solo a «Pagado».`);
        } else crearPedido();
        pintarTel();
      }, 1300);
      return;
    case "pagar-orden": { const p = D.pedidos.find((x) => x.n === +arg && x.tab === TAB); if (!p || p.estado !== "porpagar") { toastMG("Ese pedido ya está pagado."); return; } S.pagandoOrden = p.n; S.fonda = p.fonda; S.pago = "Yappy"; S.pantalla = "pago"; break; }
    case "nuevo-pedido": S.pantalla = "menu"; S.cat = null; break;
    case "guardar-oficina": S.guardado = S.ultimoCarrito; break;
    case "repetir": S.carrito = S.guardado.map((c) => ({ ...c })); S.pantalla = "carrito"; break;
    case "grupo-nuevo": S.grupo = { codigo: "OF-" + Math.floor(1000 + Math.random() * 9000), cierre: "11:00", otros: [] }; S.pantalla = "grupo"; break;
    case "grupo-cancelar": S.grupo = null; S.pantalla = "menu"; break;
    case "compartir": toastMG("Simulación: el enlace se mandaría al grupo de WhatsApp de la oficina."); return;
    case "simular-companeros": {
      const gente = [["Carlos", "sopa-pollo", "Con arroz", 3.5, "Yappy"], ["María", "pescado-frito", "Repollo y zanahoria", 6.5, "Tarjeta"], ["José", "guacho-rabito", "+ jugo natural", 5.75, "Yappy"], ["Kathia", "pollo-apanado", "Ensalada de papa", 4.75, "Yappy"]];
      const ya = S.grupo.otros.map((o) => o.persona); const sig = gente.filter((g) => !ya.includes(g[0])).slice(0, 2);
      sig.forEach(([persona, id, desc, precio, pago]) => S.grupo.otros.push({ persona, nombre: platoPor(id).nombre, desc, precio, pago }));
      avisoTel(`${sig.map((s) => s[0]).join(" y ")} se unieron a su pedido compartido y ya pagaron su parte.`); break;
    }
    case "recibo": {
      const p = buscarPedido(arg);
      modal(`<h3>Comprobante · ${num3(p.n)}</h3><div class="sub2">Mamá Gallina ${esc(p.fonda)} · ${p.hora} · ${esc(p.compartido ? "Compartido" : p.pago)}</div><div class="recibo">${p.platos.map((x) => `<div class="fila"><span>${esc(x.persona)} · ${esc(x.nombre)}</span><b>${x.precio.toFixed(2)}</b></div>`).join("")}<div class="fila"><b>Total</b><b>${B(p.total)}</b></div></div><p class="sub2" style="margin-top:8px">La factura electrónica sale del sistema de facturación de Mamá Gallina con estos mismos datos.</p><div class="acciones"><button data-act="cerrar">Cerrar</button></div>`);
      return;
    }
    case "cerrar": cerrarModal(); return;
    // ── Mamá Gallina
    case "mg-tab": S.mgTab = arg; guardarTel(); pintarMG(); return;
    case "mg-fonda": S.mgFonda = arg; guardarTel(); pintarMG(); return;
    case "dueno-fonda": S.duenoFonda = arg; guardarTel(); pintarMG(); return;
    case "estado": { const [f, n, est] = arg.split("|"); cambiarEstado(`${f}|${n}`, est); return; }
    case "auto": S.auto = !S.auto; guardarTel(); pintarMG(); return;
    case "etiquetas": {
      const p = buscarPedido(arg);
      modal(`<h3>Etiquetas · ${num3(p.n)}</h3><div class="sub2">Se imprimen en la impresora térmica, una por envase.</div><div class="etiquetas">${p.platos.filter((x) => x.precio >= 0).map((x) => `<div class="etq"><div class="n">${num3(p.n)} · ${p.hora} · ${esc(p.fonda).toUpperCase()}</div><div class="q">${esc(x.persona).toUpperCase()}</div>${esc(x.nombre)}${x.desc ? "<br>" + esc(x.desc) : ""}</div>`).join("")}</div><div class="acciones"><button data-act="cerrar">Listo</button></div>`);
      return;
    }
    case "ver-pedido": {
      const p = buscarPedido(arg); if (!p) return;
      const sig = { pagado: "cocina", cocina: "listo", listo: "entregado" }[p.estado];
      const nom = { cocina: "En cocina", listo: "Listo", entregado: "Entregado" }[sig];
      modal(`<h3>${num3(p.n)} ${esc(nombreCorto(p))}</h3><div class="sub2">${esc(p.fonda)} · retira ${p.hora} · ${esc(p.canal)} · ${esc(p.estado === "porpagar" ? "esperando pago" : p.compartido ? "compartido" : p.pago)}</div><div class="recibo">${p.platos.map((x) => `<div class="fila"><span><b>${esc(x.persona)}</b> · ${esc(x.nombre)}${x.desc ? `<br><small style="color:var(--gris)">${esc(x.desc)}</small>` : ""}</span><b>${x.precio.toFixed(2)}</b></div>`).join("")}<div class="fila"><b>Total</b><b>${B(p.total)}</b></div></div>
        <div class="acciones">${sig ? `<button data-act="mover" data-arg="${clavePed(p)}|${sig}">Mover a «${nom}»</button>` : ""}<button class="sec2" data-act="cerrar">Cerrar</button></div>`);
      return;
    }
    case "mover": { const [f, n, est] = arg.split("|"); cambiarEstado(`${f}|${n}`, est); cerrarModal(); return; }
    case "ver-chat": chatAbierto = arg; armado = []; pintarChatKommo(); return;
    case "k-rapida": { const c = D.pedidos.find((p) => p.id === chatAbierto); if (c) responderKommo(c, arg); return; }
    case "k-enlace": {
      const c = D.pedidos.find((p) => p.id === chatAbierto); if (!c) return;
      c.log.push({ de: "mg", texto: "Aquí está el menú de hoy, arme su pedido y le sale el precio exacto 👉 pidemamagallina.com", t: ahora(), quien: "Yeni", botones: [{ txt: "🍽 Ver menú y pedir", act: "abrir-menu" }] });
      c.atiende = c.atiende || "Yeni (usted)"; guardar(); return;
    }
    case "armar-agregar": {
      const pl = platoPor($("#armar-plato").value), cant = Math.max(1, Math.min(20, +$("#armar-cant").value || 1));
      armado.push({ id: pl.id, nombre: pl.nombre + (pl.tipo === "sopa" ? " con arroz" : ""), precio: pl.tipo === "sopa" ? pl.conArroz : pl.precio, cant }); pintarChatKommo(); return;
    }
    case "armar-quitar": armado.splice(+arg, 1); pintarChatKommo(); return;
    case "armar-enviar": {
      const c = D.pedidos.find((p) => p.id === chatAbierto); if (!c || !armado.length) return;
      const n = D.next[c.fonda]++, hora = $("#armar-hora").value;
      D.ocupados[c.fonda] = D.ocupados[c.fonda] || {}; D.ocupados[c.fonda][hora] = (D.ocupados[c.fonda][hora] || 0) + 1;
      const platos = []; armado.forEach((x) => { for (let i = 0; i < x.cant; i++) platos.push({ persona: c.nombre.replace(" (demo)", ""), nombre: x.nombre, precio: x.precio, desc: "" }); });
      const total = r2(platos.reduce((a, p) => a + p.precio, 0));
      D.pedidos.push({ n, fonda: c.fonda, nombre: c.nombre.replace(" (demo)", ""), estado: "porpagar", canal: "WhatsApp", pago: null, hora, platos, total, creado: Date.now(), tab: c.tab, cliente: c.nombre });
      const detalle = armado.map((x) => `${x.cant} × ${x.nombre} · ${B(x.precio * x.cant)}`).join("\n");
      c.log.push({ de: "mg", texto: `Listo, su pedido ${num3(n)}:\n${detalle}\nTotal exacto: ${B(total)} · retira ${hora}\nPague aquí y se lo preparamos 👇`, t: ahora(), quien: "Yeni", botones: [{ txt: `💳 Pagar ${B(total)}`, act: "pagar-orden", arg: String(n) }] });
      c.estado = "cerrado"; armado = []; cerrarModal(); guardar();
      toastMG(`Pedido ${num3(n)} en «Por pagar»: el cliente recibió el enlace con el precio exacto.`);
      return;
    }
    case "agotar": { const i = D.agotados.indexOf(arg); i >= 0 ? D.agotados.splice(i, 1) : D.agotados.push(arg); guardar(); if (S.pantalla === "menu") { S.mantenerScroll = true; pintarTel(); } return; }
    case "cupo": D.cupo = Math.max(1, D.cupo + +arg); guardar(); return;
    case "copiar-menu": toastMG("Listo: se copió el menú de ayer. Solo falta apagar lo que no hay."); return;
    case "aprobar": { const e = D.empresas.find((x) => x.id === arg); e.estado = "Aprobada"; guardar(); toastMG(`${e.nombre} ya puede pedir con cuenta de empresa.`); return; }
    case "factura-mes": {
      const e = D.empresas.find((x) => x.id === arg), hoy = D.pedidos.filter((p) => p.empresa === e.id && p.n);
      const t = r2(e.mesTotal + hoy.reduce((a, p) => a + p.total, 0));
      modal(`<h3>Factura del mes · ${esc(e.nombre)}</h3><div class="sub2">Noviembre · ${e.mesPedidos + hoy.length} pedidos · factura electrónica con RUC (ejemplo)</div><div class="recibo">
        <div class="fila"><span>Pedidos del 1 al 12 de noviembre</span><b>${e.mesTotal.toFixed(2)}</b></div>
        ${hoy.map((p) => `<div class="fila"><span>${num3(p.n)} · ${esc(p.fonda)} · ${p.platos.length} plato${p.platos.length === 1 ? "" : "s"}</span><b>${p.total.toFixed(2)}</b></div>`).join("")}
        <div class="fila"><b>Total a facturar</b><b>${B(t)}</b></div></div>
        <p class="sub2" style="margin-top:8px">Se manda a ${esc(e.contacto)} el último día del mes, con el detalle de quién pidió qué. Se puede pagar por transferencia o Yappy.</p><div class="acciones"><button data-act="cerrar">Cerrar</button></div>`);
      return;
    }
  }
  guardarTel(); pintarTel();
});
document.addEventListener("submit", (e) => {
  if (e.target.dataset.form === "chat") { e.preventDefault(); const i = $("#chat-in"); const t = i.value; i.value = ""; enviar(t); setTimeout(() => $("#chat-in") && $("#chat-in").focus(), 0); }
  if (e.target.dataset.form === "kchat") { e.preventDefault(); const t = $("#kchat-in").value.trim(); const c = D.pedidos.find((p) => p.id === chatAbierto); if (t && c) responderKommo(c, t); }
});
document.addEventListener("input", (e) => {
  if (e.target.id === "busca") { S.busca = e.target.value; $("#menu-lista").innerHTML = listaMenu(); }
  if (e.target.id === "persona" && S.editando) { S.editando.persona = e.target.value; $("#lbl-agregar").textContent = "Agregar plato de " + (e.target.value.trim() || "…"); guardarTel(); }
});

// Arranque
$("#escenario").dataset.vista = S.vista;
document.querySelectorAll(".tabs-movil button").forEach((x) => x.classList.toggle("on", x.dataset.arg === S.vista));
if (S.pantalla === "pago") S.pantalla = S.pagandoOrden ? "chat" : "carrito";
pintarTel(); pintarMG();
