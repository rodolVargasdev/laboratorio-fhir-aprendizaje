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

test("limita a 200 nodos sin fallar y sin aristas colgantes", () => {
  const entradas = Array.from({ length: 250 }, (_, i) => ({
    resource: { resourceType: "Observation", id: `o${i}`, subject: { reference: "Patient/1" } },
  }));
  const g = extraerGrafo(bundle(...entradas));
  assert.ok(g);
  assert.equal(g.nodos.length, 200);
  const ids = new Set(g.nodos.map((n) => n.id));
  assert.ok(g.aristas.every((a) => ids.has(a.origen) && ids.has(a.destino)));
});

test("colorDeTipo: tipos conocidos tienen su color y el resto cae en gris", () => {
  assert.equal(colorDeTipo("Patient"), "#048DF3");
  assert.equal(colorDeTipo("Organization"), colorDeTipo("Practitioner"));
  assert.equal(colorDeTipo("Medication"), "#94A3B8");
  assert.notEqual(colorDeTipo("Patient"), colorDeTipo("Medication"));
});
