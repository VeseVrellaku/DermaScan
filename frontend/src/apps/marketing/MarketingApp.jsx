import Header from './components/Header';
import Homepage from './components/Homepage';
import Footer from './components/Footer';
import './MarketingApp.css';

export default function MarketingApp() {
  return (
    <div className="index-page">
      <Header />
      <Homepage />
      <Footer />
    </div>
  );
}
