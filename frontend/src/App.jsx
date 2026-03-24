import { BrowserRouter, Routes, Route } from "react-router-dom";

import AdminLayout from "./admin/layout/AdminLayout";
import Dashboard from "./admin/pages/Dashboard";
import Products from "./admin/pages/Products";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ADMIN */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<Products />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;