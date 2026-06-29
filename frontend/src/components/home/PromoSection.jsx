/**
 * Promotional Section
 *
 * Displays promotional banners and offers on the homepage.
 */

import { FiTruck, FiGift, FiRefreshCw, FiHeadphones } from 'react-icons/fi';
import { promos } from '../../data/mockData';

const iconMap = {
  FiTruck: <FiTruck />,
  FiGift: <FiGift />,
  FiRefreshCw: <FiRefreshCw />,
  FiHeadphones: <FiHeadphones />,
};

function PromoSection() {
  return (
    <section className="promo-section">
      <div className="promo-grid">
        {promos.map((promo) => (
          <div key={promo.id} className="promo-card">
            <div className="promo-icon" style={{ color: promo.color }}>
              {iconMap[promo.icon] || <FiGift />}
            </div>
            <div className="promo-text">
              <h4>{promo.title}</h4>
              <p>{promo.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default PromoSection;
