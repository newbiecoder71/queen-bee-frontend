import { Link } from "react-router-dom";
import heroImg from "/images/IMG_2357.jpg";

const Hero = () => {
  return (
    <section className="relative">
      {/* Hero Image */}
      <img
        src={heroImg}
        alt="Rabbit"
        className="w-full h-[400px] md:h-[600px] lg:h-[750px] object-cover"
      />

      {/* Overlay for contrast */}
      <div className="absolute inset-0 bg-black/20"></div>

      {/* Centered text container */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center p-6">

          {/* Hero Heading */}
          <h1 className="
            relative
            text-purple-900
            text-5xl md:text-7xl
            lg:text-8xl
            font-bold
            tracking-tighter
            mb-4
            text-outline-tan-hero
            text-shadow-emboss
          ">
            Welcome to <br /> Queen Bee Quilts
          </h1>

          {/* Subtitle / Promo */}
          <p className="
            bg-yellow-200
            text-sm md:text-lg
            px-1 py-1
            rounded-2xl
            tracking-tighter
            mb-6
          ">
            All your quilting and sewing needs with FREE SHIPPING on orders over $99!!
          </p>

          {/* CTA Button */}
          <div>
            <Link
              to="./collections/all"
              className="
                bg-violet-300
                text-gray-950
                px-6 py-2
                rounded-md
                text-lg
                hover:bg-violet-100
                transition
                duration-300
              "
            >
              Shop Now
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Hero;