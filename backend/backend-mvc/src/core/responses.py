from typing import Any


def success_response(data: Any = None, message: str = "Success") -> dict[str, Any]:
    return {
        "success": True,
        "message": message,
        "data": data,
    }


def error_response(
    message: str,
    error_code: str = "ERROR",
    details: Any = None,
) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "success": False,
        "message": message,
        "error_code": error_code,
    }
    if details is not None:
        payload["details"] = details
    return payload


def paginated_response(
    items: list[Any],
    total: int,
    page: int,
    page_size: int,
    message: str = "Success",
) -> dict[str, Any]:
    return success_response(
        data={
            "items": items,
            "pagination": {
                "total": total,
                "page": page,
                "page_size": page_size,
                "total_pages": (total + page_size - 1) // page_size if page_size else 0,
            },
        },
        message=message,
    )
