import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiArrowRight,
  HiChevronLeft,
  HiChevronRight,
  HiPlay,
  HiChat,
  HiMicrophone,
  HiPhotograph,
  HiTranslate,
  HiBell
} from 'react-icons/hi';

const Landing = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [progressWidth, setProgressWidth] = useState(0);
  const progressRef = useRef(null);

  const stats = [
    { value: '565K+', label: 'Users across India, Kenya, Ethiopia, and Nigeria' },
    { value: '5M+', label: 'Queries resolved across 4 countries' },
    { value: '73%', label: 'accessing digital advisory for the first time' }
  ];

  const features = [
    {
      icon: HiMicrophone,
      title: 'Voice & Text Chat',
      description: 'Ask questions using text or voice in your preferred language and get instant AI-powered responses.',
      color: 'from-green-500 to-emerald-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: HiTranslate,
      title: 'Multi-Language Support',
      description: 'Get farming advice in Hindi, Telugu, Tamil, Kannada, Marathi and 10+ regional languages.',
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: HiPhotograph,
      title: 'Disease Detection',
      description: 'Simply take a photo of your crop and get instant AI diagnosis with treatment recommendations.',
      color: 'from-red-500 to-rose-600',
      bgColor: 'bg-red-50'
    },
    {
      icon: HiBell,
      title: 'Smart Alerts',
      description: 'Receive timely notifications for weather forecasts, market prices, and best farming practices.',
      color: 'from-amber-500 to-orange-600',
      bgColor: 'bg-amber-50'
    }
  ];

  const testimonials = [
    {
      image: 'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=300&h=300&fit=crop&crop=face',
      quote: "AgriBot helped me identify the exact fertilizer my wheat crop needed. My yield increased by 30% this season!",
      name: 'Rajendra Singh',
      location: 'Wheat Farmer, Haryana'
    },
    {
      image: 'https://images.unsplash.com/photo-1592878849122-facb97520f9e?w=300&h=300&fit=crop&crop=face',
      quote: 'The disease detection feature saved my entire rice paddy. I got instant diagnosis and treatment advice.',
      name: 'Venkat Rao',
      location: 'Rice Farmer, Tamil Nadu'
    },
    {
      image: 'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=300&h=300&fit=crop&crop=face',
      quote: 'Market price alerts help me sell at the right time. I earned 25% more profit on my cotton crop!',
      name: 'Mohammed Ismail',
      location: 'Cotton Farmer, Maharashtra'
    }
  ];

  const partners = [
    { name: 'Microsoft', logo: '/images/landing/Microsoft.png' },
    { name: 'Google', logo: '/images/landing/Google.webp' },
    { name: 'OpenAI', logo: '/images/landing/OpenAI.png' },
    { name: 'Meta', logo: '/images/landing/META.png' },
    { name: 'World Bank', logo: '/images/landing/World-Bank.png' },
    { name: 'CGIAR', logo: '/images/landing/CGIAR.png' }
  ];

  // Auto-advance testimonials
  useEffect(() => {
    const duration = 5800;
    let elapsed = 0;

    const progressInterval = setInterval(() => {
      elapsed += 60;
      setProgressWidth(Math.min((elapsed / duration) * 100, 100));
    }, 60);

    const timer = setTimeout(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
      setProgressWidth(0);
    }, duration);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [currentTestimonial, testimonials.length]);

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    setProgressWidth(0);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    setProgressWidth(0);
  };

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1ca069] to-[#22c55e] flex items-center justify-center">
                <span className="text-xl font-bold text-white">A</span>
              </div>
              <span className="text-xl font-bold text-gray-900">AgriBot</span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-[#1ca069] transition-colors">Features</a>
              <a href="#testimonials" className="text-gray-600 hover:text-[#1ca069] transition-colors">Stories</a>
              <a href="#partners" className="text-gray-600 hover:text-[#1ca069] transition-colors">Partners</a>
            </nav>
            <Link
              to="/login"
              className="px-5 py-2.5 bg-[#1ca069] text-white rounded-full font-medium hover:bg-[#169456] transition-colors flex items-center gap-2"
            >
              Get Started
              <HiArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section - Full Screen with Background Image */}
      <section
        className="relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-center text-center pt-16"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1634752309905-6cb91bc78cf0?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Zm9ybWVyfGVufDB8fDB8fHww')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-white/50 to-white/0 z-0" />

        <div className="relative z-10 px-4">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight drop-shadow-lg"
          >
            AgriBot: AI Assistant <br /> for Agriculture
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg sm:text-xl md:text-2xl text-white mt-4 drop-shadow-lg"
          >
            Helping farmers thrive with real-time insights and support
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to="/login"
              className="cta-glow text-[#1ca069] text-lg hover:text-white bg-white hover:bg-[#1ca069] rounded-full px-6 py-3 font-semibold transition-all duration-300 flex items-center gap-2"
            >
              Start Using AgriBot
              <HiArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>

          {/* Phone Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-12 -mb-32 sm:-mb-48 md:-mb-64"
          >
            {/* Single Phone with Chat Preview */}
            <div className="relative mx-auto w-64 sm:w-72 md:w-80">
              <div className="bg-gray-900 rounded-[2.5rem] p-2 shadow-2xl">
                <div className="bg-white rounded-[2rem] overflow-hidden">
                  {/* App Header */}
                  <div className="bg-gradient-to-r from-[#1ca069] to-[#22c55e] p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <HiChat className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-white text-left">
                      <p className="font-semibold">AgriBot</p>
                      <p className="text-xs text-white/80">Online</p>
                    </div>
                  </div>
                  {/* Chat Messages */}
                  <div className="p-4 space-y-3 bg-gray-50 min-h-[280px]">
                    <div className="bg-white rounded-2xl rounded-tl-sm p-3 shadow-sm max-w-[85%]">
                      <p className="text-sm text-gray-800">Hello! I'm AgriBot. How can I help you today?</p>
                    </div>
                    <div className="bg-[#1ca069] rounded-2xl rounded-tr-sm p-3 shadow-sm max-w-[85%] ml-auto">
                      <p className="text-sm text-white">My tomato leaves are turning yellow</p>
                    </div>
                    <div className="bg-white rounded-2xl rounded-tl-sm p-3 shadow-sm max-w-[85%]">
                      <p className="text-sm text-gray-800">This could be nitrogen deficiency. Try applying urea at 25g per plant. Would you like more details?</p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Floating Badges */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -left-16 top-16 hidden sm:flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-lg"
              >
                <span className="text-2xl">🌾</span>
                <span className="text-sm font-medium text-gray-700">Crop Expert</span>
              </motion.div>
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                className="absolute -right-16 bottom-32 hidden sm:flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-lg"
              >
                <span className="text-2xl">🌤️</span>
                <span className="text-sm font-medium text-gray-700">Weather Alerts</span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Partners Marquee */}
      <section id="partners" className="bg-white py-10 overflow-hidden">
        <div className="text-center text-xl sm:text-2xl text-gray-600 mb-6">
          <h2>Partners Enabling Our Impact</h2>
        </div>
        <div className="relative">
          <div className="flex animate-marquee">
            {[...partners, ...partners].map((partner, index) => (
              <div key={index} className="flex-shrink-0 mx-4 sm:mx-8">
                <div className="bg-white p-3 sm:p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                  <img
                    src={partner.logo}
                    alt={partner.name}
                    className="h-10 sm:h-14 w-auto object-contain"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bento Grid Section */}
      <section className="bg-gray-50 py-10 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* About Block */}
            <div className="lg:row-span-2 bg-[#299261] rounded-2xl p-6 sm:p-8 text-white flex flex-col">
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">About AgriBot</h2>
              <p className="text-white/90 mb-4 leading-relaxed">
                AgriBot is a conversational, AI-based agricultural companion designed for smallholder farmers.
                Our AI agent provides contextualized, accurate responses, empowering farmers to make smarter decisions faster.
              </p>
              <p className="text-white/90 mb-6 leading-relaxed">
                Whether you need help with crop diseases, weather forecasts, market prices, or farming best practices,
                AgriBot is here to help you 24/7 in your local language.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 bg-white text-[#299261] font-semibold px-6 py-3 rounded-full hover:bg-gray-100 transition-colors w-fit"
              >
                Get Started
                <HiArrowRight className="w-5 h-5" />
              </Link>
            </div>

            {/* Video/Image Block */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm min-h-[220px]">
              <div className="w-full h-full bg-gradient-to-br from-[#1ca069] to-[#22c55e] flex items-center justify-center p-8">
                <div className="text-center text-white">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <HiPlay className="w-8 h-8" />
                  </div>
                  <p className="font-semibold">Watch Demo Video</p>
                </div>
              </div>
            </div>

            {/* Stats Block */}
            <div className="bg-[#30572A]/10 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              {stats.map((stat, index) => (
                <div key={index} className="flex-1 text-center min-w-[100px]">
                  <h3 className="text-3xl sm:text-4xl font-bold text-[#1f5b32]">{stat.value}</h3>
                  <p className="text-sm text-gray-700 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-gray-50 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-sm text-gray-500 uppercase tracking-wide mb-2">AI Assistant for Agriculture</p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Features Farmers Love</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className={`${feature.bgColor} rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300`}
              >
                <div className="p-6 sm:p-8 text-center">
                  <div className={`w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-lg`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* App Features Section */}
      <section className="bg-white py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4">
          {/* Feature 1 */}
          <div className="flex flex-col md:flex-row items-center gap-10 mb-14">
            <div className="md:w-1/2 w-full">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative rounded-2xl overflow-hidden shadow-xl"
              >
                <img
                  src="https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600&q=80"
                  alt="Farmer using smartphone"
                  className="w-full h-auto hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </motion.div>
            </div>
            <div className="md:w-1/2 w-full">
              <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-4">
                Smart Technology
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                Technology that understands farming
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                AgriBot integrates real-time weather data, soil conditions, and crop calendars to provide
                personalized advice. Make smarter decisions about planting, irrigation, fertilization,
                and harvesting.
              </p>
              <ul className="space-y-2">
                {['Real-time weather integration', 'Crop-specific recommendations', 'Market price tracking'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-600">
                    <span className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="flex flex-col md:flex-row-reverse items-center gap-10">
            <div className="md:w-1/2 w-full">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative rounded-2xl overflow-hidden shadow-xl"
              >
                <img
                  src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600&q=80"
                  alt="Farmers in field"
                  className="w-full h-auto hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </motion.div>
            </div>
            <div className="md:w-1/2 w-full">
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4">
                Community
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                Join a community of smart farmers
              </h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Connect with agricultural experts, research institutions, and fellow farmers. Share experiences,
                learn best practices, and grow together. AgriBot brings the farming community closer.
              </p>
              <ul className="space-y-2">
                {['Expert-verified information', 'Peer-to-peer learning', 'Government scheme updates'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-600">
                    <span className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="bg-gray-50 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-lg sm:text-xl font-bold mb-2 text-gray-600">Voices from the Field</p>
            <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900">Success Stories & Testimonials</h2>
          </div>

          <div className="relative max-w-3xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTestimonial}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.4 }}
                className="bg-white rounded-3xl p-6 sm:p-10 shadow-lg"
              >
                <div className="flex flex-col items-center text-center">
                  <img
                    src={testimonials[currentTestimonial].image}
                    alt={testimonials[currentTestimonial].name}
                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover mb-6 shadow-md"
                  />
                  <svg className="h-8 w-8 text-[#1ca069] mb-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/>
                  </svg>
                  <p className="text-lg sm:text-xl text-gray-700 mb-6 italic leading-relaxed">
                    "{testimonials[currentTestimonial].quote}"
                  </p>
                  <p className="font-semibold text-gray-900 text-lg">{testimonials[currentTestimonial].name}</p>
                  <p className="text-gray-500">{testimonials[currentTestimonial].location}</p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Progress Bar */}
            <div className="relative w-full h-1 bg-gray-200 rounded-full mt-6 mb-4 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#10b981] to-[#059669] rounded-full transition-all duration-100"
                style={{ width: `${progressWidth}%` }}
              />
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={prevTestimonial}
                className="w-11 h-11 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-[#1ca069] hover:text-white transition-all duration-300 hover:scale-110"
              >
                <HiChevronLeft className="w-6 h-6" />
              </button>
              <div className="flex gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentTestimonial(index);
                      setProgressWidth(0);
                    }}
                    className={`h-3 rounded-full transition-all duration-300 ${
                      index === currentTestimonial
                        ? 'w-7 bg-gradient-to-r from-[#10b981] to-[#059669]'
                        : 'w-3 bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={nextTestimonial}
                className="w-11 h-11 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-[#1ca069] hover:text-white transition-all duration-300 hover:scale-110"
              >
                <HiChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-[#1ca069] to-[#22c55e] py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Transform Your Farming?
            </h2>
            <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
              Join thousands of farmers who are already using AgriBot to grow healthier crops and increase their yields.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-8 sm:px-10 py-4 bg-white text-[#1ca069] rounded-full font-semibold text-lg hover:bg-gray-100 transition-colors shadow-lg"
            >
              Get Started for Free
              <HiArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#1ca069] flex items-center justify-center">
                  <span className="text-xl font-bold text-white">A</span>
                </div>
                <span className="text-xl font-bold text-white">AgriBot</span>
              </div>
              <p className="text-sm">Empowering farmers with AI-powered agricultural solutions.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Explore</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-[#1ca069] transition-colors">Features</a></li>
                <li><a href="#testimonials" className="hover:text-[#1ca069] transition-colors">Stories</a></li>
                <li><a href="#partners" className="hover:text-[#1ca069] transition-colors">Partners</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-[#1ca069] transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-[#1ca069] transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-[#1ca069] transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-[#1ca069] transition-colors">Terms & Conditions</a></li>
                <li><a href="#" className="hover:text-[#1ca069] transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2024 AgriBot. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Custom Styles */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        .cta-glow {
          box-shadow: 0 0 0 0 rgba(28, 160, 105, 0.4);
          animation: glow-bounce 2s infinite alternate;
        }
        @keyframes glow-bounce {
          0% { box-shadow: 0 0 0 0 rgba(28, 160, 105, 0.4); }
          100% { box-shadow: 0 0 24px 8px rgba(28, 160, 105, 0.6); }
        }
      `}</style>
    </div>
  );
};

export default Landing;
