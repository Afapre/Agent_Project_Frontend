from pathlib import Path

from PIL import Image


def remove_white_background_and_crop(src: Path, dst: Path) -> None:
    img = Image.open(src).convert("RGBA")
    pixels = img.load()
    width, height = img.size

    # Convert near-white pixels to transparent while preserving anti-aliased edges.
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if r >= 245 and g >= 245 and b >= 245:
                pixels[x, y] = (r, g, b, 0)

    alpha = img.split()[3]
    bbox = alpha.getbbox()
    if bbox is None:
        raise RuntimeError("No non-transparent logo pixels found after background removal")

    # Add a small breathing margin around the logo for better rendering in UI.
    margin = 8
    left = max(0, bbox[0] - margin)
    top = max(0, bbox[1] - margin)
    right = min(width, bbox[2] + margin)
    bottom = min(height, bbox[3] + margin)

    cropped = img.crop((left, top, right, bottom))
    dst.parent.mkdir(parents=True, exist_ok=True)
    cropped.save(dst, format="PNG")


def save_resized_versions(src: Path, targets: list[tuple[Path, int]]) -> None:
    base = Image.open(src).convert("RGBA")

    for target, size in targets:
        resized = base.resize((size, size), Image.Resampling.LANCZOS)
        target.parent.mkdir(parents=True, exist_ok=True)
        resized.save(target, format="PNG")


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    source_logo = root / "CLARA_logo.png"

    if not source_logo.exists():
        raise FileNotFoundError(f"Source logo not found: {source_logo}")

    extracted_logo = root / "src" / "assets" / "clara-logo.png"
    remove_white_background_and_crop(source_logo, extracted_logo)

    # Keep both src and public assets aligned with the transparent version.
    public_logo = root / "public" / "clara-logo.png"
    Image.open(extracted_logo).save(public_logo, format="PNG")

    save_resized_versions(
        extracted_logo,
        [
            (root / "public" / "logo192.png", 192),
            (root / "public" / "logo512.png", 512),
        ],
    )


if __name__ == "__main__":
    main()
