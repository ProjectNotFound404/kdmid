from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

root = Path(__file__).resolve().parent.parent
destination = root / "dist"
destination.mkdir(exist_ok=True)
archive = destination / "kdmid-person-autofill.zip"
with ZipFile(archive, "w", ZIP_DEFLATED) as package:
    package.write(root / "LICENSE", "kdmid-person-autofill/LICENSE")
    for path in sorted((root / "extension").iterdir()):
        if path.is_file():
            package.write(path, f"kdmid-person-autofill/{path.name}")
print(archive)
