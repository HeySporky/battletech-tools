// Reads the block layout of a MegaMek ".blk" unit file: "<tag>", its lines, "</tag>". Lines starting with "#" are
// comments. Only the layout is read here; what the blocks mean is up to the unit type's own importer.

/** Largest file read, in characters; unit files run to a few tens of kilobytes. */
export const MAX_BLK_FILE_LENGTH = 400000;
const MAX_BLOCK_LINES = 400;

export interface IBlkFile {
    /** The lines of each block, by its tag in lower case; a tag that appears again adds to the same block. */
    blocks: Record<string, string[]>;
}

export const parseBlkFile = (text: string): IBlkFile | null => {
    if (typeof text !== "string" || text.length === 0 || text.length > MAX_BLK_FILE_LENGTH) return null;
    const blocks: Record<string, string[]> = Object.create(null);
    let current: string | null = null;
    for (const rawLine of text.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith("#")) continue;
        const close = /^<\/([^<>]{1,80})>$/.exec(line);
        if (close) {
            current = null;
            continue;
        }
        const open = /^<([^<>/][^<>]{0,79})>$/.exec(line);
        if (open) {
            current = open[1].trim().toLowerCase();
            if (!blocks[current]) blocks[current] = [];
            continue;
        }
        if (current !== null && blocks[current].length < MAX_BLOCK_LINES) blocks[current].push(line);
    }
    return Object.keys(blocks).length > 0 ? { blocks } : null;
};

/** The first line of a block, or an empty string. */
export const blkValue = (file: IBlkFile, tag: string): string => file.blocks[tag.toLowerCase()]?.[0] ?? "";
export const blkLines = (file: IBlkFile, tag: string): string[] => file.blocks[tag.toLowerCase()] ?? [];
