import { test } from "node:test";
import assert from "node:assert/strict";
import { zoomPermitido } from "./visor-entrada";

test("la rueda sin modificador no hace zoom (desplaza la pagina)", () => {
  assert.equal(zoomPermitido({ ctrlKey: false, metaKey: false }), false);
});

test("contraprueba: con Ctrl o con Cmd la rueda si hace zoom", () => {
  assert.equal(zoomPermitido({ ctrlKey: true, metaKey: false }), true);
  assert.equal(zoomPermitido({ ctrlKey: false, metaKey: true }), true);
});
