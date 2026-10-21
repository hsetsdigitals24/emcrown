# Test-only independent QR decoder: uses the host's Pillow and libzbar, with no network.
import ctypes
import io
import sys
from PIL import Image


def decode(png):
    library = ctypes.CDLL("libzbar.so.0")
    signatures = {
        "zbar_image_scanner_create": ([], ctypes.c_void_p),
        "zbar_image_create": ([], ctypes.c_void_p),
        "zbar_image_set_format": ([ctypes.c_void_p, ctypes.c_ulong], None),
        "zbar_image_set_size": ([ctypes.c_void_p, ctypes.c_uint, ctypes.c_uint], None),
        "zbar_image_set_data": ([ctypes.c_void_p, ctypes.c_void_p, ctypes.c_ulong, ctypes.c_void_p], None),
        "zbar_scan_image": ([ctypes.c_void_p, ctypes.c_void_p], ctypes.c_int),
        "zbar_image_first_symbol": ([ctypes.c_void_p], ctypes.c_void_p),
        "zbar_symbol_get_data": ([ctypes.c_void_p], ctypes.c_char_p),
        "zbar_image_destroy": ([ctypes.c_void_p], None),
        "zbar_image_scanner_destroy": ([ctypes.c_void_p], None),
    }
    for name, (arguments, result) in signatures.items():
        function = getattr(library, name)
        function.argtypes, function.restype = arguments, result
    pixels = Image.open(io.BytesIO(png)).convert("L")
    buffer = ctypes.create_string_buffer(pixels.tobytes())
    scanner, image = library.zbar_image_scanner_create(), library.zbar_image_create()
    try:
        library.zbar_image_set_format(image, int.from_bytes(b"Y800", "little"))
        library.zbar_image_set_size(image, pixels.width, pixels.height)
        library.zbar_image_set_data(image, buffer, pixels.width * pixels.height, None)
        if library.zbar_scan_image(scanner, image) < 1:
            raise ValueError("Generated QR could not be decoded")
        return library.zbar_symbol_get_data(library.zbar_image_first_symbol(image)).decode()
    finally:
        library.zbar_image_destroy(image)
        library.zbar_image_scanner_destroy(scanner)


sys.stdout.write(decode(sys.stdin.buffer.read()))
