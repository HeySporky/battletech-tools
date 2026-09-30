import React, { type JSX } from 'react';
import { useLocation } from 'react-router';

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

    /** Navigating away (a new reset key) clears the error without remounting a healthy page. */
    componentDidUpdate(previous: IErrorBoundaryProps): void {
        if (this.state.error && previous.resetKey !== this.props.resetKey) {
            this.setState({ error: null });
        }
    }

    render = (): JSX.Element => {
        if (this.state.error) {
            return (
                <div className="alert alert-danger" role="alert">
                    <h3>This page could not be shown</h3>
                    <p>
                        Something in the saved data for this page could not be read. Go to Settings, where you can
                        restore a backup or clear the saved data, then come back.
                    </p>
                    {this.props.showSettingsLink ? (
                        <p><a href={`${process.env.PUBLIC_URL}/settings`}>Open Settings</a></p>
                    ) : null}
                    <p className="small-text">{this.state.error.message}</p>
                </div>
            );
        }
        return <>{this.props.children}</>;
    }
}

interface IErrorBoundaryProps {
    children?: React.ReactNode | React.ReactNode[];
    /** For boundaries outside the page menu (the router root, printable pages). */
    showSettingsLink?: boolean;
    /** When this changes (e.g. the route), a shown error is cleared and the children render again. */
    resetKey?: string;
}

/** A boundary for every route, cleared whenever the route changes; catches pages rendered outside UIPage. */
export const RouteErrorBoundary = (props: { children?: React.ReactNode }): JSX.Element => {
    const location = useLocation();
    return <ErrorBoundary resetKey={location.pathname} showSettingsLink={true}>{props.children}</ErrorBoundary>;
};

interface IErrorBoundaryState {
    error: Error | null;
}
