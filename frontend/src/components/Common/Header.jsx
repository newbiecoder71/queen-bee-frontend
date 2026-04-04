import Topbar from "../Layout/Topbar";
import Navbar from "../Common/Navbar";

const Header = () => {
  return (
    <header className="border-b border-gray-200">
      {/* Topbar */}
      <Topbar />
      {/* navbar */}
      <div className="theme-navbar-bg">
        <Navbar />
      </div>
      {/* Cart Drawer */}
    </header>
  );
};

export default Header;

