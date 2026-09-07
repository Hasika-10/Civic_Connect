import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMapPin, FiCamera, FiX, FiLoader, FiCheckCircle } from 'react-icons/fi';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const CATEGORIES = [
  'Pothole/Road Damage',
  'Garbage/Waste',
  'Streetlight',
  'Water Leakage',
  'Drainage/Sewage',
  'Traffic/Safety',
  'Public Property Damage',
  'Electricity',
  'Parks/Public Spaces',
  'Illegal Dumping',
  'Road Signs',
  'Other'
];

const SUB_CATEGORIES = {
  'Pothole/Road Damage': ['Small hole', 'Large pothole', 'Cracked pavement', 'Missing asphalt'],
  'Garbage/Waste': ['Litter', 'Waste heap', 'Overflowing bin', 'Illegal dumping'],
  'Streetlight': ['Broken light', 'Dim light', 'Not working', 'Missing light'],
  'Water Leakage': ['Pipe burst', 'Gutter leak', 'Valve leak', 'Flooding'],
  'Traffic/Safety': ['Pothole hazard', 'Missing sign', 'Bad signals', 'Congestion'],
  'Other': ['Other']
};

export default function ReportIssuePage() {
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    sub_category: '',
    address: '',
    landmark: '',
    latitude: null,
    longitude: null,
    city: user?.city || '',
    area: user?.area || ''
  });
  
  const [images, setImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [hasLocation, setHasLocation] = useState(false);
  
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }));
          setHasLocation(true);
        },
        (error) => {
          console.warn('Geolocation error:', error);
          toast.error('Could not get your location. Please enter manually.');
        }
      );
    }
  }, [user, navigate]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    if (images.length + files.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImages(prev => [...prev, {
          file,
          preview: event.target.result
        }]);
      };
      reader.readAsDataURL(file);
    });
  };
  
  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };
  
  const generatePreview = () => {
    if (!formData.title || !formData.description || !formData.category) {
      toast.error('Please fill in title, description, and category');
      return;
    }
    
    // Simulate AI analysis
    const mockAnalysis = {
      severity: ['medium', 'high', 'critical'][Math.floor(Math.random() * 3)],
      suggestedCategory: formData.category,
      suggestedDepartment: 'Roads & Infrastructure',
      safetyRisks: ['Potential accident hazard', 'Public health risk'],
      summary: formData.description.substring(0, 150) + '...',
      confidence: 0.89,
      priority: ['medium', 'high', 'critical'][Math.floor(Math.random() * 3)],
      estimatedResolutionHours: 72
    };
    
    setAiAnalysis(mockAnalysis);
    setShowPreview(true);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    if (!formData.latitude || !formData.longitude) {
      toast.error('Please enable location access or enter address');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('category', formData.category);
      submitData.append('sub_category', formData.sub_category);
      submitData.append('address', formData.address);
      submitData.append('landmark', formData.landmark);
      submitData.append('latitude', formData.latitude);
      submitData.append('longitude', formData.longitude);
      submitData.append('city', formData.city);
      submitData.append('area', formData.area);
      
      images.forEach(img => {
        submitData.append('images', img.file);
      });
      
      const response = await axios.post(
        `${API_BASE_URL}/complaints/submit`,
        submitData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      toast.success('Complaint submitted successfully!');
      navigate(`/citizen/complaint/${response.data.complaint.complaintId}`);
    } catch (error) {
      console.error('Submission error:', error);
      toast.error(error.response?.data?.error || 'Failed to submit complaint');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Report an Issue</h1>
          <p className="text-gray-600 text-sm mt-1">Help us improve your community</p>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Complaint Title <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., Large pothole on Main Street"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          
          {/* Description */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Description <span className="text-red-600">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe the issue in detail..."
              rows="4"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          
          {/* Category & Sub-category */}
          <div className="bg-white p-6 rounded-xl shadow-sm grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Category <span className="text-red-600">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select Category</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            {formData.category && SUB_CATEGORIES[formData.category] && (
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Sub-category
                </label>
                <select
                  name="sub_category"
                  value={formData.sub_category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Sub-category</option>
                  {SUB_CATEGORIES[formData.category].map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          
          {/* Location */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FiMapPin /> Location
            </h3>
            
            {hasLocation && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-4 flex items-center gap-2">
                <FiCheckCircle className="text-green-600" />
                <span className="text-sm text-green-700">Location detected automatically</span>
              </div>
            )}
            
            <div className="grid md:grid-cols-2 gap-4">
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Full address"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="text"
                name="landmark"
                value={formData.landmark}
                onChange={handleInputChange}
                placeholder="Nearby landmark"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {formData.latitude && formData.longitude && (
              <div className="mt-3 text-xs text-gray-600 bg-gray-50 p-3 rounded">
                Coordinates: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
              </div>
            )}
          </div>
          
          {/* Image Upload */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FiCamera /> Upload Photos
            </h3>
            
            {/* Drag & Drop Area */}
            <label className="block border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <div className="text-gray-600">
                <FiCamera className="w-8 h-8 mx-auto mb-2" />
                <p className="font-medium">Drop images here or click to upload</p>
                <p className="text-sm text-gray-500 mt-1">Maximum 5 images (JPG, PNG)</p>
              </div>
            </label>
            
            {/* Image Preview */}
            {images.length > 0 && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <img src={img.preview} alt={`Preview ${idx}`} className="w-full h-24 object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                    >
                      <FiX />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Preview Button */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={generatePreview}
              className="flex-1 px-6 py-3 border-2 border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition"
            >
              Preview AI Analysis
            </button>
          </div>
          
          {/* AI Analysis Preview */}
          {showPreview && aiAnalysis && (
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-xl border-2 border-blue-300">
              <h3 className="font-bold text-lg text-gray-900 mb-4">AI Analysis Preview</h3>
              
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-xs text-gray-600 uppercase font-semibold">Suggested Category</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">{aiAnalysis.suggestedCategory}</p>
                </div>
                
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-xs text-gray-600 uppercase font-semibold">Priority</p>
                  <p className={`text-lg font-bold mt-1 ${
                    aiAnalysis.priority === 'critical' ? 'text-red-600' :
                    aiAnalysis.priority === 'high' ? 'text-orange-600' :
                    aiAnalysis.priority === 'medium' ? 'text-yellow-600' :
                    'text-blue-600'
                  }`}>{aiAnalysis.priority.toUpperCase()}</p>
                </div>
                
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-xs text-gray-600 uppercase font-semibold">Estimated Resolution</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">{aiAnalysis.estimatedResolutionHours}h</p>
                </div>
                
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-xs text-gray-600 uppercase font-semibold">Confidence</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">{Math.round(aiAnalysis.confidence * 100)}%</p>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg">
                <p className="text-xs text-gray-600 uppercase font-semibold mb-2">Safety Risks</p>
                <ul className="space-y-1">
                  {aiAnalysis.safetyRisks.map((risk, idx) => (
                    <li key={idx} className="text-sm text-gray-700 flex gap-2">
                      <span className="text-red-600">•</span> {risk}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          
          {/* Submit Button */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <FiLoader className="animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  <FiCheckCircle /> Submit Complaint
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
