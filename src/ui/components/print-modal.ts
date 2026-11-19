/**
 * Prints the contents of the modal holding `element` and nothing else (#372): the print styles in index.scss hide the
 * page and any other open modal while the body has `printing-modal`. The classes come off once printing is done.
 */
export function printModalContents( element: Element ): void {
    const modal = element.closest(".modal");
    if( !modal ) {
        window.print();
        return;
    }
    const done = () => {
        document.body.classList.remove("printing-modal");
        modal.classList.remove("modal-printing");
        window.removeEventListener("afterprint", done);
    };
    document.body.classList.add("printing-modal");
    modal.classList.add("modal-printing");
    window.addEventListener("afterprint", done);
    window.print();
}
