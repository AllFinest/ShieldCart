/**
 * Home Page
 *
 * Main landing page with hero, featured products, categories,
 * testimonials, promotional banners, and trust indicators.
 * Designed to build user trust (TAM: perceived usefulness & security).
 */

import HeroSection from '../components/home/HeroSection';
import FeaturedProducts from '../components/home/FeaturedProducts';
import CategoryGrid from '../components/home/CategoryGrid';
import PromoSection from '../components/home/PromoSection';
import WhyShopWithUs from '../components/home/WhyShopWithUs';
import Testimonials from '../components/home/Testimonials';
import TrustBadges from '../components/common/TrustBadges';

function Home() {
  return (
    <div className="home-page">
      <HeroSection />
      <PromoSection />
      <FeaturedProducts />
      <CategoryGrid />
      <WhyShopWithUs />
      <Testimonials />
      <section className="home-trust-section">
        <div className="section-header">
          <h2>Security that stays out of your way</h2>
          <p className="section-subtitle">
            Every login and checkout gets quiet, layered protection
          </p>
        </div>
        <TrustBadges variant="horizontal" />
      </section>
    </div>
  );
}

export default Home;
