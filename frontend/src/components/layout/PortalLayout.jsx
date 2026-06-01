import Footer from './Footer';
import Header from './Header';

export default function PortalLayout({
  user,
  currentView,
  onNavigate,
  onLogout,
  onSupportClick,
  children,
}) {
  return (
    <div className="index-page portal-app">
      <div
        className="portal-page-bg"
        style={{ backgroundImage: 'url(/assets/img/hero-carousel/hero-carousel-1.jpg)' }}
        aria-hidden="true"
      />
      <Header
        user={user}
        currentView={currentView}
        onNavigate={onNavigate}
        onLogout={onLogout}
        onSupportClick={onSupportClick}
      />
      <main className="main portal-main">{children}</main>
      <Footer />
    </div>
  );
}
