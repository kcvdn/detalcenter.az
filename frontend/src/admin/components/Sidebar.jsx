import { Link } from "react-router-dom";

export default function Sidebar() {
  return (
    <div className="w-64 bg-gray-900 text-white p-5">
      <h1 className="text-2xl font-bold mb-8">Detal Admin</h1>

      <ul className="space-y-4">
        <li>
          <Link to="/admin" className="block hover:text-gray-300">
            Dashboard
          </Link>
        </li>

        <li>
          <Link to="/admin/products" className="block hover:text-gray-300">
            Məhsullar
          </Link>
        </li>
      </ul>
    </div>
  );
}