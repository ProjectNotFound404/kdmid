from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

root = Path(__file__).resolve().parent.parent
destination = root / "dist"
destination.mkdir(exist_ok=True)
files = sorted(path for path in (root / "extension").rglob("*") if path.is_file())
for name, prefix in [("kdmid-person-autofill.zip", "kdmid-person-autofill/"), ("kdmid-chrome-web-store.zip", "")]:
    archive = destination / name
    with ZipFile(archive, "w", ZIP_DEFLATED) as package:
        package.write(root / "LICENSE", f"{prefix}LICENSE")
        for path in files:
            package.write(path, f"{prefix}{path.relative_to(root / 'extension').as_posix()}")
    print(archive)
