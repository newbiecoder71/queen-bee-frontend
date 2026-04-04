import { Link } from "react-router-dom";
import heroImg from "/images/IMG_2357-opt.jpg";
import { useTheme } from "../../context/ThemeContext";

const Hero = () => {
  const { theme } = useTheme();
  const heroSrc = String(theme?.heroImageUrl || "").trim() || heroImg;

  return (
    <section className="relative">
      {/* Hero Image */}
      <img
        src={heroSrc}
        alt="Rabbit"
        className="w-full h-[400px] md:h-[600px] lg:h-[750px] object-cover"
        loading="eager"
        fetchPriority="high"
        decoding="async"
      />

      {/* Overlay for contrast */}
      <div className="absolute inset-0 bg-black/20"></div>

      {/* Centered text container */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center p-6">

          {/* Hero Heading */}
          <h1 className="
            relative
            theme-hero-heading
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
                theme-shop-now-btn
                px-6 py-2
                rounded-2xl
                text-lg
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
