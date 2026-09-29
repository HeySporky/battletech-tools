import React, { type JSX } from 'react';

/**
 * Catches errors thrown while rendering a page, so bad saved data (for example from a restored backup) shows a
 * message under the menu instead of unmounting the whole app. The menu stays usable, so the user can reach
 * Settings to restore or clear the data.
 */
export default class ErrorBoundary extends React.Component<IErrorBoundaryProps, IErrorBoundaryState> {

    state: IErrorBoundaryState = { error: null };

    static getDerivedStateFromError(error: unknown): IErrorBoundaryState {
        return { error: error instanceof Error ? error : new Error(String(error)) };
    }

    componentDidCatch(error: unknown): void {
        console.error("Page failed to render:", error);
    }

    render = (): JSX.Element => {
        if (this.state.error) {
            return (
                <div className="alert alert-danger" role="alert">
                    <h3>This page could not be shown</h3>
                    <p>
                        Something in the saved data for this page could not be read. Use the menu to go to
                        Settings, where you can restore a backup or clear the saved data, then come back.
                    </p>
                    <p className="small-text">{this.state.error.message}</p>
                </div>
            );
        }
        return <>{this.props.children}</>;
    }
}

interface IErrorBoundaryProps {
    children?: React.ReactNode | React.ReactNode[];
}

interface IErrorBoundaryState {
    error: Error | null;
}
