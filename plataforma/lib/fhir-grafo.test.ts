import { test } from "node:test";
import assert from "node:assert/strict";
import { colorDeTipo, extraerGrafo } from "./fhir-grafo";

const paciente = { resourceType: "Patient", id: "1", name: [{ given: ["Ana"], family: "Lopez" }] };
const encuentro = { resourceType: "Encounter", id: "e1", subject: { reference: "Patient/1" } };

function bundle(...entradas: { fullUrl?: string; resource: unknown }[]) {
  return { resourceType: "Bundle", type: "searchset", entry: entradas };
}

test("Bundle con Encounter y su Patient: 2 nodos, 1 arista, ninguno externo", () => {
  const g = extraerGrafo(bundle({ resource: encuentro }, { resource: paciente }));
  assert.ok(g);
  assert.equal(g.nodos.length, 2);
  assert.equal(g.aristas.length, 1);
  assert.deepEqual(g.aristas[0], { origen: "Encounter/e1", destino: "Patient/1", ruta: "subject" });
  assert.equal(g.nodos.filter((n) => n.externo).length, 0);
  assert.equal(g.nodos.find((n) => n.id === "Patient/1")?.etiqueta, "Ana Lopez");
});

test("contraprueba: sin el Patient en el Bundle, Patient/1 es externo", () => {
  const g = extraerGrafo(bundle({ resource: encuentro }));
  assert.ok(g);
  assert.equal(g.nodos.length, 2);
  const externo = g.nodos.find((n) => n.id === "Patient/1");
  assert.equal(externo?.externo, true);
  assert.equal(externo?.recurso, undefined);
  assert.equal(g.aristas.length, 1);
});

test("URL absoluta con _history y urn:uuid resuelven al mismo nodo interno", () => {
  const g = extraerGrafo(
    bundle(
      { fullUrl: "https://hapi.fhir.org/baseR4/Patient/1", resource: paciente },
      { fullUrl: "urn:uuid:aaaa", resource: { resourceType: "Practitioner", id: "p9" } },
      {
        resource: {
          resourceType: "Encounter",
          id: "e2",
          subject: { reference: "https://hapi.fhir.org/baseR4/Patient/1/_history/3" },
          participant: [{ individual: { reference: "urn:uuid:aaaa" } }],
        },
      }
    )
  );
  assert.ok(g);
  assert.equal(g.nodos.filter((n) => n.externo).length, 0);
  assert.equal(g.nodos.length, 3);
  const destinos = g.aristas.map((a) => `${a.ruta}|${a.destino}`).sort();
  assert.deepEqual(destinos, ["participant[0].individual|Practitioner/p9", "subject|Patient/1"]);
});

test("contraprueba: un urn:uuid que no esta en el Bundle queda como externo", () => {
  const g = extraerGrafo(
    bundle({
      resource: { resourceType: "Encounter", id: "e3", subject: { reference: "urn:uuid:no-esta" } },
    })
  );
  assert.ok(g);
  assert.equal(g.nodos.filter((n) => n.externo).length, 1);
  assert.equal(g.aristas.length, 1);
});

test("referencias #contained y objetos dentro de text no generan aristas", () => {
  const g = extraerGrafo(
    bundle({
      resource: {
        resourceType: "Encounter",
        id: "e4",
        contained: [{ resourceType: "Patient", id: "c1", link: [{ other: { reference: "Patient/zzz" } }] }],
        subject: { reference: "#c1" },
        text: { status: "generated", extra: { reference: "Patient/narrativa" } },
      },
    })
  );
  assert.ok(g);
  assert.equal(g.aristas.length, 0);
  assert.equal(g.nodos.length, 1);
});

test("contraprueba: la misma referencia fuera de contained y text si genera arista", () => {
  const g = extraerGrafo(
    bundle({
      resource: { resourceType: "Encounter", id: "e5", subject: { reference: "Patient/real" } },
    })
  );
  assert.ok(g);
  assert.equal(g.aristas.length, 1);
  assert.equal(g.aristas[0].destino, "Patient/real");
});

test("json sin resourceType devuelve null; CapabilityStatement sin referencias: 1 nodo, 0 aristas", () => {
  assert.equal(extraerGrafo({ foo: "bar" }), null);
  assert.equal(extraerGrafo("texto"), null);
  assert.equal(extraerGrafo(null), null);
  const g = extraerGrafo({ resourceType: "CapabilityStatement", id: "cs", status: "active" });
  assert.ok(g);
  assert.equal(g.nodos.length, 1);
  assert.equal(g.aristas.length, 0);
});

test("una arista duplicada se cuenta una vez", () => {
  // El mismo recurso repetido en el Bundle produce el mismo origen, destino y ruta.
  const g = extraerGrafo(bundle({ resource: encuentro }, { resource: encuentro }, { resource: paciente }));
  assert.ok(g);
  assert.equal(g.nodos.length, 2);
  assert.equal(g.aristas.length, 1);
});

test("contraprueba: el mismo destino por dos campos distintos son dos aristas", () => {
  const g = extraerGrafo(
    bundle({
      resource: {
        resourceType: "Encounter",
        id: "e7",
        subject: { reference: "Patient/1" },
        participant: [{ individual: { reference: "Patient/1" } }],
      },
    })
  );
  assert.ok(g);
  assert.equal(g.aristas.length, 2);
});

function observaciones(cantidad: number) {
  return Array.from({ length: cantidad }, (_, i) => ({
    resource: { resourceType: "Observation", id: `o${i}`, subject: { reference: "Patient/1" } },
  }));
}

test("tope de 200 nodos con el Patient primero: quedan aristas validas y se avisa el recorte", () => {
  const g = extraerGrafo(bundle({ resource: paciente }, ...observaciones(250)));
  assert.ok(g);
  assert.equal(g.nodos.length, 200);
  assert.ok(g.aristas.length > 0);
  const ids = new Set(g.nodos.map((n) => n.id));
  assert.ok(g.aristas.every((a) => ids.has(a.origen) && ids.has(a.destino)));
  assert.equal(g.truncado, true);
  assert.ok(g.referenciasOmitidas > 0);
});

test("tope de 200 nodos sin Patient en el Bundle: 0 aristas pero truncado y con omitidas", () => {
  const g = extraerGrafo(bundle(...observaciones(250)));
  assert.ok(g);
  assert.equal(g.nodos.length, 200);
  assert.equal(g.aristas.length, 0);
  assert.equal(g.truncado, true);
  assert.ok(g.referenciasOmitidas > 0);
});

test("contraprueba: un Bundle pequeno no esta truncado y no omite referencias", () => {
  const g = extraerGrafo(bundle({ resource: encuentro }, { resource: paciente }));
  assert.ok(g);
  assert.equal(g.truncado, false);
  assert.equal(g.referenciasOmitidas, 0);
});

test("colorDeTipo: tipos conocidos tienen su color y el resto cae en gris", () => {
  assert.equal(colorDeTipo("Patient"), "#048DF3");
  assert.equal(colorDeTipo("Organization"), colorDeTipo("Practitioner"));
  assert.equal(colorDeTipo("Medication"), "#94A3B8");
  assert.notEqual(colorDeTipo("Patient"), colorDeTipo("Medication"));
});

test("Etiqueta de Patient: un nombre largo se acorta y uno corto queda intacto", () => {
  const largo = { resourceType: "Patient", id: "9", name: [{ given: ["ShieldMed3I"], family: "SYNTHETIC-TEST-DO-NOT-USE" }] };
  const g = extraerGrafo(largo);
  assert.ok(g);
  assert.ok(g.nodos[0].etiqueta.length <= 22);
  assert.ok(g.nodos[0].etiqueta.endsWith("..."));
  const corto = extraerGrafo(paciente);
  assert.ok(corto);
  assert.equal(corto.nodos[0].etiqueta, "Ana Lopez");
});
