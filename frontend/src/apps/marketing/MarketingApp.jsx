import Header from '../../components/layout/Header';
import Homepage from './components/Homepage';
import Footer from '../../components/layout/Footer';
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
