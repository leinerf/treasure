import { useNavigate } from "react-router-dom";
function Home() {
  const navigate = useNavigate();
  if(localStorage.getItem("authenticated") !== "true") {
    // window.location.href = "/login";
    navigate("/login");
    return null;
  }
  
  return (
    <div className="home">
      <h1>Welcome to the Home Page</h1>
      <p>This is the main landing page of the application.</p>
    </div>
  );
}

export default Home;