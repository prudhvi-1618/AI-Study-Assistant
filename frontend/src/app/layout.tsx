import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ThemeProvider } from '@/providers/ThemeProvider';
import './globals.css';
import './styles/animations.css';

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  weight: ['400', '500', '600', '700', '800', '900'],
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
});

export const metadata: Metadata = {
  title: 'StudyAI - AI-Powered Exam Prep',
  description:
    'Upload your notes. Ask anything. Master every topic. StudyAI uses AI to generate flashcards, quizzes, and personalized study plans.',
  openGraph: {
    title: 'StudyAI - AI-Powered Exam Prep',
    description:
      'Upload your notes. Ask anything. Master every topic. StudyAI uses AI to generate flashcards, quizzes, and personalized study plans.',
    url: 'https://studyai.app',
    siteName: 'StudyAI',
    images: [
      {
        url: 'https://studyai.app/og-image.png',
        width: 1200,
        height: 630,
        alt: 'StudyAI - AI-Powered Exam Prep',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'StudyAI - AI-Powered Exam Prep',
    description:
      'Upload your notes. Ask anything. Master every topic.',
    images: ['https://studyai.app/og-image.png'],
  },
  keywords: [
    'study app',
    'AI learning',
    'flashcards',
    'quiz generator',
    'exam prep',
    'study assistant',
  ],
  authors: [
    {
      name: 'StudyAI',
      url: 'https://studyai.app',
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
