"""Build labelled contact sheets from browser screenshots; no render substitutions."""
import json
import csv
import html
import re
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).parent
names = json.loads((root / 'catalog.json').read_text(encoding='utf-8'))
font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 17)
for start in range(0, len(names), 12):
    sheet = Image.new('RGB', (1600, 4 * 330), '#20242c')
    draw = ImageDraw.Draw(sheet)
    for offset, name in enumerate(names[start:start + 12]):
        number = start + offset + 1
        path = root / 'screenshots' / f'{number:03}.png'
        x, y = (offset % 3) * 533, (offset // 3) * 330
        draw.text((x + 10, y + 6), f'{number:03}  {name}', fill='white', font=font)
        if path.exists():
            im = Image.open(path).convert('RGB')
            im = im.crop((280, 50, im.width, im.height - 25))
            im.thumbnail((525, 290))
            sheet.paste(im, (x + (533 - im.width) // 2, y + 32))
    sheet.save(root / f'sheet-{start // 12 + 1:02}.jpg', quality=90)
print('Contact sheets refreshed')

rows = []
for line in (root / 'RENCANA.md').read_text(encoding='utf-8').splitlines():
    if re.match(r'^\| \d{3} \|', line):
        rows.append([cell.strip() for cell in line.strip('|').split('|')])
assert len(rows) == len(names) == 101, f'Coverage mismatch: {len(rows)} / {len(names)}'
assert [int(row[0]) for row in rows] == list(range(1, 102))
missing = [i for i in range(1, 102) if not (root / 'screenshots' / f'{i:03}.png').exists()]
assert not missing, f'Missing screenshot evidence: {missing}'
with (root / 'audit-101.csv').open('w', encoding='utf-8-sig', newline='') as stream:
    writer = csv.writer(stream)
    writer.writerow(['Nomor', 'Aset', 'Temuan', 'Keputusan dan prioritas', 'Perbaikan'])
    writer.writerows(rows)

cards = []
for number, name, finding, decision, action in rows:
    cards.append(f'''<article id="asset-{number}">
      <a href="screenshots/{number}.png"><img loading="lazy" src="screenshots/{number}.png" alt="{html.escape(name)}: render katalog kualitas sedang"></a>
      <div><small>{number} · {html.escape(decision)}</small><h2>{html.escape(name)}</h2>
      <p>{html.escape(finding)}</p><p><b>Perbaikan:</b> {html.escape(action)}</p></div></article>''')
page = '''<!doctype html><html lang="id"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Audit 101 Aset +62WNIPOLY</title><style>
*{box-sizing:border-box}body{margin:0;background:#161a21;color:#eee8d9;font:16px/1.6 system-ui,sans-serif}header,main{max-width:1500px;margin:auto;padding:28px}h1{font-size:clamp(26px,4vw,44px);margin:0}header p{max-width:900px;color:#c5c8ce}a{color:#f2b92e}nav{display:flex;gap:22px;flex-wrap:wrap}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr));gap:24px}article{border:1px solid #39404b;border-radius:12px;overflow:hidden;background:#20262f}article img{display:block;width:100%;height:auto}article div{padding:20px}small{color:#f2b92e}h2{font-size:20px;margin:8px 0}p{margin:10px 0}footer{padding:28px;text-align:center;color:#c5c8ce}
</style><header><h1>Audit 101 aset +62WNIPOLY</h1><p>26 Oktober 2026 · 101/101 entri dibuka dan direkam. Foto asli pada kualitas sedang, desktop 1280×720. Klik foto untuk resolusi penuh. Penilaian berdasarkan render dan kode; seluruh siklus animasi serta performa HP belum diuji.</p><nav><a href="RENCANA.md">Rencana lengkap</a><a href="audit-101.csv">Daftar CSV</a><a href="sheet-01.jpg">Lembar kontak 1</a><a href="sheet-09.jpg">Lembar kontak 9</a></nav></header><main>'''
page += '\n'.join(cards) + '</main><footer>101 temuan individual · perbaikan belum diterapkan pada tahap audit ini</footer></html>'
page = page.replace('<nav>', '<p><b>Ini galeri audit awal, sebelum perbaikan.</b> Katalog aplikasi kini berisi 125 entri. <a href="IMPLEMENTASI.md">Baca hasil implementasi dan batas validasinya.</a></p><nav>', 1)
(root / 'index.html').write_text(page, encoding='utf-8')
print('Verified: 101 findings, 101 screenshots. Gallery and CSV generated.')
