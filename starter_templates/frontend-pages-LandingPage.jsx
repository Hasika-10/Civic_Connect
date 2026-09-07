import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiCheck, FiMap, FiBarChart3, FiBell, FiShield, FiZap, FiUsers } from 'react-icons/fi';
import { FaMapMarkerAlt, FaCheckCircle, FaClipboardList, FaLeaf, FaTwitter, FaFacebook, FaLinkedin } from 'react-icons/fa';

export default function LandingPage() {
  const [email, setEmail] = useState('');
  
  const stats = [
    { label: 'Total Complaints', value: '2,847', color: 'bg-blue-50' },
    { label: 'Resolved Issues', value: '2,156', color: 'bg-green-50' },
    { label: 'Pending Cases', value: '691', color: 'bg-yellow-50' },
    { label: 'Avg Resolution', value: '3.2 days', color: 'bg-purple-50' }
  ];
  
  const features = [
    { icon: FiZap, title: 'AI-Powered Analysis', desc: 'Instant categorization and priority assessment' },
    { icon: FiMap, title: 'Smart Mapping', desc: 'Track issues on interactive maps with heatmaps' },
    { icon: FiBell, title: 'Real-Time Updates', desc: 'Get instant notifications on progress' },
    { icon: FiShield, title: 'Secure & Private', desc: 'Military-grade encryption for all data' },
    { icon: FiBarChart3, title: 'Analytics', desc: 'Comprehensive insights for authorities' },
    { icon: FiUsers, title: 'Community Powered', desc: 'Citizen-driven civic improvement' }
  ];
  
  const steps = [
    { num: 1, title: 'Report', desc: 'Submit issue with photo and location' },
    { num: 2, title: 'AI Analysis', desc: 'System auto-categorizes and prioritizes' },
    { num: 3, title: 'Assign', desc: 'Routes to right department automatically' },
    { num: 4, title: 'Resolve', desc: 'Authority works on solution transparently' },
    { num: 5, title: 'Feedback', desc: 'Citizen verifies resolution and rates' }
  ];
  
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                CC
              </div>
              <span className="font-bold text-xl text-gray-900">CivicConnect</span>
            </div>
            
            <div className="hidden md:flex gap-8">
              <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition">How It Works</a>
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition">Features</a>
              <a href="#impact" className="text-gray-600 hover:text-gray-900 transition">Impact</a>
              <a href="#about" className="text-gray-600 hover:text-gray-900 transition">About</a>
            </div>
            
            <div className="flex gap-3">
              <Link to="/login" className="px-4 py-2 text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition">
                Login
              </Link>
              <Link to="/register" className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition">
                Register
              </Link>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Report. Track. <span className="text-blue-600">Resolve.</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            CivicConnect uses AI to bridge the gap between citizens and authorities. Report public issues, track progress in real-time, and see your city improve.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              to="/citizen/report-issue"
              className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
            >
              Report an Issue <FiArrowRight />
            </Link>
            <Link
              to="/public-portal"
              className="px-8 py-3 border-2 border-blue-600 text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition"
            >
              Explore Dashboard
            </Link>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <div key={i} className={`${stat.color} p-6 rounded-xl`}>
                <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-600 mt-2">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900">How It Works</h2>
            <p className="text-gray-600 mt-4 text-lg">Simple 5-step process for faster civic improvements</p>
          </div>
          
          <div className="grid md:grid-cols-5 gap-4">
            {steps.map((step, i) => (
              <div key={i} className="relative">
                <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mb-4 mx-auto">
                  {step.num}
                </div>
                <h3 className="font-bold text-lg text-center mb-2">{step.title}</h3>
                <p className="text-gray-600 text-center text-sm">{step.desc}</p>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-6 -right-2 w-4 h-0.5 bg-blue-300"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Features */}
      <section id="features" className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900">Powerful Features</h2>
            <p className="text-gray-600 mt-4 text-lg">Everything needed for smarter civic management</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div key={i} className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition">
                  <Icon className="w-12 h-12 text-blue-600 mb-4" />
                  <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      
      {/* Community Impact */}
      <section id="impact" className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900">Community Impact</h2>
            <p className="text-gray-600 mt-4 text-lg">Making cities better together</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-xl">
              <FaMapMarkerAlt className="w-8 h-8 text-blue-600 mb-4" />
              <h3 className="font-bold text-lg mb-2">Instant Reporting</h3>
              <p className="text-gray-700">Citizens can report issues from anywhere with GPS location and photos</p>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-xl">
              <FaCheckCircle className="w-8 h-8 text-green-600 mb-4" />
              <h3 className="font-bold text-lg mb-2">Faster Resolution</h3>
              <p className="text-gray-700">AI prioritization and auto-assignment cuts resolution time by 40%</p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-8 rounded-xl">
              <FaClipboardList className="w-8 h-8 text-purple-600 mb-4" />
              <h3 className="font-bold text-lg mb-2">Full Transparency</h3>
              <p className="text-gray-700">Real-time tracking and public portal keep everyone informed</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Make a Difference?</h2>
          <p className="text-xl mb-8 opacity-90">Join thousands of citizens improving their communities</p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="px-8 py-3 bg-white text-blue-600 font-bold rounded-lg hover:bg-gray-100 transition"
            >
              Get Started
            </Link>
            <a
              href="#"
              className="px-8 py-3 border-2 border-white text-white font-bold rounded-lg hover:bg-white hover:text-blue-600 transition"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded text-white flex items-center justify-center font-bold">
                  CC
                </div>
                <span className="font-bold">CivicConnect</span>
              </div>
              <p className="text-sm">Making cities smarter through AI-powered civic engagement.</p>
            </div>
            
            <div>
              <h4 className="font-bold mb-4 text-white">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Features</a></li>
                <li><a href="#" className="hover:text-white transition">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition">Security</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4 text-white">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4 text-white">Follow</h4>
              <div className="flex gap-4">
                <a href="#" className="text-gray-400 hover:text-white transition"><FaTwitter /></a>
                <a href="#" className="text-gray-400 hover:text-white transition"><FaFacebook /></a>
                <a href="#" className="text-gray-400 hover:text-white transition"><FaLinkedin /></a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm">
            <p>&copy; 2026 CivicConnect. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-white transition">Privacy Policy</a>
              <a href="#" className="hover:text-white transition">Terms of Service</a>
              <a href="#" className="hover:text-white transition">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
