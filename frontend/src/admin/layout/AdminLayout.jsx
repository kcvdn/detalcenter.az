import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

export default function AdminLayout() {
  return (
    <div className="flex h-screen">
      <Sidebar />

      <div className="flex-1 bg-gray-100 p-6 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}