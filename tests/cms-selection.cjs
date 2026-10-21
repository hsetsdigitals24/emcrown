// Node DOM regression: use Puck's installed DOM dependency to distinguish repeated content.
/* eslint-disable @typescript-eslint/no-require-imports -- Reuse the existing TypeScript loader. */
require("../scripts/auth.cjs");
const assert = require("node:assert/strict");
const { defineContent } = require("../src/features/cms/fields.ts");
const { fieldAtElement } = require("../src/features/cms/preview-selection.ts");
const { isPreviewNavigationControl } = require("../src/features/cms/preview-interaction.ts");
(async () => {
  const { Window } = await import("happy-dom");
  const window = new Window();
  const { document } = window;
  const definition = defineContent("/", "Test content", {
    hero: { id: "home", headline: "A shared heading", media: { photo: "/media/example.jpg" } },
    services: { id: "services", items: [{ id: "one", description: "Repeated description" }, { id: "two", description: "Repeated description" }] },
    booking: { id: "booking", background: { images: ["/media/example.jpg"] } },
  });
  document.body.innerHTML = '<section id="services"><article data-cms-id="one"><p id="first">Repeated description</p></article><article data-cms-id="two"><p id="second">Repeated description</p></article></section><section id="booking"><img id="picture" src="/_next/image?url=%2Fmedia%2Fexample.jpg&amp;w=400"></section><h1 data-cms-field="hero.headline"><span id="word">A shared heading</span></h1><p id="unknown">Unrelated content</p>';
  assert.equal(fieldAtElement(document.querySelector("#first"), definition, definition.initial), "services.items.0.description");
  assert.equal(fieldAtElement(document.querySelector("#second"), definition, definition.initial), "services.items.1.description");
  assert.equal(fieldAtElement(document.querySelector("#picture"), definition, definition.initial), "booking.background.images.0");
  assert.equal(fieldAtElement(document.querySelector("#word"), definition, definition.initial), "hero.headline");
  assert.equal(fieldAtElement(document.querySelector("#unknown"), definition, definition.initial), undefined);
  document.querySelector("#picture").setAttribute("src", "http://[");
  assert.doesNotThrow(() => fieldAtElement(document.querySelector("#picture"), definition, definition.initial));
  document.body.innerHTML = '<details class="navigation-mobile"><summary><span id="menu">Menu</span></summary><details class="mobile-submenu"><summary id="submenu">Services</summary></details><div class="menu-backdrop"></div></details><details class="faq-item"><summary id="faq">Question</summary></details>';
  assert.equal(isPreviewNavigationControl(document.querySelector("#menu")), true);
  assert.equal(isPreviewNavigationControl(document.querySelector("#submenu")), true);
  assert.equal(isPreviewNavigationControl(document.querySelector(".menu-backdrop")), true);
  assert.equal(isPreviewNavigationControl(document.querySelector("#faq")), false);
  await window.happyDOM.close();
  console.log("CMS selection passed: repeated cards, nested text, image sources and navigation controls remain usable in selection mode.");
})().catch(error => { console.error(error); process.exitCode = 1; });
