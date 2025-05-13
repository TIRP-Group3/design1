import React, { useEffect, useState } from "react";
import api from "../api"; // Import the API file to make requests

const Home = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Fetch the user data from the backend
    const fetchUserData = async () => {
      try {
        const response = await api.get("/users/me"); // Assuming '/users/me' is a route that returns the logged-in user's data
        setUser(response.data);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);

  return (
    <div className="centered">
      <h1>Welcome to the Home Page</h1>
      {user ? (
        <div>
          <h2>Welcome back, {user.username}!</h2>
          <p>Email: {user.email}</p>
        </div>
      ) : (
        <p>Loading user data...</p>
      )}
    </div>
  );
};

export default Home;
