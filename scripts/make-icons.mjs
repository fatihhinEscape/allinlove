import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const name = Buffer.from(type);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, checksum]);
}

function heart(size) {
  const pixels = Buffer.alloc((size * size + size) * 4);
  const center = (size - 1) / 2;
  for (let y = 0; y < size; y += 1) {
    const row = y * (size * 4 + 1);
    pixels[row] = 0;
    for (let x = 0; x < size; x += 1) {
      const nx = (x - center) / (size * 0.34);
      const ny = (center - y) / (size * 0.34) - 0.15;
      const heartShape = (nx * nx + ny * ny - 1) ** 3 - nx * nx * ny ** 3;
      const offset = row + 1 + x * 4;
      const fill = heartShape <= 0;
      pixels[offset] = fill ? 255 : 196;
      pixels[offset + 1] = fill ? 247 : 92;
      pixels[offset + 2] = fill ? 248 : 106;
      pixels[offset + 3] = 255;
    }
  }
  return pixels;
}

function png(size) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const compressed = deflateSync(heart(size));
  return Buffer.concat([
    signature,
    chunk("IHDR", header),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

mkdirSync("public/icons", { recursive: true });
writeFileSync("public/icons/icon-192.png", png(192));
writeFileSync("public/icons/icon-512.png", png(512));
