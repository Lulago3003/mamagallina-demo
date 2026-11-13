// Menú de Mamá Gallina para la demo. Platos y precios sacados del menú QR de Obarrio (nov. 2024).
// tipo: completa (comida completa), sopa (con o sin arroz), plato, bebida, postre, desayuno.
const CATEGORIAS = [
  { id: "completa", nombre: "Comida completa", foto: "fotos/completa.jpg", nota: "Arroz blanco, menestra, presa, ensalada y tajada" },
  { id: "sopas", nombre: "Sopas", foto: "fotos/sancocho.jpg" },
  { id: "pescados", nombre: "Pescados y mariscos", foto: "fotos/filete-apanado.jpg", nota: "Comida completa" },
  { id: "arroces", nombre: "Arroces y pastas", foto: "fotos/arroz-pollo.jpg" },
  { id: "noche", nombre: "Pa'la noche", foto: "fotos/patacon.jpg" },
  { id: "desayunos", nombre: "Desayunos", foto: "fotos/desayuno.jpg" },
  { id: "acomp", nombre: "Acompañantes", foto: "fotos/ensalada.jpg" },
  { id: "bebidas", nombre: "Bebidas", foto: "fotos/chicha.jpg" },
  { id: "postres", nombre: "Postres", foto: "fotos/flan.jpg" },
];

const COMPLETA = "Arroz blanco, menestra, presa, ensalada y tajada";

const PLATOS = [
  // Comida completa
  { id: "pollo-guisado", cat: "completa", nombre: "Pollo guisado", desc: COMPLETA, precio: 3.5, tipo: "completa", foto: "fotos/pollo.jpg", top: true },
  { id: "carne-guisada", cat: "completa", nombre: "Carne guisada", desc: COMPLETA, precio: 4.0, tipo: "completa", foto: "fotos/carne-guisada.jpg", ia: true },
  { id: "pollo-apanado", cat: "completa", nombre: "Pollo apanado", desc: COMPLETA, precio: 4.75, tipo: "completa", foto: "fotos/pollo-apanado.jpg", ia: true },
  { id: "bistec-picado", cat: "completa", nombre: "Bistec picado con brócoli y zanahoria", desc: COMPLETA, precio: 4.75, tipo: "completa", foto: "fotos/bistec-picado.jpg", ia: true },
  { id: "ropa-vieja", cat: "completa", nombre: "Ropa vieja a la criolla", desc: COMPLETA, precio: 4.75, tipo: "completa", foto: "fotos/ropa-vieja.jpg", ia: true },
  { id: "mondongo", cat: "completa", nombre: "Mondongo a la culona", desc: COMPLETA, precio: 4.75, tipo: "completa", foto: "fotos/mondongo.jpg", ia: true },
  { id: "carne-frita", cat: "completa", nombre: "Carne frita", desc: COMPLETA, precio: 5.0, tipo: "completa", foto: "fotos/carne-frita.jpg", ia: true },
  { id: "bistec-entero", cat: "completa", nombre: "Bistec entero encebollado", desc: COMPLETA, precio: 5.5, tipo: "completa", foto: "fotos/bistec-entero.jpg", ia: true, top: true },
  { id: "filete-pechuga", cat: "completa", nombre: "Filete de pechuga en la salsa del día", desc: COMPLETA, precio: 5.5, tipo: "completa", foto: "fotos/filete-pechuga.jpg", ia: true },
  { id: "gallina-dura", cat: "completa", nombre: "Gallina dura guisada", desc: COMPLETA, precio: 5.5, tipo: "completa", foto: "fotos/gallina-dura.jpg", ia: true },
  { id: "puerco-guisado", cat: "completa", nombre: "Puerco guisado", desc: COMPLETA, precio: 5.5, tipo: "completa", foto: "fotos/puerco-guisado.jpg", ia: true },
  { id: "chuleta", cat: "completa", nombre: "Chuleta de cerdo guisada", desc: COMPLETA, precio: 5.75, tipo: "completa", foto: "fotos/chuleta.jpg", ia: true },
  { id: "lengua", cat: "completa", nombre: "Lengua a la criolla", desc: COMPLETA, precio: 6.0, tipo: "completa", foto: "fotos/lengua.jpg", ia: true },
  { id: "carne-asada", cat: "completa", nombre: "Carne asada", desc: COMPLETA, precio: 6.0, tipo: "completa", foto: "fotos/carne-asada.jpg", ia: true },
  { id: "costilla", cat: "completa", nombre: "Costilla asada", desc: COMPLETA, precio: 6.5, tipo: "completa", foto: "fotos/costilla.jpg", ia: true },
  { id: "lechona", cat: "completa", nombre: "Lechona Mamá Gallina", desc: COMPLETA, precio: 6.5, tipo: "completa", foto: "fotos/lechona.jpg", ia: true },
  // Sopas (precio sin arroz; conArroz = precio con arroz)
  { id: "sopa-pollo", cat: "sopas", nombre: "Sopa de pollo", desc: "Con o sin arroz", precio: 3.0, conArroz: 3.5, tipo: "sopa", foto: "fotos/sancocho.jpg", top: true },
  { id: "sopa-pata", cat: "sopas", nombre: "Sopa de pata", desc: "Con o sin arroz", precio: 3.5, conArroz: 4.0, tipo: "sopa", foto: "fotos/sopa-pata.jpg", ia: true },
  { id: "sopa-costilla", cat: "sopas", nombre: "Sopa de costilla", desc: "Con o sin arroz", precio: 4.0, conArroz: 4.25, tipo: "sopa", foto: "fotos/sopa-costilla.jpg", ia: true },
  { id: "sopa-jarrete", cat: "sopas", nombre: "Sopa de jarrete con lentejas", desc: "Con o sin arroz", precio: 4.0, conArroz: 4.5, tipo: "sopa", foto: "fotos/sopa-jarrete.jpg", ia: true },
  { id: "sopa-gallina", cat: "sopas", nombre: "Sopa de gallina dura", desc: "Con o sin arroz", precio: 4.0, conArroz: 4.5, tipo: "sopa", foto: "fotos/sopa-gallina.jpg", ia: true },
  { id: "sopa-pescado", cat: "sopas", nombre: "Sopa de pescado", desc: "Con o sin arroz", precio: 4.0, conArroz: 4.5, tipo: "sopa", foto: "fotos/sopa-pescado.jpg", ia: true },
  { id: "guacho-rabito", cat: "sopas", nombre: "Guacho de rabito", desc: "Bien espeso, como en casa", precio: 4.25, tipo: "plato", foto: "fotos/guacho.jpg", top: true },
  { id: "guacho-mariscos", cat: "sopas", nombre: "Guacho de mariscos", desc: "Con mariscos del día", precio: 4.75, tipo: "plato", foto: "fotos/guacho-mariscos.jpg", ia: true },
  // Pescados y mariscos (comida completa)
  { id: "filete-apanado", cat: "pescados", nombre: "Filete de pescado apanado", desc: COMPLETA, precio: 6.0, tipo: "completa", foto: "fotos/filete-apanado.jpg", ia: true },
  { id: "pescado-frito", cat: "pescados", nombre: "Pescado frito en presa", desc: COMPLETA, precio: 6.5, tipo: "completa", foto: "fotos/pescado.jpg", top: true },
  { id: "bacalao", cat: "pescados", nombre: "Bacalao guisado con papas y zanahoria", desc: COMPLETA, precio: 7.0, tipo: "completa", foto: "fotos/bacalao.jpg", ia: true },
  { id: "camarones", cat: "pescados", nombre: "Camarones al ajillo o a la criolla", desc: COMPLETA, precio: 8.0, tipo: "completa", foto: "fotos/camarones.jpg", ia: true },
  { id: "pargo", cat: "pescados", nombre: "Pargo rojo a lo macho", desc: COMPLETA, precio: 9.0, tipo: "completa", foto: "fotos/pargo.jpg", ia: true },
  // Arroces y pastas
  { id: "arroz-pollo", cat: "arroces", nombre: "Arroz con pollo", desc: "Porción completa", precio: 4.0, tipo: "plato", foto: "fotos/arroz-pollo.jpg", ia: true },
  { id: "arroz-combinacion", cat: "arroces", nombre: "Arroz de combinación", desc: "Porción completa", precio: 4.0, tipo: "plato", emoji: "🍚" },
  { id: "arroz-camarones", cat: "arroces", nombre: "Arroz con camarones", desc: "Porción completa", precio: 5.0, tipo: "plato", emoji: "🍤" },
  { id: "macarrones", cat: "arroces", nombre: "Macarrones a la boloñesa", desc: "Porción completa", precio: 4.5, tipo: "plato", emoji: "🍝" },
  { id: "chow-mein", cat: "arroces", nombre: "Chow mein con pollo", desc: "Porción completa", precio: 4.5, tipo: "plato", emoji: "🍜" },
  // Pa'la noche
  { id: "papas-locas", cat: "noche", nombre: "Papas locas sencillas", desc: "Papas, queso gratinado, pollo, carne y salsa de la casa", precio: 6.0, tipo: "plato", emoji: "🍟" },
  { id: "patacon", cat: "noche", nombre: "Patacón sencillo", desc: "Queso gratinado, pollo, carne y salsa de la casa", precio: 7.0, tipo: "plato", foto: "fotos/patacon.jpg", ia: true, top: true },
  { id: "hamb-pollo", cat: "noche", nombre: "Hamburguesa de pollo", desc: "Pollo, bacon, queso, lechuga, tomate y cebolla morada", precio: 7.0, tipo: "plato", emoji: "🍔" },
  { id: "hamb-carne", cat: "noche", nombre: "Hamburguesa de carne", desc: "Carne, bacon, queso, lechuga, tomate y cebolla morada", precio: 8.0, tipo: "plato", emoji: "🍔" },
  { id: "picada", cat: "noche", nombre: "Picada", desc: "1/4 de pollo asado, chorizo, porción de puerco y 1 guarnición", precio: 10.5, tipo: "plato", emoji: "🍗" },
  // Desayunos
  { id: "tortilla-queso", cat: "desayunos", nombre: "Tortilla de maíz blanco con queso", desc: "Grande", precio: 2.25, tipo: "simple", foto: "fotos/desayuno.jpg", ia: true },
  { id: "carne-frita-des", cat: "desayunos", nombre: "Carne frita", desc: "Porción de desayuno", precio: 2.5, tipo: "simple", emoji: "🥩" },
  { id: "huevo-perico", cat: "desayunos", nombre: "Huevo perico", desc: "Porción", precio: 2.0, tipo: "simple", emoji: "🍳" },
  { id: "empanada", cat: "desayunos", nombre: "Empanada de maíz blanco", desc: "De carne o pollo", precio: 1.5, tipo: "simple", emoji: "🥟" },
  { id: "carimanola", cat: "desayunos", nombre: "Carimañola", desc: "Unidad", precio: 0.85, tipo: "simple", emoji: "🥟" },
  { id: "cafe", cat: "desayunos", nombre: "Café con leche 16 oz", desc: "Negro o con leche", precio: 1.65, tipo: "simple", emoji: "☕" },
  // Acompañantes
  { id: "ens-papa", cat: "acomp", nombre: "Ensalada de papa", desc: "Porción", precio: 1.5, tipo: "simple", emoji: "🥗" },
  { id: "ens-repollo", cat: "acomp", nombre: "Ensalada de repollo y zanahoria", desc: "Porción", precio: 1.5, tipo: "simple", foto: "fotos/ensalada.jpg" },
  { id: "tajadas", cat: "acomp", nombre: "Tajadas", desc: "3 unidades", precio: 0.5, tipo: "simple", emoji: "🍌" },
  { id: "platano-tentacion", cat: "acomp", nombre: "Plátano en tentación", desc: "1 unidad", precio: 1.0, tipo: "simple", emoji: "🍌" },
  { id: "patacones", cat: "acomp", nombre: "Patacones", desc: "4 unidades", precio: 1.0, tipo: "simple", emoji: "🟡" },
  { id: "papitas", cat: "acomp", nombre: "Papitas fritas", desc: "Porción", precio: 2.0, tipo: "simple", emoji: "🍟" },
  // Bebidas
  { id: "jugo", cat: "bebidas", nombre: "Jugo natural", desc: "Del día", precio: 1.5, tipo: "simple", foto: "fotos/chicha.jpg" },
  { id: "soda", cat: "bebidas", nombre: "Soda", desc: "Lata", precio: 1.5, tipo: "simple", emoji: "🥤" },
  { id: "batido", cat: "bebidas", nombre: "Batido", desc: "Pequeño", precio: 2.0, tipo: "simple", emoji: "🥤" },
  { id: "agua", cat: "bebidas", nombre: "Agua", desc: "Botella", precio: 1.0, tipo: "simple", emoji: "💧" },
  // Postres
  { id: "flan", cat: "postres", nombre: "Flan de la casa", desc: "Porción", precio: 2.5, tipo: "simple", foto: "fotos/flan.jpg", ia: true },
  { id: "arroz-leche", cat: "postres", nombre: "Arroz con leche", desc: "Porción", precio: 2.0, tipo: "simple", emoji: "🍚" },
  { id: "cocada", cat: "postres", nombre: "Cocada Mamá Gallina", desc: "Unidad", precio: 2.0, tipo: "simple", emoji: "🥥" },
  { id: "pie-pina", cat: "postres", nombre: "Pie de piña", desc: "Porción", precio: 1.5, tipo: "simple", emoji: "🥧" },
];

// Menú de la semana (ejemplo): los platos de comida completa y pescados cambian cada día, como lo publican en Instagram.
// Lo demás (sopas, arroces, pa'la noche, desayunos, acompañantes, bebidas y postres) está todos los días.
const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MENU_SEMANA = {
  1: ["pollo-guisado", "carne-guisada", "bistec-picado", "ropa-vieja", "filete-apanado"],
  2: ["pollo-guisado", "pollo-apanado", "mondongo", "puerco-guisado", "pescado-frito"],
  3: ["pollo-guisado", "carne-frita", "gallina-dura", "chuleta", "bacalao"],
  4: ["pollo-guisado", "bistec-entero", "lengua", "costilla", "camarones"],
  5: ["pollo-guisado", "carne-guisada", "filete-pechuga", "lechona", "pescado-frito", "pargo"],
  6: ["pollo-guisado", "carne-asada", "ropa-vieja", "chuleta", "pescado-frito"],
};
const DIA_HOY = new Date().getDay() || 6; // el domingo se muestra el menú del sábado
const CAMBIA_CADA_DIA = ["completa", "pescados"];
const hayHoy = (p) => !CAMBIA_CADA_DIA.includes(p.cat) || MENU_SEMANA[DIA_HOY].includes(p.id);

// Opciones por tipo de plato. p = lo que suma al precio.
function gruposDe(plato) {
  const extras = { id: "extra", titulo: "¿LE AGREGAMOS ALGO?", tipo: "check", ops: [
    { n: "Jugo natural", p: 1.5 }, { n: "Plátano en tentación", p: 1.0 }, { n: "Huevo frito", p: 0.5 }, { n: "Sin cebolla", p: 0, nota: "sin costo" } ] };
  if (plato.tipo === "completa") return [
    { id: "arroz", titulo: "ARROZ", tipo: "radio", ops: [
      { n: "Arroz blanco", p: 0, nota: "incluido" }, { n: "Arroz con guandú y coco", p: 1.0 }, { n: "Arroz con frijol y coco", p: 1.0 } ] },
    { id: "ens", titulo: "ENSALADA", tipo: "radio", ops: [
      { n: "Ensalada de papa", p: 0, nota: "incluida" }, { n: "Repollo y zanahoria", p: 0, nota: "incluida" }, { n: "Ensalada de codito", p: 0, nota: "incluida" } ] },
    extras ];
  if (plato.tipo === "sopa") return [
    { id: "arroz", titulo: "¿CON ARROZ?", tipo: "radio", ops: [
      { n: "Sin arroz", p: 0 }, { n: "Con arroz", p: +(plato.conArroz - plato.precio).toFixed(2) } ] },
    { id: "extra", titulo: "¿LE AGREGAMOS ALGO?", tipo: "check", ops: [ { n: "Jugo natural", p: 1.5 }, { n: "Patacones (4)", p: 1.0 } ] } ];
  if (plato.tipo === "plato") return [
    { id: "extra", titulo: "¿LE AGREGAMOS ALGO?", tipo: "check", ops: [ { n: "Jugo natural", p: 1.5 }, { n: "Papitas fritas", p: 2.0 }, { n: "Sin cebolla", p: 0, nota: "sin costo" } ] } ];
  return [];
}
