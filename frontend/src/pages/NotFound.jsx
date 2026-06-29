/**
 * 404 Not Found Page
 */

import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="not-found-page">
      <h1>404</h1>
      <h2>This page wandered off</h2>
      <p>The link points somewhere we cannot reach from here.</p>
      <Link to="/" className="btn btn-primary">
        Go back to the start
      </Link>
    </div>
  );
}

export default NotFound;
