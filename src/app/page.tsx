import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-dark px-4">
      <div className="w-full max-w-xl rounded-2xl bg-surface p-10 shadow-xl ring-1 ring-white/10">
        <p className="text-sm uppercase tracking-wide text-secondary font-bold">Silifke Teknoloji Kulübü</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Yönetim Paneli</h1>
        <p className="mt-3 text-base text-slate-300">
          Proje yönetimi, görev takibi ve topluluk işbirliği için geliştirilmiş merkezi platform.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-secondary to-yellow-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-900/20 transition hover:bg-orange-600 hover:shadow-orange-900/40"
          >
            Giriş Yap
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-surface px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
          >
            Hesap Oluştur
          </Link>
        </div>
      </div>
    </main>
  );
}
