import LogoutButton from "./LogoutButton";

export default function AdminHomePage() {
  return (
    <main className="min-h-screen bg-neutral-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold text-neutral-900">Admin</h1>
          <LogoutButton />
        </div>
        <p className="text-neutral-600 mb-6">
          Přihlášení funguje 🎉 Sem postupně přibudou objednávky a dotazy od klientů.
        </p>

        <a
          href="/admin/recenze"
          className="inline-block bg-white border border-neutral-200 rounded-xl px-5 py-4 hover:border-neutral-400 transition-colors"
        >
          <span className="block font-medium text-neutral-900">Recenze</span>
          <span className="block text-sm text-neutral-500">Zobrazit a mazat recenze</span>
        </a>
      </div>
    </main>
  );
}