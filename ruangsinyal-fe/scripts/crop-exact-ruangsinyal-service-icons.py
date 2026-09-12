from pathlib import Path
from PIL import Image

SOURCE_DIR = Path(r"D:\kantor\icon ruangsinyal")
OUT_DIR = Path("public/service-icons-exact")
OUT_DIR.mkdir(parents=True, exist_ok=True)

sources = {
    "main": SOURCE_DIR / "4fe7eb7b-12bf-48d9-b75d-7f74d7db031e.png",
    "billing": SOURCE_DIR / "689d96d2-fc28-4b3c-a3a9-0e975cbc2fbe.png",
    "finance": SOURCE_DIR / "38d7046a-5059-4ab5-a02a-7f4078492909.png",
    "travel": SOURCE_DIR / "208f4540-2095-4637-9ce4-413a384a2452.png",
}

# Boxes are measured from the provided composite PNGs.
# They intentionally crop only the icon tile, not the text below it.
crops = {
    "pulsa": ("main", (74, 53, 349, 314)),
    "paket-data": ("main", (419, 53, 693, 313)),
    "hp-pascabayar": ("main", (757, 53, 1035, 312)),
    "esim-roaming": ("main", (1103, 53, 1376, 311)),
    "ewallet": ("main", (74, 390, 350, 650)),
    "transfer-bank": ("main", (418, 390, 694, 648)),
    "qris": ("main", (757, 390, 1039, 650)),
    "uang-elektronik": ("main", (1104, 390, 1378, 648)),
    "kartu-kredit": ("main", (74, 724, 350, 985)),
    "asuransi": ("main", (419, 724, 692, 985)),
    "bpjs": ("billing", (47, 82, 368, 405)),
    "token-pln": ("billing", (401, 82, 723, 406)),
    "pdam": ("billing", (757, 82, 1079, 407)),
    "gas-pgn": ("billing", (45, 506, 369, 830)),
    "internet-wifi": ("billing", (401, 507, 724, 830)),
    "tv-kabel": ("billing", (755, 507, 1077, 830)),
    "voucher-game": ("billing", (45, 928, 368, 1249)),
    "voucher-digital": ("billing", (402, 927, 724, 1251)),
    "streaming-musik": ("billing", (756, 928, 1078, 1250)),
    "klinik-kesehatan": ("finance", (258, 32, 684, 410)),
    "uang-sekolah": ("finance", (767, 32, 1193, 410)),
    "cicilan-kendaraan": ("finance", (259, 548, 686, 926)),
    "cicilan-multifinance": ("finance", (766, 548, 1193, 926)),
    "pbb": ("travel", (25, 66, 360, 403)),
    "pajak-negara": ("travel", (393, 66, 731, 403)),
    "tiket-perjalanan": ("travel", (764, 66, 1098, 403)),
    "saldo-kartu-tol": ("travel", (25, 495, 361, 832)),
    "parkir-digital": ("travel", (394, 495, 731, 832)),
    "kurir-pengiriman": ("travel", (764, 497, 1099, 832)),
    "zakat-donasi": ("travel", (395, 928, 729, 1265)),
}


def trim_alpha(image: Image.Image) -> Image.Image:
    alpha_box = image.getchannel("A").getbbox()
    if not alpha_box:
        return image
    return image.crop(alpha_box)


for slug, (source_key, box) in crops.items():
    image = Image.open(sources[source_key]).convert("RGBA")
    cropped = trim_alpha(image.crop(box))
    cropped.save(OUT_DIR / f"{slug}.png")

print(f"Cropped {len(crops)} exact RuangSinyal icons to {OUT_DIR}.")
