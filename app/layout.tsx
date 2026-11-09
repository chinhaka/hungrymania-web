import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AuthModals from '@/components/AuthModals';

export const metadata = {
  title: 'HungryMania - Restaurant Discovery & Table Reservations',
  description: 'Search restaurants, reserve tables, and order menus instantly.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50">
        <AuthProvider>
          <Navbar />
          {children}
          <AuthModals />
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}

