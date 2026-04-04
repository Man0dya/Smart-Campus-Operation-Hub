import { useEffect, useState } from "react";
import api from "../services/api";

function ResourcesPage() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.get("/test")
      .then((res) => setMessage(res.data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div>
      <h1>Resources Page</h1>
      <p>{message}</p>
    </div>
  );
}

export default ResourcesPage;