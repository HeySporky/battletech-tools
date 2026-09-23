import os
import sys
import json

def is_ascii(b):
    return 32 <= b <= 126 or b in (9,10,13)

def scan_blocks(data):
    """
    Scans the entire file and produces a RAW dump:
    - ASCII sequences
    - Binary sequences
    - Length-prefixed sequences
    - Everything in order
    """
    blocks = []
    i = 0
    n = len(data)

    while i < n:
        b = data[i]

        # Detect ASCII run
        if is_ascii(b):
            start = i
            while i < n and is_ascii(data[i]):
                i += 1
            ascii_text = data[start:i].decode("latin1", errors="replace")
            blocks.append({
                "type": "ascii",
                "start": start,
                "end": i,
                "text": ascii_text
            })
            continue

        # Detect length-prefixed block (only if safe)
        if i + 2 <= n:
            strlen = data[i] | (data[i+1] << 8)
            if 0 < strlen < 2000 and i + 2 + strlen <= n:
                raw = data[i+2:i+2+strlen]
                try:
                    txt = raw.decode("latin1")
                    blocks.append({
                        "type": "len_string",
                        "start": i,
                        "end": i+2+strlen,
                        "length": strlen,
                        "text": txt
                    })
                except:
                    blocks.append({
                        "type": "len_binary",
                        "start": i,
                        "end": i+2+strlen,
                        "length": strlen,
                        "hex": raw.hex(" ")
                    })
                i += 2 + strlen
                continue

        # Otherwise treat as raw binary byte
        blocks.append({
            "type": "byte",
            "offset": i,
            "hex": f"{data[i]:02x}"
        })
        i += 1

    return blocks

def parse_hmp(path):
    with open(path, "rb") as f:
        data = f.read()

    return {
        "filename": os.path.basename(path),
        "size": len(data),
        "header_hex": data[:16].hex(" "),
        "raw_blocks": scan_blocks(data)
    }

def write_text_dump(mech):
    lines = []
    lines.append(f"FILE: {mech['filename']}")
    lines.append(f"SIZE: {mech['size']} bytes")
    lines.append("")
    lines.append("HEADER (first 16 bytes):")
    lines.append(mech["header_hex"])
    lines.append("")
    lines.append("RAW BLOCKS:")
    lines.append("")

    for blk in mech["raw_blocks"]:
        if blk["type"] == "ascii":
            lines.append(f"[ASCII {blk['start']:05}-{blk['end']:05}]")
            lines.append(blk["text"])
            lines.append("")
        elif blk["type"] == "len_string":
            lines.append(f"[LEN_STRING {blk['start']:05}-{blk['end']:05} len={blk['length']}]")
            lines.append(blk["text"])
            lines.append("")
        elif blk["type"] == "len_binary":
            lines.append(f"[LEN_BINARY {blk['start']:05}-{blk['end']:05} len={blk['length']}]")
            lines.append(blk["hex"])
            lines.append("")
        elif blk["type"] == "byte":
            lines.append(f"[BYTE {blk['offset']:05}] {blk['hex']}")
            lines.append("")

    return "\n".join(lines)

def main():
    if len(sys.argv) != 3:
        print("Usage: python hmp_raw_dumper.py input_folder output_folder")
        return

    input_folder = sys.argv[1]
    output_folder = sys.argv[2]
    os.makedirs(output_folder, exist_ok=True)

    for fname in os.listdir(input_folder):
        if not fname.lower().endswith(".hmp"):
            continue

        full = os.path.join(input_folder, fname)
        mech = parse_hmp(full)

        base = os.path.splitext(fname)[0]

        # JSON
        with open(os.path.join(output_folder, base + ".json"), "w", encoding="utf8") as jf:
            json.dump(mech, jf, indent=2)

        # Text
        with open(os.path.join(output_folder, base + ".txt"), "w", encoding="utf8") as tf:
            tf.write(write_text_dump(mech))

        print(f"Processed: {fname}")

if __name__ == "__main__":
    main()