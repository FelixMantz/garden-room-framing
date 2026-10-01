import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test from "node:test";
test("build contains relative Pages assets and the default PDF", async()=>{
 const html = await readFile(new URL("../dist/index.html", import.meta.url), "utf8");
 assert.match(html, /Garden Room Framing Designer/);
 assert.match(html, /src="\/garden-room-framing\/assets\//);
 const pdf = await readFile(new URL("../dist/garden-room-framing-set.pdf", import.meta.url));
 assert.equal(pdf.subarray(0,8).toString(), "%PDF-1.4");
});
