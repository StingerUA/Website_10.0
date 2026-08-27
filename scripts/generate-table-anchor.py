from pathlib import Path

import qrcode
from qrcode.image.svg import SvgPathImage

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "ar" / "alba-table-anchor.svg"
OUT.parent.mkdir(parents=True, exist_ok=True)

qr = qrcode.QRCode(version=2, error_correction=qrcode.constants.ERROR_CORRECT_H, box_size=12, border=4)
qr.add_data("ALBA-SPACE-TABLE-ANCHOR-01")
qr.make(fit=True)
image = qr.make_image(image_factory=SvgPathImage, fill_color="black", back_color="white")
image.save(OUT)
print(f"Wrote {OUT}")
