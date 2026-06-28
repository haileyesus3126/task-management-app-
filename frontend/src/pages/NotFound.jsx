import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h1>404</h1>
      <p>Page not found</p>
      <Link to="/dashboard">Back to Dashboard</Link>
    </div>
  );
};

export default NotFound;