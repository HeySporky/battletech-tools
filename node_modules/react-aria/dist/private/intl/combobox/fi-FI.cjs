module.exports = {
    "buttonLabel": `N\xe4yt\xe4 ehdotukset`,
    "countAnnouncement": (args, formatter)=>`${formatter.plural(args.optionCount, {
            one: ()=>`${formatter.number(args.optionCount)} vaihtoehto`,
            other: ()=>`${formatter.number(args.optionCount)} vaihtoehtoa`
        })} saatavilla.`,
    "focusAnnouncement": (args, formatter)=>`${formatter.select({
            true: ()=>`Siirtyi ryhm\xe4\xe4n ${args.groupTitle}, jossa ${formatter.plural(args.groupCount, {
                    one: ()=>`${formatter.number(args.groupCount)} vaihtoehto`,
                    other: ()=>`${formatter.number(args.groupCount)} vaihtoehtoa`
                })}.`,
            other: ``
        }, args.isGroupChange)}${args.optionText}${formatter.select({
            true: `, valittu`,
            other: ``
        }, args.isSelected)}`,
    "listboxLabel": `Ehdotukset`,
    "selectedAnnouncement": (args)=>`${args.optionText}, valittu`
};


//# sourceMappingURL=fi-FI.cjs.map
