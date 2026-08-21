import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider.jsx';
import { homeForRole } from './authApi.js';

/**
 * The route guard. Wraps a whole role app:
 *
 *   <Route element={<RequireAuth roles={['ADMIN', 'STAFF']} />}>
 *     <Route path="/admin" element={<AdminLayout />}> … </Route>
 *   </Route>
 *
 * Two outcomes, and they are deliberately different:
 *
 *  • Not signed in  -> the sign-in screen, remembering where they were
 *    heading so the redirect after signing in lands on the page they
 *    asked for rather than dumping them on a home page.
 *
 *  • Signed in as the wrong role -> their OWN home, not an error page. A
 *    volunteer who types /admin has not done anything wrong; they have
 *    followed a stale link. Sending them somewhere useful beats scolding
 *    them, and it never confirms what does or does not exist behind the
 *    door they tried.
 *
 * Worth being honest about in the pitch: this is navigation, not
 * security. It stops the wrong screen rendering; it does not stop a
 * request. The authorisation that counts is the role middleware on the
 * API (src/middleware/roleMiddleware.js), which checks the JWT cookie on
 * every call and does not trust anything the browser says about itself.
 */
export default function RequireAuth({ roles }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={homeForRole(user.role)} replace />;
  }

  return <Outlet />;
}

/** The inverse: keep an already signed-in person off the sign-in screens. */
export function RedirectIfSignedIn({ children }) {
  const { user } = useAuth();
  if (user) return <Navigate to={homeForRole(user.role)} replace />;
  return children;
}
