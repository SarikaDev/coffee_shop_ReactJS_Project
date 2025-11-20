// // react 3001, next 3002, postgREST + DB 3000, nginx 8081
// // Define the User type based on your API response

import Login from "./Login";
import Profile from "./Profile";
import Signup from "./Signup";

const App = () => {
  return (
    <>
      <Login />
      <Signup />
      <Profile />
    </>
  );
};

export default App;
