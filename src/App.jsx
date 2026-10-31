import DesignApp from '../.design-source/src/app/App.tsx'
import { BackendProvider } from './backend/BackendContext'

/** The supplied Memento design is consumed as a self-contained UI module. */
export default function App() {
  return <BackendProvider><DesignApp /></BackendProvider>
}
