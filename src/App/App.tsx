import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TabletApp from '../TabletApp/TableApp.tsx';
import MobileAuth from '../MobileAuth/MobileAuth.tsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TabletApp />} />
        <Route path="/auth" element={<MobileAuth />} />
      </Routes>
    </BrowserRouter>
  );
}