import { Link } from "react-router-dom";
const mensCollectionImage = "/images/IMG_2347-opt.jpg";
const womensCollectionImage = "/images/IMG_2357-opt.jpg";

const GenderCollectionSection = () => {
  return (
    <section className="py-16 px-4 lg:px-0">
        <div className="container mx-auto flex flex-col md:flex-row gap-8">
            {/* Womens Collection */}
            <div className="relative flex-1">
                <img
                  src={womensCollectionImage}
                  alt="Women's Collection"
                  className="w-full h-[700px] object-cover"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute bottom-8 left-8 bg-white bg-opacity-90 p-4">
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">
                        Women's Collection
                    </h2>
                    <Link to="/collections/all?gender=Women" className="theme-shop-now-btn inline-block px-4 py-2 rounded">
                        Shop Now
                    </Link>
                </div>
            </div>
            {/* Men's Collection */}
            <div className="relative flex-1">
                <img
                  src={mensCollectionImage}
                  alt="Men's Collection"
                  className="w-full h-[700px] object-cover"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute bottom-8 left-8 bg-white bg-opacity-90 p-4">
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">
                        Men's Collection
                    </h2>
                    <Link to="/collections/all?gender=Men" className="theme-shop-now-btn inline-block px-4 py-2 rounded">
                        Shop Now
                    </Link>
                </div>
            </div>
        </div>
    </section>
  );
};

export default GenderCollectionSection;
