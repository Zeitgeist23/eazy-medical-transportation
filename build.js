const fs = require('fs');
const path = require('path');

const root = __dirname;
const part1 = fs.readFileSync(path.join(root, 'assets/hero-parts/part1.txt'), 'utf8');
const part2 = fs.readFileSync(path.join(root, 'assets/hero-parts/part2.txt'), 'utf8');
const encoded = (part1 + part2).replace(/\s/g, '');
const image = Buffer.from(encoded, 'base64');

if (image.length < 100000) {
  throw new Error(`Approved landing image decode failed: ${image.length} bytes`);
}
if (image[0] !== 0xff || image[1] !== 0xd8) {
  throw new Error('Approved landing image is not a valid JPEG');
}

const dist = path.join(root, 'dist');
const assetDir = path.join(dist, 'assets');
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(assetDir, { recursive: true });
fs.writeFileSync(path.join(assetDir, 'approved-landing.jpg'), image);

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="description" content="Safe, compassionate non-emergency medical transportation.">
  <title>Eazy Medical Transportation</title>
  <style>
    *{box-sizing:border-box}
    html,body{margin:0;min-height:100%;background:#fff}
    body{font-family:Arial,Helvetica,sans-serif}
    .landing{position:relative;width:100%;max-width:1402px;margin:0 auto;overflow:hidden;background:#fff}
    .landing>img{display:block;width:100%;height:auto;border:0}
    .number-cover{position:absolute;z-index:3;display:flex;align-items:center;justify-content:center;background:#fff;color:#087fa8;font-weight:800;line-height:1;white-space:nowrap}
    .number-main{left:20.4%;top:45.3%;width:11.2%;height:2.6%;font-size:clamp(7px,1.05vw,15px)}
    .number-bottom{left:80.5%;top:72%;width:12.8%;height:2.9%;background:#edf9fd;font-size:clamp(7px,1.15vw,16px)}
    .hotspot{position:absolute;z-index:4;display:block}
    .call-top{right:2.8%;top:2.2%;width:11.3%;height:5.7%}
    .request{left:3.3%;top:42.3%;width:14%;height:6.1%}
    .call-main{left:18.2%;top:42.3%;width:14.5%;height:6.1%}
    .schedule{left:34%;top:42.3%;width:15%;height:6.1%}
    @media(max-width:700px){.number-cover{font-weight:700}}
  </style>
</head>
<body>
  <main class="landing">
    <img src="/assets/approved-landing.jpg" alt="Eazy Medical Transportation landing page" width="1402" height="935">
    <span class="number-cover number-main">000-000-0000</span>
    <span class="number-cover number-bottom">000-000-0000</span>
    <a class="hotspot call-top" href="tel:+0000000000" aria-label="Call Eazy Medical Transportation"></a>
    <a class="hotspot request" href="mailto:info@eazymedicaltransportation.com?subject=Ride%20Request" aria-label="Request a ride"></a>
    <a class="hotspot call-main" href="tel:+0000000000" aria-label="Call Eazy Medical Transportation"></a>
    <a class="hotspot schedule" href="mailto:info@eazymedicaltransportation.com?subject=Schedule%20Transportation" aria-label="Schedule transportation"></a>
  </main>
</body>
</html>`;

fs.writeFileSync(path.join(dist, 'index.html'), html, 'utf8');
console.log(`Built landing page with ${image.length} byte approved image.`);
