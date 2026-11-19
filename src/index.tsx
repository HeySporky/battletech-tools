import 'bootstrap/dist/css/bootstrap.css';
import './index.scss';
import * as serviceWorker from './serviceWorker';
import AppRouter from './ui/app-router';

// ReactDOM.render(<AppRouter />, document.getElementById('root'));
import { createRoot } from 'react-dom/client';
const container = document.getElementById('root');
const root = createRoot(container!); // createRoot(container!) if you use TypeScript
root.render(<AppRouter />);
serviceWorker.unregister();
