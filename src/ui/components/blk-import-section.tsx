import React, { type JSX } from 'react';
import { BLK_READERS, BlkUnit, BlkUnitKind, importBlkUnit } from '../../classes/blk-unit-import';
import { MAX_BLK_FILE_LENGTH } from '../../utils/blk-file';
import TextSection from './text-section';

export interface IBlkImportOutcome {
    /** True when a unit was read and loaded into the editor. */
    loaded: boolean;
    /** What could not be carried over, what changed form, and the loaded design's rule issues. */
    messages: string[];
}

// Reads a MegaMek ".blk" file chosen by the user through the one MegaMek reader (importBlkUnit), hands the unit to
// the creator, then lists what could not be carried over. Shared by every creator that imports MegaMek files.
export default class BlkImportSection extends React.Component<IBlkImportSectionProps, IBlkImportSectionState> {
    constructor(props: IBlkImportSectionProps) {
        super(props);
        this.state = { fileName: "", outcome: null };
    }

    importFile = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const input = e.currentTarget;
        const file = input.files && input.files[0];
        if (!file) return;
        if (file.size > MAX_BLK_FILE_LENGTH) {
            this.setState({ fileName: file.name, outcome: { loaded: false, messages: ["The file is too large to be a unit file."] } });
            input.value = "";
            return;
        }
        const reader = new FileReader();
        reader.onload = () => this.setState({ fileName: file.name, outcome: this.read(typeof reader.result === "string" ? reader.result : "") });
        reader.onerror = () => this.setState({ fileName: file.name, outcome: { loaded: false, messages: ["The file could not be read."] } });
        reader.readAsText(file);
        input.value = "";
    }

    read = (text: string): IBlkImportOutcome => {
        const result = importBlkUnit(text, this.props.accept);
        if (!result.unit || !result.kind) return { loaded: false, messages: result.issues };
        return { loaded: true, messages: [...result.notes, ...result.issues, ...this.props.onLoad(result.unit, result.kind)] };
    }

    render = (): JSX.Element => {
        const outcome = this.state.outcome;
        return (
            <TextSection label="Import a MegaMek File">
                <p>
                    Load {this.props.accept.map((kind) => BLK_READERS[kind].name).join(" or ")} from a MegaMek or MegaMekLab <code>.blk</code> file.
                    The design replaces the one in the editor; save your current design first if you want to keep it.
                </p>
                <label>
                    Choose a .blk file:{" "}
                    <input type="file" accept=".blk,text/plain" data-testid={`${this.props.testId}-import-file`} style={{ width: "auto" }} onChange={this.importFile} aria-label="Choose a .blk file" />
                </label>
                {outcome ? (
                    <div data-testid={`${this.props.testId}-import-result`}>
                        <p><strong>{this.state.fileName}</strong>: {outcome.loaded ? "loaded into the editor." : "not loaded."}</p>
                        {outcome.messages.length > 0 ? (
                            <ul className={outcome.loaded ? "" : "color-red"}>
                                {outcome.messages.map((message, index) => <li key={index}>{message}</li>)}
                            </ul>
                        ) : <p>Everything in the file was carried over, and the design is legal.</p>}
                    </div>
                ) : null}
                <p className="smaller-text">
                    {this.props.note ?? "The file's equipment names are matched to this catalog; anything without a match is left off and listed."}
                </p>
            </TextSection>
        );
    }
}

interface IBlkImportSectionProps {
    /** The kinds of unit the creator builds; a file of another kind is refused with a message naming it. */
    accept: BlkUnitKind[];
    testId: string;
    /** Puts the read unit in the editor; gives the loaded design's rule issues. */
    onLoad: (unit: BlkUnit, kind: BlkUnitKind) => string[];
    /** How the file's contents are matched, in place of the general sentence. */
    note?: string;
}

interface IBlkImportSectionState {
    fileName: string;
    outcome: IBlkImportOutcome | null;
}
