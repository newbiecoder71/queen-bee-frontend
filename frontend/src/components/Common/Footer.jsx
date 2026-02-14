import { IoLogoInstagram } from "react-icons/io";
import { RiTwitterXLine } from "react-icons/ri";
import { TbBrandMeta } from "react-icons/tb";
import { FiPhoneCall } from "react-icons/fi";
import { Link } from "react-router-dom";
import NewsletterSignup from "../Newsletter/NewsletterSignup";

const Footer = () => {
  return (
    <footer className="border-t py-12">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 px-4 lg:px-0">
            <div>
                <h3 className="text-lg text-gray-900 mb-4 ml-4">Newsletter</h3>
                <p className="text-gray-500 mb-4 ml-4">
                    Be the first to hear about new products, exclusive events, and online offers!
                </p>
                {/*<p className="font-medium text-sm text-gray-600 mb-6">
                    Sign up and receive 10% off your first order!
                </p> */}

                <NewsletterSignup />
            </div>

            {/* Shop Links */}
            <div>
                <h3 className="text-lg text-gray-800 mb-4">Shop</h3>
                <ul className="space-y-2 text-gray-600">
                    <li>
                        <Link to="/collections/all" className="hover:text-gray-500 transition-colors">All</Link>
                    </li>
                    <li>
                        <Link to="/collections/all?category=Fabric" className="hover:text-gray-500 transition-colors">Fabric</Link>
                    </li>
                    <li>
                        <Link to="/collections/all?category=Notions" className="hover:text-gray-500 transition-colors">Notions</Link>
                    </li>
                    <li>
                        <Link to="/collections/all?category=Patterns" className="hover:text-gray-500 transition-colors">Patterns</Link>
                    </li>
                    <li>
                        <Link to="/collections/all?category=Books" className="hover:text-gray-500 transition-colors">Books</Link>
                    </li>
                    <li>
                        <Link to="/collections/all?category=Kits" className="hover:text-gray-500 transition-colors">Kits</Link>
                    </li>
                </ul>
            </div>
            {/* Support Links */}
            <div>
            <h3 className="text-lg text-gray-800 mb-4">Support</h3>
                <ul className="space-y-2 text-gray-600">
                    <li>
                        <Link to="/contact" className="hover:text-gray-500 transition-colors">Contact Us</Link>
                    </li>
                    <li>
                        <Link to="/about" className="hover:text-gray-500 transition-colors">About Us</Link>
                    </li>
                    <li>
                        <Link to="/classes" className="hover:text-gray-500 transition-colors">Classes</Link>
                    </li>
                    <li>
                        <Link to="#" className="hover:text-gray-500 transition-colors">FAQs</Link>
                    </li>
                    <li>
                        <Link to="/services" className="hover:text-gray-500 transition-colors">Quilting Services</Link>
                    </li>
                </ul>
            </div>
            {/* Follow us */}
            <div>
                <h3 className="text-lg text-gray-800 mb-4">Follow Us</h3>
                <div className="flex items-center space-x-4 mb-6">
                    <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-500">
                        <TbBrandMeta className="h-5 w-5" />
                    </a>
                    <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-500">
                        <IoLogoInstagram className="h-5 w-5" />
                    </a>
                    <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-500">
                        <RiTwitterXLine className="h-5 w-5" />
                    </a>
                </div>
                <p className="text-gray-500">Call Us</p>
                <p>
                    <FiPhoneCall className="inline-block mr-2" />
                    1+ 417-893-9068
                </p>
            </div>
        </div>
        {/* Footer Bottom */}
        <div className="container mx-auto mt-12 px-4 lg:px-0 border-t border-gray-200 pt-6">
            <p className="text-sm tracking-tighter text-center">
                © 2026 Queen Bee Quilts.&nbsp;&nbsp;All Rights Reserved.
            </p>
        </div>
    </footer>
  );
};

export default Footer;