// Creator dropdowns list only what the design's tech base, era and rules level allow. The current
// selection stays listed even when it is no longer available (after an era or tech change), marked as
// such, so the select never silently shows a different value.

interface IAvailabilityOption {
    name: string;
    available?: boolean;
    availableAsPrototype?: boolean;
}

export function isOptionShown(option: IAvailabilityOption, selected: boolean): boolean {
    return !!option.available || selected;
}

export function availabilityOptionLabel(option: IAvailabilityOption): string {
    if (!option.available) {
        return option.name + " (unavailable)";
    }
    return option.name + (option.availableAsPrototype ? " (Prototype)" : "");
}
