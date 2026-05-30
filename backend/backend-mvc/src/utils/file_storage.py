import uuid
from pathlib import Path

import aiofiles
from fastapi import UploadFile

from src.config import Config
from src.core.exceptions import ValidationException


class FileStorageService:
    def __init__(self, upload_dir: str | None = None) -> None:
        self.upload_dir = Path(upload_dir or Config.UPLOAD_DIR)
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    def _validate_extension(self, filename: str) -> str:
        extension = Path(filename).suffix.lstrip(".").lower()
        if extension not in Config.allowed_extensions:
            allowed = ", ".join(sorted(Config.allowed_extensions))
            raise ValidationException(
                f"Invalid file type '.{extension}'. Allowed types: {allowed}"
            )
        return extension

    def _validate_size(self, size: int) -> None:
        if size > Config.max_upload_size_bytes:
            raise ValidationException(
                f"File exceeds maximum size of {Config.MAX_UPLOAD_SIZE_MB}MB"
            )

    async def save_upload(
        self,
        file: UploadFile,
        user_id: uuid.UUID,
        scan_id: uuid.UUID,
    ) -> tuple[str, str, str, int]:
        if not file.filename:
            raise ValidationException("Uploaded file must have a filename")

        extension = self._validate_extension(file.filename)
        content = await file.read()
        self._validate_size(len(content))

        mime_type = file.content_type or f"image/{extension}"
        if not mime_type.startswith("image/"):
            raise ValidationException("Only image files are allowed")

        stored_filename = f"{uuid.uuid4()}.{extension}"
        relative_dir = Path(str(user_id)) / str(scan_id)
        target_dir = self.upload_dir / relative_dir
        target_dir.mkdir(parents=True, exist_ok=True)

        file_path = target_dir / stored_filename
        async with aiofiles.open(file_path, "wb") as out_file:
            await out_file.write(content)

        relative_path = str(relative_dir / stored_filename).replace("\\", "/")
        image_url = f"/uploads/{relative_path}"
        return file.filename, stored_filename, relative_path, len(content)

    def delete_scan_directory(self, user_id: uuid.UUID, scan_id: uuid.UUID) -> None:
        scan_dir = self.upload_dir / str(user_id) / str(scan_id)
        if scan_dir.exists():
            for path in scan_dir.rglob("*"):
                if path.is_file():
                    path.unlink()
            for path in sorted(scan_dir.rglob("*"), reverse=True):
                if path.is_dir():
                    path.rmdir()
            if scan_dir.exists():
                scan_dir.rmdir()
