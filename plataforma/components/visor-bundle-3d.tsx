"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { zoomPermitido } from "@/lib/visor-entrada";
import { COLOR_EXTERNO, colorDeTipo, type GrafoFhir, type NodoFhir } from "@/lib/fhir-grafo";

type Props = {
  grafo: GrafoFhir;
  onSeleccion?: (nodo: NodoFhir | null) => void;
  /** Nodo que el padre tiene seleccionado; el visor lo resalta al montar y al cambiar. */
  seleccionId?: string | null;
};

const ITERACIONES = 300;
const PASOS_POR_CUADRO = 5;
const LARGO_RESORTE = 6;
const RADIO_NODO = 0.6;
const RADIO_NODO_PRINCIPAL = 0.9;
const COLOR_ARISTA = "#94A3B8";
const UMBRAL_ARRASTRE = 5;

/**
 * Layout de fuerzas en 3D: repulsion entre todos los pares, resorte en aristas, gravedad
 * suave al centro y amortiguacion. Posiciones iniciales en espiral (sin azar) para que el
 * resultado sea reproducible.
 */
function crearLayout(n: number, pares: [number, number][]) {
  const pos = new Float32Array(n * 3);
  const vel = new Float32Array(n * 3);
  const fuerza = new Float32Array(n * 3);
  const radioInicial = 4 * Math.cbrt(n) + 2;
  const anguloAureo = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = n > 1 ? 1 - (2 * (i + 0.5)) / n : 0;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const th = i * anguloAureo;
    pos[i * 3] = radioInicial * r * Math.cos(th);
    pos[i * 3 + 1] = radioInicial * y;
    pos[i * 3 + 2] = radioInicial * r * Math.sin(th);
  }

  const REPULSION = 30;
  const RIGIDEZ = 0.08;
  const GRAVEDAD = 0.02;
  const AMORTIGUACION = 0.85;
  const PASO_MAX = 1;

  function paso(alfa: number) {
    fuerza.fill(0);
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = pos[i * 3] - pos[j * 3];
        const dy = pos[i * 3 + 1] - pos[j * 3 + 1];
        const dz = pos[i * 3 + 2] - pos[j * 3 + 2];
        const d2 = Math.max(dx * dx + dy * dy + dz * dz, 0.01);
        const d = Math.sqrt(d2);
        const f = REPULSION / (d2 * d);
        fuerza[i * 3] += dx * f;
        fuerza[i * 3 + 1] += dy * f;
        fuerza[i * 3 + 2] += dz * f;
        fuerza[j * 3] -= dx * f;
        fuerza[j * 3 + 1] -= dy * f;
        fuerza[j * 3 + 2] -= dz * f;
      }
    }
    for (const [a, b] of pares) {
      const dx = pos[b * 3] - pos[a * 3];
      const dy = pos[b * 3 + 1] - pos[a * 3 + 1];
      const dz = pos[b * 3 + 2] - pos[a * 3 + 2];
      const d = Math.max(Math.sqrt(dx * dx + dy * dy + dz * dz), 0.01);
      const f = (RIGIDEZ * (d - LARGO_RESORTE)) / d;
      fuerza[a * 3] += dx * f;
      fuerza[a * 3 + 1] += dy * f;
      fuerza[a * 3 + 2] += dz * f;
      fuerza[b * 3] -= dx * f;
      fuerza[b * 3 + 1] -= dy * f;
      fuerza[b * 3 + 2] -= dz * f;
    }
    for (let k = 0; k < n * 3; k++) {
      fuerza[k] -= GRAVEDAD * pos[k];
      vel[k] = (vel[k] + fuerza[k] * alfa) * AMORTIGUACION;
      pos[k] += Math.max(-PASO_MAX, Math.min(PASO_MAX, vel[k]));
    }
  }

  return { pos, paso };
}

function crearEtiqueta(texto: string): { sprite: THREE.Sprite; relacion: number } {
  const fuente = "600 26px Inter, ui-sans-serif, system-ui, sans-serif";
  const medidor = document.createElement("canvas").getContext("2d");
  let ancho = 120;
  if (medidor) {
    medidor.font = fuente;
    ancho = Math.ceil(medidor.measureText(texto).width) + 24;
  }
  const alto = 44;
  const escala = 2;
  const canvas = document.createElement("canvas");
  canvas.width = ancho * escala;
  canvas.height = alto * escala;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.scale(escala, escala);
    ctx.fillStyle = "rgba(255,255,255,0.88)";
    ctx.beginPath();
    if (typeof ctx.roundRect === "function") ctx.roundRect(1, 1, ancho - 2, alto - 2, 10);
    else ctx.rect(1, 1, ancho - 2, alto - 2);
    ctx.fill();
    ctx.font = fuente;
    ctx.fillStyle = "#0F172A";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(texto, ancho / 2, alto / 2 + 1);
  }
  const textura = new THREE.CanvasTexture(canvas);
  textura.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({
    map: textura,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.renderOrder = 10;
  return { sprite, relacion: ancho / alto };
}

export function VisorBundle3D({ grafo, onSeleccion, seleccionId = null }: Props) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onSeleccion);
  const seleccionIdRef = useRef(seleccionId);
  // Resalta un nodo por id sin avisar al padre; la define el efecto principal.
  const resaltarRef = useRef<((id: string | null) => void) | null>(null);

  useEffect(() => {
    callbackRef.current = onSeleccion;
  }, [onSeleccion]);

  useEffect(() => {
    seleccionIdRef.current = seleccionId;
    resaltarRef.current?.(seleccionId);
  }, [seleccionId]);

  useEffect(() => {
    const contenedor = contenedorRef.current;
    if (!contenedor) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      const aviso = document.createElement("div");
      aviso.setAttribute("role", "status");
      aviso.className =
        "flex h-full items-center justify-center p-4 text-center text-sm text-muted-foreground";
      aviso.textContent = "Este navegador no permite gráficos 3D (WebGL). Use la lista de referencias.";
      contenedor.appendChild(aviso);
      return () => {
        aviso.remove();
      };
    }

    const reducirMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const n = grafo.nodos.length;
    const indice = new Map(grafo.nodos.map((nodo, i) => [nodo.id, i]));
    const pares: [number, number][] = [];
    for (const a of grafo.aristas) {
      const o = indice.get(a.origen);
      const d = indice.get(a.destino);
      if (o !== undefined && d !== undefined) pares.push([o, d]);
    }

    const escena = new THREE.Scene();
    const camara = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    const canvas = renderer.domElement;
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.touchAction = "none";
    contenedor.appendChild(canvas);

    escena.add(new THREE.AmbientLight(0xffffff, 1.6));
    const luz = new THREE.DirectionalLight(0xffffff, 1.8);
    luz.position.set(10, 20, 15);
    escena.add(luz);

    const controles = new OrbitControls(camara, canvas);
    controles.enableDamping = !reducirMovimiento;
    controles.autoRotate = false;
    // La rueda sola desplaza la pagina; el zoom exige Ctrl o Cmd, como en un mapa embebido.
    // OrbitControls no llama a preventDefault cuando enableZoom es false.
    const alRueda = (e: WheelEvent) => {
      controles.enableZoom = zoomPermitido(e);
    };
    contenedor.addEventListener("wheel", alRueda, { capture: true, passive: true });
    // En tactil, el gesto vertical queda para la pagina; el horizontal gira el grafo.
    canvas.style.touchAction = "pan-y";

    // Nodos
    const geometriaNodo = new THREE.SphereGeometry(1, 24, 16);
    const geometrias: THREE.BufferGeometry[] = [geometriaNodo];
    const materiales: THREE.Material[] = [];
    const texturas: THREE.Texture[] = [];
    const mallas: THREE.Mesh[] = [];
    const etiquetas: THREE.Sprite[] = [];
    const radios: number[] = [];
    const alturaBaseEtiqueta = 1.4;
    const relaciones: number[] = [];

    grafo.nodos.forEach((nodo, i) => {
      const radio = i === 0 ? RADIO_NODO_PRINCIPAL : RADIO_NODO;
      radios.push(radio);
      const color = nodo.externo ? COLOR_EXTERNO : colorDeTipo(nodo.tipo);
      const material = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.55,
        metalness: 0.05,
        emissive: new THREE.Color(color),
        emissiveIntensity: 0,
        transparent: nodo.externo,
        opacity: nodo.externo ? 0.5 : 1,
      });
      materiales.push(material);
      const malla = new THREE.Mesh(geometriaNodo, material);
      malla.scale.setScalar(radio);
      malla.userData.indice = i;
      if (nodo.externo) {
        const alambre = new THREE.MeshBasicMaterial({
          color: "#64748B",
          wireframe: true,
          transparent: true,
          opacity: 0.6,
        });
        materiales.push(alambre);
        const envoltura = new THREE.Mesh(geometriaNodo, alambre);
        envoltura.scale.setScalar(1.12);
        malla.add(envoltura);
      }
      escena.add(malla);
      mallas.push(malla);

      const { sprite, relacion } = crearEtiqueta(nodo.etiqueta);
      texturas.push((sprite.material as THREE.SpriteMaterial).map as THREE.Texture);
      materiales.push(sprite.material);
      escena.add(sprite);
      etiquetas.push(sprite);
      relaciones.push(relacion);
    });

    // Aristas: lineas y un cono pequeno cerca del destino
    const posLineas = new Float32Array(pares.length * 6);
    const geometriaLineas = new THREE.BufferGeometry();
    geometriaLineas.setAttribute("position", new THREE.BufferAttribute(posLineas, 3));
    geometrias.push(geometriaLineas);
    const materialLineas = new THREE.LineBasicMaterial({ color: COLOR_ARISTA });
    materiales.push(materialLineas);
    const lineas = new THREE.LineSegments(geometriaLineas, materialLineas);
    lineas.frustumCulled = false;
    escena.add(lineas);

    const geometriaCono = new THREE.ConeGeometry(0.22, 0.6, 12);
    geometrias.push(geometriaCono);
    const materialCono = new THREE.MeshBasicMaterial({ color: COLOR_ARISTA });
    materiales.push(materialCono);
    const conos = new THREE.InstancedMesh(geometriaCono, materialCono, Math.max(pares.length, 1));
    conos.count = pares.length;
    conos.frustumCulled = false;
    escena.add(conos);

    const layout = crearLayout(n, pares);
    let iteracion = 0;
    let sucio = true;
    let seleccionado = -1;
    let factorEtiqueta = 1;

    const ayudante = new THREE.Object3D();
    const dir = new THREE.Vector3();
    const arriba = new THREE.Vector3(0, 1, 0);

    function escalaNodo(i: number) {
      return radios[i] * (i === seleccionado ? 1.35 : 1);
    }

    function actualizarObjetos() {
      const p = layout.pos;
      for (let i = 0; i < n; i++) {
        mallas[i].position.set(p[i * 3], p[i * 3 + 1], p[i * 3 + 2]);
        const h = alturaBaseEtiqueta * factorEtiqueta;
        etiquetas[i].scale.set(h * relaciones[i], h, 1);
        etiquetas[i].position.set(
          p[i * 3],
          p[i * 3 + 1] + escalaNodo(i) + h * 0.6,
          p[i * 3 + 2]
        );
      }
      pares.forEach(([a, b], k) => {
        posLineas[k * 6] = p[a * 3];
        posLineas[k * 6 + 1] = p[a * 3 + 1];
        posLineas[k * 6 + 2] = p[a * 3 + 2];
        posLineas[k * 6 + 3] = p[b * 3];
        posLineas[k * 6 + 4] = p[b * 3 + 1];
        posLineas[k * 6 + 5] = p[b * 3 + 2];
        dir.set(p[b * 3] - p[a * 3], p[b * 3 + 1] - p[a * 3 + 1], p[b * 3 + 2] - p[a * 3 + 2]);
        const largo = Math.max(dir.length(), 0.001);
        dir.divideScalar(largo);
        const retroceso = escalaNodo(b) + 0.35;
        ayudante.position.set(
          p[b * 3] - dir.x * retroceso,
          p[b * 3 + 1] - dir.y * retroceso,
          p[b * 3 + 2] - dir.z * retroceso
        );
        ayudante.quaternion.setFromUnitVectors(arriba, dir);
        ayudante.updateMatrix();
        conos.setMatrixAt(k, ayudante.matrix);
      });
      geometriaLineas.attributes.position.needsUpdate = true;
      conos.instanceMatrix.needsUpdate = true;
      sucio = true;
    }

    function ajustarCamara() {
      if (n === 0) return;
      const p = layout.pos;
      let cx = 0;
      let cy = 0;
      let cz = 0;
      for (let i = 0; i < n; i++) {
        cx += p[i * 3];
        cy += p[i * 3 + 1];
        cz += p[i * 3 + 2];
      }
      cx /= n;
      cy /= n;
      cz /= n;
      let radio = 1;
      for (let i = 0; i < n; i++) {
        const d = Math.hypot(p[i * 3] - cx, p[i * 3 + 1] - cy, p[i * 3 + 2] - cz);
        radio = Math.max(radio, d);
      }
      radio += 2;
      // Encuadra con el campo de vision mas estrecho (el horizontal en el celular)
      // y deja margen para que las etiquetas no se corten en el borde.
      const mitadFovV = (camara.fov * Math.PI) / 360;
      const mitadFovH = Math.atan(Math.tan(mitadFovV) * camara.aspect);
      const mitadFov = Math.min(mitadFovV, mitadFovH);
      const distancia = (radio / Math.sin(mitadFov)) * 1.3;
      controles.target.set(cx, cy, cz);
      camara.position.set(cx + distancia * 0.3, cy + distancia * 0.22, cz + distancia * 0.93);
      camara.near = Math.max(0.1, distancia / 100);
      camara.far = distancia * 10;
      camara.updateProjectionMatrix();
      controles.minDistance = Math.max(2, radio * 0.3);
      controles.maxDistance = distancia * 4;
      controles.update();
      factorEtiqueta = Math.min(2.5, Math.max(0.8, distancia / 35));
      actualizarObjetos();
    }

    function pasoLayout() {
      const alfa = Math.max(0.05, 1 - iteracion / ITERACIONES);
      layout.paso(alfa);
      iteracion++;
    }

    // Tamano
    function redimensionar(ancho: number, alto: number) {
      if (ancho <= 0 || alto <= 0) return;
      renderer.setSize(ancho, alto, false);
      camara.aspect = ancho / alto;
      camara.updateProjectionMatrix();
      // Con el layout terminado, se vuelve a encuadrar (p. ej. al rotar el celular).
      if (iteracion >= ITERACIONES) ajustarCamara();
      sucio = true;
    }
    const rect = contenedor.getBoundingClientRect();
    redimensionar(rect.width, rect.height);
    const observador = new ResizeObserver((entradas) => {
      const r = entradas[0]?.contentRect;
      if (r) redimensionar(r.width, r.height);
    });
    observador.observe(contenedor);

    // Seleccion e interaccion
    const raycaster = new THREE.Raycaster();
    const puntero = new THREE.Vector2();
    function nodoBajoPuntero(ev: PointerEvent): number {
      const r = canvas.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return -1;
      puntero.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
      raycaster.setFromCamera(puntero, camara);
      const golpes = raycaster.intersectObjects(mallas, false);
      return golpes.length > 0 ? (golpes[0].object.userData.indice as number) : -1;
    }

    function seleccionar(i: number, notificar = true) {
      if (i === seleccionado) {
        // Un clic en vacio siempre limpia la seleccion del padre, aunque aqui no haya nada.
        if (i < 0 && notificar) callbackRef.current?.(null);
        return;
      }
      if (seleccionado >= 0) {
        (mallas[seleccionado].material as THREE.MeshStandardMaterial).emissiveIntensity = 0;
      }
      seleccionado = i;
      if (i >= 0) (mallas[i].material as THREE.MeshStandardMaterial).emissiveIntensity = 0.7;
      for (let k = 0; k < n; k++) mallas[k].scale.setScalar(escalaNodo(k));
      actualizarObjetos();
      if (notificar) callbackRef.current?.(i >= 0 ? grafo.nodos[i] : null);
    }

    resaltarRef.current = (id) => seleccionar(id === null ? -1 : (indice.get(id) ?? -1), false);

    let inicio: { x: number; y: number } | null = null;
    function alPresionar(ev: PointerEvent) {
      inicio = { x: ev.clientX, y: ev.clientY };
    }
    function alSoltar(ev: PointerEvent) {
      if (!inicio) return;
      const movido = Math.hypot(ev.clientX - inicio.x, ev.clientY - inicio.y);
      inicio = null;
      if (movido < UMBRAL_ARRASTRE) seleccionar(nodoBajoPuntero(ev));
    }
    function alMover(ev: PointerEvent) {
      if (ev.buttons !== 0) return;
      canvas.style.cursor = nodoBajoPuntero(ev) >= 0 ? "pointer" : "";
    }
    canvas.addEventListener("pointerdown", alPresionar);
    canvas.addEventListener("pointerup", alSoltar);
    canvas.addEventListener("pointermove", alMover);
    controles.addEventListener("change", () => {
      sucio = true;
    });

    // Estado inicial: sin movimiento se calcula todo de una vez; con movimiento se anima.
    if (reducirMovimiento) {
      while (iteracion < ITERACIONES) pasoLayout();
      ajustarCamara();
    } else {
      actualizarObjetos();
      ajustarCamara();
    }

    resaltarRef.current(seleccionIdRef.current);

    let cuadro = 0;
    function bucle() {
      cuadro = requestAnimationFrame(bucle);
      if (iteracion < ITERACIONES) {
        for (let k = 0; k < PASOS_POR_CUADRO && iteracion < ITERACIONES; k++) pasoLayout();
        if (iteracion >= ITERACIONES) ajustarCamara();
        else actualizarObjetos();
      }
      const cambio = controles.update();
      if (cambio || sucio) {
        renderer.render(escena, camara);
        sucio = false;
      }
    }
    bucle();

    return () => {
      cancelAnimationFrame(cuadro);
      resaltarRef.current = null;
      observador.disconnect();
      canvas.removeEventListener("pointerdown", alPresionar);
      canvas.removeEventListener("pointerup", alSoltar);
      canvas.removeEventListener("pointermove", alMover);
      contenedor.removeEventListener("wheel", alRueda, { capture: true });
      controles.dispose();
      conos.dispose();
      geometrias.forEach((g) => g.dispose());
      materiales.forEach((m) => m.dispose());
      texturas.forEach((t) => t.dispose());
      renderer.dispose();
      canvas.remove();
    };
  }, [grafo]);

  return (
    <div
      ref={contenedorRef}
      role="img"
      aria-label={`Grafo 3D de ${grafo.nodos.length} recursos y ${grafo.aristas.length} referencias`}
      className="h-[360px] w-full overflow-hidden rounded-md border border-border bg-card sm:h-[420px]"
    />
  );
}

export default VisorBundle3D;
