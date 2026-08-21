// src/App.jsx
import AuthPage from "./pages/AuthPage";

function App() {
  const handleAuthSuccess = (user) => {
    console.log("Logged in as", user);
  };

  return <AuthPage onAuthSuccess={handleAuthSuccess} />;
}

export default App;