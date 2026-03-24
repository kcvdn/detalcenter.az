import StatCard from "../components/StatCard";

export default function Dashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-4 gap-4">
        <StatCard title="Ümumi satış" value="₼ 0" />
        <StatCard title="Aylıq satış" value="₼ 0" />
        <StatCard title="Günlük satış" value="₼ 0" />
        <StatCard title="Məhsul sayı" value="0" />
      </div>
    </div>
  );
}