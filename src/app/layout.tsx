import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Draw a Flower',
  description:
    'A poetic journey through 9 days in Japan with Japanese wagashi, tea, windchimes, and AI-validated hand-drawn cherry blossoms floating in the wind.',
  icons: {
    icon: '/assets/sakura-petal.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Alex+Brush&family=Noto+Serif+JP:wght@300;400;600&family=Playfair+Display:ital,wght@0,400..700;1,400..700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased overflow-hidden selection:bg-pink-200">
        {children}
      </body>
    </html>
  );
}

