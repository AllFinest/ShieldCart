/**
 * Category Grid
 *
 * Displays product categories as clickable cards for easy navigation.
 */

import { Link } from 'react-router-dom';
import { FiMonitor, FiShoppingBag, FiHome, FiActivity, FiBook, FiHeart } from 'react-icons/fi';
import { categories } from '../../data/mockData';

const iconMap = {
  FiMonitor: <FiMonitor />,
  FiShoppingBag: <FiShoppingBag />,
  FiHome: <FiHome />,
  FiActivity: <FiActivity />,
  FiBook: <FiBook />,
  FiHeart: <FiHeart />,
};

function CategoryGrid() {
  return (
    <section className="category-section">
      <div className="section-header">
        <h2>Browse your way</h2>
        <p className="section-subtitle">Head right to the aisle that fits your day</p>
      </div>
      <div className="category-grid">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            to={`/items?category=${cat.slug}`}
            className="category-card"
          >
            <div className="category-icon">
              {iconMap[cat.icon] || <FiShoppingBag />}
            </div>
            <h3 className="category-name">{cat.name}</h3>
            <span className="category-count">{cat.count} items</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default CategoryGrid;
