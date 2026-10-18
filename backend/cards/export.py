import csv
import io
import logging
import math
import unicodedata
import zipfile
from concurrent.futures import ThreadPoolExecutor

import requests
from PIL import Image, ImageDraw, ImageFont

from .pricing import get_variant_price, price_value_for_sort

logger = logging.getLogger(__name__)

_IMAGE_REQUEST_TIMEOUT_SECONDS = 10
_HEADERS = {
    "User-Agent": "MagicTrade/1.0 (+https://magictrade.app; contact: kziete@gmail.com)",
}
_FETCH_WORKERS = 8

# Guards against a single export request hanging forever on a huge binder --
# fetches/renders scale roughly linearly with item count.
MAX_EXPORT_ITEMS = 300

_PLACEHOLDER_SIZE = (488, 680)
_BANNER_HEIGHT_RATIO = 0.16
_PAGE_JPEG_QUALITY = 88

# Binder-style pages: 3x3, matching a standard 9-pocket page.
_PAGE_COLS = 3
_PAGE_ROWS = 3
_PAGE_SIZE = _PAGE_COLS * _PAGE_ROWS
_CELL_WIDTH = 400
_CELL_HEIGHT = 560
_CELL_GUTTER = 14
_PAGE_MARGIN = 30
_HEADER_HEIGHT = 56
_HEADER_URL = "https://cardtones.com"

_PAGE_BG = (10, 10, 11)
_EMPTY_CELL_OUTLINE = (58, 58, 63)
_HEADER_TEXT = (228, 228, 231)
_ACCENT_TEXT = (103, 139, 207)


def _drawable_text(text: str) -> str:
    """Strips accents from text drawn on images: Pillow's bundled default
    font (Aileron) falls back to a missing-glyph box for accented Latin
    letters, so "Página" renders with a broken "á". Other non-ASCII
    punctuation (e.g. the "·" separator) the font does support is left as-is."""
    decomposed = unicodedata.normalize("NFKD", text)
    return "".join(ch for ch in decomposed if not unicodedata.combining(ch))


def _format_price_text(price: dict | None, finish: str | None) -> str:
    value = price_value_for_sort(price, finish)
    if value is None:
        return "Precio no disponible"
    return f"${value:,.2f}"


def _fetch_image_bytes(url: str) -> bytes | None:
    try:
        response = requests.get(url, headers=_HEADERS, timeout=_IMAGE_REQUEST_TIMEOUT_SECONDS)
        response.raise_for_status()
        return response.content
    except requests.RequestException:
        logger.warning("Failed to download card image %s", url, exc_info=True)
        return None


def _placeholder_card(card_name: str) -> Image.Image:
    width, height = _PLACEHOLDER_SIZE
    img = Image.new("RGB", (width, height), (32, 32, 36))
    draw = ImageDraw.Draw(img)
    font = ImageFont.load_default(size=26)
    text = _drawable_text(f"Imagen no disponible\n\n{card_name}")
    draw.multiline_text(
        (width / 2, height / 2), text, font=font, fill=(220, 220, 220), anchor="mm", align="center"
    )
    return img


def _draw_price_banner(base_img: Image.Image, *, price_text: str, subtitle: str, quantity: int) -> Image.Image:
    img = base_img.convert("RGBA")
    width, height = img.size
    banner_height = max(int(height * _BANNER_HEIGHT_RATIO), 70)

    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    draw.rectangle([(0, height - banner_height), (width, height)], fill=(10, 10, 14, 215))
    img = Image.alpha_composite(img, overlay)

    draw = ImageDraw.Draw(img)
    price_font = ImageFont.load_default(size=max(int(banner_height * 0.42), 16))
    subtitle_font = ImageFont.load_default(size=max(int(banner_height * 0.2), 11))

    draw.text(
        (width / 2, height - banner_height + banner_height * 0.1),
        _drawable_text(price_text),
        font=price_font,
        fill=(255, 255, 255, 255),
        anchor="ma",
    )
    draw.text(
        (width / 2, height - banner_height * 0.22),
        _drawable_text(subtitle),
        font=subtitle_font,
        fill=(215, 215, 220, 255),
        anchor="mm",
    )

    if quantity > 1:
        badge_font = ImageFont.load_default(size=max(int(width * 0.07), 14))
        badge_text = f"x{quantity}"
        pad = 10
        left, top, right, bottom = draw.textbbox((0, 0), badge_text, font=badge_font)
        bw, bh = right - left, bottom - top
        draw.rounded_rectangle(
            [(10, 10), (10 + bw + pad * 2, 10 + bh + pad * 2)], radius=10, fill=(10, 10, 14, 215)
        )
        draw.text((10 + pad - left, 10 + pad - top), badge_text, font=badge_font, fill=(255, 210, 90, 255))

    return img.convert("RGB")


def _build_card_cell(entry, image_bytes: bytes | None, price_text: str) -> Image.Image:
    """Renders one inventory row as a price-tagged card image, sized to fit a
    binder-page grid cell."""
    variant = entry.variant
    card_name = variant.card.name

    if image_bytes:
        try:
            base_img = Image.open(io.BytesIO(image_bytes))
            base_img.load()
        except Exception:
            logger.warning("Could not decode image for %s", card_name, exc_info=True)
            base_img = _placeholder_card(card_name)
    else:
        base_img = _placeholder_card(card_name)

    finish_label = "Foil" if entry.finish == "foil" else "Non-Foil"
    subtitle = f"{card_name} · {variant.card_set.short.upper()} · {finish_label} · {entry.condition}"

    final_img = _draw_price_banner(base_img, price_text=price_text, subtitle=subtitle, quantity=entry.quantity)
    return final_img.resize((_CELL_WIDTH, _CELL_HEIGHT), Image.LANCZOS)


def _page_size() -> tuple[int, int]:
    width = _PAGE_MARGIN * 2 + _CELL_WIDTH * _PAGE_COLS + _CELL_GUTTER * (_PAGE_COLS - 1)
    height = (
        _HEADER_HEIGHT
        + _PAGE_MARGIN * 2
        + _CELL_HEIGHT * _PAGE_ROWS
        + _CELL_GUTTER * (_PAGE_ROWS - 1)
    )
    return width, height


def _compose_page(cell_images: list[Image.Image], *, page_num: int, total_pages: int) -> bytes:
    page_width, page_height = _page_size()
    page = Image.new("RGB", (page_width, page_height), _PAGE_BG)
    draw = ImageDraw.Draw(page)

    header_font = ImageFont.load_default(size=22)
    draw.text(
        (_PAGE_MARGIN, _HEADER_HEIGHT / 2),
        _HEADER_URL,
        font=header_font,
        fill=_HEADER_TEXT,
        anchor="lm",
    )
    draw.text(
        (page_width - _PAGE_MARGIN, _HEADER_HEIGHT / 2),
        _drawable_text(f"Página {page_num}/{total_pages}"),
        font=header_font,
        fill=_ACCENT_TEXT,
        anchor="rm",
    )

    for index, cell_img in enumerate(cell_images):
        col = index % _PAGE_COLS
        row = index // _PAGE_COLS
        x = _PAGE_MARGIN + col * (_CELL_WIDTH + _CELL_GUTTER)
        y = _HEADER_HEIGHT + _PAGE_MARGIN + row * (_CELL_HEIGHT + _CELL_GUTTER)
        page.paste(cell_img, (x, y))

    # Empty pockets on a partially-filled last page stay as bare cell outlines.
    for index in range(len(cell_images), _PAGE_SIZE):
        col = index % _PAGE_COLS
        row = index // _PAGE_COLS
        x = _PAGE_MARGIN + col * (_CELL_WIDTH + _CELL_GUTTER)
        y = _HEADER_HEIGHT + _PAGE_MARGIN + row * (_CELL_HEIGHT + _CELL_GUTTER)
        draw.rectangle([(x, y), (x + _CELL_WIDTH, y + _CELL_HEIGHT)], outline=_EMPTY_CELL_OUTLINE, width=2)

    buf = io.BytesIO()
    page.save(buf, format="JPEG", quality=_PAGE_JPEG_QUALITY)
    return buf.getvalue()


def build_inventory_export(available_queryset) -> tuple[bytes, bool]:
    """Builds an in-memory ZIP: binder-style pages (3x3, 9 cards each) with a
    price tag on every card, plus an `inventario.csv` summary. Returns
    (zip_bytes, truncated)."""
    entries = list(
        available_queryset.select_related("variant__card", "variant__card_set")[: MAX_EXPORT_ITEMS + 1]
    )
    truncated = len(entries) > MAX_EXPORT_ITEMS
    entries = entries[:MAX_EXPORT_ITEMS]

    scryfall_ids = list({entry.variant.scryfall_id for entry in entries})
    image_urls = list({entry.variant.image for entry in entries})

    with ThreadPoolExecutor(max_workers=_FETCH_WORKERS) as pool:
        price_results = list(pool.map(lambda sid: get_variant_price(sid, sync=True), scryfall_ids))
        image_results = list(pool.map(_fetch_image_bytes, image_urls))

    prices_by_scryfall_id = dict(zip(scryfall_ids, price_results))
    images_by_url = dict(zip(image_urls, image_results))

    def _sort_key(entry):
        value = price_value_for_sort(prices_by_scryfall_id.get(entry.variant.scryfall_id), entry.finish)
        # Highest price first; cards with no known price sink to the end.
        return (value is None, -value if value is not None else 0)

    entries.sort(key=_sort_key)

    csv_buffer = io.StringIO()
    writer = csv.writer(csv_buffer)
    writer.writerow(
        ["Carta", "Edición", "Número", "Finish", "Condición", "Idioma", "Cantidad",
         "Precio unitario (USD)", "Precio total (USD)"]
    )

    total_value = 0.0
    total_pages = max(math.ceil(len(entries) / _PAGE_SIZE), 1)
    zip_buffer = io.BytesIO()
    page_number_width = len(str(total_pages))

    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        for page_index in range(total_pages):
            page_entries = entries[page_index * _PAGE_SIZE : (page_index + 1) * _PAGE_SIZE]
            cell_images = []

            for entry in page_entries:
                variant = entry.variant
                price = prices_by_scryfall_id.get(variant.scryfall_id)
                price_text = _format_price_text(price, entry.finish)
                image_bytes = images_by_url.get(variant.image)
                cell_images.append(_build_card_cell(entry, image_bytes, price_text))

                unit_price = price_value_for_sort(price, entry.finish)
                row_total = unit_price * entry.quantity if unit_price is not None else None
                if row_total is not None:
                    total_value += row_total

                writer.writerow([
                    variant.card.name,
                    variant.card_set.name,
                    variant.collector_number,
                    "Foil" if entry.finish == "foil" else "Non-Foil",
                    entry.condition,
                    entry.language,
                    entry.quantity,
                    f"{unit_price:.2f}" if unit_price is not None else "",
                    f"{row_total:.2f}" if row_total is not None else "",
                ])

            page_bytes = _compose_page(cell_images, page_num=page_index + 1, total_pages=total_pages)
            page_label = str(page_index + 1).zfill(page_number_width)
            zf.writestr(f"paginas/pagina_{page_label}.jpg", page_bytes)

        writer.writerow([])
        writer.writerow(["", "", "", "", "", "", "", "Valor total", f"{total_value:.2f}"])
        # Leading BOM so Excel opens the accented Spanish headers as UTF-8.
        zf.writestr("inventario.csv", "﻿" + csv_buffer.getvalue())

    zip_buffer.seek(0)
    return zip_buffer.getvalue(), truncated
