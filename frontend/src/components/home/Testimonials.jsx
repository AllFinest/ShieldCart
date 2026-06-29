/**
 * Testimonials Section
 *
 * Customer testimonials building trust and confidence.
 * Supports TAM (Technology Acceptance Model) through social proof.
 */

import { FiStar } from 'react-icons/fi';
import { testimonials } from '../../data/mockData';

function Testimonials() {
  return (
    <section className="testimonials-section">
      <div className="section-header">
        <h2>Shoppers in their own words</h2>
        <p className="section-subtitle">Notes from people who checked out with ShieldCart</p>
      </div>
      <div className="testimonials-grid">
        {testimonials.map((testimonial) => (
          <div key={testimonial.id} className="testimonial-card">
            <div className="testimonial-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <FiStar
                  key={star}
                  className={star <= testimonial.rating ? 'star-filled' : 'star-empty'}
                />
              ))}
            </div>
            <p className="testimonial-content">&ldquo;{testimonial.content}&rdquo;</p>
            <div className="testimonial-author">
              <div
                className="testimonial-avatar"
                style={{ backgroundColor: testimonial.color }}
              >
                {testimonial.initials}
              </div>
              <div>
                <span className="testimonial-name">{testimonial.name}</span>
                <span className="testimonial-role">{testimonial.role}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Testimonials;
