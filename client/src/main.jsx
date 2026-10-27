import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import Home from "./pages/Home.jsx";
import Men from "./pages/Men.jsx";
import Women from "./pages/Women.jsx";
import Kids from "./pages/Kids.jsx";
import About from "./components/About.jsx";
import ProductDetails from "./components/ProductDetails.jsx";
import SearchResults from "./components/SearchResults.jsx";
import Cart from "./pages/Cart.jsx";
import WishList from "./pages/WishList.jsx";
import { WishListProvider } from "./context/WishListContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SignUp from "./pages/SignUp.jsx";
import Signin from "./pages/Signin.jsx";
import PostProduct from "./pages/postProduct.jsx";
import ProductPage from "./pages/ProductPage.jsx";

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { path: '/postProduct', element: <PostProduct /> },
      { path: '/signup', element: <SignUp /> },
      { path: '/', element: <Home /> },
      { path: '/signin', element: <Signin /> },
      { path: '/about-us', element: <About /> },
      { path: '/cart', element: <Cart /> },
      { path: '/wishlist', element: <WishList /> },
      { path: '/shoes/men', element: <Men /> },
      { path: '/shoes/women', element: <Women /> },
      { path: '/shoes/kids', element: <Kids /> },
      { path: '/products/:id', element: <ProductPage /> },
      { path: '/product-details/:id', element: <ProductDetails /> },
      { path: '/search/:search', element: <SearchResults /> },
    ]
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <WishListProvider>
      <CartProvider>
        <RouterProvider router={router} />
        <ToastContainer />
      </CartProvider>
    </WishListProvider>
  </React.StrictMode>
);