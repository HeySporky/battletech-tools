/*
 * Tag lookups. Records keep every historical tag in `altTags` (Jeff's originals, upstream's, ours), so a tag
 * read from a save, a backup, another record or the user matches a record by its current tag or any of its
 * alternate tags. Use these helpers wherever such a tag is looked up; comparing a record's `.tag` with `===`
 * silently misses renamed records.
 */
export interface ITaggedRecord {
    tag: string;
    altTags?: string[];
}

/** True when `tag` is the record's tag or one of its alternate tags. Non-strings never match. */
export const matchesTag = (record: ITaggedRecord | null | undefined, tag: unknown): boolean => {
    if (!record || typeof tag !== "string" || tag === "") return false;
    return record.tag === tag || (Array.isArray(record.altTags) && record.altTags.includes(tag));
};

/** The record whose tag or alternate tags include `tag`, preferring a current-tag match over an alternate one. */
export const findByTag = <T extends ITaggedRecord>(records: readonly T[], tag: unknown): T | undefined => {
    if (typeof tag !== "string" || tag === "") return undefined;
    return records.find((record) => record.tag === tag) ?? records.find((record) => matchesTag(record, tag));
};
