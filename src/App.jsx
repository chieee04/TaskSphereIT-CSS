// App.jsx
import { useState, useEffect } from "react"
import Signin from "./components/Signin"
import Header from "./components/Header"
import Footer from "./components/Footer"
import Sidebar from "./components/Sidebar"
import { Outlet } from "react-router-dom"

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    // check once sa mount
    const customUser = localStorage.getItem("customUser")
    const adminUser = localStorage.getItem("adminUser")
    setIsLoggedIn(!!(customUser || adminUser))
  }, [])

  return (
    <>
      <Header isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
      <div className="d-flex">
        <main className="flex-grow-1 p-3">
          {/* Ipapasa natin yung setIsLoggedIn sa mga anak para kapag Sign in nag-trigger agad */}
          <Outlet context={{ setIsLoggedIn }} />
        </main>
      </div>
      <Footer />
    </>
  )
}

export default App
