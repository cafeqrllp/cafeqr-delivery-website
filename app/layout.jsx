import './globals.css';

export const metadata = {
  title: 'CafeQR Delivery',
  description: 'Order food delivery and takeaway from your favourite restaurants',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#F97316" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="min-h-screen bg-stone-50">{children}</body>
    </html>
  );
}
