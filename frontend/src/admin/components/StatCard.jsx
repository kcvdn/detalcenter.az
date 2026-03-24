export default function StatCard({ title, value }) {
  return (
    <div className="bg-white p-5 rounded-2xl shadow">
      <h4 className="text-gray-500">{title}</h4>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}