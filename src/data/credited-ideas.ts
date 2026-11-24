/**
 * Public forum credits: posts on the official BattleTech forums (www.battletech.com/forums, formerly bg.battletech.com)
 * that an item came from or that had the same idea first. Each item's notes and TRO entry link them.
 */

/** A design, rule or idea posted on the official BattleTech forums. */
export interface IForumCredit { user: string; thread: string; date: string; url: string }

/** "Custom Homebrew by <user> (BattleTech forums, <thread>, <date>)", the style of the other community credits. */
export const forumCreditLine = (credit: IForumCredit): string => `Custom Homebrew by ${credit.user} (BattleTech forums, ${credit.thread}, ${credit.date})`;

/** "<user> (BattleTech forums, <thread>, <date>), <url>": a public post linked as a source or an earlier idea. */
export const forumSourceLine = (credit: IForumCredit): string => `${credit.user} (BattleTech forums, ${credit.thread}, ${credit.date}), ${credit.url}`;

export const PREGNANT_GUPPY_THREAD: IForumCredit = {
    user: "StingerTheRaven", thread: "Pregnant Guppy: an amphibious dropship", date: "25 April 2021",
    url: "https://www.battletech.com/forums/index.php?topic=73429.0",
};
export const BLACK_AND_BLUE_THREAD: IForumCredit = {
    user: "Chaeronea and The_Caveman", thread: "Black and Blue - DropShips and Wet Navy Ships", date: "December 2015",
    url: "https://www.battletech.com/forums/index.php?topic=50320.0",
};
/** Vehrec's first public SeaDropship post: an aerodyne DropShip whose hull and engines let it take off from water. */
export const VEHREC_WATER_TAKEOFF_POST: IForumCredit = {
    user: "Vehrec", thread: "ok time for silly question about dropships and submarines", date: "14 February 2015, reply 18",
    url: "https://www.battletech.com/forums/index.php?topic=44777.0",
};
/** Vehrec's water-landing DropShip, a Mule rival for ocean worlds with no spaceport, in the Pregnant Guppy thread. */
export const VEHREC_GUPPY_POST: IForumCredit = {
    user: "Vehrec", thread: "Pregnant Guppy: an amphibious dropship", date: "4 May 2021",
    url: "https://www.battletech.com/forums/index.php?topic=73429.0",
};
