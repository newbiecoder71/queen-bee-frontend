import { Link } from "react-router-dom";
import { HiOutlineUser, HiOutlineShoppingBag, HiBars3BottomRight, } from "react-icons/hi2";
import SearchBar from "./SearchBar";
import CartDrawer from "../Layout/CartDrawer";
import { useState } from "react";
import { IoMdClose } from "react-icons/io";
import { useSelector } from "react-redux";

const Navbar = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [navDrawerOpen, setNavDrawerOpen] = useState(false);
  const {cart} = useSelector((state) => state.cart);
  const {user} = useSelector((state) => state.auth);

  const cartItemCount = Array.isArray(cart?.products)
    ? cart.products.reduce((total, item) => total + (item.quantity || 0), 0)
    : 0;
    console.log("Cart item count:", cartItemCount);
    console.log("Cart products:", cart?.products);



  const toggleNavDrawer = () => {
    setNavDrawerOpen(!navDrawerOpen);
  };

  const toggleCartDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };
  return (
    <>
        <nav className="container mx-auto flex items-center justify-between py-4 px-6">
            {/* Left - Logo */}
            <div>
                <Link to="/" className="text-2xl font-medium">
                    Queen Bee Quilts
                </Link>
            </div>
            {/* Center Navigation Links */}
            <div className="hidden md:flex space-x-6">
                <Link to="/collections/all?category=Fabric" className="text-gray-700 hover:text-black text-sm font-medium uppercase">
                    Fabric
                </Link>
                <Link to="/collections/all?category=Notions" className="text-gray-700 hover:text-black text-sm font-medium uppercase">
                    Notions
                </Link>
                <Link to="/collections/all?category=Patterns" className="text-gray-700 hover:text-black text-sm font-medium uppercase">
                    Patterns
                </Link>
                <Link to="/collections/all?category=Books" className="text-gray-700 hover:text-black text-sm font-medium uppercase">
                    Books
                </Link>
                <Link to="/collections/all?category=Kits" className="text-gray-700 hover:text-black text-sm font-medium uppercase">
                    Kits
                </Link>
                {user && (
                    <Link to="/my-quilts" className="text-gray-700 hover:text-black text-sm font-medium uppercase">
                        My Quilts
                    </Link>
                )}
            </div>
            {/* Right Icons */}
            <div className="flex items-center space-x-4">
                {user && user.role === "admin" && (
                    <Link to="/admin" className="block bg-black px-2 rounded text-sm text-white">
                        Admin
                    </Link>
                )}
                
                <Link to="/profile" className="hover:text-black">
                    <HiOutlineUser className="h-7 w-7 text-gray-700" />
                </Link>
                <button onClick={toggleCartDrawer} className="relative hover:text-black">
                    <HiOutlineShoppingBag className="h-7 w-7 text-gray-700" />
                    {cartItemCount > 0 && (
                        <span className="absolute -top-1 bg-rabbit-blue text-white text-xs rounded-full px-2 py-0.5">{cartItemCount}</span>
                    )}
                </button>
                {/* Search */}
                <div className="overflow-hidden">
                    <SearchBar />
                </div>
                <button onClick={toggleNavDrawer} className="md:hidden">
                    <HiBars3BottomRight className="h-6 w-6 text-gray-700" />
                </button>
            </div>
        </nav>
        <CartDrawer drawerOpen={drawerOpen} toggleCartDrawer={toggleCartDrawer} />

        {/* Mobile Navigation */}
        <div className={`fixed top-0 left-0 w-3/4 sm:w-1/2 md:w-1/3 h-full bg-white shadow-lg transform transition-transform duration-300 z-50 ${navDrawerOpen ? "translate-x-0" : "-translate-x-full"}`}>
            <div className="flex justify-end p-4">
                <button onClick={toggleNavDrawer}>
                    <IoMdClose className="h-6 w-6 text-gray-600" />
                </button>
            </div>
            <div className="p-4">
                <h2 className="text-xl font-semibold mb-4">Menu</h2>
                <nav className="space-y-4">
                    <Link to="/collections/all?category=Fabric" onClick={toggleNavDrawer} className="block text-gray-600 hover:text-black">
                        Fabric
                    </Link>
                    <Link to="/collections/all?category=Notions" onClick={toggleNavDrawer} className="block text-gray-600 hover:text-black">
                        Notions
                    </Link>
                    <Link to="/collections/all?category=Patterns" onClick={toggleNavDrawer} className="block text-gray-600 hover:text-black">
                        Patterns
                    </Link>
                    <Link to="/collections/all?category=Books" onClick={toggleNavDrawer} className="block text-gray-600 hover:text-black">
                        Books
                    </Link>
                    <Link to="/collections/all?category=Kits" onClick={toggleNavDrawer} className="block text-gray-600 hover:text-black">
                        Kits
                    </Link>
                </nav>
            </div>
        </div>
    </>
  );
};

export default Navbar;