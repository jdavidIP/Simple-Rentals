import { Link } from "react-router-dom";

function Unauthorized() {
  return (
    <div style={{ textAlign: "center", marginTop: "4rem" }}>
      <h1>401 - Unauthorized</h1>
      <p>You do not have permission to view this page.</p>
      <Link to="/" className="btn btn-primary">
        Go to Home
      </Link>
    </div>
  );
}

export default Unauthorized;
