import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'Complaint & Grievance System',
    description: 'Online Complaint and Grievance Redressal System',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className="antialiased bg-gray-950 text-gray-100">{children}</body>
        </html>
    );
}
