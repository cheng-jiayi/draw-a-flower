import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-stone-700 bg-sky-50 font-serif">
      <h2 className="text-2xl font-bold mb-2">Page Not Found · ページが見つかりません</h2>
      <p className="text-sm text-stone-500 mb-4">The path you seek has drifted away with the wind.</p>
      <Link
        href="/"
        className="px-4 py-2 rounded-full bg-pink-500 text-white text-xs hover:bg-pink-600 transition-colors"
      >
        Return to Windchime Veranda
      </Link>
    </div>
  );
}

