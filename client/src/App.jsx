import { Outlet ,Route,Routes} from "react-router-dom"
import Header from './components/Header'
import Footer from './components/Footer'
import './App.css'
import Signin from "./pages/SignUp"

const App = () => {
  return (
    <>
      <Header />
      <Outlet />
      <Footer />
      
    </>
  )
}

export default App