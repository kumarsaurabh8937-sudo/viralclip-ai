import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../styles/globals.css';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ViralClip AI — Turn Videos into Viral Shorts',
  description: 'AI-powered tool that converts long videos into viral 9:16 shorts with smart face-tracking, Hinglish captions, dynamic zoom, and background music balancing.',
  keywords: ['AI shorts', 'video editor', 'Hinglish captions', 'viral video', 'reels creator'],
  openGraph: {
    title: 'ViralClip AI',
    description: 'Convert long videos into viral AI-powered 9:16 shorts',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-base-bg text-text-primary antialiased`}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1E1E1E',
              color: '#F9FAFB',
              border: '1px solid #333333',
            },
            success: {
              iconTheme: { primary: '#A855F7', secondary: '#1E1E1E' },
            },
            error: {
              iconTheme: { primary: '#EC4899', secondary: '#1E1E1E' },
            },
          }}
        />
      </body>
    </html>
  );
}
