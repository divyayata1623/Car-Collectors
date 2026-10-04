import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productsAPI } from '../api';
import { resolveImageUrl } from '../api/client';
import type { Product } from '../types';

export const HomePage: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFeaturedProducts();
  }, []);

  const loadFeaturedProducts = async () => {
    try {
      const response = await productsAPI.getProducts({ page: 1, limit: 4 });
      setFeaturedProducts(response.data.products);
    } catch (error) {
      console.error('Failed to load featured products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030911] text-white">

      {/* ==================== HERO SECTION ==================== */}
      <section className="relative overflow-hidden">
        
        {/* Background Glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px]" />
          <div className="absolute top-20 right-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-[120px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-24 lg:py-32">

          <div className="max-w-5xl mx-auto text-center">

            {/* Welcome */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="w-12 h-[2px] bg-orange-500" />

              <span className="text-orange-500 font-semibold tracking-[0.25em] text-sm">
                WELCOME TO CAR COLLECTORS
              </span>

              <div className="w-12 h-[2px] bg-orange-500" />
            </div>

            {/* Main Heading */}
            <h1 className="font-display font-extrabold leading-[0.95] tracking-tight mb-8">

              <span className="block text-6xl md:text-7xl lg:text-8xl text-white">
                Premium Die-Cast
              </span>

              <span className="block text-6xl md:text-7xl lg:text-8xl mt-3">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600">
                  Cars
                </span>
              </span>

            </h1>

            {/* Description */}
            <p className="max-w-3xl mx-auto text-lg md:text-xl text-gray-400 leading-relaxed mb-10">
              Explore rare, iconic and collectible die-cast cars from the world's best brands.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-4">

              <Link
                to="/products"
                className="
                  group
                  inline-flex
                  items-center
                  justify-center
                  gap-3
                  bg-gradient-to-r
                  from-orange-500
                  to-orange-600
                  hover:from-orange-400
                  hover:to-orange-500
                  text-white
                  font-bold
                  px-9
                  py-4
                  rounded-xl
                  transition-all
                  duration-300
                  shadow-xl
                  shadow-orange-500/20
                  hover:shadow-orange-500/40
                  hover:-translate-y-1
                "
              >
                Explore Collection

                <span className="text-xl transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </Link>

              <Link
                to="/brands"
                className="
                  inline-flex
                  items-center
                  justify-center
                  px-9
                  py-4
                  rounded-xl
                  border
                  border-gray-600
                  text-gray-300
                  font-semibold
                  hover:text-white
                  hover:border-orange-500
                  hover:bg-orange-500/5
                  transition-all
                  duration-300
                "
              >
                View Brands
              </Link>

            </div>

          </div>
        </div>
      </section>


      {/* ==================== FEATURED CARS ==================== */}
      <section className="max-w-7xl mx-auto px-6 py-20">

        {/* Section Heading */}
        <div className="flex items-end justify-between mb-10">

          <div>

            <div className="flex items-center gap-4 mb-3">

              <div className="w-1.5 h-9 bg-orange-500 rounded-full" />

              <h2 className="text-4xl md:text-5xl font-extrabold text-white">
                Featured Cars
              </h2>

            </div>

            <p className="text-gray-500 text-lg ml-5">
              {isLoading ? 'Loading...' : featuredProducts.length === 0 ? 'No products available yet' : 'Handpicked premium collectibles'}
            </p>

          </div>

          <Link
            to="/products"
            className="
              hidden sm:flex
              items-center
              gap-2
              px-5
              py-3
              rounded-xl
              border
              border-gray-600
              text-gray-300
              hover:text-orange-400
              hover:border-orange-500
              transition-all
            "
          >
            View All
            <span>→</span>
          </Link>

        </div>


        {/* ==================== CAR GRID ==================== */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-gray-500">Loading featured products...</div>
          </div>
        ) : featuredProducts.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-6 opacity-40">🚗</div>
            <p className="text-gray-400 text-xl mb-6">No products available yet</p>
            <p className="text-gray-500">Products will appear here once added by the admin</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <div
                key={product.id}
                className="
                  group
                  relative
                  bg-[#09131f]
                  rounded-2xl
                  overflow-hidden
                  border
                  border-gray-800
                  hover:border-orange-500/40
                  transition-all
                  duration-300
                  hover:-translate-y-1
                  hover:shadow-2xl
                  hover:shadow-orange-500/10
                "
              >

                {/* Image */}
                <Link to={`/products/${product.id}`} className="relative aspect-square overflow-hidden bg-[#0d1826] block">
                  <img
                    src={resolveImageUrl(product.front_package_image_url)}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />

                  {/* Stock */}
                  <div className="absolute top-5 right-5">
                    {product.stock_quantity > 0 ? (
                      <div
                        className="
                          flex
                          items-center
                          gap-2
                          bg-green-500/10
                          border
                          border-green-500/30
                          text-green-400
                          px-3
                          py-2
                          rounded-full
                          text-xs
                          font-semibold
                        "
                      >
                        <span className="w-2 h-2 bg-green-400 rounded-full" />
                        In Stock
                      </div>
                    ) : (
                      <div
                        className="
                          flex
                          items-center
                          gap-2
                          bg-red-500/10
                          border
                          border-red-500/30
                          text-red-400
                          px-3
                          py-2
                          rounded-full
                          text-xs
                          font-semibold
                        "
                      >
                        Out of Stock
                      </div>
                    )}
                  </div>
                </Link>


                {/* Product Details */}
                <div className="p-6">

                  <div className="text-sm text-orange-500 font-medium mb-3">
                    {product.brand.toUpperCase()}
                    {product.series && (
                      <>
                        <span className="text-gray-600 mx-2">|</span>
                        <span className="text-gray-400">
                          {product.series.toUpperCase()}
                        </span>
                      </>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-white mb-6 line-clamp-2">
                    {product.name}
                  </h3>

                  <div className="flex items-center justify-between mb-6">
                    <span className="text-2xl font-extrabold text-white">
                      ₹{product.price.toLocaleString('en-IN')}
                    </span>

                    {product.condition && (
                      <span className="text-sm text-gray-500">
                        {product.condition}
                      </span>
                    )}
                  </div>


                  {/* Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      to={`/products/${product.id}`}
                      className="
                        flex
                        items-center
                        justify-center
                        py-3
                        px-2
                        rounded-lg
                        border
                        border-orange-500
                        text-orange-500
                        font-semibold
                        text-sm
                        hover:bg-orange-500
                        hover:text-white
                        transition-all
                      "
                    >
                      View
                    </Link>

                    <Link
                      to={`/products/${product.id}`}
                      className="
                        flex
                        items-center
                        justify-center
                        gap-1
                        py-3
                        px-2
                        rounded-lg
                        border
                        border-blue-500/60
                        text-blue-400
                        font-semibold
                        text-sm
                        hover:bg-blue-600
                        hover:text-white
                        transition-all
                        whitespace-nowrap
                      "
                    >
                      <span className="text-base">🛒</span>
                      <span className="hidden sm:inline">Add</span>
                    </Link>
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}
      </section>


      {/* ==================== BRANDS ==================== */}
      <section className="max-w-7xl mx-auto px-6 py-20">

        <div className="text-center mb-12">

          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            Shop by Brand
          </h2>

          <p className="text-gray-500 text-lg">
            Premium collections from iconic manufacturers
          </p>

        </div>


        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Hot Wheels */}
          <Link
            to="/products?brand=Hot Wheels"
            className="
              group
              relative
              overflow-hidden
              rounded-2xl
              bg-gradient-to-br
              from-red-600/10
              to-orange-600/10
              border
              border-orange-500/20
              hover:border-orange-500/60
              transition-all
              duration-300
              hover:-translate-y-1
            "
          >

            <div className="p-10 text-center">

              <div className="text-4xl mb-5">
                🔥
              </div>

              <h3 className="text-3xl font-bold text-white mb-3 group-hover:text-orange-400 transition-colors">
                Hot Wheels
              </h3>

              <p className="text-gray-500 mb-7">
                Iconic die-cast since 1968
              </p>

              <span
                className="
                  inline-flex
                  items-center
                  gap-2
                  bg-orange-500
                  hover:bg-orange-400
                  text-white
                  px-6
                  py-3
                  rounded-lg
                  font-semibold
                  transition-colors
                "
              >
                Explore Collection
                <span>→</span>
              </span>

            </div>

          </Link>


          {/* Matchbox */}
          <Link
            to="/products?brand=Matchbox"
            className="
              group
              relative
              overflow-hidden
              rounded-2xl
              bg-gradient-to-br
              from-blue-600/10
              to-cyan-600/10
              border
              border-blue-500/20
              hover:border-blue-500/60
              transition-all
              duration-300
              hover:-translate-y-1
            "
          >

            <div className="p-10 text-center">

              <div className="text-4xl mb-5">
                🚙
              </div>

              <h3 className="text-3xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">
                Matchbox
              </h3>

              <p className="text-gray-500 mb-7">
                Realistic models for collectors
              </p>

              <span
                className="
                  inline-flex
                  items-center
                  gap-2
                  bg-blue-500
                  hover:bg-blue-400
                  text-white
                  px-6
                  py-3
                  rounded-lg
                  font-semibold
                  transition-colors
                "
              >
                Explore Collection
                <span>→</span>
              </span>

            </div>

          </Link>


          {/* Premium */}
          <Link
            to="/products"
            className="
              group
              relative
              overflow-hidden
              rounded-2xl
              bg-gradient-to-br
              from-yellow-600/10
              to-amber-600/10
              border
              border-yellow-500/20
              hover:border-yellow-500/60
              transition-all
              duration-300
              hover:-translate-y-1
            "
          >

            <div className="p-10 text-center">

              <div className="text-4xl mb-5">
                ⭐
              </div>

              <h3 className="text-3xl font-bold text-white mb-3 group-hover:text-yellow-400 transition-colors">
                All Products
              </h3>

              <p className="text-gray-500 mb-7">
                Browse complete collection
              </p>

              <span
                className="
                  inline-flex
                  items-center
                  gap-2
                  bg-yellow-500
                  hover:bg-yellow-400
                  text-black
                  px-6
                  py-3
                  rounded-lg
                  font-semibold
                  transition-colors
                "
              >
                Explore Collection
                <span>→</span>
              </span>

            </div>

          </Link>

        </div>

      </section>


      {/* ==================== FINAL CTA ==================== */}
      <section className="max-w-7xl mx-auto px-6 pb-20">

        <div
          className="
            relative
            overflow-hidden
            rounded-3xl
            bg-gradient-to-r
            from-blue-700
            via-blue-600
            to-orange-600
            p-12
            md:p-20
            text-center
            shadow-2xl
          "
        >

          <div className="absolute inset-0 bg-black/20" />

          <div className="relative z-10">

            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
              Start Your Collection Today
            </h2>

            <p className="text-white/80 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
              Discover rare and premium die-cast models made for passionate collectors.
            </p>

            <Link
              to="/products"
              className="
                inline-flex
                items-center
                gap-3
                bg-white
                hover:bg-gray-100
                text-gray-900
                font-bold
                px-10
                py-4
                rounded-xl
                transition-all
                duration-300
                hover:-translate-y-1
                shadow-xl
              "
            >
              Browse Full Collection
              <span>→</span>
            </Link>

          </div>

        </div>

      </section>

    </div>
  );
};



