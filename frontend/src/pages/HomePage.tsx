import React from 'react';
import { Link } from 'react-router-dom';

export const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-navy-900 to-black">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-orange-600/10"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-600/20 rounded-full blur-3xl"></div>
        
        <div className="relative container mx-auto px-6 py-24 lg:py-32">
          <div className="max-w-4xl mx-auto text-center">
            {/* Main Headline */}
            <div className="mb-6">
              <h1 className="text-6xl md:text-8xl font-display font-extrabold mb-4 leading-tight">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600">
                  Collect.
                </span>
                <br />
                <span className="text-white">Display.</span>
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700">
                  Own.
                </span>
              </h1>
            </div>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-12 font-light">
              Discover premium die-cast cars made for collectors.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/products"
                className="group relative inline-block bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold px-10 py-4 rounded-xl transition-all duration-300 shadow-2xl hover:shadow-blue-500/50 hover:scale-105"
              >
                <span className="relative z-10">Explore Collection</span>
              </Link>
              <Link
                to="/brands"
                className="inline-block bg-transparent border-2 border-gray-600 hover:border-blue-500 hover:bg-blue-500/10 text-gray-300 hover:text-white font-semibold px-10 py-4 rounded-xl transition-all duration-300"
              >
                View Brands
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Cars Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Featured Cars</h2>
          <p className="text-gray-400 text-lg">Handpicked premium collectibles</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="group bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl overflow-hidden border border-gray-700/50 hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20">
              <div className="aspect-square bg-gray-800 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                <div className="absolute top-4 right-4 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                  HOT
                </div>
              </div>
              <div className="p-5">
                <div className="text-xs text-blue-400 font-semibold mb-2">HOT WHEELS • MAINLINE</div>
                <h3 className="text-white font-semibold mb-3 group-hover:text-blue-400 transition-colors">Premium Model Car</h3>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-white">₹299</span>
                  <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all">
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* New Arrivals Section */}
      <div className="bg-gradient-to-b from-transparent to-gray-900/50 py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">New Arrivals</h2>
            <p className="text-gray-400 text-lg">Fresh stock just landed</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl p-4 border border-gray-700/50 hover:border-blue-500/50 transition-all hover:scale-105">
                <div className="aspect-square bg-gray-800 rounded-lg mb-3"></div>
                <div className="text-xs text-blue-400 font-semibold mb-1">MATCHBOX</div>
                <div className="text-white text-sm font-semibold mb-2">New Model</div>
                <div className="text-white font-bold">₹199</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Brands Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Shop by Brand</h2>
          <p className="text-gray-400 text-lg">Premium collections from iconic manufacturers</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Hot Wheels */}
          <Link to="/brands/hot-wheels" className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-600/20 to-orange-600/20 border border-orange-500/30 hover:border-orange-500 transition-all duration-300 hover:scale-105">
            <div className="p-10 text-center">
              <h3 className="text-3xl font-bold text-white mb-4 group-hover:text-orange-400 transition-colors">Hot Wheels</h3>
              <p className="text-gray-400 mb-6">Iconic die-cast since 1968</p>
              <div className="inline-block bg-orange-500 hover:bg-orange-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                Explore Collection
              </div>
            </div>
          </Link>

          {/* Matchbox */}
          <Link to="/brands/matchbox" className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-blue-500/30 hover:border-blue-500 transition-all duration-300 hover:scale-105">
            <div className="p-10 text-center">
              <h3 className="text-3xl font-bold text-white mb-4 group-hover:text-blue-400 transition-colors">Matchbox</h3>
              <p className="text-gray-400 mb-6">Realistic models for collectors</p>
              <div className="inline-block bg-blue-500 hover:bg-blue-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                Explore Collection
              </div>
            </div>
          </Link>

          {/* Premium Collectibles */}
          <Link to="/brands/premium" className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-600/20 to-amber-600/20 border border-yellow-500/30 hover:border-yellow-500 transition-all duration-300 hover:scale-105">
            <div className="p-10 text-center">
              <h3 className="text-3xl font-bold text-white mb-4 group-hover:text-yellow-400 transition-colors">Premium</h3>
              <p className="text-gray-400 mb-6">Limited editions & exclusives</p>
              <div className="inline-block bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-3 rounded-lg font-semibold transition-colors">
                Explore Collection
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Final CTA */}
      <div className="container mx-auto px-6 py-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-blue-700 to-orange-600 p-12 md:p-20 text-center shadow-2xl">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Start Your Collection Today
            </h2>
            <p className="text-white/90 text-xl mb-10 max-w-2xl mx-auto">
              Join collectors worldwide in discovering rare and premium die-cast models
            </p>
            <Link
              to="/products"
              className="inline-block bg-white hover:bg-gray-100 text-navy-900 font-bold px-12 py-4 rounded-xl transition-all duration-300 hover:scale-105 shadow-2xl"
            >
              Browse Full Collection
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
